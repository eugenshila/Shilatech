import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import {staffDestination} from '../lib/staff-access.mjs';

export default function StaffLogin(){
 const router=useRouter();
 const [email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const submitting=useRef(false);
 useEffect(()=>{
  if(!router.isReady)return;
  let current=true;
  fetch('/api/auth/me').then(async r=>{
   if(!r.ok)return;const data=await r.json();
   const destination=data.user?.mustChangePassword?'/staff-password':staffDestination(data.user?.role,router.query.next);
   if(current&&destination)await router.replace(destination);
  }).catch(()=>{});
  return ()=>{current=false;};
 },[router.isReady,router.query.next]);
 async function submit(e){
  e.preventDefault();if(submitting.current)return;
  submitting.current=true;setBusy(true);setError('');
  try{
   const response=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,staffOnly:true})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||'Could not sign in.');
   const destination=data.user?.mustChangePassword?'/staff-password':staffDestination(data.user?.role,router.query.next);
   if(!destination)throw new Error('An authorised staff account is required.');
   setPassword('');await router.replace(destination);
  }catch(e){setError(e.message||'Unable to connect. Please try again.');}
  finally{submitting.current=false;setBusy(false);}
 }
 return <Layout title="Staff Sign In | Shilatech" noindex>
  <section className="staffLoginTheme">
   <form className="staffLoginCard" onSubmit={submit}>
    <span className="loginEyebrow">SHILATECH · EMPLOYEE ACCESS</span>
    <h1>Staff sign in</h1>
    <p>Use your existing staff email and password. You will be taken to the tools allowed for your staff role.</p>
    {error&&<p className="loginError" role="alert">{error}</p>}
    <label htmlFor="staffEmail">Staff email</label>
    <input id="staffEmail" type="email" autoComplete="username" required autoFocus value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/>
    <label htmlFor="staffPassword">Password</label>
    <input id="staffPassword" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/>
    <button className="loginSubmit" disabled={busy}>{busy?'Signing in…':'Sign in to staff portal'}</button>
    <p>Staff accounts are created by your administrator. Customer accounts cannot access staff tools.</p>
    <Link href="/account">Customer login instead</Link>
   </form>
   <section className="loginBrands" aria-label="Vehicle brands">
    <p>THE BRANDS WE SPECIALISE IN</p>
    <div className="loginLogos">
     {[['Jeep','jeep-black.jpg'],['Mercedes-Benz','mercedes-benz-black.png'],['Volkswagen','volkswagen-black.png'],['Land Rover and Range Rover','land-rover-black.png'],['Volvo','volvo-black.png'],['Ford','ford.png']].map(([name,file])=><img key={name} src={'/images/brand-logos/'+file} alt={name+' logo'} width="160" height="112"/>)}
    </div>
   </section>
  </section>
  <style jsx>{`
   .staffLoginTheme{background:#050805;color:#e7eee3;padding:56px 24px;min-height:65vh;font-family:inherit}
   .staffLoginCard{box-sizing:border-box;width:100%;max-width:520px;margin:0 auto;background:linear-gradient(120deg,#101a0c,#080d08);border:1px solid #304427;border-radius:18px;padding:36px}
   .loginEyebrow{color:#90c86b;font-size:11px;letter-spacing:.16em}
   h1{color:#72bf38;font-size:34px;margin:20px 0;line-height:1.25}
   p{color:#d6dfd1;line-height:1.7}
   label{display:block;margin:18px 0 8px;color:#e7eee3}
   input{display:block;box-sizing:border-box;width:100%;background:#080d08;color:#f3f8ef;border:1px solid #526b43;border-radius:6px;padding:13px;font:inherit}
   input:focus-visible{outline:2px solid #90c86b;outline-offset:3px}
   input:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px #101a0c inset;-webkit-text-fill-color:#f3f8ef;caret-color:#f3f8ef}
   .loginSubmit{display:block;width:100%;margin-top:24px;padding:14px 20px;background:#63b522;color:#071003;border:1px solid #63b522;border-radius:6px;font:inherit;font-weight:700;cursor:pointer}
   .loginSubmit:focus-visible{outline:3px solid #b9e899;outline-offset:4px}
   .loginSubmit:disabled{opacity:.7;cursor:wait}
   .staffLoginCard :global(a){color:#a7d68b;text-decoration:underline;text-underline-offset:4px}
   .loginError{background:#321b17;color:#ffd6ca;border:1px solid #b77c64;padding:12px;border-radius:6px}
   .loginBrands{max-width:1100px;margin:40px auto 0}
   .loginBrands p{color:#a6b79b;font-size:11px;letter-spacing:.18em;margin-bottom:22px;text-align:center}
   .loginLogos{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:20px;background:#000;padding:24px 12px;border-radius:12px}
   .loginLogos img{display:block;width:100%;height:112px;object-fit:contain;background:#000}
   @media(max-width:680px){.staffLoginTheme{padding:32px 18px}.staffLoginCard{padding:28px 22px}.loginLogos{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.loginLogos img{height:82px}}
  `}</style>
 </Layout>;
}
