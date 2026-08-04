/**
 * Saving a recipe rewrites its ingredient lines by deleting them and inserting the new set. If
 * that pair is not atomic, a failure halfway leaves the recipe with no ingredients at all - and
 * `neon-http`, the obvious Neon driver, cannot open a transaction. This pins the invariant.
 *
 * Runs against PGlite in memory, so it needs no database.
 */
import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as schema from '@/db/schema';
import { categories, ingredients, recipeIngredients, recipes } from '@/db/schema';

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
let recipeId: number;

beforeAll(async () => {
  client = new PGlite();
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './db/migrations' });

  const [category] = await db
    .insert(categories)
    .values({ name: 'Fruit & Veg', position: 1 })
    .returning();

  const rows = await db
    .insert(ingredients)
    .values([
      { slug: 'onions', name: 'onions', categoryId: category.id },
      { slug: 'carrots', name: 'carrots', categoryId: category.id },
    ])
    .returning();

  const [recipe] = await db
    .insert(recipes)
    .values({ slug: 'test-stew', name: 'Test stew' })
    .returning();
  recipeId = recipe.id;

  await db.insert(recipeIngredients).values([
    { recipeId, ingredientId: rows[0].id, amount: '2', unit: null, position: 0 },
    { recipeId, ingredientId: rows[1].id, amount: '300', unit: 'g', position: 1 },
  ]);
});

afterAll(async () => {
  await client.close();
});

const lines = () =>
  db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));

describe('rewriting a recipe ingredient list', () => {
  it('replaces every line in one transaction', async () => {
    const before = await lines();
    expect(before).toHaveLength(2);

    await db.transaction(async (tx) => {
      await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
      await tx.insert(recipeIngredients).values(
        before.map((line, position) => ({
          recipeId,
          ingredientId: line.ingredientId,
          amount: line.amount,
          unit: line.unit,
          position,
        })),
      );
    });

    expect(await lines()).toHaveLength(2);
  });

  it('leaves the lines untouched when the rewrite fails partway', async () => {
    await expect(
      db.transaction(async (tx) => {
        await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
        throw new Error('insert failed');
      }),
    ).rejects.toThrow('insert failed');

    expect(await lines()).toHaveLength(2);
  });
});
