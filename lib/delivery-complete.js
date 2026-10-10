// Shared proof-of-delivery rules. Used by the Delivery PDA (/delivery) and by the
// warehouse fulfilment card (/warehouse) so both screens enforce identical checks.

export const MAX_SIGNATURE_LENGTH = 900000;

// Roles that may complete a delivery. Drivers are limited to their own jobs.
export const PROOF_ROLES = ['admin', 'general_manager', 'dispatch', 'delivery_driver', 'warehouse_operator'];

export const PAYMENT_PENDING_MESSAGE = 'Payment is still pending. Prompt the customer for M-Pesa payment and wait for confirmation before completing delivery.';

export function isPaid(paymentStatus) {
  return String(paymentStatus || '').toLowerCase() === 'paid';
}

export function requiresMpesaPayment(job) {
  return String(job?.payment_method || '').toLowerCase() === 'm-pesa' && !isPaid(job?.payment_status);
}

// Validates the request body. Throws an Error with a customer-safe message when invalid.
export function parseProofOfDelivery(body) {
  const deliveryId = Number(body?.deliveryId);
  const recipientName = String(body?.recipientName || '').trim();
  const signatureData = String(body?.signatureData || '').trim();
  const notes = String(body?.notes || '').trim() || null;
  const lat = body?.lat == null ? null : Number(body.lat);
  const lng = body?.lng == null ? null : Number(body.lng);
  if (!Number.isInteger(deliveryId) || !recipientName || !signatureData.startsWith('data:image/')) {
    throw new Error('Recipient name and signature are required.');
  }
  if (signatureData.length > MAX_SIGNATURE_LENGTH) throw new Error('Signature image is too large.');
  return {
    deliveryId,
    recipientName,
    signatureData,
    notes,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
}

// Applies proof of delivery inside the caller's transaction (the caller BEGINs/COMMITs/ROLLBACKs).
// `actor` is the session: { sub, role }.
export async function completeProofOfDelivery(client, actor, input) {
  const q = await client.query(
    `SELECT dj.*, wo.order_id, wo.job_no, o.order_no, o.payment_method, o.payment_status
       FROM delivery_jobs dj
       JOIN warehouse_orders wo ON wo.id = dj.warehouse_order_id
       JOIN orders o ON o.id = wo.order_id
      WHERE dj.id = $1 FOR UPDATE OF dj`,
    [input.deliveryId]
  );
  if (!q.rowCount) throw new Error('Delivery job not found.');
  const d = q.rows[0];
  if (d.status === 'DELIVERED') throw new Error('This delivery is already completed.');
  if (actor.role === 'delivery_driver' && d.driver_id && Number(d.driver_id) !== Number(actor.sub)) {
    throw new Error('This delivery is assigned to another driver.');
  }
  if (requiresMpesaPayment(d)) throw new Error(PAYMENT_PENDING_MESSAGE);

  await client.query(
    `UPDATE delivery_jobs SET driver_id = COALESCE(driver_id, $1), status = 'DELIVERED', recipient_name = $2,
            signature_data = $3, gps_lat = $4, gps_lng = $5, delivery_notes = $6, signed_at = NOW(), delivered_at = NOW(), updated_at = NOW()
      WHERE id = $7`,
    [Number(actor.sub), input.recipientName, input.signatureData, input.lat, input.lng, input.notes, input.deliveryId]
  );
  await client.query(`UPDATE orders SET status = 'Delivered', updated_at = NOW() WHERE id = $1`, [d.order_id]);
  await client.query(`UPDATE warehouse_orders SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1`, [d.warehouse_order_id]);
  await client.query(
    `INSERT INTO warehouse_audit (employee_id, action, entity_type, entity_id, details) VALUES ($1, 'PROOF_OF_DELIVERY', 'delivery_job', $2, $3::jsonb)`,
    [Number(actor.sub), String(input.deliveryId), JSON.stringify({ jobNo: d.job_no, orderNo: d.order_no, recipientName: input.recipientName, lat: input.lat, lng: input.lng, actorRole: actor.role })]
  );
  return { ok: true, status: 'Delivered', orderNo: d.order_no };
}
