'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Dices, Lock, Trash2, Unlock } from 'lucide-react';
import {
  Badge,
  Button,
  GridCell,
  GridColumnHeader,
  GridHeaderRow,
  GridRow,
  GridTable,
  IconButton,
} from '@/components/penrose';
import { PickerDialog } from './picker-dialog';
import { PlannerFilterBar } from './filter-bar';
import {
  addSlot,
  removeSlot,
  rollSlot,
  rollTheWeek,
  setSlotLocked,
  setSlotRecipe,
  unlockAll,
  type ActionResult,
} from '@/app/plan/[week]/actions';
import { cookTime, slotLabel, slotRef } from '@/lib/format';
import type { PlanSlot } from '@/lib/plan';
import type { RecipeRow } from '@/lib/recipes';
import type { RollFilters } from '@/lib/roll';
import { MAX_SLOT_COUNT, MIN_SLOT_COUNT } from '@/lib/week';

/** lock bar, number, meal, diet, time, servings, three 48px controls. */
const COLUMNS = '4px 44px minmax(200px,1fr) 92px 78px 62px 152px';

type PickerRecipe = Pick<
  RecipeRow,
  'id' | 'name' | 'vegetarian' | 'timeHours' | 'lastEaten' | 'archived'
>;

export function WeekTable({
  week,
  slots,
  filters,
  poolSize,
  poolTotal,
  pickerRecipes,
}: {
  week: string;
  slots: PlanSlot[];
  filters: RollFilters;
  poolSize: number;
  poolTotal: number;
  pickerRecipes: PickerRecipe[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<Set<number>>(new Set());
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pendingTimers = timers.current;
    return () => pendingTimers.forEach(clearTimeout);
  }, []);

  const run = useCallback(
    (action: () => Promise<ActionResult>, flashed: number[] = []) => {
      setError(null);
      startTransition(async () => {
        const result = await action();
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (flashed.length) {
          setFlash(new Set(flashed));
          // The one piece of motion in the design: a 700ms hold, then it fades back.
          timers.current.push(setTimeout(() => setFlash(new Set()), 700));
        }
      });
    },
    [],
  );

  const toggleLock = useCallback(
    (position: number) => {
      const slot = slots.find((candidate) => candidate.position === position);
      if (!slot) return;
      run(() => setSlotLocked(week, position, !slot.locked));
    },
    [run, slots, week],
  );

  const reroll = useCallback(
    (position: number) => run(() => rollSlot(week, position, filters), [position]),
    [filters, run, week],
  );

  const rollAll = useCallback(
    () =>
      run(
        () => rollTheWeek(week, filters),
        slots.filter((slot) => !slot.locked).map((slot) => slot.position),
      ),
    [filters, run, slots, week],
  );

  const appendMeal = useCallback(() => {
    const position = slots.length;
    run(() => addSlot(week, filters), [position]);
  }, [filters, run, slots.length, week]);

  return (
    <>
      <PlannerFilterBar
        filters={filters}
        poolSize={poolSize}
        poolTotal={poolTotal}
        pending={pending}
        onRollWeek={rollAll}
        onUnlockAll={() => run(() => unlockAll(week))}
      />

      {error ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {/*
        The table keeps every column at every width. Horizontal scroll lives on this wrapper so
        the document itself never scrolls sideways.
      */}
      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[700px]">
          <GridTable label="This week's meals">
            <GridHeaderRow columns={COLUMNS}>
              <GridColumnHeader />
              <GridColumnHeader>#</GridColumnHeader>
              <GridColumnHeader>Meal</GridColumnHeader>
              <GridColumnHeader>Diet</GridColumnHeader>
              <GridColumnHeader align="right">Time</GridColumnHeader>
              <GridColumnHeader align="right">Serves</GridColumnHeader>
              <GridColumnHeader />
            </GridHeaderRow>

            {slots.map((slot) => {
              const recipe = slot.recipe;
              const label = slotLabel(slot.position);
              const ref = slotRef(slot.position);
              return (
                <GridRow key={slot.position} columns={COLUMNS} className="min-h-[66px]">
                  <GridCell>
                    <span
                      aria-hidden="true"
                      className={`h-11 w-1 ${slot.locked ? 'bg-primary' : 'bg-transparent'}`}
                    />
                  </GridCell>

                  <GridCell>
                    <span
                      className={`pen-tabular font-display text-base ${
                        slot.locked ? 'font-black text-primary' : 'font-normal text-ink'
                      }`}
                    >
                      {label}
                    </span>
                  </GridCell>

                  <GridCell>
                    <button
                      type="button"
                      onClick={() => setPickerFor(slot.position)}
                      className={`flex min-h-touch w-full min-w-0 cursor-pointer flex-col justify-center border-0 px-1 text-left transition-colors duration-200 ease-pen ${
                        flash.has(slot.position) ? 'bg-primary-tint' : 'bg-transparent'
                      }`}
                    >
                      <span className="truncate font-display text-md font-bold text-ink">
                        {recipe ? recipe.name : 'Pick a meal'}
                      </span>
                      {recipe ? (
                        <span className="truncate text-sm text-ink-70">
                          {recipe.lines.map((line) => line.name).join(', ')}
                        </span>
                      ) : null}
                    </button>
                  </GridCell>

                  <GridCell>
                    {recipe ? (
                      recipe.vegetarian ? (
                        <Badge>Veg</Badge>
                      ) : (
                        <Badge tone="quiet">Meat / fish</Badge>
                      )
                    ) : null}
                  </GridCell>

                  <GridCell align="right" tabular>
                    {recipe ? cookTime(recipe.timeHours) : ''}
                  </GridCell>

                  <GridCell align="right" tabular>
                    {recipe ? `×${recipe.servings}` : ''}
                  </GridCell>

                  <GridCell align="right">
                    <div className="flex gap-1">
                      <IconButton
                        label={slot.locked ? `Unlock ${ref}` : `Lock ${ref}`}
                        variant={slot.locked ? 'primary' : 'quiet'}
                        disabled={pending}
                        onClick={() => toggleLock(slot.position)}
                      >
                        {slot.locked ? (
                          <Lock size={20} aria-hidden />
                        ) : (
                          <Unlock size={20} aria-hidden />
                        )}
                      </IconButton>
                      <IconButton
                        label={`Re-roll ${ref}`}
                        variant="quiet"
                        disabled={slot.locked || pending}
                        onClick={() => reroll(slot.position)}
                      >
                        <Dices size={20} aria-hidden />
                      </IconButton>
                      <IconButton
                        label={
                          slots.length <= MIN_SLOT_COUNT
                            ? 'A week needs at least one meal'
                            : `Remove ${ref}`
                        }
                        variant="quiet"
                        disabled={pending || slots.length <= MIN_SLOT_COUNT}
                        onClick={() => run(() => removeSlot(week, slot.position))}
                      >
                        <Trash2 size={20} aria-hidden />
                      </IconButton>
                    </div>
                  </GridCell>
                </GridRow>
              );
            })}
          </GridTable>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button
          variant="secondary"
          disabled={pending || slots.length >= MAX_SLOT_COUNT}
          onClick={appendMeal}
        >
          Add meal
        </Button>
        <span className="font-display text-sm font-bold text-ink-70">
          {slots.length} {slots.length === 1 ? 'meal' : 'meals'}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink-70">Locked meals are never re-rolled.</p>

      <PickerDialog
        open={pickerFor !== null}
        position={pickerFor}
        recipes={pickerRecipes}
        takenIds={slots.filter((slot) => slot.recipeId !== null).map((slot) => slot.recipeId!)}
        excludeWeeks={filters.excludeWeeks}
        onClose={() => setPickerFor(null)}
        onPick={(recipeId) => {
          const position = pickerFor;
          setPickerFor(null);
          if (position !== null) {
            run(() => setSlotRecipe(week, position, recipeId), [position]);
          }
        }}
      />
    </>
  );
}
