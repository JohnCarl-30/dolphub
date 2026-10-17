import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export { schema };

/**
 * Any Drizzle Postgres database built with this schema.
 * Production uses the Neon HTTP driver. Tests use in-memory PGlite.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
