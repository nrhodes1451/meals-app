import { cn } from '@/lib/cn';

/**
 * The tick box on the shopping list and This Week: blush when unchecked, primary when checked,
 * with a white rhomb as the tick. Colour swaps in 120ms; nothing moves.
 *
 * Presentational on purpose. The tap target is the whole 68px row, not this square, so the row
 * owns the control semantics and this only draws the state. shadcn's Checkbox is a 16px rounded
 * box with a Lucide check and cannot be restyled into this.
 */
export function TickMark({
  checked,
  className,
}: {
  checked: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-touch-min shrink-0 items-center justify-center transition-colors duration-[120ms] ease-pen',
        checked ? 'bg-primary' : 'bg-blush',
        className,
      )}
    >
      <span
        className={cn(
          'size-4 transition-colors duration-[120ms] ease-pen',
          checked ? 'bg-paper' : 'bg-transparent',
        )}
        style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
      />
    </span>
  );
}

/**
 * A 24px selection square for the admin table, drawn small but sitting inside a 44px target.
 * The design specifies 24px for the whole control; the target is raised here and the glyph is
 * left at the drawn size.
 */
export function SelectMark({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-6 items-center justify-center transition-colors duration-[120ms] ease-pen',
        selected ? 'bg-primary' : 'bg-blush',
      )}
    >
      <span
        className={cn('size-2', selected ? 'bg-paper' : 'bg-transparent')}
        style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
      />
    </span>
  );
}
