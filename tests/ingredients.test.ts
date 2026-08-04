import { describe, expect, it } from 'vitest';
import { filterIngredients, parseAliases, type IngredientRow } from '@/lib/ingredients';

const row = (
  id: number,
  name: string,
  aliases: string[] = [],
): IngredientRow => ({
  id,
  slug: name.replace(/\s+/g, '-'),
  name,
  categoryId: 1,
  frozen: false,
  pantryStaple: false,
  packSize: null,
  packUnit: null,
  aliases,
  uses: 0,
});

const rows = [
  row(1, 'broccoli', ['broccol']),
  row(2, 'carrots', ['carrot']),
  row(3, 'spinach'),
];

describe('the ingredient filter', () => {
  it('matches on the canonical name', () => {
    expect(filterIngredients(rows, 'spin').map((r) => r.name)).toEqual(['spinach']);
  });

  it('matches on an alias, which is the point of the alias table', () => {
    expect(filterIngredients(rows, 'broccol').map((r) => r.name)).toEqual(['broccoli']);
    expect(filterIngredients(rows, 'carrot').map((r) => r.name)).toEqual(['carrots']);
  });

  it('ignores case and surrounding space', () => {
    expect(filterIngredients(rows, '  BROCCOLI ').map((r) => r.name)).toEqual(['broccoli']);
  });

  it('returns everything for an empty filter', () => {
    expect(filterIngredients(rows, '   ')).toHaveLength(3);
  });
});

describe('parsing the comma-separated alias field', () => {
  it('splits, trims and lowercases', () => {
    expect(parseAliases(' Carrot,  CARROTS ')).toEqual(['carrot', 'carrots']);
  });

  it('drops blanks and duplicates', () => {
    expect(parseAliases('a,,a, ,b')).toEqual(['a', 'b']);
  });

  it('treats an empty field as no aliases', () => {
    expect(parseAliases('  ')).toEqual([]);
  });
});
