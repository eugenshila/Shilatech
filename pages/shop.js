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
    const requested = brands.find(b => (router.query.brand || '').toLowerCase().includes(b.toLowerCase().split('-')[0]));
    if (requested) setBrand(requested);
  },[router.isReady, router.query.brand]);

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
        setProducts(fallbackProducts);
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

  return <Layout>
    <section className="pageHero compactHero"><div className="container"><span className="eyebrow">CATALOG</span><h1>Premium parts, precisely matched.</h1><p>Search live inventory by vehicle, part number or category.</p></div></section>
    <section className="section"><div className="container shopLayout">
      <aside className="filters">
        <h3>Filter parts</h3>
        <label>Vehicle make<select value={brand} onChange={e=>setBrand(e.target.value)}><option value="">All makes</option>{brands.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Availability<select value={inStock} onChange={e=>setInStock(e.target.value)}><option value="">All stock</option><option value="yes">In stock</option></select></label>
        <button className="textButton" onClick={()=>{setBrand('');setCategory('');setSearch('');setInStock('')}}>Clear filters</button>
      </aside>
      <div className="catalog">
        {router.query.vin && <div className="fitmentBanner"><strong>VIN-assisted search active</strong><span>{router.query.year} {router.query.brand} {router.query.model}</span></div>}
        <div className="catalogBar">
          <input placeholder="Search part name or number…" value={search} onChange={e=>setSearch(e.target.value)} />
          <select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option></select>
        </div>
        <p className="resultsCount">{loading ? 'Loading live inventory…' : `${list.length} parts found`}</p>
        <div className="productGrid catalogGrid">{list.map(p=><ProductCard key={p.id} product={p}/>)}</div>
        {!loading && !list.length && <div className="emptyState"><h3>No exact match found</h3><p>Try clearing filters or contact us with your VIN and required part.</p></div>}
      </div>
    </div></section>
  </Layout>
}
