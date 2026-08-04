'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
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
import { deleteRecipe, saveRecipe, type LineInput } from '@/app/recipes/actions';
import type { Unit } from '@/lib/quantity';

/** Ingredient, amount, unit, then the three controls. */
const COLUMNS = 'minmax(200px,1fr) 96px 132px 48px 48px 48px';

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
  lines: { ingredientId: number; amount: number | null; unit: Unit | null }[];
};

type Row = LineInput & { key: number };

let nextKey = 0;
const newKey = () => (nextKey += 1);

export function RecipeEditor({
  recipe,
  ingredientOptions,
  units,
}: {
  recipe: EditorRecipe;
  ingredientOptions: { id: number; name: string }[];
  units: Unit[];
}) {
  const [name, setName] = useState(recipe.name);
  const [servings, setServings] = useState(String(recipe.servings));
  const [minutes, setMinutes] = useState(recipe.minutes === null ? '' : String(recipe.minutes));
  const [vegetarian, setVegetarian] = useState(recipe.vegetarian);
  const [keto, setKeto] = useState(recipe.keto);
  const [archived, setArchived] = useState(recipe.archived);
  const [sourceUrl, setSourceUrl] = useState(recipe.sourceUrl ?? '');
  const [method, setMethod] = useState(recipe.method ?? '');
  const [rows, setRows] = useState<Row[]>(() =>
    recipe.lines.map((line) => ({
      key: newKey(),
      ingredientId: line.ingredientId,
      amount: line.amount === null ? '' : String(line.amount),
      unit: line.unit ?? '',
    })),
  );

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /** The row inserted by Enter or ADD LINE takes focus, so the keyboard never leaves the table. */
  const pendingFocus = useRef<number | null>(null);
  useEffect(() => {
    const key = pendingFocus.current;
    if (key === null) return;
    pendingFocus.current = null;
    document.querySelector<HTMLInputElement>(`[data-amount-key="${key}"]`)?.focus();
  }, [rows]);

  function update(key: number, changes: Partial<LineInput>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...changes } : row)),
    );
  }

  function insertAfter(index: number) {
    const key = newKey();
    pendingFocus.current = key;
    setRows((current) => [
      ...current.slice(0, index + 1),
      { key, ingredientId: ingredientOptions[0]?.id ?? 0, amount: '', unit: '' },
      ...current.slice(index + 1),
    ]);
  }

  function remove(key: number) {
    setRows((current) => current.filter((row) => row.key !== key));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    setRows((current) => {
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveRecipe({
        id: recipe.id,
        name,
        servings,
        minutes,
        vegetarian,
        keto,
        archived,
        sourceUrl,
        method,
        lines: rows.map(({ ingredientId, amount, unit }) => ({ ingredientId, amount, unit })),
      });
      if (result.ok) setMessage('Saved.');
      else setError(result.error);
    });
  }

  function destroy() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await deleteRecipe(recipe.id);
      if (!result.ok) {
        setError(result.error);
        setArchived(true);
      }
    });
  }

  return (
    <div className="max-w-[640px]">
      <Field label="Recipe name" htmlFor="recipe-name">
        <Input
          id="recipe-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="font-display text-2xl font-bold"
        />
      </Field>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <Field label="Serves" htmlFor="recipe-servings">
          <Input
            id="recipe-servings"
            value={servings}
            tabular
            inputMode="numeric"
            onChange={(event) => setServings(event.target.value)}
          />
        </Field>
        <Field label="Cook time (mins)" htmlFor="recipe-minutes" hint="Blank if it was never timed.">
          <Input
            id="recipe-minutes"
            value={minutes}
            tabular
            inputMode="numeric"
            placeholder="-"
            onChange={(event) => setMinutes(event.target.value)}
          />
        </Field>
        <Field label="Vegetarian">
          <Switch checked={vegetarian} onCheckedChange={setVegetarian} label="Vegetarian" />
        </Field>
        {/* Neither switch is in the design handoff; without them the two flags cannot be maintained. */}
        <Field label="Keto">
          <Switch checked={keto} onCheckedChange={setKeto} label="Keto" />
        </Field>
        <Field label="Archived" hint="Archived recipes stay in history but never come up at random.">
          <Switch
            checked={archived}
            onCheckedChange={setArchived}
            label="Archived"
            stateLabel={(on) => (on ? 'Archived' : 'Active')}
          />
        </Field>
      </div>

      <div className="mt-8">
        <SectionHeader size="panel" meta={`${rows.length} lines`}>
          Ingredients
        </SectionHeader>

        <GridTable label="Ingredient lines">
          <GridHeaderRow columns={COLUMNS}>
            <GridColumnHeader>Ingredient</GridColumnHeader>
            <GridColumnHeader>Amount</GridColumnHeader>
            <GridColumnHeader>Unit</GridColumnHeader>
            <GridColumnHeader />
            <GridColumnHeader />
            <GridColumnHeader />
          </GridHeaderRow>

          {rows.map((row, index) => (
            <GridRow key={row.key} columns={COLUMNS} gap={8} className="min-h-touch py-1">
              <GridCell>
                <Select
                  aria-label={`Ingredient for line ${index + 1}`}
                  value={String(row.ingredientId)}
                  onChange={(event) => update(row.key, { ingredientId: Number(event.target.value) })}
                >
                  {ingredientOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </Select>
              </GridCell>
              <GridCell>
                <Input
                  aria-label={`Amount for line ${index + 1}`}
                  value={row.amount}
                  tabular
                  placeholder="some"
                  data-amount-key={row.key}
                  onChange={(event) => update(row.key, { amount: event.target.value })}
                  onKeyDown={(event) => {
                    // Enter inserts a line below rather than submitting: adding ingredients is the
                    // repetitive part of this screen.
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      insertAfter(index);
                    }
                  }}
                />
              </GridCell>
              <GridCell>
                <Select
                  aria-label={`Unit for line ${index + 1}`}
                  value={row.unit}
                  onChange={(event) => update(row.key, { unit: event.target.value as Unit | '' })}
                >
                  <option value="">(count)</option>
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </Select>
              </GridCell>
              <GridCell>
                <IconButton
                  label={`Move line ${index + 1} up`}
                  variant="quiet"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ChevronUp size={20} aria-hidden />
                </IconButton>
              </GridCell>
              <GridCell>
                <IconButton
                  label={`Move line ${index + 1} down`}
                  variant="quiet"
                  disabled={index === rows.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronDown size={20} aria-hidden />
                </IconButton>
              </GridCell>
              <GridCell>
                <IconButton
                  label={`Remove line ${index + 1}`}
                  variant="quiet"
                  onClick={() => remove(row.key)}
                >
                  <Trash2 size={20} aria-hidden />
                </IconButton>
              </GridCell>
            </GridRow>
          ))}
        </GridTable>

        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => insertAfter(rows.length - 1)}
        >
          <Plus size={18} aria-hidden />
          Add line
        </Button>
      </div>

      <div className="mt-8 space-y-6">
        {/*
          The design treats the link and the notes as alternatives - "either a source link or the
          method". Both are stored and both are shown: a recipe can be a link with a note about what
          to change, and 15 of the seeded recipes have both.
        */}
        <Field label="Source link" htmlFor="recipe-source" hint="Optional.">
          <Input
            id="recipe-source"
            value={sourceUrl}
            inputMode="url"
            placeholder="https://"
            onChange={(event) => setSourceUrl(event.target.value)}
          />
        </Field>
        {sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-sm-plus">
            Open the source
          </a>
        ) : null}
        <Field label="Method" htmlFor="recipe-method" hint="Optional.">
          <Textarea
            id="recipe-method"
            value={method}
            onChange={(event) => setMethod(event.target.value)}
          />
        </Field>
      </div>

      <div className="mt-8 flex items-center gap-4 border-0 border-t border-ink pt-6">
        <Button size="lg" onClick={save} disabled={pending}>
          {pending ? 'Saving' : 'Save'}
        </Button>
        <Button variant="destructive" onClick={destroy} disabled={pending}>
          Delete
        </Button>
        {message ? <span className="text-sm-plus text-ink">{message}</span> : null}
        {error ? (
          <span role="alert" className="text-sm-plus text-danger">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}
