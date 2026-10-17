'use client';

import { Button, Dialog } from '@/components/penrose';
import { slotLabel } from '@/lib/format';
import type { OrderChange, OrderRemoval } from '@/lib/aggregate';

/**
 * Dropping a meal after the order has gone in. Lists what to take off the Ocado order: things
 * nothing else needs come off entirely, things another meal still uses are reduced, with the
 * meals that still need them named so the shopper can see why.
 */
export function OrderRemovalDialog({
  meal,
  removal,
  pending,
  onSkip,
  onClose,
}: {
  meal: { position: number; name: string } | null;
  removal: OrderRemoval | null;
  pending: boolean;
  onSkip: () => void;
  onClose: () => void;
}) {
  const empty =
    removal !== null && removal.remove.length === 0 && removal.reduce.length === 0;

  return (
    <Dialog
      open={meal !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Take off order"
      width={560}
      footer={
        removal && !removal.skipped ? (
          <>
            <Button variant="quiet" onClick={onClose}>
              Close
            </Button>
            <Button disabled={pending} onClick={onSkip}>
              Skip ingredients
            </Button>
          </>
        ) : null
      }
    >
      {meal && removal ? (
        <>
          <p className="mb-6 text-sm text-ink-70">
            <span className="pen-tabular font-display font-black text-primary">
              {slotLabel(meal.position)}
            </span>{' '}
            <span className="font-bold text-ink">{meal.name}</span>
          </p>

          {removal.skipped ? (
            <p className="text-sm text-ink">
              This meal already skips its ingredients, so nothing from it is on the order.
            </p>
          ) : empty ? (
            <p className="text-sm text-ink">Nothing from this meal is on the order.</p>
          ) : null}

          {removal.remove.length ? (
            <ChangeGroup heading="Remove">
              {removal.remove.map((change) => (
                <ChangeRow key={change.ingredientId} change={change} figure={change.remove.join(', ')}>
                  No other meal this week needs it.
                </ChangeRow>
              ))}
            </ChangeGroup>
          ) : null}

          {removal.reduce.length ? (
            <ChangeGroup heading="Reduce">
              {removal.reduce.map((change) => (
                <ChangeRow
                  key={change.ingredientId}
                  change={change}
                  figure={`${change.remove.join(', ')} less`}
                >
                  Keep {change.keep.join(', ')} for{' '}
                  {change.keptFor.map((use, index) => (
                    <span key={`${use.position}-${use.recipeId}`}>
                      {index > 0 ? (index === change.keptFor.length - 1 ? ' and ' : ', ') : ''}
                      <span className="font-bold text-ink">{use.recipeName}</span> (
                      {slotLabel(use.position)}, {use.quantity})
                    </span>
                  ))}
                  .
                </ChangeRow>
              ))}
            </ChangeGroup>
          ) : null}

          {removal.staples.length ? (
            <p className="mt-6 text-sm text-ink-70">
              Pantry staples, not on the list: {removal.staples.join(', ')}.
            </p>
          ) : null}

          {!removal.skipped ? (
            <p className="mt-6 text-sm text-ink-70">
              Skip ingredients to take this meal off the shopping list too. It stays in the week.
            </p>
          ) : null}
        </>
      ) : null}
    </Dialog>
  );
}

function ChangeGroup({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="border-0 border-b border-ink pb-1 font-display text-sm font-black uppercase tracking-label">
        {heading}
      </h3>
      <ul className="list-none p-0">{children}</ul>
    </section>
  );
}

function ChangeRow({
  change,
  figure,
  children,
}: {
  change: OrderChange;
  figure: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex min-h-touch flex-col justify-center gap-1 border-0 border-t border-ink-25 py-2 first:border-t-0">
      <div className="flex items-baseline gap-3">
        <span className="min-w-0 flex-1 font-display text-md font-bold">{change.name}</span>
        <span className="pen-tabular shrink-0 font-display font-bold">{figure}</span>
      </div>
      <p className="text-sm text-ink-70">{children}</p>
    </li>
  );
}
