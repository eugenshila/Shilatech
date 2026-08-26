import Link from 'next/link';
import Layout from '../components/Layout';
import VinLookup from '../components/VinLookup';
import ProductCard from '../components/ProductCard';
import { products } from '../data/products';

const makes = [
  { name: 'Jeep', src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Jeep_logo.svg' },
  { name: 'Mercedes-Benz', src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mercedes_benz_logo1989.png' },
  { name: 'Volkswagen', src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Volkswagen_logo.png' },
  { name: 'Range Rover', src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Land_Rover_logo_2.jpg' },
  { name: 'Volvo', src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Volvo-iron-mark-2021.jpg' },
  { name: 'Ford', src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ford_Logo.png' }
];

export default function Home() {
  return (
    <Layout>
      <section className="hero approvedJeepHero">
        <div className="approvedHeroOverlay" />
        <div className="container approvedHeroInner">
          <div className="approvedHeroCopy">
            <h1>PREMIUM PARTS FOR<br/><span>PREMIUM PERFORMANCE</span></h1>
            <div className="greenRule" />
            <p>Genuine & OEM quality auto spare parts in Nairobi, Kenya for Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo & Ford, with delivery across Kenya.</p>
            <div className="heroButtons approvedHeroButtons">
              <Link className="button greenPrimary" href="/shop">🛒 SHOP NOW</Link>
              <Link className="button vehicleButton" href="/vin">▣ SELECT YOUR VEHICLE</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="approvedBrandsSection">
        <div className="container approvedBrandPanel">
          {makes.map((make) => (
            <Link className="approvedBrandItem clickableBrand" key={make.name} href={`/shop?brand=${encodeURIComponent(make.name)}`} aria-label={`View available ${make.name} spare parts in Kenya`}>
              <div className="approvedLogoWrap"><img src={make.src} alt={`${make.name} spare parts brand logo`} /></div>
              <strong>{make.name.toUpperCase()}</strong>
              <span className="brandBrowseHint">VIEW AVAILABLE PARTS →</span>
            </Link>
          ))}
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
    </Layout>
  );
}

