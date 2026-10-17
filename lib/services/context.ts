import type { Db } from "../db";
import type { ObjectStorage } from "../storage/types";

/** Everything a service needs, passed in so tests can swap any part. */
export interface ServiceContext {
  db: Db;
  storage: ObjectStorage;
  now?: () => Date;
}

export const nowOf = (ctx: Pick<ServiceContext, "now">) => (ctx.now ? ctx.now() : new Date());
