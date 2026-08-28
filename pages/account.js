import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function Account(){
  const [user,setUser]=useState(null);
  const [mode,setMode]=useState('login');
  const [form,setForm]=useState({name:'',email:'',phone:'',password:''});
  const [message,setMessage]=useState('');
  const [orders,setOrders]=useState([]);
  const [garage,setGarage]=useState([]);
  const [vin,setVin]=useState('');

  const refresh=async()=>{
    const me=await fetch('/api/auth/me');
    if(!me.ok){setUser(null);return;}
    const meData=await me.json();
    setUser(meData.user);
    const [o,g]=await Promise.all([fetch('/api/orders'),fetch('/api/garage')]);
    if(o.ok) setOrders((await o.json()).orders||[]);
    if(g.ok) setGarage((await g.json()).vehicles||[]);
  };

  useEffect(()=>{refresh()},[]);

  const submit=async e=>{
    e.preventDefault(); setMessage('');
    const endpoint=mode==='login'?'/api/auth/login':'/api/auth/register';
    const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
    const data=await r.json();
    if(!r.ok){setMessage(data.error||'Unable to continue.');return;}
    setMessage(mode==='login'?'Signed in successfully.':'Account created successfully.');
    await refresh();
  };

  const addGarage=async e=>{
    e.preventDefault(); setMessage('');
    const normalized=vin.toUpperCase().trim();
    let decoded={};
    try{
      const d=await fetch(`/api/vin?vin=${encodeURIComponent(normalized)}`);
      if(d.ok) decoded=await d.json();
    }catch{}
    const r=await fetch('/api/garage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vin:normalized,make:decoded.make,model:decoded.model,modelYear:decoded.year,engine:decoded.engine,trim:decoded.trim})});
    const data=await r.json();
    if(!r.ok){setMessage(data.error||'Could not save vehicle.');return;}
    setVin(''); setMessage('Vehicle saved to My Garage.'); await refresh();
  };

  const logout=async()=>{await fetch('/api/auth/logout',{method:'POST'});setUser(null);setOrders([]);setGarage([])};

  return <Layout><section className="pageHero compactHero"><div className="container"><span className="eyebrow">MY SHILATECH</span><h1>Customer account</h1><p>Orders and saved vehicles in one secure place.</p></div></section><section className="section"><div className="container dashboardGrid">
    <div className="dashCard"><span>ORDERS</span><strong>{orders.length}</strong><p>Track your purchase history.</p></div>
    <div className="dashCard"><span>MY GARAGE</span><strong>{garage.length}</strong><p>Saved VINs for faster fitment searches.</p></div>
    <div className="dashCard"><span>ACCOUNT</span><strong>{user?'✓':'—'}</strong><p>{user?user.email:'Sign in to sync your data.'}</p></div>

    {!user && <div className="dashCard wide"><div className="sectionHead"><div><h2>{mode==='login'?'Customer login':'Create account'}</h2><p>Use your email and password to access orders and My Garage.</p></div><button className="textButton" onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?'Create an account':'I already have an account'}</button></div>
      <form className="contactForm" onSubmit={submit}>
        {mode==='register' && <><input placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/><input placeholder="Phone number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></>}
        <input type="email" placeholder="Email address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
        <input type="password" placeholder="Password (minimum 8 characters)" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} minLength="8" required/>
        <button className="button primary" type="submit">{mode==='login'?'Sign in':'Create account'}</button>
      </form>
      {message && <p>{message}</p>}
    </div>}

    {user && <>
      {['admin','warehouse_manager','cashier'].includes(user.role)&&<div className="dashCard wide"><h2>Staff tools</h2><Link className="button primary" href="/pos">Open sales counter</Link></div>}
      <div className="dashCard wide"><div className="sectionHead"><div><h2>My Garage</h2><p>Save a 17-character VIN and we’ll reuse the decoded vehicle details for future searches.</p></div><button className="textButton" onClick={logout}>Sign out</button></div>
        <form className="vinForm" onSubmit={addGarage}><div className="vinInputWrap"><input value={vin} onChange={e=>setVin(e.target.value.toUpperCase())} maxLength="17" placeholder="Enter 17-character VIN"/><span>{vin.length}/17</span></div><button className="button primary">Save vehicle</button></form>
        {message && <p>{message}</p>}
        <div className="adminPanels">{garage.map(v=><div className="panel" key={v.id}><span className="eyebrow">{v.make||'VEHICLE'}</span><h3>{v.modelYear} {v.model||'Saved vehicle'}</h3><p>{v.vin}<br/>{v.engine||''}</p><button className="textButton" onClick={async()=>{await fetch(`/api/garage?id=${v.id}`,{method:'DELETE'});refresh()}}>Remove</button></div>)}</div>
      </div>
      <div className="dashCard wide"><h2>Order history</h2>{!orders.length?<p>No orders yet.</p>:orders.map(o=><div className="panel" key={o.id}><strong>{o.orderNo}</strong><p>{o.status} • {o.paymentStatus} • KSh {Number(o.total).toLocaleString()}</p></div>)}</div>
    </>}
  </div></section></Layout>
}
