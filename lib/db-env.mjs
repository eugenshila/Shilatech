import pg from 'pg';
import nextEnv from '@next/env';

const HINT = 'DATABASE_URL is required. Put your PostgreSQL connection string in .env.local (the same file Next.js uses) or export it in your shell, then rerun this command.';

export function loadDatabaseUrl(cwd = process.cwd()) {
  // Dev-mode load includes .env.local. Values already in the process environment win.
  nextEnv.loadEnvConfig(cwd, process.env.NODE_ENV !== 'production');
  if (!process.env.DATABASE_URL) throw new Error(HINT);
  return process.env.DATABASE_URL;
}

export function createDatabasePool(cwd = process.cwd()) {
  return new pg.Pool({
    connectionString: loadDatabaseUrl(cwd),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
}
