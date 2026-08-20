import Layout from '../components/Layout';
export default function Account(){return <Layout><section className="pageHero compactHero"><div className="container"><span className="eyebrow">MY SHILATECH</span><h1>Customer account</h1><p>Orders, saved vehicles, addresses and wishlist in one place.</p></div></section><section className="section"><div className="container dashboardGrid">
  <div className="dashCard"><span>ORDERS</span><strong>0</strong><p>Your future orders will appear here.</p></div>
  <div className="dashCard"><span>MY GARAGE</span><strong>0</strong><p>Save VINs for faster fitment searches.</p></div>
  <div className="dashCard"><span>WISHLIST</span><strong>0</strong><p>Save parts for later.</p></div>
  <div className="dashCard wide"><h2>Account login</h2><p>Secure email/password and optional Google sign-in will connect here when authentication is enabled.</p><button className="button primary">Customer login</button></div>
</div></section></Layout>}
