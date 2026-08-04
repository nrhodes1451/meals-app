/**
 * Loads seed/ingredients.json and seed/recipes.json, the normalised output of the one-off
 * migration from the original sheet. Idempotent: truncates and reinserts, because the seed
 * is authoritative until the app starts writing.
 */
import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { getDb } from '../db/index';
import {
  categories,
  ingredientAliases,
  ingredients,
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

const UNITS = new Set<string>(unitEnum.enumValues);

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as T;
}

/** Numeric columns round-trip as strings in Postgres. */
function numeric(value: number | null): string | null {
  return value === null ? null : String(value);
}

function checkUnit(unit: string | null, where: string): Unit | null {
  if (unit === null) return null;
  if (!UNITS.has(unit)) throw new Error(`Unknown unit ${unit} in ${where}`);
  return unit as Unit;
}

async function main() {
  const db = await getDb();
  const source = readJson<SeedIngredients>('./ingredients.json');
  const recipeSource = readJson<SeedRecipe[]>('./recipes.json');

  await db.execute(sql`
    truncate table ${recipeIngredients}, ${ingredientAliases}, ${recipes},
      ${ingredients}, ${categories} restart identity cascade
  `);

  const categoryRows = await db
    .insert(categories)
    .values(
      source.categories.map((category) => ({
        name: category.name,
        position: category.order,
      })),
    )
    .returning({ id: categories.id, name: categories.name });

  const categoryId = new Map(categoryRows.map((row) => [row.name, row.id]));

  const ingredientRows = await db
    .insert(ingredients)
    .values(
      source.ingredients.map((ingredient) => {
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

  const ingredientId = new Map(ingredientRows.map((row) => [row.slug, row.id]));

  const aliasValues = source.ingredients.flatMap((ingredient) =>
    ingredient.aliases.map((alias) => ({
      ingredientId: ingredientId.get(ingredient.slug)!,
      alias,
    })),
  );
  if (aliasValues.length) await db.insert(ingredientAliases).values(aliasValues);

  const recipeRows = await db
    .insert(recipes)
    .values(
      recipeSource.map((recipe) => ({
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

  const recipeId = new Map(recipeRows.map((row) => [row.slug, row.id]));

  const lineValues = recipeSource.flatMap((recipe) =>
    recipe.ingredients.map((line, index) => {
      const id = ingredientId.get(line.ingredient);
      if (id === undefined) {
        throw new Error(`Unknown ingredient ${line.ingredient} on ${recipe.slug}`);
      }
      return {
        recipeId: recipeId.get(recipe.slug)!,
        ingredientId: id,
        amount: numeric(line.amount),
        unit: checkUnit(line.unit, `${recipe.slug}/${line.ingredient}`),
        position: index,
      };
    }),
  );
  await db.insert(recipeIngredients).values(lineValues);

  console.log(
    `Seeded ${categoryRows.length} categories, ${ingredientRows.length} ingredients, ` +
      `${aliasValues.length} aliases, ${recipeRows.length} recipes, ${lineValues.length} lines.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
