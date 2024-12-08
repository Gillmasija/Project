import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const connectionString = process.env.DATABASE_URL;

// Connection function for migrations
const migrationClient = postgres(connectionString, { max: 1 });

// Connection for query builder
const queryClient = postgres(connectionString);

export const db = drizzle(queryClient, { schema });
export const migrationDb = drizzle(migrationClient, { schema });
