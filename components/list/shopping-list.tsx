'use client';

import { useCallback, useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Trash2 } from 'lucide-react';
import { Button, IconButton, Input, ProgressBar, TickMark } from '@/components/penrose';
import { TraceDialog } from './trace-dialog';
import {
  addManualItem,
  removeManualItem,
  setItemChecked,
  setManualChecked,
  setStapleOverride,
  uncheckAll,
  type ActionResult,
} from '@/app/plan/[week]/list/actions';
import { slotRef } from '@/lib/format';
import type { ListItem, ShoppingList } from '@/lib/aggregate';
import { cn } from '@/lib/cn';

/**
 * The back-reference under an item name. One meal names it; more than one counts. Uppercase
 * because it is a control, and 12px because it is secondary to the item itself.
 */
function usedInLabel(item: ListItem): string {
  if (item.uses.length === 1) {
    const [use] = item.uses;
    return `${slotRef(use.position)} · ${use.recipeName}`;
  }
  return `Used in ${item.uses.length} meals`;
}

function Row({
  item,
  checked,
  disabled,
  onToggle,
  onTrace,
}: {
  item: ListItem;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
  onTrace: () => void;
}) {
  return (
    <li className="border-0 border-t border-ink-25 first:border-t-0">
      {/*
        The whole row is the target, not a checkbox inside it. That is the dominant interaction
        on this screen and it is used one-handed, in a shop, by someone who may not be able to
        hit a small square.
      */}
      <div
        role="checkbox"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            onToggle();
          }
        }}
        className={cn(
          'flex min-h-[68px] w-full cursor-pointer items-center gap-3 py-2 transition-colors duration-[120ms] ease-pen hover:bg-primary-tint',
          disabled && 'cursor-not-allowed',
        )}
      >
        <TickMark checked={checked} />

        <div className="min-w-0 flex-1">
          <span
            className={cn(
              'block text-lg',
              checked ? 'text-ink-70 line-through' : 'text-ink',
            )}
          >
            {item.name}
          </span>

          {item.uses.length ? (
            <button
              type="button"
              onClick={(event) => {
                // The row is the tick target, so the trace control has to stop here.
                event.stopPropagation();
                onTrace();
              }}
              className="mt-[2px] inline-flex min-h-touch-min cursor-pointer items-center border-0 bg-transparent p-0 pr-2 text-left font-display text-xs font-bold uppercase tracking-label text-primary hover:text-primary-lift"
            >
              {usedInLabel(item)}
            </button>
          ) : null}
        </div>

        {/*
          Buckets that do not reconcile are stacked, never converted. The first is the headline
          quantity; the rest read as additions to it.
        */}
        <div className="shrink-0 text-right">
          {item.quantity.lines.map((line, index) => (
            <span
              key={line}
              className={cn(
                'pen-tabular block font-display font-bold',
                index === 0 ? 'text-lg text-ink' : 'text-sm-plus text-primary',
              )}
            >
              {index === 0 ? line : `+ ${line}`}
            </span>
          ))}
        </div>
      </div>
    </li>
  );
}

export function ShoppingListView({ week, list }: { week: string; list: ShoppingList }) {
  const [error, setError] = useState<string | null>(null);
  const [trace, setTrace] = useState<ListItem | null>(null);
  const [showStaples, setShowStaples] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [pending, startTransition] = useTransition();

  const run = useCallback((action: () => Promise<ActionResult>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  }, []);

  return (
    <>
      {/*
        Sticky under the tab strip on phone (strip is 48px + 1px rule → top 49px) and at the
        viewport top when the rail is present. Section headers sit below this block.
      */}
      <div className="sticky top-[49px] z-20 bg-paper pt-4 min-[900px]:top-0">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="font-display text-3xl font-black uppercase tracking-display">
            Shopping list
          </h1>
          <span className="pen-tabular font-display text-sm font-bold uppercase tracking-label text-primary">
            {list.remaining} of {list.total} left
          </span>
        </div>
        <ProgressBar
          value={list.checked}
          max={list.total}
          label="Shopping list progress"
          className="mt-2"
        />
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {list.sections.length === 0 && list.manual.length === 0 ? (
        <p className="mt-8 text-ink-70">Nothing on the list. Pick some meals for the week.</p>
      ) : null}

      {list.sections.map((section) => (
        <section key={section.categoryId} className="mt-6">
          <div className="sticky top-[135px] z-10 flex items-baseline justify-between gap-4 border-0 border-b border-ink bg-paper py-1 min-[900px]:top-[86px]">
            <h2 className="font-display text-md font-black uppercase tracking-display">
              {section.name}
            </h2>
            <span className="pen-tabular font-display text-xs font-bold uppercase tracking-label text-primary">
              {section.remaining} left
            </span>
          </div>

          <ul className="list-none p-0">
            {section.items.map((item) => (
              <Row
                key={item.ingredientId}
                item={item}
                checked={item.checked}
                disabled={pending}
                onToggle={() => run(() => setItemChecked(week, item.ingredientId, !item.checked))}
                onTrace={() => setTrace(item)}
              />
            ))}
          </ul>
        </section>
      ))}

      {/* Anything with no ingredient record: batteries, a card. Schema calls these manual. */}
      <section className="mt-6">
        <div className="sticky top-[135px] z-10 flex items-baseline justify-between gap-4 border-0 border-b border-ink bg-paper py-1 min-[900px]:top-[86px]">
          <h2 className="font-display text-md font-black uppercase tracking-display">Also</h2>
        </div>

        <ul className="list-none p-0">
          {list.manual.map((item) => (
            <li
              key={item.id}
              className="flex min-h-[68px] items-center gap-3 border-0 border-t border-ink-25 py-2 first:border-t-0"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={item.checked}
                aria-label={item.freeText}
                disabled={pending}
                onClick={() => run(() => setManualChecked(week, item.id, !item.checked))}
                className="flex min-h-[52px] min-w-0 flex-1 cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left transition-colors duration-[120ms] ease-pen hover:bg-primary-tint disabled:cursor-not-allowed"
              >
                <TickMark checked={item.checked} />
                <span
                  className={cn(
                    'text-lg',
                    item.checked ? 'text-ink-70 line-through' : 'text-ink',
                  )}
                >
                  {item.freeText}
                </span>
              </button>
              <IconButton
                label={`Remove ${item.freeText}`}
                variant="quiet"
                disabled={pending}
                onClick={() => run(() => removeManualItem(week, item.id))}
              >
                <Trash2 size={20} aria-hidden />
              </IconButton>
            </li>
          ))}
        </ul>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const text = newItem;
            setNewItem('');
            run(() => addManualItem(week, text));
          }}
        >
          <Input
            value={newItem}
            onChange={(event) => setNewItem(event.target.value)}
            aria-label="Add an item"
            placeholder="Add an item"
            className="min-w-0 flex-1"
          />
          <Button type="submit" variant="secondary" disabled={pending || !newItem.trim()}>
            Add item
          </Button>
        </form>
      </section>

      {list.suppressed.length ? (
        <section className="mt-8">
          <div className="flex min-h-touch-lg items-center justify-between gap-4 bg-blush px-4">
            <span className="font-display text-sm font-bold uppercase tracking-label text-ink">
              Suppressed - pantry staples ({list.suppressed.length})
            </span>
            <Button variant="quiet" onClick={() => setShowStaples((shown) => !shown)}>
              {showStaples ? 'Hide' : 'Show'}
            </Button>
          </div>

          {showStaples ? (
            <ul className="list-none p-0">
              {list.suppressed.map((item) => (
                <li
                  key={item.ingredientId}
                  className="flex min-h-[68px] items-center gap-3 border-0 border-t border-ink-25 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block text-lg">{item.name}</span>
                    <span className="text-sm text-ink-70">
                      {item.uses.length === 1 ? '1 meal' : `${item.uses.length} meals`}
                    </span>
                  </div>
                  <span className="pen-tabular shrink-0 font-display font-bold">
                    {item.quantity.lines.join(', ')}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={() => run(() => setStapleOverride(week, item.ingredientId, true))}
                  >
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {/*
        Restored staples sit in their aisle with everything else, so the only way back off the
        list is here, beside the block they came from.
      */}
      {list.sections.some((section) => section.items.some((item) => item.restored)) ? (
        <ul className="mt-4 list-none p-0">
          {list.sections
            .flatMap((section) => section.items)
            .filter((item) => item.restored)
            .map((item) => (
              <li key={item.ingredientId} className="flex min-h-touch items-center gap-3">
                <span className="min-w-0 flex-1 text-sm text-ink-70">
                  {item.name} was restored to the list.
                </span>
                <Button
                  variant="quiet"
                  disabled={pending}
                  onClick={() => run(() => setStapleOverride(week, item.ingredientId, false))}
                >
                  Remove
                </Button>
              </li>
            ))}
        </ul>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2 pb-8">
        <Button variant="quiet" disabled={pending || list.checked === 0} onClick={() => run(() => uncheckAll(week))}>
          Uncheck all
        </Button>
        <Button variant="quiet" asChild>
          <Link href={`/plan/${week}` as Route}>Back to planner</Link>
        </Button>
      </div>

      <TraceDialog item={trace} onClose={() => setTrace(null)} />
    </>
  );
}
