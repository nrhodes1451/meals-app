# Meal planner

A private meal planning and shopping list app for a household of two. Each week we pick
evening meals from a library of ~170 recipes; the app builds a consolidated shopping list
ordered by supermarket aisle. Planning happens at home on a laptop or iPad; the list is
used one-handed on a phone in the shop.

It replaces a Google Sheet we have used weekly since 2014.

**Live:** [meals.penrose.tools](https://meals.penrose.tools) (household access only)

## What it does

- **Week planner** — roll a variable-length week (1–14 meals) from a filtered pool.
  Lock the meals you want to keep, re-roll the rest. Filters cover vegetarian, cook time,
  and how recently a recipe was last cooked.
- **Live shopping list** — quantities are derived on read from the planned recipes, never
  stored as a snapshot. Items group by aisle; pantry staples are suppressed by default and
  can be restored without leaving the list.
- **This week** — tick meals off as they are cooked.
- **Recipe library** — search and filter ~170 recipes, including structured ingredients
  with canonical names and aliases (so `carrot` / `carrots` collapse to one thing you buy).
- **Ingredients admin** — fix data quality in place: aliases, aisle order, pantry flags.

Accessibility is a hard constraint: one of us has limited fine motor control on bad days.
Touch targets are at least 44×44px, every reorder has a button alternative, and nothing
depends on precision gestures.

## Stack

- **Next.js** (App Router) and TypeScript, React Server Components
- **Postgres** via Neon in production; **PGlite** locally so the app runs with no
  infrastructure
- **Drizzle ORM**, server actions for mutations (no separate API layer)
- **Tailwind** with a custom Penrose design system (modern art deco: geometric, high
  contrast, flat)
- **Cloud Run**, scaled to zero when idle
- **Identity-Aware Proxy** at the infrastructure layer — two Google accounts, no
  app-level auth

## Design highlights

Quantity aggregation is the interesting bit. Recipe lines use structured amounts and
units across dimensions (mass, volume, count). The shopping list sums within a dimension
(converting kg→g, l→ml) and keeps incompatible buckets separate, so an ingredient can
correctly render as `onions: 1, 2 bags, 3 tins, 300g` rather than forcing a false
conversion.

Seed data is the normalised output of a one-off migration from the original sheet:
170 recipes, 179 canonical ingredients, 11 store categories.

## Running locally

```bash
npm install
npm run db:reset   # migrate, seed, verify
npm run dev
```

With `DATABASE_URL` unset, the schema runs on PGlite (Postgres in-process) and stores
data under `.pglite/`. Point `DATABASE_URL` at Neon for a remote database; migrations are
the same either way.

PGlite is single-process — stop the dev server before `npm run seed` or `npm run db:reset`.

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` / `test` | Checks |
| `npm run db:reset` | Fresh migrate, seed, and verify |
| `npm run db:generate` / `db:migrate` | Schema → SQL → apply |
| `npm run seed` / `verify:seed` | Load and assert seed data |

## Deploy

Deployed to Cloud Run (scale-to-zero) with Neon Postgres and IAP. Custom domain, no load
balancer. See [docs/deploy.md](docs/deploy.md) for the full setup and release steps.

```bash
npm run lint && npm run typecheck && npm test
gcloud run deploy meal-planner --source . --region us-east4
```

## Layout

```
app/           screens (one directory per route)
components/    shared UI and per-screen components
db/            schema, client, migrations
lib/           quantity math, aggregation, rolling, history
seed/          migrated recipe and ingredient data
styles/        design tokens
docs/          design handoff and deploy notes
tests/
```
