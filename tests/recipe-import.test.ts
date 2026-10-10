/**
 * The photo import trusts nothing the model says: units are checked, ids are checked, and a
 * name or alias match beats the model's guess. Saving is one transaction, so a failure part way
 * leaves no new ingredients behind. Vertex is never called here.
 */
import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Db } from '@/db';
import * as schema from '@/db/schema';
import { ingredientAliases, ingredients, recipeIngredients, recipes, unitEnum } from '@/db/schema';
import {
  parseModelRecipe,
  toDraft,
  unresolved,
  type KnownIngredient,
  type ModelRecipe,
} from '@/lib/recipe-import';
import { saveImportedRecipe, type ImportInput } from '@/lib/recipe-import-save';

const units = unitEnum.enumValues;

const known: KnownIngredient[] = [
  { id: 1, name: 'onions', frozen: false, aliases: ['onion'] },
  { id: 2, name: 'spinach', frozen: false, aliases: [] },
  { id: 3, name: 'spinach', frozen: true, aliases: [] },
  { id: 4, name: 'broccoli', frozen: false, aliases: ['broccol'] },
  { id: 5, name: 'carrots', frozen: false, aliases: [] },
];

function model(lines: Partial<ModelRecipe['ingredients'][number]>[]): ModelRecipe {
  return {
    name: 'Test stew',
    servings: 4,
    minutes: 45,
    vegetarian: true,
    method: 'Cook it.',
    ingredients: lines.map((line) => ({
      raw: line.name ?? '',
      name: '',
      amount: null,
      unit: null,
      frozen: false,
      matchId: null,
      ...line,
    })),
  };
}

describe('turning model output into a draft', () => {
  it('prefers a name or alias match over a wrong id from the model', () => {
    const draft = toDraft(model([{ name: 'broccol', matchId: 5 }]), known, units);
    expect(draft.lines[0].target).toEqual({ kind: 'existing', id: 4, alias: null });
  });

  it('matches singular to plural', () => {
    const draft = toDraft(model([{ name: 'carrot' }]), known, units);
    expect(draft.lines[0].target).toMatchObject({ kind: 'existing', id: 5 });
  });

  it('keeps fresh and frozen apart', () => {
    const draft = toDraft(
      model([{ name: 'spinach' }, { name: 'spinach', frozen: true }]),
      known,
      units,
    );
    expect(draft.lines.map((line) => line.target)).toMatchObject([{ id: 2 }, { id: 3 }]);
  });

  it('takes the model match when the name alone does not match', () => {
    const draft = toDraft(model([{ name: 'red onions', matchId: 1 }]), known, units);
    expect(draft.lines[0].target).toMatchObject({ kind: 'existing', id: 1 });
    expect(draft.lines[0].unmatched).toBe(false);
  });

  it('rejects an id the library does not have, so the line is new', () => {
    const draft = toDraft(model([{ name: 'tofu', matchId: 999 }]), known, units);
    expect(draft.lines[0].target).toEqual({
      kind: 'new',
      name: 'tofu',
      frozen: false,
      pantryStaple: false,
      categoryId: null,
      confirmed: false,
    });
    expect(draft.lines[0].unmatched).toBe(true);
    expect(unresolved(draft.lines)).toHaveLength(1);
  });

  it('blanks a unit the app does not know and keeps a missing amount as "some"', () => {
    const draft = toDraft(
      model([
        { name: 'onions', amount: 2, unit: 'cup' },
        { name: 'carrots', amount: null, unit: null },
      ]),
      known,
      units,
    );
    expect(draft.lines[0]).toMatchObject({ amount: '2', unit: '' });
    expect(draft.lines[1]).toMatchObject({ amount: '', unit: '' });
  });

  it('refuses a response that is not a recipe', () => {
    expect(parseModelRecipe(null)).toBeNull();
    expect(parseModelRecipe({ name: '', ingredients: [] })).toBeNull();
    expect(parseModelRecipe({ name: 'Soup', ingredients: [{ name: 'Leeks', amount: -1 }] }))
      .toMatchObject({ ingredients: [{ name: 'leeks', amount: null }] });
  });
});

describe('saving an imported recipe', () => {
  let client: PGlite;
  let db: Db;
  let categoryId: number;
  let onionsId: number;

  beforeAll(async () => {
    client = new PGlite();
    const database = drizzle(client, { schema });
    await migrate(database, { migrationsFolder: './db/migrations' });
    db = database as unknown as Db;

    const [category] = await db
      .insert(schema.categories)
      .values({ name: 'Fruit & Veg', position: 1 })
      .returning();
    categoryId = category.id;
    const [onions] = await db
      .insert(ingredients)
      .values({ slug: 'onions', name: 'onions', categoryId })
      .returning();
    onionsId = onions.id;
  });

  afterAll(async () => {
    await client.close();
  });

  const input = (lines: ImportInput['lines']): ImportInput => ({
    name: 'Leek soup',
    servings: '2',
    minutes: '30',
    sourceUrl: '',
    method: 'Simmer.',
    vegetarian: true,
    keto: false,
    lines,
  });

  it('creates the new ingredient, the alias and the recipe together', async () => {
    const result = await saveImportedRecipe(
      db,
      input([
        {
          amount: '3',
          unit: '',
          target: { kind: 'new', name: 'Leeks', frozen: false, pantryStaple: false, categoryId, confirmed: true },
        },
        { amount: '1', unit: '', target: { kind: 'existing', id: onionsId, alias: 'brown onion' } },
        { amount: '', unit: '', target: { kind: 'new', name: 'leeks', frozen: false, pantryStaple: false, categoryId, confirmed: true } },
      ]),
    );
    expect(result).toEqual({ ok: true, slug: 'leek-soup' });

    const leeks = await db.select().from(ingredients).where(eq(ingredients.name, 'leeks'));
    expect(leeks).toHaveLength(1);

    const alias = await db
      .select()
      .from(ingredientAliases)
      .where(eq(ingredientAliases.alias, 'brown onion'));
    expect(alias).toMatchObject([{ ingredientId: onionsId }]);

    const [recipe] = await db.select().from(recipes).where(eq(recipes.slug, 'leek-soup'));
    expect(recipe).toMatchObject({ name: 'Leek soup', servings: 2, timeHours: '0.50' });
    const lines = await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipe.id));
    expect(lines.map((line) => line.ingredientId)).toEqual([leeks[0].id, onionsId, leeks[0].id]);
  });

  it('refuses an unconfirmed new ingredient and writes nothing', async () => {
    const before = await db.select().from(ingredients);
    const result = await saveImportedRecipe(
      db,
      input([
        { amount: '', unit: '', target: { kind: 'new', name: 'tofu', frozen: false, pantryStaple: false, categoryId, confirmed: false } },
      ]),
    );
    expect(result.ok).toBe(false);
    expect(await db.select().from(ingredients)).toHaveLength(before.length);
  });

  it('rolls back new ingredients when a later step fails', async () => {
    const before = await db.select().from(ingredients);
    const result = await saveImportedRecipe(
      db,
      input([
        { amount: '', unit: '', target: { kind: 'new', name: 'tofu', frozen: false, pantryStaple: false, categoryId, confirmed: true } },
        // Already in the library, so the insert fails after tofu was written.
        { amount: '', unit: '', target: { kind: 'new', name: 'onions', frozen: false, pantryStaple: false, categoryId, confirmed: true } },
      ]),
    );
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('onions') });
    expect(await db.select().from(ingredients)).toHaveLength(before.length);
  });

  it('drops lines left out, and can create a new ingredient as a pantry staple', async () => {
    const result = await saveImportedRecipe(db, {
      ...input([
        { amount: '', unit: '', target: { kind: 'omit' } },
        { amount: '2', unit: 'tsp', target: { kind: 'new', name: 'sea salt', frozen: false, pantryStaple: true, categoryId, confirmed: true } },
      ]),
      name: 'Salted water',
    });
    expect(result).toEqual({ ok: true, slug: 'salted-water' });

    const [salt] = await db.select().from(ingredients).where(eq(ingredients.name, 'sea salt'));
    expect(salt.pantryStaple).toBe(true);
    const [recipe] = await db.select().from(recipes).where(eq(recipes.slug, 'salted-water'));
    const lines = await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipe.id));
    expect(lines).toMatchObject([{ ingredientId: salt.id, amount: '2.00', unit: 'tsp', position: 0 }]);
  });

  it('refuses a recipe whose every line was left out', async () => {
    const result = await saveImportedRecipe(db, input([{ amount: '', unit: '', target: { kind: 'omit' } }]));
    expect(result.ok).toBe(false);
  });

  it('never gives a recipe the slug of the import page', async () => {
    const result = await saveImportedRecipe(db, {
      ...input([{ amount: '', unit: '', target: { kind: 'existing', id: onionsId, alias: null } }]),
      name: 'Import',
    });
    expect(result).toEqual({ ok: true, slug: 'import-2' });
  });
});
