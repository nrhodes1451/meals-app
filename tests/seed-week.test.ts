/**
 * The aggregation rule against the real migrated data rather than fixtures. Reads the seed JSON
 * directly, so it needs no database.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildShoppingList,
  type CategoryMeta,
  type IngredientMeta,
  type PlannedMeal,
} from '@/lib/aggregate';
import type { Unit } from '@/lib/quantity';

type SeedIngredients = {
  categories: { name: string; order: number }[];
  ingredients: {
    slug: string;
    name: string;
    category: string;
    frozen: boolean;
    pantryStaple: boolean;
    packSize: number | null;
    packUnit: Unit | null;
  }[];
};

type SeedRecipe = {
  slug: string;
  name: string;
  archived: boolean;
  ingredients: { ingredient: string; amount: number | null; unit: Unit | null }[];
};

const read = <T,>(name: string): T =>
  JSON.parse(readFileSync(new URL(`../seed/${name}`, import.meta.url), 'utf8')) as T;

const source = read<SeedIngredients>('ingredients.json');
const allRecipes = read<SeedRecipe[]>('recipes.json');

const categoryId = new Map(source.categories.map((category, index) => [category.name, index + 1]));
const categories: CategoryMeta[] = source.categories.map((category, index) => ({
  id: index + 1,
  name: category.name,
  position: category.order,
}));

const ingredientId = new Map(source.ingredients.map((item, index) => [item.slug, index + 1]));
const ingredients = new Map<number, IngredientMeta>(
  source.ingredients.map((item, index) => [
    index + 1,
    {
      id: index + 1,
      name: item.name,
      frozen: item.frozen,
      pantryStaple: item.pantryStaple,
      categoryId: categoryId.get(item.category)!,
      packSize: item.packSize,
      packUnit: item.packUnit,
      ocadoUrl: null,
    },
  ]),
);

/** Seven real unarchived recipes, chosen by slug so the test is deterministic. */
const WEEK = [
  'aubergine-pizza',
  'bean-burgers-and-pita-with-broccoli',
  'cauliflower-and-cumin-soup',
  'fajitas',
  'greek-salad',
  'mushroom-risotto',
  'stuffed-peppers',
];

function planWeek(slugs: string[]): PlannedMeal[] {
  return slugs.flatMap((slug, position) => {
    const recipe = allRecipes.find((candidate) => candidate.slug === slug);
    if (!recipe) return [];
    return [
      {
        position,
        recipeId: position + 1,
        recipeName: recipe.name,
        skipIngredients: false,
        lines: recipe.ingredients.map((line) => ({
          ingredientId: ingredientId.get(line.ingredient)!,
          amount: line.amount,
          unit: line.unit,
        })),
      },
    ];
  });
}

const emptyState = {
  checked: new Set<number>(),
  skippedChecked: new Set<number>(),
  stapleOverrides: new Set<number>(),
  manual: [],
};

describe('a real week from the seed', () => {
  const meals = planWeek(WEEK);
  const list = buildShoppingList(meals, ingredients, categories, emptyState);

  it('found the recipes it planned', () => {
    expect(meals.length).toBeGreaterThanOrEqual(5);
  });

  it('produces sections in aisle order, none of them empty', () => {
    const positions = list.sections.map(
      (section) => categories.find((category) => category.id === section.categoryId)!.position,
    );
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(list.sections.every((section) => section.items.length > 0)).toBe(true);
  });

  it('does not suppress any pantry staples, because none are flagged', () => {
    const onList = list.sections.flatMap((section) => section.items);
    expect(onList.some((item) => item.pantryStaple)).toBe(false);
    expect(list.suppressed).toEqual([]);
  });

  it('gives every item at least one quantity line and one use', () => {
    for (const item of list.sections.flatMap((section) => section.items)) {
      expect(item.quantity.lines.length, item.name).toBeGreaterThan(0);
      expect(item.uses.length, item.name).toBeGreaterThan(0);
    }
  });

  it('puts "some" last when it appears beside a measured quantity', () => {
    for (const item of [...list.sections.flatMap((section) => section.items), ...list.suppressed]) {
      const someAt = item.quantity.lines.findIndex((line) => line === 'some' || line.startsWith('some*'));
      if (someAt >= 0) {
        expect(someAt, item.name).toBe(item.quantity.lines.length - 1);
      }
    }
  });

  it('counts the list consistently', () => {
    const items = list.sections.reduce((total, section) => total + section.items.length, 0);
    expect(list.total).toBe(items);
    expect(list.remaining).toBe(list.total - list.checked);
  });

  it('aggregates an ingredient shared by more than one meal', () => {
    const shared = list.sections
      .flatMap((section) => section.items)
      .filter((item) => item.uses.length > 1);
    expect(shared.length).toBeGreaterThan(0);
    for (const item of shared) {
      expect(item.trace, item.name).not.toBeNull();
    }
  });
});
