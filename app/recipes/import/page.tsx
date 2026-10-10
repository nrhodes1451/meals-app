import { getDb } from '@/db';
import { unitEnum } from '@/db/schema';
import { AppShell } from '@/components/shell';
import { ImportJourney } from '@/components/library/import-journey';
import { ingredientName } from '@/lib/format';
import { loadCategories, loadIngredients } from '@/lib/ingredients';
import { currentWeekStarting } from '@/lib/week';

export const metadata = { title: 'Recipe from a photo' };

// Reads the ingredient list, which must be current: it would otherwise be frozen at build time.
export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const db = await getDb();
  const [categories, ingredients] = await Promise.all([loadCategories(db), loadIngredients(db)]);

  return (
    <AppShell week={currentWeekStarting()} current="/recipes">
      <ImportJourney
        ingredientOptions={ingredients
          .map((row) => ({ id: row.id, name: ingredientName(row) }))
          .sort((a, b) => a.name.localeCompare(b.name, 'en-GB'))}
        categories={categories.map(({ id, name }) => ({ id, name }))}
        units={[...unitEnum.enumValues]}
      />
    </AppShell>
  );
}
