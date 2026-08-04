'use client';

import { Dialog } from '@/components/penrose';
import { slotLabel } from '@/lib/format';
import type { ListItem } from '@/lib/aggregate';

/**
 * Where an item came from. The context line only claims the quantities were left unconverted
 * when they genuinely could not be reconciled - grams and punnets do not sum, grams and
 * kilograms do, and the list has already summed those.
 */
export function TraceDialog({ item, onClose }: { item: ListItem | null; onClose: () => void }) {
  return (
    <Dialog
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={item?.name ?? ''}
      width={520}
    >
      {item ? (
        <>
          {item.trace ? <p className="mb-6 text-sm text-ink-70">{item.trace}</p> : null}

          <ul className="list-none p-0">
            {item.uses.map((use) => (
              <li
                key={`${use.position}-${use.recipeId}`}
                className="flex min-h-touch items-center gap-3 border-0 border-t border-ink-25 py-2 first:border-t-0"
              >
                <span className="pen-tabular w-8 shrink-0 font-display text-sm font-black text-primary">
                  {slotLabel(use.position)}
                </span>
                <span className="min-w-0 flex-1">{use.recipeName}</span>
                <span className="pen-tabular shrink-0 font-display font-bold">{use.quantity}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Dialog>
  );
}
