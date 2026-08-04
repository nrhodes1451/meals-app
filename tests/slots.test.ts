/**
 * Weeks are not seven meals long. Adding a meal appends the next contiguous position; removing
 * one closes the gap so numbers stay 1..N on every screen. Both have to stay atomic against the
 * unique index on (plan, position).
 */
import { PGlite } from '@electric-sql/pglite';
import { and, asc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as schema from '@/db/schema';
import { planSlots, plans } from '@/db/schema';
import { MAX_SLOT_COUNT, MIN_SLOT_COUNT } from '@/lib/week';

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
let planId: number;

beforeAll(async () => {
  client = new PGlite();
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './db/migrations' });

  const [plan] = await db.insert(plans).values({ weekStarting: '2026-08-03' }).returning();
  planId = plan.id;

  await db.insert(planSlots).values(
    Array.from({ length: 7 }, (_, position) => ({ planId, position })),
  );
});

afterAll(async () => {
  await client.close();
});

const positions = async () => {
  const rows = await db
    .select({ position: planSlots.position })
    .from(planSlots)
    .where(eq(planSlots.planId, planId))
    .orderBy(asc(planSlots.position));
  return rows.map((row) => row.position);
};

/** The same steps the server actions take, without the Next.js wrapper. */
async function add() {
  const current = await positions();
  if (current.length >= MAX_SLOT_COUNT) throw new Error('at max');
  await db.insert(planSlots).values({ planId, position: current.length });
}

async function remove(position: number) {
  const rows = await db
    .select()
    .from(planSlots)
    .where(eq(planSlots.planId, planId))
    .orderBy(asc(planSlots.position));
  if (rows.length <= MIN_SLOT_COUNT) throw new Error('at min');
  await db.transaction(async (tx) => {
    await tx
      .delete(planSlots)
      .where(and(eq(planSlots.planId, planId), eq(planSlots.position, position)));
    const after = rows
      .filter((row) => row.position > position)
      .sort((a, b) => a.position - b.position);
    for (const row of after) {
      await tx
        .update(planSlots)
        .set({ position: row.position - 1 })
        .where(eq(planSlots.id, row.id));
    }
  });
}

describe('variable meal counts', () => {
  it('starts with seven contiguous positions', async () => {
    expect(await positions()).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('appends when a meal is added', async () => {
    await add();
    expect(await positions()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('closes the gap when a meal is removed from the middle', async () => {
    await remove(2);
    expect(await positions()).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('can shrink to six and grow past seven', async () => {
    await remove(6);
    expect(await positions()).toEqual([0, 1, 2, 3, 4, 5]);
    await add();
    await add();
    expect(await positions()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});
