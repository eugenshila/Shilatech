import { query } from '../../../lib/db';
import { readSession } from '../../../lib/auth';

const ORDER_STATUSES = ['Pending','Processing','Shipped','Out for Delivery','Delivered','Cancelled'];
const PAYMENT_STATUSES = ['Pending','Paid','Completed','Failed','Refunded'];

function requireAdmin(req, res) {
  const session = readSession(req);
  if (!session) { res.status(401).json({ error: 'Sign in required.' }); return null; }
  if (session.role !== 'admin') { res.status(403).json({ error: 'Admin access required.' }); return null; }
  return session;
}

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  const id = Number(req.body?.id);
  const status = req.body?.status ? String(req.body.status) : null;
  const paymentStatus = req.body?.paymentStatus ? String(req.body.paymentStatus) : null;
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Order id is required.' });
  if (status && !ORDER_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid order status.' });
  if (paymentStatus && !PAYMENT_STATUSES.includes(paymentStatus)) return res.status(400).json({ error: 'Invalid payment status.' });
  if (!status && !paymentStatus) return res.status(400).json({ error: 'Nothing to update.' });
  try {
    const result = await query(`UPDATE orders SET
      status=COALESCE($1,status),
      payment_status=COALESCE($2,payment_status),
      updated_at=NOW()
      WHERE id=$3 RETURNING id,order_no,status,payment_status,updated_at`, [status,paymentStatus,id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Order not found.' });
    res.status(200).json({ order: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not update order.' });
  }
}
