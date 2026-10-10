/**
 * Turning what the model read off a photo into a draft the user checks step by step.
 *
 * Pure and client-safe: the import journey holds the draft in state and edits it here. The model's
 * output is untrusted - units are checked against the enum, amounts must be numbers, and every
 * ingredient id it proposes is checked against the real rows. A name or alias match done here
 * beats the model's guess, so an ingredient the library already knows never shows up as new.
 */
import type { Unit } from './quantity';

export type ModelIngredient = {
  /** The line as printed, for the user to check against. */
  raw: string;
  name: string;
  amount: number | null;
  unit: string | null;
  frozen: boolean;
  matchId: number | null;
};

export type ModelRecipe = {
  name: string;
  servings: number | null;
  minutes: number | null;
  vegetarian: boolean;
  method: string;
  ingredients: ModelIngredient[];
};

export type KnownIngredient = { id: number; name: string; frozen: boolean; aliases: string[] };

export type Target =
  /** `alias` is the photo's wording, saved against the ingredient when the user chose to map it. */
  | { kind: 'existing'; id: number; alias: string | null }
  /** Created only once the user has confirmed it on the new ingredients step. */
  | {
      kind: 'new';
      name: string;
      frozen: boolean;
      /** Kept off the shopping list, like the salt and oil the library deliberately leaves out. */
      pantryStaple: boolean;
      categoryId: number | null;
      confirmed: boolean;
    }
  /** Left out of the recipe. A choice rather than a deletion, so a stray tap can be undone. */
  | { kind: 'omit' };

export type DraftLine = {
  key: number;
  raw: string;
  amount: string;
  unit: Unit | '';
  target: Target;
  /** Read off the photo with no match in the library, so it is listed on the new ingredients step. */
  unmatched: boolean;
  /** The ingredient name as the model read it. Offered as an alias when mapped to an existing row. */
  readName: string;
};

export type Draft = {
  name: string;
  servings: string;
  minutes: string;
  vegetarian: boolean;
  keto: boolean;
  method: string;
  sourceUrl: string;
  lines: DraftLine[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

/** Null when the response is not a recipe at all, which the caller reports as an unreadable photo. */
export function parseModelRecipe(value: unknown): ModelRecipe | null {
  if (!isRecord(value)) return null;
  const name = text(value.name);
  const lines = Array.isArray(value.ingredients) ? value.ingredients : [];
  if (!name && lines.length === 0) return null;

  return {
    name,
    servings: positiveNumber(value.servings),
    minutes: positiveNumber(value.minutes),
    vegetarian: value.vegetarian === true,
    method: text(value.method),
    ingredients: lines.filter(isRecord).map((line) => ({
      raw: text(line.raw),
      name: text(line.name).toLowerCase(),
      amount:
        typeof line.amount === 'number' && Number.isFinite(line.amount) && line.amount >= 0
          ? line.amount
          : null,
      unit: typeof line.unit === 'string' ? line.unit.trim().toLowerCase() : null,
      frozen: line.frozen === true,
      matchId: typeof line.matchId === 'number' ? line.matchId : null,
    })),
  };
}

/** "Spinach (frozen)" is how frozen rows display, so a model echoing that is not a new name. */
function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(frozen\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Singular and plural both find the row: the library says "carrots", a recipe says "carrot". */
function variants(name: string): string[] {
  const base = normalise(name);
  const forms = new Set([base, `${base}s`, `${base}es`]);
  if (base.endsWith('es')) forms.add(base.slice(0, -2));
  if (base.endsWith('s')) forms.add(base.slice(0, -1));
  return [...forms];
}

export function matchIngredient(
  name: string,
  frozen: boolean,
  known: KnownIngredient[],
): number | null {
  const byName = new Map<string, number>();
  const byAlias = new Map<string, number>();
  for (const row of known) {
    if (row.frozen === frozen) byName.set(normalise(row.name), row.id);
    for (const alias of row.aliases) byAlias.set(normalise(alias), row.id);
  }
  for (const form of variants(name)) {
    const hit = byName.get(form) ?? byAlias.get(form);
    if (hit !== undefined) return hit;
  }
  return null;
}

let nextKey = 0;
export const newLineKey = () => (nextKey += 1);

export function toDraft(
  model: ModelRecipe,
  known: KnownIngredient[],
  units: readonly Unit[],
): Draft {
  const ids = new Set(known.map((row) => row.id));
  const unitSet = new Set<string>(units);

  return {
    name: model.name,
    servings: String(model.servings ?? 2),
    minutes: model.minutes === null ? '' : String(Math.round(model.minutes)),
    vegetarian: model.vegetarian,
    keto: false,
    method: model.method,
    sourceUrl: '',
    lines: model.ingredients
      .filter((line) => line.name)
      .map((line) => {
        const id =
          matchIngredient(line.name, line.frozen, known) ??
          (line.matchId !== null && ids.has(line.matchId) ? line.matchId : null);
        const unit = line.unit !== null && unitSet.has(line.unit) ? (line.unit as Unit) : '';
        return {
          key: newLineKey(),
          raw: line.raw || line.name,
          amount: line.amount === null ? '' : String(Math.round(line.amount * 100) / 100),
          unit,
          target:
            id === null
              ? {
                  kind: 'new',
                  name: line.name,
                  frozen: line.frozen,
                  pantryStaple: false,
                  categoryId: null,
                  confirmed: false,
                }
              : { kind: 'existing', id, alias: null },
          unmatched: id === null,
          readName: line.name,
        } satisfies DraftLine;
      }),
  };
}

/**
 * Lines still waiting on a decision: a new ingredient not yet confirmed with a name and an aisle,
 * or one the user chose to map to an existing ingredient without picking which.
 */
export function unresolved(lines: DraftLine[]): DraftLine[] {
  return lines.filter(({ target }) => {
    if (target.kind === 'omit') return false;
    if (target.kind === 'existing') return target.id <= 0;
    return !target.confirmed || target.categoryId === null || !target.name.trim();
  });
}
