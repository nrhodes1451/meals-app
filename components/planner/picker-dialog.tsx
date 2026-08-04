'use client';

import { useMemo, useState } from 'react';
import { Dialog, Input } from '@/components/penrose';
import { cookTime, lastEaten, slotRef } from '@/lib/format';

type PickerRecipe = {
  id: number;
  name: string;
  vegetarian: boolean;
  timeHours: number | null;
  lastEaten: number | null;
  archived: boolean;
};

export function PickerDialog({
  open,
  position,
  recipes,
  takenIds,
  excludeWeeks,
  onClose,
  onPick,
}: {
  open: boolean;
  position: number | null;
  recipes: PickerRecipe[];
  takenIds: number[];
  excludeWeeks: number | null;
  onClose: () => void;
  onPick: (recipeId: number) => void;
}) {
  const [query, setQuery] = useState('');

  const taken = useMemo(() => new Set(takenIds), [takenIds]);

  const shown = useMemo(() => {
    const term = query.trim().toLowerCase();
    return recipes
      // Archived recipes are never offered, here or in the pool.
      .filter((recipe) => !recipe.archived)
      .filter((recipe) => !term || recipe.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
  }, [query, recipes]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setQuery('');
          onClose();
        }
      }}
      width={680}
      title={position === null ? 'Pick a meal' : `Pick for ${slotRef(position)}`}
    >
      <Input
        autoFocus
        value={query}
        placeholder="Search recipes"
        aria-label="Search recipes"
        onChange={(event) => setQuery(event.target.value)}
      />

      <div role="list" className="mt-4">
        {shown.map((recipe) => {
          const tooRecent =
            excludeWeeks !== null && recipe.lastEaten !== null && recipe.lastEaten < excludeWeeks;

          return (
            <button
              key={recipe.id}
              type="button"
              role="listitem"
              disabled={taken.has(recipe.id)}
              onClick={() => onPick(recipe.id)}
              className="flex min-h-[56px] w-full cursor-pointer items-center gap-4 border-0 border-t border-ink-25 bg-transparent px-1 text-left transition-colors duration-[120ms] ease-pen hover:bg-primary-tint disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="min-w-0 flex-1 truncate font-display text-md font-bold text-ink">
                {recipe.name}
                {taken.has(recipe.id) ? (
                  <span className="ml-2 text-sm font-normal text-ink-70">already this week</span>
                ) : null}
              </span>
              <span className="w-[80px] shrink-0 font-display text-xs font-bold uppercase tracking-label text-ink-70">
                {recipe.vegetarian ? 'Veg' : 'Meat / fish'}
              </span>
              <span className="pen-tabular w-[70px] shrink-0 text-right text-sm">
                {cookTime(recipe.timeHours)}
              </span>
              <span
                className={`pen-tabular w-[100px] shrink-0 text-right text-sm ${
                  tooRecent ? 'font-bold text-danger' : 'text-ink-70'
                }`}
              >
                {/* Colour alone would not carry this, so the recent ones say so in words. */}
                {tooRecent ? `${lastEaten(recipe.lastEaten)} - recent` : lastEaten(recipe.lastEaten)}
              </span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? <p className="mt-4 text-base">Nothing matches that.</p> : null}
    </Dialog>
  );
}
