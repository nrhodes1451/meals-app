import { notFound } from 'next/navigation';
import type { Route } from 'next';
import { getDb } from '@/db';
import { PhoneShell } from '@/components/shell';
import { ShoppingListView } from '@/components/list/shopping-list';
import { loadWeekList } from '@/lib/shopping';
import { isValidWeekStarting } from '@/lib/week';

export const metadata = { title: 'Shopping list' };

export default async function ShoppingListPage({
  params,
}: {
  params: Promise<{ week: string }>;
}) {
  const { week } = await params;
  if (!isValidWeekStarting(week)) notFound();

  const db = await getDb();
  const { list } = await loadWeekList(db, week);

  return (
    <PhoneShell
      week={week}
      current={`/plan/${week}/list`}
      backTo={`/plan/${week}` as Route}
      backLabel="Week planner"
    >
      <ShoppingListView week={week} list={list} />
    </PhoneShell>
  );
}
