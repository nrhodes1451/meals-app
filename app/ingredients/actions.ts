'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import {
  categories,
  ingredientAliases,
  ingredients,
  recipeIngredients,
  unitEnum,
} from '@/db/schema';
import { parseAliases } from '@/lib/ingredients';
import type { Unit } from '@/lib/quantity';

export type ActionResult = { ok: true } | { ok: false; error: string };

const UNITS = new Set<string>(unitEnum.enumValues);

function done(): ActionResult {
  revalidatePath('/ingredients');
  // The aisle order and the staple flags both change what the list looks like.
  revalidatePath('/plan', 'layout');
  return { ok: true };
}

export async function setCategory(ingredientId: number, categoryId: number): Promise<ActionResult> {
  const db = await getDb();
  const category = await db.query.categories.findFirst({ where: eq(categories.id, categoryId) });
  if (!category) return { ok: false, error: 'That category no longer exists.' };

  await db.update(ingredients).set({ categoryId }).where(eq(ingredients.id, ingredientId));
  return done();
}

/**
 * The canonical name is what the shopping list prints, so it has to be correctable here. The
 * migration collapsed the source sheet's variants the wrong way round in at least one case -
 * "broccol" is canonical and "broccoli" is its alias - and this screen is where that gets fixed.
 *
 * `(name, frozen)` is unique, so a rename can collide with an existing row.
 */
export async function renameIngredient(
  ingredientId: number,
  value: string,
): Promise<ActionResult> {
  const name = value.trim();
  if (!name) return { ok: false, error: 'An ingredient needs a name.' };

  const db = await getDb();
  const row = await db.query.ingredients.findFirst({ where: eq(ingredients.id, ingredientId) });
  if (!row) return { ok: false, error: 'That ingredient no longer exists.' };
  if (row.name === name) return done();

  const clash = await db.query.ingredients.findFirst({
    where: and(
      eq(ingredients.name, name),
      eq(ingredients.frozen, row.frozen),
      ne(ingredients.id, ingredientId),
    ),
  });
  if (clash) {
    return {
      ok: false,
      error: `There is already a ${row.frozen ? 'frozen' : 'fresh'} "${name}". Merge the two rows instead.`,
    };
  }

  await db.update(ingredients).set({ name }).where(eq(ingredients.id, ingredientId));
  return done();
}

export async function setPantryStaple(
  ingredientId: number,
  pantryStaple: boolean,
): Promise<ActionResult> {
  const db = await getDb();
  await db.update(ingredients).set({ pantryStaple }).where(eq(ingredients.id, ingredientId));
  return done();
}

/**
 * Fresh and frozen are separate rows sharing a name, and `(name, frozen)` is unique, so flipping
 * this flag can collide with the row it would become a duplicate of.
 */
export async function setFrozen(ingredientId: number, frozen: boolean): Promise<ActionResult> {
  const db = await getDb();
  const row = await db.query.ingredients.findFirst({ where: eq(ingredients.id, ingredientId) });
  if (!row) return { ok: false, error: 'That ingredient no longer exists.' };

  const clash = await db.query.ingredients.findFirst({
    where: and(
      eq(ingredients.name, row.name),
      eq(ingredients.frozen, frozen),
      ne(ingredients.id, ingredientId),
    ),
  });
  if (clash) {
    return {
      ok: false,
      error: `There is already a ${frozen ? 'frozen' : 'fresh'} "${row.name}". Merge the two rows instead.`,
    };
  }

  await db.update(ingredients).set({ frozen }).where(eq(ingredients.id, ingredientId));
  return done();
}

export async function setPack(
  ingredientId: number,
  size: string,
  unit: Unit | '',
): Promise<ActionResult> {
  const db = await getDb();

  const trimmed = size.trim();
  let packSize: string | null = null;
  if (trimmed !== '') {
    const value = Number(trimmed);
    if (!Number.isFinite(value) || value <= 0) {
      return { ok: false, error: 'Pack size must be a number greater than zero.' };
    }
    packSize = String(Math.round(value * 100) / 100);
  }

  if (unit !== '' && !UNITS.has(unit)) {
    return { ok: false, error: 'That is not a unit this app knows.' };
  }
  if (packSize === null && unit !== '') {
    return { ok: false, error: 'A pack unit needs a pack size.' };
  }

  await db
    .update(ingredients)
    .set({ packSize, packUnit: unit === '' ? null : unit })
    .where(eq(ingredients.id, ingredientId));
  return done();
}

export async function setOcadoUrl(ingredientId: number, value: string): Promise<ActionResult> {
  const trimmed = value.trim();
  if (trimmed !== '' && !/^https?:\/\//i.test(trimmed)) {
    return { ok: false, error: 'Ocado URL must be a web address, or blank.' };
  }

  const db = await getDb();
  await db
    .update(ingredients)
    .set({ ocadoUrl: trimmed === '' ? null : trimmed })
    .where(eq(ingredients.id, ingredientId));
  return done();
}

export async function setAliases(ingredientId: number, value: string): Promise<ActionResult> {
  const db = await getDb();
  const wanted = parseAliases(value);

  // Aliases are unique across every ingredient, so a clash has to be reported rather than thrown.
  if (wanted.length) {
    const taken = await db
      .select({ alias: ingredientAliases.alias, ingredientId: ingredientAliases.ingredientId })
      .from(ingredientAliases)
      .where(and(inArray(ingredientAliases.alias, wanted), ne(ingredientAliases.ingredientId, ingredientId)));

    if (taken.length) {
      return {
        ok: false,
        error: `"${taken[0].alias}" already belongs to another ingredient.`,
      };
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(ingredientAliases).where(eq(ingredientAliases.ingredientId, ingredientId));
    if (wanted.length) {
      await tx
        .insert(ingredientAliases)
        .values(wanted.map((alias) => ({ ingredientId, alias })));
    }
  });

  return done();
}

export async function bulkSetCategory(ids: number[], categoryId: number): Promise<ActionResult> {
  if (!ids.length) return { ok: false, error: 'Nothing is selected.' };
  const db = await getDb();
  await db.update(ingredients).set({ categoryId }).where(inArray(ingredients.id, ids));
  return done();
}

export async function bulkTogglePantry(ids: number[]): Promise<ActionResult> {
  if (!ids.length) return { ok: false, error: 'Nothing is selected.' };
  const db = await getDb();
  await db
    .update(ingredients)
    .set({ pantryStaple: sql`not ${ingredients.pantryStaple}` })
    .where(inArray(ingredients.id, ids));
  return done();
}

export async function createIngredient(name: string, categoryId: number): Promise<ActionResult> {
  const db = await getDb();
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: 'Give the ingredient a name.' };

  const clash = await db.query.ingredients.findFirst({
    where: and(eq(ingredients.name, trimmed), eq(ingredients.frozen, false)),
  });
  if (clash) return { ok: false, error: `"${trimmed}" is already in the list.` };

  const slugBase = trimmed.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const existing = await db.select({ slug: ingredients.slug }).from(ingredients);
  const taken = new Set(existing.map((row) => row.slug));
  let slug = slugBase || 'ingredient';
  for (let n = 2; taken.has(slug); n += 1) slug = `${slugBase}-${n}`;

  await db.insert(ingredients).values({ slug, name: trimmed, categoryId });
  return done();
}

/** Only ever allowed for an ingredient no recipe refers to, so no recipe silently loses a line. */
export async function deleteIngredient(id: number): Promise<ActionResult> {
  const db = await getDb();
  const [used] = await db
    .select({ count: sql<number>`count(*)` })
    .from(recipeIngredients)
    .where(eq(recipeIngredients.ingredientId, id));

  if (Number(used.count) > 0) {
    return { ok: false, error: 'Recipes still use this ingredient, so it cannot be deleted.' };
  }

  await db.delete(ingredients).where(eq(ingredients.id, id));
  return done();
}

/**
 * Aisle order drives the shopping list section order, which is the whole point of the panel.
 * Positions are rewritten as a dense 1..n sequence so a gap can never build up.
 */
export async function moveCategory(id: number, direction: -1 | 1): Promise<ActionResult> {
  const db = await getDb();
  const rows = await db.select().from(categories).orderBy(categories.position);

  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return { ok: false, error: 'That category no longer exists.' };

  const target = index + direction;
  if (target < 0 || target >= rows.length) return { ok: true };

  const reordered = [...rows];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

  await db.transaction(async (tx) => {
    // Two passes, into a range nothing else occupies, because `position` is not unique but the
    // list has to stay readable if this ever half-fails.
    for (const [position, row] of reordered.entries()) {
      await tx
        .update(categories)
        .set({ position: position + 1000 })
        .where(eq(categories.id, row.id));
    }
    for (const [position, row] of reordered.entries()) {
      await tx
        .update(categories)
        .set({ position: position + 1 })
        .where(eq(categories.id, row.id));
    }
  });

  return done();
}
