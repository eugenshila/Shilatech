import Layout from '../components/Layout';
import VinLookup from '../components/VinLookup';

export default function Vin() {
  return <Layout>
    <section className="pageHero"><div className="container narrow"><span className="eyebrow">VIN CHECKER</span><h1>One VIN. The right vehicle. Better part matching.</h1><p>Your VIN is a 17-character identifier usually found on the dashboard, windscreen area, door frame or logbook.</p></div></section>
    <section className="section"><div className="container narrow">
      <div className="vinPanel"><h2>Enter your vehicle VIN</h2><p>We use the NHTSA vPIC decoder for basic make, model, year and engine data. Some non-US-market vehicles may return limited details.</p><VinLookup />
      <div className="vinRules"><strong>VIN rules</strong><span>17 characters</span><span>Letters I, O and Q are excluded</span><span>Numbers and capital letters only</span></div></div>
      <div className="manualFallback"><h3>VIN not available?</h3><p>You can still browse by make, model and part category.</p><a className="button ghost" href="/shop">Search manually</a></div>
    </div></section>
  </Layout>
}
