import { inArray } from 'drizzle-orm';
import type { Db } from '@/db';
import { ingredientAliases, ingredients, recipeIngredients, recipes, unitEnum } from '@/db/schema';
import { insertIngredient } from './ingredients';
import { validateFields, validateQuantity, type FieldInput } from './recipe-fields';
import type { Unit } from './quantity';
import type { Target } from './recipe-import';
import { slugify, uniqueSlug } from './slug';

export type ImportInput = FieldInput & {
  vegetarian: boolean;
  keto: boolean;
  lines: { amount: string; unit: string; target: Target }[];
};

export type ImportResult = { ok: true; slug: string } | { ok: false; error: string };

/** `/recipes/import` is a page, so a recipe with this slug could never be opened. */
const RESERVED_SLUGS = ['import'];

type Kept = Exclude<Target, { kind: 'omit' }>;

/** Thrown inside the transaction so a failure part way rolls back every row written so far. */
class Abort extends Error {}

/**
 * Everything the import journey confirmed, written at once: new ingredients, the aliases the user
 * chose to keep, the recipe and its lines. Either all of it lands or none of it does, so an
 * abandoned or failed import never leaves orphan ingredients behind.
 */
export async function saveImportedRecipe(db: Db, input: ImportInput): Promise<ImportResult> {
  const fields = validateFields(input);
  if (!fields.ok) return fields;
  const kept = input.lines.filter(
    (line): line is ImportInput['lines'][number] & { target: Kept } =>
      line.target.kind !== 'omit',
  );
  if (kept.length === 0) {
    return { ok: false, error: 'The recipe has no ingredients. Add at least one line.' };
  }

  const lines: { amount: string | null; unit: Unit | null; target: Kept }[] = [];
  for (const [index, line] of kept.entries()) {
    const quantity = validateQuantity(line.amount, line.unit, index + 1, unitEnum.enumValues);
    if (!quantity.ok) return quantity;
    const { target } = line;
    if (target.kind === 'new') {
      if (!target.confirmed) {
        return { ok: false, error: `Line ${index + 1} is a new ingredient nobody confirmed.` };
      }
      if (target.categoryId === null) {
        return { ok: false, error: `Line ${index + 1} needs an aisle for its new ingredient.` };
      }
    }
    lines.push({ ...quantity.value, target });
  }

  const existingIds = lines.flatMap((line) =>
    line.target.kind === 'existing' ? [line.target.id] : [],
  );
  if (existingIds.length) {
    const found = await db
      .select({ id: ingredients.id })
      .from(ingredients)
      .where(inArray(ingredients.id, existingIds));
    if (found.length !== new Set(existingIds).size) {
      return { ok: false, error: 'An ingredient was deleted while you were importing. Pick it again.' };
    }
  }

  try {
    const slug = await db.transaction(async (tx) => {
      // Two lines naming the same new ingredient share one row.
      const created = new Map<string, number>();
      const idFor = async (target: Kept): Promise<number> => {
        if (target.kind === 'existing') return target.id;
        const key = `${target.name.trim().toLowerCase()}|${target.frozen}`;
        const known = created.get(key);
        if (known !== undefined) return known;
        const result = await insertIngredient(tx, {
          name: target.name,
          categoryId: target.categoryId!,
          frozen: target.frozen,
          pantryStaple: target.pantryStaple,
        });
        if (!result.ok) {
          throw new Abort(`${result.error} Use the existing ingredient instead.`);
        }
        created.set(key, result.id);
        return result.id;
      };

      const resolved = [];
      for (const line of lines) {
        resolved.push({ ...line, ingredientId: await idFor(line.target) });
      }

      // The photo's wording kept as an alias, so the next import matches it outright. An alias
      // already taken, or one that is just the ingredient's own name, is skipped.
      const wanted = new Map<string, number>();
      for (const line of resolved) {
        if (line.target.kind !== 'existing' || !line.target.alias) continue;
        const alias = line.target.alias.trim().toLowerCase();
        if (alias) wanted.set(alias, line.ingredientId);
      }
      if (wanted.size) {
        const [taken, named] = await Promise.all([
          tx
            .select({ alias: ingredientAliases.alias })
            .from(ingredientAliases)
            .where(inArray(ingredientAliases.alias, [...wanted.keys()])),
          tx
            .select({ name: ingredients.name })
            .from(ingredients)
            .where(inArray(ingredients.name, [...wanted.keys()])),
        ]);
        const skip = new Set([...taken.map((row) => row.alias), ...named.map((row) => row.name)]);
        const fresh = [...wanted].filter(([alias]) => !skip.has(alias));
        if (fresh.length) {
          await tx
            .insert(ingredientAliases)
            .values(fresh.map(([alias, ingredientId]) => ({ alias, ingredientId })));
        }
      }

      const others = await tx.select({ slug: recipes.slug }).from(recipes);
      const slug = uniqueSlug(slugify(fields.value.name), [
        ...others.map((row) => row.slug),
        ...RESERVED_SLUGS,
      ]);

      const [recipe] = await tx
        .insert(recipes)
        .values({ ...fields.value, slug, vegetarian: input.vegetarian, keto: input.keto })
        .returning({ id: recipes.id });

      await tx.insert(recipeIngredients).values(
        resolved.map((line, position) => ({
          recipeId: recipe.id,
          ingredientId: line.ingredientId,
          amount: line.amount,
          unit: line.unit,
          position,
        })),
      );

      return slug;
    });
    return { ok: true, slug };
  } catch (error) {
    if (error instanceof Abort) return { ok: false, error: error.message };
    throw error;
  }
}
