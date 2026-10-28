import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const DEFAULT_DATABASE_URL =
  "postgresql://neondb_owner:npg_2m7rYGitHQLc@ep-aged-mountain-b5h3db2g-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.length > 10) {
    return process.env.DATABASE_URL;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext({ async: false });
    if (ctx?.env?.DATABASE_URL) {
      return ctx.env.DATABASE_URL as string;
    }
  } catch {
    // Fallback seguro
  }

  return DEFAULT_DATABASE_URL;
}

let _dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  const url = getDatabaseUrl();
  if (!_dbInstance) {
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
