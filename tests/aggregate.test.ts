import { describe, expect, it } from 'vitest';
import {
  buildShoppingList,
  summariseShoppingList,
  type CategoryMeta,
  type IngredientMeta,
  type ListState,
  type PlannedMeal,
} from '@/lib/aggregate';

const categories: CategoryMeta[] = [
  { id: 1, name: 'Fruit & Veg', position: 1 },
  { id: 2, name: 'Dairy', position: 3 },
  { id: 3, name: 'Tinned', position: 10 },
  { id: 4, name: 'Frozen', position: 11 },
  { id: 5, name: 'Drinks', position: 6 },
];

function ingredient(overrides: Partial<IngredientMeta> & { id: number; name: string }): IngredientMeta {
  return {
    frozen: false,
    pantryStaple: false,
    categoryId: 1,
    packSize: null,
    packUnit: null,
    ...overrides,
  };
}

const ingredients = new Map<number, IngredientMeta>(
  [
    ingredient({ id: 1, name: 'onions' }),
    ingredient({ id: 2, name: 'spinach' }),
    ingredient({ id: 3, name: 'spinach', frozen: true, categoryId: 4 }),
    ingredient({ id: 4, name: 'olive oil', pantryStaple: true, categoryId: 3 }),
    ingredient({ id: 5, name: 'cumin', pantryStaple: true, categoryId: 3 }),
    ingredient({ id: 6, name: 'yoghurt', categoryId: 2, packSize: 500, packUnit: 'g' }),
    ingredient({ id: 7, name: 'strawberries', packSize: 250, packUnit: 'g' }),
  ].map((item) => [item.id, item]),
);

const emptyState: ListState = {
  checked: new Set(),
  skippedChecked: new Set(),
  stapleOverrides: new Set(),
  manual: [],
};

function meal(
  position: number,
  name: string,
  lines: PlannedMeal['lines'],
  skipIngredients = false,
): PlannedMeal {
  return { position, recipeId: position + 100, recipeName: name, lines, skipIngredients };
}

describe('grouping', () => {
  it('groups the same ingredient across meals into one row', () => {
    const list = buildShoppingList(
      [
        meal(0, 'Dhal', [{ ingredientId: 1, amount: 1, unit: null }]),
        meal(1, 'Curry', [{ ingredientId: 1, amount: 2, unit: null }]),
      ],
      ingredients,
      categories,
      emptyState,
    );

    const [section] = list.sections;
    expect(section.items).toHaveLength(1);
    expect(section.items[0].quantity.lines).toEqual(['3']);
    expect(section.items[0].uses).toHaveLength(2);
  });

  it('keeps fresh and frozen apart and suffixes the frozen row', () => {
    const list = buildShoppingList(
      [
        meal(0, 'Curry', [
          { ingredientId: 2, amount: 200, unit: 'g' },
          { ingredientId: 3, amount: 300, unit: 'g' },
        ]),
      ],
      ingredients,
      categories,
      emptyState,
    );

    const names = list.sections.flatMap((section) => section.items.map((item) => item.name));
    expect(names).toEqual(['spinach', 'spinach (frozen)']);
  });

  it('records each use with the day and the recipe, in slot order', () => {
    const list = buildShoppingList(
      [
        meal(4, 'Friday thing', [{ ingredientId: 1, amount: 1, unit: null }]),
        meal(2, 'Wednesday thing', [{ ingredientId: 1, amount: 1, unit: null }]),
      ],
      ingredients,
      categories,
      emptyState,
    );

    expect(list.sections[0].items[0].uses.map((use) => use.position)).toEqual([2, 4]);
    expect(list.sections[0].items[0].uses[0].recipeName).toBe('Wednesday thing');
  });

  it('joins mixed measured buckets and some as a comma-separated list', () => {
    const list = buildShoppingList(
      [
        meal(0, 'Salad', [{ ingredientId: 1, amount: 1, unit: null }]),
        meal(1, 'Soup', [{ ingredientId: 1, amount: 300, unit: 'g' }]),
        meal(2, 'Stew', [{ ingredientId: 1, amount: null, unit: null }]),
      ],
      ingredients,
      categories,
      emptyState,
    );

    expect(list.sections[0].items[0].quantity.lines.join(', ')).toBe('1, 300g, some');
  });

  it('tallies unmeasured lines as some*N', () => {
    const list = buildShoppingList(
      [
        meal(0, 'A', [{ ingredientId: 2, amount: null, unit: null }]),
        meal(1, 'B', [{ ingredientId: 2, amount: null, unit: null }]),
        meal(2, 'C', [{ ingredientId: 2, amount: 100, unit: 'g' }]),
        meal(3, 'D', [{ ingredientId: 2, amount: null, unit: null }]),
        meal(4, 'E', [{ ingredientId: 2, amount: null, unit: null }]),
        meal(5, 'F', [{ ingredientId: 2, amount: null, unit: null }]),
      ],
      ingredients,
      categories,
      emptyState,
    );

    expect(list.sections[0].items[0].quantity.lines.join(', ')).toBe('100g, some*5');
  });
});

describe('sections', () => {
  it('orders sections by aisle position and omits empty ones', () => {
    const list = buildShoppingList(
      [
        meal(0, 'Breakfast', [
          { ingredientId: 6, amount: 1, unit: 'tub' },
          { ingredientId: 3, amount: 1, unit: 'bag' },
          { ingredientId: 1, amount: 1, unit: null },
        ]),
      ],
      ingredients,
      categories,
      emptyState,
    );

    expect(list.sections.map((section) => section.name)).toEqual([
      'Fruit & Veg',
      'Dairy',
      'Frozen',
    ]);
  });

  it('sorts items alphabetically within a section', () => {
    const list = buildShoppingList(
      [
        meal(0, 'Salad', [
          { ingredientId: 7, amount: 1, unit: 'punnet' },
          { ingredientId: 1, amount: 1, unit: null },
          { ingredientId: 2, amount: 100, unit: 'g' },
        ]),
      ],
      ingredients,
      categories,
      emptyState,
    );

    expect(list.sections[0].items.map((item) => item.name)).toEqual([
      'onions',
      'spinach',
      'strawberries',
    ]);
  });
});

describe('pantry staples', () => {
  const meals = [
    meal(0, 'Dhal', [
      { ingredientId: 1, amount: 2, unit: null },
      { ingredientId: 4, amount: 2, unit: 'tbsp' },
      { ingredientId: 5, amount: null, unit: null },
    ]),
  ];

  it('suppresses staples from the list but keeps their quantities', () => {
    const list = buildShoppingList(meals, ingredients, categories, emptyState);

    expect(list.sections.flatMap((section) => section.items.map((item) => item.name))).toEqual([
      'onions',
    ]);
    expect(list.suppressed.map((item) => item.name)).toEqual(['cumin', 'olive oil']);
    expect(list.suppressed[1].quantity.lines).toEqual(['30ml']);
    expect(list.suppressed[0].quantity.lines).toEqual(['some']);
  });

  it('restores a staple to its aisle when overridden', () => {
    const list = buildShoppingList(meals, ingredients, categories, {
      ...emptyState,
      stapleOverrides: new Set([4]),
    });

    const tinned = list.sections.find((section) => section.name === 'Tinned');
    expect(tinned?.items.map((item) => item.name)).toEqual(['olive oil']);
    expect(tinned?.items[0].restored).toBe(true);
    expect(list.suppressed.map((item) => item.name)).toEqual(['cumin']);
  });

  it('does not count suppressed staples in the totals', () => {
    const list = buildShoppingList(meals, ingredients, categories, emptyState);
    expect(list.total).toBe(1);
  });
});

describe('counts and progress', () => {
  it('counts checked items, including manual ones', () => {
    const list = buildShoppingList(
      [
        meal(0, 'Curry', [
          { ingredientId: 1, amount: 1, unit: null },
          { ingredientId: 2, amount: 100, unit: 'g' },
        ]),
      ],
      ingredients,
      categories,
      {
        checked: new Set([1]),
        skippedChecked: new Set(),
        stapleOverrides: new Set(),
        manual: [
          { id: 1, freeText: 'batteries', checked: false },
          { id: 2, freeText: 'bin bags', checked: true },
        ],
      },
    );

    expect(list.total).toBe(4);
    expect(list.checked).toBe(2);
    expect(list.remaining).toBe(2);
    expect(list.sections[0].remaining).toBe(1);
  });
});

describe('trace notes', () => {
  it('claims quantities were left unconverted only when the buckets do not reconcile', () => {
    const list = buildShoppingList(
      [
        meal(0, 'Salad', [{ ingredientId: 7, amount: 200, unit: 'g' }]),
        meal(1, 'Pudding', [{ ingredientId: 7, amount: 1, unit: 'punnet' }]),
      ],
      ingredients,
      categories,
      emptyState,
    );

    const item = list.sections[0].items[0];
    expect(item.quantity.lines).toEqual(['1 punnet', '200g']);
    expect(item.trace).toContain('do not reconcile');
    expect(item.trace).toContain('Usual pack: 250g.');
  });

  it('says only that it aggregated when the quantities did reconcile', () => {
    const list = buildShoppingList(
      [
        meal(0, 'Curry', [{ ingredientId: 6, amount: 0.5, unit: 'kg' }]),
        meal(1, 'Raita', [{ ingredientId: 6, amount: 100, unit: 'g' }]),
      ],
      ingredients,
      categories,
      emptyState,
    );

    const item = list.sections[0].items[0];
    expect(item.quantity.lines).toEqual(['600g']);
    expect(item.trace).toBe('Aggregated from 2 meals this week. Usual pack: 500g.');
  });

  it('has nothing to say about a single unremarkable use', () => {
    const list = buildShoppingList(
      [meal(0, 'Curry', [{ ingredientId: 1, amount: 1, unit: null }])],
      ingredients,
      categories,
      emptyState,
    );
    expect(list.sections[0].items[0].trace).toBeNull();
  });
});

describe('rail summary', () => {
  it('counts items and sections without listing them', () => {
    const list = buildShoppingList(
      [
        meal(0, 'Curry', [
          { ingredientId: 1, amount: 1, unit: null },
          { ingredientId: 6, amount: 1, unit: 'tub' },
          { ingredientId: 4, amount: 1, unit: 'tbsp' },
        ]),
      ],
      ingredients,
      categories,
      emptyState,
    );

    const summary = summariseShoppingList(list);
    expect(summary.total).toBe(2);
    expect(summary.sections).toEqual([
      { name: 'Fruit & Veg', count: 1 },
      { name: 'Dairy', count: 1 },
    ]);
    expect(summary.suppressedCount).toBe(1);
    expect(summary.skippedCount).toBe(0);
  });
});

describe('lines with no ingredient record', () => {
  it('ignores them rather than throwing', () => {
    const list = buildShoppingList(
      [meal(0, 'Curry', [{ ingredientId: 999, amount: 1, unit: null }])],
      ingredients,
      categories,
      emptyState,
    );
    expect(list.total).toBe(0);
  });
});

describe('skip ingredients', () => {
  it('keeps a skipped meal off the aisle sections and lists it underneath', () => {
    const list = buildShoppingList(
      [
        meal(0, 'Dhal', [{ ingredientId: 1, amount: 2, unit: null }]),
        meal(1, 'Soup', [{ ingredientId: 2, amount: 200, unit: 'g' }], true),
      ],
      ingredients,
      categories,
      emptyState,
    );

    expect(list.sections.flatMap((section) => section.items.map((item) => item.name))).toEqual([
      'onions',
    ]);
    expect(list.skipped.map((item) => item.name)).toEqual(['spinach']);
    expect(list.skipped[0].quantity.lines).toEqual(['200g']);
  });

  it('rolls skipped meals up among themselves', () => {
    const list = buildShoppingList(
      [
        meal(0, 'Dhal', [{ ingredientId: 1, amount: 1, unit: null }], true),
        meal(1, 'Curry', [{ ingredientId: 1, amount: 2, unit: null }], true),
      ],
      ingredients,
      categories,
      emptyState,
    );

    expect(list.sections).toEqual([]);
    expect(list.skipped).toHaveLength(1);
    expect(list.skipped[0].quantity.lines).toEqual(['3']);
    expect(list.skipped[0].uses).toHaveLength(2);
  });

  it('does not add skipped quantities onto the same shop ingredient', () => {
    const list = buildShoppingList(
      [
        meal(0, 'Dhal', [{ ingredientId: 1, amount: 2, unit: null }]),
        meal(1, 'Soup', [{ ingredientId: 1, amount: 1, unit: null }], true),
      ],
      ingredients,
      categories,
      emptyState,
    );

    expect(list.sections[0].items[0].quantity.lines).toEqual(['2']);
    expect(list.skipped[0].quantity.lines).toEqual(['1']);
    expect(list.total).toBe(1);
  });

  it('omits the skipped section when nothing is skipped', () => {
    const list = buildShoppingList(
      [meal(0, 'Dhal', [{ ingredientId: 1, amount: 1, unit: null }])],
      ingredients,
      categories,
      emptyState,
    );
    expect(list.skipped).toEqual([]);
  });

  it('does not count skipped rows in shop totals', () => {
    const list = buildShoppingList(
      [
        meal(0, 'Dhal', [{ ingredientId: 1, amount: 1, unit: null }]),
        meal(1, 'Soup', [{ ingredientId: 2, amount: 100, unit: 'g' }], true),
      ],
      ingredients,
      categories,
      emptyState,
    );
    expect(list.total).toBe(1);
    expect(summariseShoppingList(list).skippedCount).toBe(1);
  });

  it('ticks skipped rows independently of the shop row', () => {
    const list = buildShoppingList(
      [
        meal(0, 'Dhal', [{ ingredientId: 1, amount: 2, unit: null }]),
        meal(1, 'Soup', [{ ingredientId: 1, amount: 1, unit: null }], true),
      ],
      ingredients,
      categories,
      {
        ...emptyState,
        skippedChecked: new Set([1]),
      },
    );

    expect(list.sections[0].items[0].checked).toBe(false);
    expect(list.skipped[0].checked).toBe(true);
  });
});
