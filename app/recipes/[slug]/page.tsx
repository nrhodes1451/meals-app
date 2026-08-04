import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { getDb } from '@/db';
import { recipes, unitEnum } from '@/db/schema';
import { AppShell } from '@/components/shell';
import { RecipeEditor } from '@/components/library/recipe-editor';
import { SectionHeader } from '@/components/penrose';
import { cookTime, lastEaten } from '@/lib/format';
import { loadIngredientOptions, loadRecipes, minutesOf } from '@/lib/recipes';
import { currentWeekStarting } from '@/lib/week';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await getDb();
  const record = await db.query.recipes.findFirst({ where: eq(recipes.slug, slug) });
  return { title: record?.name ?? 'Recipe' };
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await getDb();

  const record = await db.query.recipes.findFirst({ where: eq(recipes.slug, slug) });
  if (!record) notFound();

  const [all, ingredientOptions] = await Promise.all([
    loadRecipes(db),
    loadIngredientOptions(db),
  ]);
  const recipe = all.find((candidate) => candidate.id === record.id);
  if (!recipe) notFound();

  return (
    <AppShell week={currentWeekStarting()} current="/recipes">
      <Link
        href="/recipes"
        className="inline-flex min-h-touch items-center gap-2 font-display text-sm font-bold uppercase tracking-label text-primary no-underline"
      >
        <ArrowLeft size={16} aria-hidden />
        Recipe library
      </Link>

      <SectionHeader
        level={1}
        size="page"
        className="mt-2"
        meta={`${cookTime(recipe.timeHours)} · serves ${recipe.servings} · last eaten ${lastEaten(recipe.lastEaten)}`}
      >
        {recipe.name}
      </SectionHeader>

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
          lines: recipe.lines.map((line) => ({
            ingredientId: line.ingredientId,
            amount: line.amount,
            unit: line.unit,
          })),
        }}
        ingredientOptions={ingredientOptions}
        units={[...unitEnum.enumValues]}
      />
    </AppShell>
  );
}
