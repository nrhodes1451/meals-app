import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { NavItem } from './nav-rail';

/**
 * Phone navigation under 900px. Sticky, horizontally scrollable, 48px tabs. Active tab is a
 * solid primary fill with ground text - the same signal as the rail, compressed for one hand.
 */
export function NavTabStrip({
  items,
  current,
  className,
}: {
  items: NavItem[];
  current: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Screens"
      className={cn(
        'sticky top-0 z-30 flex h-touch shrink-0 overflow-x-auto border-0 border-b border-ink bg-paper',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.href === current;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-touch shrink-0 items-center whitespace-nowrap px-4 font-display text-sm uppercase tracking-label no-underline transition-colors duration-[120ms] ease-pen',
              active
                ? 'bg-primary font-black text-ground'
                : 'bg-transparent font-bold text-ink hover:bg-primary-tint',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
