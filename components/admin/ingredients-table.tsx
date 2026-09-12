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
  setOcadoUrl,
  setPack,
  setPantryStaple,
  type ActionResult,
} from '@/app/ingredients/actions';
import { filterIngredients, type CategoryRow, type IngredientRow } from '@/lib/ingredients';
import { cn } from '@/lib/cn';
import type { Unit } from '@/lib/quantity';

const OPTIONAL_FIELDS = ['aliases', 'category', 'frozen', 'pantry', 'pack', 'ocado'] as const;
type OptionalField = (typeof OPTIONAL_FIELDS)[number];
type VisibleFields = Record<OptionalField, boolean>;

const DEFAULT_VISIBLE: VisibleFields = {
  aliases: true,
  category: true,
  frozen: true,
  pantry: true,
  pack: true,
  ocado: false,
};

const STORAGE_KEY = 'ingredients-fields';

const FIELD_LABELS: Record<OptionalField, string> = {
  aliases: 'Aliases',
  category: 'Category',
  frozen: 'Frozen',
  pantry: 'Pantry',
  pack: 'Pack',
  ocado: 'Ocado',
};

const FIELD_WIDTHS: Record<OptionalField, string> = {
  aliases: 'minmax(0,1.1fr)',
  category: '170px',
  frozen: '84px',
  pantry: '84px',
  pack: '150px',
  ocado: 'minmax(12rem, 1.2fr)',
};

function readStoredFields(): VisibleFields {
  if (typeof window === 'undefined') return DEFAULT_VISIBLE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VISIBLE;
    const parsed = JSON.parse(raw) as Partial<Record<string, unknown>>;
    const next = { ...DEFAULT_VISIBLE };
    for (const field of OPTIONAL_FIELDS) {
      if (typeof parsed[field] === 'boolean') next[field] = parsed[field];
    }
    return next;
  } catch {
    return DEFAULT_VISIBLE;
  }
}

function columnTemplate(visible: VisibleFields): string {
  const parts = ['44px', 'minmax(0,1.05fr)'];
  for (const field of OPTIONAL_FIELDS) {
    if (visible[field]) parts.push(FIELD_WIDTHS[field]);
  }
  parts.push('48px');
  return parts.join(' ');
}

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
  const [visible, setVisible] = useState<VisibleFields>(readStoredFields);

  const shown = useMemo(() => filterIngredients(rows, query), [rows, query]);
  const columns = columnTemplate(visible);
  const showMeta = visible.category || visible.pack || visible.frozen || visible.pantry;

  function toggleField(field: OptionalField) {
    setVisible((current) => {
      const next = { ...current, [field]: !current[field] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Private mode can refuse storage; the choice still applies this session.
      }
      return next;
    });
  }

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

      <fieldset className="mb-4 min-w-0 border-0 p-0">
        <legend className="font-display text-xs font-bold uppercase tracking-label text-ink-70">
          Fields
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {OPTIONAL_FIELDS.map((field) => {
            const on = visible[field];
            return (
              <button
                key={field}
                type="button"
                aria-pressed={on}
                onClick={() => toggleField(field)}
                className={cn(
                  'min-h-touch min-w-touch cursor-pointer border-0 px-3 font-display text-xs font-bold uppercase tracking-label transition-colors duration-[120ms] ease-pen',
                  on ? 'bg-primary-tint text-ink' : 'bg-blush text-ink-70',
                )}
              >
                {FIELD_LABELS[field]}
              </button>
            );
          })}
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="hidden min-[1240px]:block">
        <GridTable label="Ingredients">
          <GridHeaderRow columns={columns}>
            <GridColumnHeader />
            <GridColumnHeader>Name</GridColumnHeader>
            {visible.aliases ? <GridColumnHeader>Aliases</GridColumnHeader> : null}
            {visible.category ? <GridColumnHeader>Category</GridColumnHeader> : null}
            {visible.frozen ? (
              <GridColumnHeader align="center">Frozen</GridColumnHeader>
            ) : null}
            {visible.pantry ? (
              <GridColumnHeader align="center">Pantry</GridColumnHeader>
            ) : null}
            {visible.pack ? <GridColumnHeader>Pack</GridColumnHeader> : null}
            {visible.ocado ? <GridColumnHeader>Ocado</GridColumnHeader> : null}
            <GridColumnHeader />
          </GridHeaderRow>

          {shown.map((row) => (
            <GridRow key={row.id} columns={columns} className="min-h-touch py-1">
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
              {visible.aliases ? (
                <GridCell>
                  <AliasesField row={row} run={run} />
                </GridCell>
              ) : null}
              {visible.category ? (
                <GridCell>
                  <CategoryField row={row} categories={categories} pending={pending} run={run} />
                </GridCell>
              ) : null}
              {visible.frozen ? (
                <GridCell align="center">
                  <Flag
                    label={`Frozen: ${row.name}`}
                    on={row.frozen}
                    disabled={pending}
                    onToggle={() => run(() => setFrozen(row.id, !row.frozen))}
                  />
                </GridCell>
              ) : null}
              {visible.pantry ? (
                <GridCell align="center">
                  <Flag
                    label={`Pantry staple: ${row.name}`}
                    on={row.pantryStaple}
                    disabled={pending}
                    onToggle={() => run(() => setPantryStaple(row.id, !row.pantryStaple))}
                  />
                </GridCell>
              ) : null}
              {visible.pack ? (
                <GridCell>
                  <PackFields row={row} units={units} pending={pending} run={run} />
                </GridCell>
              ) : null}
              {visible.ocado ? (
                <GridCell>
                  <OcadoField row={row} run={run} />
                </GridCell>
              ) : null}
              <GridCell align="center">
                <DeleteButton row={row} pending={pending} run={run} />
              </GridCell>
            </GridRow>
          ))}
        </GridTable>
      </div>

      {/*
        Under 1240: select and delete as chrome, then labelled fields in two wrapping rows so
        every control keeps its header. Nothing overlaps and nothing needs horizontal scrolling.
      */}
      <ul className="list-none p-0 min-[1240px]:hidden" aria-label="Ingredients">
        {shown.map((row) => (
          <li key={row.id} className="border-0 border-t border-ink-25 py-3 first:border-t-0">
            <div className="flex items-center justify-between gap-3">
              <SelectButton
                name={row.name}
                selected={selected.has(row.id)}
                onToggle={() => toggleSelected(row.id)}
              />
              <DeleteButton row={row} pending={pending} run={run} />
            </div>
            <div className="mt-2 flex flex-wrap gap-3">
              <label className="flex min-w-[140px] flex-1 flex-col gap-1">
                <CompactLabel>Name</CompactLabel>
                <NameField row={row} run={run} />
              </label>
              {visible.aliases ? (
                <label className="flex min-w-[140px] flex-1 flex-col gap-1">
                  <CompactLabel>Aliases</CompactLabel>
                  <AliasesField row={row} run={run} className="text-xs" />
                </label>
              ) : null}
            </div>
            {showMeta ? (
              <div className="mt-2 flex flex-wrap gap-3">
                {visible.category ? (
                  <label className="flex min-w-[140px] flex-1 flex-col gap-1">
                    <CompactLabel>Category</CompactLabel>
                    <CategoryField
                      row={row}
                      categories={categories}
                      pending={pending}
                      run={run}
                    />
                  </label>
                ) : null}
                {visible.pack ? (
                  <label className="flex min-w-[140px] flex-col gap-1">
                    <CompactLabel>Pack</CompactLabel>
                    <PackFields row={row} units={units} pending={pending} run={run} />
                  </label>
                ) : null}
                {visible.frozen ? (
                  <label className="flex flex-col gap-1">
                    <CompactLabel>Frozen</CompactLabel>
                    <Flag
                      label={`Frozen: ${row.name}`}
                      on={row.frozen}
                      disabled={pending}
                      onToggle={() => run(() => setFrozen(row.id, !row.frozen))}
                    />
                  </label>
                ) : null}
                {visible.pantry ? (
                  <label className="flex flex-col gap-1">
                    <CompactLabel>Pantry</CompactLabel>
                    <Flag
                      label={`Pantry staple: ${row.name}`}
                      on={row.pantryStaple}
                      disabled={pending}
                      onToggle={() => run(() => setPantryStaple(row.id, !row.pantryStaple))}
                    />
                  </label>
                ) : null}
              </div>
            ) : null}
            {visible.ocado ? (
              <label className="mt-2 flex min-w-0 flex-col gap-1">
                <CompactLabel>Ocado</CompactLabel>
                <OcadoField row={row} run={run} />
              </label>
            ) : null}
          </li>
        ))}
      </ul>

      {shown.length === 0 ? <p className="mt-6 text-base">Nothing matches that.</p> : null}
    </section>
  );
}

function CompactLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display text-xs font-bold uppercase tracking-label text-ink-70">
      {children}
    </span>
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

function OcadoField({
  row,
  run,
}: {
  row: IngredientRow;
  run: (action: () => Promise<ActionResult>) => void;
}) {
  return (
    <Input
      key={row.ocadoUrl ?? ''}
      defaultValue={row.ocadoUrl ?? ''}
      aria-label={`Ocado URL for ${row.name}`}
      placeholder="-"
      className="text-sm"
      onBlur={(event) => {
        const value = event.target.value.trim();
        if (value !== (row.ocadoUrl ?? '')) run(() => setOcadoUrl(row.id, value));
      }}
    />
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
