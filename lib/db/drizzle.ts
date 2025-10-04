import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// Configure connection pool optimized for Supabase
// Use a smaller pool size and enable connection reuse
export const client = postgres(process.env.POSTGRES_URL, {
  max: 1, // Use single connection for serverless/edge functions
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false // Disable prepared statements for better compatibility with Supabase pooler
});

export const db = drizzle(client, { schema });
