import {createHash} from 'node:crypto';
import {whole,required} from './receivables.mjs';
const managers=['admin','general_manager','finance'];
export const ledgerSchema=`
CREATE TABLE IF NOT EXISTS finance_bills(
 id BIGSERIAL PRIMARY KEY,kind TEXT NOT NULL CHECK(kind IN ('SUPPLIER','STATUTORY','SALARY')),
 payee TEXT NOT NULL,reference TEXT NOT NULL,description TEXT NOT NULL,
 amount_cents BIGINT NOT NULL CHECK(amount_cents>0),paid_cents BIGINT NOT NULL DEFAULT 0 CHECK(paid_cents>=0 AND paid_cents<=amount_cents),
 due_on DATE NOT NULL,period TEXT NOT NULL,source_key TEXT UNIQUE,
 status TEXT NOT NULL DEFAULT 'PENDING_MANAGER' CHECK(status IN ('PENDING_MANAGER','PENDING_ADMIN','APPROVED','REJECTED')),
 created_by INTEGER NOT NULL REFERENCES customers(id),reviewed_by INTEGER REFERENCES customers(id),approved_by INTEGER REFERENCES customers(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),UNIQUE(kind,payee,reference),
 CHECK(status NOT IN ('PENDING_ADMIN','APPROVED') OR reviewed_by IS NOT NULL),
 CHECK(status<>'APPROVED' OR (approved_by IS NOT NULL AND reviewed_by<>approved_by)));
CREATE TABLE IF NOT EXISTS finance_settlements(
 id BIGSERIAL PRIMARY KEY,bill_id BIGINT NOT NULL REFERENCES finance_bills(id),amount_cents BIGINT NOT NULL CHECK(amount_cents>0),
 method TEXT NOT NULL,reference TEXT UNIQUE NOT NULL,paid_on DATE NOT NULL,recorded_by INTEGER NOT NULL REFERENCES customers(id),created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS finance_events(id BIGSERIAL PRIMARY KEY,actor_id INTEGER NOT NULL REFERENCES customers(id),action TEXT NOT NULL,entity_id BIGINT,note TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS finance_targets(employee_id INTEGER NOT NULL REFERENCES customers(id),period TEXT NOT NULL,target_cents BIGINT NOT NULL CHECK(target_cents>0),set_by INTEGER NOT NULL REFERENCES customers(id),PRIMARY KEY(employee_id,period));
CREATE TABLE IF NOT EXISTS finance_requests(request_key UUID PRIMARY KEY,actor_id INTEGER NOT NULL,request_hash TEXT NOT NULL,result JSONB NOT NULL);
CREATE INDEX IF NOT EXISTS finance_due ON finance_bills(status,due_on);
`;
export function cents(v){if(!/^\d+(\.\d{1,2})?$/.test(String(v)))throw Error('Enter a positive amount with at most two decimal places.');const n=Math.round(Number(v)*100);if(!Number.isSafeInteger(n)||n<=0||n>214748364700)throw Error('Amount outside supported range.');return n;}
function month(v){if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(String(v)))throw Error('Select a valid month.');return v;}
function date(v){if(!/^20\d{2}-\d{2}-\d{2}$/.test(String(v))||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Select a valid date.');return v;}
export async function ledgerReady(c){return Boolean((await c.query("SELECT to_regclass('public.finance_requests') AS t")).rows[0].t);}
async function event(c,s,action,id,note){await c.query('INSERT INTO finance_events(actor_id,action,entity_id,note) VALUES($1,$2,$3,$4)',[s.id,action,id,note]);}
export async function executeLedger(c,s,b){
 if(!managers.includes(s.role))throw Error('Finance management access required.');
 if(b.action==='SETUP'){if(s.role!=='admin')throw Error('Administrator setup required.');await c.query('SELECT pg_advisory_xact_lock(290832)');for(const statement of ledgerSchema.split(';').filter(s=>s.trim()))await c.query(statement);return {ok:true};}
 if(!await ledgerReady(c))throw Error('Ask the administrator to initialise extended finance.');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(b.requestKey)))throw Error('Valid request key required.');
 const hash=createHash('sha256').update(JSON.stringify(b)).digest('hex');await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[b.requestKey]);
 const old=(await c.query('SELECT * FROM finance_requests WHERE request_key=$1',[b.requestKey])).rows[0];if(old){if(String(old.actor_id)!==String(s.id)||old.request_hash!==hash)throw Error('Request key already used.');return old.result;}
 let result={ok:true,paymentSent:false};
 if(b.action==='BILL'){
  if(!['admin','finance'].includes(s.role))throw Error('Only finance or administrator can prepare liabilities.');
  if(!['SUPPLIER','STATUTORY'].includes(b.kind))throw Error('Select supplier or statutory liability. Salary amounts must come from approved payroll.');
  const values=[b.kind,required(b.payee,'Payee',160),required(b.reference,'Supplier invoice or assessment reference',120).toUpperCase(),required(b.description,'Supporting details',1000),cents(b.amount),date(b.dueOn),month(b.period),s.id];
  const r=await c.query('INSERT INTO finance_bills(kind,payee,reference,description,amount_cents,due_on,period,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',values);result.id=r.rows[0].id;await event(c,s,'BILL',result.id,JSON.stringify(values.slice(0,7)));
 }else if(b.action==='SALARY'){
  if(!['admin','finance'].includes(s.role))throw Error('Finance access required.');
  const p=(await c.query("SELECT * FROM payroll_entries WHERE id=$1 AND status='APPROVED' FOR SHARE",[whole(b.payrollId,'Payroll')])).rows[0];if(!p)throw Error('Approved payroll required.');
  const due=date(b.dueOn);const r=await c.query("INSERT INTO finance_bills(kind,payee,reference,description,amount_cents,due_on,period,source_key,status,created_by,reviewed_by,approved_by) VALUES('SALARY',$1,$2,$3,$4,$5,$6,$7,'APPROVED',$8,$9,$10) RETURNING id",[p.employee_name,'PAYROLL-'+p.id,'Approved net salary. Payroll record '+p.id,cents(p.amounts.net),due,p.period,'PAYROLL:'+p.id,s.id,p.reviewed_by,p.approved_by]);result.id=r.rows[0].id;await event(c,s,'SALARY_IMPORTED',result.id,'Amount and approvals copied from payroll '+p.id+'; no transfer sent.');
 }else if(b.action==='TARGET'){
  if(s.role!=='admin')throw Error('Only administrator can set sales targets.');const id=whole(b.employeeId,'Salesperson');
  const employee=await c.query("SELECT id FROM customers WHERE id=$1 AND role='cashier'",[id]);if(!employee.rowCount)throw Error('Choose a sales employee.');
  const period=month(b.period),amount=cents(b.amount),note=required(b.note,'Target reason',1000);
  const prev=(await c.query('SELECT target_cents FROM finance_targets WHERE employee_id=$1 AND period=$2',[id,period])).rows[0];
  await c.query('INSERT INTO finance_targets(employee_id,period,target_cents,set_by) VALUES($1,$2,$3,$4) ON CONFLICT(employee_id,period) DO UPDATE SET target_cents=EXCLUDED.target_cents,set_by=EXCLUDED.set_by',[id,period,amount,s.id]);await event(c,s,'TARGET',id,JSON.stringify({period,amount,previous:prev?.target_cents,note}));
 }else if(['REVIEW','APPROVE','REJECT','SETTLE'].includes(b.action)){
  const bill=(await c.query('SELECT * FROM finance_bills WHERE id=$1 FOR UPDATE',[whole(b.id,'Liability')])).rows[0];if(!bill)throw Error('Liability not found.');
  if(b.action==='SETTLE'){
   if(!['admin','finance'].includes(s.role))throw Error('Only finance or administrator can record a settlement.');if(bill.status!=='APPROVED')throw Error('An approved liability is required.');
   const amount=cents(b.amount);if(amount>Number(bill.amount_cents)-Number(bill.paid_cents))throw Error('Payment exceeds unpaid balance.');
   if(b.confirmPaid!==true)throw Error('Confirm funds were paid externally.');if(!['Bank','M-Pesa','Cash','Card'].includes(b.method))throw Error('Select payment method.');
   const paid=date(b.paidOn),ref=required(b.reference,'Payment receipt reference',120).toUpperCase();
   const check=await c.query("SELECT $1::date>(NOW() AT TIME ZONE 'Africa/Nairobi')::date AS future",[paid]);if(check.rows[0].future)throw Error('Cannot record future payments.');
   await c.query('INSERT INTO finance_settlements(bill_id,amount_cents,method,reference,paid_on,recorded_by) VALUES($1,$2,$3,$4,$5,$6)',[bill.id,amount,b.method,ref,paid,s.id]);await c.query('UPDATE finance_bills SET paid_cents=paid_cents+$1 WHERE id=$2',[amount,bill.id]);await event(c,s,'SETTLE',bill.id,JSON.stringify({amount,method:b.method,reference:ref,paidOn:paid}));
  }else{
   const note=required(b.note,'Decision reason',1000);let status;
   if(b.action==='REVIEW'&&s.role==='general_manager'&&bill.status==='PENDING_MANAGER'&&String(bill.created_by)!==String(s.id))status='PENDING_ADMIN';
   if(b.action==='APPROVE'&&s.role==='admin'&&bill.status==='PENDING_ADMIN'&&String(bill.reviewed_by)!==String(s.id))status='APPROVED';
   if(b.action==='REJECT'&&((s.role==='general_manager'&&bill.status==='PENDING_MANAGER'&&String(bill.created_by)!==String(s.id))||(s.role==='admin'&&bill.status==='PENDING_ADMIN')))status='REJECTED';
   if(!status)throw Error('This decision is not allowed for your role or the current status.');
   await c.query("UPDATE finance_bills SET status=$2,reviewed_by=CASE WHEN $3='REVIEW' THEN $4 ELSE reviewed_by END,approved_by=CASE WHEN $3='APPROVE' THEN $4 ELSE approved_by END WHERE id=$1",[bill.id,status,b.action,s.id]);await event(c,s,b.action,bill.id,note);
  }
 }else throw Error('Unsupported finance action.');
 await c.query('INSERT INTO finance_requests VALUES($1,$2,$3,$4::jsonb)',[b.requestKey,s.id,hash,JSON.stringify(result)]);return result;
}
export async function readLedger(c,s,period){
 if(![...managers,'cashier'].includes(s.role))throw Error('Finance access required.');
 if(!await ledgerReady(c))return {ready:false};
 period=month(period);const all=s.role!=='cashier',params=[s.id,all,period];
 const employees=(await c.query("SELECT id,name FROM customers WHERE role='cashier' AND (id=$1 OR $2) ORDER BY name",params.slice(0,2))).rows;
 const targets=(await c.query('SELECT * FROM finance_targets WHERE (employee_id=$1 OR $2) AND period=$3',params)).rows;
 const arExists=Boolean((await c.query("SELECT to_regclass('public.ar_documents') AS t")).rows[0].t);
 const commercial=arExists?(await c.query("SELECT salesperson_id,COUNT(*) FILTER(WHERE kind='QUOTE') AS quotations,COUNT(*) FILTER(WHERE kind='QUOTE' AND EXISTS(SELECT 1 FROM ar_documents i WHERE i.quote_id=ar_documents.id AND i.status='OPEN')) AS converted,COALESCE(SUM(total_kes) FILTER(WHERE kind='INVOICE'),0) AS invoiced,COALESCE(SUM(paid_kes) FILTER(WHERE kind='INVOICE'),0) AS collected FROM ar_documents WHERE status='OPEN' AND (salesperson_id=$1 OR $2) AND to_char(issued_on,'YYYY-MM')=$3 GROUP BY salesperson_id",params)).rows:[];
 const posExists=Boolean((await c.query("SELECT to_regclass('public.counter_sales') AS t")).rows[0].t);
 const pos=posExists?(await c.query("SELECT cashier_id,COUNT(*) AS sales,COALESCE(SUM(total_kes),0) AS amount FROM counter_sales WHERE (cashier_id=$1 OR $2) AND to_char(created_at AT TIME ZONE 'Africa/Nairobi','YYYY-MM')=$3 GROUP BY cashier_id",params)).rows:[];
 const refundsExist=Boolean((await c.query("SELECT to_regclass('public.approved_refunds') AS t")).rows[0].t);
 const refunds=posExists&&refundsExist?(await c.query("SELECT s.cashier_id,COALESCE(SUM(f.amount_kes),0) AS amount FROM approved_refunds f JOIN counter_sales s ON s.id=f.sale_id WHERE (s.cashier_id=$1 OR $2) AND to_char(f.created_at AT TIME ZONE 'Africa/Nairobi','YYYY-MM')=$3 GROUP BY s.cashier_id",params)).rows:[];
 let pnl={period,revenueCents:0,cogsCents:0,grossProfitCents:0,operatingExpensesCents:0,netOperatingCents:0,posRevenueCents:0,invoiceRevenueCents:0};
 if(posExists){const q=await c.query("SELECT COALESCE(SUM(total_kes),0)::bigint AS revenue FROM counter_sales WHERE to_char(created_at AT TIME ZONE 'Africa/Nairobi','YYYY-MM')=$1",[period]);pnl.posRevenueCents=Number(q.rows[0].revenue)*100;const ct=await c.query("SELECT COALESCE(SUM(a.quantity*a.unit_cost_kes),0)::bigint AS cogs FROM counter_sale_allocations a JOIN counter_sale_items i ON i.id=a.sale_item_id JOIN counter_sales s ON s.id=i.sale_id WHERE to_char(s.created_at AT TIME ZONE 'Africa/Nairobi','YYYY-MM')=$1",[period]);pnl.cogsCents=Number(ct.rows[0].cogs)*100;}
 if(arExists){const q=await c.query("SELECT COALESCE(SUM(total_kes),0)::bigint AS revenue FROM ar_documents WHERE kind='INVOICE' AND status='OPEN' AND to_char(issued_on,'YYYY-MM')=$1",[period]);pnl.invoiceRevenueCents=Number(q.rows[0].revenue)*100;}
 if(await ledgerReady(c)){const q=await c.query("SELECT COALESCE(SUM(amount_cents),0)::bigint AS expenses FROM finance_bills WHERE status='APPROVED' AND period=$1",[period]);pnl.operatingExpensesCents=Number(q.rows[0].expenses);}
 pnl.revenueCents=pnl.posRevenueCents+pnl.invoiceRevenueCents;pnl.grossProfitCents=pnl.revenueCents-pnl.cogsCents;pnl.netOperatingCents=pnl.grossProfitCents-pnl.operatingExpensesCents;
 const forecast=all?[1,2,3].map(n=>{const d=new Date(period+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+n);const month=d.toISOString().slice(0,7);return {month,revenueCents:pnl.revenueCents,expensesCents:pnl.operatingExpensesCents,netCents:pnl.netOperatingCents};}):[];
 const summary={ready:true,period,employees,targets,commercial,pos,refunds,posAvailable:posExists,refundsAvailable:refundsExist,pnl,forecast};if(!all)return summary;
 const bills=(await c.query('SELECT *,amount_cents-paid_cents AS balance_cents FROM finance_bills ORDER BY id DESC LIMIT 500')).rows;
 const totals=(await c.query("SELECT kind,SUM(amount_cents) AS total_cents,SUM(paid_cents) AS paid_cents,SUM(amount_cents-paid_cents) AS outstanding_cents,COALESCE(SUM(amount_cents-paid_cents) FILTER(WHERE due_on<(NOW() AT TIME ZONE 'Africa/Nairobi')::date),0) AS overdue_cents FROM finance_bills WHERE status='APPROVED' GROUP BY kind")).rows;
 const settlements=(await c.query('SELECT s.*,b.kind,b.payee FROM finance_settlements s JOIN finance_bills b ON b.id=s.bill_id ORDER BY s.id DESC LIMIT 500')).rows;
 const monthly=(await c.query("SELECT to_char(paid_on,'YYYY-MM') AS month,SUM(amount_cents) AS amount_cents FROM finance_settlements WHERE paid_on>=date_trunc('month',(NOW() AT TIME ZONE 'Africa/Nairobi'))::date-interval '5 months' GROUP BY 1 ORDER BY 1")).rows;
 const events=(await c.query('SELECT e.*,u.name AS actor_name FROM finance_events e JOIN customers u ON u.id=e.actor_id ORDER BY e.id DESC LIMIT 200')).rows;
 const payrollExists=Boolean((await c.query("SELECT to_regclass('public.payroll_entries') AS t")).rows[0].t);
 const payroll=payrollExists?(await c.query("SELECT p.id,p.employee_name,p.period,p.amounts->>'net' AS net FROM payroll_entries p WHERE p.status='APPROVED' AND NOT EXISTS(SELECT 1 FROM finance_bills b WHERE b.source_key='PAYROLL:'||p.id::text) ORDER BY p.id DESC LIMIT 500")).rows:[];
 return {...summary,bills,totals,settlements,monthly,events,payroll};
}

