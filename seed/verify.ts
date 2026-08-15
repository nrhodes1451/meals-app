/**
 * Asserts the seeded database against the counts in seed/review.md and the source JSON, so
 * a partial or double load is loud rather than subtle.
 */
import { and, count, eq, isNull, sql } from 'drizzle-orm';
import { getDb } from '../db/index';
import {
  categories,
  ingredientAliases,
  ingredients,
  recipeIngredients,
  recipes,
} from '../db/schema';

type Check = { label: string; expected: number; actual: number };

async function main() {
  const db = await getDb();

  const scalar = async (query: Promise<{ value: number }[]>) => Number((await query)[0].value);

  const checks: Check[] = [
    {
      label: 'categories',
      expected: 11,
      actual: await scalar(db.select({ value: count() }).from(categories)),
    },
    {
      label: 'ingredients',
      expected: 179,
      actual: await scalar(db.select({ value: count() }).from(ingredients)),
    },
    {
      label: 'ingredients frozen',
      expected: 15,
      actual: await scalar(
        db.select({ value: count() }).from(ingredients).where(eq(ingredients.frozen, true)),
      ),
    },
    {
      label: 'ingredients pantry staple',
      expected: 31,
      actual: await scalar(
        db.select({ value: count() }).from(ingredients).where(eq(ingredients.pantryStaple, true)),
      ),
    },
    {
      label: 'ingredients with a pack size',
      expected: 0,
      actual: await scalar(
        db
          .select({ value: count() })
          .from(ingredients)
          .where(sql`${ingredients.packSize} is not null`),
      ),
    },
    {
      label: 'alias rows',
      expected: 58,
      actual: await scalar(db.select({ value: count() }).from(ingredientAliases)),
    },
    {
      label: 'ingredients carrying an alias',
      expected: 50,
      actual: await scalar(
        db
          .select({ value: sql<number>`count(distinct ${ingredientAliases.ingredientId})` })
          .from(ingredientAliases),
      ),
    },
    {
      label: 'recipes',
      expected: 170,
      actual: await scalar(db.select({ value: count() }).from(recipes)),
    },
    {
      label: 'recipes archived',
      expected: 57,
      actual: await scalar(
        db.select({ value: count() }).from(recipes).where(eq(recipes.archived, true)),
      ),
    },
    {
      label: 'recipes keto',
      expected: 73,
      actual: await scalar(db.select({ value: count() }).from(recipes).where(eq(recipes.keto, true))),
    },
    {
      label: 'recipes vegetarian',
      expected: 125,
      actual: await scalar(
        db.select({ value: count() }).from(recipes).where(eq(recipes.vegetarian, true)),
      ),
    },
    {
      label: 'recipes in the random pool (unarchived)',
      expected: 113,
      actual: await scalar(
        db.select({ value: count() }).from(recipes).where(eq(recipes.archived, false)),
      ),
    },
    {
      label: 'recipe ingredient lines',
      expected: 873,
      actual: await scalar(db.select({ value: count() }).from(recipeIngredients)),
    },
    {
      label: 'lines with no amount ("some")',
      expected: 294,
      actual: await scalar(
        db.select({ value: count() }).from(recipeIngredients).where(isNull(recipeIngredients.amount)),
      ),
    },
    {
      label: 'lines with no unit (bare count or "some")',
      expected: 501,
      actual: await scalar(
        db.select({ value: count() }).from(recipeIngredients).where(isNull(recipeIngredients.unit)),
      ),
    },
    {
      label: 'lines that are a bare count (amount, no unit)',
      expected: 212,
      actual: await scalar(
        db
          .select({ value: count() })
          .from(recipeIngredients)
          .where(and(isNull(recipeIngredients.unit), sql`${recipeIngredients.amount} is not null`)),
      ),
    },
    {
      // A unit with no amount still contributes only "some". Worth asserting because it is
      // easy to assume amount and unit are null together.
      label: 'lines with a unit but no amount',
      expected: 5,
      actual: await scalar(
        db
          .select({ value: count() })
          .from(recipeIngredients)
          .where(and(isNull(recipeIngredients.amount), sql`${recipeIngredients.unit} is not null`)),
      ),
    },
    {
      label: 'ingredients never used by a recipe',
      expected: 4,
      actual: await scalar(
        db.select({ value: sql<number>`count(*)` }).from(
          sql`(select ${ingredients.id} from ${ingredients}
               where not exists (select 1 from ${recipeIngredients}
                 where ${recipeIngredients.ingredientId} = ${ingredients.id})) as unused`,
        ),
      ),
    },
    {
      label: 'categories with no ingredients (Drinks)',
      expected: 1,
      actual: await scalar(
        db.select({ value: sql<number>`count(*)` }).from(
          sql`(select ${categories.id} from ${categories}
               where not exists (select 1 from ${ingredients}
                 where ${ingredients.categoryId} = ${categories.id})) as empty_categories`,
        ),
      ),
    },
  ];

  const width = Math.max(...checks.map((check) => check.label.length));
  let failed = 0;

  for (const check of checks) {
    const ok = check.expected === check.actual;
    if (!ok) failed += 1;
    const detail = ok ? String(check.actual) : `${check.actual}, expected ${check.expected}`;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${check.label.padEnd(width)}  ${detail}`);
  }

  if (failed > 0) {
    console.error(`\n${failed} of ${checks.length} checks failed.`);
    process.exit(1);
  }
  console.log(`\nAll ${checks.length} checks passed.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
