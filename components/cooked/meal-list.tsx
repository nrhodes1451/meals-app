'use client';

import { useCallback, useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ChevronRight } from 'lucide-react';
import { Button, Divider, IconButton, TickMark } from '@/components/penrose';
import { clearEaten, setSlotEaten, type ActionResult } from '@/app/plan/[week]/actions';
import { cookTime, slotLabel } from '@/lib/format';
import type { PlanSlot } from '@/lib/plan';
import { cn } from '@/lib/cn';

export function CookedList({ week, slots }: { week: string; slots: PlanSlot[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = useCallback((action: () => Promise<ActionResult>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  }, []);

  const filled = slots.filter((slot) => slot.recipe !== null);

  return (
    <>
      {error ? (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <ul className="list-none p-0">
        {slots.map((slot) => {
          const recipe = slot.recipe;
          const number = slotLabel(slot.position);

          if (!recipe) {
            return (
              <li key={slot.position}>
                <Divider />
                <div className="flex min-h-[76px] items-center gap-3">
                  <span className="pen-tabular w-8 shrink-0 font-display text-md font-black text-ink-70">
                    {number}
                  </span>
                  <span className="text-sm text-ink-70">No meal picked.</span>
                </div>
              </li>
            );
          }

          const href = `/recipes/${recipe.slug}` as Route;

          return (
            <li key={slot.position}>
              <Divider />
              <div className="flex min-h-[76px] items-center gap-3 py-2">
                {/*
                  Unlike the shopping list, the row is not wholly a tick target: the name and the
                  chevron open the recipe. So the tick is its own 44px control with its own label.
                */}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={slot.eaten}
                  aria-label={`${recipe.name}, eaten`}
                  disabled={pending}
                  onClick={() => run(() => setSlotEaten(week, slot.position, !slot.eaten))}
                  className="flex size-touch-min shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 disabled:cursor-not-allowed"
                >
                  <TickMark checked={slot.eaten} />
                </button>

                <span
                  className={cn(
                    'pen-tabular w-8 shrink-0 font-display text-md font-black',
                    slot.eaten ? 'text-ink-70' : 'text-primary',
                  )}
                >
                  {number}
                </span>

                <Link
                  href={href}
                  className={cn(
                    'flex min-h-touch min-w-0 flex-1 flex-col justify-center py-1 no-underline',
                    slot.eaten && 'line-through',
                  )}
                >
                  {/* Wraps rather than truncating: this screen has room and the name matters. */}
                  <span
                    className={cn(
                      'font-display text-md font-bold',
                      slot.eaten ? 'text-ink-70' : 'text-ink',
                    )}
                  >
                    {recipe.name}
                  </span>
                  <span className="text-sm text-ink-70">
                    {[
                      recipe.vegetarian ? 'Veg' : 'Meat / fish',
                      cookTime(recipe.timeHours),
                      `serves ${recipe.servings}`,
                    ].join(' · ')}
                  </span>
                </Link>

                <IconButton label={`Open ${recipe.name}`} variant="quiet" asChild>
                  <Link href={href}>
                    <ChevronRight size={20} aria-hidden />
                  </Link>
                </IconButton>
              </div>
            </li>
          );
        })}
      </ul>

      <Divider />

      <div className="mt-6 flex flex-wrap gap-2 pb-8">
        <Button
          variant="quiet"
          disabled={pending || !filled.some((slot) => slot.eaten)}
          onClick={() => run(() => clearEaten(week))}
        >
          Clear all
        </Button>
        <Button variant="quiet" asChild>
          <Link href={`/plan/${week}` as Route}>Back to planner</Link>
        </Button>
      </div>
    </>
  );
}
