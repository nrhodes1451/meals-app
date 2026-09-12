/**
 * Derives the shopping list from a week's plan. Quantities are computed on read and never
 * stored; the only persisted state is per-shop (checked, manually added, staple overrides).
 *
 * Meals marked skip-ingredients aggregate into a separate pool so their quantities never mix
 * with the main shop. Same ingredient, two pools, two rows.
 *
 * Pure functions over plain data, so the whole rule is testable without a database.
 */
import { ingredientName, packLabel } from './format';
import { formatLine, formatQuantity, type Measured, type Quantity, type Unit } from './quantity';

export type PlannedLine = {
  ingredientId: number;
  amount: number | null;
  unit: Unit | null;
};

export type PlannedMeal = {
  /** Slot position, 0-6. */
  position: number;
  recipeId: number;
  recipeName: string;
  lines: PlannedLine[];
  /** When true, this meal's lines go into `skipped` instead of the aisle sections. */
  skipIngredients: boolean;
};

export type IngredientMeta = {
  id: number;
  name: string;
  frozen: boolean;
  pantryStaple: boolean;
  categoryId: number;
  packSize: number | null;
  packUnit: Unit | null;
  ocadoUrl: string | null;
};

export type CategoryMeta = { id: number; name: string; position: number };

export type ManualItem = { id: number; freeText: string; checked: boolean };

export type ListState = {
  /** Ingredient ids ticked off this shop (aisle sections). */
  checked: ReadonlySet<number>;
  /** Ingredient ids ticked off in the skipped section. Independent of `checked`. */
  skippedChecked: ReadonlySet<number>;
  /** Pantry staples explicitly restored to the list this shop. */
  stapleOverrides: ReadonlySet<number>;
  manual: ManualItem[];
};

export type Use = {
  position: number;
  recipeId: number;
  recipeName: string;
  /** The line as that recipe asks for it, unconverted. */
  quantity: string;
};

export type ListItem = {
  ingredientId: number;
  name: string;
  categoryId: number;
  pantryStaple: boolean;
  /** True when a suppressed staple was pulled back onto the list. */
  restored: boolean;
  checked: boolean;
  quantity: Quantity;
  uses: Use[];
  ocadoUrl: string | null;
  /**
   * The one line of context in the trace dialog. Only claims that quantities were left
   * unconverted when they genuinely could not be reconciled.
   */
  trace: string | null;
};

export type ListSection = {
  categoryId: number;
  name: string;
  items: ListItem[];
  remaining: number;
};

export type ShoppingList = {
  sections: ListSection[];
  /** Ingredients from skip-ingredients meals, rolled up among themselves. */
  skipped: ListItem[];
  /** Pantry staples held back, in the same shape, so the foot block can show quantities. */
  suppressed: ListItem[];
  manual: ManualItem[];
  total: number;
  checked: number;
  remaining: number;
};

function traceNote(item: {
  quantity: Quantity;
  uses: Use[];
  packSize: number | null;
  packUnit: Unit | null;
}): string | null {
  const pack = packLabel(item.packSize, item.packUnit);
  const packNote = pack ? ` Usual pack: ${pack}.` : '';

  if (item.quantity.buckets.length > 1) {
    return `These recipes measure this differently and the measures do not reconcile. Both are shown on the list rather than converted.${packNote}`;
  }
  if (item.uses.length > 1) {
    return `Aggregated from ${item.uses.length} meals this week.${packNote}`;
  }
  return packNote ? packNote.trim() : null;
}

function itemsFromMeals(
  meals: PlannedMeal[],
  ingredients: ReadonlyMap<number, IngredientMeta>,
  checked: ReadonlySet<number>,
  stapleOverrides: ReadonlySet<number>,
): ListItem[] {
  type Accumulator = {
    meta: IngredientMeta;
    measured: Measured[];
    unmeasuredCount: number;
    uses: Use[];
  };

  const grouped = new Map<number, Accumulator>();

  for (const meal of meals) {
    for (const line of meal.lines) {
      const meta = ingredients.get(line.ingredientId);
      if (!meta) continue;

      let entry = grouped.get(line.ingredientId);
      if (!entry) {
        entry = { meta, measured: [], unmeasuredCount: 0, uses: [] };
        grouped.set(line.ingredientId, entry);
      }

      // A unit with no amount is still just "some".
      if (line.amount === null) entry.unmeasuredCount += 1;
      else entry.measured.push({ amount: line.amount, unit: line.unit });

      entry.uses.push({
        position: meal.position,
        recipeId: meal.recipeId,
        recipeName: meal.recipeName,
        quantity: formatLine(line.amount, line.unit),
      });
    }
  }

  return [...grouped.values()].map((entry) => {
    const quantity = formatQuantity(entry.measured, entry.unmeasuredCount);
    const uses = [...entry.uses].sort((a, b) => a.position - b.position);
    return {
      ingredientId: entry.meta.id,
      name: ingredientName(entry.meta),
      categoryId: entry.meta.categoryId,
      pantryStaple: entry.meta.pantryStaple,
      restored: entry.meta.pantryStaple && stapleOverrides.has(entry.meta.id),
      checked: checked.has(entry.meta.id),
      quantity,
      uses,
      ocadoUrl: entry.meta.ocadoUrl,
      trace: traceNote({
        quantity,
        uses,
        packSize: entry.meta.packSize,
        packUnit: entry.meta.packUnit,
      }),
    };
  });
}

export function buildShoppingList(
  meals: PlannedMeal[],
  ingredients: ReadonlyMap<number, IngredientMeta>,
  categories: readonly CategoryMeta[],
  state: ListState,
): ShoppingList {
  const shopMeals = meals.filter((meal) => !meal.skipIngredients);
  const skipMeals = meals.filter((meal) => meal.skipIngredients);

  const shopItems = itemsFromMeals(shopMeals, ingredients, state.checked, state.stapleOverrides);
  const skipItems = itemsFromMeals(skipMeals, ingredients, state.skippedChecked, new Set());

  const included = shopItems.filter((item) => !item.pantryStaple || item.restored);
  const suppressed = shopItems
    .filter((item) => item.pantryStaple && !item.restored)
    .sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));

  const sections = [...categories]
    .sort((a, b) => a.position - b.position)
    .map((category) => {
      const sectionItems = included
        .filter((item) => item.categoryId === category.id)
        .sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
      return {
        categoryId: category.id,
        name: category.name,
        items: sectionItems,
        remaining: sectionItems.filter((item) => !item.checked).length,
      };
    })
    // Empty sections are omitted: the list is a route through a shop, not a table of contents.
    .filter((section) => section.items.length > 0);

  const aisleOrder = new Map(categories.map((category) => [category.id, category.position]));
  const skipped = skipItems
    .filter((item) => !item.pantryStaple)
    .sort((a, b) => {
      const byAisle = (aisleOrder.get(a.categoryId) ?? 0) - (aisleOrder.get(b.categoryId) ?? 0);
      if (byAisle !== 0) return byAisle;
      return a.name.localeCompare(b.name, 'en-GB');
    });

  const total = included.length + state.manual.length;
  const checked =
    included.filter((item) => item.checked).length +
    state.manual.filter((item) => item.checked).length;

  return {
    sections,
    skipped,
    suppressed,
    manual: state.manual,
    total,
    checked,
    remaining: total - checked,
  };
}

/** The planner rail: the same derivation, counted rather than listed. */
export type ListSummary = {
  total: number;
  sections: { name: string; count: number }[];
  suppressedCount: number;
  skippedCount: number;
};

export function summariseShoppingList(list: ShoppingList): ListSummary {
  return {
    total: list.total,
    sections: list.sections.map((section) => ({
      name: section.name,
      count: section.items.length,
    })),
    suppressedCount: list.suppressed.length,
    skippedCount: list.skipped.length,
  };
}
