# Cloud Run image. Auth is Identity-Aware Proxy in front of the service, so there is nothing
# auth-related in here and nothing application-level in the app.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# No database at build time: every page that reads data is server-rendered on demand.
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Cloud Run sets PORT and expects the container to listen on it.
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# Migrations run as a separate step before a release, not on boot, so a cold start cannot
# race a schema change. They are here so that step can use this same image.
COPY --from=build /app/db/migrations ./db/migrations

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
