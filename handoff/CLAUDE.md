# Meal planner

A private meal planning and shopping list app for a household of two. Replaces a Google
Sheet used weekly since 2014.

Each week the household picks 7 evening meals from a library of ~170 recipes. The app
generates a consolidated shopping list ordered by supermarket aisle. Planning happens on
a laptop or iPad at home; the list is used on a phone, in the shop.

This is a private tool, not a product. There is no signup, no onboarding, no marketing
copy, no illustrated empty states, no feature discovery. Two users, both of whom know
exactly what it does. Optimise for the speed of a ritual performed every week.

## Stack

- Next.js (App Router), TypeScript, React Server Components
- Tailwind + shadcn/ui
- Postgres via Neon, Drizzle ORM
- Deployed to Cloud Run
- Auth is Identity-Aware Proxy at the infrastructure layer, restricted to two Google
  accounts

Do not add NextAuth, Clerk, Auth.js, or any application-level auth. Do not add Prisma.
Do not add a state management library; server components plus `useState` are sufficient
at this scale. Do not add an API layer between the pages and the database - query
Drizzle directly from server components and use server actions for mutations.

## Viewport priority

These differ by screen and both matter.

- **Planner, recipe library, ingredients admin**: desktop and tablet first. Assume
  1280px+ and use the width. Multi-column, dense. Phone is a supported fallback.
- **Shopping list**: phone first. One-handed use in a supermarket, poor signal, poor
  lighting. Desktop is a widened version of the same layout.

Do not resolve this into a single "responsive" layout that is mediocre at both.

## Accessibility - hard constraints

One of the two users has limited fine motor control on bad days. These are requirements,
not preferences.

- Minimum touch target 44x44px, 48px preferred. Shopping list rows are 48px.
- No drag-and-drop as the only route to any action. Every reorder needs a button
  alternative.
- No precision gestures, no swipe-to-reveal as the only path, no small close buttons.
- Every interaction must work with imprecise taps.
- Visible keyboard focus everywhere. Never remove outlines.
- Respect `prefers-reduced-motion`.

## Design system

Penrose - see `styles/tokens.css`. Modern art deco: geometric, symmetrical, high
contrast, flat.

Bind to the CSS custom properties. Do not hardcode hex values in components.

Rules the tokens cannot express:

- One screen uses ground + paper + ink + ONE accent family. Never all 13 colours.
- The warm ramp (`--pen-accent-hot`, `--pen-accent`, `--pen-accent-soft`,
  `--pen-accent-gold`) never carries text on a light background. Fills only.
- Gold is the deco metallic: hairline rules and fine linework only.
- There is no blue in this palette. Do not invent one. For informational states use ink
  on `--pen-primary-tint`.
- No gradients, no drop shadows, no blur, no glassmorphism. Depth is a 1px hard-black
  keyline.
- Border radius 0 to 2px. Chamfer or step corners rather than curving them.
- Headings uppercase, Roboto Condensed, tracking 0.08-0.12em, weight 700-900.
- Divide with rules, not cards and not whitespace.
- No photography. There are no food images in this system.

## Data model

See `db/schema.ts`. Key points:

- **Ingredients are canonical.** The source sheet had `broccoli`/`broccol`,
  `carrot`/`carrots`, `potato`/`potatoes` as separate entries. These are now one row
  each with an alias table. Names are plural for countables, singular for mass nouns:
  "carrots: 1" reads better than "carrot: 5".
- **Fresh is the default.** Frozen variants are separate ingredient rows with
  `frozen = true`, sharing a name with the fresh row. Fresh spinach and frozen spinach
  are two different things you buy from two different aisles. Display frozen items as
  "spinach (frozen)".
- **Pantry staples are suppressed** from the shopping list. Spices, pastes, oils,
  condiments, dried herbs. They are restocked as they run out and should not bloat the
  weekly list. The user must be able to see what was suppressed and restore an item
  without leaving the shopping list screen.
- **`packSize`/`packUnit` are nullable and mostly empty.** They exist so waste-minimising
  meal selection becomes possible later. Do not build that yet.
- **Shopping list quantities are derived on read, not stored.** The
  `shopping_list_items` table holds only per-shop state: checked, manually added,
  staple overrides.

## Quantity aggregation - the rule

Quantities in the source were free text (`0.5 bags`, `4 rashers`, `550g`, `1 tins`).
They are now `{ amount: numeric | null, unit: enum | null }`.

Units belong to a dimension:

- mass: `g`, `kg`
- volume: `ml`, `l`, `tsp`, `tbsp`
- count: everything else, each unit its own bucket. A bare count (`unit = null`) is
  its own bucket too.

To build the shopping list:

1. Group all recipe ingredient lines across the week by canonical ingredient.
2. Within a group, sum amounts that share a dimension. Convert within a dimension
   (kg to g, l to ml) before summing.
3. Emit one quantity per bucket present, joined by commas.
4. Lines with `amount = null` contribute "some", and are absorbed if any measured
   quantity exists for that ingredient.

So an ingredient appearing across four recipes might render as
`onions: 1, 2 bags, 3 tins, 300g`. This is correct and intended. Do not pick one bucket
and discard the rest, and do not attempt to convert between dimensions - there is no
sound conversion from grams to punnets. Show the shopper everything they need to buy.

## Meal selection

For now: pick N recipes at random from a filtered pool. Filters are vegetarian, maximum
cook time, and exclude recipes cooked in the last N weeks. Archived recipes are never
in the pool.

Individual slots must be independently re-rollable and lockable. Locking a slot then
re-rolling the rest is the core interaction. There is also a "roll the whole week"
action that respects locks.

Do not build a constrained optimiser. It is deliberately deferred until pack size data
has accumulated.

## Seed data

`seed/ingredients.json` and `seed/recipes.json` are the normalised output of a one-off
migration from the original sheet. `seed/migrate.py` produced them and is not part of
the application. `seed/review.md` lists the judgement calls made during migration.

- 170 recipes, 179 canonical ingredients, 11 store categories
- 57 recipes are archived: legacy keto and meat dishes from an earlier era. Kept for
  history, excluded from the random pool and from the library default view.
- 73 recipes carry a `keto` flag, independent of `archived`
- 31 ingredients are marked as pantry staples
- Recipe `method` is free text and may be instructions, or a book and page reference
  ("Page 60 Green roasting tin"). `sourceUrl` holds URLs separately.

## Conventions

- Hyphens, never em dashes, in all copy and comments.
- British English throughout: courgette, aubergine, yoghurt, colour.
- Active voice on controls. The button that says "Roll week" produces "Week rolled".
- Sentence case in body copy. Uppercase only for display headings.
- Errors state what went wrong and how to fix it. They do not apologise.
