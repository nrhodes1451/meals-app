/**
 * Fills a week with meals so the planner, This Week and the shopping list have something to
 * show. Development only: PGlite is single-process, so stop the dev server before running it.
 */
import { and, eq } from 'drizzle-orm';
import { getDb } from '../db';
import { planSlots } from '../db/schema';
import { loadPlan } from '../lib/plan';
import { rollWeek } from '../lib/roll';
import { currentWeekStarting } from '../lib/week';

async function main() {
  const week = process.argv[2] ?? currentWeekStarting();
  const db = await getDb();
  const { plan, slots, recipes } = await loadPlan(db, week);

  const chosen = rollWeek(recipes, slots, {
    vegetarianOnly: false,
    maxMinutes: null,
    excludeWeeks: null,
  });

  for (const [position, recipeId] of chosen) {
    await db
      .update(planSlots)
      .set({ recipeId })
      .where(and(eq(planSlots.planId, plan.id), eq(planSlots.position, position)));
  }

  const filled = await loadPlan(db, week);
  console.log(`Week ${week}:`);
  for (const slot of filled.slots) {
    console.log(`  ${slot.position} ${slot.recipe?.name ?? '(empty)'}`);
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
