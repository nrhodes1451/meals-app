/**
 * After harmonisation, most ingredients use one measured unit. A short allowlist keeps the
 * mixes that are genuinely different things you buy (a whole chicken vs breasts, a celery
 * pack vs stalks). Those show as a comma-separated list on the shop.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Unit } from '@/lib/quantity';

type SeedRecipe = {
  slug: string;
  ingredients: { ingredient: string; amount: number | null; unit: Unit | null }[];
};

const recipes = JSON.parse(
  readFileSync(new URL('../seed/recipes.json', import.meta.url), 'utf8'),
) as SeedRecipe[];

/** Ingredients that may still emit more than one measured bucket. */
const MIXED_UNITS_ALLOWED = new Set([
  'celery',
  'chicken',
  'feta',
  'green-pesto',
  'potatoes',
  'stir-fry-veg',
  'sweet-potatoes',
  'tofu',
]);

function measuredUnits(slug: string): Set<string> {
  const units = new Set<string>();
  for (const recipe of recipes) {
    for (const line of recipe.ingredients) {
      if (line.ingredient !== slug || line.amount === null) continue;
      units.add(line.unit ?? 'count');
    }
  }
  return units;
}

function allSlugs(): string[] {
  const slugs = new Set<string>();
  for (const recipe of recipes) {
    for (const line of recipe.ingredients) slugs.add(line.ingredient);
  }
  return [...slugs].sort();
}

describe('seed unit consistency', () => {
  it('uses a single measured unit per ingredient except the documented mixes', () => {
    const offenders: string[] = [];
    for (const slug of allSlugs()) {
      const units = measuredUnits(slug);
      if (units.size > 1 && !MIXED_UNITS_ALLOWED.has(slug)) {
        offenders.push(`${slug}: ${[...units].join(', ')}`);
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('does not keep a unit on an unmeasured line', () => {
    const orphans: string[] = [];
    for (const recipe of recipes) {
      for (const line of recipe.ingredients) {
        if (line.amount === null && line.unit !== null) {
          orphans.push(`${recipe.slug}: ${line.ingredient} ${line.unit}`);
        }
      }
    }
    expect(orphans).toEqual([]);
  });

  it('only allowlists ingredients that actually mix units', () => {
    for (const slug of [...MIXED_UNITS_ALLOWED].sort()) {
      expect(measuredUnits(slug).size, slug).toBeGreaterThan(1);
    }
  });
});
