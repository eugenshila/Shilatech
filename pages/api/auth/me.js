import { readSession } from '../../../lib/auth';
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const session = readSession(req);
  if (!session) return res.status(401).json({ user: null });
  try {
    const result = await query('SELECT id,name,email,phone,role FROM customers WHERE id=$1 LIMIT 1', [session.sub]);
    const user = result.rows[0] || null;
    if (!user) return res.status(401).json({ user: null });
    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load account.' });
  }
}
