import { randomUUID } from 'node:crypto';
import { readSession } from '../../lib/auth';
import { getPool,query } from '../../lib/db';
import { calculatePayroll,decidePayroll,payrollSchema } from '../../lib/payroll.mjs';

export default async function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  const user = await readSession(req);
  if (!user) return res.status(401).json({error:'Staff sign-in required.'});
  if (!['admin','general_manager'].includes(user.role)) return res.status(403).json({error:'Payroll access is restricted to the administrator and general manager.'});
  if (req.method === 'GET') {
    try {
      const ready = await query("SELECT to_regclass('public.payroll_entries') AS table_name");
      if (!ready.rows[0].table_name) return res.json({ready:false,role:user.role,entries:[],employees:[],events:[]});
      const [entries,employees,events] = await Promise.all([
        query('SELECT * FROM payroll_entries ORDER BY id DESC LIMIT 200'),
        query("SELECT id,name,role FROM customers WHERE role <> 'customer' ORDER BY name"),
        query('SELECT e.*,c.name AS actor_name FROM payroll_events e JOIN customers c ON c.id=e.actor_id ORDER BY e.id DESC LIMIT 500')
      ]);
      return res.json({ready:true,role:user.role,entries:entries.rows,employees:employees.rows,events:events.rows});
    } catch { return res.status(503).json({error:'Payroll is unavailable. Please retry or check database setup.'}); }
  }
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed.'});
  if (!String(req.headers['content-type']||'').startsWith('application/json')) return res.status(415).json({error:'JSON requests only.'});
  // Reject cross-site browser mutations without trusting a client-supplied role.
  if (req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({error:'Cross-site request denied.'});
  const b = req.body || {};
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    if (b.action === 'SETUP') {
      if (user.role !== 'admin') throw new Error('Only the administrator can initialise payroll.');
      await client.query("SELECT pg_advisory_xact_lock(7351042)");
      await client.query(payrollSchema);
    } else if (b.action === 'CREATE') {
      if (user.role !== 'admin') throw new Error('Only the administrator can prepare salary records.');
      if (b.confirmScope !== true) throw new Error('Confirm the supported payroll scope before submitting.');
      const amounts = calculatePayroll(b);
      const employee = await client.query("SELECT id,name FROM customers WHERE id=$1 AND role <> 'customer' FOR SHARE",[b.employeeId]);
      if (!employee.rowCount) throw new Error('Select an existing staff account.');
      const created = await client.query(`INSERT INTO payroll_entries(request_key,employee_id,employee_name,period,amounts,status,created_by) VALUES($1,$2,$3,$4,$5::jsonb,'PENDING_MANAGER',$6) RETURNING id`,[randomUUID(),employee.rows[0].id,employee.rows[0].name,b.period,JSON.stringify(amounts),user.sub]);
      await client.query("INSERT INTO payroll_events(entry_id,actor_id,action,note) VALUES($1,$2,'CREATE','Regular cash salary submitted for manager review; no payment sent.')",[created.rows[0].id,user.sub]);
    } else {
      await decidePayroll(client,user,b.id,b.action,b.note);
    }
    await client.query('COMMIT');
    return res.json({ok:true,paymentSent:false});
  } catch(e) {
    await client.query('ROLLBACK');
    return res.status(400).json({error:e.code==='23505'?'A non-rejected payroll record already exists for this employee and month.':e.code?'Unable to save payroll. Check setup and the selected employee.':e.message});
  } finally { client.release(); }
}
