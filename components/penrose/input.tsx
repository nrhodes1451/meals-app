import { cn } from '@/lib/cn';

/**
 * Inputs carry a single bottom rule and nothing else. Nothing in this system is boxed.
 */
const field =
  'w-full min-h-touch rounded-none border-0 border-b bg-paper px-2 font-body text-base text-ink placeholder:text-ink-70';

type InputProps = React.ComponentProps<'input'> & { invalid?: boolean; tabular?: boolean };

export function Input({ className, invalid = false, tabular = false, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        field,
        invalid ? 'border-b-2 border-danger' : 'border-ink',
        tabular && 'pen-tabular',
        className,
      )}
      {...props}
    />
  );
}

type TextareaProps = React.ComponentProps<'textarea'> & { invalid?: boolean };

export function Textarea({ className, invalid = false, rows = 9, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        field,
        'py-2 leading-body resize-y',
        invalid ? 'border-b-2 border-danger' : 'border-ink',
        className,
      )}
      {...props}
    />
  );
}

/**
 * A native select, which is what Penrose itself ships: a bottom rule and the platform's own
 * picker. shadcn's Select is a Radix popover, which would have to be stripped of its rounding,
 * shadow and open animation to fit here, and would replace the iPad's native picker with a
 * custom listbox on the device this app is planned on. The native control is the better one.
 */
type SelectProps = React.ComponentProps<'select'> & { invalid?: boolean };

export function Select({ className, invalid = false, children, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        field,
        'appearance-none cursor-pointer',
        invalid ? 'border-b-2 border-danger' : 'border-ink',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
