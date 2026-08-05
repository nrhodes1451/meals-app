import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { recipes, unitEnum } from '@/db/schema';
import { AppShell } from '@/components/shell';
import { RecipeEditor } from '@/components/library/recipe-editor';
import { loadIngredientOptions, loadRecipes, minutesOf } from '@/lib/recipes';
import { currentWeekStarting } from '@/lib/week';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await getDb();
  const record = await db.query.recipes.findFirst({ where: eq(recipes.slug, slug) });
  return { title: record?.name ?? 'Recipe' };
}

export default async function RecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const startEditing = query.edit === '1';
  const db = await getDb();
  const week = currentWeekStarting();

  const record = await db.query.recipes.findFirst({ where: eq(recipes.slug, slug) });
  if (!record) notFound();

  const [all, ingredientOptions] = await Promise.all([
    loadRecipes(db),
    loadIngredientOptions(db),
  ]);
  const recipe = all.find((candidate) => candidate.id === record.id);
  if (!recipe) notFound();

  return (
    <AppShell week={week} current="/recipes">
      <RecipeEditor
        recipe={{
          id: recipe.id,
          name: recipe.name,
          servings: recipe.servings,
          minutes: minutesOf(recipe.timeHours),
          vegetarian: recipe.vegetarian,
          keto: recipe.keto,
          archived: recipe.archived,
          sourceUrl: recipe.sourceUrl,
          method: recipe.method,
          lastEaten: recipe.lastEaten,
          lines: recipe.lines.map((line) => ({
            ingredientId: line.ingredientId,
            name: line.name,
            amount: line.amount,
            unit: line.unit,
          })),
        }}
        ingredientOptions={ingredientOptions}
        units={[...unitEnum.enumValues]}
        week={week}
        startEditing={startEditing}
      />
    </AppShell>
  );
}
