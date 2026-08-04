import { rmSync } from 'node:fs';
import { LOCAL_DATA_DIR } from './index';

const MIGRATIONS = './db/migrations';

async function main() {
  const fresh = process.argv.includes('--fresh');
  const url = process.env.DATABASE_URL;

  if (url) {
    if (fresh) {
      throw new Error(
        'Refusing --fresh against DATABASE_URL. Drop the Neon branch by hand if that is what you want.',
      );
    }
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const { migrate } = await import('drizzle-orm/neon-serverless/migrator');
    const ws = await import('ws');
    neonConfig.webSocketConstructor = ws.default;
    const pool = new Pool({ connectionString: url });
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS });
    await pool.end();
    console.log('Migrated Neon.');
    return;
  }

  if (fresh) {
    rmSync(LOCAL_DATA_DIR, { recursive: true, force: true });
    console.log(`Removed ${LOCAL_DATA_DIR}.`);
  }

  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const client = new PGlite(LOCAL_DATA_DIR);
  await migrate(drizzle(client), { migrationsFolder: MIGRATIONS });
  await client.close();
  console.log(`Migrated ${LOCAL_DATA_DIR}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
