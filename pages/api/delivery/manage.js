import bcrypt from 'bcryptjs';
import { getPool } from '../../../lib/db';
import { requireDeliveryStaff } from '../../../lib/delivery-auth';

const managementRoles = new Set(['admin','warehouse_manager','dispatch']);

export default async function handler(req,res){
  const session=requireDeliveryStaff(req,res); if(!session) return;
  if(!managementRoles.has(session.role)) return res.status(403).json({error:'Delivery management access denied.'});

  const pool=getPool();
  if(req.method==='GET'){
    try{
      const [drivers,jobs,performance,recent]=await Promise.all([
        pool.query(`SELECT id,name,email,phone,role,created_at FROM customers WHERE role='delivery_driver' ORDER BY name,email`),
        pool.query(`SELECT dj.id,dj.status,dj.driver_id,wo.job_no,o.order_no,o.customer_name,o.phone,o.delivery_address,o.delivery_zone,
          c.name AS driver_name,c.email AS driver_email
          FROM delivery_jobs dj JOIN warehouse_orders wo ON wo.id=dj.warehouse_order_id JOIN orders o ON o.id=wo.order_id
          LEFT JOIN customers c ON c.id=dj.driver_id
          WHERE dj.status<>'DELIVERED' ORDER BY dj.created_at ASC LIMIT 200`),
        pool.query(`SELECT c.id,c.name,c.email,
          COUNT(dj.id) FILTER (WHERE dj.status<>'DELIVERED')::int AS active_jobs,
          COUNT(dj.id) FILTER (WHERE dj.status='DELIVERED')::int AS delivered_jobs,
          MAX(dj.delivered_at) AS last_delivery_at
          FROM customers c LEFT JOIN delivery_jobs dj ON dj.driver_id=c.id
          WHERE c.role='delivery_driver' GROUP BY c.id ORDER BY c.name,c.email`),
        pool.query(`SELECT dj.id,dj.delivered_at,dj.recipient_name,dj.gps_lat,dj.gps_lng,c.name AS driver_name,
          o.order_no,o.customer_name,o.delivery_zone
          FROM delivery_jobs dj JOIN customers c ON c.id=dj.driver_id JOIN warehouse_orders wo ON wo.id=dj.warehouse_order_id JOIN orders o ON o.id=wo.order_id
          WHERE dj.status='DELIVERED' ORDER BY dj.delivered_at DESC NULLS LAST LIMIT 50`)
      ]);
      return res.status(200).json({drivers:drivers.rows,jobs:jobs.rows,performance:performance.rows,recentDeliveries:recent.rows});
    }catch(error){console.error(error);return res.status(500).json({error:'Could not load driver management.'});}
  }

  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const action=String(req.body?.action||'').trim().toUpperCase();
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    if(action==='CREATE_DRIVER'){
      if(!['admin','warehouse_manager'].includes(session.role)) throw new Error('Only an administrator or warehouse manager can create driver accounts.');
      const name=String(req.body?.name||'').trim();
      const email=String(req.body?.email||'').trim().toLowerCase();
      const phone=String(req.body?.phone||'').trim()||null;
      const password=String(req.body?.password||'');
      if(!name||!email||password.length<8) throw new Error('Driver name, email and a password of at least 8 characters are required.');
      const existing=await client.query(`SELECT id,role FROM customers WHERE email=$1 FOR UPDATE`,[email]);
      if(existing.rowCount&&existing.rows[0].role!=='delivery_driver') throw new Error('That email already belongs to a non-driver account. Use a different driver email.');
      const hash=await bcrypt.hash(password,12);
      let created;
      if(existing.rowCount){
        created=await client.query(`UPDATE customers SET name=$1,phone=$2,password_hash=$3 WHERE id=$4 RETURNING id,name,email,phone,role`,[name,phone,hash,existing.rows[0].id]);
      }else{
        created=await client.query(`INSERT INTO customers (name,email,phone,password_hash,role) VALUES ($1,$2,$3,$4,'delivery_driver') RETURNING id,name,email,phone,role`,[name,email,phone,hash]);
      }
      await client.query(`INSERT INTO warehouse_audit (employee_id,action,entity_type,entity_id,details) VALUES ($1,'DRIVER_ACCOUNT_CREATED','customer',$2,$3::jsonb)`,[Number(session.sub),String(created.rows[0].id),JSON.stringify({name,email,phone})]);
      await client.query('COMMIT');
      return res.status(201).json({ok:true,driver:created.rows[0]});
    }

    if(action==='ASSIGN_DRIVER'||action==='UNASSIGN_DRIVER'){
      const deliveryId=Number(req.body?.deliveryId);
      if(!Number.isInteger(deliveryId)) throw new Error('Delivery job is required.');
      let driverId=null; let driver=null;
      if(action==='ASSIGN_DRIVER'){
        driverId=Number(req.body?.driverId);
        if(!Number.isInteger(driverId)) throw new Error('Select a driver.');
        const dq=await client.query(`SELECT id,name,email FROM customers WHERE id=$1 AND role='delivery_driver'`,[driverId]);
        if(!dq.rowCount) throw new Error('Selected driver account is invalid.');
        driver=dq.rows[0];
      }
      const job=await client.query(`SELECT dj.id,dj.status,wo.job_no,o.order_no FROM delivery_jobs dj JOIN warehouse_orders wo ON wo.id=dj.warehouse_order_id JOIN orders o ON o.id=wo.order_id WHERE dj.id=$1 FOR UPDATE`,[deliveryId]);
      if(!job.rowCount) throw new Error('Delivery job not found.');
      if(job.rows[0].status==='DELIVERED') throw new Error('Delivered jobs cannot be reassigned.');
      await client.query(`UPDATE delivery_jobs SET driver_id=$1,status=CASE WHEN $1::bigint IS NULL THEN 'READY' ELSE 'ASSIGNED' END,updated_at=NOW() WHERE id=$2`,[driverId,deliveryId]);
      await client.query(`INSERT INTO warehouse_audit (employee_id,action,entity_type,entity_id,details) VALUES ($1,$2,'delivery_job',$3,$4::jsonb)`,[Number(session.sub),action,String(deliveryId),JSON.stringify({jobNo:job.rows[0].job_no,orderNo:job.rows[0].order_no,driverId,driverName:driver?.name||null})]);
      await client.query('COMMIT');
      return res.status(200).json({ok:true});
    }

    throw new Error('Unsupported delivery management action.');
  }catch(error){await client.query('ROLLBACK');console.error(error);return res.status(400).json({error:error.message||'Could not update delivery management.'});}
  finally{client.release();}
}
