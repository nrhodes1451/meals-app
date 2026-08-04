'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Button, Select, Switch } from '@/components/penrose';
import type { RollFilters } from '@/lib/roll';

const TIMES = [20, 30, 40, 60];
const WINDOWS = [2, 3, 4, 6, 8];

/**
 * Filters live in the URL rather than component state, so the pool is filtered on the server and
 * the 170-recipe library is never shipped to the browser. The behaviour is the prototype's; the
 * plumbing is not.
 */
export function PlannerFilterBar({
  filters,
  poolSize,
  poolTotal,
  onRollWeek,
  onUnlockAll,
  pending,
}: {
  filters: RollFilters;
  poolSize: number;
  poolTotal: number;
  onRollWeek: () => void;
  onUnlockAll: () => void;
  pending: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [navigating, startTransition] = useTransition();

  function set(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value === null) next.delete(key);
    else next.set(key, value);
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  const busy = pending || navigating;

  return (
    <div className="flex flex-wrap items-end gap-6 border-b border-ink pb-4">
      <div className="flex flex-col gap-1">
        <span className="font-display text-label font-bold uppercase tracking-label">
          Vegetarian only
        </span>
        <Switch
          checked={filters.vegetarianOnly}
          onCheckedChange={(on) => set('veg', on ? '1' : null)}
          label="Vegetarian only"
        />
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-display text-label font-bold uppercase tracking-label">
          Max cook time
        </span>
        <Select
          className="w-[120px]"
          value={filters.maxMinutes ?? ''}
          onChange={(event) => set('time', event.target.value || null)}
        >
          <option value="">Any</option>
          {TIMES.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} min
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-display text-label font-bold uppercase tracking-label">
          Not eaten in the last
        </span>
        <Select
          className="w-[160px]"
          value={filters.excludeWeeks ?? ''}
          onChange={(event) => set('excl', event.target.value || null)}
        >
          <option value="">No restriction</option>
          {WINDOWS.map((weeks) => (
            <option key={weeks} value={weeks}>
              {weeks} weeks
            </option>
          ))}
        </Select>
      </label>

      <div className="ml-auto flex items-end gap-4">
        <span className="pen-tabular font-display text-sm font-thin text-ink">
          {poolSize} of {poolTotal} in pool
        </span>
        <Button variant="quiet" onClick={onUnlockAll} disabled={busy}>
          Unlock all
        </Button>
        <Button size="lg" onClick={onRollWeek} disabled={busy}>
          Roll the week
        </Button>
      </div>
    </div>
  );
}
