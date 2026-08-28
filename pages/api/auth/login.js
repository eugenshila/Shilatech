import bcrypt from 'bcryptjs';
import { query } from '../../../lib/db';
import { setSession, signSession } from '../../../lib/auth';

function isAdminEmail(email) {
  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  return Boolean(adminEmail && email === adminEmail);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const result = await query(
      `SELECT id,name,email,phone,role,password_hash FROM customers WHERE email=$1 LIMIT 1`,
      [normalizedEmail]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let role = user.role;
    if (isAdminEmail(normalizedEmail) && role !== 'admin') {
      const promoted = await query(
        `UPDATE customers SET role='admin',location_id=COALESCE(location_id,main_business_location_id()) WHERE id=$1 RETURNING role`,
        [user.id]
      );
      role = promoted.rows[0]?.role || 'admin';
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, phone: user.phone, role };
    setSession(res, signSession(safeUser));
    res.status(200).json({ user: safeUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not sign in.' });
  }
}
