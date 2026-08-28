import { query } from '../../../lib/db';
import { requireDeliveryStaff } from '../../../lib/delivery-auth';

export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  const session=await requireDeliveryStaff(req,res); if(!session) return;
  try{
    const driverFilter=session.role==='delivery_driver'?'AND dj.driver_id=$1':'';
    const params=session.role==='delivery_driver'?[Number(session.sub)]:[];
    const result=await query(`SELECT dj.id,dj.status,dj.driver_id,dj.recipient_name,dj.signed_at,dj.delivered_at,
      wo.id AS warehouse_order_id,wo.job_no,o.id AS order_id,o.order_no,o.customer_name,o.phone,o.email,o.delivery_address,o.delivery_zone,o.total_kes,o.payment_method,o.payment_status,
      o.delivery_service_code,o.delivery_eta,o.destination_country,o.shipping_tax_kes,o.shipping_duty_kes,o.delivery_kes,
      ds.name AS delivery_service_name,
      c.name AS driver_name,c.email AS driver_email,
      COALESCE(json_agg(json_build_object('partNo',wi.part_no,'name',wi.name,'brand',wi.brand,'quantity',wi.quantity) ORDER BY wi.id) FILTER (WHERE wi.id IS NOT NULL),'[]'::json) AS items
      FROM delivery_jobs dj JOIN warehouse_orders wo ON wo.id=dj.warehouse_order_id JOIN orders o ON o.id=wo.order_id
      LEFT JOIN delivery_services ds ON ds.code=o.delivery_service_code
      LEFT JOIN customers c ON c.id=dj.driver_id
      LEFT JOIN warehouse_order_items wi ON wi.warehouse_order_id=wo.id
      WHERE dj.status<>'DELIVERED' ${driverFilter}
      GROUP BY dj.id,wo.id,o.id,ds.name,c.id ORDER BY dj.created_at ASC LIMIT 100`,params);
    res.status(200).json({jobs:result.rows,user:{role:session.role,id:Number(session.sub)}});
  }catch(error){console.error(error);res.status(500).json({error:'Could not load delivery jobs.'});}
}
