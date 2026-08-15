/**
 * Pushes seed/ingredients.json and seed/recipes.json onto a database that already has plans.
 *
 * Upserts by slug (categories by name) and rewrites ingredient lines in place, so recipe IDs
 * stay put and historic plan_slots keep pointing at the same meals. Never truncates, never
 * deletes recipes or ingredients, never writes plans / plan_slots / shopping_list_items.
 *
 * Default is a dry-run. Pass --apply to write. Requires DATABASE_URL: local PGlite still
 * uses the destructive `npm run seed`.
 */
import { readFileSync } from 'node:fs';
import { count, eq, inArray } from 'drizzle-orm';
import { getDb, type Db } from '../db/index';
import {
  categories,
  ingredientAliases,
  ingredients,
  planSlots,
  recipeIngredients,
  recipes,
  unitEnum,
} from '../db/schema';

type Unit = (typeof unitEnum.enumValues)[number];

type SeedIngredients = {
  categories: { name: string; order: number }[];
  ingredients: {
    slug: string;
    name: string;
    category: string;
    frozen: boolean;
    pantryStaple: boolean;
    aliases: string[];
    packSize: number | null;
    packUnit: Unit | null;
  }[];
};

type SeedRecipe = {
  slug: string;
  name: string;
  servings: number;
  vegetarian: boolean;
  keto: boolean;
  archived: boolean;
  timeHours: number | null;
  sourceUrl: string | null;
  method: string | null;
  ingredients: { ingredient: string; amount: number | null; unit: Unit | null }[];
};

type SeedLine = SeedRecipe['ingredients'][number];

type LiveLine = { slug: string; amount: number | null; unit: Unit | null };

type LiveCategory = { id: number; name: string; position: number };

type LiveIngredient = {
  id: number;
  slug: string;
  name: string;
  category: string;
  frozen: boolean;
  pantryStaple: boolean;
  packSize: string | null;
  packUnit: Unit | null;
  aliases: string[];
};

type LiveRecipe = {
  id: number;
  slug: string;
  name: string;
  servings: number;
  vegetarian: boolean;
  keto: boolean;
  archived: boolean;
  timeHours: string | null;
  sourceUrl: string | null;
  method: string | null;
  lines: LiveLine[];
};

type Change = { key: string; label: string; diffs: string[] };

type SyncPlan = {
  categories: { added: string[]; changed: Change[]; leftover: string[] };
  ingredients: { added: string[]; changed: Change[]; leftover: string[] };
  recipes: { added: string[]; changed: Change[]; leftover: string[] };
};

const UNITS = new Set<string>(unitEnum.enumValues);

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as T;
}

function numeric(value: number | null): string | null {
  return value === null ? null : String(value);
}

function checkUnit(unit: string | null, where: string): Unit | null {
  if (unit === null) return null;
  if (!UNITS.has(unit)) throw new Error(`Unknown unit ${unit} in ${where}`);
  return unit as Unit;
}

function sameNum(a: number | string | null | undefined, b: number | string | null | undefined): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Number(a) === Number(b);
}

function fmtQty(amount: number | null, unit: Unit | null): string {
  if (amount === null && unit === null) return 'some';
  if (amount === null) return `some ${unit}`;
  if (unit === null) return String(amount);
  return `${amount} ${unit}`;
}

function fmtLine(line: { slug?: string; ingredient?: string; amount: number | null; unit: Unit | null }): string {
  return `${line.slug ?? line.ingredient}: ${fmtQty(line.amount, line.unit)}`;
}

function sorted(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b, 'en-GB'));
}

function nameFrozenKey(name: string, frozen: boolean): string {
  return `${name}\0${frozen ? '1' : '0'}`;
}

function lineSignature(lines: { slug?: string; ingredient?: string; amount: number | null; unit: Unit | null }[]): string {
  return JSON.stringify(
    lines.map((line) => [line.slug ?? line.ingredient, line.amount, line.unit]),
  );
}

function lineDiffs(live: LiveLine[], seed: SeedLine[]): string[] {
  const diffs: string[] = [];
  const max = Math.max(seed.length, live.length);
  for (let i = 0; i < max; i++) {
    const from = live[i];
    const to = seed[i];
    if (!from) diffs.push(`+ [${i}] ${fmtLine(to)}`);
    else if (!to) diffs.push(`- [${i}] ${fmtLine(from)}`);
    else if (from.slug !== to.ingredient || !sameNum(from.amount, to.amount) || from.unit !== to.unit) {
      diffs.push(`~ [${i}] ${fmtLine(from)}  ->  ${fmtLine(to)}`);
    }
  }
  return diffs;
}

async function slotCount(db: Db): Promise<number> {
  const [row] = await db.select({ value: count() }).from(planSlots);
  return Number(row.value);
}

async function loadLive(db: Db): Promise<{
  categories: LiveCategory[];
  ingredients: LiveIngredient[];
  recipes: LiveRecipe[];
}> {
  const [categoryRows, ingredientRows, aliasRows, recipeRows, lineRows] = await Promise.all([
    db.select().from(categories),
    db.select().from(ingredients),
    db.select().from(ingredientAliases),
    db.select().from(recipes),
    db
      .select({
        recipeId: recipeIngredients.recipeId,
        amount: recipeIngredients.amount,
        unit: recipeIngredients.unit,
        position: recipeIngredients.position,
        slug: ingredients.slug,
      })
      .from(recipeIngredients)
      .innerJoin(ingredients, eq(ingredients.id, recipeIngredients.ingredientId)),
  ]);

  const categoryById = new Map(categoryRows.map((row) => [row.id, row.name]));
  const aliasesByIngredient = new Map<number, string[]>();
  for (const row of aliasRows) {
    const list = aliasesByIngredient.get(row.ingredientId) ?? [];
    list.push(row.alias);
    aliasesByIngredient.set(row.ingredientId, list);
  }

  const linesByRecipe = new Map<number, LiveLine[]>();
  const positioned = [...lineRows].sort((a, b) => a.recipeId - b.recipeId || a.position - b.position);
  for (const line of positioned) {
    const list = linesByRecipe.get(line.recipeId) ?? [];
    list.push({
      slug: line.slug,
      amount: line.amount === null ? null : Number(line.amount),
      unit: line.unit,
    });
    linesByRecipe.set(line.recipeId, list);
  }

  return {
    categories: categoryRows.map((row) => ({ id: row.id, name: row.name, position: row.position })),
    ingredients: ingredientRows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: categoryById.get(row.categoryId) ?? '',
      frozen: row.frozen,
      pantryStaple: row.pantryStaple,
      packSize: row.packSize,
      packUnit: row.packUnit,
      aliases: aliasesByIngredient.get(row.id) ?? [],
    })),
    recipes: recipeRows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      servings: row.servings,
      vegetarian: row.vegetarian,
      keto: row.keto,
      archived: row.archived,
      timeHours: row.timeHours,
      sourceUrl: row.sourceUrl,
      method: row.method,
      lines: linesByRecipe.get(row.id) ?? [],
    })),
  };
}

function buildPlan(
  source: SeedIngredients,
  recipeSource: SeedRecipe[],
  live: Awaited<ReturnType<typeof loadLive>>,
): SyncPlan {
  const liveCategory = new Map(live.categories.map((row) => [row.name, row]));
  const liveIngredient = new Map(live.ingredients.map((row) => [row.slug, row]));
  const liveRecipe = new Map(live.recipes.map((row) => [row.slug, row]));
  const seedCategoryNames = new Set(source.categories.map((row) => row.name));
  const seedIngredientSlugs = new Set(source.ingredients.map((row) => row.slug));
  const seedRecipeSlugs = new Set(recipeSource.map((row) => row.slug));

  const categoryPlan: SyncPlan['categories'] = { added: [], changed: [], leftover: [] };
  for (const category of source.categories) {
    const existing = liveCategory.get(category.name);
    if (!existing) {
      categoryPlan.added.push(`${category.name} (position ${category.order})`);
      continue;
    }
    if (existing.position !== category.order) {
      categoryPlan.changed.push({
        key: category.name,
        label: category.name,
        diffs: [`position: ${existing.position} -> ${category.order}`],
      });
    }
  }
  for (const row of live.categories) {
    if (!seedCategoryNames.has(row.name)) categoryPlan.leftover.push(row.name);
  }

  const ingredientPlan: SyncPlan['ingredients'] = { added: [], changed: [], leftover: [] };
  for (const ingredient of source.ingredients) {
    checkUnit(ingredient.packUnit, ingredient.slug);
    const existing = liveIngredient.get(ingredient.slug);
    if (!existing) {
      ingredientPlan.added.push(
        `${ingredient.slug}  name=${ingredient.name}  category=${ingredient.category}  frozen=${ingredient.frozen}`,
      );
      continue;
    }
    const diffs: string[] = [];
    if (existing.name !== ingredient.name) {
      diffs.push(`name: ${JSON.stringify(existing.name)} -> ${JSON.stringify(ingredient.name)}`);
    }
    if (existing.category !== ingredient.category) {
      diffs.push(`category: ${existing.category} -> ${ingredient.category}`);
    }
    if (existing.frozen !== ingredient.frozen) diffs.push(`frozen: ${existing.frozen} -> ${ingredient.frozen}`);
    if (existing.pantryStaple !== ingredient.pantryStaple) {
      diffs.push(`pantryStaple: ${existing.pantryStaple} -> ${ingredient.pantryStaple}`);
    }
    if (!sameNum(existing.packSize, ingredient.packSize)) {
      diffs.push(`packSize: ${existing.packSize} -> ${ingredient.packSize}`);
    }
    if (existing.packUnit !== ingredient.packUnit) {
      diffs.push(`packUnit: ${existing.packUnit} -> ${ingredient.packUnit}`);
    }
    const fromAliases = sorted(existing.aliases);
    const toAliases = sorted(ingredient.aliases);
    if (JSON.stringify(fromAliases) !== JSON.stringify(toAliases)) {
      diffs.push(`aliases: [${fromAliases.join(', ')}] -> [${toAliases.join(', ')}]`);
    }
    if (diffs.length) ingredientPlan.changed.push({ key: ingredient.slug, label: ingredient.slug, diffs });
  }
  for (const row of live.ingredients) {
    if (!seedIngredientSlugs.has(row.slug)) ingredientPlan.leftover.push(row.slug);
  }

  const recipePlan: SyncPlan['recipes'] = { added: [], changed: [], leftover: [] };
  for (const recipe of recipeSource) {
    for (const line of recipe.ingredients) {
      checkUnit(line.unit, `${recipe.slug}/${line.ingredient}`);
      if (!seedIngredientSlugs.has(line.ingredient) && !liveIngredient.has(line.ingredient)) {
        throw new Error(`Unknown ingredient ${line.ingredient} on ${recipe.slug}`);
      }
    }
    const existing = liveRecipe.get(recipe.slug);
    if (!existing) {
      recipePlan.added.push(recipe.slug);
      continue;
    }
    const diffs: string[] = [];
    if (existing.name !== recipe.name) {
      diffs.push(`name: ${JSON.stringify(existing.name)} -> ${JSON.stringify(recipe.name)}`);
    }
    if (existing.servings !== recipe.servings) diffs.push(`servings: ${existing.servings} -> ${recipe.servings}`);
    if (existing.vegetarian !== recipe.vegetarian) {
      diffs.push(`vegetarian: ${existing.vegetarian} -> ${recipe.vegetarian}`);
    }
    if (existing.keto !== recipe.keto) diffs.push(`keto: ${existing.keto} -> ${recipe.keto}`);
    if (existing.archived !== recipe.archived) diffs.push(`archived: ${existing.archived} -> ${recipe.archived}`);
    if (!sameNum(existing.timeHours, recipe.timeHours)) {
      diffs.push(`timeHours: ${existing.timeHours} -> ${recipe.timeHours}`);
    }
    if ((existing.sourceUrl ?? null) !== (recipe.sourceUrl ?? null)) {
      diffs.push(`sourceUrl: ${JSON.stringify(existing.sourceUrl)} -> ${JSON.stringify(recipe.sourceUrl)}`);
    }
    if ((existing.method ?? null) !== (recipe.method ?? null)) {
      diffs.push(`method: ${JSON.stringify(existing.method)} -> ${JSON.stringify(recipe.method)}`);
    }
    if (lineSignature(recipe.ingredients) !== lineSignature(existing.lines)) {
      diffs.push(`ingredients:\n      ${lineDiffs(existing.lines, recipe.ingredients).join('\n      ')}`);
    }
    if (diffs.length) {
      recipePlan.changed.push({ key: recipe.slug, label: `${recipe.name}  (${recipe.slug})`, diffs });
    }
  }
  for (const row of live.recipes) {
    if (!seedRecipeSlugs.has(row.slug)) recipePlan.leftover.push(`${row.name}  (${row.slug})`);
  }

  const nameFrozen = new Map<string, string>();
  for (const row of live.ingredients) {
    if (seedIngredientSlugs.has(row.slug)) continue;
    nameFrozen.set(nameFrozenKey(row.name, row.frozen), row.slug);
  }
  for (const ingredient of source.ingredients) {
    const key = nameFrozenKey(ingredient.name, ingredient.frozen);
    const occupant = nameFrozen.get(key);
    if (occupant && occupant !== ingredient.slug) {
      throw new Error(
        `Cannot set ${ingredient.slug} to "${ingredient.name}" (frozen=${ingredient.frozen}): ${occupant} already has that pair.`,
      );
    }
    nameFrozen.set(key, ingredient.slug);
  }

  const aliasOwner = new Map<string, string>();
  for (const row of live.ingredients) {
    if (seedIngredientSlugs.has(row.slug)) continue;
    for (const alias of row.aliases) aliasOwner.set(alias, row.slug);
  }
  for (const ingredient of source.ingredients) {
    for (const alias of ingredient.aliases) {
      const occupant = aliasOwner.get(alias);
      if (occupant && occupant !== ingredient.slug) {
        throw new Error(`Alias "${alias}" on ${ingredient.slug} already belongs to ${occupant}.`);
      }
      aliasOwner.set(alias, ingredient.slug);
    }
  }

  return { categories: categoryPlan, ingredients: ingredientPlan, recipes: recipePlan };
}

function isEmpty(plan: SyncPlan): boolean {
  return (
    plan.categories.added.length + plan.categories.changed.length === 0 &&
    plan.ingredients.added.length + plan.ingredients.changed.length === 0 &&
    plan.recipes.added.length + plan.recipes.changed.length === 0
  );
}

function printSection(title: string, added: string[], changed: Change[], leftover: string[]) {
  if (!added.length && !changed.length && !leftover.length) return;
  console.log(`\n=== ${title} ===`);
  if (added.length) {
    console.log('added:');
    for (const row of added) console.log(`  + ${row}`);
  }
  if (changed.length) {
    console.log('changed:');
    for (const row of changed) {
      console.log(`  ${row.label}`);
      for (const diff of row.diffs) console.log(`    ${diff}`);
    }
  }
  if (leftover.length) {
    console.log('live-only (left in place):');
    for (const row of leftover) console.log(`  ${row}`);
  }
}

function printPlan(plan: SyncPlan, slots: number, apply: boolean) {
  console.log(apply ? 'seed:sync apply' : 'seed:sync dry-run  (pass --apply to write)');
  console.log(
    `categories +${plan.categories.added.length}/~${plan.categories.changed.length}  ` +
      `ingredients +${plan.ingredients.added.length}/~${plan.ingredients.changed.length}  ` +
      `recipes +${plan.recipes.added.length}/~${plan.recipes.changed.length}  ` +
      `plan_slots ${slots} (not written)`,
  );
  printSection('categories', plan.categories.added, plan.categories.changed, plan.categories.leftover);
  printSection('ingredients', plan.ingredients.added, plan.ingredients.changed, plan.ingredients.leftover);
  printSection('recipes', plan.recipes.added, plan.recipes.changed, plan.recipes.leftover);
}

async function applyPlan(
  db: Db,
  source: SeedIngredients,
  recipeSource: SeedRecipe[],
  live: Awaited<ReturnType<typeof loadLive>>,
  plan: SyncPlan,
): Promise<void> {
  const liveCategory = new Map(live.categories.map((row) => [row.name, row]));
  const liveIngredient = new Map(live.ingredients.map((row) => [row.slug, row]));
  const liveRecipe = new Map(live.recipes.map((row) => [row.slug, row]));
  const addedCategoryNames = new Set(
    source.categories.filter((row) => !liveCategory.has(row.name)).map((row) => row.name),
  );
  const changedCategoryNames = new Set(plan.categories.changed.map((row) => row.key));
  const addedIngredientSlugs = new Set(
    source.ingredients.filter((row) => !liveIngredient.has(row.slug)).map((row) => row.slug),
  );
  const changedIngredientSlugs = new Set(plan.ingredients.changed.map((row) => row.key));
  const addedRecipeSlugs = new Set(recipeSource.filter((row) => !liveRecipe.has(row.slug)).map((row) => row.slug));
  const changedRecipeSlugs = new Set(plan.recipes.changed.map((row) => row.key));

  await db.transaction(async (tx) => {
    const categoryId = new Map(live.categories.map((row) => [row.name, row.id]));

    const newCategories = source.categories.filter((row) => addedCategoryNames.has(row.name));
    if (newCategories.length) {
      const inserted = await tx
        .insert(categories)
        .values(newCategories.map((row) => ({ name: row.name, position: row.order })))
        .returning({ id: categories.id, name: categories.name });
      for (const row of inserted) categoryId.set(row.name, row.id);
    }
    for (const row of source.categories) {
      if (!changedCategoryNames.has(row.name)) continue;
      const id = categoryId.get(row.name);
      if (id === undefined) throw new Error(`Missing category ${row.name}`);
      await tx.update(categories).set({ position: row.order }).where(eq(categories.id, id));
    }

    const ingredientId = new Map(live.ingredients.map((row) => [row.slug, row.id]));
    const newIngredients = source.ingredients.filter((row) => addedIngredientSlugs.has(row.slug));
    if (newIngredients.length) {
      const inserted = await tx
        .insert(ingredients)
        .values(
          newIngredients.map((ingredient) => {
            const id = categoryId.get(ingredient.category);
            if (id === undefined) {
              throw new Error(`Unknown category ${ingredient.category} on ${ingredient.slug}`);
            }
            return {
              slug: ingredient.slug,
              name: ingredient.name,
              categoryId: id,
              frozen: ingredient.frozen,
              pantryStaple: ingredient.pantryStaple,
              packSize: numeric(ingredient.packSize),
              packUnit: checkUnit(ingredient.packUnit, ingredient.slug),
            };
          }),
        )
        .returning({ id: ingredients.id, slug: ingredients.slug });
      for (const row of inserted) ingredientId.set(row.slug, row.id);
    }
    for (const ingredient of source.ingredients) {
      if (!changedIngredientSlugs.has(ingredient.slug)) continue;
      const id = ingredientId.get(ingredient.slug);
      const category = categoryId.get(ingredient.category);
      if (id === undefined || category === undefined) {
        throw new Error(`Missing ingredient or category for ${ingredient.slug}`);
      }
      await tx
        .update(ingredients)
        .set({
          name: ingredient.name,
          categoryId: category,
          frozen: ingredient.frozen,
          pantryStaple: ingredient.pantryStaple,
          packSize: numeric(ingredient.packSize),
          packUnit: checkUnit(ingredient.packUnit, ingredient.slug),
        })
        .where(eq(ingredients.id, id));
    }

    const seedIngredientIds = source.ingredients.map((ingredient) => {
      const id = ingredientId.get(ingredient.slug);
      if (id === undefined) throw new Error(`Missing ingredient ${ingredient.slug}`);
      return id;
    });
    const aliasesChanged = source.ingredients.some((ingredient) => {
      if (addedIngredientSlugs.has(ingredient.slug)) return ingredient.aliases.length > 0;
      if (!changedIngredientSlugs.has(ingredient.slug)) return false;
      return true;
    });
    if (aliasesChanged && seedIngredientIds.length) {
      const idsToReplace = source.ingredients
        .filter((ingredient) => addedIngredientSlugs.has(ingredient.slug) || changedIngredientSlugs.has(ingredient.slug))
        .map((ingredient) => ingredientId.get(ingredient.slug)!);
      await tx.delete(ingredientAliases).where(inArray(ingredientAliases.ingredientId, idsToReplace));
      const aliasValues = source.ingredients
        .filter((ingredient) => addedIngredientSlugs.has(ingredient.slug) || changedIngredientSlugs.has(ingredient.slug))
        .flatMap((ingredient) =>
          ingredient.aliases.map((alias) => ({
            ingredientId: ingredientId.get(ingredient.slug)!,
            alias,
          })),
        );
      if (aliasValues.length) await tx.insert(ingredientAliases).values(aliasValues);
    }

    const recipeId = new Map(live.recipes.map((row) => [row.slug, row.id]));
    const newRecipes = recipeSource.filter((row) => addedRecipeSlugs.has(row.slug));
    if (newRecipes.length) {
      const inserted = await tx
        .insert(recipes)
        .values(
          newRecipes.map((recipe) => ({
            slug: recipe.slug,
            name: recipe.name,
            servings: recipe.servings,
            vegetarian: recipe.vegetarian,
            keto: recipe.keto,
            archived: recipe.archived,
            timeHours: numeric(recipe.timeHours),
            method: recipe.method,
            sourceUrl: recipe.sourceUrl,
          })),
        )
        .returning({ id: recipes.id, slug: recipes.slug });
      for (const row of inserted) recipeId.set(row.slug, row.id);
    }
    for (const recipe of recipeSource) {
      if (!changedRecipeSlugs.has(recipe.slug)) continue;
      const id = recipeId.get(recipe.slug);
      if (id === undefined) throw new Error(`Missing recipe ${recipe.slug}`);
      await tx
        .update(recipes)
        .set({
          name: recipe.name,
          servings: recipe.servings,
          vegetarian: recipe.vegetarian,
          keto: recipe.keto,
          archived: recipe.archived,
          timeHours: numeric(recipe.timeHours),
          method: recipe.method,
          sourceUrl: recipe.sourceUrl,
        })
        .where(eq(recipes.id, id));
    }

    const rewriteSlugs = recipeSource.filter(
      (recipe) => addedRecipeSlugs.has(recipe.slug) || changedRecipeSlugs.has(recipe.slug),
    );
    for (const recipe of rewriteSlugs) {
      const id = recipeId.get(recipe.slug);
      if (id === undefined) throw new Error(`Missing recipe ${recipe.slug}`);
      await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
      if (!recipe.ingredients.length) continue;
      await tx.insert(recipeIngredients).values(
        recipe.ingredients.map((line, position) => {
          const ingredient = ingredientId.get(line.ingredient);
          if (ingredient === undefined) {
            throw new Error(`Unknown ingredient ${line.ingredient} on ${recipe.slug}`);
          }
          return {
            recipeId: id,
            ingredientId: ingredient,
            amount: numeric(line.amount),
            unit: checkUnit(line.unit, `${recipe.slug}/${line.ingredient}`),
            position,
          };
        }),
      );
    }
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('seed:sync requires DATABASE_URL. Use npm run seed against local PGlite.');
  }

  const apply = process.argv.includes('--apply');
  const db = await getDb();
  const source = readJson<SeedIngredients>('./ingredients.json');
  const recipeSource = readJson<SeedRecipe[]>('./recipes.json');
  const live = await loadLive(db);
  const plan = buildPlan(source, recipeSource, live);
  const before = await slotCount(db);

  printPlan(plan, before, apply);

  if (isEmpty(plan)) {
    console.log('\nAlready in sync.');
    return;
  }

  if (!apply) {
    console.log('\nNo writes. Re-run with --apply to push these changes.');
    return;
  }

  await applyPlan(db, source, recipeSource, live, plan);
  const after = await slotCount(db);
  if (after !== before) {
    throw new Error(`plan_slots changed during sync (${before} -> ${after}). Historic meals must not move.`);
  }
  console.log(`\nApplied. plan_slots ${before} unchanged.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
