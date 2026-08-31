const windows=new Map();
function rateLimited(ip){const now=Date.now(),recent=(windows.get(ip)||[]).filter(t=>now-t<60000);recent.push(now);windows.set(ip,recent);return recent.length>12;}
function scalar(obj,names){if(!obj||typeof obj!=='object')return '';for(const [key,value] of Object.entries(obj)){if(names.includes(key.toLowerCase())&&value!=null&&typeof value!=='object'&&String(value).trim())return String(value).trim();}return '';}
function imageUrl(value,depth=0){if(!value||depth>5)return '';if(typeof value==='string'&&/^https?:\/\//i.test(value))return value;if(Array.isArray(value)){for(const item of value){const found=imageUrl(item,depth+1);if(found)return found;}return '';}if(typeof value!=='object')return '';for(const [key,item] of Object.entries(value)){if(/image|picture|media|url|link/i.test(key)){const found=imageUrl(item,depth+1);if(found)return found;}}for(const item of Object.values(value)){const found=imageUrl(item,depth+1);if(found)return found;}return '';}\nfunction nestedScalar(value,names,depth=0){if(!value||depth>4)return '';if(Array.isArray(value)){for(const item of value){const found=nestedScalar(item,names,depth+1);if(found)return found;}return '';}if(typeof value!=='object')return '';const direct=scalar(value,names);if(direct)return direct;for(const item of Object.values(value)){const found=nestedScalar(item,names,depth+1);if(found)return found;}return '';}
function responseShape(payload){let sample=null;function walk(v,d=0){if(sample||!v||d>6)return;if(Array.isArray(v)){for(const x of v)walk(x,d+1);return;}if(typeof v==='object'){const keys=Object.keys(v);if(keys.some(k=>/article|part|product|description/i.test(k)))sample=keys.slice(0,30);else Object.values(v).forEach(x=>walk(x,d+1));}}walk(payload);return {top:Array.isArray(payload)?['array']:Object.keys(payload||{}).slice(0,30),sample:sample||[]};}
function normalise(payload){const found=[];const seen=new Set();function walk(value,depth=0){if(!value||depth>7)return;if(Array.isArray(value)){value.forEach(item=>walk(item,depth+1));return;}if(typeof value!=='object')return;const partNo=scalar(value,['articlenumber','articleno','partnumber','partno','oenumber','articleoemno']);const id=scalar(value,['articleid','id']);const name=scalar(value,['description','productname','articlename','genericarticledescription','productgroup']);if(partNo){const key=partNo.toUpperCase();if(!seen.has(key)){seen.add(key);found.push({id:id||key,partNo,name:name||'Compatible automotive part',brand:scalar(value,['brandname','suppliername','brand','manufacturername'])||'Catalogue supplier',imageUrl:imageUrl(value)||nestedScalar(value,['imageurl','image','pictureurl','mediaurl','url'])});}}Object.values(value).forEach(item=>walk(item,depth+1));}walk(payload);return found.slice(0,24);}
export default async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
 res.setHeader('Cache-Control','private, max-age=300');
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
 if(rateLimited(ip))return res.status(429).json({error:'Too many catalogue searches. Please wait one minute'});
 const vehicleId=String(req.query.vehicleId||'').trim(),search=String(req.query.q||'').trim(),categoryId=String(req.query.categoryId||'').trim();
 if(!/^\d{1,10}$/.test(vehicleId))return res.status(400).json({error:'Enter a valid vehicle'});
 if(categoryId&&!/^\d{1,10}$/.test(categoryId))return res.status(400).json({error:'Enter a valid category'});
 if(!categoryId&&(search.length<2||search.length>80))return res.status(400).json({error:'Enter a valid part description'});
 const key=process.env.AUTO_PARTS_API_KEY;
 if(!key)return res.status(503).json({error:'Parts catalogue is not configured'});
 const base=String(process.env.AUTO_PARTS_API_BASE_URL||'https://auto-parts-catalog.apiprofile.com').replace(/\/$/,'');
 const url=categoryId
  ?`${base}/api/articles/list/type-id/1/vehicle-id/${vehicleId}/category-id/${categoryId}/lang-id/4`
  :`${base}/api/articles-oem/selecting-oem-parts-vehicle-modification-description-product-group/type-id/1/vehicle-id/${vehicleId}/lang-id/4/search-param/${encodeURIComponent(search)}`;
 try{
  const response=await fetch(url,{headers:{'x-apiprofile-key':key,accept:'application/json'},signal:AbortSignal.timeout(12000),cache:'no-store'});
  if(response.status===404)return res.json({parts:[],source:'Auto Parts Catalog'});
  if(!response.ok)throw new Error('provider response '+response.status);
  const payload=await response.json(),parts=normalise(payload);return res.json({parts,source:'Auto Parts Catalog'});
 }catch(error){console.error('Catalog parts lookup failed:',error.message);return res.status(502).json({error:'Compatible-parts service is temporarily unavailable'});}
}

