import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema';

/**
 * Driver-agnostic. Both drivers below satisfy this, so nothing has to be cast and the type
 * checker sees the same surface the code actually gets - including `transaction`, which the
 * recipe editor and the shopping list both depend on.
 */
export type Db = PgDatabase<
  PgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export const LOCAL_DATA_DIR = '.pglite';

/**
 * Neon when `DATABASE_URL` is set, PGlite on disk otherwise. PGlite is a real Postgres running
 * in process, so local development needs no infrastructure; it is single-process, so stop the
 * dev server before reseeding.
 *
 * Neon goes over a WebSocket rather than `neon-http`. The HTTP driver cannot open a
 * transaction, and rewriting a recipe's ingredient lines has to be atomic.
 *
 * The handle is cached on `globalThis` so a dev-server hot reload does not open a second
 * connection to the same data directory.
 */
const globalForDb = globalThis as unknown as { penroseDb?: Db };

export async function getDb(): Promise<Db> {
  if (globalForDb.penroseDb) return globalForDb.penroseDb;

  const url = process.env.DATABASE_URL;
  let db: Db;

  if (url) {
    const [{ Pool, neonConfig }, { drizzle }, ws] = await Promise.all([
      import('@neondatabase/serverless'),
      import('drizzle-orm/neon-serverless'),
      import('ws'),
    ]);
    neonConfig.webSocketConstructor = ws.default;
    db = drizzle(new Pool({ connectionString: url }), { schema });
  } else {
    const [{ PGlite }, { drizzle }] = await Promise.all([
      import('@electric-sql/pglite'),
      import('drizzle-orm/pglite'),
    ]);
    db = drizzle(new PGlite(LOCAL_DATA_DIR), { schema });
  }

  globalForDb.penroseDb = db;
  return db;
}
