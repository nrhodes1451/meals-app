'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/cn';
import { IconButton } from './icon-button';

/**
 * Borderless paper over an ink scrim at 70%, square, no shadow and no entry animation.
 *
 * Radix supplies what the design cannot draw: a focus trap, Escape to close, scroll lock and
 * the aria wiring. Its visual defaults - rounded corners, shadow, scale-in - are all removed.
 * The close control is a full 48px icon button; Penrose forbids small close buttons.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  width = 560,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  width?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-scrim" />
        <RadixDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[82vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-none bg-paper p-6',
          )}
          style={{ maxWidth: width }}
        >
          <div className="flex items-center justify-between gap-4">
            <RadixDialog.Title className="font-display text-3xl font-black uppercase tracking-display">
              {title}
            </RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton label="Close" variant="quiet">
                <span aria-hidden="true" className="text-2xl leading-none">
                  ×
                </span>
              </IconButton>
            </RadixDialog.Close>
          </div>
          <hr className="mt-1 mb-6 border-0 border-t border-ink-25" />
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
