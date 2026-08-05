import { getDb } from '@/db';
import { AppShell } from '@/components/shell';
import { LibraryFilterBar } from '@/components/library/filter-bar';
import { NewRecipeButton } from '@/components/library/new-recipe-button';
import { RecipeList } from '@/components/library/recipe-list';
import { SectionHeader } from '@/components/penrose';
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
  const week = currentWeekStarting();
  const [allRecipes, ingredientOptions] = await Promise.all([
    loadRecipes(db),
    loadIngredientOptions(db),
  ]);

  const shown = filterRecipes(allRecipes, filters);
  const inScope = filters.includeArchived
    ? allRecipes.length
    : allRecipes.filter((recipe) => !recipe.archived).length;

  return (
    <AppShell week={week} current="/recipes">
      <SectionHeader level={1} size="page" meta={`${shown.length} of ${inScope} shown`}>
        Recipe library
      </SectionHeader>

      <LibraryFilterBar
        filters={filters}
        ingredientOptions={ingredientOptions}
        action={<NewRecipeButton />}
      />

      <RecipeList recipes={shown} week={week} />
    </AppShell>
  );
}
