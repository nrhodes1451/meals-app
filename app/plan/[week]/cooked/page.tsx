import { notFound } from 'next/navigation';
import type { Route } from 'next';
import { getDb } from '@/db';
import { PhoneShell } from '@/components/shell';
import { SectionHeader } from '@/components/penrose';
import { CookedList } from '@/components/cooked/meal-list';
import { weekLabel } from '@/lib/format';
import { loadPlan } from '@/lib/plan';
import { fromIsoDate, isValidWeekStarting } from '@/lib/week';

export const metadata = { title: 'This week' };

export default async function CookedPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  if (!isValidWeekStarting(week)) notFound();

  const db = await getDb();
  const { slots } = await loadPlan(db, week);

  const filled = slots.filter((slot) => slot.recipe !== null);
  const eaten = filled.filter((slot) => slot.eaten).length;

  return (
    <PhoneShell
      week={week}
      current={`/plan/${week}/cooked`}
      backTo={`/plan/${week}` as Route}
      backLabel="Week planner"
    >
      <SectionHeader
        level={1}
        size="page"
        meta={`${eaten} of ${filled.length} eaten`}
        className="pt-4"
      >
        This week
      </SectionHeader>

      <p className="mb-6 text-sm text-ink-70">{weekLabel(fromIsoDate(week))}</p>

      <CookedList week={week} slots={slots} />
    </PhoneShell>
  );
}
