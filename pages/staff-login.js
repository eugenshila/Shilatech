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
  <section className="counterShell" style={{minHeight:'65vh'}}>
   <form className="counterCard" style={{maxWidth:480,margin:'32px auto'}} onSubmit={submit}>
    <span className="eyebrow" style={{color:'#486477'}}>SHILATECH · EMPLOYEE ACCESS</span>
    <h1 style={{fontSize:30,margin:'12px 0'}}>Staff sign in</h1>
    <p>Use your existing staff email and password. You will be taken to the tools allowed for your staff role.</p>
    {error&&<p className="counterError" role="alert">{error}</p>}
    <label htmlFor="staffEmail">Staff email</label>
    <input id="staffEmail" type="email" autoComplete="username" required autoFocus value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/>
    <label htmlFor="staffPassword">Password</label>
    <input id="staffPassword" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/>
    <button className="button primary counterPay" style={{marginTop:24}} disabled={busy}>{busy?'Signing in…':'Sign in to staff portal'}</button>
    <p>Staff accounts are created by your administrator. Customer accounts cannot access staff tools.</p>
    <Link href="/account">Customer login instead</Link>
   </form>
  </section>
 </Layout>;
}
