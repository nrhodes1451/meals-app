import { asc, eq } from 'drizzle-orm';
import type { Db } from '@/db';
import { planSlots, plans } from '@/db/schema';

/** What a brand new week starts with. Weeks are resized afterwards, so this is only a default. */
export const DEFAULT_SLOT_COUNT = 7;

/** A week with no meals is not a plan, and the planner stops being scannable much past this. */
export const MIN_SLOT_COUNT = 1;
export const MAX_SLOT_COUNT = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

/** ISO date, no time. `plans.weekStarting` is a date column. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** The Monday of the week containing this date. Weeks are Monday to Sunday. */
export function mondayOf(date: Date): Date {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = utc.getUTCDay(); // 0 is Sunday
  const offset = weekday === 0 ? -6 : 1 - weekday;
  utc.setUTCDate(utc.getUTCDate() + offset);
  return utc;
}

export function currentWeekStarting(now = new Date()): string {
  return toIsoDate(mondayOf(now));
}

/** Whole weeks between two Mondays. Positive when `from` is the later one. */
export function weeksBetween(from: string, to: string): number {
  return Math.round((fromIsoDate(from).getTime() - fromIsoDate(to).getTime()) / (7 * DAY_MS));
}

export function isValidWeekStarting(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const date = fromIsoDate(iso);
  if (Number.isNaN(date.getTime())) return false;
  return toIsoDate(mondayOf(date)) === iso;
}

export type Plan = { id: number; weekStarting: string };

/**
 * There is no "new week" step: visiting a week creates it, with a default number of empty slots.
 * The ritual is weekly, so the week already exists by the time anyone looks at it.
 *
 * Slots are only ever created here, at the moment the plan is created. An existing plan is
 * returned untouched however many slots it holds - back-filling to a fixed seven would undo
 * removing a meal the moment the page reloaded.
 */
export async function getOrCreatePlan(db: Db, weekStarting: string): Promise<Plan> {
  const existing = await db.query.plans.findFirst({
    where: eq(plans.weekStarting, weekStarting),
  });

  if (existing) return { id: existing.id, weekStarting: existing.weekStarting };

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(plans)
      .values({ weekStarting })
      .onConflictDoNothing()
      .returning({ id: plans.id, weekStarting: plans.weekStarting });

    // Lost the race to another request: it owns creating the slots, so do not add a second set.
    if (!created) {
      const winner = (await tx.query.plans.findFirst({
        where: eq(plans.weekStarting, weekStarting),
      }))!;
      return { id: winner.id, weekStarting: winner.weekStarting };
    }

    await tx.insert(planSlots).values(
      Array.from({ length: DEFAULT_SLOT_COUNT }, (_, position) => ({
        planId: created.id,
        position,
      })),
    );

    return { id: created.id, weekStarting: created.weekStarting };
  });
}

export async function listPlanWeeks(db: Db): Promise<string[]> {
  const rows = await db
    .select({ weekStarting: plans.weekStarting })
    .from(plans)
    .orderBy(asc(plans.weekStarting));
  return rows.map((row) => row.weekStarting);
}
