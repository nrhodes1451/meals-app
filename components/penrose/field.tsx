import { cn } from '@/lib/cn';

/**
 * Keeps the uppercase label and the hint or error treatment identical across every control.
 * Errors say what went wrong and how to fix it; they do not apologise.
 */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label
        htmlFor={htmlFor}
        className="font-display text-sm font-bold uppercase tracking-label text-ink"
      >
        {label}
      </label>
      {children}
      {error || hint ? (
        <span className={cn('text-xs leading-tight', error ? 'text-danger' : 'text-ink-70')}>
          {error ?? hint}
        </span>
      ) : null}
    </div>
  );
}

/**
 * A 6px progress bar, ink at 15% behind a primary fill. The width transition is the one thing in
 * this design that moves rather than swapping colour; `prefers-reduced-motion` neutralises it in
 * tokens.css.
 */
export function ProgressBar({
  value,
  max,
  label,
  className,
}: {
  value: number;
  max: number;
  label: string;
  className?: string;
}) {
  const percent = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('h-[6px] w-full bg-ink-15', className)}
    >
      <div
        className="h-full bg-primary transition-[width] duration-[160ms] ease-pen"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
