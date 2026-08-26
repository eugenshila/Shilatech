import { useState } from 'react';
import Layout from '../components/Layout';

const services = [
  ['01','Computer diagnostics','Fault-code scanning, warning-light diagnosis and a clear repair recommendation before work begins.'],
  ['02','Routine servicing','Oil, filters, fluids, plugs and manufacturer-schedule maintenance using quality parts.'],
  ['03','Brakes & suspension','Brake, steering and suspension inspection, replacement and road-safety checks.'],
  ['04','Engine & cooling','Engine performance, leaks, overheating and cooling-system diagnosis and repair.'],
  ['05','Electrical repairs','Battery, charging, starting, lighting, sensors and vehicle electrical fault tracing.'],
  ['06','Pre-purchase inspection','A practical vehicle health inspection before you commit to buying a used car.']
];

const brands = ['Jeep','Mercedes-Benz','Volkswagen','Range Rover','Volvo','Ford'];

export default function Workshop(){
  const [form,setForm]=useState({name:'',phone:'',vehicle:'',registration:'',service:'',preferredDate:'',message:''});
  const update=e=>setForm({...form,[e.target.name]:e.target.value});
  const submit=e=>{
    e.preventDefault();
    const text=[
      'Hello Shilatech Garage, I would like to book a workshop visit.',
      `Name: ${form.name}`, `Phone: ${form.phone}`, `Vehicle: ${form.vehicle}`,
      form.registration && `Registration/VIN: ${form.registration}`,
      `Service: ${form.service}`,
      form.preferredDate && `Preferred date: ${form.preferredDate}`,
      form.message && `Details: ${form.message}`
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/254721802597?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer');
  };
  const schema={'@context':'https://schema.org','@type':'AutoRepair',name:'Shilatech Garage',telephone:'+254721802597',email:'info@shilatechautospares.co.ke',address:{'@type':'PostalAddress',addressLocality:'Nairobi',addressCountry:'KE'},areaServed:{'@type':'City',name:'Nairobi'},brand:brands};

  return <Layout canonicalPath="/workshop" structuredData={schema}>
    <section className="workshopHero"><div className="container workshopHeroGrid">
      <div><span className="eyebrow">SHILATECH GARAGE · NAIROBI</span><h1>Specialist care for premium vehicles.</h1><p>Professional diagnostics, servicing and mechanical repairs backed by the right parts and practical advice. One team from fault finding to final road test.</p><div className="heroButtons"><a className="button primary" href="#booking">Book a workshop visit</a><a className="button ghost" href="tel:+254721802597">Call +254 721 802 597</a></div></div>
      <aside className="workshopHeroCard"><span>WORKSHOP PROMISE</span><strong>Inspect first. Quote clearly. Repair correctly.</strong><ul><li>✓ Diagnosis before parts replacement</li><li>✓ Approval before additional work</li><li>✓ OEM and quality aftermarket options</li><li>✓ Final safety and road check</li></ul></aside>
    </div></section>
    <section className="section"><div className="container"><div className="sectionHead"><div><span className="eyebrow">WORKSHOP SERVICES</span><h2>Repairs you can plan with confidence</h2></div></div><div className="serviceGrid">{services.map(([icon,title,copy])=><article className="serviceCard" key={title}><div className="serviceIcon">{icon}</div><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>
    <section className="section workshopProcess"><div className="container"><div className="sectionHead"><div><span className="eyebrow">HOW IT WORKS</span><h2>From booking to handover</h2></div></div><div className="processGrid"><div className="processStep"><b>STEP 01</b><h3>Book</h3><p>Share the vehicle and the problem you are experiencing.</p></div><div className="processStep"><b>STEP 02</b><h3>Inspect</h3><p>We diagnose the fault and confirm the work required.</p></div><div className="processStep"><b>STEP 03</b><h3>Approve</h3><p>You receive a clear quotation before repairs begin.</p></div><div className="processStep"><b>STEP 04</b><h3>Repair & test</h3><p>We complete the work, check it and explain the result.</p></div></div></div></section>
    <section className="section" id="booking"><div className="container bookingGrid">
      <div className="panel"><span className="eyebrow">REQUEST A BOOKING</span><h2>Tell us about your vehicle</h2><form className="bookingForm" onSubmit={submit}><input name="name" value={form.name} onChange={update} placeholder="Your name" aria-label="Your name" required/><input name="phone" value={form.phone} onChange={update} placeholder="Phone number" aria-label="Phone number" required/><input name="vehicle" value={form.vehicle} onChange={update} placeholder="Vehicle, model and year" aria-label="Vehicle, model and year" required/><input name="registration" value={form.registration} onChange={update} placeholder="Registration or VIN (optional)" aria-label="Registration or VIN"/><select name="service" value={form.service} onChange={update} aria-label="Required service" required><option value="">Select service</option>{services.map(([,title])=><option key={title} value={title}>{title}</option>)}</select><input name="preferredDate" value={form.preferredDate} type="date" aria-label="Preferred date" onChange={update}/><textarea name="message" value={form.message} onChange={update} rows="5" placeholder="Describe the fault, warning light or service needed" aria-label="Repair details"/><button className="button primary" type="submit">Send booking request on WhatsApp</button><p className="bookingNotice">Your request opens in WhatsApp for confirmation. A booking is only final after the workshop confirms the date and time.</p></form></div>
      <aside className="bookingAside"><div className="panel"><h3>Vehicles we specialise in</h3><div className="workshopBrands">{brands.map(brand=><span key={brand}>{brand}</span>)}</div></div><div className="panel"><h3>Contact the workshop</h3><p>Nairobi, Kenya</p><p><a href="tel:+254721802597">+254 721 802 597</a><br/><a href="mailto:info@shilatechautospares.co.ke">info@shilatechautospares.co.ke</a></p><p>For faster diagnosis, include the registration number or 17-character VIN and a photo of any dashboard warning.</p></div></aside>
    </div></section>
  </Layout>;
}

