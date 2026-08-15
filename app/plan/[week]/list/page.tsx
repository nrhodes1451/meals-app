import { notFound } from 'next/navigation';
import { getDb } from '@/db';
import { AppShell } from '@/components/shell';
import { ShoppingListView } from '@/components/list/shopping-list';
import { loadWeekList } from '@/lib/shopping';
import { isValidWeekStarting, listPlanWeeks } from '@/lib/week';

export const metadata = { title: 'Shopping list' };

export default async function ShoppingListPage({
  params,
}: {
  params: Promise<{ week: string }>;
}) {
  const { week } = await params;
  if (!isValidWeekStarting(week)) notFound();

  const db = await getDb();
  const [{ list }, weeks] = await Promise.all([loadWeekList(db, week), listPlanWeeks(db)]);

  return (
    <AppShell week={week} current={`/plan/${week}/list`} phone>
      <ShoppingListView week={week} weeks={weeks} list={list} />
    </AppShell>
  );
}
