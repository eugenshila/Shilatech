import { useRef, useState } from 'react';

// One fulfilment card per online order: pick (barcode/FIFO) → pack → dispatch → deliver.
// Payment and proof-of-delivery rules are enforced by the server (lib/delivery-complete.js);
// the disabled states here only mirror them so staff see the reason before submitting.

const paid = o => String(o?.payment_status || '').toLowerCase() === 'paid';
const needsMpesa = o => String(o?.payment_method || '').toLowerCase() === 'm-pesa' && !paid(o);
const STEPS = [
  ['Picking', ['PICKING', 'PICKED', 'PACKING', 'READY_DISPATCH', 'OUT_FOR_DELIVERY']],
  ['Picked', ['PICKED', 'PACKING', 'READY_DISPATCH', 'OUT_FOR_DELIVERY']],
  ['Packing', ['PACKING', 'READY_DISPATCH', 'OUT_FOR_DELIVERY']],
  ['Ready for dispatch', ['READY_DISPATCH', 'OUT_FOR_DELIVERY']],
  ['Out for delivery', ['OUT_FOR_DELIVERY']],
];

export default function FulfilmentQueue({ orders, activeBrand, busy, scan, setScan, onProcess, onPromptPayment, onRefresh, onDeliver }) {
  if (!orders.length) return <div className="emptyWarehouseOrders">No online orders waiting for warehouse processing.</div>;
  return (
    <div className="warehouseOrderGrid">
      {orders.map(o => <OrderCard key={o.id} o={o} activeBrand={activeBrand} busy={busy} scan={scan} setScan={setScan}
        onProcess={onProcess} onPromptPayment={onPromptPayment} onRefresh={onRefresh} onDeliver={onDeliver} />)}
    </div>
  );
}

function OrderCard({ o, activeBrand, busy, scan, setScan, onProcess, onPromptPayment, onRefresh, onDeliver }) {
  const canDeliver = o.status === 'OUT_FOR_DELIVERY' && o.delivery_id;
  const showPayment = ['READY_DISPATCH', 'OUT_FOR_DELIVERY'].includes(o.status) && o.delivery_id;
  return (
    <div className="warehouseOrderCard">
      <div className="warehouseOrderTop"><div><b>{o.job_no}</b><span>Order {o.order_no}</span></div><strong>{o.status}</strong></div>
      <div className="warehouseCustomer">
        <b>{o.customer_name}</b>
        <span>{o.phone} · {o.delivery_zone}</span>
        {o.delivery_address && <span>{o.delivery_address}</span>}
        <span>{o.payment_method} · {o.payment_status}</span>
      </div>
      <div className="warehouseOrderItems">
        {(o.items || []).filter(i => !activeBrand || i.brand === activeBrand).map(i => (
          <div key={i.id} className="warehousePickRow">
            <div><b>{i.brand} · {i.partNo}</b><span>{i.name}</span><small>{i.storageArea || 'Storage area pending'}</small></div>
            <div className="warehousePickControl">
              <strong>{i.pickedQty}/{i.quantity}</strong>
              {o.status === 'PICKING' && i.status !== 'PICKED' && <>
                <input aria-label={`Scan barcode for ${i.partNo}`} placeholder="Scan barcode / part no." value={scan[i.id] || ''}
                  onChange={e => setScan({ ...scan, [i.id]: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onProcess(o.id, 'PICK_ITEM', i.id); } }} />
                <button disabled={busy || !(scan[i.id] || '').trim()} onClick={() => onProcess(o.id, 'PICK_ITEM', i.id)}>Scan & pick</button>
              </>}
            </div>
          </div>
        ))}
      </div>
      <div className="warehouseFlow">
        {STEPS.map(([label, done]) => <span key={label} className={done.includes(o.status) ? 'done' : ''}>{label}</span>)}
      </div>
      <div className="warehouseOrderActions">
        {o.status === 'NEW' && <button disabled={busy} onClick={() => onProcess(o.id, 'START_PICKING')}>Start picking</button>}
        {o.status === 'PICKED' && <button disabled={busy} onClick={() => onProcess(o.id, 'START_PACKING')}>Start packing</button>}
        {o.status === 'PACKING' && <button disabled={busy} onClick={() => onProcess(o.id, 'READY_DISPATCH')}>Ready for dispatch</button>}
        {o.status === 'READY_DISPATCH' && <button disabled={busy} onClick={() => onProcess(o.id, 'DISPATCH')}>Mark dispatched</button>}
      </div>

      {showPayment && needsMpesa(o) && (
        <div className="deliveryPayment isPending">
          <div><b>Payment: PENDING</b><span>{o.payment_method} · KSh {Number(o.total_kes || 0).toLocaleString()}</span></div>
          <div className="deliveryPaymentActions">
            <button disabled={busy} onClick={() => onPromptPayment(o)}>Prompt customer to pay</button>
            <button disabled={busy} onClick={onRefresh}>Refresh payment status</button>
          </div>
        </div>
      )}
      {showPayment && !needsMpesa(o) && (
        <div className="deliveryPayment isPaid"><div><b>Payment: {paid(o) ? 'PAID' : 'Handled outside M-Pesa'}</b><span>{o.payment_method} · KSh {Number(o.total_kes || 0).toLocaleString()}</span></div></div>
      )}

      {canDeliver && <ProofForm o={o} busy={busy} onDeliver={onDeliver} />}
    </div>
  );
}

function ProofForm({ o, busy, onDeliver }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const signed = useRef(false);
  const [recipientName, setRecipientName] = useState(o.customer_name || '');
  const [notes, setNotes] = useState('');
  const [localError, setLocalError] = useState('');
  const blocked = needsMpesa(o);

  function point(e) {
    const c = canvasRef.current; const rect = c.getBoundingClientRect(); const p = e.touches?.[0] || e;
    return { x: (p.clientX - rect.left) * (c.width / rect.width), y: (p.clientY - rect.top) * (c.height / rect.height) };
  }
  function start(e) { e.preventDefault(); const c = canvasRef.current; if (!c) return; drawing.current = true; const p = point(e); const ctx = c.getContext('2d'); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
  function move(e) { if (!drawing.current) return; e.preventDefault(); const c = canvasRef.current; const p = point(e); const ctx = c.getContext('2d'); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#111'; ctx.lineTo(p.x, p.y); ctx.stroke(); signed.current = true; }
  function end() { drawing.current = false; }
  function clear() { const c = canvasRef.current; if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height); signed.current = false; }
  function location() {
    return new Promise(resolve => {
      if (!navigator.geolocation) return resolve({ lat: null, lng: null });
      navigator.geolocation.getCurrentPosition(p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }), () => resolve({ lat: null, lng: null }), { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 });
    });
  }
  async function submit(e) {
    e.preventDefault(); setLocalError('');
    if (blocked) return setLocalError('Payment is still pending. Prompt the customer for M-Pesa payment first.');
    if (!signed.current) return setLocalError('Customer signature is required.');
    const loc = await location();
    const signatureData = canvasRef.current.toDataURL('image/png');
    onDeliver({ deliveryId: o.delivery_id, recipientName, notes, signatureData, ...loc }, clear);
  }

  return (
    <form className="proofPanel" onSubmit={submit}>
      <h3>Proof of delivery</h3>
      {localError && <div className="warehouseAlert">{localError}</div>}
      <label>Recipient name<input required value={recipientName} onChange={e => setRecipientName(e.target.value)} /></label>
      <label>Customer signature<div className="signatureBox"><canvas ref={canvasRef} width="700" height="240"
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end} /></div></label>
      <div className="signatureTools"><small>Sign inside the white box</small><button type="button" onClick={clear}>Clear signature</button></div>
      <label>Delivery notes<textarea rows="2" placeholder="Optional notes" value={notes} onChange={e => setNotes(e.target.value)} /></label>
      <button disabled={busy || blocked} className="proofSubmit">{blocked ? 'Payment required before delivery' : busy ? 'Saving proof…' : 'Customer signed — mark Delivered'}</button>
    </form>
  );
}
