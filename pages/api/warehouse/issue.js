import { requireWarehouseStaff } from '../../../lib/warehouse-auth';
export default async function handler(req,res){
 if(!await requireWarehouseStaff(req,res))return;
 return res.status(409).json({error:'Unlinked manual stock deductions require an approved stock adjustment. Use Requests & approvals. Normal POS sales and online order picking remain available.',requestUrl:'/approvals'});
}
