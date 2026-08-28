import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/router';
import {employeeShortcuts,functionCard} from '../lib/staff-dashboard.mjs';

export default function EmployeeDashboard({user,children}){
 const router=useRouter(),content=useRef(null),dashboard=useRef(null);
 const [functions,setFunctions]=useState([]),[away,setAway]=useState(false);
 const shortcuts=employeeShortcuts(user.role,router.pathname);
 useEffect(()=>{
  const root=content.current;if(!root)return;
  let queued=false;
  function collect(){
   queued=false;const found=[],seen=new Set();
   // Read only headings that the page already rendered for this employee's role.
   for(const heading of root.querySelectorAll('h2,summary')){
    if(heading.closest('[hidden]'))continue;
    const card=functionCard(heading.textContent||'');
    if(!card||seen.has(card.id))continue;
    seen.add(card.id);
    if(!heading.id)heading.id='staff-function-'+card.id;
    heading.classList.add('staffFunctionTarget');heading.tabIndex=-1;
    found.push({...card,target:heading.id});
   }
   setFunctions(old=>JSON.stringify(old)===JSON.stringify(found)?old:found);
   const hash=decodeURIComponent(window.location.hash.slice(1));
   if(hash&&!document.getElementById(hash)?.dataset.staffHashOpened){
    const target=document.getElementById(hash);
    if(target&&root.contains(target)){target.dataset.staffHashOpened='true';target.scrollIntoView({block:'start'});}
   }
  }
  collect();const observer=new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(collect);}});
  observer.observe(root,{childList:true,subtree:true,characterData:true});
  return()=>observer.disconnect();
 },[router.pathname,user.role]);
 useEffect(()=>{const check=()=>setAway((dashboard.current?.getBoundingClientRect().bottom||0)<0);window.addEventListener('scroll',check,{passive:true});check();return()=>window.removeEventListener('scroll',check);},[]);
 function open(e,id){const el=document.getElementById(id);if(!el)return;e.preventDefault();window.history.replaceState(window.history.state,'','#'+id);el.scrollIntoView({block:'start'});el.focus({preventScroll:true});}
 return <>
  <section ref={dashboard} id="employee-dashboard" className="employeeDashboard noPrint" aria-label="Employee function dashboard">
   <div className="dashTitle"><div><span>SHILATECH · YOUR WORKSPACE</span><h2>What would you like to do?</h2><p>Choose a function to open it directly. Your account permissions remain unchanged.</p></div><strong>{user.name}</strong></div>
   {functions.length>0&&<><h3>On this page</h3><nav className="functionCards" aria-label="Page functions">{functions.map(f=><a key={f.id} href={'#'+f.target} onClick={e=>open(e,f.target)}><strong>{f.label}</strong><span>Open function →</span></a>)}</nav></>}
   {shortcuts.length>0&&<><h3>Departments & personal services</h3><nav className="functionCards" aria-label="Employee services">{shortcuts.map(f=><a key={f.href} href={f.href}><strong>{f.label}</strong><span>{f.detail} →</span></a>)}</nav></>}
  </section>
  <div ref={content}>{children}</div>
  {away&&<button type="button" className="dashboardReturn noPrint" onClick={()=>{dashboard.current?.scrollIntoView({block:'start'});const heading=dashboard.current?.querySelector('h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}}>↑ Back to dashboard</button>}
  <style jsx>{`.employeeDashboard{background:#080d08;color:#e7ede4;border-bottom:1px solid #344b2b;padding:28px max(20px,calc((100% - 1240px)/2));font-family:inherit}.dashTitle{display:flex;justify-content:space-between;gap:20px;align-items:center}.dashTitle span{font-size:11px;letter-spacing:.15em;color:#a6c894}.dashTitle h2{font-size:26px;color:#70c342;margin:8px 0}.dashTitle p{font-size:14px;margin:0;line-height:1.6}h3{font-size:14px;color:#a6c894;margin:22px 0 10px}.functionCards{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}.functionCards a{display:flex;flex-direction:column;gap:9px;padding:18px;background:linear-gradient(135deg,#142210,#0b110a);border:1px solid #39512e;border-radius:10px;text-decoration:none;color:#83ce51;min-height:85px;box-sizing:border-box}.functionCards a span{font-size:12px;color:#c0cfb8;line-height:1.5}.functionCards a:hover{border-color:#83ce51;background:#192b12}.functionCards a:focus-visible,.dashboardReturn:focus-visible{outline:3px solid #b6eb91;outline-offset:3px}.dashboardReturn{position:fixed;right:20px;bottom:20px;z-index:1000;border:1px solid #9bdb74;background:#142210;color:#c6f3aa;border-radius:8px;padding:12px 18px;font:inherit;cursor:pointer;box-shadow:0 4px 18px #0008}@media(max-width:640px){.dashTitle{display:block}.dashTitle>strong{display:block;margin-top:12px}.functionCards{grid-template-columns:repeat(2,minmax(0,1fr))}.functionCards a{padding:12px}.dashTitle h2{font-size:22px}.dashboardReturn{right:12px;bottom:12px}}`}</style>
  <style jsx global>{`.staffFunctionTarget,[id="documents"],[id="medical"],[id="leave"],[id="email"],[id="payslips"]{scroll-margin-top:24px}.staffFunctionTarget:focus{outline:2px solid #83ce51;outline-offset:5px}@media print{.employeeDashboard,.dashboardReturn{display:none!important}}`}</style>
 </>;
}
