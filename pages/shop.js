import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { products, brands, categories } from '../data/products';

export default function Shop() {
  const router = useRouter();
  const initialBrand = brands.find(b => (router.query.brand || '').toLowerCase().includes(b.toLowerCase().split('-')[0])) || '';
  const [brand,setBrand]=useState(initialBrand);
  const [category,setCategory]=useState('');
  const [search,setSearch]=useState('');
  const [sort,setSort]=useState('featured');

  const list = useMemo(() => {
    let out = products.filter(p =>
      (!brand || p.brand===brand) &&
      (!category || p.category===category) &&
      (!search || `${p.name} ${p.partNo} ${p.brand} ${p.models.join(' ')}`.toLowerCase().includes(search.toLowerCase()))
    );
    if(sort==='price-low') out=[...out].sort((a,b)=>a.price-b.price);
    if(sort==='price-high') out=[...out].sort((a,b)=>b.price-a.price);
    return out;
  },[brand,category,search,sort]);

  return <Layout>
    <section className="pageHero compactHero"><div className="container"><span className="eyebrow">CATALOG</span><h1>Premium parts, precisely matched.</h1><p>Search by vehicle, part number or category.</p></div></section>
    <section className="section"><div className="container shopLayout">
      <aside className="filters">
        <h3>Filter parts</h3>
        <label>Vehicle make<select value={brand} onChange={e=>setBrand(e.target.value)}><option value="">All makes</option>{brands.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Availability<select><option>All stock</option><option>In stock</option><option>Backorder</option></select></label>
        <button className="textButton" onClick={()=>{setBrand('');setCategory('');setSearch('')}}>Clear filters</button>
      </aside>
      <div className="catalog">
        {router.query.vin && <div className="fitmentBanner"><strong>VIN-assisted search active</strong><span>{router.query.year} {router.query.brand} {router.query.model}</span></div>}
        <div className="catalogBar">
          <input placeholder="Search part name or number…" value={search} onChange={e=>setSearch(e.target.value)} />
          <select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option></select>
        </div>
        <p className="resultsCount">{list.length} parts found</p>
        <div className="productGrid catalogGrid">{list.map(p=><ProductCard key={p.id} product={p}/>)}</div>
        {!list.length && <div className="emptyState"><h3>No exact match found</h3><p>Try clearing filters or contact us with your VIN and required part.</p></div>}
      </div>
    </div></section>
  </Layout>
}
