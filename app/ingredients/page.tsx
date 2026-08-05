import { getDb } from '@/db';
import { unitEnum } from '@/db/schema';
import { AppShell } from '@/components/shell';
import { SectionHeader } from '@/components/penrose';
import { AisleOrder } from '@/components/admin/aisle-order';
import { IngredientsTable } from '@/components/admin/ingredients-table';
import { NewIngredient } from '@/components/admin/new-ingredient';
import { loadCategories, loadIngredients } from '@/lib/ingredients';
import type { Unit } from '@/lib/quantity';
import { currentWeekStarting } from '@/lib/week';

export const metadata = { title: 'Ingredients' };

/**
 * Reads the database and calls `currentWeekStarting()`, neither of which survives being
 * prerendered: the image is built without a database, so a static version of this screen would
 * ship empty and with its nav pinned to the build date.
 */
export const dynamic = 'force-dynamic';

/**
 * A rare screen, but the one where data quality is fixed, so density beats friendliness.
 * Everything edits in place and saves as it changes; there is no save button.
 */
export default async function IngredientsPage() {
  const db = await getDb();
  const [rows, categories] = await Promise.all([loadIngredients(db), loadCategories(db)]);

  const staples = rows.filter((row) => row.pantryStaple).length;

  return (
    <AppShell week={currentWeekStarting()} current="/ingredients">
      <SectionHeader
        level={1}
        size="page"
        meta={`${rows.length} ingredients · ${staples} pantry staples`}
      >
        Ingredients
      </SectionHeader>

      <div className="grid grid-cols-1 gap-10 min-[1240px]:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <IngredientsTable
            rows={rows}
            categories={categories}
            units={unitEnum.enumValues as Unit[]}
          />
          <NewIngredient categories={categories} />
        </div>

        <AisleOrder categories={categories} />
      </div>
    </AppShell>
  );
}
