import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  try {
    // Soporte para Cloudflare Workers con OpenNext
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext({ async: false });
    if (ctx?.env?.DATABASE_URL) {
      return ctx.env.DATABASE_URL as string;
    }
  } catch {
    // Contexto local o fallback
  }

  console.error("CRITICAL: DATABASE_URL no encontrada en process.env ni en CloudflareContext");
  return "";
}

let _dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  const url = getDatabaseUrl();
  if (!_dbInstance || !_dbInstance._) {
    const sql = neon(url);
    _dbInstance = drizzle(sql, { schema });
  }
  return _dbInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const instance = getDb();
    // @ts-expect-error proxy access
    return instance[prop];
  },
});
