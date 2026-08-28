// Caller owns a transaction. Picked stock requires a physical return.
export async function cancelUnpickedOrder(client,orderId){
 const jobs=await client.query('SELECT id,status FROM warehouse_orders WHERE order_id=$1 FOR UPDATE',[orderId]);
 const orders=await client.query('SELECT id,status FROM orders WHERE id=$1 FOR UPDATE',[orderId]);
 if(!orders.rowCount)throw new Error('Order not found.');
 if(orders.rows[0].status==='Cancelled')return;
 const job=jobs.rows[0];
 if(!job)throw new Error('Order has no warehouse record. Reconcile it before cancelling.');
 const items=await client.query('SELECT product_id,quantity,picked_qty FROM warehouse_order_items WHERE warehouse_order_id=$1 ORDER BY product_id',[job.id]);
 if(!items.rowCount||items.rows.some(i=>Number(i.picked_qty)>0))throw new Error('Picked or incomplete orders require a managed return; stock cannot be restored by changing status.');
 for(const item of items.rows)await client.query('SELECT id FROM products WHERE id=$1 FOR UPDATE',[item.product_id]);
 for(const item of items.rows)await client.query('UPDATE products SET stock=stock+$1,updated_at=NOW() WHERE id=$2',[item.quantity,item.product_id]);
 await client.query("UPDATE warehouse_orders SET status='CANCELLED',updated_at=NOW() WHERE id=$1",[job.id]);
 await client.query("UPDATE orders SET status='Cancelled',updated_at=NOW() WHERE id=$1",[orderId]);
}
