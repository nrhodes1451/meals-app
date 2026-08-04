import { isNotNull, lt, sql } from 'drizzle-orm';
import type { Db } from '@/db';
import { planSlots, plans } from '@/db/schema';
import { weeksBetween } from './week';

/**
 * "Last eaten" is derived from plan history, not stored on the recipe. The design handoff carries
 * it as a field on each recipe; there is no such column and there should not be one.
 *
 * A recipe counts as eaten in a week if it was in that week's plan. The per-slot `eaten` tick is
 * a within-week checklist for This Week and deliberately does not feed this: if it did, forgetting
 * to tick would quietly put a meal back in the pool the following week.
 *
 * Weeks are counted relative to `relativeTo` and only earlier weeks are considered, so a recipe
 * in the week being planned does not read as "eaten 0 weeks ago" and exclude itself.
 */
export async function lastEatenWeeks(
  db: Db,
  relativeTo: string,
): Promise<Map<number, number>> {
  const rows = await db
    .select({
      recipeId: planSlots.recipeId,
      lastWeek: sql<string>`max(${plans.weekStarting})`,
    })
    .from(planSlots)
    .innerJoin(plans, sql`${plans.id} = ${planSlots.planId}`)
    .where(sql`${isNotNull(planSlots.recipeId)} and ${lt(plans.weekStarting, relativeTo)}`)
    .groupBy(planSlots.recipeId);

  const result = new Map<number, number>();
  for (const row of rows) {
    if (row.recipeId === null) continue;
    result.set(row.recipeId, weeksBetween(relativeTo, row.lastWeek));
  }
  return result;
}
