import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { schema, type Db } from "./index";

/**
 * Connects over HTTP, one request per query. This suits serverless
 * functions, because no connection is held open between requests.
 */
export function createNeonDb(databaseUrl: string): Db {
  return drizzle({ client: neon(databaseUrl), schema }) as unknown as Db;
}
