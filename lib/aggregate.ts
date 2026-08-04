/**
 * Derives the shopping list from a week's plan. Quantities are computed on read and never
 * stored; the only persisted state is per-shop (checked, manually added, staple overrides).
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
};

export type IngredientMeta = {
  id: number;
  name: string;
  frozen: boolean;
  pantryStaple: boolean;
  categoryId: number;
  packSize: number | null;
  packUnit: Unit | null;
};

export type CategoryMeta = { id: number; name: string; position: number };

export type ManualItem = { id: number; freeText: string; checked: boolean };

export type ListState = {
  /** Ingredient ids ticked off this shop. */
  checked: ReadonlySet<number>;
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

export function buildShoppingList(
  meals: PlannedMeal[],
  ingredients: ReadonlyMap<number, IngredientMeta>,
  categories: readonly CategoryMeta[],
  state: ListState,
): ShoppingList {
  type Accumulator = {
    meta: IngredientMeta;
    measured: Measured[];
    hasUnmeasured: boolean;
    uses: Use[];
  };

  const grouped = new Map<number, Accumulator>();

  for (const meal of meals) {
    for (const line of meal.lines) {
      const meta = ingredients.get(line.ingredientId);
      if (!meta) continue;

      let entry = grouped.get(line.ingredientId);
      if (!entry) {
        entry = { meta, measured: [], hasUnmeasured: false, uses: [] };
        grouped.set(line.ingredientId, entry);
      }

      // A unit with no amount is still just "some": five lines in the source look like that.
      if (line.amount === null) entry.hasUnmeasured = true;
      else entry.measured.push({ amount: line.amount, unit: line.unit });

      entry.uses.push({
        position: meal.position,
        recipeId: meal.recipeId,
        recipeName: meal.recipeName,
        quantity: formatLine(line.amount, line.unit),
      });
    }
  }

  const items: ListItem[] = [...grouped.values()].map((entry) => {
    const quantity = formatQuantity(entry.measured, entry.hasUnmeasured);
    const uses = [...entry.uses].sort((a, b) => a.position - b.position);
    return {
      ingredientId: entry.meta.id,
      name: ingredientName(entry.meta),
      categoryId: entry.meta.categoryId,
      pantryStaple: entry.meta.pantryStaple,
      restored: entry.meta.pantryStaple && state.stapleOverrides.has(entry.meta.id),
      checked: state.checked.has(entry.meta.id),
      quantity,
      uses,
      trace: traceNote({
        quantity,
        uses,
        packSize: entry.meta.packSize,
        packUnit: entry.meta.packUnit,
      }),
    };
  });

  const included = items.filter((item) => !item.pantryStaple || item.restored);
  const suppressed = items
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

  const total = included.length + state.manual.length;
  const checked =
    included.filter((item) => item.checked).length +
    state.manual.filter((item) => item.checked).length;

  return {
    sections,
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
};

export function summariseShoppingList(list: ShoppingList): ListSummary {
  return {
    total: list.total,
    sections: list.sections.map((section) => ({
      name: section.name,
      count: section.items.length,
    })),
    suppressedCount: list.suppressed.length,
  };
}
