# Build plan: meal planner

Status: planning only. No application code written yet. Several items below are blocking and
need answers before Phase 1 starts - see "Open questions".

## Decisions taken

- **The canvas is white.** The design handoff and the bundled Penrose tokens win over
  `handoff/tokens.css`. Phase 0 edits `styles/tokens.css`: `--pen-ground: #FFFFFF`, and a new
  `--pen-accent-blush: #FEE5D5` for the tick boxes, the pantry staples bar and the admin selection
  square. Section 5A closed.
- **Rules are ink.** Solid `--pen-ink` for structure, ink at 25% for row separators, gold hairline
  for deco, hard-black reserved for focus rings only. `--pen-rule` and `--pen-rule-heavy` in
  `styles/tokens.css` are rebased off `--pen-ink`. This diverges from CLAUDE.md's "1px hard-black
  keyline" wording, which should be corrected in CLAUDE.md at the same time. Section 5C closed.
- **`plan_slots` gains `eaten boolean not null default false`.** The one schema change, made in
  Phase 1 so the migration is part of the initial schema rather than bolted on later. This Week
  (Phase 8) stays in the plan. Section 6.1 closed.
- **The 44px floor holds over the handoff's pixel spec.** Every control goes to 44px minimum, and
  the reorder and aisle-order controls to 48px, with 20-24px glyphs inside them. The admin and
  recipe edit tables are less dense than drawn. Enforced in the Phase 3 primitives so no screen can
  reintroduce a 40px control. Section 5E closed.
- **CLAUDE.md's aggregation rule wins over the prototype**, on all three points: sum within a
  dimension after converting kg to g and l to ml, absorb "some" whenever a measured quantity exists,
  and render a bare count as a plain number. The trace dialog copy is rewritten so that "shown on
  the list rather than converted" appears only for buckets that genuinely cannot be reconciled, such
  as grams and punnets. Section 5J closed.

Sources read: `handoff/CLAUDE.md`, `handoff/schema.ts`, `handoff/tokens.css`, `handoff/review.md`,
`handoff/ingredients.json`, `handoff/recipes.json`, `handoff/migrate.py`, and all of
`design_handoff_meal_planner/` including the prototype `Meal Plan.dc.html` and the bundled Penrose
design system under `_ds/`.

---

## 1. Repo structure and where the handoff files land

`CLAUDE.md` refers to files by path (`db/schema.ts`, `styles/tokens.css`, `seed/ingredients.json`,
`seed/recipes.json`, `seed/migrate.py`, `seed/review.md`). Those paths dictate the layout.

Moves:

- `handoff/CLAUDE.md` -> `CLAUDE.md` (repo root, so its relative paths resolve)
- `handoff/schema.ts` -> `db/schema.ts` (verbatim; see Phase 1 for the one proposed change)
- `handoff/tokens.css` -> `styles/tokens.css`
- `handoff/ingredients.json` -> `seed/ingredients.json`
- `handoff/recipes.json` -> `seed/recipes.json`
- `handoff/migrate.py` -> `seed/migrate.py` (historical record, not run by the app, excluded from
  build and lint)
- `handoff/review.md` -> `seed/review.md`
- `design_handoff_meal_planner/` -> `docs/design/meal-planner/` (reference only)

Target tree:

```
CLAUDE.md
PLAN.md
package.json
drizzle.config.ts
db/
  schema.ts
  index.ts                 Neon + Drizzle client
  migrations/              drizzle-kit output, committed
seed/
  ingredients.json  recipes.json  review.md  migrate.py
  seed.ts                  loader, idempotent
  verify.ts                prints counts, asserts against review.md
lib/
  quantity.ts              unit dimensions, conversion, formatting
  aggregate.ts             the shopping list derivation
  roll.ts                  pool filter and random pick
  history.ts               "last eaten", derived from past plans
  week.ts                  Monday resolver, plan create-on-demand
styles/
  tokens.css               Penrose tokens, single source
app/
  layout.tsx
  page.tsx                 redirect to the current week's planner
  plan/[week]/page.tsx     week planner
  plan/[week]/cooked/page.tsx     this week
  plan/[week]/list/page.tsx       shopping list
  recipes/page.tsx         library
  recipes/[slug]/page.tsx  detail and edit
  ingredients/page.tsx     admin
  actions/                 server actions, grouped by screen
components/
  penrose/                 Penrose primitives (Button, IconButton, TickBox, NavRail, ...)
  ui/                      shadcn generated primitives that penrose/ wraps
  planner/  list/  library/  recipe/  admin/
docs/design/meal-planner/  the handoff, unmodified
tests/                     vitest, aggregation and rolling
```

Housekeeping on the design handoff when it moves: delete the eight `*:Zone.Identifier` files
(WSL download artefacts), and exclude `docs/` from `tsconfig.json` and from ESLint so the 70KB
`_ds_bundle.js` is neither type-checked nor linted.

One useful thing to lift from the handoff rather than ignore:
`_ds/.../_adherence.oxlintrc.json` contains two rules worth porting into our own lint config -
raw hex literals banned, raw `px` literals banned. That is exactly CLAUDE.md's "do not hardcode
hex values in components", made enforceable. The rest of that file asserts the Penrose React
component API, which we are not using (see Section 5).

---

## 2. Milestones

Each phase runs on its own and is reviewable without the next one existing.

### Phase 0 - skeleton

Next.js App Router, TypeScript, Tailwind, shadcn init, Drizzle + Neon wiring, vitest, ESLint.
`styles/tokens.css` imported in the root layout and mapped into the Tailwind theme so tokens are
reachable as utilities. Roboto and Roboto Condensed via `next/font`, self-hosted rather than the
Google Fonts `@import` the Penrose token file ships with.

Guards from CLAUDE.md, asserted here once: no NextAuth/Clerk/Auth.js, no Prisma, no state
management library, no API route layer.

Reviewable: `npm run dev` serves a blank page in the right type and colour; `npm run lint` and
`tsc --noEmit` clean.

### Phase 1 - schema and seed

`db/schema.ts` as handed over, plus the one agreed change:
`plan_slots.eaten boolean not null default false`. `drizzle-kit generate` + `migrate`. `seed/seed.ts` resolves
category names to ids, ingredient slugs to ids, writes aliases, then recipes and their lines with
`position` from array order. Idempotent: truncate and reinsert, since this is a two-person tool
and the seed is authoritative until the app starts writing.

`seed/verify.ts` asserts the counts I measured from the JSON, so a bad load is loud:
11 categories, 179 ingredients (15 frozen, 31 pantry staples, 50 with aliases, 0 with pack size),
170 recipes (57 archived, 73 keto, 125 vegetarian), 875 recipe ingredient lines
(333 with no amount, 527 with no unit).

Note for review: `Drinks` is a category with zero ingredients, and `supertype` is absent from
`recipes.json` entirely, so every row is null. Both are fine and expected.

Reviewable: `npm run seed && npm run verify:seed` prints the table and exits 0; Drizzle Studio
shows the data.

### Phase 2 - quantity and aggregation, as a tested library with no UI

The load-bearing logic, reviewed before any screen depends on it.

`lib/quantity.ts`: the dimension map from CLAUDE.md and `migrate.py` (mass `g`/`kg`,
volume `ml`/`l`/`tsp`/`tbsp`, count = every other unit plus `null` as its own bucket), conversion
within a dimension, and formatting.

`lib/aggregate.ts`: group the week's lines by canonical ingredient, sum per dimension, emit one
quantity per bucket, absorb `null` amounts into "some" only when no measured quantity exists,
suppress pantry staples while retaining them for the suppressed block, apply per-item overrides,
group into sections by `categories.position`, and carry the per-line trace (slot, recipe, original
quantity) that the trace dialog needs.

Tests include CLAUDE.md's worked example (`onions: 1, 2 bags, 3 tins, 300g`), the kg-plus-g case,
the "some" absorption case, and a real seven-recipe week drawn from the seed.

Reviewable: `npm test`.

### Phase 3 - Penrose primitives over shadcn

One place where the accessibility floor and the visual rules are enforced, so later screens cannot
drift below them. Button (primary/secondary/quiet/destructive; md 48px, lg 56px), IconButton
(48px, `label` required), Input, Textarea, Select, Switch, Field, SectionHeader, Divider, NavRail,
Dialog, Badge, TickBox, ProgressBar, and the grid-based table shell.

Reviewable: a dev-only `/dev/penrose` specimen page showing every primitive in every state
including keyboard focus, plus a script that checks the token pairs we actually use against 4.5:1.

### Phase 4 - recipe library, read only

First real screen. Desktop first, dense, no imagery. Search, ingredient, diet, max time, sort,
and an archived control (which the design omits - see Section 6). Counts computed, never hardcoded.

Reviewable: browse and filter all 170 recipes.

### Phase 5 - recipe detail and edit

Server actions for the write path. Structured ingredient lines, keyboard-first: Enter in the amount
or name field inserts a row below. Reorder by chevron buttons, never drag.

Reviewable: edit a recipe, reload, changes persist.

### Phase 6 - ingredients admin

Category, pantry flag, pack size and pack unit, frozen, aliases. Filter matches name and aliases.
Aisle order writes `categories.position` for all 11 categories.

Reviewable: reorder aisles and toggle staples; changes persist and the filter finds an ingredient
by its alias.

### Phase 7 - week planner

`plans` and `plan_slots`, current week resolved to the Monday and created on first visit.
`lib/roll.ts` for the pool and the pick. Lock, re-roll one slot, roll the week respecting locks.
Recipe picker dialog. Keyboard shortcuts. The right rail runs `lib/aggregate.ts` live on every
change, with no generate step.

Filters go in URL search params rather than client state, so the pool query stays on the server and
170 recipes are never shipped to the browser. Behaviour is the prototype's; the plumbing is not.

Reviewable: fill a week in under a minute, from the keyboard.

### Phase 8 - this week

The seven meals in order, ticked off as cooked. Blocked on the `eaten` question in Section 7.

Reviewable: tick meals; state survives a reload.

### Phase 9 - shopping list

Phone first. Sections in aisle order, sticky headers, 68px rows where the whole row is the target,
stacked quantity lines, trace dialog, suppressed staples block with per-item override, progress
bar. Consumes Phase 2 unchanged.

Reviewable: shop with it on a phone.

### Phase 10 - deploy

Cloud Run, Neon production branch, Identity-Aware Proxy in front restricted to the two accounts.
No application-level auth.

---

## 3. How the design output maps onto the schema

Clean mappings:

- `week[7]` of `{ recipeId, locked }` -> `plan_slots(planId, position, recipeId, locked)`
- `checked{}` keyed by ingredient name -> `shopping_list_items.checked` keyed by `(planId, ingredientId)`
- `pantryOverride{}` -> `shopping_list_items.stapleOverride`
- `catOrder[]` -> `categories.position`
- `ingEdits{}` -> direct updates to `ingredients`
- prototype recipe fields `n`, `v`, `s` -> `name`, `vegetarian`, `servings`
- prototype `m` and `l` -> `method` and `sourceUrl`
- ingredient lines `[amount, unit, name]` -> `recipe_ingredients(amount, unit, ingredientId, position)`,
  resolving the name string to an id at seed time
- filters `fVeg`, `fTime`, `fExcl` -> query parameters, not stored. The schema holds no filter
  state and does not need to.

Mappings that need a translation layer:

- **Cook time.** The design is in minutes throughout (`t: 30`, filter options 20/30/40/60,
  display "20 min"). The schema is `timeHours numeric(4,2)`. The seed contains 0.15h (9 min),
  0.2h (12 min), 0.7h (42 min) and also 6h and 7h slow-cooker recipes. The design's tidy options
  and its "N min" display do not survive contact with this data. Needs a formatter and a decision
  (Section 8).
- **Aliases.** The design shows one comma-separated string; the schema has a table with 50
  ingredients carrying aliases. Splitting and diffing on save if aliases become editable.
- **Pack size.** The design has one free-text field ("250g punnet"); the schema has
  `packSize numeric` plus `packUnit` enum. Zero seed rows are populated.
- **Last eaten.** The design reads a hardcoded `w` (weeks ago) off the recipe. The schema has no
  such column and correctly does not: it must be derived from `plans.weekStarting` joined through
  `plan_slots`. Consequence the design does not acknowledge: on a fresh database every recipe is
  "never", the exclusion filter does nothing, and the danger-coloured "last eaten" never appears
  until several weeks of history exist.
- **Units.** Detailed in Section 6.

---

## 4. How it maps onto shadcn

Direct, with restyling:

- Button -> shadcn `button`, Penrose variants and sizes. shadcn's `h-9`, `rounded-md` and shadow
  defaults are all replaced, not tweaked.
- Input, Textarea -> shadcn, reduced to a single bottom rule with no box.
- Dialog -> shadcn `dialog`: borderless paper, ink 70% scrim, square, no scale-in animation.
- Badge -> shadcn `badge`, square, ink on primary-tint.
- Progress -> shadcn `progress` for the 6px shopping list bar.
- Select -> shadcn `select`, with its popover rounding and shadow removed.

### Where shadcn does not map

- **Switch.** Radix's switch is a rounded pill with a thumb that slides. Penrose forbids radii
  above 2px and states that nothing moves or scales. The vegetarian filter switch has to be a
  square two-state control that changes colour only. This is a rebuild on the Radix primitive, not
  a restyle.
- **TickBox.** shadcn's checkbox is a 16px rounded box with a Lucide check. The design needs a
  44px square, blush to primary, with a 16px white rhomb via `clip-path`, and the entire 68px row
  as the target rather than the box. Full replacement. The row also has a nested button inside it
  ("USED IN 3 MEALS"), so the row cannot simply be a `<label>`; it needs a row-level control with
  `role="checkbox"` and an explicitly stopped-propagation child, and the focus order has to be
  sane on a phone.
- **NavRail.** No shadcn equivalent. Custom, 232px, sticky, hidden below 900px on the two
  phone-first screens.
- **SectionHeader, Divider, StatFigure.** No equivalents. Small custom components. Rules are the
  primary structural device in this system, so a `Divider` component is worth having rather than
  raw borders scattered through screens.
- **Tables.** The design specifies every table as a CSS grid with a fixed column template
  (`4px 60px minmax(200px,1fr) 92px 78px 62px 104px` and similar), not as a `<table>`. shadcn's
  table component is a real table and does not do this. I would use the grid for layout fidelity
  and add explicit table semantics, but this is a decision worth making once, deliberately, rather
  than per screen (Section 8).
- **Canonical ingredient datalist.** The design specifies a native `<datalist>` over ~179 names.
  shadcn's answer is `command`/combobox. Native datalist gives no styling control and behaves
  inconsistently on iOS, which matters because planning happens on an iPad; a combobox adds a
  popover the design never drew. Needs a decision.
- **Penrose bundle itself.** `_ds_bundle.js` is React with inline style objects. It cannot be
  imported: it is a browser IIFE, it is untyped, it carries a second token vocabulary
  (Section 6B), and CLAUDE.md mandates Tailwind + shadcn. The handoff's instruction to "use those
  rather than restyling raw elements" is satisfied by building `components/penrose/` to the same
  API surface, not by vendoring the bundle. Reading it as a reference for exact values is worth
  doing.
- **Unused.** Penrose ships Toast, Tooltip, Tabs, Radio, Card, Tag and DecoBand. This design uses
  none of them. Not building them.
- Icons: `lucide-react`, matching Penrose's own substituted set (lock, unlock, dices,
  chevron-up, chevron-down, chevron-right, trash-2).

---

## 5. Disagreements with the handoff

These are the places I would not simply follow the design document.

### A. The page is cream in one source and white in two others - resolved, white

- `handoff/tokens.css`: `--pen-ground: #FEE5D5; /* default page canvas - warm cream, not white */`,
  and CLAUDE.md names that file as the design system.
- The bundled Penrose tokens: `--pen-ground:#FFFFFF; /* page + text on dark fills */`, and its
  readme states plainly: "Cream (`#FEE5D5`) is *not* a background".
- The design README lists "paper / ground | #FFFFFF | everything" and reuses #FEE5D5 as
  `accent-blush` for unchecked tick boxes, the pantry staples block and the admin select box.

This is not a matter of taste. If the canvas is cream, then every unchecked tick box on the
shopping list, the suppressed staples bar and the admin selection square are drawn in exactly the
canvas colour and disappear. `handoff/tokens.css` also has no blush or warm-tint token to
substitute, so there is nothing to fall back on. Whichever way this goes, one of the two token
files needs editing before Phase 3.

One piece of evidence for cream: the comment on `--pen-text-muted: #5C6B5F` says "still 4.5:1 on
ground". It measures 4.67:1 on cream and 5.64:1 on white, so the comment was written against a
cream canvas.

Resolved: white. `styles/tokens.css` is edited in Phase 0 to set `--pen-ground: #FFFFFF` and to add
`--pen-accent-blush: #FEE5D5`. The muted-text comment is corrected to cite the white figure.

### B. Two incompatible token vocabularies

`handoff/tokens.css` uses `--pen-space-4`, `--pen-touch`, `--pen-text-lg`, `--pen-rule`, in rem.
The bundled Penrose set uses `--space-2`, `--touch`, `--size-body`, `--keyline`, in px, plus a
semantic layer (`--surface-page`, `--action`, `--rule`) that the bundled components are written
against. The design README says the `_ds` tokens are the source of truth for colour, type and
spacing; CLAUDE.md says bind to `styles/tokens.css`. They are not the same values under different
names in every case.

Recommendation: `styles/tokens.css` is canonical because CLAUDE.md says so, extended with the
missing `--pen-accent-blush` and a `--pen-text-large` for the 18px-plus hover colour. Values are
reconciled against `_ds` where the handoff file is silent.

### C. Rules: hard-black or ink - resolved, ink

CLAUDE.md says "Depth is a 1px hard-black keyline", and `handoff/tokens.css` defines
`--pen-rule: 1px solid var(--pen-hard-black)` with hard-black annotated "rules, keylines,
linework". The bundled Penrose does the opposite: `--rule: var(--pen-ink)`, with hard-black
reserved for "focus rings and fine geometric linework only", and rules specified as "1px ink at
25% for row separation, solid ink for structure". Every rule in the design README is ink or
ink-25%.

Every screen is mostly rules, so this decides how the whole app looks.

Resolved: ink. Solid ink for structure, ink at 25% for row separators, gold hairline for deco,
hard-black for focus rings only. `--pen-rule` and `--pen-rule-heavy` are rebased off `--pen-ink`,
and CLAUDE.md's "Depth is a 1px hard-black keyline" line is corrected to match.

### D. `--pen-rule-double` should not exist

`handoff/tokens.css` ships `--pen-rule-double: 3px double var(--pen-hard-black)` for section
heads. The Penrose readme: "There is no double rule - the motif read as dated." The design uses a
3px *solid* ink top rule on the planner rail and nothing double anywhere. I would leave the token
unused, or delete it.

### E. Touch targets below the floor - resolved, the floor holds

CLAUDE.md, `handoff/tokens.css` and the Penrose readme all set 44px minimum, 48px preferred, 56px
for primary actions, and CLAUDE.md calls these "requirements, not preferences" because one user has
limited fine motor control. The design specifies, and the prototype implements, controls below
that floor:

- 40x40 chevron-up / chevron-down / trash icon buttons on recipe ingredient rows
- 40x40 chevron-up / chevron-down on the admin aisle order list
- 40px category select and 40px pack size input in the admin table
- 40px ADD button in the recipe library
- 24x24 row selection square in the admin table
- 30x30 pantry toggle in the admin table
- the "USED IN 3 MEALS" trace button on shopping list rows, with 4px vertical padding and no
  minimum height, nested inside the row's own tap target
- the phone back links, padding only, no minimum height

The reorder buttons are the single clearest case: reordering is the action the no-drag-and-drop
rule exists to protect, and its only route is a 40px button. The handoff asks for pixel-accurate
recreation; I would not recreate these pixels.

Resolved: everything goes to 44px minimum, 48px for the reorder and aisle-order controls, with the
drawn glyphs kept small inside the larger targets, which is Penrose's own stated pattern ("20-24px
glyphs inside a 44-48px target"). The admin and recipe edit tables are less dense than drawn. The
floor is enforced in the Phase 3 primitives rather than per screen.

### F. Checked and eaten rows fail contrast

The design recedes checked shopping list rows and eaten meals to ink at 42% with a strike-through,
described as "receded, not hidden". Ink at 42% over white measures about 2.3:1. The Penrose readme
calls 4.5:1 "non-negotiable" and gives the reason: "these interfaces get used in poor lighting".
The shopping list is the screen used in poor lighting.

Proposal: keep the strike-through as the primary signal and raise the colour to `--pen-text-muted`
or ink at 70%, both of which measure about 4.6:1. Checked items still clearly recede; they remain
readable when you need to re-check what you already put in the trolley.

### G. `prefers-reduced-motion` is absent from the design

CLAUDE.md requires it and `handoff/tokens.css` ships the media query. The design README never
mentions it and the prototype does not implement it. Three motions need neutralising under reduce:
the 700ms roll flash, its 200ms fade back, and the 160ms progress bar width transition. The width
transition is also the one thing in the design that moves, which sits awkwardly with "Nothing moves
or scales"; the bundled motion note permits "colour swaps and 1px position shifts only".

### H. Colour as the only signal

"Last eaten" inside the exclusion window is rendered in danger red and nothing else, in both the
library and the picker. That needs a second, non-colour cue.

### I. Em dashes in UI copy

CLAUDE.md: "Hyphens, never em dashes, in all copy and comments." The design's shopping list foot
reads "SUPPRESSED - PANTRY STAPLES (6)" with an em dash, and the recipe editor uses an em dash as
the amount placeholder. Both become hyphens. The Penrose readme separately restricts Unicode to
`×` and `&`, which the em dash placeholder breaks anyway.

### J. Aggregation: the design contradicts the stated rule - resolved, CLAUDE.md wins

CLAUDE.md gives the aggregation rule in detail and `migrate.py` ships the same dimension map. The
design and prototype implement something different in three ways:

1. **Summing per unit string, not per dimension.** The prototype does
   `m.parts[u] = (m.parts[u] || 0) + row[0]` with no conversion, and the trace dialog copy commits
   to it: "Two recipes measure this differently. Both are shown on the list rather than converted."
   CLAUDE.md requires converting within a dimension before summing, so 1kg and 300g become
   "1,300g" rather than two lines. Only one seed line uses `kg` today, so the practical impact is
   small, but the rule is explicit and the trace dialog copy will be wrong for mass and volume
   pairs. That copy needs two variants: one for genuinely irreconcilable buckets (grams and
   punnets) and none at all for a pair that was summed.
2. **"some" is never absorbed.** The prototype appends a "some" line whenever any line lacks an
   amount, alongside the measured ones. CLAUDE.md says "some" is absorbed if any measured quantity
   exists. 333 of 875 seed lines have no amount, so this is not an edge case: the design's rule
   produces "spinach - 300 g, some" routinely. Following CLAUDE.md.
3. **Bare counts render as "×2".** The prototype maps a null unit to the string `"item"` and
   renders "×2". CLAUDE.md's worked example renders a bare count as a plain number:
   `onions: 1, 2 bags, 3 tins, 300g`. Following CLAUDE.md. The invented `"item"` bucket also
   collides with the schema, where a bare count is `unit = null`.

Resolved: CLAUDE.md on all three. The trace dialog gets two copy variants, so "Both are shown on
the list rather than converted" appears only where the buckets genuinely cannot be reconciled.

### K. The unit list in the recipe editor is wrong

The design specifies: blank, `g`, `ml`, `item`, `tin`, `bag`, `pack`, `punnet`, `bunch`, `stalk`,
`rasher`, `tbsp`, `tsp`. The schema enum is `g kg ml l tsp tbsp bag tin tub pack stalk rasher
breast slice portion bulb punnet`.

The design invents `item` and `bunch`, neither of which exists in the enum, the seed, or
`migrate.py`'s unit map. It omits `kg`, `l`, `tub`, `breast`, `slice`, `portion` and `bulb`, of
which `tub` (9 lines), `breast` (5), `kg`, `slice`, `portion` and `bulb` (1 each) are all in use.
Using the design's list verbatim would make 17 existing ingredient lines uneditable without
silently changing their unit. The select becomes the 17 enum values plus a blank meaning bare
count.

### L. Archived recipes are not handled anywhere

CLAUDE.md: archived recipes are "never in the pool" and excluded from the library default view. 57
of 170 recipes are archived. The prototype's pool filter has no archived condition, the library has
no archived control, and the picker dialog would happily offer a legacy keto meat dish. Adding:
excluded from the pool, excluded from the picker, library defaults to unarchived with a way to see
them, and the pool-size denominator counts 113 rather than the whole library.

### M. Every count in the design copy is wrong

"21 of 184 in pool", "26 OF 184 SHOWN", "204" ingredients, "8 store categories", `catOrder[8]`, and
a default section list of eight categories. Reality: 170 recipes (113 unarchived), 179 ingredients,
11 categories. The design's eight-category list also omits Herbs (9 ingredients), Nuts & Seeds (6)
and Drinks (0), so real shopping lists will show sections the design never drew, and the aisle
order panel is a list of 11, not 8. All counts computed from the database.

### N. Keto is unreachable

73 recipes carry the flag. The design has no keto filter on the planner or the library, and no keto
control in the recipe editor. As drawn, the flag can never be read or set.

### O. Weekday labels contradict the schema's stated intent

`plan_slots.position` is documented as "0-6. Not tied to a weekday - meals are cooked in whatever
order suits". The design labels every slot MON to SUN, titles the picker "PICK FOR THU", uses
"THU · Chicken thigh puttanesca" as the shopping list back-reference, and orders This Week "in day
order". I suspect weekday labels as a pure display convention over position are what is actually
wanted, and they are harmless, but the schema comment says otherwise and the shopping list copy
depends on the answer.

### P. Two different save models

The recipe editor has an explicit SAVE RECIPE that becomes SAVED. The ingredients admin "edits in
place; there is no save". Both in the same app, on adjacent screens. The in-place model also has no
error state drawn, while CLAUDE.md requires errors that state what went wrong and how to fix it -
which an in-place edit against a server action will eventually need.

### Q. The planner's phone fallback is horizontal scrolling

The design enforces `min-width: 1000px` on the planner and scrolls horizontally below it. CLAUDE.md
calls the phone a "supported fallback" for the planner. Horizontal scrolling combined with imprecise
taps is a poor fallback. Low priority - the planner is used on a laptop or iPad - but worth naming
rather than discovering later.

---

## 6. Where the design assumes data the schema does not hold

1. **`eaten` per slot - resolved.** The whole point of the This Week screen. `plan_slots` has
   `recipeId`, `position` and `locked`, and nothing else. Agreed: add
   `eaten boolean not null default false` in Phase 1, as part of the initial migration. This is the
   only change to the handed-over schema.
2. **Weeks since last eaten.** Hardcoded as `w` on each prototype recipe. Derivable from
   `plans.weekStarting` and `plan_slots`, but the design treats it as a property of the recipe and
   uses it in three places (library column, picker column, detail header meta) plus the exclusion
   filter and a library sort. Once `eaten` exists there are two possible meanings - appeared in a
   past plan, or was actually ticked as cooked - and the answer changes the filter.
3. **Which week is being planned.** The prototype has one implicit week and a hardcoded label
   "MON 3 - SUN 9 AUG". The schema has `plans.weekStarting`, unique. No screen selects a week or
   creates a plan. Needed: a current-week resolver, create-on-first-visit, and a decision on
   whether past weeks are reachable at all - they have to exist for "last eaten" to ever be
   non-null.
4. **Manual shopping list items.** The schema has `freeText` and `manual` for one-off items like
   batteries. The design has no add-item control anywhere on the shopping list. Either two columns
   are dead or the screen is missing a row. A 56px ADD ITEM at the foot beside UNCHECK ALL is the
   obvious fix.
5. **Frozen ingredients.** The schema treats frozen as a separate ingredient row sharing a name,
   displayed "spinach (frozen)", with a unique index on `(name, frozen)`. 15 seed ingredients are
   frozen. The design has no frozen concept at all - "Frozen" appears only as an aisle - so the
   display suffix is missing everywhere a name is rendered, and the admin has no frozen control.
   The unique index also means an admin that ever allows renaming can collide.
6. **Servings.** The seed has 39 recipes serving 4, five serving 1 and five serving 3, for a
   household of two. Neither CLAUDE.md nor the design scales amounts by servings, so the shopping
   list will over-buy for every 4-serving recipe. This is a specification gap rather than a schema
   gap: the data is there, nothing uses it beyond display.
7. **Aliases are read-only in the design.** The schema has a table, 50 ingredients carry aliases,
   and the admin filter is specified to match them. Aliases are the mechanism by which future data
   quality problems get fixed, and the screen described as "where data quality is fixed" cannot
   edit them.
8. **Pack unit.** One free-text pack field in the design; `packSize` numeric plus `packUnit` enum
   in the schema. Zero rows populated. CLAUDE.md says these exist for later and "do not build that
   yet", so the question is only whether the admin captures them properly now.
9. **Creating and deleting ingredients.** No UI for either. New recipes will reference ingredients
   that do not exist yet, and the editor's datalist is described as backed by the canonical list,
   with no path to add to it.
10. **`method` and `sourceUrl` are mutually exclusive in the design.** The segmented FREE TEXT /
    EXTERNAL LINK control lets a recipe have one or the other. The schema allows both. The seed
    happens to have 29 with a method, 31 with a URL, none with both and 110 with neither, so the
    design is safe today - but the control will silently discard one if both are ever set. The
    segmented control should switch the view without clearing the other field.
11. **`supertype`.** In the schema, absent from the seed (all 170 null), unused by the design.
    Correctly left alone per CLAUDE.md; noting it so it does not look like an oversight later.
12. **Ticked items when the plan changes.** The schema is clear that quantities derive on read and
    `shopping_list_items` holds only per-shop state, and the design insists there is no generate
    step. Neither says what happens to a ticked item when the plan is re-rolled and that ingredient
    is no longer needed. Proposal: create rows lazily on first tick or override, never eagerly, and
    treat a row whose ingredient is no longer derived as inert rather than deleting it, so rolling
    back restores the tick.

---

## 7. Open questions

### Blocking - needed before Phase 1 or Phase 3

1. ~~Cream or white canvas, and which token file wins?~~ Answered: white. (Section 5A)
2. ~~Rules in hard-black, or ink and ink-25%?~~ Answered: ink. (Section 5C)
3. ~~May I add `plan_slots.eaten`?~~ Answered: yes, in Phase 1. (Section 6.1)
4. ~~Confirm I raise every control to the 44px floor.~~ Answered: yes, 44px minimum and 48px for
   reorder and aisle controls. (Section 5E)
5. ~~Confirm CLAUDE.md wins over the prototype on aggregation.~~ Answered: yes, all three points.
   (Section 5J)

All blocking questions are answered. Phase 0 and Phase 1 can start. Questions 6 to 21 below are
answerable at the phase that needs them; the first one due is 7 (archived) at Phase 4.

### Needed at the relevant phase boundary

6. Checked and eaten rows: raise from ink 42% to a 4.5:1 value? (Section 5F)
7. Archived: confirm excluded from pool, picker and library default, with a control to reveal them.
   (Section 5L)
8. Keto: add a filter and an editor control, or leave the flag unreachable? (Section 5N)
9. Servings: is raw summation correct, or should amounts scale to two servings? 39 recipes serve 4.
   (Section 6.6)
10. Cook time: how should 6 and 7 hour recipes read, and non-round values like 0.15h and 0.7h?
    Does the max-time filter keep the design's 20/30/40/60 options? (Section 3)
11. Weekday labels MON to SUN over `position`, or neutral "Meal 1 to 7"? (Section 5O)
12. Week identity: auto-create the current week on first visit; are past weeks browsable, and is
    there a "new week" action? (Section 6.3)
13. Add the missing manual item control to the shopping list? (Section 6.4)
14. Admin: make aliases and the frozen flag editable? Add create and delete for ingredients?
    (Section 6.5, 6.7, 6.9)
15. Frozen display: confirm "spinach (frozen)" everywhere a name renders, including the shopping
    list and the recipe editor datalist.
16. Confirm the unit select is the 17 enum values plus blank, dropping the design's `item` and
    `bunch`. (Section 5K)
17. Ticked items surviving a re-roll: inert rows rather than deletion? (Section 6.12)
18. Tables as CSS grid with ARIA, or real tables with fixed layout? (Section 4)
19. Ingredient name entry: native `datalist` as drawn, or a shadcn combobox? (Section 4)
20. Save model: does the admin stay save-less in-place, and what does a failed in-place edit look
    like? (Section 5P)
21. Package manager and deploy timing: npm unless told otherwise, and is Phase 10 in scope now or
    later?
