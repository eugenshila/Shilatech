import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { calculatePayroll,nextPayrollStatus,requirePayrollRole,payrollSchema,decidePayroll } from '../lib/payroll.mjs';

const input = {period:'2026-08',basic:'50000',allowances:'0',method:'BANK',resident:true};
test('ordinary resident salary: deductions, net pay and employer contributions',()=>{
 const p=calculatePayroll(input);
 assert.equal(p.nssf,3000);assert.equal(p.shif,1375);assert.equal(p.housing,750);
 assert.equal(p.taxable,44875);assert.equal(p.paye,5845.85);assert.equal(p.net,39029.15);
 assert.equal(p.employerNssf,3000);assert.equal(p.employerHousing,750);
 assert.equal(calculatePayroll({...input,method:'MPESA'}).net,p.net);
});
test('NSSF cap, SHIF minimum, non-resident relief and regular allowances',()=>{
 assert.equal(calculatePayroll({...input,basic:'200000'}).nssf,6480);
 assert.equal(calculatePayroll({...input,basic:'9000'}).shif,300);
 assert.equal(calculatePayroll({...input,resident:false}).paye,8245.85);
 assert.equal(calculatePayroll({...input,basic:'45000',allowances:'5000'}).gross,50000);
 assert.equal(calculatePayroll({...input,basic:'9000'}).paye,0);
});
test('reject invalid amounts, methods, periods and unconfirmed residency',()=>{
 for(const basic of ['-1','NaN','Infinity','1e5','0','2.345','999999999999999']) assert.throws(()=>calculatePayroll({...input,basic}));
 for(const period of ['2026-01','2027-01','2026-13','2026-08-01'])assert.throws(()=>calculatePayroll({...input,period}));
 assert.throws(()=>calculatePayroll({...input,method:'CASH'}));
 assert.throws(()=>calculatePayroll({...input,resident:undefined}));
});
test('only managers review, only admins approve, terminal records are immutable',()=>{
 assert.equal(nextPayrollStatus('general_manager','PENDING_MANAGER','REVIEW'),'PENDING_ADMIN');
 assert.equal(nextPayrollStatus('admin','PENDING_ADMIN','APPROVE'),'APPROVED');
 for(const role of ['cashier','finance','auditor','customer','garage_staff','warehouse_manager'])assert.throws(()=>requirePayrollRole(role));
 assert.throws(()=>nextPayrollStatus('admin','PENDING_MANAGER','APPROVE'));
 assert.throws(()=>nextPayrollStatus('general_manager','PENDING_ADMIN','APPROVE'));
 assert.throws(()=>nextPayrollStatus('admin','APPROVED','REJECT'));
});
test('schema, duplicate-month guard, persisted approval chain and audit trail',async()=>{
 const db=new PGlite();
 try {
  await db.exec('CREATE TABLE customers(id BIGINT PRIMARY KEY); INSERT INTO customers VALUES(1),(2),(3);');
  await db.exec(payrollSchema);await db.exec(payrollSchema);
  const c={query:async(q,args)=>{const r=await db.query(q,args);return {...r,rowCount:r.rows.length};}};
  const insert="INSERT INTO payroll_entries(request_key,employee_id,employee_name,period,amounts,status,created_by) VALUES($1,3,'Test staff','2026-08',$2::jsonb,'PENDING_MANAGER',1) RETURNING id";
  const r=await c.query(insert,['11111111-1111-4111-8111-111111111111',JSON.stringify(calculatePayroll(input))]);const id=r.rows[0].id;
  await assert.rejects(c.query(insert,['22222222-2222-4222-8222-222222222222','{}']));
  await assert.rejects(decidePayroll(c,{role:'cashier',sub:'3'},id,'REVIEW','checked'));
  await assert.rejects(decidePayroll(c,{role:'admin',sub:'1'},id,'APPROVE','checked'));
  await assert.rejects(decidePayroll(c,{role:'general_manager',sub:'1'},id,'REVIEW','checked'));
  await assert.rejects(decidePayroll(c,{role:'general_manager',sub:'2'},id,'REVIEW',''));
  async function tx(user,action){await db.exec('BEGIN');try{const s=await decidePayroll(c,user,id,action,'Reviewed for testing');await db.exec('COMMIT');return s;}catch(e){await db.exec('ROLLBACK');throw e;}}
  assert.equal(await tx({role:'general_manager',sub:'2'},'REVIEW'),'PENDING_ADMIN');
  assert.equal(await tx({role:'admin',sub:'1'},'APPROVE'),'APPROVED');
  await assert.rejects(tx({role:'admin',sub:'1'},'APPROVE'));
  const saved=(await c.query('SELECT * FROM payroll_entries WHERE id=$1',[id])).rows[0];
  assert.equal(saved.amounts.net,39029.15);assert.equal(String(saved.reviewed_by),'2');assert.equal(String(saved.approved_by),'1');
  assert.equal((await c.query('SELECT * FROM payroll_events')).rows.length,2);
 }finally{await db.close();}
});
