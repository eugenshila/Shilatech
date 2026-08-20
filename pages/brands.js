import Link from 'next/link';
import Layout from '../components/Layout';

const brands = [
  ['Jeep','Wrangler, Grand Cherokee, Cherokee, Compass, Renegade and more.'],
  ['Mercedes-Benz','C-Class, E-Class, S-Class, GLC, GLE, GLK, Sprinter and more.'],
  ['Volkswagen','Golf, Passat, Tiguan, Touareg, Polo, Amarok and more.'],
  ['Range Rover','Range Rover, Range Rover Sport, Evoque, Velar and Discovery family parts.'],
  ['Volvo','XC60, XC90, S60, S90, V40, V60 and more.'],
  ['Ford','Ranger, Everest, Focus, Escape, Explorer and more.']
];

export default function Brands(){
  return <Layout>
    <section className="pageHero compactHero"><div className="container"><span className="eyebrow">VEHICLE BRANDS</span><h1>Premium parts for the vehicles you drive.</h1><p>Browse Shilatech Autospares by make, or use your VIN for more precise fitment support.</p></div></section>
    <section className="section"><div className="container">
      <div className="brandsPageGrid">
        {brands.map(([name,description])=><div className="brandsPageCard" key={name}><div><h3>{name}</h3><p>{description}</p></div><Link href={`/shop?brand=${encodeURIComponent(name)}`}>Browse {name} parts →</Link></div>)}
      </div>
      <div style={{marginTop:32}}><Link className="button greenPrimary" href="/vin">Find parts by VIN</Link></div>
    </div></section>
  </Layout>
}
