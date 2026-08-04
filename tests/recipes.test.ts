import { describe, expect, it } from 'vitest';
import { cookTime, lastEaten, slotLabel, slotRef, weekLabel } from '@/lib/format';
import {
  DEFAULT_FILTERS,
  filterRecipes,
  sortRecipes,
  type RecipeRow,
} from '@/lib/recipes';
import { currentWeekStarting, isValidWeekStarting, mondayOf, toIsoDate, weeksBetween } from '@/lib/week';

function recipe(overrides: Partial<RecipeRow> & { id: number; name: string }): RecipeRow {
  return {
    slug: overrides.name.toLowerCase().replaceAll(' ', '-'),
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
  };
}

const library: RecipeRow[] = [
  recipe({ id: 1, name: 'Aubergine pizza', timeHours: 0.5, lastEaten: 2 }),
  recipe({ id: 2, name: 'Beef stew', vegetarian: false, timeHours: 7, lastEaten: 30 }),
  recipe({ id: 3, name: 'Cauliflower soup', keto: true, timeHours: 0.4, lastEaten: null }),
  recipe({ id: 4, name: 'Deep fried legacy thing', archived: true, timeHours: null }),
  recipe({
    id: 5,
    name: 'Egg salad',
    keto: true,
    timeHours: 0.25,
    lastEaten: 1,
    lines: [{ id: 1, ingredientId: 42, name: 'eggs', amount: 4, unit: null, position: 0 }],
  }),
];

describe('library filters', () => {
  it('hides archived recipes by default and shows them on request', () => {
    expect(filterRecipes(library, DEFAULT_FILTERS).map((r) => r.id)).toEqual([1, 2, 3, 5]);
    expect(
      filterRecipes(library, { ...DEFAULT_FILTERS, includeArchived: true }).map((r) => r.id),
    ).toEqual([1, 2, 3, 4, 5]);
  });

  it('matches the search against the name, case insensitively', () => {
    expect(filterRecipes(library, { ...DEFAULT_FILTERS, query: 'SALAD' }).map((r) => r.id)).toEqual([
      5,
    ]);
  });

  it('filters by diet in both directions', () => {
    expect(filterRecipes(library, { ...DEFAULT_FILTERS, diet: 'meat' }).map((r) => r.id)).toEqual([
      2,
    ]);
    expect(filterRecipes(library, { ...DEFAULT_FILTERS, diet: 'veg' }).map((r) => r.id)).toEqual([
      1, 3, 5,
    ]);
  });

  it('filters by keto', () => {
    expect(filterRecipes(library, { ...DEFAULT_FILTERS, ketoOnly: true }).map((r) => r.id)).toEqual([
      3, 5,
    ]);
  });

  it('filters by ingredient', () => {
    expect(
      filterRecipes(library, { ...DEFAULT_FILTERS, ingredientId: 42 }).map((r) => r.id),
    ).toEqual([5]);
  });

  it('excludes recipes with no recorded time when a time limit is set', () => {
    const shown = filterRecipes(library, {
      ...DEFAULT_FILTERS,
      maxMinutes: 30,
      includeArchived: true,
    });
    expect(shown.map((r) => r.id)).toEqual([1, 3, 5]);
  });
});

describe('sorting', () => {
  it('sorts by name by default', () => {
    expect(sortRecipes(library, 'name').map((r) => r.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('sorts by time, putting recipes with no time last', () => {
    expect(sortRecipes(library, 'time').map((r) => r.id)).toEqual([5, 3, 1, 2, 4]);
  });

  it('sorts by last eaten, longest ago first and never-eaten before everything', () => {
    expect(sortRecipes(library, 'last').map((r) => r.id)).toEqual([3, 4, 2, 1, 5]);
  });
});

describe('formatters', () => {
  it('renders cook time in minutes below an hour and hours above it', () => {
    expect(cookTime(0.25)).toBe('15 min');
    expect(cookTime(0.5)).toBe('30 min');
    expect(cookTime(0.7)).toBe('42 min');
    expect(cookTime(1)).toBe('1 hr');
    expect(cookTime(1.5)).toBe('1 hr 30 min');
    expect(cookTime(6)).toBe('6 hr');
    expect(cookTime(null)).toBe('-');
  });

  it('renders last eaten in weeks', () => {
    expect(lastEaten(null)).toBe('never');
    expect(lastEaten(0)).toBe('this week');
    expect(lastEaten(1)).toBe('1 wk ago');
    expect(lastEaten(9)).toBe('9 wks ago');
  });

  it('labels slots by number, not by weekday', () => {
    expect(slotLabel(0)).toBe('1');
    expect(slotLabel(6)).toBe('7');
    expect(slotRef(0)).toBe('meal 1');
    expect(slotRef(7)).toBe('meal 8');
  });

  it('labels a week across a month boundary', () => {
    expect(weekLabel(new Date('2026-08-03T00:00:00Z'))).toBe('MON 3 - SUN 9 AUG');
    expect(weekLabel(new Date('2026-07-27T00:00:00Z'))).toBe('MON 27 JUL - SUN 2 AUG');
  });
});

describe('weeks', () => {
  it('resolves any day to its Monday', () => {
    expect(toIsoDate(mondayOf(new Date('2026-08-03T12:00:00Z')))).toBe('2026-08-03');
    expect(toIsoDate(mondayOf(new Date('2026-08-09T23:00:00Z')))).toBe('2026-08-03');
    expect(toIsoDate(mondayOf(new Date('2026-08-10T00:00:00Z')))).toBe('2026-08-10');
  });

  it('counts whole weeks between Mondays', () => {
    expect(weeksBetween('2026-08-03', '2026-07-27')).toBe(1);
    expect(weeksBetween('2026-08-03', '2026-06-01')).toBe(9);
  });

  it('accepts only Mondays as week identifiers', () => {
    expect(isValidWeekStarting('2026-08-03')).toBe(true);
    expect(isValidWeekStarting('2026-08-04')).toBe(false);
    expect(isValidWeekStarting('nonsense')).toBe(false);
  });

  it('gives the current week as a Monday', () => {
    expect(isValidWeekStarting(currentWeekStarting())).toBe(true);
  });
});
