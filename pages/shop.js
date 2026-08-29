import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { products as fallbackProducts, brands, categories } from '../data/products';

export default function Shop() {
  const router = useRouter();
  const [brand,setBrand]=useState('');
  const [category,setCategory]=useState('');
  const [search,setSearch]=useState('');
  const [sort,setSort]=useState('featured');
  const [inStock,setInStock]=useState('');
  const [products,setProducts]=useState(fallbackProducts);
  const [loading,setLoading]=useState(false);
  const [catalogQuery,setCatalogQuery]=useState('');
  const [catalogParts,setCatalogParts]=useState([]);
  const [catalogLoading,setCatalogLoading]=useState(false);
  const [catalogError,setCatalogError]=useState('');

  useEffect(()=>{
    if (!router.isReady) return;
    const rawBrand = String(router.query.brand || '').trim().toLowerCase();
    const requestedBrand = brands.find(b => b.toLowerCase() === rawBrand) || brands.find(b => rawBrand && (rawBrand.includes(b.toLowerCase()) || b.toLowerCase().includes(rawBrand)));
    setBrand(requestedBrand || '');

    const rawCategory = String(router.query.category || '').trim().toLowerCase();
    const requestedCategory = categories.find(c => c.toLowerCase() === rawCategory);
    setCategory(requestedCategory || '');
    setSearch(String(router.query.q || '').trim());
  },[router.isReady, router.query.brand, router.query.category, router.query.q]);

  useEffect(()=>{
    const timer=setTimeout(async()=>{
      setLoading(true);
      try {
        const params=new URLSearchParams();
        if(brand) params.set('brand',brand);
        if(category) params.set('category',category);
        if(search) params.set('q',search);
        if(inStock==='yes') params.set('inStock','true');
        if(router.query.model) params.set('model',router.query.model);
        if(router.query.year) params.set('year',router.query.year);
        const r=await fetch(`/api/products?${params.toString()}`);
        const data=await r.json();
        if(r.ok) setProducts(data.products || []);
      } catch (_) {
        let local=[...fallbackProducts];
        if(brand) local=local.filter(p=>p.brand===brand);
        if(category) local=local.filter(p=>p.category===category);
        if(search){const q=search.toLowerCase();local=local.filter(p=>`${p.name} ${p.partNo}`.toLowerCase().includes(q));}
        if(inStock==='yes') local=local.filter(p=>p.stock>0);
        setProducts(local);
      } finally { setLoading(false); }
    },250);
    return()=>clearTimeout(timer);
  },[brand,category,search,inStock,router.query.model,router.query.year]);

  const list=useMemo(()=>{
    let out=[...products];
    if(sort==='price-low') out.sort((a,b)=>a.price-b.price);
    if(sort==='price-high') out.sort((a,b)=>b.price-a.price);
    return out;
  },[products,sort]);

  const clearFilters=()=>{
    setBrand('');setCategory('');setSearch('');setInStock('');
    router.replace('/shop', undefined, { shallow:true });
  };

  async function searchCompatibleParts(e) {
    e.preventDefault();
    const vehicleId=String(router.query.vehicleId||'');
    const q=catalogQuery.trim();
    if(!vehicleId||q.length<2){setCatalogError('Enter at least two letters describing the part.');return;}
    setCatalogLoading(true);setCatalogError('');
    try{
      const r=await fetch(`/api/catalog-parts?vehicleId=${encodeURIComponent(vehicleId)}&q=${encodeURIComponent(q)}`);
      const data=await r.json();
      if(!r.ok)throw new Error(data.error||'Catalogue search failed');
      setCatalogParts(data.parts||[]);
    }catch(error){setCatalogError(error.message);}finally{setCatalogLoading(false);}
  }

  const seoTitle = brand ? `${brand} Spare Parts Kenya | Shilatech Auto Spares` : category ? `${category} Auto Parts Kenya | Shilatech Auto Spares` : undefined;
  const seoDescription = brand ? `Shop available ${brand} spare parts in Nairobi, Kenya. Search genuine and quality aftermarket parts by part number and category, with VIN fitment support and nationwide delivery.` : undefined;

  return <Layout title={seoTitle} description={seoDescription}>
    <section className="pageHero compactHero"><div className="container"><span className="eyebrow">CATALOG</span><h1>{brand ? `${brand} parts` : category ? `${category} parts` : 'Auto spare parts in Kenya'}</h1><p>{brand ? `Browse ${brand} spare parts, then refine by category, stock status or part number. Check fitment and part type on each listing. Enquiries welcome from Kenya and East Africa.` : 'Browse Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo and Ford parts. Search by part number and compare listed specifications. We welcome parts enquiries from Kenya and East Africa.'}</p></div></section>
    <section className="section"><div className="container shopLayout">
      <aside className="filters">
        <h3>Filter parts</h3>
        <label>Vehicle make<select value={brand} onChange={e=>setBrand(e.target.value)}><option value="">All makes</option>{brands.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Availability<select value={inStock} onChange={e=>setInStock(e.target.value)}><option value="">All stock</option><option value="yes">In stock</option></select></label>
        <button className="textButton" onClick={clearFilters}>Clear filters</button>
      </aside>
      <div className="catalog">
        {brand && <div className="fitmentBanner"><strong>{brand} catalog</strong><span>{loading ? 'Checking live inventory…' : `${list.length} listed part${list.length===1?'':'s'}`}</span></div>}
        {router.query.vin && <div className="fitmentBanner"><strong>VIN-assisted search active</strong><span>{router.query.year} {router.query.brand} {router.query.model}</span></div>}
        {router.query.vehicleId && <section className="compatibleCatalog" aria-label="VIN compatible parts catalogue"><div className="catalogIntro"><div><span className="eyebrow">COMPATIBILITY REFERENCE</span><h2>Search parts for this vehicle</h2><p>Search the external automotive catalogue by a part description such as brake pads, oil filter or control arm. Results show compatibility references only; Shilatech stock, price and final VIN fitment must be confirmed before ordering.</p></div><form onSubmit={searchCompatibleParts}><input aria-label="Compatible part description" placeholder="e.g. brake pads" value={catalogQuery} onChange={e=>setCatalogQuery(e.target.value)}/><button className="button primary" disabled={catalogLoading}>{catalogLoading?'Searching…':'Search compatible parts'}</button></form>{catalogError&&<p className="catalogError" role="alert">{catalogError}</p>}</div>
        {!!catalogParts.length&&<div className="externalGrid">{catalogParts.map(part=><article key={part.id+'-'+part.partNo}><div className="externalImage">{part.imageUrl?<img src={part.imageUrl} alt={part.name} loading="lazy" referrerPolicy="no-referrer" onError={e=>{e.currentTarget.style.display="none";e.currentTarget.parentElement.classList.add("imageMissing")}}/>:<span>IMAGE NOT AVAILABLE</span>}</div><div className="externalBody"><small>{part.brand}</small><h3>{part.name}</h3><p>Reference: <strong>{part.partNo}</strong></p><p className="notStocked">Catalogue reference — stock and price not confirmed</p><a className="button ghost" href={`/contact?part=${encodeURIComponent(part.partNo)}&vin=${encodeURIComponent(String(router.query.vin||''))}`}>Request this part</a></div></article>)}</div>}
        {!catalogLoading&&!catalogError&&catalogQuery&&catalogParts.length===0&&<p className="catalogEmpty">No compatible catalogue references found for that description. Try a shorter term or contact Shilatech with the VIN.</p>}</section>}
        <div className="catalogBar">
          <input placeholder="Search part name or number…" value={search} onChange={e=>setSearch(e.target.value)} />
          <select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option></select>
        </div>
        <p className="resultsCount">{loading ? 'Loading live inventory…' : `${list.length} parts found`}</p>
        <div className="productGrid catalogGrid">{list.map(p=><ProductCard key={p.id} product={p}/>)}</div>
        {!loading && !list.length && <div className="emptyState"><h3>No {brand ? `${brand} ` : ''}parts listed yet</h3><p>Try another filter or contact us with your VIN and required part. We can source parts that are not yet listed online.</p></div>}
      </div>
    </div></section>
    <style jsx>{`.compatibleCatalog{grid-column:1/-1;margin:18px 0 30px;border:1px solid #2d5830;border-radius:12px;background:linear-gradient(145deg,#101811,#070b08);padding:24px}.catalogIntro{display:grid;gap:14px}.catalogIntro h2{margin:0;color:#78c94b}.catalogIntro p{color:#c1cbc0;line-height:1.6;max-width:900px}.catalogIntro form{display:grid;grid-template-columns:1fr auto;gap:10px}.catalogIntro input{width:100%;background:#070a08;color:#fff;border:1px solid #40533e;border-radius:6px;padding:13px}.catalogError{color:#ff9b8e}.externalGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:22px}.externalGrid article{overflow:hidden;border:1px solid #31442f;border-radius:9px;background:#090d0a}.externalImage{height:170px;display:grid;place-items:center;background:#fff;color:#445;font-size:11px}.externalImage img{width:100%;height:100%;object-fit:contain}.externalImage.imageMissing::after{content:"Catalogue image unavailable";color:#667064;font-size:12px}.externalBody{padding:17px}.externalBody small{color:#79c94b;text-transform:uppercase;letter-spacing:.08em}.externalBody h3{font-size:16px;line-height:1.4;margin:9px 0}.externalBody p{font-size:13px;color:#c3cbc1}.externalBody .notStocked{color:#e7bd65}.externalBody .button{margin-top:8px}.catalogEmpty{color:#c8d0c5}@media(max-width:900px){.externalGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.catalogIntro form,.externalGrid{grid-template-columns:1fr}.compatibleCatalog{padding:18px}}`}</style>
  </Layout>
}
