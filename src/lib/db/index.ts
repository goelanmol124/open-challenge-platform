import { drizzle } from "drizzle-orm/mysql2";
import { createPool, type Pool } from "mysql2/promise";

import * as schema from "./schema";

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { __ocpPool?: Pool };

const pool =
  globalForDb.__ocpPool ??
  createPool({
    uri: process.env.DATABASE_URL || "mysql://app:app@localhost:3306/challenges",
    connectionLimit: 10,
    waitForConnections: true,
    connectTimeout: 10_000,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__ocpPool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
export { pool };
export * as tables from "./schema";
