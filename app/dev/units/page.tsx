import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { ingredients, recipeIngredients, recipes } from '@/db/schema';
import { AppShell } from '@/components/shell';
import { SectionHeader } from '@/components/penrose';
import { ingredientName } from '@/lib/format';
import { formatLine, formatQuantity, type Unit } from '@/lib/quantity';
import { currentWeekStarting } from '@/lib/week';

export const metadata = { title: 'Units' };
export const dynamic = 'force-dynamic';

type Line = {
  ingredientId: number;
  name: string;
  pantryStaple: boolean;
  recipeSlug: string;
  recipeName: string;
  amount: number | null;
  unit: Unit | null;
};

type IngredientGroup = {
  ingredientId: number;
  name: string;
  pantryStaple: boolean;
  lines: Line[];
  units: string[];
  some: number;
  list: string;
};

function unitKey(unit: Unit | null): string {
  return unit ?? 'count';
}

function groupLines(rows: Line[]): IngredientGroup[] {
  const grouped = new Map<number, IngredientGroup>();

  for (const row of rows) {
    let group = grouped.get(row.ingredientId);
    if (!group) {
      group = {
        ingredientId: row.ingredientId,
        name: row.name,
        pantryStaple: row.pantryStaple,
        lines: [],
        units: [],
        some: 0,
        list: '',
      };
      grouped.set(row.ingredientId, group);
    }
    group.lines.push(row);
    if (row.amount === null) group.some += 1;
  }

  for (const group of grouped.values()) {
    const units = new Set<string>();
    const measured: { amount: number; unit: Unit | null }[] = [];
    for (const line of group.lines) {
      if (line.amount === null) continue;
      units.add(unitKey(line.unit));
      measured.push({ amount: line.amount, unit: line.unit });
    }
    group.units = [...units].sort();
    group.list = formatQuantity(measured, group.some).lines.join(', ');
  }

  return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
}

async function loadLines(): Promise<Line[]> {
  const db = await getDb();
  const rows = await db
    .select({
      ingredientId: ingredients.id,
      ingredientName: ingredients.name,
      frozen: ingredients.frozen,
      pantryStaple: ingredients.pantryStaple,
      recipeSlug: recipes.slug,
      recipeName: recipes.name,
      amount: recipeIngredients.amount,
      unit: recipeIngredients.unit,
    })
    .from(recipeIngredients)
    .innerJoin(ingredients, eq(ingredients.id, recipeIngredients.ingredientId))
    .innerJoin(recipes, eq(recipes.id, recipeIngredients.recipeId))
    .orderBy(asc(ingredients.name), asc(recipes.name));

  return rows.map((row) => ({
    ingredientId: row.ingredientId,
    name: ingredientName({ name: row.ingredientName, frozen: row.frozen }),
    pantryStaple: row.pantryStaple,
    recipeSlug: row.recipeSlug,
    recipeName: row.recipeName,
    amount: row.amount === null ? null : Number(row.amount),
    unit: row.unit,
  }));
}

const EXAMPLES: { label: string; lines: { amount: number; unit: Unit | null }[]; some: number }[] =
  [
    {
      label: 'Tomatoes',
      lines: [
        { amount: 1, unit: null },
        { amount: 300, unit: 'g' },
      ],
      some: 1,
    },
    {
      label: 'Onions',
      lines: [
        { amount: 1, unit: null },
        { amount: 2, unit: 'bag' },
        { amount: 3, unit: 'tin' },
        { amount: 300, unit: 'g' },
      ],
      some: 5,
    },
    {
      label: 'Chopped tomatoes',
      lines: [
        { amount: 1, unit: 'tin' },
        { amount: 0.5, unit: 'tin' },
      ],
      some: 0,
    },
  ];

/** Development only. Review leftover mixed units and remaining "some" after harmonisation. */
export default async function UnitsPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  const groups = groupLines(await loadLines());
  const mixed = groups.filter((group) => group.units.length > 1 || (group.units.length > 0 && group.some > 0));
  const someOnly = groups.filter((group) => group.units.length === 0 && group.some > 0);
  const unified = groups.length - mixed.length - someOnly.length;

  return (
    <AppShell week={currentWeekStarting()} current="/dev/units">
      <SectionHeader
        level={1}
        size="page"
        meta={`${groups.length} ingredients · ${unified} one unit · ${mixed.length} mixed · ${someOnly.length} some only`}
      >
        Units
      </SectionHeader>

      <p className="mb-8 max-w-[40rem] text-ink">
        How mixed quantities join on the shopping list, then every ingredient that still mixes
        units or keeps &quot;some&quot;. Recipe names open the editor.
      </p>

      <SectionHeader meta="formatter" className="mt-10">
        Examples
      </SectionHeader>
      <ul className="mb-10 list-none p-0">
        {EXAMPLES.map((example) => (
          <li
            key={example.label}
            className="flex min-h-touch items-baseline justify-between gap-4 border-0 border-t border-ink-25 py-2"
          >
            <span className="text-lg">{example.label}</span>
            <span className="pen-tabular shrink-0 font-display text-lg font-bold">
              {formatQuantity(example.lines, example.some).lines.join(', ')}
            </span>
          </li>
        ))}
      </ul>

      <SectionHeader meta={`${mixed.length} ingredients`} className="mt-10">
        Mixed
      </SectionHeader>
      <div className="grid grid-cols-1 gap-10 min-[1100px]:grid-cols-2">
        {mixed.map((group) => (
          <section key={group.ingredientId}>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-md font-black uppercase tracking-label">
                {group.name}
              </h3>
              <span className="pen-tabular shrink-0 font-display text-lg font-bold">
                {group.list}
              </span>
            </div>
            <p className="mt-1 font-display text-xs font-bold uppercase tracking-label text-primary">
              {group.units.join(', ') || 'none'}
              {group.some ? ` · ${group.some} some` : ''}
              {group.pantryStaple ? ' · staple' : ''}
            </p>
            <hr className="mt-1 border-0 border-t border-ink" />
            <ul className="list-none p-0">
              {group.lines.map((line, index) => (
                <li
                  key={`${line.recipeSlug}-${index}`}
                  className="flex min-h-touch-min items-center justify-between gap-3 border-0 border-t border-ink-25"
                >
                  <Link
                    href={`/recipes/${line.recipeSlug}` as Route}
                    className="min-w-0 flex-1 py-2 text-ink no-underline hover:text-primary"
                  >
                    {line.recipeName}
                  </Link>
                  <span className="pen-tabular shrink-0 font-display font-bold">
                    {formatLine(line.amount, line.unit)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <SectionHeader meta={`${someOnly.length} ingredients`} className="mt-12">
        Some only
      </SectionHeader>
      <ul className="list-none p-0 pb-12">
        {someOnly.map((group) => (
          <li
            key={group.ingredientId}
            className="flex min-h-touch items-baseline justify-between gap-4 border-0 border-t border-ink-25 py-2"
          >
            <span>
              <span className="text-lg">{group.name}</span>
              {group.pantryStaple ? (
                <span className="ml-2 font-display text-xs font-bold uppercase tracking-label text-primary">
                  staple
                </span>
              ) : null}
            </span>
            <span className="pen-tabular shrink-0 font-display font-bold">
              {group.some} · {group.list}
            </span>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
