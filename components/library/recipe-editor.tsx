'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Field,
  GridCell,
  GridColumnHeader,
  GridHeaderRow,
  GridRow,
  GridTable,
  IconButton,
  Input,
  SectionHeader,
  Select,
  Switch,
  Textarea,
} from '@/components/penrose';
import { addToWeek } from '@/app/plan/[week]/actions';
import { deleteRecipe, saveRecipe, type LineInput } from '@/app/recipes/actions';
import { cookTime, lastEaten } from '@/lib/format';
import { formatLine, type Unit } from '@/lib/quantity';

/** Amount, unit, name, then three reorder/remove controls. */
const EDIT_COLUMNS = '80px 108px minmax(0,1fr) 48px 48px 48px';
const EDIT_COLUMNS_PHONE = '76px 96px minmax(0,1fr)';

export type EditorRecipe = {
  id: number;
  name: string;
  servings: number;
  minutes: number | null;
  vegetarian: boolean;
  keto: boolean;
  archived: boolean;
  sourceUrl: string | null;
  method: string | null;
  lastEaten: number | null;
  lines: {
    ingredientId: number;
    name: string;
    amount: number | null;
    unit: Unit | null;
  }[];
};

type Row = LineInput & { key: number };

let nextKey = 0;
const newKey = () => (nextKey += 1);

function snapshot(recipe: EditorRecipe): {
  name: string;
  servings: string;
  minutes: string;
  vegetarian: boolean;
  keto: boolean;
  archived: boolean;
  sourceUrl: string;
  method: string;
  methodMode: 'text' | 'link';
  rows: Row[];
} {
  return {
    name: recipe.name,
    servings: String(recipe.servings),
    minutes: recipe.minutes === null ? '' : String(recipe.minutes),
    vegetarian: recipe.vegetarian,
    keto: recipe.keto,
    archived: recipe.archived,
    sourceUrl: recipe.sourceUrl ?? '',
    method: recipe.method ?? '',
    methodMode: recipe.sourceUrl && !recipe.method ? 'link' : 'text',
    rows: recipe.lines.map((line) => ({
      key: newKey(),
      ingredientId: line.ingredientId,
      amount: line.amount === null ? '' : String(line.amount),
      unit: line.unit ?? '',
    })),
  };
}

export function RecipeEditor({
  recipe,
  ingredientOptions,
  units,
  week,
  startEditing = false,
}: {
  recipe: EditorRecipe;
  ingredientOptions: { id: number; name: string }[];
  units: Unit[];
  week: string;
  /** New recipes open straight in edit mode. */
  startEditing?: boolean;
}) {
  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState(() => snapshot(recipe));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pendingFocus = useRef<number | null>(null);
  useEffect(() => {
    const key = pendingFocus.current;
    if (key === null) return;
    pendingFocus.current = null;
    document.querySelector<HTMLInputElement>(`[data-amount-key="${key}"]`)?.focus();
  }, [draft.rows]);

  // View mode reads `recipe` directly. Draft is only for edit mode and is rebuilt on
  // beginEdit / cancelEdit, so there is nothing to sync in an effect after save.

  function beginEdit() {
    setError(null);
    setMessage(null);
    setDraft(snapshot(recipe));
    setEditing(true);
  }

  function cancelEdit() {
    setError(null);
    setMessage(null);
    setDraft(snapshot(recipe));
    setEditing(false);
  }

  function updateRow(key: number, changes: Partial<LineInput>) {
    setDraft((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.key === key ? { ...row, ...changes } : row)),
    }));
  }

  function insertAfter(index: number) {
    const key = newKey();
    pendingFocus.current = key;
    setDraft((current) => ({
      ...current,
      rows: [
        ...current.rows.slice(0, index + 1),
        { key, ingredientId: ingredientOptions[0]?.id ?? 0, amount: '', unit: '' },
        ...current.rows.slice(index + 1),
      ],
    }));
  }

  function removeRow(key: number) {
    setDraft((current) => ({
      ...current,
      rows: current.rows.filter((row) => row.key !== key),
    }));
  }

  function moveRow(index: number, direction: -1 | 1) {
    const target = index + direction;
    setDraft((current) => {
      if (target < 0 || target >= current.rows.length) return current;
      const next = [...current.rows];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, rows: next };
    });
  }

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveRecipe({
        id: recipe.id,
        name: draft.name,
        servings: draft.servings,
        minutes: draft.minutes,
        vegetarian: draft.vegetarian,
        keto: draft.keto,
        archived: draft.archived,
        sourceUrl: draft.sourceUrl,
        method: draft.method,
        lines: draft.rows.map(({ ingredientId, amount, unit }) => ({
          ingredientId,
          amount,
          unit,
        })),
      });
      if (result.ok) {
        setMessage('Saved');
        setEditing(false);
      } else {
        setError(result.error);
      }
    });
  }

  function destroy() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await deleteRecipe(recipe.id);
      if (!result.ok) {
        setError(result.error);
        setDraft((current) => ({ ...current, archived: true }));
      }
    });
  }

  function addWeek() {
    setError(null);
    startTransition(async () => {
      const result = await addToWeek(week, recipe.id);
      if (!result.ok) setError(result.error);
      else setMessage('Added to week');
    });
  }

  const meta = `${recipe.vegetarian ? 'Vegetarian' : 'Meat / fish'} · ${cookTime(
    recipe.minutes === null ? null : recipe.minutes / 60,
  )} · serves ${recipe.servings}`;

  const headerMeta = `Recipe ${recipe.id} · last eaten ${lastEaten(recipe.lastEaten)}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-0 border-b border-ink pb-4">
        <Link
          href="/recipes"
          className="inline-flex min-h-touch items-center gap-2 font-display text-sm font-bold uppercase tracking-label text-primary no-underline"
        >
          <ArrowLeft size={16} aria-hidden />
          Library
        </Link>

        <span className="font-display text-sm font-bold uppercase tracking-label text-ink-70">
          {headerMeta}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {editing ? (
            <>
              <Button variant="quiet" disabled={pending} onClick={cancelEdit}>
                Cancel
              </Button>
              <Button disabled={pending} onClick={save}>
                {pending ? 'Saving' : message === 'Saved' ? 'Saved' : 'Save recipe'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" disabled={pending || recipe.archived} onClick={addWeek}>
                Add to week
              </Button>
              <Button disabled={pending} onClick={beginEdit}>
                Edit recipe
              </Button>
            </>
          )}
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {message && !editing ? (
        <p className="mt-4 text-sm text-ink">{message}</p>
      ) : null}

      {editing ? (
        <EditForm
          draft={draft}
          setDraft={setDraft}
          ingredientOptions={ingredientOptions}
          units={units}
          pending={pending}
          insertAfter={insertAfter}
          updateRow={updateRow}
          removeRow={removeRow}
          moveRow={moveRow}
          destroy={destroy}
        />
      ) : (
        <ViewMode recipe={recipe} meta={meta} />
      )}
    </div>
  );
}

function ViewMode({ recipe, meta }: { recipe: EditorRecipe; meta: string }) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-12 min-[1240px]:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="min-w-0">
        <h1 className="font-display text-[34px] font-black uppercase leading-[1.05] tracking-[0.06em] text-ink">
          {recipe.name}
        </h1>
        <p className="mt-2 text-sm-plus text-ink-70">{meta}</p>

        <SectionHeader size="panel" className="mt-10">
          Method
        </SectionHeader>
        {recipe.method ? (
          <p className="whitespace-pre-wrap text-md leading-relaxed text-ink">{recipe.method}</p>
        ) : recipe.sourceUrl ? (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-md text-primary"
          >
            {recipe.sourceUrl}
          </a>
        ) : (
          <p className="text-md text-ink-70">No method recorded.</p>
        )}
      </div>

      <div className="min-w-0">
        <SectionHeader size="panel" meta={`${recipe.lines.length} lines`}>
          Ingredients
        </SectionHeader>
        <ul className="list-none p-0">
          {recipe.lines.map((line) => (
            <li
              key={`${line.ingredientId}-${line.amount}-${line.unit}`}
              className="flex min-h-[52px] items-center gap-4 border-0 border-t border-ink-25 first:border-t-0"
            >
              <span className="pen-tabular w-24 shrink-0 font-display text-md font-bold text-primary">
                {formatLine(line.amount, line.unit)}
              </span>
              <span className="text-md text-ink">{line.name}</span>
            </li>
          ))}
        </ul>
        {recipe.lines.length === 0 ? (
          <p className="text-md text-ink-70">No ingredients recorded.</p>
        ) : null}
      </div>
    </div>
  );
}

function EditForm({
  draft,
  setDraft,
  ingredientOptions,
  units,
  pending,
  insertAfter,
  updateRow,
  removeRow,
  moveRow,
  destroy,
}: {
  draft: ReturnType<typeof snapshot>;
  setDraft: React.Dispatch<React.SetStateAction<ReturnType<typeof snapshot>>>;
  ingredientOptions: { id: number; name: string }[];
  units: Unit[];
  pending: boolean;
  insertAfter: (index: number) => void;
  updateRow: (key: number, changes: Partial<LineInput>) => void;
  removeRow: (key: number) => void;
  moveRow: (index: number, direction: -1 | 1) => void;
  destroy: () => void;
}) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-12 min-[1240px]:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="min-w-0 space-y-6">
        <Field label="Recipe name" htmlFor="recipe-name">
          <Input
            id="recipe-name"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            className="min-h-touch-lg font-display text-2xl font-bold"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-3">
          <Field label="Serves" htmlFor="recipe-servings">
            <Input
              id="recipe-servings"
              value={draft.servings}
              tabular
              inputMode="numeric"
              onChange={(event) =>
                setDraft((current) => ({ ...current, servings: event.target.value }))
              }
            />
          </Field>
          <Field label="Cook time (mins)" htmlFor="recipe-minutes">
            <Input
              id="recipe-minutes"
              value={draft.minutes}
              tabular
              inputMode="numeric"
              placeholder="—"
              onChange={(event) =>
                setDraft((current) => ({ ...current, minutes: event.target.value }))
              }
            />
          </Field>
          <Field label="Vegetarian">
            <Switch
              checked={draft.vegetarian}
              onCheckedChange={(checked) =>
                setDraft((current) => ({ ...current, vegetarian: checked }))
              }
              label="Vegetarian"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Keto">
            <Switch
              checked={draft.keto}
              onCheckedChange={(checked) => setDraft((current) => ({ ...current, keto: checked }))}
              label="Keto"
            />
          </Field>
          <Field label="Archived" hint="Archived recipes stay in history but never come up at random.">
            <Switch
              checked={draft.archived}
              onCheckedChange={(checked) =>
                setDraft((current) => ({ ...current, archived: checked }))
              }
              label="Archived"
              stateLabel={(on) => (on ? 'Archived' : 'Active')}
            />
          </Field>
        </div>

        <div>
          <span className="font-display text-sm font-bold uppercase tracking-label text-ink">
            Method
          </span>
          <div className="mt-2 flex gap-2">
            <Button
              variant={draft.methodMode === 'text' ? 'secondary' : 'quiet'}
              onClick={() => setDraft((current) => ({ ...current, methodMode: 'text' }))}
            >
              Free text
            </Button>
            <Button
              variant={draft.methodMode === 'link' ? 'secondary' : 'quiet'}
              onClick={() => setDraft((current) => ({ ...current, methodMode: 'link' }))}
            >
              External link
            </Button>
          </div>
          <div className="mt-4">
            {draft.methodMode === 'text' ? (
              <Textarea
                id="recipe-method"
                value={draft.method}
                rows={9}
                aria-label="Method"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, method: event.target.value }))
                }
                className="rounded-none border-0 border-b border-ink"
              />
            ) : (
              <Input
                id="recipe-source"
                value={draft.sourceUrl}
                inputMode="url"
                placeholder="https://"
                aria-label="Source link"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, sourceUrl: event.target.value }))
                }
              />
            )}
          </div>
        </div>

        <Button variant="destructive" onClick={destroy} disabled={pending}>
          Delete
        </Button>
      </div>

      <div className="min-w-0">
        <SectionHeader size="panel" meta={`${draft.rows.length} lines`}>
          Ingredients
        </SectionHeader>

        {/* Desktop ingredient grid */}
        <div className="hidden min-[900px]:block">
          <GridTable label="Ingredient lines">
            <GridHeaderRow columns={EDIT_COLUMNS}>
              <GridColumnHeader>Amount</GridColumnHeader>
              <GridColumnHeader>Unit</GridColumnHeader>
              <GridColumnHeader>Ingredient</GridColumnHeader>
              <GridColumnHeader />
              <GridColumnHeader />
              <GridColumnHeader />
            </GridHeaderRow>

            {draft.rows.map((row, index) => (
              <GridRow key={row.key} columns={EDIT_COLUMNS} gap={8} className="min-h-touch py-1">
                <GridCell>
                  <AmountField
                    row={row}
                    index={index}
                    onChange={(amount) => updateRow(row.key, { amount })}
                    onEnter={() => insertAfter(index)}
                  />
                </GridCell>
                <GridCell>
                  <UnitField
                    row={row}
                    index={index}
                    units={units}
                    onChange={(unit) => updateRow(row.key, { unit })}
                  />
                </GridCell>
                <GridCell>
                  <IngredientField
                    row={row}
                    index={index}
                    options={ingredientOptions}
                    onChange={(ingredientId) => updateRow(row.key, { ingredientId })}
                    onEnter={() => insertAfter(index)}
                  />
                </GridCell>
                <GridCell>
                  <IconButton
                    label={`Move line ${index + 1} up`}
                    variant="quiet"
                    disabled={index === 0}
                    onClick={() => moveRow(index, -1)}
                  >
                    <ChevronUp size={20} aria-hidden />
                  </IconButton>
                </GridCell>
                <GridCell>
                  <IconButton
                    label={`Move line ${index + 1} down`}
                    variant="quiet"
                    disabled={index === draft.rows.length - 1}
                    onClick={() => moveRow(index, 1)}
                  >
                    <ChevronDown size={20} aria-hidden />
                  </IconButton>
                </GridCell>
                <GridCell>
                  <IconButton
                    label={`Remove line ${index + 1}`}
                    variant="quiet"
                    onClick={() => removeRow(row.key)}
                  >
                    <Trash2 size={20} aria-hidden />
                  </IconButton>
                </GridCell>
              </GridRow>
            ))}
          </GridTable>
        </div>

        {/* Phone: amount/unit/name on one line, controls on the next */}
        <ul className="list-none space-y-3 p-0 min-[900px]:hidden" aria-label="Ingredient lines">
          {draft.rows.map((row, index) => (
            <li key={row.key} className="border-0 border-t border-ink-25 pt-3 first:border-t-0">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: EDIT_COLUMNS_PHONE }}
              >
                <AmountField
                  row={row}
                  index={index}
                  onChange={(amount) => updateRow(row.key, { amount })}
                  onEnter={() => insertAfter(index)}
                />
                <UnitField
                  row={row}
                  index={index}
                  units={units}
                  onChange={(unit) => updateRow(row.key, { unit })}
                />
                <IngredientField
                  row={row}
                  index={index}
                  options={ingredientOptions}
                  onChange={(ingredientId) => updateRow(row.key, { ingredientId })}
                  onEnter={() => insertAfter(index)}
                />
              </div>
              <div className="mt-2 flex gap-1">
                <IconButton
                  label={`Move line ${index + 1} up`}
                  variant="quiet"
                  disabled={index === 0}
                  onClick={() => moveRow(index, -1)}
                >
                  <ChevronUp size={20} aria-hidden />
                </IconButton>
                <IconButton
                  label={`Move line ${index + 1} down`}
                  variant="quiet"
                  disabled={index === draft.rows.length - 1}
                  onClick={() => moveRow(index, 1)}
                >
                  <ChevronDown size={20} aria-hidden />
                </IconButton>
                <IconButton
                  label={`Remove line ${index + 1}`}
                  variant="quiet"
                  onClick={() => removeRow(row.key)}
                >
                  <Trash2 size={20} aria-hidden />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>

        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => insertAfter(draft.rows.length - 1)}
        >
          <Plus size={18} aria-hidden />
          Add ingredient
        </Button>
      </div>
    </div>
  );
}

function AmountField({
  row,
  index,
  onChange,
  onEnter,
}: {
  row: Row;
  index: number;
  onChange: (amount: string) => void;
  onEnter: () => void;
}) {
  return (
    <Input
      aria-label={`Amount for line ${index + 1}`}
      value={row.amount}
      tabular
      placeholder="—"
      data-amount-key={row.key}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onEnter();
        }
      }}
    />
  );
}

function UnitField({
  row,
  index,
  units,
  onChange,
}: {
  row: Row;
  index: number;
  units: Unit[];
  onChange: (unit: Unit | '') => void;
}) {
  return (
    <Select
      aria-label={`Unit for line ${index + 1}`}
      value={row.unit}
      onChange={(event) => onChange(event.target.value as Unit | '')}
    >
      <option value="">-</option>
      {units.map((unit) => (
        <option key={unit} value={unit}>
          {unit}
        </option>
      ))}
    </Select>
  );
}

function IngredientField({
  row,
  index,
  options,
  onChange,
  onEnter,
}: {
  row: Row;
  index: number;
  options: { id: number; name: string }[];
  onChange: (ingredientId: number) => void;
  onEnter: () => void;
}) {
  return (
    <Select
      aria-label={`Ingredient for line ${index + 1}`}
      value={String(row.ingredientId)}
      onChange={(event) => onChange(Number(event.target.value))}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onEnter();
        }
      }}
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </Select>
  );
}
