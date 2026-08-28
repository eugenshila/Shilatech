import { useEffect,useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { staffPages,staffPageLabels,canViewStaffPage,staffDestination } from '../lib/staff-access.mjs';

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
 if(!checked)return <main className="staffAccess"><h1>Checking staff access…</h1></main>;
 if(!user||!canViewStaffPage(user.role,path))return <main className="staffAccess"><h1>Staff access</h1><p>{error||'This page is available only to authorised staff in the assigned department.'}</p><Link className="button primary" href={staffDestination(user?.role)||'/staff-login?next='+encodeURIComponent(path)}> {staffDestination(user?.role)?'Open my department':'Staff sign in'}</Link></main>;
 const readOnly=user.role==='general_manager'&&!['/staff','/approvals','/staff-garage'].includes(path);
 return <><nav className="staffNav noPrint" aria-label="Staff tools"><strong>{user.name} · {user.role.replaceAll('_',' ')}</strong><div>{staffPages(user.role).map(p=><Link key={p} href={p} aria-current={p===path?'page':undefined}>{staffPageLabels[p]}</Link>)}<button onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});setUser(null);await router.push('/staff-login');}}>Sign out</button></div></nav>{readOnly&&<p className="staffReadOnly noPrint">General manager: viewing only. Use Requests &amp; approvals to propose changes or review staff requests.</p>}{readOnly?<fieldset disabled className="staffReadOnlyContent">{children}</fieldset>:children}</>;
}
