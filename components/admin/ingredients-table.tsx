'use client';

import { useMemo, useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import {
  Button,
  GridCell,
  GridColumnHeader,
  GridHeaderRow,
  GridRow,
  GridTable,
  IconButton,
  Input,
  SelectMark,
  Select,
} from '@/components/penrose';
import {
  bulkSetCategory,
  bulkTogglePantry,
  deleteIngredient,
  renameIngredient,
  setAliases,
  setCategory,
  setFrozen,
  setPack,
  setPantryStaple,
  type ActionResult,
} from '@/app/ingredients/actions';
import { filterIngredients, type CategoryRow, type IngredientRow } from '@/lib/ingredients';
import type { Unit } from '@/lib/quantity';

/** Select, name, aliases, category, frozen, pantry, pack, delete. */
const COLUMNS =
  '44px minmax(0,1.05fr) minmax(0,1.1fr) 170px 84px 84px 150px 48px';

export function IngredientsTable({
  rows,
  categories,
  units,
}: {
  rows: IngredientRow[];
  categories: CategoryRow[];
  units: Unit[];
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const shown = useMemo(() => filterIngredients(rows, query), [rows, query]);

  /**
   * Every edit here saves as it is made - the design says there is no save button - so a failure
   * has to say what went wrong rather than silently reverting. The server is the source of truth;
   * a rejected edit leaves the field showing what the server still holds after revalidation.
   */
  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  }

  function toggleSelected(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const ids = [...selected];

  return (
    <section aria-label="Ingredients">
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <label className="flex min-w-[280px] flex-col gap-1 max-[899px]:w-full max-[899px]:min-w-0">
          <span className="font-display text-label font-bold uppercase tracking-label">
            Filter
          </span>
          <Input
            value={query}
            placeholder="Name or alias"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 max-[899px]:w-full">
          <span className="font-display text-label font-bold uppercase tracking-label">
            Set category
          </span>
          <Select
            className="w-[170px] max-[899px]:w-full"
            value=""
            disabled={!ids.length || pending}
            onChange={(event) => {
              const categoryId = Number(event.target.value);
              if (categoryId) run(() => bulkSetCategory(ids, categoryId));
            }}
          >
            <option value="">-</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </label>

        <Button
          variant="secondary"
          disabled={!ids.length || pending}
          onClick={() => run(() => bulkTogglePantry(ids))}
        >
          Toggle pantry
        </Button>

        <span className="ml-auto font-display text-sm font-bold uppercase tracking-label text-primary max-[899px]:ml-0">
          {ids.length} selected
        </span>
      </div>

      {error ? (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="hidden min-[1240px]:block">
        <GridTable label="Ingredients">
          <GridHeaderRow columns={COLUMNS}>
            <GridColumnHeader />
            <GridColumnHeader>Name</GridColumnHeader>
            <GridColumnHeader>Aliases</GridColumnHeader>
            <GridColumnHeader>Category</GridColumnHeader>
            <GridColumnHeader align="center">Frozen</GridColumnHeader>
            <GridColumnHeader align="center">Pantry</GridColumnHeader>
            <GridColumnHeader>Pack</GridColumnHeader>
            <GridColumnHeader />
          </GridHeaderRow>

          {shown.map((row) => (
            <GridRow key={row.id} columns={COLUMNS} className="min-h-touch py-1">
              <GridCell>
                <SelectButton
                  name={row.name}
                  selected={selected.has(row.id)}
                  onToggle={() => toggleSelected(row.id)}
                />
              </GridCell>
              <GridCell>
                <NameField row={row} run={run} />
              </GridCell>
              <GridCell>
                <AliasesField row={row} run={run} />
              </GridCell>
              <GridCell>
                <CategoryField row={row} categories={categories} pending={pending} run={run} />
              </GridCell>
              <GridCell align="center">
                <Flag
                  label={`Frozen: ${row.name}`}
                  on={row.frozen}
                  disabled={pending}
                  onToggle={() => run(() => setFrozen(row.id, !row.frozen))}
                />
              </GridCell>
              <GridCell align="center">
                <Flag
                  label={`Pantry staple: ${row.name}`}
                  on={row.pantryStaple}
                  disabled={pending}
                  onToggle={() => run(() => setPantryStaple(row.id, !row.pantryStaple))}
                />
              </GridCell>
              <GridCell>
                <PackFields row={row} units={units} pending={pending} run={run} />
              </GridCell>
              <GridCell align="center">
                <DeleteButton row={row} pending={pending} run={run} />
              </GridCell>
            </GridRow>
          ))}
        </GridTable>
      </div>

      {/*
        Under 1240: select + name + pantry on line one; category + pack on line two; aliases on
        line three. Nothing overlaps and nothing needs horizontal scrolling.
      */}
      <ul className="list-none p-0 min-[1240px]:hidden" aria-label="Ingredients">
        {shown.map((row) => (
          <li key={row.id} className="border-0 border-t border-ink-25 py-3 first:border-t-0">
            <div className="flex items-center gap-3">
              <SelectButton
                name={row.name}
                selected={selected.has(row.id)}
                onToggle={() => toggleSelected(row.id)}
              />
              <div className="min-w-0 flex-1">
                <NameField row={row} run={run} />
              </div>
              <Flag
                label={`Pantry staple: ${row.name}`}
                on={row.pantryStaple}
                disabled={pending}
                onToggle={() => run(() => setPantryStaple(row.id, !row.pantryStaple))}
              />
              <DeleteButton row={row} pending={pending} run={run} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 pl-[56px]">
              <div className="min-w-0 flex-1">
                <CategoryField row={row} categories={categories} pending={pending} run={run} />
              </div>
              <PackFields row={row} units={units} pending={pending} run={run} />
              <Flag
                label={`Frozen: ${row.name}`}
                on={row.frozen}
                disabled={pending}
                onToggle={() => run(() => setFrozen(row.id, !row.frozen))}
              />
            </div>
            <div className="mt-2 pl-[56px]">
              <AliasesField row={row} run={run} className="text-xs" />
            </div>
          </li>
        ))}
      </ul>

      {shown.length === 0 ? <p className="mt-6 text-base">Nothing matches that.</p> : null}
    </section>
  );
}

function SelectButton({
  name,
  selected,
  onToggle,
}: {
  name: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={`Select ${name}`}
      onClick={onToggle}
      className="flex size-touch-min cursor-pointer items-center justify-center border-0 bg-transparent p-0"
    >
      <SelectMark selected={selected} />
    </button>
  );
}

function NameField({
  row,
  run,
}: {
  row: IngredientRow;
  run: (action: () => Promise<ActionResult>) => void;
}) {
  return (
    <Input
      key={row.name}
      defaultValue={row.name}
      aria-label={`Name of ${row.name}`}
      onBlur={(event) => {
        const value = event.target.value;
        if (value.trim() !== row.name) run(() => renameIngredient(row.id, value));
      }}
    />
  );
}

function AliasesField({
  row,
  run,
  className,
}: {
  row: IngredientRow;
  run: (action: () => Promise<ActionResult>) => void;
  className?: string;
}) {
  return (
    <Input
      defaultValue={row.aliases.join(', ')}
      aria-label={`Aliases for ${row.name}`}
      placeholder="-"
      className={className ?? 'text-sm'}
      onBlur={(event) => {
        const value = event.target.value;
        if (value !== row.aliases.join(', ')) run(() => setAliases(row.id, value));
      }}
    />
  );
}

function CategoryField({
  row,
  categories,
  pending,
  run,
}: {
  row: IngredientRow;
  categories: CategoryRow[];
  pending: boolean;
  run: (action: () => Promise<ActionResult>) => void;
}) {
  return (
    <Select
      value={row.categoryId}
      aria-label={`Category for ${row.name}`}
      className="text-sm"
      disabled={pending}
      onChange={(event) => run(() => setCategory(row.id, Number(event.target.value)))}
    >
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </Select>
  );
}

function PackFields({
  row,
  units,
  pending,
  run,
}: {
  row: IngredientRow;
  units: Unit[];
  pending: boolean;
  run: (action: () => Promise<ActionResult>) => void;
}) {
  return (
    <div className="flex w-[110px] items-center gap-1 min-[1240px]:w-full">
      <Input
        defaultValue={row.packSize ?? ''}
        aria-label={`Pack size for ${row.name}`}
        placeholder="-"
        inputMode="decimal"
        tabular
        className="w-[64px] text-sm"
        onBlur={(event) => {
          const value = event.target.value;
          if (value !== String(row.packSize ?? '')) {
            run(() => setPack(row.id, value, row.packUnit ?? ''));
          }
        }}
      />
      <Select
        value={row.packUnit ?? ''}
        aria-label={`Pack unit for ${row.name}`}
        className="w-[76px] text-sm"
        disabled={pending}
        onChange={(event) =>
          run(() => setPack(row.id, String(row.packSize ?? ''), event.target.value as Unit | ''))
        }
      >
        <option value="">-</option>
        {units.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </Select>
    </div>
  );
}

function DeleteButton({
  row,
  pending,
  run,
}: {
  row: IngredientRow;
  pending: boolean;
  run: (action: () => Promise<ActionResult>) => void;
}) {
  return (
    <IconButton
      label={`Delete ${row.name}`}
      variant="quiet"
      disabled={row.uses > 0 || pending}
      title={
        row.uses > 0
          ? `${row.uses} recipes use this, so it cannot be deleted`
          : `Delete ${row.name}`
      }
      onClick={() => run(() => deleteIngredient(row.id))}
    >
      <Trash2 size={20} aria-hidden />
    </IconButton>
  );
}

/**
 * A two-state square. The design draws these at 24 and 30px; the target is 44px here with the
 * drawn mark left small, which is the floor CLAUDE.md sets.
 */
function Flag({
  label,
  on,
  disabled,
  onToggle,
}: {
  label: string;
  on: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className="flex size-touch-min cursor-pointer items-center justify-center border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        aria-hidden="true"
        className={`flex size-[30px] items-center justify-center transition-colors duration-[120ms] ease-pen ${
          on ? 'bg-primary-tint' : 'bg-blush'
        }`}
      >
        <span className={`size-3 ${on ? 'bg-primary' : 'bg-transparent'}`} />
      </span>
    </button>
  );
}
