'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import {
  Badge,
  Button,
  GridCell,
  GridColumnHeader,
  GridHeaderRow,
  GridRow,
  GridTable,
} from '@/components/penrose';
import { addToWeek } from '@/app/plan/[week]/actions';
import { cookTime, lastEaten } from '@/lib/format';
import type { RecipeRow } from '@/lib/recipes';

/** Name, diet, ingredients, time, servings, last eaten, ADD. */
const COLUMNS = 'minmax(220px,1.1fr) 78px minmax(260px,1.7fr) 74px 66px 104px 108px';

function metaLine(recipe: RecipeRow): string {
  const diet = recipe.vegetarian ? 'Veg' : 'Meat / fish';
  return `${diet} · ${cookTime(recipe.timeHours)} · serves ${recipe.servings} · ${lastEaten(recipe.lastEaten)}`;
}

export function RecipeList({
  recipes,
  week,
}: {
  recipes: RecipeRow[];
  week: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add(recipeId: number) {
    setError(null);
    startTransition(async () => {
      const result = await addToWeek(week, recipeId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {/* Dense table at 1240+. Stacked rows below - no horizontal scroll. */}
      <div className="mt-6 hidden min-[1240px]:block">
        <GridTable label="Recipes">
          <GridHeaderRow columns={COLUMNS}>
            <GridColumnHeader>Name</GridColumnHeader>
            <GridColumnHeader>Diet</GridColumnHeader>
            <GridColumnHeader>Ingredients</GridColumnHeader>
            <GridColumnHeader align="right">Time</GridColumnHeader>
            <GridColumnHeader align="right">Serves</GridColumnHeader>
            <GridColumnHeader align="right">Last eaten</GridColumnHeader>
            <GridColumnHeader />
          </GridHeaderRow>

          {recipes.map((recipe) => (
            <GridRow
              key={recipe.id}
              columns={COLUMNS}
              className="min-h-[56px] transition-colors duration-[120ms] ease-pen hover:bg-primary-tint"
            >
              <GridCell>
                <Link
                  href={`/recipes/${recipe.slug}` as Route}
                  className="truncate font-display text-md font-bold text-ink no-underline hover:text-primary"
                >
                  {recipe.name}
                </Link>
                {recipe.archived ? (
                  <span className="ml-2 font-display text-xs font-bold uppercase tracking-label text-ink-70">
                    Archived
                  </span>
                ) : null}
              </GridCell>
              <GridCell>
                {recipe.vegetarian ? <Badge>Veg</Badge> : <Badge tone="quiet">Meat / fish</Badge>}
              </GridCell>
              <GridCell>
                <span className="truncate text-sm text-ink-70">
                  {recipe.lines.map((line) => line.name).join(', ')}
                </span>
              </GridCell>
              <GridCell align="right" tabular>
                {cookTime(recipe.timeHours)}
              </GridCell>
              <GridCell align="right" tabular>
                ×{recipe.servings}
              </GridCell>
              <GridCell align="right" tabular>
                {lastEaten(recipe.lastEaten)}
              </GridCell>
              <GridCell align="right">
                <Button
                  variant="secondary"
                  disabled={pending || recipe.archived}
                  onClick={() => add(recipe.id)}
                  className="min-h-touch-min px-4"
                >
                  Add
                </Button>
              </GridCell>
            </GridRow>
          ))}
        </GridTable>
      </div>

      <ul className="mt-6 list-none p-0 min-[1240px]:hidden" aria-label="Recipes">
        {recipes.map((recipe) => (
          <li
            key={recipe.id}
            className="flex min-h-[56px] items-center gap-3 border-0 border-t border-ink-25 py-2 first:border-t-0"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/recipes/${recipe.slug}` as Route}
                className="font-display text-md font-bold text-ink no-underline hover:text-primary"
              >
                {recipe.name}
              </Link>
              <p className="mt-0.5 text-sm text-ink-70">{metaLine(recipe)}</p>
            </div>
            <Button
              variant="secondary"
              disabled={pending || recipe.archived}
              onClick={() => add(recipe.id)}
              className="min-h-touch-min shrink-0 px-4"
            >
              Add
            </Button>
          </li>
        ))}
      </ul>

      {recipes.length === 0 ? <p className="mt-6 text-base">Nothing matches that.</p> : null}
    </>
  );
}
