import Link from 'next/link';
import Layout from '../components/Layout';
import BrandLogoLinks from '../components/BrandLogoLinks';
import VinLookup from '../components/VinLookup';
import ProductCard from '../components/ProductCard';
import { products, brands, categories } from '../data/products';

const categoryCards = [
  { name: 'Braking', category: 'Brakes', image: 'brakes', description: 'Pads, discs, calipers & components' },
  { name: 'Suspension', category: 'Suspension', image: 'suspension', description: 'Shocks, struts, control arms & more' },
  { name: 'Engine parts', category: 'Engine', image: 'engine', description: 'Filters, belts, sensors & engine components' }
];

export default function Home() {
  return (
    <Layout homeTheme>
      <div className="boldHome">
      <section className="hero approvedJeepHero">
        <div className="approvedHeroOverlay" />
        <div className="container approvedHeroInner">
          <div className="approvedHeroCopy">
            <h1>Built for <br/>the <span>road <br/>ahead.</span></h1>
            <div className="greenRule" />
            <p>Genuine & OEM quality auto spare parts in Nairobi, Kenya for Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo & Ford, with delivery across Kenya.</p>
            <div className="heroButtons approvedHeroButtons">
              <Link className="button greenPrimary" href="/shop">SHOP PARTS</Link>
              <a className="button vehicleButton" href="https://wa.me/254721802597" target="_blank" rel="noopener noreferrer">WHATSAPP US ↗</a>
            </div>
          </div>
        </div>
      </section>

      <section className="boldDiscovery" aria-label="Find and browse parts">
        <div className="container">
          <form className="boldFinder" action="/shop" method="get">
            <div className="boldFinderIntro"><span className="boldFinderIcon" aria-hidden="true">⌕</span><div><h2>Find parts for your vehicle</h2><p>Search the catalogue. <Link href="/vin">Check exact fit with your VIN →</Link></p></div></div>
            <label>Make<select name="brand" defaultValue=""><option value="">All makes</option>{brands.map(brand => <option key={brand}>{brand}</option>)}</select></label>
            <label>Category<select name="category" defaultValue=""><option value="">All categories</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
            <label>Part name / number<input name="q" placeholder="Optional" /></label>
            <button className="button greenPrimary" type="submit">Find parts →</button>
          </form>
          <BrandLogoLinks />
          <div className="boldCategories">{categoryCards.map(card => <Link className="boldCategory" key={card.category} href={`/shop?category=${card.category}`}>
            <img src={`/images/category-${card.image}.webp`} alt="" width="768" height="512" loading="lazy" />
            <div><h2>{card.name}</h2><p>{card.description}</p><span>Shop now <b aria-hidden="true">↗</b></span></div>
          </Link>)}</div>
        </div>
      </section>

      <section className="approvedBenefits">
        <div className="container approvedBenefitsGrid">
          <div className="approvedBenefit"><i>✓</i><div><h3>100% Genuine Parts</h3><p>We stock original and OEM quality parts.</p></div></div>
          <div className="approvedBenefit"><i>▣</i><div><h3>Fast Nationwide Delivery</h3><p>Quick & reliable delivery across Kenya.</p></div></div>
          <div className="approvedBenefit"><i>★</i><div><h3>Best Prices Guarantee</h3><p>Competitive prices on all parts.</p></div></div>
          <div className="approvedBenefit"><i>◉</i><div><h3>Expert Support</h3><p>We help you find the right part.</p></div></div>
        </div>
      </section>

      <section className="section vinBand">
        <div className="container vinGrid">
          <div><span className="eyebrow">EXACT FITMENT</span><h2>Find the right spare part with your VIN</h2><p>Enter your 17-character VIN. We decode your vehicle details and narrow the catalog to matching parts, helping reduce wrong-part orders.</p></div>
          <VinLookup compact />
        </div>
      </section>

      <section className="section workshopHomeBand">
        <div className="container workshopHomeGrid">
          <div>
            <span className="eyebrow">SHILATECH GARAGE · NAIROBI</span>
            <h2>Parts, diagnostics and repairs under one roof.</h2>
            <p>Let our workshop inspect, service and repair your vehicle using the correct parts from our catalogue. We specialise in Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo and Ford.</p>
          </div>
          <div className="workshopHomeActions">
            <Link className="button primary" href="/workshop#booking">Book a workshop visit</Link>
            <Link className="button ghost" href="/workshop">View repair services</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="sectionHead"><div><span className="eyebrow">CURATED INVENTORY</span><h2>Featured auto spare parts</h2></div><Link href="/shop">View all parts →</Link></div>
          <div className="productGrid">{products.slice(0,4).map(p=><ProductCard key={p.id} product={p}/>)}</div>
        </div>
      </section>

      <section className="section seoIntroSection">
        <div className="container">
          <span className="eyebrow">AUTO PARTS SPECIALIST · NAIROBI, KENYA</span>
          <h2>Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo & Ford spare parts in Kenya</h2>
          <p>Shilatech Auto Spares supplies genuine and quality aftermarket parts for premium European and American vehicles. Search our live inventory by vehicle brand, part number or category, use the VIN checker when you need fitment support, and order for delivery in Nairobi and across Kenya.</p>
          <p>Our catalogue covers common service and repair needs including <Link href="/shop?category=Engine">engine parts</Link>, <Link href="/shop?category=Brakes">brake parts</Link>, <Link href="/shop?category=Suspension">suspension parts</Link>, electrical components, filters and other replacement parts. For an exact enquiry, <Link href="/contact">contact Shilatech Auto Spares</Link> with your vehicle details or VIN.</p>
        </div>
      </section>
    </div>
    </Layout>
  );
}


