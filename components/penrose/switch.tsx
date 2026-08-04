'use client';

import { cn } from '@/lib/cn';

/**
 * A two-state switch. The track is square and the thumb changes side without animating:
 * Penrose allows colour swaps only, so nothing here slides or scales. The colour crossfades
 * over 120ms; the position simply changes.
 *
 * Built on a native checkbox with `role="switch"` rather than Radix's Switch, whose default is
 * a rounded pill with a transitioned thumb - the two things this system forbids. Native also
 * gives keyboard and label behaviour for free.
 */
type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  /** Shown beside the track. Defaults to On/Off, as the design specifies for the filter bar. */
  stateLabel?: (checked: boolean) => string;
  className?: string;
};

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  stateLabel = (on) => (on ? 'On' : 'Off'),
  className,
}: SwitchProps) {
  return (
    <label
      className={cn(
        'inline-flex min-h-touch items-center gap-2 text-base text-ink',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
        className,
      )}
    >
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="absolute size-[1px] opacity-0"
      />
      <span
        aria-hidden="true"
        className={cn(
          'flex h-8 w-16 shrink-0 items-center p-[2px] transition-colors duration-[120ms] ease-pen',
          checked ? 'justify-end bg-primary' : 'justify-start bg-blush',
        )}
      >
        <span
          className={cn(
            'size-[26px] transition-colors duration-[120ms] ease-pen',
            checked ? 'bg-ground' : 'bg-ink',
          )}
        />
      </span>
      <span className="font-display text-sm font-bold uppercase tracking-label">
        {stateLabel(checked)}
      </span>
    </label>
  );
}
