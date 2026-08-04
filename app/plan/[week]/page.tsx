import { notFound } from 'next/navigation';
import { getDb } from '@/db';
import { AppShell } from '@/components/shell';
import { SectionHeader } from '@/components/penrose';
import { LiveRail } from '@/components/planner/live-rail';
import { WeekTable } from '@/components/planner/week-table';
import { summariseShoppingList } from '@/lib/aggregate';
import { weekLabel } from '@/lib/format';
import { loadPlan } from '@/lib/plan';
import { poolSize, type RollFilters } from '@/lib/roll';
import { loadWeekList } from '@/lib/shopping';
import { fromIsoDate, isValidWeekStarting } from '@/lib/week';

export const metadata = { title: 'Week planner' };

function parseFilters(params: Record<string, string | string[] | undefined>): RollFilters {
  const single = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const number = (key: string) => {
    const value = Number(single(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  };

  return {
    vegetarianOnly: single('veg') === '1',
    maxMinutes: number('time'),
    excludeWeeks: number('excl'),
  };
}

export default async function PlannerPage({
  params,
  searchParams,
}: {
  params: Promise<{ week: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { week } = await params;
  if (!isValidWeekStarting(week)) notFound();

  const filters = parseFilters(await searchParams);
  const db = await getDb();

  const { slots, recipes } = await loadPlan(db, week);
  const { list } = await loadWeekList(db, week);

  const unarchived = recipes.filter((recipe) => !recipe.archived).length;

  return (
    <AppShell week={week} current={`/plan/${week}`}>
      {/* The planner keeps its width rather than collapsing: it is a desktop and tablet screen. */}
      <div className="min-w-[1000px]">
        <SectionHeader level={1} size="page" meta={weekLabel(fromIsoDate(week))}>
          Week planner
        </SectionHeader>

        <div className="grid grid-cols-[minmax(560px,1fr)_340px] gap-10">
          <div className="min-w-0">
            <WeekTable
              week={week}
              slots={slots}
              filters={filters}
              poolSize={poolSize(recipes, filters)}
              poolTotal={unarchived}
              pickerRecipes={recipes.map((recipe) => ({
                id: recipe.id,
                name: recipe.name,
                vegetarian: recipe.vegetarian,
                timeHours: recipe.timeHours,
                lastEaten: recipe.lastEaten,
                archived: recipe.archived,
              }))}
            />
          </div>

          <LiveRail week={week} summary={summariseShoppingList(list)} />
        </div>
      </div>
    </AppShell>
  );
}
