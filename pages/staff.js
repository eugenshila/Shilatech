import { useEffect,useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import {staffPages,staffPageLabels} from '../lib/staff-access.mjs';
export default function StaffHome(){
 const [user,setUser]=useState(null);
 useEffect(()=>{fetch('/api/auth/me').then(r=>r.json()).then(j=>setUser(j.user));},[]);
 return <Layout title="Staff home | Shilatech" noindex><section className="counterShell staffHome"><div className="staffHomeIntro"><span className="staffEyebrow">SHILATECH · AUTHORISED STAFF</span><h1>Staff centre</h1><p>One account for your authorised departments.</p></div>{user?.role==='general_manager'&&<p className="staffReadOnly">You can view all departments and review requests. Only the main administrator applies changes.</p>}<div className="staffGrid">{staffPages(user?.role).filter(p=>p!=='/staff').map(p=><Link className="staffHomeLink" key={p} href={p}><h2>{staffPageLabels[p]}</h2><span>Open department <b>→</b></span></Link>)}</div></section></Layout>;
}

