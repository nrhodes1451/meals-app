import { describe, expect, it } from 'vitest';
import {
  dimensionOf,
  formatAmount,
  formatLine,
  formatQuantity,
  toBuckets,
} from '@/lib/quantity';

const lines = (...pairs: [number, string | null][]) =>
  pairs.map(([amount, unit]) => ({ amount, unit: unit as never }));

describe('dimensions', () => {
  it('puts mass, volume and counts in the right dimension', () => {
    expect(dimensionOf('g')).toBe('mass');
    expect(dimensionOf('kg')).toBe('mass');
    expect(dimensionOf('ml')).toBe('volume');
    expect(dimensionOf('l')).toBe('volume');
    expect(dimensionOf('tsp')).toBe('volume');
    expect(dimensionOf('tbsp')).toBe('volume');
    expect(dimensionOf('tin')).toBe('count');
    expect(dimensionOf('punnet')).toBe('count');
    expect(dimensionOf(null)).toBe('count');
  });
});

describe('summing within a dimension', () => {
  it('converts kg to g before summing', () => {
    expect(formatQuantity(lines([1, 'kg'], [300, 'g']), 0).lines).toEqual(['1300g']);
  });

  it('converts l to ml before summing', () => {
    expect(formatQuantity(lines([0.5, 'l'], [200, 'ml']), 0).lines).toEqual(['700ml']);
  });

  it('converts spoons into the volume dimension', () => {
    expect(formatQuantity(lines([2, 'tbsp'], [1, 'tsp']), 0).lines).toEqual(['35ml']);
  });

  it('keeps each count unit in its own bucket', () => {
    expect(formatQuantity(lines([2, 'bag'], [3, 'tin']), 0).lines).toEqual(['2 bags', '3 tins']);
  });

  it('never converts across dimensions', () => {
    const quantity = formatQuantity(lines([300, 'g'], [1, 'punnet']), 0);
    expect(quantity.lines).toEqual(['1 punnet', '300g']);
    expect(quantity.buckets).toHaveLength(2);
  });

  it('sums bare counts together', () => {
    expect(formatQuantity(lines([1, null], [2, null]), 0).lines).toEqual(['3']);
  });
});

describe("CLAUDE.md's worked example", () => {
  it('renders onions across four recipes as one line per bucket, in the documented order', () => {
    const quantity = formatQuantity(
      lines([1, null], [2, 'bag'], [3, 'tin'], [300, 'g']),
      0,
    );
    expect(quantity.lines.join(', ')).toBe('1, 2 bags, 3 tins, 300g');
  });

  it('appends some last when any line was unmeasured', () => {
    const quantity = formatQuantity(
      lines([1, null], [2, 'bag'], [3, 'tin'], [300, 'g']),
      2,
    );
    expect(quantity.lines.join(', ')).toBe('1, 2 bags, 3 tins, 300g, some*2');
  });
});

describe('"some"', () => {
  it('is the whole quantity when nothing is measured', () => {
    const quantity = formatQuantity([], 1);
    expect(quantity.lines).toEqual(['some']);
    expect(quantity.unmeasured).toBe(true);
  });

  it('tallies unmeasured lines', () => {
    expect(formatQuantity([], 5).lines).toEqual(['some*5']);
  });

  it('is appended when any measured quantity exists', () => {
    const quantity = formatQuantity(lines([300, 'g']), 1);
    expect(quantity.lines).toEqual(['300g', 'some']);
    expect(quantity.unmeasured).toBe(false);
  });

  it('is appended even when the measured quantity is in a different bucket', () => {
    expect(formatQuantity(lines([1, 'bag']), 1).lines).toEqual(['1 bag', 'some']);
  });

  it('renders mixed count, mass, and tallied some as a comma-separated list', () => {
    expect(formatQuantity(lines([1, null], [300, 'g']), 5).lines.join(', ')).toBe(
      '1, 300g, some*5',
    );
  });
});

describe('formatting', () => {
  it('renders a bare count as a plain number, not a multiplier', () => {
    expect(formatQuantity(lines([2, null]), 0).lines).toEqual(['2']);
  });

  it('sheds trailing zeros', () => {
    expect(formatAmount(0.5)).toBe('0.5');
    expect(formatAmount(2)).toBe('2');
    expect(formatAmount(550)).toBe('550');
  });

  it('pluralises count units but not symbols', () => {
    expect(formatQuantity(lines([1, 'punnet']), 0).lines).toEqual(['1 punnet']);
    expect(formatQuantity(lines([2, 'punnet']), 0).lines).toEqual(['2 punnets']);
    expect(formatQuantity(lines([0.5, 'bag']), 0).lines).toEqual(['0.5 bags']);
    expect(formatQuantity(lines([2, 'g']), 0).lines).toEqual(['2g']);
  });

  it('leaves a single line unconverted for the trace dialog', () => {
    expect(formatLine(0.5, 'kg')).toBe('0.5kg');
    expect(formatLine(2, 'tbsp')).toBe('2tbsp');
    expect(formatLine(4, 'rasher')).toBe('4 rashers');
    expect(formatLine(2, null)).toBe('2');
    expect(formatLine(null, null)).toBe('some');
    expect(formatLine(null, 'g')).toBe('some');
  });

  it('does not accumulate float noise', () => {
    expect(toBuckets(lines([0.1, 'kg'], [0.2, 'kg']))[0].amount).toBe(300);
  });
});
