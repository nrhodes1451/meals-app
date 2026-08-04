import Link from 'next/link';
import type { Route } from 'next';
import { Button, Divider, StatFigure } from '@/components/penrose';
import type { ListSummary } from '@/lib/aggregate';

/**
 * The rail recomputes from the week on every change: there is no generate step, and there must
 * not be one. It is a server component, so it is simply re-rendered with the page.
 */
export function LiveRail({ week, summary }: { week: string; summary: ListSummary }) {
  return (
    <aside aria-label="Shopping list summary">
      <Divider variant="block" />

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-xl font-black uppercase tracking-display">
          Shopping list
        </h2>
        <span className="font-display text-sm font-bold uppercase tracking-label text-primary">
          Live
        </span>
      </div>

      <div className="mt-4">
        <StatFigure label="" value={summary.total} tone="primary" />
        <p className="mt-1 text-sm text-ink-70">
          items · {summary.sections.length} sections
        </p>
      </div>

      <Divider variant="metallic" className="my-4" />

      <ul className="list-none p-0">
        {summary.sections.map((section) => (
          <li
            key={section.name}
            className="flex min-h-11 items-center justify-between gap-4 border-t border-ink-25"
          >
            <span className="truncate text-base">{section.name}</span>
            <span className="pen-tabular shrink-0 text-base">{section.count}</span>
          </li>
        ))}
      </ul>

      {summary.sections.length === 0 ? (
        <p className="text-sm text-ink-70">Nothing to buy yet. Fill the week.</p>
      ) : null}

      {summary.suppressedCount > 0 ? (
        <p className="mt-4 text-sm text-ink-70">
          {summary.suppressedCount} pantry staples suppressed.
        </p>
      ) : null}

      <Button asChild block className="mt-6">
        <Link href={`/plan/${week}/list` as Route}>Open shopping list</Link>
      </Button>
    </aside>
  );
}
