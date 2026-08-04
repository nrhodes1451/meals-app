import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * Penrose Button. Filled, square, uppercase condensed. No border and no shadow: this system
 * has no depth, so a button is a block of colour.
 *
 * Sizes are touch targets first. md is 48px, lg is 56px and is for primary page actions.
 * There is no small size, deliberately - one user has limited fine motor control, and 44px is
 * the floor everywhere.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-none border-0 font-display font-bold uppercase tracking-label leading-none cursor-pointer transition-colors duration-[120ms] ease-pen disabled:opacity-40 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-ground hover:bg-primary-lift not-disabled:hover:bg-primary-lift',
        secondary: 'bg-primary-tint text-primary not-disabled:hover:bg-primary-tint-lift',
        quiet: 'bg-transparent text-primary not-disabled:hover:bg-primary-tint',
        destructive: 'bg-danger text-paper not-disabled:hover:bg-danger-deep',
      },
      size: {
        md: 'min-h-touch px-6 text-sm',
        lg: 'min-h-touch-lg px-8 text-xl',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  type = 'button',
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : 'button';
  return (
    <Component
      {...(asChild ? {} : { type })}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
