'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Dices, Lock, Trash2, Unlock } from 'lucide-react';
import {
  Badge,
  Button,
  Dialog,
  Divider,
  Field,
  GridCell,
  GridColumnHeader,
  GridHeaderRow,
  GridRow,
  GridTable,
  IconButton,
  Input,
  NavRail,
  ProgressBar,
  SectionHeader,
  Select,
  SelectMark,
  StatFigure,
  Switch,
  Textarea,
  TickMark,
} from '@/components/penrose';

/**
 * Every primitive in every state, so drift is visible in one place. Also the audit of touch
 * target sizes against the 44px floor.
 */
export function Specimen() {
  const [veg, setVeg] = useState(true);
  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState(true);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex">
      <NavRail
        items={[
          { href: '/', label: 'Week planner' },
          { href: '/recipes', label: 'Recipe library' },
          { href: '/ingredients', label: 'Ingredients' },
        ]}
        current="/recipes"
        className="sticky top-0 h-screen"
      />

      <main className="min-w-0 flex-1 space-y-12 p-8">
        <SectionHeader level={1} size="page" meta="Development only">
          Penrose specimen
        </SectionHeader>

        <section>
          <SectionHeader size="panel">Buttons</SectionHeader>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">Roll the week</Button>
            <Button variant="secondary">Add to week</Button>
            <Button variant="quiet">Unlock all</Button>
            <Button variant="destructive">Delete recipe</Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button variant="primary" size="lg">
              Roll the week (lg, 56px)
            </Button>
            <Button variant="primary" size="lg" block className="max-w-[340px]">
              Open shopping list
            </Button>
          </div>
        </section>

        <section>
          <SectionHeader size="panel" meta="48px each, 20px glyphs">
            Icon buttons
          </SectionHeader>
          <div className="flex flex-wrap items-center gap-4">
            <IconButton label="Lock Monday" variant="primary">
              <Lock size={20} aria-hidden />
            </IconButton>
            <IconButton label="Unlock Monday" variant="secondary">
              <Unlock size={20} aria-hidden />
            </IconButton>
            <IconButton label="Re-roll Monday" variant="quiet">
              <Dices size={20} aria-hidden />
            </IconButton>
            <IconButton label="Re-roll Monday" variant="quiet" disabled>
              <Dices size={20} aria-hidden />
            </IconButton>
            <IconButton label="Move up" variant="quiet">
              <ChevronUp size={20} aria-hidden />
            </IconButton>
            <IconButton label="Move down" variant="quiet">
              <ChevronDown size={20} aria-hidden />
            </IconButton>
            <IconButton label="Remove line" variant="quiet">
              <Trash2 size={20} aria-hidden />
            </IconButton>
          </div>
        </section>

        <section>
          <SectionHeader size="panel">Form controls</SectionHeader>
          <div className="grid max-w-[840px] grid-cols-3 gap-6">
            <Field label="Search" htmlFor="spec-search">
              <Input id="spec-search" placeholder="Recipe name" />
            </Field>
            <Field label="Max cook time" htmlFor="spec-time">
              <Select id="spec-time" defaultValue="30">
                <option value="">Any</option>
                <option value="20">20 min</option>
                <option value="30">30 min</option>
                <option value="60">60 min</option>
              </Select>
            </Field>
            <Field label="Amount" htmlFor="spec-amount" hint="Blank means some.">
              <Input id="spec-amount" tabular placeholder="-" />
            </Field>
            <Field label="Servings" htmlFor="spec-invalid" error="Numbers only.">
              <Input id="spec-invalid" invalid defaultValue="two" />
            </Field>
            <Field label="Vegetarian only">
              <Switch checked={veg} onCheckedChange={setVeg} label="Vegetarian only" />
            </Field>
          </div>
          <div className="mt-6 max-w-[560px]">
            <Field label="Method" htmlFor="spec-method">
              <Textarea id="spec-method" rows={4} defaultValue="Fry onion and garlic." />
            </Field>
          </div>
        </section>

        <section>
          <SectionHeader size="panel" meta="Tick box 44px, glyph 16px">
            Tick and select marks
          </SectionHeader>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => setChecked(!checked)}
              className="flex h-[68px] min-w-[280px] items-center gap-4 px-2 text-left hover:bg-primary-tint"
            >
              <TickMark checked={checked} />
              <span className={checked ? 'text-lg text-muted line-through' : 'text-lg'}>
                spinach (frozen)
              </span>
              <span className="pen-tabular ml-auto font-display text-lg font-bold">300g</span>
            </button>
            <button
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => setSelected(!selected)}
              className="flex size-touch-min items-center justify-center hover:bg-primary-tint"
            >
              <SelectMark selected={selected} />
            </button>
          </div>
          <p className="mt-4 max-w-[70ch] text-sm-plus text-ink-70">
            Checked rows keep the strike-through but take the muted token rather than the ink at
            42% the handoff specifies, which measures 2.26:1. Run npm run check:contrast.
          </p>
        </section>

        <section>
          <SectionHeader size="panel">Badges and figures</SectionHeader>
          <div className="flex flex-wrap items-center gap-6">
            <Badge>Veg</Badge>
            <Badge tone="quiet">Meat / fish</Badge>
            <Badge tone="ink">Live</Badge>
            <Badge tone="danger">2 wks ago</Badge>
            <StatFigure label="Shopping list" value={34} tone="primary" />
            <StatFigure label="Eaten" value="3" unit="of 7" />
          </div>
        </section>

        <section>
          <SectionHeader size="panel">Rules</SectionHeader>
          <div className="max-w-[560px] space-y-4">
            <Divider variant="row" />
            <Divider variant="strong" />
            <Divider variant="metallic" />
            <Divider variant="block" />
          </div>
          <p className="mt-4 max-w-[70ch] text-sm-plus text-ink-70">
            Row, structural, gold hairline and block. There is no double rule: Penrose dropped it,
            so the handed-over token is left unused.
          </p>
        </section>

        <section>
          <SectionHeader size="panel" meta="3 of 7 rows">
            Grid table
          </SectionHeader>
          <GridTable label="Specimen table">
            <GridHeaderRow columns="48px minmax(200px,1fr) 92px 78px 104px">
              <GridColumnHeader>#</GridColumnHeader>
              <GridColumnHeader>Meal</GridColumnHeader>
              <GridColumnHeader>Diet</GridColumnHeader>
              <GridColumnHeader align="right">Time</GridColumnHeader>
              <GridColumnHeader align="right">Last eaten</GridColumnHeader>
            </GridHeaderRow>
            {[
              ['1', 'Chickpea and spinach curry', true, '30 min', '2 wks ago'],
              ['2', 'Miso salmon with rice', false, '25 min', 'never'],
              ['3', 'Aubergine pizza', true, '30 min', '1 wk ago'],
            ].map(([number, meal, isVeg, time, last]) => (
              <GridRow
                key={number as string}
                columns="48px minmax(200px,1fr) 92px 78px 104px"
                className="min-h-[66px] hover:bg-primary-tint"
              >
                <GridCell className="pen-tabular font-display font-bold">{number}</GridCell>
                <GridCell className="font-display text-xl font-bold">{meal}</GridCell>
                <GridCell>
                  {isVeg ? <Badge>Veg</Badge> : <Badge tone="quiet">Meat / fish</Badge>}
                </GridCell>
                <GridCell align="right" tabular>
                  {time}
                </GridCell>
                <GridCell align="right" tabular className="text-danger">
                  {last}
                </GridCell>
              </GridRow>
            ))}
          </GridTable>
        </section>

        <section>
          <SectionHeader size="panel">Progress and dialog</SectionHeader>
          <div className="max-w-[560px] space-y-6">
            <ProgressBar value={16} max={34} label="Shopping list progress" />
            <Button variant="secondary" onClick={() => setOpen(true)}>
              Open dialog
            </Button>
          </div>
          <Dialog
            open={open}
            onOpenChange={setOpen}
            title="Pick for Thu"
            width={680}
            footer={
              <Button variant="quiet" onClick={() => setOpen(false)}>
                Close
              </Button>
            }
          >
            <p className="text-base">
              Borderless paper over an ink scrim at 70%. Escape closes it, focus is trapped, and
              the close control is a full 48px button.
            </p>
          </Dialog>
        </section>

        <section>
          <SectionHeader size="panel" meta="44px floor, 48px preferred, 56px primary">
            Touch target audit
          </SectionHeader>
          <ul className="max-w-[80ch] space-y-2 text-sm-plus">
            <li>Button md 48px, Button lg 56px, nav rows 56px.</li>
            <li>
              IconButton 48px, including the reorder chevrons and the aisle order chevrons the
              handoff draws at 40px.
            </li>
            <li>Input, Select and Textarea 48px, including the dense admin controls drawn at 40px.</li>
            <li>
              Tick box 44px inside a 68px row; the row is the target. The admin selection square is
              drawn at 24px inside a 44px target.
            </li>
            <li>Dialog close 48px. Penrose forbids small close buttons.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
