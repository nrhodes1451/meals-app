'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '@/db';
import type { Db } from '@/db';
import { shoppingListItems } from '@/db/schema';
import { getOrCreatePlan, isValidWeekStarting } from '@/lib/week';

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateWeek(week: string) {
  revalidatePath(`/plan/${week}`);
  revalidatePath(`/plan/${week}/list`);
}

function guard(week: string): ActionResult | null {
  if (!isValidWeekStarting(week)) {
    return { ok: false, error: 'That is not a Monday, so it is not the start of a week.' };
  }
  return null;
}

/**
 * Rows are created lazily: an untouched week has none, because quantities are derived and the
 * only thing worth storing is what someone did to the list. So every write is an upsert against
 * (plan, ingredient), and there is no unique index to lean on - the pair is only ever created
 * here, inside a transaction.
 */
async function updateItem(
  db: Db,
  planId: number,
  ingredientId: number,
  patch: { checked?: boolean; stapleOverride?: boolean },
): Promise<void> {
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: shoppingListItems.id })
      .from(shoppingListItems)
      .where(
        and(
          eq(shoppingListItems.planId, planId),
          eq(shoppingListItems.ingredientId, ingredientId),
          eq(shoppingListItems.manual, false),
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

    await tx.insert(shoppingListItems).values({ planId, ingredientId, ...patch });
  });
}

export async function setItemChecked(
  week: string,
  ingredientId: number,
  checked: boolean,
): Promise<ActionResult> {
  const invalid = guard(week);
  if (invalid) return invalid;

  const db = await getDb();
  const plan = await getOrCreatePlan(db, week);
  await updateItem(db, plan.id, ingredientId, { checked });

  revalidateWeek(week);
  return { ok: true };
}

/** Puts a suppressed pantry staple back on this week's list, or takes it off again. */
export async function setStapleOverride(
  week: string,
  ingredientId: number,
  restored: boolean,
): Promise<ActionResult> {
  const invalid = guard(week);
  if (invalid) return invalid;

  const db = await getDb();
  const plan = await getOrCreatePlan(db, week);
  await updateItem(db, plan.id, ingredientId, { stapleOverride: restored });

  revalidateWeek(week);
  return { ok: true };
}

export async function uncheckAll(week: string): Promise<ActionResult> {
  const invalid = guard(week);
  if (invalid) return invalid;

  const db = await getDb();
  const plan = await getOrCreatePlan(db, week);
  await db
    .update(shoppingListItems)
    .set({ checked: false, updatedAt: new Date() })
    .where(eq(shoppingListItems.planId, plan.id));

  revalidateWeek(week);
  return { ok: true };
}

/**
 * One-off items with no ingredient record: batteries, a birthday card. The schema carries
 * `freeText` and `manual` for exactly this, and the shopping list is the only screen that can
 * reach them.
 */
export async function addManualItem(week: string, text: string): Promise<ActionResult> {
  const invalid = guard(week);
  if (invalid) return invalid;

  const freeText = text.trim();
  if (!freeText) return { ok: false, error: 'Type what to add first.' };

  const db = await getDb();
  const plan = await getOrCreatePlan(db, week);
  await db.insert(shoppingListItems).values({ planId: plan.id, freeText, manual: true });

  revalidateWeek(week);
  return { ok: true };
}

export async function setManualChecked(
  week: string,
  itemId: number,
  checked: boolean,
): Promise<ActionResult> {
  const invalid = guard(week);
  if (invalid) return invalid;

  const db = await getDb();
  const plan = await getOrCreatePlan(db, week);
  await db
    .update(shoppingListItems)
    .set({ checked, updatedAt: new Date() })
    .where(and(eq(shoppingListItems.id, itemId), eq(shoppingListItems.planId, plan.id)));

  revalidateWeek(week);
  return { ok: true };
}

export async function removeManualItem(week: string, itemId: number): Promise<ActionResult> {
  const invalid = guard(week);
  if (invalid) return invalid;

  const db = await getDb();
  const plan = await getOrCreatePlan(db, week);
  await db
    .delete(shoppingListItems)
    .where(
      and(
        eq(shoppingListItems.id, itemId),
        eq(shoppingListItems.planId, plan.id),
        eq(shoppingListItems.manual, true),
        isNull(shoppingListItems.ingredientId),
      ),
    );

  revalidateWeek(week);
  return { ok: true };
}
