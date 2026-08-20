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
            <p>Genuine & OEM quality parts for Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo & Ford.</p>
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
            <Link className="approvedBrandItem clickableBrand" key={make.name} href={`/shop?brand=${encodeURIComponent(make.name)}`} aria-label={`View available ${make.name} parts`}>
              <div className="approvedLogoWrap"><img src={make.src} alt={`${make.name} logo`} /></div>
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
    </Layout>
  );
}
