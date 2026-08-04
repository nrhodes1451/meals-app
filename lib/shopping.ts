import { asc, eq } from 'drizzle-orm';
import type { Db } from '@/db';
import { categories, ingredients, shoppingListItems } from '@/db/schema';
import {
  buildShoppingList,
  type CategoryMeta,
  type IngredientMeta,
  type ListState,
  type PlannedMeal,
  type ShoppingList,
} from './aggregate';
import { loadPlan } from './plan';
import type { Plan } from './week';

/**
 * Per-shop state only. Quantities are derived on read, never stored, so a row here exists purely
 * because someone ticked something, added something by hand, or pulled a staple back onto the
 * list. Rows are created lazily for that reason - an untouched week has none.
 *
 * A row whose ingredient has since dropped out of the plan is left alone rather than deleted, so
 * re-rolling back to that meal restores the tick instead of quietly losing it.
 */
export async function loadListState(db: Db, planId: number): Promise<ListState> {
  const rows = await db
    .select()
    .from(shoppingListItems)
    .where(eq(shoppingListItems.planId, planId))
    .orderBy(asc(shoppingListItems.id));

  const checked = new Set<number>();
  const stapleOverrides = new Set<number>();
  const manual: ListState['manual'] = [];

  for (const row of rows) {
    if (row.manual) {
      manual.push({ id: row.id, freeText: row.freeText ?? '', checked: row.checked });
      continue;
    }
    if (row.ingredientId === null) continue;
    if (row.checked) checked.add(row.ingredientId);
    if (row.stapleOverride) stapleOverrides.add(row.ingredientId);
  }

  return { checked, stapleOverrides, manual };
}

export async function loadIngredientMeta(
  db: Db,
): Promise<{ ingredients: Map<number, IngredientMeta>; categories: CategoryMeta[] }> {
  const [ingredientRows, categoryRows] = await Promise.all([
    db.select().from(ingredients),
    db.select().from(categories).orderBy(asc(categories.position)),
  ]);

  return {
    ingredients: new Map(
      ingredientRows.map((row) => [
        row.id,
        {
          id: row.id,
          name: row.name,
          frozen: row.frozen,
          pantryStaple: row.pantryStaple,
          categoryId: row.categoryId,
          packSize: row.packSize === null ? null : Number(row.packSize),
          packUnit: row.packUnit,
        },
      ]),
    ),
    categories: categoryRows.map((row) => ({
      id: row.id,
      name: row.name,
      position: row.position,
    })),
  };
}

export type WeekList = { plan: Plan; list: ShoppingList };

/**
 * The list for a week, recomputed from the plan every time. There is no generate step and there
 * must not be one: the planner rail and this are the same derivation.
 */
export async function loadWeekList(db: Db, weekStarting: string): Promise<WeekList> {
  const { plan, slots } = await loadPlan(db, weekStarting);
  const [meta, state] = await Promise.all([
    loadIngredientMeta(db),
    loadListState(db, plan.id),
  ]);

  const meals: PlannedMeal[] = slots
    .filter((slot) => slot.recipe !== null)
    .map((slot) => ({
      position: slot.position,
      recipeId: slot.recipe!.id,
      recipeName: slot.recipe!.name,
      lines: slot.recipe!.lines.map((line) => ({
        ingredientId: line.ingredientId,
        amount: line.amount,
        unit: line.unit,
      })),
    }));

  return {
    plan,
    list: buildShoppingList(meals, meta.ingredients, meta.categories, state),
  };
}
