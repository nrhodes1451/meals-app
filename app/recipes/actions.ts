'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, isNotNull, ne, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { planSlots, recipeIngredients, recipes, unitEnum } from '@/db/schema';
import { slugify, uniqueSlug } from '@/lib/slug';
import type { Unit } from '@/lib/quantity';

export type LineInput = {
  ingredientId: number;
  /** Blank means "some": the recipe needs it but the amount was never worth recording. */
  amount: string;
  unit: Unit | '';
};

export type RecipeInput = {
  id: number;
  name: string;
  servings: string;
  /** Minutes, which is how cook time is read and written. Stored as hours. */
  minutes: string;
  vegetarian: boolean;
  keto: boolean;
  archived: boolean;
  sourceUrl: string;
  method: string;
  lines: LineInput[];
};

export type ActionResult = { ok: true } | { ok: false; error: string };

const UNITS = new Set<string>(unitEnum.enumValues);

/** Numeric columns are strings over the wire and must not be handed junk. */
function parseAmount(value: string): { ok: true; value: string | null } | { ok: false } {
  const trimmed = value.trim();
  if (trimmed === '') return { ok: true, value: null };
  const number = Number(trimmed);
  if (!Number.isFinite(number) || number < 0) return { ok: false };
  return { ok: true, value: String(Math.round(number * 100) / 100) };
}

export async function saveRecipe(input: RecipeInput): Promise<ActionResult> {
  const db = await getDb();

  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Give the recipe a name.' };

  const servings = Number(input.servings);
  if (!Number.isInteger(servings) || servings < 1) {
    return { ok: false, error: 'Servings must be a whole number, 1 or more.' };
  }

  let timeHours: string | null = null;
  if (input.minutes.trim() !== '') {
    const minutes = Number(input.minutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return { ok: false, error: 'Cook time must be a number of minutes.' };
    }
    timeHours = String(Math.round((minutes / 60) * 100) / 100);
  }

  const sourceUrl = input.sourceUrl.trim();
  if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) {
    return { ok: false, error: 'The source link needs to start with http:// or https://.' };
  }

  const lines: { ingredientId: number; amount: string | null; unit: Unit | null }[] = [];
  for (const [index, line] of input.lines.entries()) {
    if (!Number.isInteger(line.ingredientId) || line.ingredientId <= 0) {
      return { ok: false, error: `Line ${index + 1} has no ingredient.` };
    }
    const amount = parseAmount(line.amount);
    if (!amount.ok) {
      return { ok: false, error: `Line ${index + 1} has an amount that is not a number.` };
    }
    if (line.unit !== '' && !UNITS.has(line.unit)) {
      return { ok: false, error: `Line ${index + 1} has a unit this app does not know.` };
    }
    lines.push({
      ingredientId: line.ingredientId,
      amount: amount.value,
      unit: line.unit === '' ? null : line.unit,
    });
  }

  const current = await db.query.recipes.findFirst({ where: eq(recipes.id, input.id) });
  if (!current) return { ok: false, error: 'That recipe no longer exists.' };

  // The slug follows the name. Nothing outside this app links to a recipe, so a readable URL is
  // worth more than a stable one.
  let slug = current.slug;
  if (slugify(name) !== current.slug) {
    const others = await db
      .select({ slug: recipes.slug })
      .from(recipes)
      .where(ne(recipes.id, input.id));
    slug = uniqueSlug(slugify(name), others.map((row) => row.slug));
  }

  await db.transaction(async (tx) => {
    await tx
      .update(recipes)
      .set({
        name,
        slug,
        servings,
        timeHours,
        vegetarian: input.vegetarian,
        keto: input.keto,
        archived: input.archived,
        // Independent fields. A recipe can have a link and notes, or one, or neither.
        sourceUrl: sourceUrl || null,
        method: input.method.trim() || null,
      })
      .where(eq(recipes.id, input.id));

    await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, input.id));

    if (lines.length) {
      await tx.insert(recipeIngredients).values(
        lines.map((line, position) => ({
          recipeId: input.id,
          ingredientId: line.ingredientId,
          amount: line.amount,
          unit: line.unit,
          position,
        })),
      );
    }
  });

  revalidatePath('/recipes');
  revalidatePath(`/recipes/${slug}`);

  if (slug !== current.slug) redirect(`/recipes/${slug}`);
  return { ok: true };
}

export async function createRecipe() {
  const db = await getDb();
  const existing = await db.select({ slug: recipes.slug }).from(recipes);
  const slug = uniqueSlug('new-recipe', existing.map((row) => row.slug));

  await db.insert(recipes).values({ slug, name: 'New recipe', servings: 2 });

  revalidatePath('/recipes');
  redirect(`/recipes/${slug}`);
}

/**
 * The design offers a destructive delete. A recipe that has been cooked is part of the plan history
 * that "last eaten" is derived from, so deleting it would rewrite the past. Those are archived
 * instead, which is what CLAUDE.md says the archived flag is for.
 */
export async function deleteRecipe(id: number): Promise<ActionResult> {
  const db = await getDb();

  const [used] = await db
    .select({ count: sql<number>`count(*)` })
    .from(planSlots)
    .where(and(eq(planSlots.recipeId, id), isNotNull(planSlots.recipeId)));

  if (Number(used.count) > 0) {
    await db.update(recipes).set({ archived: true }).where(eq(recipes.id, id));
    revalidatePath('/recipes');
    return {
      ok: false,
      error:
        'This recipe has been cooked, so it is part of the plan history. It has been archived instead of deleted.',
    };
  }

  await db.transaction(async (tx) => {
    await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
    await tx.delete(recipes).where(eq(recipes.id, id));
  });

  revalidatePath('/recipes');
  redirect('/recipes');
}
