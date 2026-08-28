import { randomUUID } from 'node:crypto';
import { audit,currentActor } from './approvals.mjs';
export const garageTransitions={BOOKED:['INSPECTION'],INSPECTION:['AWAITING_CUSTOMER','IN_PROGRESS'],AWAITING_CUSTOMER:['IN_PROGRESS'],IN_PROGRESS:['READY'],READY:['COMPLETED'],COMPLETED:[],CANCELLED:[]};
const clean=(v,label,max=200)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw new Error(`${label} is required (maximum ${max} characters).`);return v.trim();};
export async function saveGarageJob(c,user,b){
 user=await currentActor(c,user.id||user.sub);
 if(!['admin','garage_staff'].includes(user.role))throw new Error('Garage editing access required. General managers can submit correction requests.');
 if(!user.location_id)throw new Error('An assigned location is required.');
 if(b.action==='CREATE'){
  const key=String(b.requestKey||'');
  if(!/^[0-9a-f-]{36}$/i.test(key))throw new Error('A booking request key is required.');
  const values=[clean(b.customerName,'Customer'),clean(b.phone,'Phone',40),clean(b.vehicle,'Vehicle'),clean(b.registration,'Registration or VIN',40),clean(b.service,'Requested service',1000)];
  const date=b.preferredDate||null;
  if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Choose a valid booking date.');
  await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[key]);
  const old=await c.query('SELECT * FROM garage_jobs WHERE request_key=$1',[key]);
  if(old.rowCount){
   const j=old.rows[0];
   if(String(j.created_by)!==String(user.id)||[j.customer_name,j.phone,j.vehicle,j.registration,j.service].some((v,i)=>v!==values[i])||String(j.preferred_date||'').slice(0,10)!==String(date||''))throw new Error('Booking key already used.');
   return j;
  }
  const r=await c.query(`INSERT INTO garage_jobs(job_no,request_key,customer_name,phone,vehicle,registration,service,preferred_date,location_id,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,['JOB-'+randomUUID().slice(0,8).toUpperCase(),key,...values,date,user.location_id,user.id]);
  await audit(c,user,'GARAGE_BOOKING_CREATED',r.rows[0].id,{jobNo:r.rows[0].job_no},'garage_job');return r.rows[0];
 }
 const r=await c.query('SELECT * FROM garage_jobs WHERE id=$1 FOR UPDATE',[b.id]);
 const job=r.rows[0];if(!job||String(job.location_id)!==String(user.location_id))throw new Error('Garage job not found at your location.');
 if(Number(b.version)!==job.version)throw new Error('This job changed. Reload before updating it.');
 if(b.action==='PROGRESS'){
  if(!garageTransitions[job.status]?.includes(b.status))throw new Error('Invalid progress change. Cancellations, reopening and corrections require approval.');
  const note=clean(b.note,'Progress note',2000);
  await c.query('INSERT INTO garage_job_notes(job_id,employee_id,note) VALUES($1,$2,$3)',[job.id,user.id,note]);
  await c.query('UPDATE garage_jobs SET status=$1,version=version+1,updated_at=NOW() WHERE id=$2',[b.status,job.id]);
  await audit(c,user,'GARAGE_PROGRESS',job.id,{from:job.status,to:b.status,note},'garage_job');
 }else if(b.action==='NOTE'){
  const note=clean(b.note,'Job note',2000);
  await c.query('INSERT INTO garage_job_notes(job_id,employee_id,note) VALUES($1,$2,$3)',[job.id,user.id,note]);
  await c.query('UPDATE garage_jobs SET version=version+1,updated_at=NOW() WHERE id=$1',[job.id]);
  await audit(c,user,'GARAGE_NOTE_ADDED',job.id,{note},'garage_job');
 }else throw new Error('Unsupported garage action.');
 return (await c.query('SELECT * FROM garage_jobs WHERE id=$1',[job.id])).rows[0];
}
