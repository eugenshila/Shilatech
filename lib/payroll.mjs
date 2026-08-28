// Monthly regular cash pay only. Keep historical calculations immutable.
export const RULE_VERSION = 'KE-2026-02-v1';
export function requirePayrollRole(role) {
  if (!['admin','general_manager'].includes(role)) throw new Error('Payroll access denied.');
}
function cents(value, name) {
  if (!/^\d+(\.\d{1,2})?$/.test(String(value))) throw new Error(`${name} must be a non-negative amount with up to two decimals.`);
  const n = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(n) || n > 1000000000) throw new Error(`${name} is too large.`);
  return n;
}
export function calculatePayroll(input) {
  if (!/^2026-(0[2-9]|1[0-2])$/.test(input.period || '')) throw new Error('This rule set supports February–December 2026 only. Review rates for other periods.');
  if (typeof input.resident !== 'boolean') throw new Error('Confirm tax residency.');
  if (!['BANK','MPESA'].includes(input.method)) throw new Error('Choose bank transfer or M-Pesa.');
  const basic = cents(input.basic, 'Basic pay');
  const allowances = cents(input.allowances ?? 0, 'Regular cash allowances');
  const gross = basic + allowances;
  if (gross <= 0 || gross > 1000000000) throw new Error('Gross pay must be positive and within the supported limit.');
  const nssf = Math.round(Math.min(gross,10800000) * 6 / 100);
  const shif = Math.max(30000,Math.round(gross * 275 / 10000));
  const housing = Math.round(gross * 15 / 1000);
  const taxable = Math.max(0,gross-nssf-shif-housing);
  let remaining = taxable, tax = 0;
  for (const [width, rate] of [[2400000,10],[833300,25],[46766700,30],[30000000,32.5],[Infinity,35]]) {
    const band = Math.min(remaining,width);
    tax += band * rate / 100; remaining -= band;
  }
  const relief = input.resident ? 240000 : 0;
  const paye = Math.max(0,Math.round(tax)-relief);
  const deductions = nssf+shif+housing+paye;
  if (deductions > gross) throw new Error('Deductions exceed gross pay; this payroll needs manual review.');
  const amounts = {basic,allowances,gross,nssf,shif,housing,taxable,paye,relief,net:gross-deductions,employerNssf:nssf,employerHousing:housing};
  return {...Object.fromEntries(Object.entries(amounts).map(([k,v])=>[k,v/100])),period:input.period,method:input.method,resident:input.resident,ruleVersion:RULE_VERSION};
}
export function nextPayrollStatus(role, status, action) {
  requirePayrollRole(role);
  if (action === 'REVIEW' && role === 'general_manager' && status === 'PENDING_MANAGER') return 'PENDING_ADMIN';
  if (action === 'APPROVE' && role === 'admin' && status === 'PENDING_ADMIN') return 'APPROVED';
  if (action === 'REJECT' && ((role === 'general_manager' && status === 'PENDING_MANAGER') || (role === 'admin' && status === 'PENDING_ADMIN'))) return 'REJECTED';
  throw new Error('This action is not allowed for your role or the current payroll status.');
}
export const payrollSchema = `
CREATE TABLE IF NOT EXISTS payroll_entries (
 id BIGSERIAL PRIMARY KEY,
 request_key UUID NOT NULL UNIQUE,
 employee_id BIGINT NOT NULL REFERENCES customers(id),
 employee_name TEXT NOT NULL,
 period TEXT NOT NULL CHECK(period ~ '^2026-(0[2-9]|1[0-2])$'),
 amounts JSONB NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('PENDING_MANAGER','PENDING_ADMIN','APPROVED','REJECTED')),
 created_by BIGINT NOT NULL REFERENCES customers(id),
 reviewed_by BIGINT REFERENCES customers(id),
 approved_by BIGINT REFERENCES customers(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK(status NOT IN ('PENDING_ADMIN','APPROVED') OR reviewed_by IS NOT NULL),
 CHECK(status <> 'APPROVED' OR (approved_by IS NOT NULL AND approved_by <> reviewed_by))
);
CREATE UNIQUE INDEX IF NOT EXISTS payroll_employee_period ON payroll_entries(employee_id,period) WHERE status <> 'REJECTED';
CREATE TABLE IF NOT EXISTS payroll_events (
 id BIGSERIAL PRIMARY KEY,
 entry_id BIGINT NOT NULL REFERENCES payroll_entries(id),
 actor_id BIGINT NOT NULL REFERENCES customers(id),
 action TEXT NOT NULL,
 note TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`;

// Caller owns a transaction. Row locking serializes simultaneous review/approval.
export async function decidePayroll(client, user, id, action, note) {
  requirePayrollRole(user.role);
  if (!Number.isSafeInteger(Number(id)) || Number(id) < 1) throw new Error('Invalid payroll record.');
  if (typeof note !== 'string' || !note.trim() || note.length > 1000) throw new Error('Enter a review note (up to 1,000 characters).');
  const result = await client.query('SELECT * FROM payroll_entries WHERE id=$1 FOR UPDATE',[id]);
  const entry = result.rows[0];
  if (!entry) throw new Error('Payroll record not found.');
  const status = nextPayrollStatus(user.role,entry.status,action);
  if (action === 'REVIEW' && String(entry.created_by) === String(user.sub)) throw new Error('The preparer cannot review their own payroll.');
  await client.query(`UPDATE payroll_entries SET status=$2, reviewed_by=CASE WHEN $3='REVIEW' THEN $4 ELSE reviewed_by END, approved_by=CASE WHEN $3='APPROVE' THEN $4 ELSE approved_by END, updated_at=NOW() WHERE id=$1`,[id,status,action,user.sub]);
  await client.query('INSERT INTO payroll_events(entry_id,actor_id,action,note) VALUES($1,$2,$3,$4)',[id,user.sub,action,note.trim()]);
  return status;
}
