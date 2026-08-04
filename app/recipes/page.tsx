import Link from 'next/link';
import type { Route } from 'next';
import { getDb } from '@/db';
import { AppShell } from '@/components/shell';
import { LibraryFilterBar } from '@/components/library/filter-bar';
import { NewRecipeButton } from '@/components/library/new-recipe-button';
import {
  Badge,
  GridCell,
  GridColumnHeader,
  GridHeaderRow,
  GridRow,
  GridTable,
  SectionHeader,
} from '@/components/penrose';
import { cookTime, lastEaten } from '@/lib/format';
import {
  DEFAULT_FILTERS,
  filterRecipes,
  loadIngredientOptions,
  loadRecipes,
  type Diet,
  type LibraryFilters,
  type Sort,
} from '@/lib/recipes';
import { currentWeekStarting } from '@/lib/week';

export const metadata = { title: 'Recipe library' };

/** Name, diet, ingredients, time, servings, last eaten. No imagery: the system has none. */
const COLUMNS = 'minmax(220px,1.1fr) 78px minmax(260px,1.7fr) 74px 66px 104px';

function parseFilters(params: Record<string, string | string[] | undefined>): LibraryFilters {
  const single = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const number = (key: string) => {
    const value = Number(single(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  };
  const diet = single('diet');
  const sort = single('sort');

  return {
    ...DEFAULT_FILTERS,
    query: single('q') ?? '',
    ingredientId: number('ingredient'),
    diet: diet === 'veg' || diet === 'meat' ? (diet as Diet) : 'all',
    maxMinutes: number('time'),
    ketoOnly: single('keto') === '1',
    includeArchived: single('archived') === '1',
    sort: sort === 'time' || sort === 'last' ? (sort as Sort) : 'name',
  };
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);
  const db = await getDb();
  const [allRecipes, ingredientOptions] = await Promise.all([
    loadRecipes(db),
    loadIngredientOptions(db),
  ]);

  const shown = filterRecipes(allRecipes, filters);
  // Counts are computed, never written into the copy.
  const inScope = filters.includeArchived
    ? allRecipes.length
    : allRecipes.filter((recipe) => !recipe.archived).length;

  return (
    <AppShell week={currentWeekStarting()} current="/recipes">
      <SectionHeader level={1} size="page" meta={`${shown.length} of ${inScope} shown`}>
        Recipe library
      </SectionHeader>

      <LibraryFilterBar
        filters={filters}
        ingredientOptions={ingredientOptions}
        action={<NewRecipeButton />}
      />

      <GridTable label="Recipes" className="mt-6">
        <GridHeaderRow columns={COLUMNS}>
          <GridColumnHeader>Name</GridColumnHeader>
          <GridColumnHeader>Diet</GridColumnHeader>
          <GridColumnHeader>Ingredients</GridColumnHeader>
          <GridColumnHeader align="right">Time</GridColumnHeader>
          <GridColumnHeader align="right">Serves</GridColumnHeader>
          <GridColumnHeader align="right">Last eaten</GridColumnHeader>
        </GridHeaderRow>

        {shown.map((recipe) => (
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
          </GridRow>
        ))}
      </GridTable>

      {shown.length === 0 ? <p className="mt-6 text-base">Nothing matches that.</p> : null}
    </AppShell>
  );
}
