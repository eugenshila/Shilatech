import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

// This setup must never connect to a hosted or production database.
export function assertLocalDatabase(url, nodeEnv = process.env.NODE_ENV) {
  if (nodeEnv === 'production') throw new Error('Local administrator setup is disabled in production.');
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('Set DATABASE_URL to your local PostgreSQL database first.'); }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) ||
      parsed.searchParams.has('host')) {
    throw new Error('Local administrator setup only accepts a localhost PostgreSQL DATABASE_URL.');
  }
}

// Caller owns the transaction. Only creates a new account; never resets an existing password.
export async function createLocalAdministrator(client, email, name = 'Local Administrator') {
  const normalized = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Provide a valid administrator email address.');
  const existing = await client.query('SELECT id FROM customers WHERE lower(email)=$1 LIMIT 1', [normalized]);
  if (existing.rows.length) throw new Error('This email already has an account. No password was changed.');

  const password = randomBytes(24).toString('base64url');
  const hash = await bcrypt.hash(password, 12);
  const result = await client.query(
    `INSERT INTO customers(name,email,password_hash,role,location_id,must_change_password)
     VALUES ($1,$2,$3,'admin',main_business_location_id(),TRUE)
     ON CONFLICT (email) DO NOTHING RETURNING id`,
    [String(name).trim() || 'Local Administrator', normalized, hash]
  );
  if (!result.rows.length) throw new Error('This email already has an account. No password was changed.');
  return password;
}
