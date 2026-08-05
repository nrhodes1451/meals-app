'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/cn';
import { IconButton } from './icon-button';

/**
 * Borderless paper over an ink scrim at 70%, square, no shadow and no entry animation.
 *
 * Above 900px: centred modal capped at `width`. Below: full-width bottom sheet up to 92vh.
 * Radix supplies the focus trap, Escape to close, scroll lock and aria wiring; its visual
 * defaults are removed. The close control is a full 48px icon button.
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
  // Arbitrary pixel widths from callers; mapped to Tailwind so phone can stay full-bleed
  // without an inline maxWidth that would fight the bottom sheet.
  const desktopMax =
    width >= 680 ? 'min-[900px]:max-w-[680px]' : 'min-[900px]:max-w-[560px]';

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-scrim" />
        <RadixDialog.Content
          className={cn(
            'fixed z-50 flex flex-col rounded-none bg-paper p-6',
            'inset-x-0 bottom-0 max-h-[92vh] w-full',
            'min-[900px]:inset-x-auto min-[900px]:bottom-auto min-[900px]:left-1/2 min-[900px]:top-1/2 min-[900px]:max-h-[82vh] min-[900px]:w-[calc(100%-2rem)] min-[900px]:-translate-x-1/2 min-[900px]:-translate-y-1/2',
            desktopMax,
          )}
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
