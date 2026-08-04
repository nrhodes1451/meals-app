import { minutesOf, type RecipeRow } from './recipes';

export type RollFilters = {
  vegetarianOnly: boolean;
  /** Max cook time in minutes. Null is no restriction. */
  maxMinutes: number | null;
  /** Exclude anything eaten within this many weeks. Null is no restriction. */
  excludeWeeks: number | null;
};

export const DEFAULT_ROLL_FILTERS: RollFilters = {
  vegetarianOnly: false,
  maxMinutes: null,
  excludeWeeks: null,
};

export type SlotState = { position: number; recipeId: number | null; locked: boolean };

/**
 * Recipes a slot could take. Archived recipes are never in the pool - 57 of the 170 are legacy
 * keto and meat dishes kept only for history - which the design handoff's filter omits.
 *
 * `taken` prevents the same recipe appearing twice in one week.
 */
export function poolFor(
  recipes: RecipeRow[],
  filters: RollFilters,
  taken: Iterable<number> = [],
): RecipeRow[] {
  const used = new Set(taken);

  return recipes.filter((recipe) => {
    if (recipe.archived) return false;
    if (used.has(recipe.id)) return false;
    if (filters.vegetarianOnly && !recipe.vegetarian) return false;

    if (filters.maxMinutes !== null) {
      const minutes = minutesOf(recipe.timeHours);
      // No recorded time is not evidence of being quick.
      if (minutes === null || minutes > filters.maxMinutes) return false;
    }

    if (filters.excludeWeeks !== null) {
      // Null means never eaten, which can never be too recent.
      if (recipe.lastEaten !== null && recipe.lastEaten < filters.excludeWeeks) return false;
    }

    return true;
  });
}

/** The count shown as "N of M in pool": what the filters allow, before this week is deducted. */
export function poolSize(recipes: RecipeRow[], filters: RollFilters): number {
  return poolFor(recipes, filters).length;
}

export type Pick = (count: number) => number;

const randomPick: Pick = (count) => Math.floor(Math.random() * count);

/**
 * One slot. Returns null when the filters leave nothing to choose, and the caller leaves the slot
 * as it was rather than clearing it - an empty pool should not cost you the meal you already had.
 */
export function rollOne(
  recipes: RecipeRow[],
  slots: SlotState[],
  position: number,
  filters: RollFilters,
  pick: Pick = randomPick,
): number | null {
  const taken = slots
    .filter((slot) => slot.position !== position && slot.recipeId !== null)
    .map((slot) => slot.recipeId!);

  const pool = poolFor(recipes, filters, taken);
  if (!pool.length) return null;
  return pool[pick(pool.length)].id;
}

/**
 * The whole week, skipping locked slots and treating what they hold as taken so nothing is
 * duplicated. Returns the new recipe id per position, only for the slots that changed.
 *
 * Iterates the slots it is given rather than a fixed seven: a week holds however many meals it
 * has been given, and rolling it must not invent positions that do not exist.
 */
export function rollWeek(
  recipes: RecipeRow[],
  slots: SlotState[],
  filters: RollFilters,
  pick: Pick = randomPick,
): Map<number, number> {
  const taken = new Set(
    slots.filter((slot) => slot.locked && slot.recipeId !== null).map((slot) => slot.recipeId!),
  );
  const changed = new Map<number, number>();

  for (const slot of [...slots].sort((a, b) => a.position - b.position)) {
    if (slot.locked) continue;

    const pool = poolFor(recipes, filters, taken);
    if (!pool.length) continue;

    const chosen = pool[pick(pool.length)];
    taken.add(chosen.id);
    changed.set(slot.position, chosen.id);
  }

  return changed;
}
