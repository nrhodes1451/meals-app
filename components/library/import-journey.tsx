'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  ChevronUp,
  ImageUp,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  Badge,
  Button,
  Field,
  IconButton,
  Input,
  SectionHeader,
  Select,
  Switch,
  Textarea,
} from '@/components/penrose';
import { extractFromPhoto, importRecipe } from '@/app/recipes/import/actions';
import { cookTime } from '@/lib/format';
import { formatLine, type Unit } from '@/lib/quantity';
import { validateFields } from '@/lib/recipe-fields';
import { newLineKey, unresolved, type Draft, type DraftLine, type Target } from '@/lib/recipe-import';

type Option = { id: number; name: string };
type Step = 'photo' | 'details' | 'ingredients' | 'new' | 'save';

const STEPS: { id: Step; label: string }[] = [
  { id: 'photo', label: 'Photo' },
  { id: 'details', label: 'Details' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'new', label: 'New ingredients' },
  { id: 'save', label: 'Save' },
];

/** Long edge in pixels. Plenty for print, and keeps an upload a few hundred KB. */
const MAX_EDGE = 1600;

/**
 * Phone photos are 3-12MB, far over the server action limit and slower to send on poor signal.
 * Redrawn on a canvas as a JPEG; `createImageBitmap` applies the EXIF rotation.
 */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob'))), 'image/jpeg', 0.85),
  );
}

export function ImportJourney({
  ingredientOptions,
  categories,
  units,
}: {
  ingredientOptions: Option[];
  categories: Option[];
  units: Unit[];
}) {
  const [step, setStep] = useState<Step>('photo');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Each step swaps the whole panel, so focus goes to its heading rather than being lost.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);

  const hasNew = draft?.lines.some((line) => line.unmatched) ?? false;
  const visible = STEPS.filter((candidate) => candidate.id !== 'new' || hasNew);
  const index = visible.findIndex((candidate) => candidate.id === step);

  function go(direction: -1 | 1) {
    setError(null);
    setStep(visible[index + direction].id);
  }

  function next() {
    if (!draft) return;
    if (step === 'details') {
      const fields = validateFields(draft);
      if (!fields.ok) return setError(fields.error);
    }
    if (step === 'ingredients') {
      if (draft.lines.every((line) => line.target.kind === 'omit')) {
        return setError('The recipe has no ingredients. Add at least one line.');
      }
      if (draft.lines.some((line) => line.target.kind === 'existing' && line.target.id <= 0)) {
        return setError('Every line needs an ingredient. Pick one for each.');
      }
    }
    if (step === 'new' && unresolved(draft.lines).length) {
      return setError(
        'Decide on every new ingredient: add it with an aisle, use an existing one, or leave it out.',
      );
    }
    go(1);
  }

  function updateLine(key: number, changes: Partial<DraftLine>) {
    setDraft((current) =>
      current && {
        ...current,
        lines: current.lines.map((line) => (line.key === key ? { ...line, ...changes } : line)),
      },
    );
  }

  function save() {
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const result = await importRecipe({
        ...draft,
        lines: draft.lines.map(({ amount, unit, target }) => ({ amount, unit, target })),
      });
      // Success redirects to the new recipe, so only a failure comes back.
      if (result && !result.ok) setError(result.error);
    });
  }

  const current = visible[index];

  return (
    <div className="max-w-[880px]">
      <Link
        href="/recipes"
        className="inline-flex min-h-touch items-center gap-2 font-display text-sm font-bold uppercase tracking-label text-primary"
      >
        <ArrowLeft size={18} aria-hidden />
        Recipe library
      </Link>

      <SectionHeader level={1} size="page" className="mt-4">
        Recipe from a photo
      </SectionHeader>

      <ol className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
        {visible.map((candidate, position) => (
          <li
            key={candidate.id}
            aria-current={candidate.id === step ? 'step' : undefined}
            className={`font-display text-sm uppercase tracking-label ${
              candidate.id === step ? 'font-black text-primary' : 'font-bold text-ink-70'
            }`}
          >
            {position + 1} {candidate.label}
          </li>
        ))}
      </ol>
      <hr className="mt-3 border-0 border-t border-ink" />

      <h2
        ref={heading}
        tabIndex={-1}
        className="mt-6 font-display text-xl font-black uppercase tracking-display"
      >
        {index + 1}. {current.label}
      </h2>

      {step === 'photo' ? (
        <PhotoStep
          pending={pending}
          onRead={(photo) => {
            setError(null);
            startTransition(async () => {
              let blob: Blob;
              try {
                blob = await shrink(photo);
              } catch {
                setError('This browser could not open that image. Choose a JPEG or PNG instead.');
                return;
              }
              const form = new FormData();
              form.set('photo', blob, 'recipe.jpg');
              const result = await extractFromPhoto(form);
              if (!result.ok) return setError(result.error);
              setDraft(result.draft);
              setStep('details');
            });
          }}
        />
      ) : null}

      {draft && step === 'details' ? <DetailsStep draft={draft} setDraft={setDraft} /> : null}

      {draft && step === 'ingredients' ? (
        <IngredientsStep
          draft={draft}
          setDraft={setDraft}
          updateLine={updateLine}
          ingredientOptions={ingredientOptions}
          units={units}
        />
      ) : null}

      {draft && step === 'new' ? (
        <NewIngredientsStep
          lines={draft.lines.filter((line) => line.unmatched)}
          updateLine={updateLine}
          ingredientOptions={ingredientOptions}
          categories={categories}
        />
      ) : null}

      {draft && step === 'save' ? (
        <SaveStep draft={draft} ingredientOptions={ingredientOptions} categories={categories} />
      ) : null}

      {error ? (
        <p role="alert" className="mt-6 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {step !== 'photo' ? (
        <div className="mt-8 flex flex-wrap gap-3 border-0 border-t border-ink pt-6">
          <Button variant="quiet" disabled={pending} onClick={() => go(-1)}>
            Back
          </Button>
          {step === 'save' ? (
            <Button disabled={pending} onClick={save}>
              {pending ? 'Saving recipe…' : 'Save recipe'}
            </Button>
          ) : (
            <Button onClick={next}>Next</Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function PhotoStep({ pending, onRead }: { pending: boolean; onRead: (photo: File) => void }) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const upload = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="mt-4">
      <p className="text-base text-ink-70">
        One photo of the recipe, with the name, ingredients and method in frame. It is read and then
        thrown away.
      </p>

      {/* Hidden inputs behind full-size buttons. `capture` opens the rear camera on a phone or iPad. */}
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={choose}
      />
      <input
        ref={upload}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={choose}
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          size="lg"
          variant={photo ? 'secondary' : 'primary'}
          disabled={pending}
          onClick={() => camera.current?.click()}
        >
          <Camera size={22} aria-hidden />
          {photo ? 'Retake photo' : 'Take photo'}
        </Button>
        <Button size="lg" variant="secondary" disabled={pending} onClick={() => upload.current?.click()}>
          <ImageUp size={22} aria-hidden />
          {photo ? 'Choose another' : 'Upload image'}
        </Button>
      </div>

      {preview ? (
        <div className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL, never optimised */}
          <img
            src={preview}
            alt="The recipe photo to be read"
            className="block max-h-[360px] max-w-full border border-ink object-contain"
          />
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button size="lg" disabled={pending} onClick={() => photo && onRead(photo)}>
              Read recipe
            </Button>
            {pending ? (
              <span role="status" className="text-base text-ink">
                Reading recipe…
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailsStep({
  draft,
  setDraft,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft | null>>;
}) {
  const set = (changes: Partial<Draft>) =>
    setDraft((current) => current && { ...current, ...changes });

  return (
    <div className="mt-4 space-y-6">
      <p className="text-base text-ink-70">Check what was read. Everything here can be changed.</p>
      <Field label="Recipe name" htmlFor="import-name">
        <Input
          id="import-name"
          value={draft.name}
          onChange={(event) => set({ name: event.target.value })}
          className="min-h-touch-lg font-display text-2xl font-bold"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4 min-[900px]:grid-cols-4">
        <Field label="Serves" htmlFor="import-servings">
          <Input
            id="import-servings"
            value={draft.servings}
            tabular
            inputMode="numeric"
            onChange={(event) => set({ servings: event.target.value })}
          />
        </Field>
        <Field label="Cook time (mins)" htmlFor="import-minutes">
          <Input
            id="import-minutes"
            value={draft.minutes}
            tabular
            inputMode="numeric"
            placeholder="-"
            onChange={(event) => set({ minutes: event.target.value })}
          />
        </Field>
        <Field label="Vegetarian">
          <Switch
            checked={draft.vegetarian}
            onCheckedChange={(vegetarian) => set({ vegetarian })}
            label="Vegetarian"
          />
        </Field>
        <Field label="Keto">
          <Switch checked={draft.keto} onCheckedChange={(keto) => set({ keto })} label="Keto" />
        </Field>
      </div>

      <Field label="Method" htmlFor="import-method">
        <Textarea
          id="import-method"
          value={draft.method}
          rows={12}
          onChange={(event) => set({ method: event.target.value })}
        />
      </Field>

      <Field label="Source link" htmlFor="import-source" hint="Optional.">
        <Input
          id="import-source"
          value={draft.sourceUrl}
          inputMode="url"
          placeholder="https://"
          onChange={(event) => set({ sourceUrl: event.target.value })}
        />
      </Field>
    </div>
  );
}

function IngredientsStep({
  draft,
  setDraft,
  updateLine,
  ingredientOptions,
  units,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft | null>>;
  updateLine: (key: number, changes: Partial<DraftLine>) => void;
  ingredientOptions: Option[];
  units: Unit[];
}) {
  function move(index: number, direction: -1 | 1) {
    setDraft((current) => {
      if (!current) return current;
      const lines = [...current.lines];
      const target = index + direction;
      if (target < 0 || target >= lines.length) return current;
      [lines[index], lines[target]] = [lines[target], lines[index]];
      return { ...current, lines };
    });
  }

  function remove(key: number) {
    setDraft((current) => current && { ...current, lines: current.lines.filter((l) => l.key !== key) });
  }

  function add() {
    setDraft(
      (current) =>
        current && {
          ...current,
          lines: [
            ...current.lines,
            {
              key: newLineKey(),
              raw: '',
              amount: '',
              unit: '',
              target: { kind: 'existing', id: 0, alias: null },
              unmatched: false,
              readName: '',
            },
          ],
        },
    );
  }

  /** "new" and "omit" are only offered for a line the photo named and the library did not have. */
  function pick(line: DraftLine, value: string) {
    if (value === 'new') {
      updateLine(line.key, {
        target: {
          kind: 'new',
          name: line.readName,
          frozen: false,
          pantryStaple: false,
          categoryId: null,
          confirmed: false,
        },
      });
    } else if (value === 'omit') {
      updateLine(line.key, { target: { kind: 'omit' } });
    } else {
      updateLine(line.key, {
        target: { kind: 'existing', id: Number(value), alias: line.unmatched ? line.readName : null },
      });
    }
  }

  return (
    <div className="mt-4">
      <p className="text-base text-ink-70">
        Each line as printed, with the amount, unit and ingredient it was read as. Lines marked new are
        not in the library yet; the next step asks about them.
      </p>

      <ul className="mt-4 list-none p-0">
        {draft.lines.map((line, index) => (
          <li key={line.key} className="border-0 border-t border-ink-25 py-3">
            <div className="flex min-h-6 flex-wrap items-center gap-2">
              <span className="pen-tabular font-display text-sm font-bold text-ink">{index + 1}</span>
              {line.raw ? <span className="text-sm text-ink-70">Read as “{line.raw}”</span> : null}
              {line.target.kind === 'new' ? <Badge>New</Badge> : null}
              {line.target.kind === 'omit' ? <Badge tone="quiet">Left out</Badge> : null}
            </div>
            <div className="mt-2 grid grid-cols-[80px_100px_minmax(0,1fr)] gap-2 min-[900px]:grid-cols-[88px_108px_minmax(0,1fr)_48px_48px_48px]">
              <Input
                aria-label={`Amount for line ${index + 1}`}
                value={line.amount}
                tabular
                inputMode="decimal"
                placeholder="some"
                onChange={(event) => updateLine(line.key, { amount: event.target.value })}
              />
              <Select
                aria-label={`Unit for line ${index + 1}`}
                value={line.unit}
                onChange={(event) => updateLine(line.key, { unit: event.target.value as Unit | '' })}
              >
                <option value="">-</option>
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
              <Select
                aria-label={`Ingredient for line ${index + 1}`}
                value={line.target.kind === 'existing' ? String(line.target.id) : line.target.kind}
                invalid={line.target.kind === 'existing' && line.target.id <= 0}
                onChange={(event) => pick(line, event.target.value)}
              >
                {line.target.kind === 'existing' && line.target.id <= 0 ? (
                  <option value="0">Choose an ingredient</option>
                ) : null}
                {line.unmatched ? <option value="new">New: {line.readName}</option> : null}
                {line.unmatched ? <option value="omit">Leave out</option> : null}
                {ingredientOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </Select>
              <div className="col-span-3 flex gap-1 min-[900px]:contents">
                <IconButton
                  label={`Move line ${index + 1} up`}
                  variant="quiet"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ChevronUp size={20} aria-hidden />
                </IconButton>
                <IconButton
                  label={`Move line ${index + 1} down`}
                  variant="quiet"
                  disabled={index === draft.lines.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronDown size={20} aria-hidden />
                </IconButton>
                <IconButton
                  label={`Remove line ${index + 1}`}
                  variant="quiet"
                  onClick={() => remove(line.key)}
                >
                  <Trash2 size={20} aria-hidden />
                </IconButton>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="border-0 border-t border-ink-25 pt-4">
        <Button variant="secondary" onClick={add}>
          <Plus size={18} aria-hidden />
          Add line
        </Button>
      </div>
    </div>
  );
}

function NewIngredientsStep({
  lines,
  updateLine,
  ingredientOptions,
  categories,
}: {
  lines: DraftLine[];
  updateLine: (key: number, changes: Partial<DraftLine>) => void;
  ingredientOptions: Option[];
  categories: Option[];
}) {
  const setTarget = (line: DraftLine, target: Target) => updateLine(line.key, { target });

  return (
    <div className="mt-4">
      <p className="text-base text-ink-70">
        These are not in the library. Add each one as a new ingredient, use one the library already
        has, or leave it out. Nothing is added until the recipe is saved.
      </p>

      <ul className="mt-4 list-none p-0">
        {lines.map((line) => {
          const { target } = line;
          const adding = target.kind === 'new' && target.confirmed;
          const mapping = target.kind === 'existing';
          const omitting = target.kind === 'omit';
          return (
            <li key={line.key} className="border-0 border-t border-ink-25 py-4">
              <p className="font-display text-md font-bold text-ink">{line.readName}</p>
              {line.raw ? <p className="text-sm text-ink-70">Read as “{line.raw}”</p> : null}

              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`What to do with ${line.readName}`}>
                <Button
                  variant={adding ? 'primary' : 'secondary'}
                  aria-pressed={adding}
                  onClick={() =>
                    setTarget(line, {
                      kind: 'new',
                      name: target.kind === 'new' ? target.name : line.readName,
                      frozen: target.kind === 'new' ? target.frozen : false,
                      pantryStaple: target.kind === 'new' ? target.pantryStaple : false,
                      categoryId: target.kind === 'new' ? target.categoryId : null,
                      confirmed: true,
                    })
                  }
                >
                  Add as new ingredient
                </Button>
                <Button
                  variant={mapping ? 'primary' : 'secondary'}
                  aria-pressed={mapping}
                  onClick={() =>
                    mapping ||
                    setTarget(line, { kind: 'existing', id: 0, alias: line.readName })
                  }
                >
                  Use existing
                </Button>
                <Button
                  variant={omitting ? 'primary' : 'secondary'}
                  aria-pressed={omitting}
                  onClick={() => setTarget(line, { kind: 'omit' })}
                >
                  Leave out
                </Button>
              </div>

              {target.kind === 'new' && adding ? (
                <div className="mt-4 grid grid-cols-1 gap-4 min-[900px]:grid-cols-[minmax(0,1fr)_200px_auto_auto]">
                  <Field label="Name" htmlFor={`new-name-${line.key}`} hint="Plural for countables.">
                    <Input
                      id={`new-name-${line.key}`}
                      value={target.name}
                      invalid={!target.name.trim()}
                      onChange={(event) => setTarget(line, { ...target, name: event.target.value })}
                    />
                  </Field>
                  <Field label="Aisle" htmlFor={`new-aisle-${line.key}`}>
                    <Select
                      id={`new-aisle-${line.key}`}
                      value={target.categoryId ?? ''}
                      invalid={target.categoryId === null}
                      onChange={(event) =>
                        setTarget(line, {
                          ...target,
                          categoryId: event.target.value ? Number(event.target.value) : null,
                        })
                      }
                    >
                      <option value="">Choose an aisle</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Frozen">
                    <Switch
                      checked={target.frozen}
                      onCheckedChange={(frozen) => setTarget(line, { ...target, frozen })}
                      label={`${target.name || line.readName} is frozen`}
                    />
                  </Field>
                  <Field label="Pantry staple">
                    <Switch
                      checked={target.pantryStaple}
                      onCheckedChange={(pantryStaple) => setTarget(line, { ...target, pantryStaple })}
                      label={`${target.name || line.readName} is a pantry staple`}
                    />
                  </Field>
                </div>
              ) : null}

              {target.kind === 'existing' ? (
                <div className="mt-4 grid grid-cols-1 gap-4 min-[900px]:grid-cols-[minmax(0,1fr)_auto]">
                  <Field label="Ingredient" htmlFor={`existing-${line.key}`}>
                    <Select
                      id={`existing-${line.key}`}
                      value={target.id > 0 ? String(target.id) : ''}
                      invalid={target.id <= 0}
                      onChange={(event) =>
                        setTarget(line, { ...target, id: Number(event.target.value) || 0 })
                      }
                    >
                      <option value="">Choose an ingredient</option>
                      {ingredientOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={`Remember “${line.readName}” as a name for it`}>
                    <Switch
                      checked={target.alias !== null}
                      onCheckedChange={(on) =>
                        setTarget(line, { ...target, alias: on ? line.readName : null })
                      }
                      label={`Remember ${line.readName} as a name for it`}
                      stateLabel={(on) => (on ? 'Yes' : 'No')}
                    />
                  </Field>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SaveStep({
  draft,
  ingredientOptions,
  categories,
}: {
  draft: Draft;
  ingredientOptions: Option[];
  categories: Option[];
}) {
  const names = new Map(ingredientOptions.map((option) => [option.id, option.name]));
  const aisles = new Map(categories.map((category) => [category.id, category.name]));
  const minutes = Number(draft.minutes);

  const kept = draft.lines.filter((line) => line.target.kind !== 'omit');
  const omitted = draft.lines.filter((line) => line.target.kind === 'omit');

  const created = new Map<string, string>();
  const aliases: string[] = [];
  for (const { target } of kept) {
    if (target.kind === 'new') {
      const name = target.name.trim().toLowerCase();
      created.set(
        `${name}|${target.frozen}`,
        `${name}${target.frozen ? ' (frozen)' : ''} in ${aisles.get(target.categoryId!) ?? '?'}${
          target.pantryStaple ? ', pantry staple' : ''
        }`,
      );
    } else if (target.kind === 'existing' && target.alias) {
      aliases.push(`“${target.alias}” for ${names.get(target.id)}`);
    }
  }

  const meta = [
    `Serves ${draft.servings}`,
    draft.minutes.trim() && Number.isFinite(minutes) ? cookTime(minutes / 60) : null,
    draft.vegetarian ? 'Vegetarian' : 'Meat / fish',
    draft.keto ? 'Keto' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="mt-4">
      <p className="text-base text-ink-70">Nothing has been saved yet. Check it once more.</p>

      <p className="mt-6 font-display text-2xl font-black uppercase tracking-display text-ink">
        {draft.name}
      </p>
      <p className="mt-1 text-sm-plus text-ink-70">{meta}</p>

      <SectionHeader size="list" level={3} className="mt-6" meta={`${kept.length} lines`}>
        Ingredients
      </SectionHeader>
      <ul className="list-none p-0">
        {kept.map((line) => (
          <li
            key={line.key}
            className="flex min-h-[48px] items-center gap-4 border-0 border-t border-ink-25 first:border-t-0"
          >
            <span className="pen-tabular w-24 shrink-0 font-display text-md font-bold text-primary">
              {formatLine(line.amount.trim() === '' ? null : Number(line.amount), line.unit || null)}
            </span>
            <span className="text-md text-ink">
              {line.target.kind === 'new'
                ? `${line.target.name.trim().toLowerCase()}${line.target.frozen ? ' (frozen)' : ''}`
                : line.target.kind === 'existing'
                  ? names.get(line.target.id)
                  : null}
            </span>
            {line.target.kind === 'new' ? <Badge>New</Badge> : null}
          </li>
        ))}
      </ul>

      {omitted.length ? (
        <p className="mt-3 text-sm text-ink-70">
          Left out: {omitted.map((line) => line.raw || line.readName).join('; ')}
        </p>
      ) : null}

      {created.size || aliases.length ? (
        <>
          <SectionHeader size="list" level={3} className="mt-6">
            Also added to the library
          </SectionHeader>
          <ul className="list-none p-0 text-base text-ink">
            {[...created.values()].map((text) => (
              <li key={text} className="py-1">
                New ingredient: {text}
              </li>
            ))}
            {aliases.map((text) => (
              <li key={text} className="py-1">
                New alias: {text}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {draft.method ? (
        <>
          <SectionHeader size="list" level={3} className="mt-6">
            Method
          </SectionHeader>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-ink">{draft.method}</p>
        </>
      ) : null}
    </div>
  );
}
