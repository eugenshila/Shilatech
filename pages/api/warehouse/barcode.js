import bwipjs from 'bwip-js';
import { query } from '../../../lib/db';
import { requireWarehouseStaff } from '../../../lib/warehouse-auth';

export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  if(!await requireWarehouseStaff(req,res)) return;
  try{
    const id=Number(req.query.id);
    const partNo=String(req.query.partNo||'').trim();
    let result;
    if(Number.isInteger(id)) result=await query(`SELECT id,part_no,name,brand,COALESCE(barcode,part_no) AS barcode FROM products WHERE id=$1 LIMIT 1`,[id]);
    else if(partNo) result=await query(`SELECT id,part_no,name,brand,COALESCE(barcode,part_no) AS barcode FROM products WHERE part_no=$1 LIMIT 1`,[partNo]);
    else return res.status(400).json({error:'Product id or part number is required.'});
    if(!result.rowCount) return res.status(404).json({error:'Product not found.'});
    const p=result.rows[0];
    const svg=bwipjs.toSVG({bcid:'code128',text:p.barcode,scale:2,height:12,includetext:true,textxalign:'center',backgroundcolor:'FFFFFF'});
    res.setHeader('Content-Type','image/svg+xml; charset=utf-8');
    res.setHeader('Content-Disposition',`inline; filename="${p.part_no}-barcode.svg"`);
    res.status(200).send(svg);
  }catch(error){console.error(error);res.status(500).json({error:'Could not generate barcode.'});}
}
