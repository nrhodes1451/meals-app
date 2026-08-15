/**
 * Quantity aggregation, per the rule in CLAUDE.md.
 *
 * A unit belongs to a dimension. Amounts sum only within a dimension, converting to the
 * dimension's canonical unit first. Count units never sum with each other: there is no sound
 * conversion from grams to punnets, so each count unit is its own bucket and a bare count
 * (unit = null) is a bucket too. Unmeasured lines append "some" after the buckets, tallied
 * when more than one recipe left the amount blank: "some*5". An ingredient can therefore
 * legitimately read "1, 2 bags, 3 tins, 300g, some*2".
 */
import type { unitEnum } from '@/db/schema';

export type Unit = (typeof unitEnum.enumValues)[number];

export type Dimension = 'mass' | 'volume' | 'count';

/**
 * Factor to the dimension's canonical unit: grams for mass, millilitres for volume.
 *
 * CLAUDE.md names kg to g and l to ml explicitly and puts tsp and tbsp in the volume
 * dimension without giving their factors. Spoons are converted here on the same reasoning
 * the rule gives for refusing grams to punnets: a tablespoon is a defined volume, so the
 * conversion is sound. UK metric spoons, 5ml and 15ml. If spoons should stay in their own
 * buckets instead, remove them from this table and they fall through to count.
 */
const CANONICAL: Partial<Record<Unit, { dimension: Exclude<Dimension, 'count'>; factor: number }>> =
  {
    g: { dimension: 'mass', factor: 1 },
    kg: { dimension: 'mass', factor: 1000 },
    ml: { dimension: 'volume', factor: 1 },
    l: { dimension: 'volume', factor: 1000 },
    tsp: { dimension: 'volume', factor: 5 },
    tbsp: { dimension: 'volume', factor: 15 },
  };

const CANONICAL_UNIT: Record<Exclude<Dimension, 'count'>, Unit> = {
  mass: 'g',
  volume: 'ml',
};

export function dimensionOf(unit: Unit | null): Dimension {
  if (unit === null) return 'count';
  return CANONICAL[unit]?.dimension ?? 'count';
}

export type Bucket = {
  /** Stable grouping key: the dimension for mass and volume, the unit itself for counts. */
  key: string;
  dimension: Dimension;
  /** The unit the amount is expressed in: canonical for mass and volume, as given for counts. */
  unit: Unit | null;
  amount: number;
};

function keyFor(unit: Unit | null): { key: string; dimension: Dimension; unit: Unit | null } {
  const dimension = dimensionOf(unit);
  if (dimension === 'count') return { key: `count:${unit ?? ''}`, dimension, unit };
  return { key: dimension, dimension, unit: CANONICAL_UNIT[dimension] };
}

/** Rounded to two places: the source amounts are numeric(10,2), so this only sheds float noise. */
function tidy(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export type Measured = { amount: number; unit: Unit | null };

/**
 * Sums a set of lines into buckets. Lines with no amount are not measured quantities and are
 * excluded here; the caller passes how many there were.
 */
export function toBuckets(lines: Measured[]): Bucket[] {
  const buckets = new Map<string, Bucket>();

  for (const line of lines) {
    const { key, dimension, unit } = keyFor(line.unit);
    const factor = line.unit === null ? 1 : (CANONICAL[line.unit]?.factor ?? 1);
    const existing = buckets.get(key);
    if (existing) {
      existing.amount = tidy(existing.amount + line.amount * factor);
    } else {
      buckets.set(key, { key, dimension, unit, amount: tidy(line.amount * factor) });
    }
  }

  return sortBuckets([...buckets.values()]);
}

/**
 * Bare count first, then count units alphabetically, then mass, then volume. This reproduces
 * the order in CLAUDE.md's worked example, "onions: 1, 2 bags, 3 tins, 300g". "some" is
 * appended after these buckets by formatQuantity, not sorted here.
 */
export function sortBuckets(buckets: Bucket[]): Bucket[] {
  const rank = (bucket: Bucket) => {
    if (bucket.dimension === 'count') return bucket.unit === null ? 0 : 1;
    return bucket.dimension === 'mass' ? 2 : 3;
  };
  return [...buckets].sort(
    (a, b) => rank(a) - rank(b) || (a.unit ?? '').localeCompare(b.unit ?? ''),
  );
}

/** Trailing zeros are noise on a shopping list: 0.50 reads as 0.5, 2.00 as 2. */
export function formatAmount(amount: number): string {
  return String(Number(amount.toFixed(2)));
}

/** Count units are singular in the enum and plural on the list: 2 bags, 1 punnet. */
function pluralise(unit: Unit, amount: number): string {
  return amount === 1 ? unit : `${unit}s`;
}

export function formatBucket(bucket: Bucket): string {
  const amount = formatAmount(bucket.amount);
  if (bucket.unit === null) return amount;
  if (bucket.dimension === 'count') return `${amount} ${pluralise(bucket.unit, bucket.amount)}`;
  // Mass and volume are symbols, set tight against the figure: 300g, 250ml.
  return `${amount}${bucket.unit}`;
}

export type Quantity = {
  /** One string per bucket, then "some" or "some*N" last when any line was unmeasured. */
  lines: string[];
  /** True when the whole quantity is unmeasured, so the list reads "some" or "some*N". Mixed lists are false. */
  unmeasured: boolean;
  buckets: Bucket[];
};

/** One unspecified amount is "some"; five of them are "some*5". */
export function formatSome(count: number): string | null {
  if (count <= 0) return null;
  if (count === 1) return 'some';
  return `some*${count}`;
}

/**
 * Unmeasured lines contribute "some", tallied. It is appended after any measured buckets
 * rather than absorbed: a recipe that asks for unspecified spinach alongside one that asks
 * for 300g reads "300g, some". Five such recipes read "300g, some*5".
 */
export function formatQuantity(lines: Measured[], unmeasuredCount: number): Quantity {
  const buckets = toBuckets(lines);
  const some = formatSome(unmeasuredCount);
  if (buckets.length === 0) {
    return { lines: some ? [some] : [], unmeasured: true, buckets };
  }
  const formatted = buckets.map(formatBucket);
  return {
    lines: some ? [...formatted, some] : formatted,
    unmeasured: false,
    buckets,
  };
}

/**
 * How a single recipe line reads on its own, for the trace dialog. Unconverted: the trace
 * shows what each recipe actually asks for, so 0.5kg stays 0.5kg.
 */
export function formatLine(amount: number | null, unit: Unit | null): string {
  if (amount === null) return 'some';
  if (unit === null) return formatAmount(amount);
  if (dimensionOf(unit) === 'count') return `${formatAmount(amount)} ${pluralise(unit, amount)}`;
  return `${formatAmount(amount)}${unit}`;
}
