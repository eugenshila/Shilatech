import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from './CartContext';

export default function Layout({ children, title = 'Shilatech Autospares' }) {
  const router = useRouter();
  const { count } = useCart();
  const links = [['/','Home'],['/shop','Shop'],['/brands','Brands'],['/about','About Us'],['/contact','Contact']];

  return (
    <>
      <header className="siteHeader premiumHeader">
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
            <span className="premiumBrandIcon">⚙</span>
            <span><strong>SHILATECH</strong><small>AUTO SPARES</small></span>
          </Link>

          <nav aria-label="Main navigation">
            {links.map(([href,label]) => {
              const active = href === '/' ? router.pathname === '/' : router.pathname.startsWith(href);
              return <Link key={href} className={active ? 'active' : ''} href={href}>{label}</Link>;
            })}
          </nav>

          <div className="navActions premiumNavActions">
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
            <div className="brand footerBrand premiumBrand"><span className="premiumBrandIcon">⚙</span><span><strong>SHILATECH</strong><small>AUTO SPARES</small></span></div>
            <p>Specialist parts for Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo and Ford.</p>
          </div>
          <div><h4>Shop</h4><Link href="/shop">All parts</Link><Link href="/brands">Vehicle brands</Link><Link href="/vin">VIN checker</Link><Link href="/cart">Cart</Link></div>
          <div><h4>Support</h4><Link href="/faq">FAQ</Link><Link href="/delivery-returns">Delivery & Returns</Link><Link href="/contact">Contact</Link></div>
          <div><h4>Dealer</h4><Link href="/admin">Admin dashboard</Link><p>Secure inventory and order management.</p></div>
        </div>
        <div className="container copyright">© {new Date().getFullYear()} Shilatech Autospares. All rights reserved.</div>
      </footer>
    </>
  );
}
