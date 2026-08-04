import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * An icon-only control. `label` is required, not optional: an icon without a label is not a
 * control anyone can use, and Penrose says so explicitly.
 *
 * 48px by default. The design handoff draws several of these at 40px - the ingredient reorder
 * chevrons, the aisle order chevrons - which is below the 44px floor CLAUDE.md calls a
 * requirement. They are 48px here. The glyph inside stays 20-24px, which is Penrose's own
 * pattern, so the control reads as small while the target is not.
 */
const iconButtonVariants = cva(
  'inline-flex shrink-0 items-center justify-center rounded-none border-0 p-0 cursor-pointer transition-colors duration-[120ms] ease-pen disabled:opacity-40 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-ground not-disabled:hover:bg-primary-lift',
        secondary: 'bg-primary-tint text-primary not-disabled:hover:bg-primary-tint-lift',
        quiet: 'bg-transparent text-ink not-disabled:hover:bg-primary-tint',
      },
      size: {
        touch: 'size-touch',
        lg: 'size-touch-lg',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'touch' },
  },
);

type IconButtonProps = Omit<React.ComponentProps<'button'>, 'aria-label'> &
  VariantProps<typeof iconButtonVariants> & { label: string; asChild?: boolean };

export function IconButton({
  className,
  variant,
  size,
  label,
  asChild = false,
  type = 'button',
  children,
  ...props
}: IconButtonProps) {
  const Component = asChild ? Slot : 'button';
  return (
    <Component
      {...(asChild ? {} : { type })}
      aria-label={label}
      title={label}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </Component>
  );
}
