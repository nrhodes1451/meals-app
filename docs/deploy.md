# Deploying

Cloud Run, with Neon for Postgres and Identity-Aware Proxy in front for auth. Two users, both
named Google accounts.

There is no application-level auth and there must not be any. No NextAuth, no Clerk, no Auth.js,
no login screen, no session handling in the app. If IAP is misconfigured the app is open, so IAP
is the thing to get right.

## One-off setup

### 1. Neon

Create a project and take the pooled connection string. Keep two branches: `main` for production
and one for anything you want to try against real data.

```bash
gcloud secrets create meal-planner-database-url --replication-policy=automatic
printf '%s' 'postgres://...@...neon.tech/neondb?sslmode=require' \
  | gcloud secrets versions add meal-planner-database-url --data-file=-
```

The app opens Neon over a WebSocket rather than `neon-http`, because the HTTP driver cannot open
a transaction and rewriting a recipe's ingredient lines has to be atomic. Nothing to configure -
`db/index.ts` picks the driver from whether `DATABASE_URL` is set.

### 2. Service account

```bash
gcloud iam service-accounts create meal-planner
gcloud secrets add-iam-policy-binding meal-planner-database-url \
  --member=serviceAccount:meal-planner@PROJECT.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

### 3. First deploy

```bash
gcloud run deploy meal-planner \
  --source . \
  --region europe-west2 \
  --service-account meal-planner@PROJECT.iam.gserviceaccount.com \
  --set-secrets DATABASE_URL=meal-planner-database-url:latest \
  --min-instances 0 \
  --max-instances 2 \
  --no-allow-unauthenticated
```

`--no-allow-unauthenticated` matters: it is what stops the service being reachable without going
through the load balancer and IAP.

### 4. IAP

Cloud Run behind IAP needs an external HTTPS load balancer with a serverless network endpoint
group pointing at the service.

1. Create the serverless NEG, backend service, URL map, certificate and forwarding rule.
2. Turn IAP on for the backend service.
3. Grant exactly the two accounts, and nobody else:

```bash
gcloud iap web add-iam-policy-binding \
  --resource-type=backend-services --service=meal-planner-backend \
  --member=user:one@example.com --role=roles/iap.httpsResourceAccessor
gcloud iap web add-iam-policy-binding \
  --resource-type=backend-services --service=meal-planner-backend \
  --member=user:two@example.com --role=roles/iap.httpsResourceAccessor
```

Check the members list afterwards. An inherited project-level grant will silently widen access
beyond the two accounts.

### 5. Seed, once

The seed is the migrated source sheet and is meant to run once, on an empty database. It
truncates and reinserts, so do not point it at a database that has been used.

```bash
DATABASE_URL=... npm run db:migrate
DATABASE_URL=... npm run seed
DATABASE_URL=... npm run verify:seed
```

`verify:seed` asserts the counts from `seed/review.md` - 11 categories, 179 ingredients, 170
recipes, 875 ingredient lines - so a partial load fails loudly rather than leaving a half-built
library.

## Releasing

```bash
npm run lint && npm run typecheck && npm test
DATABASE_URL=... npm run db:migrate    # only when db/migrations has changed
gcloud run deploy meal-planner --source . --region europe-west2
```

Migrations run before the deploy, as their own step, so a cold start cannot race a schema change.
Every migration so far is additive, so the old revision keeps working while the new one rolls
out.

## Notes

- `output: 'standalone'` in `next.config.ts` is what makes the image small. The `Dockerfile` is
  there for building outside Cloud Build; `--source .` uses buildpacks and ignores it.
- No page is prerendered with data at build time, so the image needs no database to build.
- PGlite stays in the dependency tree because the code imports it lazily when `DATABASE_URL` is
  unset. It is never loaded in production.
- Cloud Run scales to zero. The first request after an idle period pays a cold start plus a Neon
  connection, a second or two. For a tool used a few times a week that is the right trade against
  paying for an idle instance.
