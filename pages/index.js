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
    <Layout homeTheme title="Auto Spare Parts in Nairobi, Kenya | Shilatech" description="Find Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo and Ford spare parts at Shilatech in Nairobi. Search by part number and ask for fitment support.">
      <div className="boldHome">
      <section className="hero approvedJeepHero">
        <div className="approvedHeroOverlay" />
        <div className="container approvedHeroInner">
          <div className="approvedHeroCopy">
            <h1>Auto parts for <br/>the <span>road ahead.</span></h1>
            <div className="greenRule" />
            <p>Find auto spare parts in Nairobi for Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo and Ford. Search by part number, check vehicle compatibility and ask our team about delivery across Kenya.</p>
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
          <div className="approvedBenefit"><i>✓</i><div><h3>Parts for your vehicle</h3><p>Compare the listed part type and fitment.</p></div></div>
          <div className="approvedBenefit"><i>▣</i><div><h3>Fast Nationwide Delivery</h3><p>Quick & reliable delivery across Kenya.</p></div></div>
          <div className="approvedBenefit"><i>★</i><div><h3>Clear catalogue prices</h3><p>Check the listed price before ordering.</p></div></div>
          <div className="approvedBenefit"><i>◉</i><div><h3>Expert Support</h3><p>We help you find the right part.</p></div></div>
        </div>
      </section>

      <section className="section vinBand">
        <div className="container vinGrid">
          <div><span className="eyebrow">EXACT FITMENT</span><h2>Find the right spare part with your VIN</h2><p>Enter your 17-character VIN. Use the decoded vehicle details to guide your search, then confirm the part number and fitment with our team before ordering.</p></div>
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
          <p>Shilatech Auto Spares supplies genuine and quality aftermarket parts for premium European and American vehicles. Search our catalogue by vehicle brand, part number or category, use the VIN checker when you need fitment support, and order for delivery in Nairobi and across Kenya.</p>
          <p>Our catalogue covers common service and repair needs including <Link href="/shop?category=Engine">engine parts</Link>, <Link href="/shop?category=Brakes">brake parts</Link>, <Link href="/shop?category=Suspension">suspension parts</Link>, electrical components, filters and other replacement parts. For an exact enquiry, <Link href="/contact">contact Shilatech Auto Spares</Link> with your vehicle details or VIN.</p>
        </div>
      </section>
      <section className="section"><div className="container narrow prose">
        <h2>How to choose the right spare part</h2>
        <p>A vehicle model alone is not always enough to identify a replacement part. Engine type, production year and specification can affect fitment. Start with the number printed on your existing part, then compare the details on the product page.</p>
        <h3>1. Search by part number or vehicle make</h3>
        <p>Use the catalogue to browse brake, suspension and engine components. Each product page lists the information available for that part, including its reference number, price and stock status.</p>
        <h3>2. Confirm compatibility before ordering</h3>
        <p>Have your VIN, vehicle year and engine details ready. If a part number is missing or different, <Link href="/contact">ask the Shilatech team for help</Link> before placing an order.</p>
        <h3>3. Plan collection, delivery or a workshop visit</h3>
        <p>Confirm availability and delivery arrangements for your location. If you need diagnosis or installation advice, <Link href="/workshop">view our workshop services</Link> and discuss your vehicle with the team.</p>
        <h2>Common questions about buying spare parts</h2>
        <h3>Can I order a part that is out of stock?</h3>
        <p>Contact us with the part number and your vehicle details to ask about sourcing and expected availability. An online listing does not mean an out-of-stock item is ready for dispatch.</p>
        <h3>Does a matching model name guarantee the part will fit?</h3>
        <p>No. Compare the part number, year and engine information and confirm compatibility before buying. A VIN lookup helps identify the vehicle but does not replace checking the specific part.</p>
        <h3>What should I check about delivery and returns?</h3>
        <p>Confirm the destination, delivery charges and timing before ordering. Review our <Link href="/delivery-returns">delivery and returns information</Link> before fitting or using a part.</p>
      </div></section>
    </div>
    </Layout>
  );
}


