'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, isNotNull, ne, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { planSlots, recipeIngredients, recipes, unitEnum } from '@/db/schema';
import { validateFields, validateQuantity } from '@/lib/recipe-fields';
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

export async function saveRecipe(input: RecipeInput): Promise<ActionResult> {
  const db = await getDb();

  const fields = validateFields(input);
  if (!fields.ok) return fields;
  const { name } = fields.value;

  const lines: { ingredientId: number; amount: string | null; unit: Unit | null }[] = [];
  for (const [index, line] of input.lines.entries()) {
    if (!Number.isInteger(line.ingredientId) || line.ingredientId <= 0) {
      return { ok: false, error: `Line ${index + 1} has no ingredient.` };
    }
    const quantity = validateQuantity(line.amount, line.unit, index + 1, unitEnum.enumValues);
    if (!quantity.ok) return quantity;
    lines.push({ ingredientId: line.ingredientId, ...quantity.value });
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
        ...fields.value,
        slug,
        vegetarian: input.vegetarian,
        keto: input.keto,
        archived: input.archived,
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
  redirect(`/recipes/${slug}?edit=1`);
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
