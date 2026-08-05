import type { Route } from 'next';
import { NavRail, NavTabStrip, type NavItem } from '@/components/penrose';
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
 * Shared chrome for every screen. Above 900px: 232px NavRail. Below: sticky tab strip. Page
 * padding is 32px desktop, 12px phone. Phone-first screens pass `phone` to centre a narrow column.
 */
export function AppShell({
  week,
  current,
  children,
  className,
  phone = false,
}: {
  week: string;
  current: string;
  children: React.ReactNode;
  className?: string;
  /** Centre a max-640/760 column (shopping list, This week). */
  phone?: boolean;
}) {
  const items = navItems(week);

  return (
    <div className="flex min-h-screen flex-col min-[900px]:flex-row">
      <NavRail
        items={items}
        current={current}
        className="sticky top-0 hidden h-screen min-[900px]:flex"
      />
      <NavTabStrip items={items} current={current} className="min-[900px]:hidden" />
      <main
        className={cn(
          'min-w-0 flex-1',
          phone
            ? 'px-3 py-0 min-[900px]:px-8'
            : 'p-3 min-[900px]:p-8',
          className,
        )}
      >
        {phone ? (
          <div className="mx-auto w-full max-w-[640px] min-[900px]:max-w-[760px]">{children}</div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

/**
 * @deprecated Prefer AppShell with phone. Kept as a thin alias so call sites can migrate.
 */
export function PhoneShell({
  week,
  current,
  children,
}: {
  week: string;
  current: string;
  backTo?: Route;
  backLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <AppShell week={week} current={current} phone>
      {children}
    </AppShell>
  );
}
