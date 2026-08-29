import Layout from '../components/Layout';

const milestones=[
 ['The beginning','Shilatech Autospares began as a small, customer-focused spare-parts shop with a simple purpose: help motorists and garages find the correct part without unnecessary delay or guesswork.'],
 ['Building specialist knowledge','As customer needs grew, we developed deeper knowledge of Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo and Ford vehicles. This specialist approach helped us support accurate part identification, practical fitment guidance and better purchasing decisions.'],
 ['Growing our service network','We expanded from serving walk-in customers to supporting independent garages, professional mechanics, vehicle owners and commercial clients. Quotations, organised sourcing and delivery became part of a more complete customer service model.'],
 ['Developing warehouse operations','The next stage of our growth brought structured receiving, brand-specific storage, picking, dispatch and returns into one connected warehouse operation. This allows every part to move through a clear, accountable process from arrival to customer collection or delivery.'],
 ['Serving Kenya and East Africa','Today, Shilatech is building a modern automotive parts business designed to serve customers across Kenya and the wider East African market through dependable stock management, digital ordering and knowledgeable support.']
];

export default function About(){return <Layout title="About Shilatech Autospares | Our Story and Growth"><section className="pageHero aboutHero"><div className="container narrow"><span className="eyebrow">OUR STORY</span><h1>From a small parts shop to a modern warehouse operation.</h1><p>Shilatech Autospares has grown around one lasting principle: every customer deserves the correct automotive part, clear guidance and dependable service.</p></div></section>

<section className="section aboutStory"><div className="container narrow prose"><span className="eyebrow">HOW WE HAVE GROWN</span><h2>A business built one customer relationship at a time</h2><p>Our journey reflects the needs of the motorists and workshops we serve. What started as a focused spare-parts shop has developed into an organised business model that brings specialist product knowledge, warehouse control, sales support and delivery together in one place.</p>

<div className="timeline">{milestones.map(([title,text],index)=><article key={title}><div className="step">{String(index+1).padStart(2,'0')}</div><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>

<h2>Our specialist focus</h2><p>We supply original, OEM and carefully selected quality aftermarket parts for Jeep, Mercedes-Benz, Volkswagen, Range Rover, Volvo and Ford vehicles. Our team supports customers with part-number checks, vehicle fitment guidance and clear product options.</p>

<h2>A one-stop automotive parts partner</h2><p>Shilatech brings catalogue search, quotations, customer accounts, warehouse operations, counter sales, dispatch and after-sales support into one connected service. This structure helps us serve an individual vehicle owner with the same care and accountability expected by a professional garage or commercial customer.</p>

<div className="values"><article><h3>Correct parts</h3><p>We prioritise accurate identification and compatibility before a sale is completed.</p></article><article><h3>Accountable service</h3><p>Our receiving, storage, sales and dispatch processes are designed to create a clear transaction record.</p></article><article><h3>Responsible growth</h3><p>We are developing systems that can support additional branches while maintaining consistent standards.</p></article></div>

<h2>Looking ahead</h2><p>Our ambition is to become a trusted specialist source for automotive spare parts in Kenya and East Africa. We are investing in stronger stock control, digital customer service, professional workshop relationships and scalable operations so that customers can obtain the right part wherever they are.</p>

<h2>Our promise</h2><p>Clear part identification, transparent original, OEM and aftermarket choices, practical support and dependable fulfilment.</p></div></section>

<style jsx>{`.aboutHero{background:linear-gradient(90deg,rgba(2,7,2,.92),rgba(2,7,2,.62)),url('/shilatech-logo.webp') center/cover no-repeat}.aboutStory{background:linear-gradient(180deg,#071007,#050806)}.aboutStory h2{color:#83ce51}.timeline{margin:34px 0 54px;border-left:2px solid #58b72a}.timeline article{display:grid;grid-template-columns:58px 1fr;gap:20px;padding:0 0 34px 22px}.timeline article:last-child{padding-bottom:0}.step{width:46px;height:46px;margin-left:-46px;border:2px solid #58b72a;border-radius:50%;display:grid;place-items:center;background:#071007;color:#83ce51;font-weight:800}.timeline h3{margin:4px 0 8px;color:#f4f6f1;font-size:23px}.timeline p{margin:0}.values{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:28px 0 52px}.values article{padding:22px;border:1px solid #39512e;border-radius:10px;background:rgba(8,20,7,.82)}.values h3{margin-top:0;color:#83ce51}.values p{margin-bottom:0}@media(max-width:700px){.values{grid-template-columns:1fr}.timeline article{grid-template-columns:44px 1fr;gap:12px;padding-left:14px}.step{width:40px;height:40px;margin-left:-35px}}`}</style></Layout>}
