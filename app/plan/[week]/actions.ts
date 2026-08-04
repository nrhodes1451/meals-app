'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { planSlots } from '@/db/schema';
import { loadPlan, loadSlots } from '@/lib/plan';
import { rollOne, rollWeek, type RollFilters } from '@/lib/roll';
import {
  getOrCreatePlan,
  isValidWeekStarting,
  MAX_SLOT_COUNT,
  MIN_SLOT_COUNT,
} from '@/lib/week';

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateWeek(week: string) {
  revalidatePath(`/plan/${week}`);
  revalidatePath(`/plan/${week}/cooked`);
  revalidatePath(`/plan/${week}/list`);
}

function guard(week: string): ActionResult | null {
  if (!isValidWeekStarting(week)) {
    return { ok: false, error: 'That is not a Monday, so it is not the start of a week.' };
  }
  return null;
}

export async function setSlotRecipe(
  week: string,
  position: number,
  recipeId: number | null,
): Promise<ActionResult> {
  const invalid = guard(week);
  if (invalid) return invalid;

  const db = await getDb();
  const plan = await getOrCreatePlan(db, week);

  await db
    .update(planSlots)
    .set({ recipeId })
    .where(and(eq(planSlots.planId, plan.id), eq(planSlots.position, position)));

  revalidateWeek(week);
  return { ok: true };
}

export async function setSlotLocked(
  week: string,
  position: number,
  locked: boolean,
): Promise<ActionResult> {
  const invalid = guard(week);
  if (invalid) return invalid;

  const db = await getDb();
  const plan = await getOrCreatePlan(db, week);

  await db
    .update(planSlots)
    .set({ locked })
    .where(and(eq(planSlots.planId, plan.id), eq(planSlots.position, position)));

  revalidateWeek(week);
  return { ok: true };
}

export async function unlockAll(week: string): Promise<ActionResult> {
  const invalid = guard(week);
  if (invalid) return invalid;

  const db = await getDb();
  const plan = await getOrCreatePlan(db, week);
  await db.update(planSlots).set({ locked: false }).where(eq(planSlots.planId, plan.id));

  revalidateWeek(week);
  return { ok: true };
}

export async function rollSlot(
  week: string,
  position: number,
  filters: RollFilters,
): Promise<ActionResult> {
  const invalid = guard(week);
  if (invalid) return invalid;

  const db = await getDb();
  const { plan, slots, recipes } = await loadPlan(db, week);

  const slot = slots.find((candidate) => candidate.position === position);
  if (slot?.locked) return { ok: false, error: 'That meal is locked. Unlock it to re-roll it.' };

  const chosen = rollOne(recipes, slots, position, filters);
  if (chosen === null) {
    return { ok: false, error: 'Nothing in the library matches those filters. Widen them.' };
  }

  await db
    .update(planSlots)
    .set({ recipeId: chosen })
    .where(and(eq(planSlots.planId, plan.id), eq(planSlots.position, position)));

  revalidateWeek(week);
  return { ok: true };
}

export async function rollTheWeek(week: string, filters: RollFilters): Promise<ActionResult> {
  const invalid = guard(week);
  if (invalid) return invalid;

  const db = await getDb();
  const { plan, slots, recipes } = await loadPlan(db, week);

  const changed = rollWeek(recipes, slots, filters);
  if (!changed.size) {
    const everythingLocked = slots.every((slot) => slot.locked);
    return {
      ok: false,
      error: everythingLocked
        ? 'Every meal is locked, so there is nothing to roll.'
        : 'Nothing in the library matches those filters. Widen them.',
    };
  }

  await db.transaction(async (tx) => {
    for (const [position, recipeId] of changed) {
      await tx
        .update(planSlots)
        .set({ recipeId })
        .where(and(eq(planSlots.planId, plan.id), eq(planSlots.position, position)));
    }
  });

  revalidateWeek(week);
  return { ok: true };
}

/** The library's ADD button drops a recipe into the first unlocked, empty day. */
export async function addToWeek(week: string, recipeId: number): Promise<ActionResult> {
  const invalid = guard(week);
  if (invalid) return invalid;

  const db = await getDb();
  const plan = await getOrCreatePlan(db, week);
  const slots = await loadSlots(db, plan.id);

  const target =
    slots.find((slot) => !slot.locked && slot.recipeId === null) ??
    slots.find((slot) => !slot.locked);

  if (!target) return { ok: false, error: 'Every meal is locked. Unlock one first.' };
  if (slots.some((slot) => slot.recipeId === recipeId)) {
    return { ok: false, error: 'That recipe is already in this week.' };
  }

  await db.update(planSlots).set({ recipeId }).where(eq(planSlots.id, target.id));

  revalidateWeek(week);
  revalidatePath('/recipes');
  return { ok: true };
}

/**
 * Weeks are not seven meals long. Six one week, eight the next - the slot count is whatever this
 * particular week needs, so it can be grown and shrunk here.
 */
export async function addSlot(week: string): Promise<ActionResult> {
  const invalid = guard(week);
  if (invalid) return invalid;

  const db = await getDb();
  const plan = await getOrCreatePlan(db, week);
  const slots = await loadSlots(db, plan.id);

  if (slots.length >= MAX_SLOT_COUNT) {
    return { ok: false, error: `A week holds at most ${MAX_SLOT_COUNT} meals.` };
  }

  // Positions are contiguous, so the next one is the count.
  await db.insert(planSlots).values({ planId: plan.id, position: slots.length });

  revalidateWeek(week);
  return { ok: true };
}

/**
 * Removing a meal closes the gap behind it: positions stay contiguous from zero, because they
 * are what numbers the meals on every screen. Shifting downwards in ascending order is safe
 * against the unique index on (plan, position) - each target is vacated before it is written.
 */
export async function removeSlot(week: string, position: number): Promise<ActionResult> {
  const invalid = guard(week);
  if (invalid) return invalid;

  const db = await getDb();
  const plan = await getOrCreatePlan(db, week);
  const slots = await loadSlots(db, plan.id);

  if (slots.length <= MIN_SLOT_COUNT) {
    return { ok: false, error: 'A week needs at least one meal.' };
  }
  if (!slots.some((slot) => slot.position === position)) {
    return { ok: false, error: 'That meal is no longer in the week.' };
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(planSlots)
      .where(and(eq(planSlots.planId, plan.id), eq(planSlots.position, position)));

    const after = slots
      .filter((slot) => slot.position > position)
      .sort((a, b) => a.position - b.position);

    for (const slot of after) {
      await tx
        .update(planSlots)
        .set({ position: slot.position - 1 })
        .where(eq(planSlots.id, slot.id));
    }
  });

  revalidateWeek(week);
  return { ok: true };
}

export async function setSlotEaten(
  week: string,
  position: number,
  eaten: boolean,
): Promise<ActionResult> {
  const invalid = guard(week);
  if (invalid) return invalid;

  const db = await getDb();
  const plan = await getOrCreatePlan(db, week);

  await db
    .update(planSlots)
    .set({ eaten })
    .where(and(eq(planSlots.planId, plan.id), eq(planSlots.position, position)));

  revalidateWeek(week);
  return { ok: true };
}

export async function clearEaten(week: string): Promise<ActionResult> {
  const invalid = guard(week);
  if (invalid) return invalid;

  const db = await getDb();
  const plan = await getOrCreatePlan(db, week);
  await db.update(planSlots).set({ eaten: false }).where(eq(planSlots.planId, plan.id));

  revalidateWeek(week);
  return { ok: true };
}
