import { Pool } from 'pg';

let pool;

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Vercel serverless + Supabase: keep the per-instance client pool small.
      max: 1,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
}

export async function query(text, params = []) {
  const db = getPool();
  return db.query(text, params);
}
