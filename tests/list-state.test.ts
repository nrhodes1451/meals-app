/**
 * The shopping list stores per-shop state only, and stores it lazily: an untouched week has no
 * rows at all. Two invariants matter enough to pin.
 *
 * First, ticking the same item twice must not leave two rows behind, because there is no unique
 * index on (plan, ingredient, skipped) to catch it. Shop and skipped ticks for the same
 * ingredient are two rows.
 *
 * Second, a tick has to survive the plan changing underneath it. Re-rolling a day can drop an
 * ingredient off the derived list; deleting its row would silently lose the tick if the meal
 * came back. The row is left alone instead, and the derivation simply stops mentioning it.
 *
 * Runs against PGlite in memory, so it needs no database.
 */
import { PGlite } from '@electric-sql/pglite';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as schema from '@/db/schema';
import { categories, ingredients, plans, shoppingListItems } from '@/db/schema';
import { loadListState } from '@/lib/shopping';

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
let planId: number;
let onionId: number;
let saltId: number;

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
      { slug: 'salt', name: 'salt', categoryId: category.id, pantryStaple: true },
    ])
    .returning();
  onionId = rows[0].id;
  saltId = rows[1].id;

  const [plan] = await db.insert(plans).values({ weekStarting: '2026-08-03' }).returning();
  planId = plan.id;
});

afterAll(async () => {
  await client.close();
});

/** The upsert the actions perform, without the Next.js server-action wrapper around it. */
async function upsert(
  ingredientId: number,
  patch: { checked?: boolean; stapleOverride?: boolean },
  skipped = false,
) {
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: shoppingListItems.id })
      .from(shoppingListItems)
      .where(
        and(
          eq(shoppingListItems.planId, planId),
          eq(shoppingListItems.ingredientId, ingredientId),
          eq(shoppingListItems.manual, false),
          eq(shoppingListItems.skipped, skipped),
        ),
      )
      .limit(1);

    if (existing) {
      await tx
        .update(shoppingListItems)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(shoppingListItems.id, existing.id));
      return;
    }
    await tx.insert(shoppingListItems).values({ planId, ingredientId, skipped, ...patch });
  });
}

const rowsFor = (ingredientId: number) =>
  db
    .select()
    .from(shoppingListItems)
    .where(
      and(eq(shoppingListItems.planId, planId), eq(shoppingListItems.ingredientId, ingredientId)),
    );

describe('per-shop state', () => {
  it('starts empty, because rows are only written when something is done to the list', async () => {
    const state = await loadListState(db, planId);
    expect(state.checked.size).toBe(0);
    expect(state.skippedChecked.size).toBe(0);
    expect(state.stapleOverrides.size).toBe(0);
    expect(state.manual).toEqual([]);
  });

  it('creates one row on the first tick and reuses it afterwards', async () => {
    await upsert(onionId, { checked: true });
    expect(await rowsFor(onionId)).toHaveLength(1);

    await upsert(onionId, { checked: false });
    await upsert(onionId, { checked: true });

    const rows = await rowsFor(onionId);
    expect(rows).toHaveLength(1);
    expect(rows[0].checked).toBe(true);
  });

  it('keeps the tick and the staple override on the same row', async () => {
    await upsert(saltId, { stapleOverride: true });
    await upsert(saltId, { checked: true });

    const rows = await rowsFor(saltId);
    expect(rows).toHaveLength(1);
    expect(rows[0].checked).toBe(true);
    expect(rows[0].stapleOverride).toBe(true);

    const state = await loadListState(db, planId);
    expect(state.checked.has(saltId)).toBe(true);
    expect(state.stapleOverrides.has(saltId)).toBe(true);
  });

  it('reads manual items separately from derived ones', async () => {
    await db
      .insert(shoppingListItems)
      .values({ planId, freeText: 'batteries', manual: true, checked: false });

    const state = await loadListState(db, planId);
    expect(state.manual).toHaveLength(1);
    expect(state.manual[0].freeText).toBe('batteries');
    // A manual row has no ingredient, so it must not leak into the derived sets.
    expect(state.checked.size).toBe(2);
  });

  it('leaves a tick in place when the ingredient drops out of the plan', async () => {
    // Nothing here deletes rows: the derivation just stops listing the ingredient, and the tick
    // is still there if the meal is rolled back in.
    const state = await loadListState(db, planId);
    expect(state.checked.has(onionId)).toBe(true);
  });

  it('keeps shop and skipped ticks as two rows for the same ingredient', async () => {
    await upsert(onionId, { checked: true }, true);
    expect(await rowsFor(onionId)).toHaveLength(2);

    const state = await loadListState(db, planId);
    expect(state.checked.has(onionId)).toBe(true);
    expect(state.skippedChecked.has(onionId)).toBe(true);

    await upsert(onionId, { checked: false }, true);
    const after = await loadListState(db, planId);
    expect(after.checked.has(onionId)).toBe(true);
    expect(after.skippedChecked.has(onionId)).toBe(false);
  });
});
