# Meal planner

Private meal planning and shopping list app for a household of two. See
[CLAUDE.md](CLAUDE.md) for the product and design rules, and [PLAN.md](PLAN.md) for the
build plan and the open questions.

## Running it

```bash
npm install
npm run db:reset   # migrate, seed, verify
npm run dev
```

There is no database to install. With `DATABASE_URL` unset the app runs the schema on
PGlite, a real Postgres compiled to wasm, storing data in `.pglite/`. Set `DATABASE_URL`
to a Neon connection string for deployed environments; the schema and migrations are the
same either way.

PGlite is single-process, so stop the dev server before running `npm run seed` or
`npm run db:reset`.

## Scripts

- `npm run dev` / `build` / `start` - Next.js
- `npm run lint` - ESLint, including the Penrose rule that bans raw hex colours in
  components
- `npm run typecheck` - `tsc --noEmit`
- `npm test` - vitest, covering quantity aggregation
- `npm run db:generate` - regenerate SQL migrations from `db/schema.ts`
- `npm run db:migrate` - apply migrations (`-- --fresh` wipes the local PGlite directory)
- `npm run seed` - load `seed/*.json`
- `npm run verify:seed` - assert the seeded counts
- `npm run db:reset` - fresh migrate, seed and verify in one go
- `npm run check:contrast` - assert the token colour pairs meet 4.5:1

## Deploying

Cloud Run, Neon, and Identity-Aware Proxy in front restricted to two Google accounts. There is
no application-level auth and there must not be any. See [docs/deploy.md](docs/deploy.md).

## Layout

```
app/         screens, one directory per route
components/  penrose/ primitives, then one directory per screen
db/          schema, client, migrations
lib/         quantity, aggregation, rolling, history
seed/        the migrated source data, its loader, and the migration script that made it
styles/      tokens.css - the only palette, type ramp and spacing scale
docs/design/ the design handoff, for reference. Not built or linted
tests/
```

## Conventions

British English, hyphens rather than em dashes, sentence case in body copy and uppercase
only for display headings. Bind to the tokens in `styles/tokens.css`; never hardcode a
colour.
