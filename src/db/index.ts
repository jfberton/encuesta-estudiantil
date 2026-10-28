import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("CRITICAL: DATABASE_URL no está definida en process.env");
    return "";
  }
  return url;
}

let _dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_dbInstance) {
    const url = getDatabaseUrl();
    const sql = neon(url);
    _dbInstance = drizzle(sql, { schema });
  }
  return _dbInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const instance = getDb();
    // @ts-expect-error proxy forward
    return instance[prop];
  },
});
