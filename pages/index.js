import Link from 'next/link';
import Layout from '../components/Layout';
import VinLookup from '../components/VinLookup';
import ProductCard from '../components/ProductCard';
import { brands, products } from '../data/products';

export default function Home() {
  return (
    <Layout>
      <section className="hero">
        <div className="container heroGrid">
          <div className="heroCopy">
            <span className="eyebrow">PREMIUM AUTOMOTIVE PARTS • NAIROBI</span>
            <h1>Precision parts.<br/><span>Confidence on every drive.</span></h1>
            <p>Genuine and quality aftermarket parts for Jeep, Mercedes-Benz, Volkswagen, Range Rover and Volvo — backed by specialist fitment support.</p>
            <div className="heroButtons"><Link className="button primary" href="/shop">Shop parts</Link><Link className="button ghost" href="/vin">Find by VIN</Link></div>
            <div className="heroStats"><div><strong>5</strong><span>Premium makes</span></div><div><strong>VIN</strong><span>Fitment lookup</span></div><div><strong>KE</strong><span>Nationwide delivery</span></div></div>
          </div>
          <div className="heroVisual">
            <div className="metalRing"><div className="ringInner"><span>SHILATECH</span><b>AUTOSPARES</b><small>PREMIUM PARTS SPECIALIST</small></div></div>
            <div className="glowLine"></div>
          </div>
        </div>
      </section>

      <section className="brandStrip">
        <div className="container">
          <p>Specialist parts for</p>
          <div className="brandLogos">{brands.map(b=><span key={b}>{b}</span>)}</div>
        </div>
      </section>

      <section className="section vinBand">
        <div className="container vinGrid">
          <div><span className="eyebrow">EXACT FITMENT</span><h2>Find the right part with your VIN</h2><p>Enter your 17-character VIN. We decode your vehicle details and narrow the catalog to matching parts.</p></div>
          <VinLookup compact />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="sectionHead"><div><span className="eyebrow">CURATED INVENTORY</span><h2>Featured parts</h2></div><Link href="/shop">View all parts →</Link></div>
          <div className="productGrid">{products.slice(0,4).map(p=><ProductCard key={p.id} product={p}/>)}</div>
        </div>
      </section>

      <section className="section trustSection">
        <div className="container trustGrid">
          {[['✓','Genuine & verified','Carefully sourced OEM and quality aftermarket options.'],['◇','Fitment support','VIN-assisted matching before you buy.'],['↗','Fast delivery','Local and nationwide delivery options across Kenya.'],['★','Warranty support','Clear warranty and returns policies on eligible items.']].map(x=><div className="trustCard" key={x[1]}><i>{x[0]}</i><h3>{x[1]}</h3><p>{x[2]}</p></div>)}
        </div>
      </section>

      <section className="section quoteSection">
        <div className="container quoteBox"><span className="eyebrow">WHY SHILATECH</span><h2>Parts expertise without the guesswork.</h2><p>“Our goal is simple: help every customer identify the correct part, understand the options and get back on the road with confidence.”</p><Link href="/about" className="button ghost">Our story</Link></div>
      </section>
    </Layout>
  );
}
