import bcrypt from 'bcryptjs';
import { query } from '../../../lib/db';
import { setSession, signSession } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({ error: 'Name, email and a password of at least 8 characters are required.' });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO customers (name,email,phone,password_hash)
       VALUES ($1,$2,$3,$4)
       RETURNING id,name,email,phone,role`,
      [String(name).trim(), String(email).trim().toLowerCase(), phone ? String(phone).trim() : null, hash]
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
