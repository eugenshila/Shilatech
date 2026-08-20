import { query } from '../lib/db';

const SITE_URL=(process.env.NEXT_PUBLIC_SITE_URL||'https://shilatech-auto-spares-production.up.railway.app').replace(/\/$/,'');

function escapeXml(value=''){return String(value).replace(/[<>&'\"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','\"':'&quot;'}[c]));}

export default function Sitemap(){return null;}

export async function getServerSideProps({res}){
  const staticPages=[
    ['/',1.0,'daily'],['/shop',0.9,'daily'],['/brands',0.8,'weekly'],['/vin',0.8,'weekly'],
    ['/about',0.6,'monthly'],['/contact',0.6,'monthly'],['/faq',0.5,'monthly'],['/delivery-returns',0.5,'monthly']
  ];
  let products=[];
  try{
    const r=await query(`SELECT slug,updated_at FROM products WHERE active=TRUE ORDER BY updated_at DESC LIMIT 10000`);
    products=r.rows;
  }catch(error){console.error('Sitemap product query failed',error);}
  const urls=[
    ...staticPages.map(([path,priority,changefreq])=>`<url><loc>${escapeXml(`${SITE_URL}${path==='/'?'':path}`)}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`),
    ...products.map(p=>`<url><loc>${escapeXml(`${SITE_URL}/product/${p.slug}`)}</loc><lastmod>${new Date(p.updated_at).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`)
  ];
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;
  res.setHeader('Content-Type','application/xml');
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml);res.end();
  return {props:{}};
}
