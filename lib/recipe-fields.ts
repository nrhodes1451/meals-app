/**
 * Field rules shared by the recipe editor and the photo import, so a recipe saved either way is
 * held to the same checks and gets the same messages. Free of database imports: the import journey
 * runs `validateFields` in the browser before it lets the user move on.
 */
import type { Unit } from './quantity';

export type FieldInput = {
  name: string;
  servings: string;
  /** Minutes, which is how cook time is read and written. Stored as hours. */
  minutes: string;
  sourceUrl: string;
  method: string;
};

export type Fields = {
  name: string;
  servings: number;
  timeHours: string | null;
  sourceUrl: string | null;
  method: string | null;
};

type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateFields(input: FieldInput): Checked<Fields> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Give the recipe a name.' };

  const servings = Number(input.servings);
  if (!Number.isInteger(servings) || servings < 1) {
    return { ok: false, error: 'Servings must be a whole number, 1 or more.' };
  }

  let timeHours: string | null = null;
  if (input.minutes.trim() !== '') {
    const minutes = Number(input.minutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return { ok: false, error: 'Cook time must be a number of minutes.' };
    }
    timeHours = String(Math.round((minutes / 60) * 100) / 100);
  }

  const sourceUrl = input.sourceUrl.trim();
  if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) {
    return { ok: false, error: 'The source link needs to start with http:// or https://.' };
  }

  return {
    ok: true,
    value: {
      name,
      servings,
      timeHours,
      // Independent fields. A recipe can have a link and notes, or one, or neither.
      sourceUrl: sourceUrl || null,
      method: input.method.trim() || null,
    },
  };
}

/**
 * Numeric columns are strings over the wire and must not be handed junk. Blank means "some": the
 * recipe needs it but the amount was never worth recording.
 */
export function validateQuantity(
  amount: string,
  unit: string,
  lineNumber: number,
  units: readonly string[],
): Checked<{ amount: string | null; unit: Unit | null }> {
  const trimmed = amount.trim();
  let value: string | null = null;
  if (trimmed !== '') {
    const number = Number(trimmed);
    if (!Number.isFinite(number) || number < 0) {
      return { ok: false, error: `Line ${lineNumber} has an amount that is not a number.` };
    }
    value = String(Math.round(number * 100) / 100);
  }
  if (unit !== '' && !units.includes(unit)) {
    return { ok: false, error: `Line ${lineNumber} has a unit this app does not know.` };
  }
  return { ok: true, value: { amount: value, unit: unit === '' ? null : (unit as Unit) } };
}
