import { asc, eq } from 'drizzle-orm';
import type { Db } from '@/db';
import { ingredients, recipeIngredients, recipes } from '@/db/schema';
import { ingredientName } from './format';
import { lastEatenWeeks } from './history';
import type { Unit } from './quantity';
import { currentWeekStarting } from './week';

export type RecipeLine = {
  id: number;
  ingredientId: number;
  name: string;
  amount: number | null;
  unit: Unit | null;
  position: number;
};

export type RecipeRow = {
  id: number;
  slug: string;
  name: string;
  servings: number;
  vegetarian: boolean;
  keto: boolean;
  archived: boolean;
  timeHours: number | null;
  method: string | null;
  sourceUrl: string | null;
  lines: RecipeLine[];
  /** Whole weeks since this was last in a plan. Null means never. */
  lastEaten: number | null;
};

/**
 * The whole library is 170 recipes and 872 ingredient lines, so it is loaded in two queries and
 * filtered in memory. That keeps the filter rules in one pure function that can be tested, rather
 * than spread across SQL predicates, and at this scale costs nothing.
 */
export async function loadRecipes(db: Db, relativeTo = currentWeekStarting()): Promise<RecipeRow[]> {
  const [recipeRows, lineRows, eaten] = await Promise.all([
    db.select().from(recipes).orderBy(asc(recipes.name)),
    db
      .select({
        id: recipeIngredients.id,
        recipeId: recipeIngredients.recipeId,
        ingredientId: recipeIngredients.ingredientId,
        amount: recipeIngredients.amount,
        unit: recipeIngredients.unit,
        position: recipeIngredients.position,
        name: ingredients.name,
        frozen: ingredients.frozen,
      })
      .from(recipeIngredients)
      .innerJoin(ingredients, eq(ingredients.id, recipeIngredients.ingredientId))
      .orderBy(asc(recipeIngredients.recipeId), asc(recipeIngredients.position)),
    lastEatenWeeks(db, relativeTo),
  ]);

  const linesByRecipe = new Map<number, RecipeLine[]>();
  for (const line of lineRows) {
    const list = linesByRecipe.get(line.recipeId) ?? [];
    list.push({
      id: line.id,
      ingredientId: line.ingredientId,
      name: ingredientName(line),
      amount: line.amount === null ? null : Number(line.amount),
      unit: line.unit,
      position: line.position,
    });
    linesByRecipe.set(line.recipeId, list);
  }

  return recipeRows.map((recipe) => ({
    id: recipe.id,
    slug: recipe.slug,
    name: recipe.name,
    servings: recipe.servings,
    vegetarian: recipe.vegetarian,
    keto: recipe.keto,
    archived: recipe.archived,
    timeHours: recipe.timeHours === null ? null : Number(recipe.timeHours),
    method: recipe.method,
    sourceUrl: recipe.sourceUrl,
    lines: linesByRecipe.get(recipe.id) ?? [],
    lastEaten: eaten.get(recipe.id) ?? null,
  }));
}

export type Diet = 'all' | 'veg' | 'meat';
export type Sort = 'name' | 'time' | 'last';

export type LibraryFilters = {
  query: string;
  ingredientId: number | null;
  diet: Diet;
  /** Max cook time in minutes. Null is no restriction. */
  maxMinutes: number | null;
  ketoOnly: boolean;
  includeArchived: boolean;
  sort: Sort;
};

export const DEFAULT_FILTERS: LibraryFilters = {
  query: '',
  ingredientId: null,
  diet: 'all',
  maxMinutes: null,
  ketoOnly: false,
  includeArchived: false,
  sort: 'name',
};

export function minutesOf(timeHours: number | null): number | null {
  return timeHours === null ? null : Math.round(timeHours * 60);
}

export function filterRecipes(rows: RecipeRow[], filters: LibraryFilters): RecipeRow[] {
  const query = filters.query.trim().toLowerCase();

  const matched = rows.filter((recipe) => {
    // 57 of 170 recipes are archived legacy dishes. CLAUDE.md keeps them out of the default view.
    if (recipe.archived && !filters.includeArchived) return false;
    if (query && !recipe.name.toLowerCase().includes(query)) return false;
    if (filters.ingredientId !== null) {
      if (!recipe.lines.some((line) => line.ingredientId === filters.ingredientId)) return false;
    }
    if (filters.diet === 'veg' && !recipe.vegetarian) return false;
    if (filters.diet === 'meat' && recipe.vegetarian) return false;
    if (filters.ketoOnly && !recipe.keto) return false;
    if (filters.maxMinutes !== null) {
      const minutes = minutesOf(recipe.timeHours);
      // A recipe with no time recorded is not known to be quick, so a time limit excludes it.
      if (minutes === null || minutes > filters.maxMinutes) return false;
    }
    return true;
  });

  return sortRecipes(matched, filters.sort);
}

export function sortRecipes(rows: RecipeRow[], sort: Sort): RecipeRow[] {
  const byName = (a: RecipeRow, b: RecipeRow) => a.name.localeCompare(b.name, 'en-GB');

  if (sort === 'time') {
    return [...rows].sort((a, b) => {
      const left = minutesOf(a.timeHours);
      const right = minutesOf(b.timeHours);
      if (left === null && right === null) return byName(a, b);
      if (left === null) return 1;
      if (right === null) return -1;
      return left - right || byName(a, b);
    });
  }

  if (sort === 'last') {
    // Longest since eaten first, and never-eaten before everything.
    return [...rows].sort((a, b) => {
      const left = a.lastEaten ?? Number.POSITIVE_INFINITY;
      const right = b.lastEaten ?? Number.POSITIVE_INFINITY;
      return right - left || byName(a, b);
    });
  }

  return [...rows].sort(byName);
}

/** The canonical ingredient list for the filter select and the editor datalist. */
export async function loadIngredientOptions(db: Db) {
  const rows = await db
    .select({
      id: ingredients.id,
      name: ingredients.name,
      frozen: ingredients.frozen,
    })
    .from(ingredients)
    .orderBy(asc(ingredients.name));

  return rows
    .map((row) => ({ id: row.id, name: ingredientName(row) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
}
