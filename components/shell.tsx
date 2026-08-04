import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft } from 'lucide-react';
import { NavRail, type NavItem } from '@/components/penrose';
import { cn } from '@/lib/cn';

export function navItems(week: string): NavItem[] {
  return [
    { href: `/plan/${week}` as Route, label: 'Week planner' },
    { href: `/plan/${week}/cooked` as Route, label: 'This week' },
    { href: `/plan/${week}/list` as Route, label: 'Shopping list' },
    { href: '/recipes' as Route, label: 'Recipe library' },
    { href: '/ingredients' as Route, label: 'Ingredients' },
  ];
}

/**
 * Desktop and tablet screens: planner, library, recipe detail, ingredients admin. The rail is
 * always present and 1280px is assumed.
 */
export function AppShell({
  week,
  current,
  children,
  className,
}: {
  week: string;
  current: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-screen">
      <NavRail items={navItems(week)} current={current} className="sticky top-0 h-screen" />
      <main className={cn('min-w-0 flex-1 p-8', className)}>{children}</main>
    </div>
  );
}

/**
 * Phone-first screens: the shopping list and This week. Under 900px the rail is gone entirely and
 * replaced by a text back link, because one hand in a supermarket is the case that matters. Above
 * 900px it is the same single column with the rail restored, not a different layout.
 */
export function PhoneShell({
  week,
  current,
  backTo,
  backLabel,
  children,
}: {
  week: string;
  current: string;
  backTo: Route;
  backLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <NavRail
        items={navItems(week)}
        current={current}
        className="sticky top-0 hidden h-screen min-[900px]:flex"
      />
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[640px] px-4 min-[900px]:max-w-[760px] min-[900px]:px-8">
          <Link
            href={backTo}
            className="inline-flex min-h-touch items-center gap-2 font-display text-sm font-bold uppercase tracking-label text-primary no-underline min-[900px]:hidden"
          >
            <ArrowLeft size={16} aria-hidden />
            {backLabel}
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
