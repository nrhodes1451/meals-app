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

/** lock bar, number, meal, diet, time, servings, controls. */
const COLUMNS = '4px 48px minmax(200px,1fr) 92px 78px 62px 156px';

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

  /**
   * Bound on the window, and suppressed while a field or a dialog has focus so typing a recipe
   * name into the picker does not re-roll the week. Digits cover the first nine meals; beyond
   * that the on-screen controls are the route.
   */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (pickerFor !== null) return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
        return;
      }

      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        rollAll();
        return;
      }

      const digit = Number(event.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= 9) {
        const position = digit - 1;
        if (position >= slots.length) return;
        event.preventDefault();
        toggleLock(position);
        return;
      }

      // shift+1..9 arrives as the shifted glyph, so the physical key identifies the meal.
      if (event.shiftKey && /^Digit[1-9]$/.test(event.code)) {
        const position = Number(event.code.slice(5)) - 1;
        if (position >= slots.length) return;
        event.preventDefault();
        reroll(position);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pickerFor, rollAll, reroll, slots.length, toggleLock]);

  const shortcutCeiling = Math.min(slots.length, 9);

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

      <GridTable label="This week's meals" className="mt-6">
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
                    {slot.locked ? <Lock size={20} aria-hidden /> : <Unlock size={20} aria-hidden />}
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

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button
          variant="secondary"
          disabled={pending || slots.length >= MAX_SLOT_COUNT}
          onClick={() => run(() => addSlot(week))}
        >
          Add meal
        </Button>
        <p className="text-sm text-ink-70">
          {shortcutCeiling >= 1
            ? `1-${shortcutCeiling} locks a meal, shift and 1-${shortcutCeiling} re-rolls it, R rolls the week. Locked meals are never re-rolled.`
            : 'R rolls the week. Locked meals are never re-rolled.'}
        </p>
      </div>

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
