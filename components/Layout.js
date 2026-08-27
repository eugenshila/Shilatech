import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from './CartContext';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shilatech-auto-spares-production.up.railway.app').replace(/\/$/, '');

const seoByPath = {
  '/': {
    title: 'Auto Spare Parts Kenya | Jeep, Mercedes, VW, Range Rover, Volvo & Ford | Shilatech',
    description: 'Shop genuine and quality aftermarket auto spare parts in Nairobi, Kenya for Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo and Ford. VIN parts lookup and delivery across Kenya.'
  },
  '/shop': {
    title: 'Shop Auto Spare Parts in Kenya | Shilatech Auto Spares',
    description: 'Browse live stock of Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo and Ford spare parts in Kenya. Search by part number, vehicle brand and category.'
  },
  '/brands': {
    title: 'Car Spare Parts Brands Kenya | Jeep, Mercedes, VW, Range Rover, Volvo & Ford',
    description: 'Find vehicle-specific spare parts for Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo and Ford from Shilatech Auto Spares in Nairobi, Kenya.'
  },
  '/vin': {
    title: 'VIN Parts Lookup Kenya | Find Compatible Auto Parts | Shilatech',
    description: 'Use your 17-character VIN to identify your vehicle and find compatible spare parts for Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo and Ford.'
  },
  '/about': {
    title: 'About Shilatech Auto Spares | Premium Auto Parts Kenya',
    description: 'Learn about Shilatech Auto Spares, a Nairobi specialist in genuine and aftermarket spare parts for premium European and American vehicle brands.'
  },
  '/contact': {
    title: 'Contact Shilatech Auto Spares Nairobi | Parts Enquiries Kenya',
    description: 'Contact Shilatech Auto Spares in Nairobi for Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo and Ford spare parts, VIN checks and delivery enquiries.'
  },
  '/workshop': {
    title: 'Car Repair Workshop Nairobi | Shilatech Garage',
    description: 'Book diagnostics, servicing and mechanical repairs in Nairobi for Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo and Ford vehicles at Shilatech Garage.'
  },
  '/faq': {
    title: 'Auto Spare Parts FAQ Kenya | Shilatech Auto Spares',
    description: 'Answers about vehicle fitment, VIN checking, genuine and aftermarket parts, payments, delivery and returns from Shilatech Auto Spares Kenya.'
  },
  '/delivery-returns': {
    title: 'Auto Parts Delivery & Returns Kenya | Shilatech Auto Spares',
    description: 'Information on spare-parts delivery across Kenya, returns, warranty handling and factory-defect procedures at Shilatech Auto Spares.'
  }
};

const privatePaths = ['/admin','/warehouse','/delivery','/account','/cart','/checkout'];

export default function Layout({ children, title, description, image, canonicalPath, noindex = false, structuredData, homeTheme = false }) {
  const router = useRouter();
  const routeSeo = seoByPath[router.pathname] || {};
  const pageTitle = title || routeSeo.title || 'Shilatech Auto Spares | Premium Auto Parts Kenya';
  const pageDescription = description || routeSeo.description || 'Genuine and quality aftermarket Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo and Ford spare parts in Nairobi with delivery across Kenya.';
  const shouldNoindex = noindex || privatePaths.some(p => router.pathname === p || router.pathname.startsWith(`${p}/`));
  const path = canonicalPath || (router.asPath || '/').split('?')[0].split('#')[0];
  const canonical = `${SITE_URL}${path === '/' ? '' : path}`;
  const socialImage = image || `${SITE_URL}/shilatech-logo.webp`;
  const { count } = useCart();
  const links = [['/','Home'],['/shop','Shop'],['/brands','Brands'],['/workshop','Workshop'],['/about','About Us'],['/contact','Contact']];

  const businessSchema = {
    '@context':'https://schema.org',
    '@type':'AutoPartsStore',
    name:'Shilatech Auto Spares',
    url:SITE_URL,
    logo:`${SITE_URL}/shilatech-logo.webp`,
    telephone:'+254721802597',
    email:'info@shilatechautospares.co.ke',
    areaServed:{'@type':'Country',name:'Kenya'},
    address:{'@type':'PostalAddress',addressLocality:'Nairobi',addressCountry:'KE'},
    brand:['Jeep','Mercedes-Benz','Volkswagen','Range Rover','Volvo','Ford']
  };

  const websiteSchema = {
    '@context':'https://schema.org',
    '@type':'WebSite',
    name:'Shilatech Auto Spares',
    url:SITE_URL,
    potentialAction:{'@type':'SearchAction',target:`${SITE_URL}/shop?q={search_term_string}`,'query-input':'required name=search_term_string'}
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription}/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="icon" type="image/png" href="/favicon.png"/>
        <link rel="apple-touch-icon" href="/favicon.png"/>
        <meta name="robots" content={shouldNoindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}/>
        <link rel="canonical" href={canonical}/>
        <meta property="og:type" content="website"/>
        <meta property="og:site_name" content="Shilatech Auto Spares"/>
        <meta property="og:title" content={pageTitle}/>
        <meta property="og:description" content={pageDescription}/>
        <meta property="og:url" content={canonical}/>
        <meta property="og:image" content={socialImage}/>
        <meta name="twitter:card" content="summary_large_image"/>
        <meta name="twitter:title" content={pageTitle}/>
        <meta name="twitter:description" content={pageDescription}/>
        <meta name="twitter:image" content={socialImage}/>
        {!shouldNoindex && <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(businessSchema)}}/>}
        {!shouldNoindex && router.pathname==='/' && <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(websiteSchema)}}/>}
        {!shouldNoindex && structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData)}}/>}
      </Head>

      <header className={`siteHeader premiumHeader${homeTheme ? ' boldHeader' : ''}`}>
        <div className="premiumTopbar">
          <div className="container premiumTopbarInner">
            <div className="topContact">
              <span>☎ +254 721 802 597</span>
              <span>✉ info@shilatechautospares.co.ke</span>
            </div>
            <div className="topBenefits">
              <span>▣ Fast Delivery Across Kenya</span>
              <span>♢ Original Parts Guarantee</span>
              <span>▢ Secure Payments</span>
            </div>
          </div>
        </div>

        <div className="navWrap container premiumNav">
          <Link href="/" className="brand premiumBrand" aria-label="Shilatech Autospares home">
            <img className="siteLogo" src="/shilatech-logo-small.webp" alt="Shilatech Auto Spares"/>
            <span className="siteBrandWords"><strong>SHILATECH</strong><small>AUTO SPARES</small></span>
          </Link>

          <nav aria-label="Main navigation">
            {links.map(([href,label]) => {
              const active = href === '/' ? router.pathname === '/' : router.pathname.startsWith(href);
              return <Link key={href} className={active ? 'active' : ''} href={href}>{label}</Link>;
            })}
          </nav>

          <div className="navActions premiumNavActions">
            {homeTheme && <a className="boldNavWhatsapp" href="https://wa.me/254721802597" target="_blank" rel="noopener noreferrer">WhatsApp us ↗</a>}
            <form className="navSearch" action="/shop" method="get">
              <input name="q" placeholder="Search parts, brands..." aria-label="Search parts"/>
              <button type="submit" aria-label="Search">⌕</button>
            </form>
            <Link href="/account" aria-label="Account" className="navIconLink">♙</Link>
            <Link href="/cart" className="cartIconLink" aria-label={`Cart with ${count} items`}><span>🛒</span><b>{count}</b></Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer>
        <div className="container footerGrid">
          <div>
            <div className="brand footerBrand premiumBrand">
              <img className="footerLogo" src="/shilatech-logo.webp" alt="Shilatech Auto Spares"/>
              <span className="siteBrandWords"><strong>SHILATECH</strong><small>AUTO SPARES</small></span>
            </div>
            <p>Specialist parts for Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo and Ford.</p>
          </div>
          <div><h4>Shop</h4><Link href="/shop">All parts</Link><Link href="/brands">Vehicle brands</Link><Link href="/vin">VIN checker</Link><Link href="/cart">Cart</Link></div>
          <div><h4>Support</h4><Link href="/workshop">Book a repair</Link><Link href="/faq">FAQ</Link><Link href="/delivery-returns">Delivery & Returns</Link><Link href="/contact">Contact</Link></div>
          <div><h4>Dealer</h4><Link href="/admin">Admin dashboard</Link><p>Secure inventory and order management.</p></div>
        </div>
        <div className="container copyright">© {new Date().getFullYear()} Shilatech Autospares. All rights reserved.</div>
      </footer>
    </>
  );
}

