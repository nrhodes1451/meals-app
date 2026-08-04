import Link from 'next/link';
import type { Route } from 'next';
import { cn } from '@/lib/cn';

/**
 * The one left rail every screen in the household shares: 232px, ink, with a gold hairline
 * under the wordmark and 56px rows. Active is a primary fill, which is also the 56px minimum
 * Penrose sets for nav rows.
 *
 * There is no shadcn equivalent, so this is written from the Penrose spec.
 */
export type NavItem = { href: Route; label: string; icon?: React.ReactNode };

export function NavRail({
  items,
  current,
  title = 'Meal planner',
  className,
}: {
  items: NavItem[];
  current: string;
  title?: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Screens"
      className={cn('flex w-[232px] shrink-0 flex-col bg-ink text-ground', className)}
    >
      <div className="border-0 border-b border-gold px-4 py-6">
        <span className="font-display text-2xl font-black uppercase tracking-[0.14em]">
          {title}
        </span>
      </div>
      <div className="flex flex-col">
        {items.map((item) => {
          const active = item.href === current;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-touch-lg items-center gap-4 border-0 border-b px-4 text-left font-display text-sm uppercase tracking-label no-underline transition-colors duration-[120ms] ease-pen',
                'border-b-[color-mix(in_srgb,var(--pen-accent-gold)_35%,transparent)]',
                active
                  ? 'bg-primary font-black text-ground'
                  : 'bg-transparent font-normal text-ground hover:bg-primary-lift',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
