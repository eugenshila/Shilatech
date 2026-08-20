import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from './CartContext';

export default function Layout({ children, title = 'Shilatech Autospares' }) {
  const router = useRouter();
  const { count } = useCart();
  const links = [['/shop','Shop'],['/vin','VIN Checker'],['/about','About'],['/contact','Contact']];

  return (
    <>
      <header className="siteHeader">
        <div className="topbar">Premium parts specialist • Nairobi, Kenya • Genuine & quality aftermarket parts</div>
        <div className="navWrap container">
          <Link href="/" className="brand">
            <span className="brandMark">S</span>
            <span><strong>SHILATECH</strong><small>AUTOSPARES</small></span>
          </Link>
          <nav>
            {links.map(([href,label]) => <Link key={href} className={router.pathname===href?'active':''} href={href}>{label}</Link>)}
          </nav>
          <div className="navActions">
            <Link href="/account" aria-label="Account">Account</Link>
            <Link href="/cart" className="cartPill">Cart <b>{count}</b></Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer>
        <div className="container footerGrid">
          <div>
            <div className="brand footerBrand"><span className="brandMark">S</span><span><strong>SHILATECH</strong><small>AUTOSPARES</small></span></div>
            <p>Specialist parts for Jeep, Mercedes-Benz, Volkswagen, Range Rover and Volvo.</p>
          </div>
          <div><h4>Shop</h4><Link href="/shop">All parts</Link><Link href="/vin">VIN checker</Link><Link href="/cart">Cart</Link></div>
          <div><h4>Support</h4><Link href="/faq">FAQ</Link><Link href="/delivery-returns">Delivery & Returns</Link><Link href="/contact">Contact</Link></div>
          <div><h4>Dealer</h4><Link href="/admin">Admin dashboard</Link><p>Secure inventory and order management.</p></div>
        </div>
        <div className="container copyright">© {new Date().getFullYear()} Shilatech Autospares. All rights reserved.</div>
      </footer>
    </>
  );
}
