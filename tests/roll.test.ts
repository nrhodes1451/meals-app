import { describe, expect, it } from 'vitest';
import type { RecipeRow } from '@/lib/recipes';
import { poolFor, rollOne, rollWeek, type RollFilters, type SlotState } from '@/lib/roll';

const recipe = (id: number, overrides: Partial<RecipeRow> = {}): RecipeRow => ({
  id,
  slug: `recipe-${id}`,
  name: `Recipe ${id}`,
  servings: 2,
  vegetarian: true,
  keto: false,
  archived: false,
  timeHours: 0.5,
  method: null,
  sourceUrl: null,
  lines: [],
  lastEaten: null,
  ...overrides,
});

const none: RollFilters = { vegetarianOnly: false, maxMinutes: null, excludeWeeks: null };

const slots = (ids: (number | null)[], locked: number[] = []): SlotState[] =>
  ids.map((recipeId, position) => ({ position, recipeId, locked: locked.includes(position) }));

/** Deterministic: always take the first candidate. */
const first = () => 0;

describe('the pool', () => {
  it('never contains an archived recipe', () => {
    const pool = poolFor([recipe(1), recipe(2, { archived: true })], none);
    expect(pool.map((r) => r.id)).toEqual([1]);
  });

  it('drops non-vegetarian recipes when the filter is on', () => {
    const rows = [recipe(1), recipe(2, { vegetarian: false })];
    expect(poolFor(rows, { ...none, vegetarianOnly: true }).map((r) => r.id)).toEqual([1]);
  });

  it('drops anything over the time limit, and anything with no time recorded', () => {
    const rows = [
      recipe(1, { timeHours: 0.25 }),
      recipe(2, { timeHours: 1 }),
      recipe(3, { timeHours: null }),
    ];
    expect(poolFor(rows, { ...none, maxMinutes: 30 }).map((r) => r.id)).toEqual([1]);
  });

  it('drops anything eaten more recently than the exclusion window', () => {
    const rows = [
      recipe(1, { lastEaten: 1 }),
      recipe(2, { lastEaten: 3 }),
      recipe(3, { lastEaten: null }),
    ];
    expect(poolFor(rows, { ...none, excludeWeeks: 2 }).map((r) => r.id)).toEqual([2, 3]);
  });

  it('excludes what the week already holds', () => {
    const rows = [recipe(1), recipe(2), recipe(3)];
    expect(poolFor(rows, none, [1, 3]).map((r) => r.id)).toEqual([2]);
  });
});

describe('rolling one slot', () => {
  const rows = [recipe(1), recipe(2), recipe(3)];

  it('never picks a recipe already elsewhere in the week', () => {
    const result = rollOne(rows, slots([1, 2, null]), 2, none, first);
    expect(result).toBe(3);
  });

  it('may re-pick what the slot already held, since it is not taken elsewhere', () => {
    const result = rollOne(rows, slots([1, null, null]), 0, none, first);
    expect(result).toBe(1);
  });

  it('returns null rather than clearing the slot when nothing qualifies', () => {
    const result = rollOne([recipe(1, { archived: true })], slots([null]), 0, none, first);
    expect(result).toBeNull();
  });
});

describe('rolling the week', () => {
  const rows = Array.from({ length: 10 }, (_, index) => recipe(index + 1));

  it('leaves locked slots alone', () => {
    const changed = rollWeek(rows, slots([1, 2, 3, 4, 5, 6, 7], [2, 5]), none, first);
    expect(changed.has(2)).toBe(false);
    expect(changed.has(5)).toBe(false);
    expect(changed.size).toBe(5);
  });

  it('never duplicates a locked recipe into another slot', () => {
    const changed = rollWeek(rows, slots([null, null, 3, null, null, null, null], [2]), none, first);
    expect([...changed.values()]).not.toContain(3);
  });

  it('fills seven distinct recipes when nothing is locked', () => {
    const changed = rollWeek(rows, slots(Array(7).fill(null)), none, first);
    expect(changed.size).toBe(7);
    expect(new Set(changed.values()).size).toBe(7);
  });

  it('rolls only the slots the week holds, not a fixed seven', () => {
    const six = rollWeek(rows, slots(Array(6).fill(null)), none, first);
    expect(six.size).toBe(6);
    expect([...six.keys()].sort()).toEqual([0, 1, 2, 3, 4, 5]);

    const eight = rollWeek(rows, slots(Array(8).fill(null)), none, first);
    expect(eight.size).toBe(8);
    expect([...eight.keys()].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('skips slots it cannot fill rather than emptying them', () => {
    const three = [recipe(1), recipe(2), recipe(3)];
    const changed = rollWeek(three, slots(Array(7).fill(null)), none, first);
    expect(changed.size).toBe(3);
  });
});
