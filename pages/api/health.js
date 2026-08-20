import { query } from '../../lib/db';
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  try{await query('SELECT 1');return res.status(200).json({ok:true,service:'Shilatech Auto Spares',database:'ok',time:new Date().toISOString()});}
  catch(e){console.error(e);return res.status(503).json({ok:false,service:'Shilatech Auto Spares',database:'unavailable'});}
}
