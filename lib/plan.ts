import { asc, eq } from 'drizzle-orm';
import type { Db } from '@/db';
import { planSlots } from '@/db/schema';
import { loadRecipes, type RecipeRow } from './recipes';
import type { SlotState } from './roll';
import { getOrCreatePlan, type Plan } from './week';

export type PlanSlot = SlotState & {
  id: number;
  eaten: boolean;
  skipIngredients: boolean;
  recipe: RecipeRow | null;
};

export type LoadedPlan = {
  plan: Plan;
  slots: PlanSlot[];
  recipes: RecipeRow[];
};

export async function loadSlots(db: Db, planId: number): Promise<
  {
    id: number;
    position: number;
    recipeId: number | null;
    locked: boolean;
    eaten: boolean;
    skipIngredients: boolean;
  }[]
> {
  return db
    .select()
    .from(planSlots)
    .where(eq(planSlots.planId, planId))
    .orderBy(asc(planSlots.position));
}

/**
 * The planner, This Week and the shopping list all need the same thing: the week's seven slots
 * with their recipes, and the library to roll from.
 */
export async function loadPlan(db: Db, weekStarting: string): Promise<LoadedPlan> {
  const plan = await getOrCreatePlan(db, weekStarting);
  const [rows, recipes] = await Promise.all([
    loadSlots(db, plan.id),
    loadRecipes(db, weekStarting),
  ]);

  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  return {
    plan,
    recipes,
    slots: rows.map((row) => ({
      id: row.id,
      position: row.position,
      recipeId: row.recipeId,
      locked: row.locked,
      eaten: row.eaten,
      skipIngredients: row.skipIngredients,
      recipe: row.recipeId === null ? null : (byId.get(row.recipeId) ?? null),
    })),
  };
}
