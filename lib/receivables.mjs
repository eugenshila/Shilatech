import {randomUUID,createHash} from 'node:crypto';
export const financeRoles=['admin','general_manager','finance','cashier'];
export const canSell=s=>['admin','cashier'].includes(s.role);
export const canCollect=s=>['admin','finance'].includes(s.role);
export const seesAll=s=>s.role!=='cashier';
export function whole(value,label,{zero=false}={}){const n=Number(value);if(value===''||value==null||!Number.isSafeInteger(n)||n<(zero?0:1)||n>2147483647)throw Error(label+' must be a valid whole KSh amount or quantity.');return n;}
export function required(value,label,max=160){const s=String(value||'').trim();if(!s||s.length>max)throw Error(label+' is required (maximum '+max+' characters).');return s;}
export const schema=[
 `CREATE TABLE IF NOT EXISTS ar_clients(id BIGSERIAL PRIMARY KEY,name TEXT NOT NULL,contact TEXT NOT NULL,created_by INTEGER NOT NULL REFERENCES customers(id),credit_limit_kes BIGINT NOT NULL DEFAULT 0 CHECK(credit_limit_kes>=0),credit_approved_by INTEGER REFERENCES customers(id),credit_note TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
 `CREATE TABLE IF NOT EXISTS ar_documents(id BIGSERIAL PRIMARY KEY,number TEXT UNIQUE NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('QUOTE','INVOICE')),client_id BIGINT NOT NULL REFERENCES ar_clients(id),client_name TEXT NOT NULL,client_contact TEXT NOT NULL,salesperson_id INTEGER NOT NULL REFERENCES customers(id),lines JSONB NOT NULL,total_kes BIGINT NOT NULL CHECK(total_kes>0),paid_kes BIGINT NOT NULL DEFAULT 0 CHECK(paid_kes>=0 AND paid_kes<=total_kes),terms_days INTEGER NOT NULL DEFAULT 0 CHECK(terms_days IN (0,30)),issued_on DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'Africa/Nairobi')::date,due_on DATE NOT NULL,status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','VOID')),quote_id BIGINT UNIQUE REFERENCES ar_documents(id),created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
 `CREATE TABLE IF NOT EXISTS ar_payments(id BIGSERIAL PRIMARY KEY,invoice_id BIGINT NOT NULL REFERENCES ar_documents(id),amount_kes BIGINT NOT NULL CHECK(amount_kes>0),method TEXT NOT NULL,reference TEXT NOT NULL UNIQUE,received_on DATE NOT NULL,recorded_by INTEGER NOT NULL REFERENCES customers(id),created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
 `CREATE TABLE IF NOT EXISTS ar_events(id BIGSERIAL PRIMARY KEY,actor_id INTEGER NOT NULL REFERENCES customers(id),action TEXT NOT NULL,entity_id BIGINT,note TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
 `CREATE TABLE IF NOT EXISTS ar_requests(request_key UUID PRIMARY KEY,actor_id INTEGER NOT NULL,request_hash TEXT NOT NULL,result JSONB NOT NULL)`,
 `CREATE INDEX IF NOT EXISTS ar_documents_owner ON ar_documents(salesperson_id,issued_on)`,
 `CREATE INDEX IF NOT EXISTS ar_documents_client ON ar_documents(client_id,kind,status)`
];
export async function ready(c){return Boolean((await c.query("SELECT to_regclass('public.ar_requests') AS t")).rows[0].t);}
export async function setup(c,s){if(s.role!=='admin')throw Error('Administrator setup required.');await c.query('SELECT pg_advisory_xact_lock(290831)');for(const q of schema)await c.query(q);}
export async function audit(c,s,action,id,note){await c.query('INSERT INTO ar_events(actor_id,action,entity_id,note) VALUES($1,$2,$3,$4)',[s.id,action,id,note]);}
export async function clientFor(c,s,id){const r=await c.query('SELECT * FROM ar_clients WHERE id=$1 FOR UPDATE',[whole(id,'Customer')]);const a=r.rows[0];if(!a||(!seesAll(s)&&String(a.created_by)!==String(s.id)))throw Error('Customer not available to this account.');return a;}
export async function documentFor(c,s,id){const r=await c.query('SELECT * FROM ar_documents WHERE id=$1 FOR UPDATE',[whole(id,'Document')]);const d=r.rows[0];if(!d||(!seesAll(s)&&String(d.salesperson_id)!==String(s.id)))throw Error('Document not available to this account.');return d;}
export async function pricedLines(c,items){
 if(!Array.isArray(items)||!items.length||items.length>50)throw Error('Add between 1 and 50 parts.');
 const ids=new Set();const lines=[];let total=0;
 for(const i of items){const id=whole(i.id,'Part'),qty=whole(i.quantity,'Quantity');if(qty>10000||ids.has(id))throw Error('Use one line per part, maximum 10,000 units.');ids.add(id);
  const r=await c.query('SELECT id,name,part_no,price_kes FROM products WHERE id=$1 AND active=TRUE',[id]);const p=r.rows[0];if(!p)throw Error('Part is no longer available.');const price=whole(p.price_kes,'Catalogue price');
  total+=price*qty;if(!Number.isSafeInteger(total)||total>2147483647)throw Error('Document total is too large.');lines.push({id:Number(p.id),name:p.name,partNo:p.part_no,quantity:qty,priceKes:price,totalKes:price*qty});
 }return {lines,total};
}
export async function execute(c,s,b){
 if(!financeRoles.includes(s.role))throw Error('Sales or finance access required.');
 if(b.action==='SETUP'){await setup(c,s);return {ok:true};}
 if(!await ready(c))throw Error('Ask the administrator to initialise sales and finance records.');
 const key=String(b.requestKey||'');if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key))throw Error('A valid request key is required.');
 const hash=createHash('sha256').update(JSON.stringify(b)).digest('hex');await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[key]);
 const old=await c.query('SELECT * FROM ar_requests WHERE request_key=$1',[key]);if(old.rowCount){if(String(old.rows[0].actor_id)!==String(s.id)||old.rows[0].request_hash!==hash)throw Error('Request key already used for different details.');return old.rows[0].result;}
 let result={ok:true};
 if(b.action==='CLIENT'){
  if(!canSell(s)&&!canCollect(s))throw Error('This role cannot create customers.');
  const name=required(b.name,'Customer name'),contact=required(b.contact,'Contact details',300);
  const r=await c.query('INSERT INTO ar_clients(name,contact,created_by) VALUES($1,$2,$3) RETURNING id',[name,contact,s.id]);result.id=r.rows[0].id;await audit(c,s,'CLIENT_CREATED',result.id,'Customer created with payment-on-issue terms; no credit approved.');
 }else if(b.action==='CREDIT'){
  if(s.role!=='admin')throw Error('Only the administrator can approve or change a credit limit.');const a=await clientFor(c,s,b.clientId);const limit=whole(b.limitKes,'Credit limit',{zero:true});const note=required(b.note,'Approval reason',1000);
  await c.query('UPDATE ar_clients SET credit_limit_kes=$1,credit_approved_by=$2,credit_note=$3 WHERE id=$4',[limit,s.id,note,a.id]);await audit(c,s,'CREDIT_APPROVED',a.id,JSON.stringify({previous:Number(a.credit_limit_kes),limit,note}));
 }else if(b.action==='QUOTE'){
  if(!canSell(s))throw Error('Only sales staff or the administrator can issue quotations.');const a=await clientFor(c,s,b.clientId);const {lines,total}=await pricedLines(c,b.items);
  if(total!==whole(b.expectedTotalKes,'Displayed total'))throw Error('Catalogue prices changed. Refresh and rebuild the quotation.');
  const r=await c.query("INSERT INTO ar_documents(number,kind,client_id,client_name,client_contact,salesperson_id,lines,total_kes,due_on) VALUES($1,'QUOTE',$2,$3,$4,$5,$6::jsonb,$7,(NOW() AT TIME ZONE 'Africa/Nairobi')::date+14) RETURNING id",['QT-'+randomUUID().toUpperCase(),a.id,a.name,a.contact,s.id,JSON.stringify(lines),total]);result.id=r.rows[0].id;await audit(c,s,'QUOTE_CREATED',result.id,'Catalogue prices; valid for 14 days; stock not reserved.');
 }else if(b.action==='INVOICE'){
  if(!canSell(s))throw Error('Only sales staff or the administrator can issue invoices.');
  // Consistent lock order: client, then document. Credit exposure is serialised per customer.
  const lookup=await c.query("SELECT client_id FROM ar_documents WHERE id=$1 AND kind='QUOTE'",[whole(b.quoteId,'Quotation')]);if(!lookup.rowCount)throw Error('Quotation not found.');const a=await clientFor(c,s,lookup.rows[0].client_id);const q=await documentFor(c,s,b.quoteId);
  const existing=await c.query('SELECT id FROM ar_documents WHERE quote_id=$1',[q.id]);if(existing.rowCount)throw Error('An invoice already exists for this quotation.');
  const date=(await c.query("SELECT (NOW() AT TIME ZONE 'Africa/Nairobi')::date AS today, $1::date < (NOW() AT TIME ZONE 'Africa/Nairobi')::date AS expired",[q.due_on])).rows[0];if(q.status!=='OPEN'||date.expired)throw Error('Quotation is void or expired. Create a new quotation.');
  const terms=Number(b.termsDays);if(![0,30].includes(terms))throw Error('Choose payment on issue or 30 days.');
  const current=await pricedLines(c,q.lines.map(i=>({id:i.id,quantity:i.quantity})));if(current.lines.some((line,index)=>['id','quantity','priceKes','name','partNo'].some(k=>line[k]!==q.lines[index][k])))throw Error('Catalogue details changed. Create a new quotation at current prices.');
  if(terms===30){
   if(!a.credit_approved_by||Number(a.credit_limit_kes)<1)throw Error('Administrator-approved credit limit required.');
   const balances=await c.query("SELECT COALESCE(SUM(total_kes-paid_kes),0) AS exposure,COUNT(*) FILTER(WHERE due_on<(NOW() AT TIME ZONE 'Africa/Nairobi')::date AND paid_kes<total_kes) AS overdue FROM ar_documents WHERE client_id=$1 AND kind='INVOICE' AND status='OPEN'",[a.id]);
   if(Number(balances.rows[0].overdue)>0)throw Error('Customer has overdue invoices. Clear them before issuing more credit.');
   if(Number(balances.rows[0].exposure)+Number(q.total_kes)>Number(a.credit_limit_kes))throw Error('Invoice would exceed the approved customer credit limit.');
  }
  const r=await c.query("INSERT INTO ar_documents(number,kind,client_id,client_name,client_contact,salesperson_id,lines,total_kes,terms_days,due_on,quote_id) VALUES($1,'INVOICE',$2,$3,$4,$5,$6::jsonb,$7,$8,(NOW() AT TIME ZONE 'Africa/Nairobi')::date+$8::integer,$9) RETURNING id",['INV-'+randomUUID().toUpperCase(),q.client_id,q.client_name,q.client_contact,q.salesperson_id,JSON.stringify(q.lines),q.total_kes,terms,q.id]);result.id=r.rows[0].id;await audit(c,s,'INVOICE_CREATED',result.id,JSON.stringify({quote:q.id,termsDays:terms,stockChanged:false}));
 }else if(b.action==='PAYMENT'){
  if(!canCollect(s))throw Error('Only finance or the administrator can record invoice payments.');
  const d=await documentFor(c,s,b.invoiceId);if(d.kind!=='INVOICE'||d.status!=='OPEN')throw Error('An open invoice is required.');const amount=whole(b.amountKes,'Payment');if(amount>Number(d.total_kes)-Number(d.paid_kes))throw Error('Payment exceeds the outstanding balance.');
  if(!['Cash','M-Pesa','Bank','Card'].includes(b.method))throw Error('Select a payment method.');const ref=required(b.reference,'Bank, M-Pesa, card reference or cash voucher',120).toUpperCase();
  const received=required(b.receivedOn,'Payment date',10);if(!/^\d{4}-\d{2}-\d{2}$/.test(received)||Number.isNaN(Date.parse(received))||new Date(received).toISOString().slice(0,10)!==received)throw Error('Valid payment date required.');
  const v=await c.query("SELECT $1::date > (NOW() AT TIME ZONE 'Africa/Nairobi')::date OR $1::date < $2::date AS invalid",[received,d.issued_on]);if(v.rows[0].invalid)throw Error('Payment date must be between invoice issue and today.');
  await c.query('INSERT INTO ar_payments(invoice_id,amount_kes,method,reference,received_on,recorded_by) VALUES($1,$2,$3,$4,$5,$6)',[d.id,amount,b.method,ref,received,s.id]);await c.query('UPDATE ar_documents SET paid_kes=paid_kes+$1 WHERE id=$2',[amount,d.id]);await audit(c,s,'PAYMENT_RECORDED',d.id,JSON.stringify({amount,method:b.method,reference:ref}));
 }else if(b.action==='VOID'){
  if(s.role!=='admin')throw Error('Only the administrator can void an unpaid document.');const d=await documentFor(c,s,b.id);if(d.status!=='OPEN'||Number(d.paid_kes)>0)throw Error('Only an open document with no payments can be voided.');const child=await c.query('SELECT id FROM ar_documents WHERE quote_id=$1',[d.id]);if(child.rowCount)throw Error('Cannot void a quotation that has an invoice.');const note=required(b.note,'Void reason',1000);await c.query("UPDATE ar_documents SET status='VOID' WHERE id=$1",[d.id]);await audit(c,s,'VOID',d.id,note);
 }else throw Error('Unsupported sales or finance action.');
 await c.query('INSERT INTO ar_requests(request_key,actor_id,request_hash,result) VALUES($1,$2,$3,$4::jsonb)',[key,s.id,hash,JSON.stringify(result)]);return result;
}
