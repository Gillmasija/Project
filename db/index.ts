import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const connectionString = process.env.DATABASE_URL;

// Connection function for migrations with SSL configuration
const migrationClient = postgres(connectionString, { 
  max: 1,
  ssl: process.env.NODE_ENV === 'production',
  connect_timeout: 10
});

// Connection for query builder with SSL configuration
const queryClient = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production',
  connect_timeout: 10
});

export const db = drizzle(queryClient, { schema });
export const migrationDb = drizzle(migrationClient, { schema });
