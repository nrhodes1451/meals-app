'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { IconButton, SectionHeader } from '@/components/penrose';
import { moveCategory } from '@/app/ingredients/actions';
import type { CategoryRow } from '@/lib/ingredients';

/**
 * The link between this panel and the shopping list is the reason it exists, so it says so.
 * Eleven categories, not the eight the design drew.
 */
export function AisleOrder({ categories }: { categories: CategoryRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function move(id: number, direction: -1 | 1) {
    setError(null);
    startTransition(async () => {
      const result = await moveCategory(id, direction);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <section aria-label="Aisle order">
      <SectionHeader level={2}>Aisle order</SectionHeader>
      <p className="mb-4 text-sm text-ink-70">
        Shopping list sections follow this order.
      </p>

      {error ? (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <ol className="list-none p-0">
        {categories.map((category, index) => (
          <li
            key={category.id}
            className="flex min-h-touch items-center gap-3 border-t border-ink-25 py-1"
          >
            <span className="pen-tabular w-6 shrink-0 font-display text-sm font-bold text-ink-70">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-base">
              {category.name}
              {category.count === 0 ? (
                <span className="ml-2 text-sm text-ink-70">empty</span>
              ) : null}
            </span>
            <IconButton
              label={`Move ${category.name} up`}
              variant="quiet"
              disabled={index === 0 || pending}
              onClick={() => move(category.id, -1)}
            >
              <ChevronUp size={20} aria-hidden />
            </IconButton>
            <IconButton
              label={`Move ${category.name} down`}
              variant="quiet"
              disabled={index === categories.length - 1 || pending}
              onClick={() => move(category.id, 1)}
            >
              <ChevronDown size={20} aria-hidden />
            </IconButton>
          </li>
        ))}
      </ol>
    </section>
  );
}
