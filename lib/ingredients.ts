import { asc, eq, sql } from 'drizzle-orm';
import type { Db } from '@/db';
import { categories, ingredientAliases, ingredients, recipeIngredients } from '@/db/schema';
import type { Unit } from './quantity';

export type CategoryRow = { id: number; name: string; position: number; count: number };

export type IngredientRow = {
  id: number;
  slug: string;
  name: string;
  categoryId: number;
  frozen: boolean;
  pantryStaple: boolean;
  packSize: number | null;
  packUnit: Unit | null;
  aliases: string[];
  /** Recipes referring to this ingredient. Zero means it is safe to delete. */
  uses: number;
};

export async function loadCategories(db: Db): Promise<CategoryRow[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      position: categories.position,
      count: sql<number>`count(${ingredients.id})`,
    })
    .from(categories)
    .leftJoin(ingredients, eq(ingredients.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.position));

  return rows.map((row) => ({ ...row, count: Number(row.count) }));
}

export async function loadIngredients(db: Db): Promise<IngredientRow[]> {
  const [rows, aliasRows, useRows] = await Promise.all([
    db.select().from(ingredients).orderBy(asc(ingredients.name)),
    db.select().from(ingredientAliases).orderBy(asc(ingredientAliases.alias)),
    db
      .select({
        ingredientId: recipeIngredients.ingredientId,
        count: sql<number>`count(*)`,
      })
      .from(recipeIngredients)
      .groupBy(recipeIngredients.ingredientId),
  ]);

  const aliases = new Map<number, string[]>();
  for (const row of aliasRows) {
    aliases.set(row.ingredientId, [...(aliases.get(row.ingredientId) ?? []), row.alias]);
  }
  const uses = new Map(useRows.map((row) => [row.ingredientId, Number(row.count)]));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    categoryId: row.categoryId,
    frozen: row.frozen,
    pantryStaple: row.pantryStaple,
    packSize: row.packSize === null ? null : Number(row.packSize),
    packUnit: row.packUnit,
    aliases: aliases.get(row.id) ?? [],
    uses: uses.get(row.id) ?? 0,
  }));
}

/**
 * The filter matches aliases as well as names, which is the point of the alias table: the source
 * sheet held broccol and broccoli separately, and searching either has to find the one row.
 */
export function filterIngredients(rows: IngredientRow[], query: string): IngredientRow[] {
  const term = query.trim().toLowerCase();
  if (!term) return rows;
  return rows.filter(
    (row) =>
      row.name.toLowerCase().includes(term) ||
      row.aliases.some((alias) => alias.toLowerCase().includes(term)),
  );
}

/** Comma-separated in the UI, one row each in the database. */
export function parseAliases(value: string): string[] {
  const seen = new Set<string>();
  for (const part of value.split(',')) {
    const alias = part.trim().toLowerCase();
    if (alias) seen.add(alias);
  }
  return [...seen];
}
