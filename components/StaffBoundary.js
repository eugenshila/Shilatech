import { useEffect,useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import EmployeeDashboard from './EmployeeDashboard';
import { staffPages,staffPageLabels,canViewStaffPage,staffDestination } from '../lib/staff-access.mjs';


function StaffAccessScreen({title,children}){
 const logos=[['Jeep','jeep-black.jpg'],['Mercedes-Benz','mercedes-benz-black.png'],['Volkswagen','volkswagen-black.png'],['Land Rover and Range Rover','land-rover-black.png'],['Volvo','volvo-black.png'],['Ford','ford.png']];
 return <main className="accessScreen">
  <div className="accessContent">
   <div className="accessBrand"><img src="/shilatech-logo-small.webp" alt="Shilatech Auto Spares" width="100" height="64"/><div><strong>SHILATECH</strong><span>AUTO SPARES</span></div></div>
   <section className="accessPanel">
    <p className="accessEyebrow">SHILATECH · STAFF PORTAL</p>
    <h1>{title}</h1>
    <div className="accessMessage">{children}</div>
    <p className="accessNote">Warehouse · Sales counter · Garage · Administration</p>
   </section>
   <section className="accessBrands" aria-label="Vehicle brands">
    <p>THE BRANDS WE SPECIALISE IN</p>
    <div className="accessLogos">{logos.map(([name,file])=><img key={name} src={'/images/brand-logos/'+file} alt={name+' logo'} width="160" height="112"/>)}</div>
   </section>
   <Link className="accessHome" href="/">← Back to website</Link>
  </div>
  <style jsx>{`
   .accessScreen{min-height:100vh;box-sizing:border-box;background:#050805;color:#e7eee3;padding:64px 24px;font-family:inherit}
   .accessContent{max-width:1100px;margin:0 auto}
   .accessBrand{display:flex;align-items:center;gap:18px;margin-bottom:40px}
   .accessBrand img{object-fit:contain}
   .accessBrand strong{display:block;color:#63b522;font-size:28px;letter-spacing:.06em}
   .accessBrand span{display:block;font-size:11px;letter-spacing:.35em;margin-top:6px}
   .accessPanel{background:linear-gradient(120deg,#101a0c,#080d08);border:1px solid #304427;border-radius:18px;padding:44px}
   .accessEyebrow{color:#90c86b;font-size:12px;letter-spacing:.18em;margin:0 0 18px}
   h1{color:#72bf38;font-size:clamp(30px,4vw,46px);line-height:1.2;margin:0 0 22px}
   .accessMessage{max-width:680px;line-height:1.8}
   .accessMessage :global(p){color:#d6dfd1}
   .accessMessage :global(a){display:inline-block;background:#63b522;color:#071003;border:1px solid #63b522;border-radius:6px;padding:12px 24px;font-family:inherit;font-weight:700;text-decoration:none;margin-top:12px}
   .accessMessage :global(a:focus-visible),.accessHome:focus-visible{outline:3px solid #b9e899;outline-offset:5px}
   .accessNote{border-top:1px solid #304427;padding-top:24px;margin:32px 0 0;color:#a6b79b;font-size:13px;line-height:1.8}
   .accessBrands{margin:40px 0 28px}
   .accessBrands p{color:#a6b79b;font-size:11px;letter-spacing:.18em;margin-bottom:22px}
   .accessLogos{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:20px;background:#000;padding:24px 12px;border-radius:12px}
   .accessLogos img{display:block;width:100%;height:112px;object-fit:contain;background:#000}
   .accessHome{color:#a7d68b;font-size:14px;text-decoration:none}
   @media(max-width:680px){.accessScreen{padding:32px 18px}.accessPanel{padding:28px 22px}.accessLogos{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.accessLogos img{height:82px}.accessBrand strong{font-size:23px}}
   @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
  `}</style>
 </main>;
}

export default function StaffBoundary({children}){
 const router=useRouter();
 const path=router.pathname;
 const protectedPage=Object.hasOwn(staffPageLabels,path)||path.startsWith('/warehouse/');
 const [user,setUser]=useState(null),[checked,setChecked]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  if(!protectedPage)return;
  let live=true;
  async function check(){try{const r=await fetch('/api/auth/me',{cache:'no-store'});const j=await r.json();if(live){setUser(r.ok?j.user:null);setChecked(true);setError('');}}catch{if(live){setUser(null);setChecked(true);setError('Unable to check your staff session. Please reload.');}}}
  check();window.addEventListener('focus',check);return()=>{live=false;window.removeEventListener('focus',check);};
 },[protectedPage,path]);
 if(!protectedPage)return children;
 if(!checked)return <StaffAccessScreen title="Checking staff access…"><p>Please wait while we check your staff session.</p></StaffAccessScreen>;
 if(user?.must_change_password)return <StaffAccessScreen title="Change your temporary password"><p>This staff account must set a private password before opening staff tools.</p><Link className="button primary" href="/staff-password">Change password</Link></StaffAccessScreen>;
 if(!user||!canViewStaffPage(user.role,path))return <StaffAccessScreen title="Welcome to the staff portal"><p>{error||'This page is available only to authorised staff in the assigned department.'}</p><Link className="button primary" href={staffDestination(user?.role)||'/staff-login?next='+encodeURIComponent(path)}> {staffDestination(user?.role)?'Open my department':'Staff sign in'}</Link></StaffAccessScreen>;
 const readOnly=user.role==='general_manager'&&!['/staff','/approvals','/staff-garage','/payroll','/my-hr'].includes(path);
 return <><nav className="staffNav noPrint" aria-label="Staff tools"><strong>{user.name} · {user.role.replaceAll('_',' ')}</strong><div>{staffPages(user.role).map(p=><Link key={p} href={p} aria-current={p===path?'page':undefined}>{staffPageLabels[p]}</Link>)}<button onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});setUser(null);await router.push('/staff-login');}}>Sign out</button></div></nav><EmployeeDashboard key={path} user={user}>{readOnly&&<p className="staffReadOnly noPrint">General manager: viewing only. Use Requests &amp; approvals to propose changes or review staff requests.</p>}{readOnly?<fieldset disabled className="staffReadOnlyContent">{children}</fieldset>:children}</EmployeeDashboard></>;
}

