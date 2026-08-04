import { cn } from '@/lib/cn';

/**
 * A heading with a hairline beneath it and optional right-aligned meta. Rules do the dividing
 * work in this system, so the motif is componentised rather than repeated.
 */
export function SectionHeader({
  children,
  meta,
  level = 2,
  size = 'panel',
  className,
}: {
  children: React.ReactNode;
  meta?: React.ReactNode;
  level?: 1 | 2 | 3;
  size?: 'page' | 'panel' | 'list';
  className?: string;
}) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  const sizes = {
    page: 'text-3xl',
    panel: 'text-xl',
    list: 'text-md',
  } as const;

  return (
    <div className={cn('mb-4', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <Tag className={cn('font-display font-black uppercase tracking-display', sizes[size])}>
          {children}
        </Tag>
        {meta ? (
          <span className="font-display text-sm font-thin uppercase tracking-label text-ink">
            {meta}
          </span>
        ) : null}
      </div>
      <hr className="mt-1 border-0 border-t border-ink-25" />
    </div>
  );
}

/**
 * Penrose has no double rule - it read as dated - so `--pen-rule-double` from the handed-over
 * token file is deliberately unused. `block` is the 3px solid rule the planner rail uses.
 */
export function Divider({
  variant = 'row',
  className,
}: {
  variant?: 'row' | 'strong' | 'metallic' | 'block';
  className?: string;
}) {
  const variants = {
    row: 'border-t border-ink-25',
    strong: 'border-t border-ink',
    metallic: 'border-t border-gold',
    block: 'border-t-[3px] border-ink',
  } as const;
  return <hr className={cn('border-0', variants[variant], className)} />;
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'quiet' | 'success' | 'warning' | 'danger' | 'ink';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-primary-tint text-ink',
    // No fill. The design uses this for "MEAT / FISH", which is the absence of the veg badge.
    quiet: 'bg-transparent text-ink-70',
    success: 'bg-success text-paper',
    warning: 'bg-warning text-ink',
    danger: 'bg-danger text-paper',
    ink: 'bg-ink text-ground',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center px-2 py-[3px] font-display text-xs font-bold uppercase tracking-label',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A large tabular figure with a light label. Figures are the content on most of these screens. */
export function StatFigure({
  label,
  value,
  unit,
  tone = 'ink',
  className,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  tone?: 'ink' | 'primary' | 'inverse';
  className?: string;
}) {
  const tones = { ink: 'text-ink', primary: 'text-primary', inverse: 'text-ground' } as const;
  return (
    <div className={cn('flex flex-col gap-[2px]', tones[tone], className)}>
      <span className="font-display text-sm font-thin uppercase tracking-label">{label}</span>
      <span className="pen-tabular font-display text-figure font-black leading-none">
        {value}
        {unit ? <span className="ml-1 text-xl font-thin">{unit}</span> : null}
      </span>
    </div>
  );
}
