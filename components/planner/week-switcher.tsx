'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { Button, Select } from '@/components/penrose';
import { weekLabel } from '@/lib/format';
import { cn } from '@/lib/cn';
import { currentWeekStarting, fromIsoDate, shiftWeek } from '@/lib/week';

export type WeekSuffix = '' | '/cooked' | '/list';

function hrefFor(week: string, suffix: WeekSuffix): Route {
  return `/plan/${week}${suffix}` as Route;
}

export function WeekSwitcher({
  week,
  weeks,
  suffix,
  className,
}: {
  week: string;
  weeks: string[];
  suffix: WeekSuffix;
  className?: string;
}) {
  const router = useRouter();
  const today = currentWeekStarting();
  const next = shiftWeek(week, 1);

  const options = [...weeks].sort().reverse();
  if (!options.includes(week)) options.unshift(week);

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <Select
        aria-label="Week"
        value={week}
        onChange={(event) => router.push(hrefFor(event.target.value, suffix))}
        className="min-w-0 flex-1"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {weekLabel(fromIsoDate(option))}
            {option === today ? ' · this week' : ''}
          </option>
        ))}
      </Select>
      <Button variant="secondary" asChild className="shrink-0 no-underline">
        <Link href={hrefFor(next, suffix)}>Next week</Link>
      </Button>
    </div>
  );
}
