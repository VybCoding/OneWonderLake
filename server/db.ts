import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

console.log("[DB] Initializing database connection...");

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error("[DB] FATAL: DATABASE_URL environment variable is not set");
  console.error("[DB] Please ensure DATABASE_URL is configured in your deployment environment");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("[DB] DATABASE_URL is configured, creating connection pool...");
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
console.log("[DB] Database connection initialized successfully");
