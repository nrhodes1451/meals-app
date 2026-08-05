import type { Unit } from './quantity';

/**
 * Fresh is the default, so frozen variants carry the suffix. Fresh spinach and frozen spinach
 * are two rows sharing a name, bought from two different aisles.
 */
export function ingredientName(ingredient: { name: string; frozen: boolean }): string {
  return ingredient.frozen ? `${ingredient.name} (frozen)` : ingredient.name;
}

/**
 * `timeHours` is numeric hours. The source holds 0.15 and 0.7 as well as 6 and 7, so minutes
 * alone would read "420 min" for a slow-cooker recipe and hours alone would read "0.15 hr".
 */
export function cookTime(timeHours: number | null): string {
  if (timeHours === null) return '-';
  const minutes = Math.round(timeHours * 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

/** Weeks since a recipe was last cooked. Null means never. */
export function lastEaten(weeks: number | null): string {
  if (weeks === null) return 'never';
  if (weeks === 0) return 'this week';
  return weeks === 1 ? '1 wk ago' : `${weeks} wks ago`;
}

/** The schema has one vegetarian boolean, so the negative case covers both meat and fish. */
export function dietLabel(vegetarian: boolean): string {
  return vegetarian ? 'VEG' : 'MEAT / FISH';
}

export function packLabel(packSize: number | null, packUnit: Unit | null): string | null {
  if (packSize === null) return null;
  return packUnit === null ? String(packSize) : `${packSize}${packUnit}`;
}

/**
 * Slots are numbered, never named. A slot is not a weekday: meals are cooked in whatever order
 * suits, and a week does not have to hold seven of them. Position is 0-based, the label is 1-based
 * with a leading hash so it reads as a meal number on every screen.
 */
export function slotLabel(position: number): string {
  return `#${position + 1}`;
}

/** Same figure as slotLabel; kept as a named helper where prose previously said "meal N". */
export function slotRef(position: number): string {
  return `#${position + 1}`;
}

/** "MON 3 - SUN 9 AUG" for a week starting on the given Monday. */
export function weekLabel(weekStarting: Date): string {
  const end = new Date(weekStarting);
  end.setDate(end.getDate() + 6);
  const month = (date: Date) => date.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  const sameMonth = month(weekStarting) === month(end);
  const start = `MON ${weekStarting.getDate()}${sameMonth ? '' : ` ${month(weekStarting)}`}`;
  return `${start} - SUN ${end.getDate()} ${month(end)}`;
}
