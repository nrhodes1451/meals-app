'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { Field, Input, Select, Switch } from '@/components/penrose';
import type { Diet, LibraryFilters, Sort } from '@/lib/recipes';

/**
 * Filters live in the URL rather than component state, so the page stays a server component and
 * the whole library is never shipped to the browser. A filtered view is also linkable, which costs
 * nothing here.
 */
export function LibraryFilterBar({
  filters,
  ingredientOptions,
  action,
}: {
  filters: LibraryFilters;
  ingredientOptions: { id: number; name: string }[];
  action?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(filters.query);

  function apply(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    const search = next.toString();
    router.replace((search ? `${pathname}?${search}` : pathname) as Route, { scroll: false });
  }

  // Typing should not fire a request per keystroke, but should not need a button either.
  useEffect(() => {
    if (query === filters.query) return;
    const timer = setTimeout(() => apply({ q: query || null }), 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="flex flex-wrap items-end gap-4 border-0 border-b border-ink pb-4">
      <Field label="Search" htmlFor="lib-search" className="w-[280px] max-[1239px]:w-full">
        <Input
          id="lib-search"
          value={query}
          placeholder="Recipe name"
          onChange={(event) => setQuery(event.target.value)}
        />
      </Field>

      <Field label="Ingredient" htmlFor="lib-ingredient" className="w-[220px] max-[1239px]:w-full">
        <Select
          id="lib-ingredient"
          value={filters.ingredientId === null ? '' : String(filters.ingredientId)}
          onChange={(event) => apply({ ingredient: event.target.value || null })}
        >
          <option value="">Any</option>
          {ingredientOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Diet" htmlFor="lib-diet" className="w-[170px] max-[1239px]:w-full">
        <Select
          id="lib-diet"
          value={filters.diet}
          onChange={(event) => apply({ diet: event.target.value as Diet })}
        >
          <option value="all">All</option>
          <option value="veg">Vegetarian</option>
          <option value="meat">Meat &amp; fish</option>
        </Select>
      </Field>

      <Field label="Max time" htmlFor="lib-time" className="w-[140px] max-[1239px]:w-full">
        <Select
          id="lib-time"
          value={filters.maxMinutes === null ? '' : String(filters.maxMinutes)}
          onChange={(event) => apply({ time: event.target.value || null })}
        >
          <option value="">Any</option>
          <option value="20">20 min</option>
          <option value="30">30 min</option>
          <option value="40">40 min</option>
          <option value="60">60 min</option>
        </Select>
      </Field>

      <Field label="Sort" htmlFor="lib-sort" className="w-[160px] max-[1239px]:w-full">
        <Select
          id="lib-sort"
          value={filters.sort}
          onChange={(event) => apply({ sort: event.target.value as Sort })}
        >
          <option value="name">Name</option>
          <option value="time">Cook time</option>
          <option value="last">Last eaten</option>
        </Select>
      </Field>

      {/*
        Neither control is in the design handoff. Without the archived switch there is no way to
        reach the 57 legacy recipes CLAUDE.md says are kept for history, and without the keto switch
        the flag 73 recipes carry can never be read.
      */}
      <Field label="Keto only">
        <Switch
          checked={filters.ketoOnly}
          onCheckedChange={(checked) => apply({ keto: checked ? '1' : null })}
          label="Keto only"
        />
      </Field>

      <Field label="Archived">
        <Switch
          checked={filters.includeArchived}
          onCheckedChange={(checked) => apply({ archived: checked ? '1' : null })}
          label="Show archived recipes"
          stateLabel={(on) => (on ? 'Shown' : 'Hidden')}
        />
      </Field>

      {action ? <div className="ml-auto pb-1 max-[1239px]:ml-0">{action}</div> : null}
    </div>
  );
}
