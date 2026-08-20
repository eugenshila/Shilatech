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

  const seoTitle = brand ? `${brand} Spare Parts Kenya | Shilatech Auto Spares` : category ? `${category} Auto Parts Kenya | Shilatech Auto Spares` : undefined;
  const seoDescription = brand ? `Shop available ${brand} spare parts in Nairobi, Kenya. Search genuine and quality aftermarket parts by part number and category, with VIN fitment support and nationwide delivery.` : undefined;

  return <Layout title={seoTitle} description={seoDescription}>
    <section className="pageHero compactHero"><div className="container"><span className="eyebrow">CATALOG</span><h1>{brand ? `${brand} parts` : category ? `${category} parts` : 'Premium parts, precisely matched.'}</h1><p>{brand ? `Browse currently available ${brand} spare parts, then refine by category, availability or part number.` : 'Search live inventory by vehicle, part number or category.'}</p></div></section>
    <section className="section"><div className="container shopLayout">
      <aside className="filters">
        <h3>Filter parts</h3>
        <label>Vehicle make<select value={brand} onChange={e=>setBrand(e.target.value)}><option value="">All makes</option>{brands.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Availability<select value={inStock} onChange={e=>setInStock(e.target.value)}><option value="">All stock</option><option value="yes">In stock</option></select></label>
        <button className="textButton" onClick={clearFilters}>Clear filters</button>
      </aside>
      <div className="catalog">
        {brand && <div className="fitmentBanner"><strong>{brand} catalog</strong><span>{loading ? 'Checking live inventory…' : `${list.length} available part${list.length===1?'':'s'}`}</span></div>}
        {router.query.vin && <div className="fitmentBanner"><strong>VIN-assisted search active</strong><span>{router.query.year} {router.query.brand} {router.query.model}</span></div>}
        <div className="catalogBar">
          <input placeholder="Search part name or number…" value={search} onChange={e=>setSearch(e.target.value)} />
          <select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option></select>
        </div>
        <p className="resultsCount">{loading ? 'Loading live inventory…' : `${list.length} parts found`}</p>
        <div className="productGrid catalogGrid">{list.map(p=><ProductCard key={p.id} product={p}/>)}</div>
        {!loading && !list.length && <div className="emptyState"><h3>No {brand ? `${brand} ` : ''}parts listed yet</h3><p>Try another filter or contact us with your VIN and required part. We can source parts that are not yet listed online.</p></div>}
      </div>
    </div></section>
  </Layout>
}
