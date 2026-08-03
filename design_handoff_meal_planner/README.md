# Handoff: Weekly meal planner & shopping list

## Overview
A private household tool for two people. Replaces a long-running Google Sheet. Five screens
plus one phone screen: pick seven evening meals a week from a ~180-recipe library, generate a
consolidated shopping list ordered by supermarket aisle, tick meals off as they are cooked.

Not a product. No onboarding, no marketing copy, no illustrated empty states, no feature
discovery. Copy is flat and terminal. Optimise every screen for a ritual repeated weekly.

## About the design files
`Meal Plan.dc.html` is a **design reference written in HTML**, not production code. It is a
working prototype: real state, real filters, real aggregation logic, live re-rolls. Read it for
intended look and behaviour, then **recreate it in the target codebase** using that codebase's
framework, component library and conventions. Do not lift the HTML.

The prototype is a single self-contained component (a streaming HTML component format). All
logic lives in one class at the bottom of the file; all markup in one template above it. In a
real app this should be split per screen.

Styling in the file is inline by necessity of that format. **Do not carry that forward** — use
the target codebase's styling approach. Design tokens are listed below.

## Fidelity
**High fidelity.** Colours, type, spacing, states and copy are final and follow the Penrose
design system. Recreate pixel-accurately. Where the target codebase already implements Penrose
components (Button, IconButton, Input, Select, Switch, SectionHeader, NavRail, Icon), use those
rather than restyling raw elements.

## Design system
Penrose. Modern art deco: geometric, high-contrast, unfussy.

Hard rules that this design depends on and that are easy to break in reimplementation:
- **No borders, no shadows, no depth, no gradients, no radii above 2px.** Separation comes only
  from rules (1px), a change of surface, or flat colour.
- **Two casing registers only.** Headings / labels / buttons / table headers UPPERCASE Roboto
  Condensed, tracked. Everything else sentence case. Never Title Case.
- One accent family per screen. Gold only as a hairline.
- Focus: 2px hard-black outline at 2px offset. Never removed.
- 44px minimum touch target, 48px preferred, 56px for primary page actions.
- Motion: 80–200ms colour swaps only, easing `cubic-bezier(0.2,0,0,1)`. Nothing moves or scales.
- No emoji. No icons without a label or aria-label. No photography or illustration anywhere.

## Design tokens

### Colour
| Token | Hex | Used for in this design |
| --- | --- | --- |
| ink | #2F3D32 | body text, structural rules, dialog scrim at 70% |
| ink 25% | rgba(47,61,50,0.25) | row separator rules |
| ink 70/75% | rgba(47,61,50,0.7) | secondary text (ingredient summaries, hints) |
| ink 42% | rgba(47,61,50,0.42) | checked / eaten rows (receded, not hidden) |
| paper / ground | #FFFFFF | everything |
| primary | #7A104E | locks, counts, live badge, progress fill, checked tick box, primary buttons |
| primary-lift | #C23585 | hover on 18px+ text |
| primary-tint | #FFCCE9 | row hover, veg badge, roll flash, admin pantry flag |
| accent-blush | #FEE5D5 | unchecked tick boxes, pantry-staples block, admin select box |
| accent-gold | #E9CB4F | one hairline rule in the planner rail |
| danger | #C01B2F | "last eaten" under the exclusion window |

### Type
Roboto (body), Roboto Condensed (display / `--font-display`).
| Role | Spec |
| --- | --- |
| Page title | Condensed 900, 26px, uppercase, 0.09em |
| Panel title | Condensed 900, 19px, uppercase, 0.09em |
| Section header (list) | Condensed 900, 17px, uppercase, 0.09em |
| Column header | Condensed 700, 12px, uppercase, 0.08em |
| Field label | Condensed 700, 13px, uppercase, 0.08em |
| Meal / recipe name | Condensed 700, 19px, sentence case |
| List item name | Roboto 400, 18px |
| Body / secondary | Roboto 400, 13–14px, ink 70% |
| Figures | tabular-nums throughout; rail count Condensed 900 40px |

### Spacing
8px scale, 4px half-step. Screen padding 32px desktop / 16px phone. Grid gaps 10–16px within
tables, 24–48px between regions. Planner row min-height 66px; shopping row 68px; this-week row 76px.

## Screens

### 1. Week planner — desktop first, 1280px+
Primary screen. Whole week fillable in under a minute.

Layout: 232px sticky NavRail, then a page with `min-width:1000px` (scrolls horizontally rather
than collapsing). Below the header, a filter bar; below that a two-column grid,
`minmax(560px,1fr) 340px`, gap 40px.

Filter bar (row, bottom rule solid ink, aligned to baseline):
- Vegetarian only — Switch, label On/Off
- Max cook time — Select: Any / 20 / 30 / 40 / 60 min
- Not eaten in the last — Select: No restriction / 2 / 3 / 4 / 6 / 8 weeks
- Right-aligned: pool size ("21 of 184 in pool", Condensed 300 13px), UNLOCK ALL (quiet),
  ROLL THE WEEK (primary, size lg / 56px)

Week table — 7 rows, all visible without scrolling on a laptop. Columns:
`4px 60px minmax(200px,1fr) 92px 78px 62px 104px`, gap 14px, row rule ink 25%.
- col 1: 4px × 44px lock bar, primary when locked, transparent otherwise
- col 2: day, Condensed, 900/primary when locked, 400/ink otherwise
- col 3: meal name button (Condensed 700 19px) over ingredient summary (13px, ink 70%,
  truncated). Clicking opens the recipe picker dialog for that day.
- col 4: VEG badge — ink on primary-tint, 3px/8px pad. Non-veg reads "MEAT / FISH" in ink 70%,
  no fill.
- col 5: cook time, right, tabular. col 6: "×2" servings, right, tabular.
- col 7: two 48px IconButtons — lock/unlock (primary variant when locked) and dices (quiet,
  disabled when locked).

Re-rolled rows flash primary-tint behind the name for 700ms, then fade back over 200ms. This is
the only motion in the design.

Keyboard (bound on window, suppressed while an input is focused): `1–7` toggle lock on that
day, `shift+1–7` re-roll that day, `R` rolls the week. Documented in a 13px line under the table.

Right rail — live shopping list summary. 3px solid ink top rule. Title + "LIVE" in primary.
Item count as Condensed 900 40px primary, then "items · N sections". Gold hairline. Then one
row per section with its item count, ink 25% rules. Then the suppressed-staples line, then a
full-width primary OPEN SHOPPING LIST button.

Recipe picker dialog: borderless white over ink-70% scrim, 680px, max-height 82vh. Title
"PICK FOR THU", 26px × close IconButton. Search input, then scrollable rows of
name / veg / time / last eaten; last-eaten inside the exclusion window renders danger.
Hover primary-tint. Row min-height 56px.

### 2. Shopping list — phone first
Single column, `max-width:640px`, 16px gutters, centred. Under 900px the NavRail is hidden
entirely and replaced by a "← WEEK PLANNER" text link at the top; desktop is the same layout
widened with the rail present.

Sticky header (top 0): "SHOPPING LIST" + "18 of 34 left" in primary; below, a 6px progress bar,
track ink 15%, fill primary, width transitions 160ms.

Sections are the store categories **in the aisle order set in ingredients admin** — Fruit & Veg,
Dairy, Meat, Bakery, Cereal, World Foods, Tinned, Frozen by default. Empty sections are omitted.
Section header sticks at top 86px, white background, solid ink bottom rule, and shows "N left"
in primary.

Item row — the dominant interaction. **The entire 68px row is the tap target**; there is no
small checkbox.
- 44px tick box, blush when unchecked, primary when checked, with a 16px white rhomb
  (clip-path diamond) as the tick. Colour swaps in 120ms.
- Name at 18px. Checked: ink 42% and struck through — still visible, clearly receded.
- Under the name, the "used in" back-reference as a primary 12px uppercase button. One meal
  shows "THU · Chicken thigh puttanesca"; more show "USED IN 3 MEALS". Tapping it stops
  propagation and opens the trace dialog.
- Right: aggregated quantity, Condensed 700 18px tabular. **Quantities that do not sum cleanly
  are shown as separate stacked lines, not converted** — first line 18px ink, additional lines
  "+ 1 punnet" at 15px primary. An absent amount renders as "some".
- Row hover primary-tint.

Trace dialog: item name, one line of context ("Two recipes measure this differently. Both are
shown on the list rather than converted." / "Aggregated from 3 meals this week. Usual pack:
250g punnet."), then one row per use: day in primary Condensed 900, recipe name, quantity.

Pantry staples: a 56px blush bar at the foot, "SUPPRESSED — PANTRY STAPLES (6)" with a
SHOW/HIDE toggle in primary. Expanded, each staple shows name, meal count, quantity and an
ADD / REMOVE secondary button that overrides suppression for this week only, without leaving
the screen.

Foot: UNCHECK ALL and BACK TO PLANNER, both quiet.

### 3. This week — phone first
The seven chosen meals in day order, ticked off as they are cooked. Same phone treatment as the
shopping list: rail hidden under 900px, back link, 640px column, 16px gutters. Desktop 760px,
32px padding.

Row (76px): 44px tick box (blush → primary, white rhomb tick), day in Condensed 900 primary
(44px column), meal name as a button (Condensed 700 19px, **wraps rather than truncating**) over
"Veg · 20 min · serves 2" at 13px, then a chevron-right IconButton. Eaten rows go ink 42% and
strike through. Both the name and the chevron open that meal's recipe page.

Header meta reads "3 OF 7 EATEN". Foot: CLEAR ALL, BACK TO PLANNER.

### 4. Recipe library — desktop first
Header meta "26 OF 184 SHOWN". Filter bar: Search (280px), Ingredient select (canonical list),
Diet (All / Vegetarian / Meat & fish), Max time, Sort (Name / Cook time / Last eaten), then
NEW RECIPE (secondary) right-aligned.

Dense table, **no photographs and no grid** — the system has no imagery. Columns:
`minmax(220px,1.1fr) 78px minmax(260px,1.7fr) 74px 66px 104px 108px`, 56px rows, ink 25% rules,
hover primary-tint. Name (button, Condensed 700 17px, hover primary) / VEG / full ingredient
list truncated at 13px ink 75% / time / servings / last eaten (danger inside the exclusion
window) / ADD button (secondary, 40px) which drops the recipe into the first unlocked day.

### 5. Recipe detail & edit — desktop first
Top bar: ← LIBRARY (quiet), meta "RECIPE 14 · LAST EATEN 1 WK AGO", then ADD TO WEEK (secondary)
and SAVE RECIPE (primary, becomes SAVED after save).

Two columns, `minmax(0,1fr) minmax(0,1.15fr)`, gap 48px.

Left: Name (input at Condensed 700 22px, 56px), then Servings / Cook time / Vegetarian switch in
a row. Method is a two-button segmented choice — FREE TEXT or EXTERNAL LINK, the active one
secondary and the other quiet — showing a 9-row textarea or a URL input. Textarea carries a
single bottom rule, no box.

Right: INGREDIENTS section header with "6 LINES". Grid `80px 108px minmax(0,1fr) 152px`.
Ingredients are **structured, never free text**: amount / unit select / canonical name input
backed by a datalist of the ~200 canonical names. Units: (blank) g ml item tin bag pack punnet
bunch stalk rasher tbsp tsp. **Amount and unit may both be blank, meaning "some"** — the amount
field placeholder is an em dash.

Reordering must not require drag and drop: each row has 40px chevron-up / chevron-down / trash
IconButtons. **Enter in the amount or name field inserts a new row directly below** — this is
the fast path and should be preserved. ADD INGREDIENT (secondary) appends.

### 6. Ingredients admin — desktop first
Rare screen, but where data quality is fixed. Density over friendliness.

Two columns, `minmax(0,1fr) 300px`, gap 40px.

Left: filter input (matches name **and aliases**), bulk "set category" select and TOGGLE PANTRY
button — both disabled with no selection — and a right-aligned "4 selected" count in primary.
Table `40px minmax(0,1.05fr) minmax(0,1.1fr) 150px 84px 110px`: a 24px select square (blush →
primary), canonical name, aliases as comma-separated text (the source data has broccol/broccoli,
carrot/carrots, potato/potatoes as separate entries — aliases are how they collapse), a dense
40px category select, a 30px pantry toggle (primary-tint fill with a ✓ when set, otherwise a
1px ink-25% outline), and a dense pack-size input. Everything edits in place; there is no save.

Right rail: "AISLE ORDER". Numbered list of the eight store categories with up/down IconButtons.
This order drives the shopping list section order — that link is the whole point of the panel.

## Interactions & behaviour

**Rolling.** A slot's pool = all recipes, minus recipes already in the week (no duplicates),
minus non-veg if the veg filter is on, minus anything over max cook time, minus anything eaten
more recently than the exclusion window. Random pick from what remains. "Roll the week"
iterates the seven days, **skips locked days**, and treats locked recipes as taken so it never
duplicates them. If a pool comes up empty the slot is left alone rather than cleared.

**Locking** is the core interaction: lock what you like, re-roll the rest. It must read at a
glance — the primary bar, the day going 900/primary, the filled lock button, and the disabled
re-roll all say it at once.

**Aggregation.** Walk the seven recipes, group ingredient lines by canonical name, sum amounts
**per unit** — never across units. Ingredients with no amount contribute a "some" line. Each
line records day + recipe + original quantity for the trace dialog. Pantry staples are filtered
out of the list but kept for the suppressed block; a per-item override puts one back.

**Live relationship.** The planner rail recomputes from the week on every change — there is no
"generate" step and there must not be one.

**Responsive.** Planner, library, detail and admin are desktop/tablet, 1280px+ assumed; the
planner enforces a 1000px minimum and scrolls horizontally below it. This week and Shopping list
are phone-first and switch layout at 900px.

## State
```
screen                  which of the six views is showing
week[7]                 { recipeId, locked }
fVeg, fTime, fExcl      random-pool filters
flash                   index of the slot to flash after a roll (-2 = whole week)
checked{}               shopping list, by canonical ingredient name
eaten{}                 this week, by day index
pantryOverride{}        staples forced back onto the list
catOrder[8]             aisle order, drives list section order
ingEdits{}              admin overrides: category, pantry flag, pack size
detailId, detail        recipe being viewed / edited, null = unmodified
pickerFor, pickerQuery  recipe picker dialog
traceKey                trace dialog
```

Real implementation needs: recipes, canonical ingredients, recipe_ingredients (amount, unit,
ingredient_id, position), store_categories (with order), week_plan (day, recipe_id, locked,
eaten), and a per-week list state for checked items and pantry overrides. "Last eaten" is
derived from plan history, not stored on the recipe.

## Assets
None. No photography, no illustration, no custom SVG. Icons are Lucide (lock, unlock, dices,
chevron-up, chevron-down, chevron-right, trash-2) via the Penrose `Icon` component. Fonts are
Roboto and Roboto Condensed. The only Unicode glyphs used are `×` (dialog close) and `&`
(headings) — plus `←` on the phone back links.

The recipe and ingredient data in the prototype is realistic sample data (26 recipes, ~80
ingredients) standing in for the real ~180 / ~200. Counts shown in the UI ("184", "204") are
the intended real scale.

## Files
- `Meal Plan.dc.html` — the full prototype, all six screens. Template first, logic class after.
- `_ds/penrose-design-system-.../` — Penrose tokens and component bundle as loaded by the
  prototype. Tokens are the source of truth for colour, type and spacing.
