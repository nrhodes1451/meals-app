import { cn } from '@/lib/cn';

/**
 * The design specifies every table as a CSS grid with a fixed column template - `4px 60px
 * minmax(200px,1fr) 92px ...` - which a real `<table>` cannot express and shadcn's Table
 * component does not attempt. The layout is a grid; the semantics are put back explicitly with
 * ARIA roles, so a screen reader still reads rows and columns.
 */
type Align = 'left' | 'right' | 'center';

const alignment: Record<Align, string> = {
  left: 'justify-start text-left',
  right: 'justify-end text-right',
  center: 'justify-center text-center',
};

export function GridTable({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="table" aria-label={label} className={className}>
      {children}
    </div>
  );
}

export function GridRow({
  columns,
  gap = 14,
  className,
  rule = true,
  children,
  ...props
}: {
  columns: string;
  gap?: number;
  className?: string;
  rule?: boolean;
  children: React.ReactNode;
} & Omit<React.ComponentProps<'div'>, 'children' | 'className'>) {
  return (
    <div
      role="row"
      className={cn('grid items-center', rule && 'border-t border-ink-25', className)}
      style={{ gridTemplateColumns: columns, columnGap: gap }}
      {...props}
    >
      {children}
    </div>
  );
}

export function GridHeaderRow({
  columns,
  gap = 14,
  className,
  children,
}: {
  columns: string;
  gap?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="row"
      className={cn('grid items-end pb-2', className)}
      style={{ gridTemplateColumns: columns, columnGap: gap }}
    >
      {children}
    </div>
  );
}

export function GridColumnHeader({
  align = 'left',
  className,
  children,
}: {
  align?: Align;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="columnheader"
      className={cn(
        'flex items-end font-display text-xs font-bold uppercase tracking-label text-ink-70',
        alignment[align],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function GridCell({
  align = 'left',
  tabular = false,
  className,
  children,
}: {
  align?: Align;
  tabular?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="cell"
      className={cn('flex min-w-0 items-center', alignment[align], tabular && 'pen-tabular', className)}
    >
      {children}
    </div>
  );
}
