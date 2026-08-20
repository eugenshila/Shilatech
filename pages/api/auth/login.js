import bcrypt from 'bcryptjs';
import { query } from '../../../lib/db';
import { setSession, signSession } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  try {
    const result = await query(
      `SELECT id,name,email,phone,role,password_hash FROM customers WHERE email=$1 LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const safeUser = { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
    setSession(res, signSession(safeUser));
    res.status(200).json({ user: safeUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not sign in.' });
  }
}
