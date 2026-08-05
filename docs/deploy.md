# Deploying

Cloud Run in `us-east4` (Northern Virginia), Neon Postgres in AWS `us-east-2`, Identity-Aware
Proxy enabled **directly on the Cloud Run service**. No load balancer. Custom hostname
`meals.penrose.tools`.

Two users, both personal Google accounts. There is no application-level auth and there must
not be any. IAP is the gate; if it is misconfigured the app is open.

IAP on Cloud Run no longer needs an HTTPS load balancer. Google documents that path as the
recommended one, and it avoids the fixed monthly cost of a balancer. See
[Configure IAP for Cloud Run](https://cloud.google.com/run/docs/securing/identity-aware-proxy-cloud-run).

## Shape

- Cloud Run service `meal-planner` in **`us-east4`**: `min-instances=0`, `max-instances=1`,
  `512Mi`, CPU only while serving. Scales to zero when idle.
- Neon free tier in AWS **`us-east-2`**. Compute suspends when idle.
- Custom domain `meals.penrose.tools` via Cloud Run domain mapping (supported in `us-east4`).
- `DATABASE_URL` in Secret Manager. The app uses Neon over a WebSocket (not `neon-http`) so
  transactions work - see `db/index.ts`.
- Auth: `--no-allow-unauthenticated` plus IAP on the service. Grant
  `roles/iap.httpsResourceAccessor` to the two Gmail accounts.

Cost when idle is near zero: no always-on instance, no load balancer, Neon free compute
suspended. You pay for request time, Cloud Build minutes, and Neon storage on the free plan.

`us-east4` is used rather than `europe-west2` because: (1) Neon is in `us-east-2`, and
(2) Cloud Run domain mapping is not available in London.

## One-off setup

Project: `meals-492311`. Region: `us-east4`.

### 1. Neon

1. Sign up at [neon.tech](https://neon.tech).
2. Create a project named `meal-planner`, region **AWS us-east-2**, Postgres 16.
3. Copy the **pooled** connection string. The host contains `-pooler`. Do not commit it.

### 2. APIs and service account

```bash
gcloud config set project meals-492311

gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  iap.googleapis.com

gcloud iam service-accounts create meal-planner \
  --display-name="Meal planner Cloud Run"

gcloud secrets create meal-planner-database-url --replication-policy=automatic

printf '%s' 'postgres://...' \
  | gcloud secrets versions add meal-planner-database-url --data-file=-

gcloud secrets add-iam-policy-binding meal-planner-database-url \
  --member=serviceAccount:meal-planner@meals-492311.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

### 3. Migrate and seed (once, from a laptop)

The seed truncates and reinserts. Point it only at an empty Neon database.

```bash
export DATABASE_URL='postgres://...pooler...'
npm run db:migrate
npm run seed
npm run verify:seed
```

Migrations are not run on container boot.

### 4. Deploy

```bash
gcloud run deploy meal-planner \
  --source . \
  --region us-east4 \
  --service-account meal-planner@meals-492311.iam.gserviceaccount.com \
  --set-secrets DATABASE_URL=meal-planner-database-url:latest \
  --min-instances 0 \
  --max-instances 1 \
  --memory 512Mi \
  --cpu 1 \
  --cpu-throttling \
  --no-allow-unauthenticated
```

Until IAP is enabled, unauthenticated browser hits get 403. That is expected.

### 5. Custom domain `meals.penrose.tools`

Verify the base domain once (Search Console owns this):

```bash
gcloud domains verify penrose.tools
```

Complete verification in Search Console (usually a TXT record on Squarespace DNS for
`penrose.tools`). Then:

```bash
gcloud beta run domain-mappings create \
  --service=meal-planner \
  --domain=meals.penrose.tools \
  --region=us-east4

gcloud beta run domain-mappings describe \
  --domain=meals.penrose.tools \
  --region=us-east4
```

Add the DNS records it prints at Squarespace (**Domains → penrose.tools → DNS settings**).
For a subdomain this is typically:

| Type | Host | Data |
| --- | --- | --- |
| CNAME | `meals` | `ghs.googlehosted.com` |

Leave the apex and `www` on Squarespace for the main site. SSL usually takes ~15 minutes after
DNS propagates, sometimes longer.

### 6. Enable IAP (console)

Personal Gmail / no-organisation projects usually need the console the first time, so Google
can create the OAuth client.

1. Cloud Run → `meal-planner` (`us-east4`) → Security.
2. Require authentication → **Identity-Aware Proxy**.
3. Save. The console grants `roles/run.invoker` to the IAP service agent.
4. Grant access to both household accounts:

```bash
gcloud iap web add-iam-policy-binding \
  --region=us-east4 \
  --resource-type=cloud-run \
  --service=meal-planner \
  --member=user:one@gmail.com \
  --role=roles/iap.httpsResourceAccessor

gcloud iap web add-iam-policy-binding \
  --region=us-east4 \
  --resource-type=cloud-run \
  --service=meal-planner \
  --member=user:two@gmail.com \
  --role=roles/iap.httpsResourceAccessor
```

5. Open `https://meals.penrose.tools`, sign in, confirm the planner and shopping list.

Do not put a load balancer in front unless you later need features domain mapping cannot
provide. You cannot enable IAP on both the load balancer and the Cloud Run service.

## Releasing

```bash
npm run lint && npm run typecheck && npm test
DATABASE_URL=... npm run db:migrate    # only when db/migrations changed
gcloud run deploy meal-planner --source . --region us-east4
```

## Notes

- `output: 'standalone'` in `next.config.ts` keeps the image small.
- An empty `public/` directory exists so the Dockerfile `COPY` succeeds.
- The image build uses `npm install` rather than `npm ci`: alpine's npm was rejecting
  this lockfile's optional `@esbuild` platform entries under `ci`.
- PGlite stays in the dependency tree for local use when `DATABASE_URL` is unset. Production
  always sets the secret, so PGlite is never loaded there.
- First request after an idle period pays a Cloud Run cold start plus Neon wake-up, a second
  or two. Fine for a tool used a few times a week.
- Cloud Run domain mapping is preview and Google notes latency caveats; for this household
  tool it is the cheap path that avoids a load balancer.
