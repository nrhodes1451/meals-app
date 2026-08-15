import { notFound } from 'next/navigation';
import { getDb } from '@/db';
import { AppShell } from '@/components/shell';
import { SectionHeader } from '@/components/penrose';
import { CookedList } from '@/components/cooked/meal-list';
import { WeekSwitcher } from '@/components/planner/week-switcher';
import { loadPlan } from '@/lib/plan';
import { isValidWeekStarting, listPlanWeeks } from '@/lib/week';

export const metadata = { title: 'This week' };

export default async function CookedPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  if (!isValidWeekStarting(week)) notFound();

  const db = await getDb();
  const [{ slots }, weeks] = await Promise.all([loadPlan(db, week), listPlanWeeks(db)]);

  const filled = slots.filter((slot) => slot.recipe !== null);
  const eaten = filled.filter((slot) => slot.eaten).length;

  return (
    <AppShell week={week} current={`/plan/${week}/cooked`} phone>
      <SectionHeader
        level={1}
        size="page"
        meta={`${eaten} of ${filled.length} eaten`}
        className="pt-4"
      >
        This week
      </SectionHeader>

      <WeekSwitcher week={week} weeks={weeks} suffix="/cooked" className="mb-6" />

      <CookedList week={week} slots={slots} />
    </AppShell>
  );
}
