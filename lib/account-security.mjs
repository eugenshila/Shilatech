import bcrypt from 'bcryptjs';

// Caller owns the transaction. The reset ID prevents an old deployment from resetting a password twice.
export async function bootstrapAdministrator(c,env){
 const email=String(env.ADMIN_SETUP_EMAIL||'').trim().toLowerCase();
 const hash=String(env.ADMIN_SETUP_PASSWORD_HASH||'');
 const resetId=String(env.ADMIN_SETUP_ID||'');
 if(!email&&!hash&&!resetId)return false;
 if(!email||!/^\$2[aby]\$12\$[./A-Za-z0-9]{53}$/.test(hash)||!/^admin-reset-[a-z0-9-]{10,80}$/.test(resetId))throw new Error('Administrator setup configuration is incomplete.');
 await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[resetId]);
 const prior=await c.query("SELECT id FROM warehouse_audit WHERE action='ADMINISTRATOR_SETUP' AND entity_id=$1",[resetId]);
 if(prior.rowCount)return false;
 const existing=await c.query('SELECT id FROM customers WHERE email=$1 FOR UPDATE',[email]);
 if(existing.rowCount!==1)throw new Error('Administrator setup requires one existing account with the configured email.');
 const id=existing.rows[0].id;
 await c.query("UPDATE customers SET role='admin',password_hash=$1,password_version=password_version+1,must_change_password=TRUE,location_id=COALESCE(location_id,main_business_location_id()) WHERE id=$2",[hash,id]);
 await c.query("INSERT INTO warehouse_audit(employee_id,action,entity_type,entity_id,details) VALUES($1,'ADMINISTRATOR_SETUP','account_setup',$2,$3::jsonb)",[id,resetId,JSON.stringify({email,userId:id,source:'authorised Railway setup'})]);
 return true;
}

const ONETIME_ADMIN_EMAIL='admin@shilatech.local';
const ONETIME_ADMIN_SETUP_ID='shilatech-onetime-admin-v2';
const ONETIME_ADMIN_PASSWORD_HASH='$2b$12$2pR1uCMA15Sh/DGW.zjqp.x2D8FMTw5V1JQ.89xMEYdhmENtSogSC';

export async function ensureOneTimeAdministrator(c){
 await c.query('SELECT pg_advisory_xact_lock(290841)');
 const prior=await c.query("SELECT id FROM warehouse_audit WHERE action='ONETIME_ADMIN_SETUP' AND entity_id=$1",[ONETIME_ADMIN_SETUP_ID]);
 if(prior.rowCount)return false;
 const upsert=await c.query(
  `INSERT INTO customers(name,email,phone,password_hash,role,location_id,must_change_password,password_version)
   VALUES($1,$2,NULL,$3,'admin',main_business_location_id(),TRUE,0)
   ON CONFLICT (email) DO UPDATE SET
    name=EXCLUDED.name,
    password_hash=EXCLUDED.password_hash,
    role='admin',
    must_change_password=TRUE,
    password_version=customers.password_version+1,
    location_id=COALESCE(customers.location_id, main_business_location_id())
   RETURNING id`,
  ['Shilatech One-Time Administrator',ONETIME_ADMIN_EMAIL,ONETIME_ADMIN_PASSWORD_HASH]
 );
 const id=upsert.rows[0]?.id;
 if(!id)throw new Error('Could not create the one-time administrator account.');
 await c.query(
  `UPDATE customers
   SET password_hash=$1,role='admin',must_change_password=TRUE,password_version=password_version+1,
       location_id=COALESCE(location_id,main_business_location_id())
   WHERE email=$2`,
  [ONETIME_ADMIN_PASSWORD_HASH,'shilatech.onetime.admin@example.invalid']
 );
 await c.query(
  "INSERT INTO warehouse_audit(employee_id,action,entity_type,entity_id,details) VALUES($1,'ONETIME_ADMIN_SETUP','account_setup',$2,$3::jsonb)",
  [id,ONETIME_ADMIN_SETUP_ID,JSON.stringify({email:ONETIME_ADMIN_EMAIL,userId:id,source:'Vercel/Supabase admin bootstrap v2',must_change_password:true})]
 );
 return true;
}

export async function changeOwnPassword(c,id,currentPassword,newPassword){
 if(typeof currentPassword!=='string'||typeof newPassword!=='string'||newPassword.length<12||Buffer.byteLength(newPassword,'utf8')>72)throw new Error('Choose a new password of at least 12 characters and no more than 72 bytes.');
 const r=await c.query('SELECT id,password_hash FROM customers WHERE id=$1 FOR UPDATE',[id]);
 if(!r.rowCount||!await bcrypt.compare(currentPassword,r.rows[0].password_hash))throw new Error('Current password is incorrect.');
 if(await bcrypt.compare(newPassword,r.rows[0].password_hash))throw new Error('Choose a different password.');
 const hash=await bcrypt.hash(newPassword,12);
 const updated=await c.query('UPDATE customers SET password_hash=$1,password_version=password_version+1,must_change_password=FALSE WHERE id=$2 RETURNING id,name,email,role,password_version,must_change_password',[hash,id]);
 await c.query("INSERT INTO warehouse_audit(employee_id,action,entity_type,entity_id,details) VALUES($1,'PASSWORD_CHANGED','customer',$2,'{}'::jsonb)",[id,String(id)]);
 return updated.rows[0];
}
