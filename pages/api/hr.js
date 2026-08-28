import { getPool } from '../../lib/db';
import { readSession } from '../../lib/auth';

const MANAGERS = ['admin', 'general_manager'];
const SETUP = [
  'CREATE TABLE IF NOT EXISTS hr_leave_requests (id BIGSERIAL PRIMARY KEY, employee_id INTEGER NOT NULL REFERENCES customers(id), start_date DATE NOT NULL, end_date DATE NOT NULL, leave_type TEXT NOT NULL, reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT \'PENDING_MANAGER\', manager_id INTEGER, admin_id INTEGER, review_note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CHECK (end_date >= start_date))',
  'CREATE TABLE IF NOT EXISTS hr_events (id BIGSERIAL PRIMARY KEY, leave_id BIGINT REFERENCES hr_leave_requests(id), actor_id INTEGER NOT NULL, action TEXT NOT NULL, note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())'
];

export default async function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store');
  const session=await readSession(req);
  if(!session) return res.status(401).json({error:'Staff sign-in required.'});
  if(req.method==='POST' && req.body?.action==='SETUP') {
    if(session.role!=='admin') return res.status(403).json({error:'Administrator access required.'});
    const c=await getPool().connect(); try { await c.query('BEGIN'); for(const sql of SETUP) await c.query(sql); await c.query('COMMIT'); return res.json({ok:true}); } catch(e) { await c.query('ROLLBACK'); return res.status(400).json({error:'Could not initialise HR records.'}); } finally { c.release(); }
  }
  const c=await getPool().connect();
  try {
    if(req.method==='GET') {
      const leaves=await c.query('SELECT l.*,u.name AS employee_name FROM hr_leave_requests l JOIN customers u ON u.id=l.employee_id WHERE l.employee_id=$1 OR $2=ANY($3::text[]) ORDER BY l.created_at DESC LIMIT 100',[session.id,session.role,MANAGERS]);
      const hasPayroll=await c.query("SELECT to_regclass('public.payroll_entries') AS table_name");const payslips=hasPayroll.rows[0].table_name?await c.query("SELECT id,period,employee_name,status,amounts FROM payroll_entries WHERE employee_id=$1 AND status='APPROVED' ORDER BY period DESC LIMIT 50",[session.id]):{rows:[]};
      return res.json({role:session.role,leaves:leaves.rows,payslips:payslips.rows});
    }
    if(req.method!=='POST') return res.status(405).json({error:'Method not allowed.'});
    const b=req.body||{};
    if(b.action==='LEAVE') {
      const reason=String(b.reason||'').trim(); if(!b.startDate||!b.endDate||!reason||reason.length>1000) return res.status(400).json({error:'Leave dates and a reason are required.'});
      const q=await c.query('INSERT INTO hr_leave_requests(employee_id,start_date,end_date,leave_type,reason) VALUES($1,$2,$3,$4,$5) RETURNING id',[session.id,b.startDate,b.endDate,String(b.leaveType||'Annual').slice(0,40),reason]);
      return res.status(201).json({id:q.rows[0].id});
    }
    if(b.action==='DECIDE') {
      if(!MANAGERS.includes(session.role)) return res.status(403).json({error:'Manager review required.'});
      const decision=String(b.decision||'').toUpperCase(); if(!['APPROVE','REJECT'].includes(decision)) return res.status(400).json({error:'Valid decision required.'});
      const status=session.role==='general_manager'?(decision==='APPROVE'?'PENDING_ADMIN':'REJECTED'):(decision==='APPROVE'?'APPROVED':'REJECTED');
      await c.query('UPDATE hr_leave_requests SET status=$1,manager_id=CASE WHEN $2=\'general_manager\' THEN $3 ELSE manager_id END,admin_id=CASE WHEN $2=\'admin\' THEN $3 ELSE admin_id END,review_note=$4,updated_at=NOW() WHERE id=$5',[status,session.role,session.id,String(b.note||'').slice(0,1000),Number(b.id)]);
      return res.json({ok:true,status});
    }
    return res.status(400).json({error:'Unsupported HR action.'});
  } catch(e) { return res.status(400).json({error:e.message||'HR request failed.'}); } finally { c.release(); }
}

