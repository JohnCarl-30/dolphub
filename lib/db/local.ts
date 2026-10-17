import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { schema, type Db } from "./index";
import { seedBaseData } from "./seed-data";

const globalForDb = globalThis as unknown as { __pcuLocalDb?: Promise<Db> };

/**
 * Local development only: Postgres running inside Node, stored in a folder.
 * Applies migrations and seed data on start. Use DATABASE_URL=pglite:./.data/pglite
 * The instance is kept on globalThis so hot reload does not open the folder twice.
 */
export function createLocalDb(dataDir: string): Promise<Db> {
  globalForDb.__pcuLocalDb ??= (async () => {
    const client = new PGlite(dataDir === "memory" ? undefined : dataDir);
    const db = drizzle({ client, schema });
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    await seedBaseData(db as unknown as Db);
    return db as unknown as Db;
  })();
  return globalForDb.__pcuLocalDb;
}
