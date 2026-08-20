import bcrypt from 'bcryptjs';
import { query } from '../../../lib/db';
import { setSession, signSession } from '../../../lib/auth';

function isAdminEmail(email) {
  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  return Boolean(adminEmail && email === adminEmail);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({ error: 'Name, email and a password of at least 8 characters are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const role = isAdminEmail(normalizedEmail) ? 'admin' : 'customer';

  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO customers (name,email,phone,password_hash,role)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id,name,email,phone,role`,
      [String(name).trim(), normalizedEmail, phone ? String(phone).trim() : null, hash, role]
    );
    const user = result.rows[0];
    setSession(res, signSession(user));
    res.status(201).json({ user });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'An account with that email already exists.' });
    console.error(error);
    res.status(500).json({ error: 'Could not create account.' });
  }
}
