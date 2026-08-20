import { query } from '../../../lib/db';

const intlEstimate=(subtotal)=>{
  const shipping=Math.max(4500,Math.round(subtotal*0.08));
  const taxProvision=Math.round(subtotal*0.20);
  return {shipping,taxProvision,dutyProvision:0,eta:'Estimated 5–10 business days after dispatch'};
};

export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  try{
    const subtotal=Math.max(0,Number(req.query.subtotal||0));
    const country=String(req.query.country||'Kenya').trim()||'Kenya';
    const services=await query(`SELECT code,name,scope,hours,base_cost_kes FROM delivery_services WHERE active=TRUE ORDER BY sort_order,name`);
    const local=services.rows.filter(s=>s.scope==='LOCAL').map(s=>({code:s.code,name:s.name,hours:s.hours,cost:Number(s.base_cost_kes),eta:s.hours===24?'Next business day':`Within ${s.hours} hours`}));
    let international=null;
    if(country.toLowerCase()!=='kenya'){
      const e=intlEstimate(subtotal);
      international={code:'INTL_EST',name:'International Shipping — Estimate',country,...e,totalEstimated:e.shipping+e.taxProvision+e.dutyProvision,note:'Customs, VAT, import duty and courier charges vary by destination. This is a provisional checkout estimate and may be adjusted before dispatch.'};
    }
    return res.json({local,international});
  }catch(error){console.error(error);return res.status(500).json({error:'Could not calculate delivery options.'});}
}
