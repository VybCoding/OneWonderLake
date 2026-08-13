import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("[DB] FATAL: DATABASE_URL environment variable is not set");
  console.error("[DB] Set it in Vercel → Settings → Environment Variables");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// A standard TCP connection, which works identically against a local Postgres
// and against the hosted pooled endpoint. The session store (connect-pg-simple)
// already connects this way, so there is one driver rather than two.
// Keep the pool small: serverless instances are many and short-lived, and the
// pooled endpoint multiplexes on the server side.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
  ssl: /\bsslmode=(require|verify-full|verify-ca)\b/.test(process.env.DATABASE_URL)
    ? { rejectUnauthorized: false }
    : undefined,
});

pool.on("error", (err) => {
  console.error("[DB] Idle client error:", err.message);
});

export const db = drizzle(pool, { schema });
