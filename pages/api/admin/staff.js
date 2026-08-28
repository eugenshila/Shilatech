import bcrypt from 'bcryptjs';
import { getPool,query } from '../../../lib/db';
import { readSession } from '../../../lib/auth';
const roles=new Set(['hr','general_manager','garage_staff','warehouse_manager','warehouse_clerk','picker','packer','dispatch','finance','auditor','delivery_driver','cashier']);
async function admin(req,res){const s=await readSession(req);if(!s){res.status(401).json({error:'Sign in required.'});return null;}if(s.role!=='admin'){res.status(403).json({error:'Administrator access required.'});return null;}return s;}
export default async function handler(req,res){
 const s=await admin(req,res);if(!s)return;
 if(req.method==='GET')try{const r=await query(`SELECT id,name,email,phone,role,created_at FROM customers WHERE role<>'customer' ORDER BY role,name,email`);return res.json({staff:r.rows,roles:[...roles]});}catch(e){console.error(e);return res.status(500).json({error:'Could not load employees.'});}
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const b=req.body||{};const action=String(b.action||'').toUpperCase();const c=await getPool().connect();try{await c.query('BEGIN');
  if(action==='CREATE'){
   const name=String(b.name||'').trim(),email=String(b.email||'').trim().toLowerCase(),phone=String(b.phone||'').trim()||null,role=String(b.role||'');const password=String(b.password||'');
   if(!name||!email||!roles.has(role)||password.length<8)throw new Error('Name, email, valid role and password of at least 8 characters are required.');
   const ex=await c.query(`SELECT id,role FROM customers WHERE email=$1 FOR UPDATE`,[email]);if(ex.rowCount)throw new Error('That email already belongs to an existing account.');
   const hash=await bcrypt.hash(password,12);const r=await c.query(`INSERT INTO customers(name,email,phone,password_hash,role,location_id,must_change_password) VALUES($1,$2,$3,$4,$5,main_business_location_id(),TRUE) RETURNING id,name,email,phone,role`,[name,email,phone,hash,role]);
   await c.query(`INSERT INTO warehouse_audit(employee_id,action,entity_type,entity_id,details) VALUES($1,'STAFF_CREATED','customer',$2,$3::jsonb)`,[Number(s.sub),String(r.rows[0].id),JSON.stringify({email,role})]);await c.query('COMMIT');return res.status(201).json({staff:r.rows[0]});
  }
  if(action==='SET_ROLE'){
   const id=Number(b.id),role=String(b.role||'');if(!Number.isInteger(id)||!roles.has(role))throw new Error('Valid employee and role required.');
   const r=await c.query(`UPDATE customers SET role=$1,location_id=COALESCE(location_id,main_business_location_id()) WHERE id=$2 AND role<>'admin' RETURNING id,name,email,phone,role`,[role,id]);if(!r.rowCount)throw new Error('Employee not found or administrator role cannot be changed here.');
   await c.query(`INSERT INTO warehouse_audit(employee_id,action,entity_type,entity_id,details) VALUES($1,'STAFF_ROLE_CHANGED','customer',$2,$3::jsonb)`,[Number(s.sub),String(id),JSON.stringify({role})]);await c.query('COMMIT');return res.json({staff:r.rows[0]});
  }
  if(action==='RESET_PASSWORD'){
   const id=Number(b.id),password=String(b.password||'');if(!Number.isInteger(id)||password.length<8)throw new Error('Employee and password of at least 8 characters required.');const hash=await bcrypt.hash(password,12);const r=await c.query(`UPDATE customers SET password_hash=$1,password_version=password_version+1,must_change_password=TRUE WHERE id=$2 AND role<>'admin' RETURNING id`,[hash,id]);if(!r.rowCount)throw new Error('Employee not found.');
   await c.query(`INSERT INTO warehouse_audit(employee_id,action,entity_type,entity_id,details) VALUES($1,'STAFF_PASSWORD_RESET','customer',$2,'{}'::jsonb)`,[Number(s.sub),String(id)]);await c.query('COMMIT');return res.json({ok:true});
  }
  throw new Error('Unsupported action.');
 }catch(e){await c.query('ROLLBACK');console.error(e);return res.status(400).json({error:e.message||'Could not update employee.'});}finally{c.release();}
}

