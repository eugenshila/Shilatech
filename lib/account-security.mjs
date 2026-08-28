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
