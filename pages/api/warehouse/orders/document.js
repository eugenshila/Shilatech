import { query } from '../../../../lib/db';
import { requireWarehouseStaff } from '../../../../lib/warehouse-auth';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).send('Method not allowed');
  if(!requireWarehouseStaff(req,res)) return;
  const jobId=Number(req.query.jobId); const type=String(req.query.type||'pick').toLowerCase();
  if(!Number.isInteger(jobId)||!['pick','packing','dispatch'].includes(type)) return res.status(400).send('Invalid document request');
  try{
    const job=await query(`SELECT wo.job_no,wo.status,o.order_no,o.customer_name,o.phone,o.email,o.delivery_address,o.delivery_zone,o.payment_method,o.payment_status,o.total_kes,o.created_at FROM warehouse_orders wo JOIN orders o ON o.id=wo.order_id WHERE wo.id=$1`,[jobId]);
    if(!job.rowCount) return res.status(404).send('Order not found');
    const items=await query(`SELECT wi.brand,wi.part_no,wi.name,wi.quantity,wi.picked_qty,w.name AS storage_area FROM warehouse_order_items wi LEFT JOIN warehouses w ON w.id=wi.storage_area_id WHERE wi.warehouse_order_id=$1 ORDER BY wi.brand,wi.id`,[jobId]);
    const j=job.rows[0];
    const title=type==='pick'?'FIFO PICK LIST':type==='packing'?'PACKING SLIP':'DISPATCH NOTE';
    const rows=items.rows.map((i,n)=>`<tr><td>${n+1}</td><td>${esc(i.brand)}</td><td><b>${esc(i.part_no)}</b><br><small>${esc(i.name)}</small></td><td>${esc(i.storage_area||'—')}</td><td>${esc(i.quantity)}</td><td>${esc(i.picked_qty)}</td></tr>`).join('');
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><title>${title} ${esc(j.order_no)}</title><style>body{font-family:Arial,sans-serif;color:#111;margin:28px}header{border-bottom:3px solid #58b72a;padding-bottom:14px;margin-bottom:18px}.brand{font-size:24px;font-weight:900;color:#3f9120}.sub{font-size:11px;letter-spacing:2px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px 22px;margin:16px 0;font-size:13px}.box{border:1px solid #bbb;padding:12px;margin:14px 0}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}th,td{border:1px solid #bbb;padding:8px;text-align:left}th{background:#f1f1f1}.sign{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:55px}.line{border-top:1px solid #333;padding-top:6px;font-size:11px}@media print{button{display:none}body{margin:12mm}}</style></head><body><button onclick="window.print()">Print</button><header><div class="brand">SHILATECH AUTO SPARES</div><div class="sub">WAREHOUSE & 3PL OPERATIONS</div><h1>${title}</h1></header><div class="meta"><div><b>Order:</b> ${esc(j.order_no)}</div><div><b>Warehouse job:</b> ${esc(j.job_no)}</div><div><b>Customer:</b> ${esc(j.customer_name)}</div><div><b>Phone:</b> ${esc(j.phone)}</div><div><b>Delivery:</b> ${esc(j.delivery_zone)}</div><div><b>Status:</b> ${esc(j.status)}</div></div><div class="box"><b>Delivery address</b><br>${esc(j.delivery_address)}<br><br><b>Payment</b>: ${esc(j.payment_method)} · ${esc(j.payment_status)} · KSh ${Number(j.total_kes||0).toLocaleString()}</div><table><thead><tr><th>#</th><th>Brand</th><th>Part</th><th>Storage area</th><th>Qty</th><th>Picked</th></tr></thead><tbody>${rows}</tbody></table><div class="sign"><div class="line">Prepared / Picked by</div><div class="line">Checked / Authorized by</div></div></body></html>`);
  }catch(error){console.error(error);res.status(500).send('Could not generate document');}
}
