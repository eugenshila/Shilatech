import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/router';
import Link from 'next/link';
import {employeeShortcuts,functionCard} from '../lib/staff-dashboard.mjs';
import {clearFunctionView,isolateFunction,functionUrl} from '../lib/staff-function-view.mjs';

export default function EmployeeDashboard({user,children}){
 const router=useRouter(),content=useRef(null),dashboard=useRef(null);
 const [functions,setFunctions]=useState([]);
 const pagePath=router.asPath.split(/[?#]/)[0];
 const requested=typeof router.query.function==='string'?router.query.function:router.asPath.split('#')[1]?.replace(/^staff-function-/,'')||'';
 const active=functions.find(f=>f.id===requested||f.target===requested);
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
   const chosen=found.find(f=>f.id===requested||f.target===requested);
   if(chosen)isolateFunction(root,document.getElementById(chosen.target));else clearFunctionView(root);
  }
  collect();const observer=new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(collect);}});
  observer.observe(root,{childList:true,subtree:true,characterData:true});
  return()=>{observer.disconnect();clearFunctionView(root);};
 },[router.asPath,user.role,requested]);
 function shortcutUrl(href){const [p,hash]=href.split('#');return hash?functionUrl(p,hash):p;}
 return <>
  <section ref={dashboard} id="employee-dashboard" className="employeeDashboard noPrint" aria-label="Employee function dashboard">
   <div className="dashTitle"><div><span>SHILATECH · YOUR WORKSPACE</span><h2>{requested?(active?.label||'Function view'):'What would you like to do?'}</h2><p>{requested?'Work in this function, then return to your dashboard.':'Choose a card to open its own page view.'}</p></div><strong>{user.name}</strong></div>
   {requested&&<Link href={pagePath} shallow scroll className="backLink">← Back to dashboard</Link>}
   {!requested&&functions.length>0&&<><h3>On this page</h3><nav className="functionCards" aria-label="Page functions">{functions.map(f=><Link key={f.id} href={functionUrl(pagePath,f.id)} shallow scroll><strong>{f.label}</strong><span>Open page →</span></Link>)}</nav></>}
   {!requested&&shortcuts.length>0&&<><h3>Departments & personal services</h3><nav className="functionCards" aria-label="Employee services">{shortcuts.map(f=><Link key={f.href} href={shortcutUrl(f.href)}><strong>{f.label}</strong><span>{f.detail} →</span></Link>)}</nav></>}
   {requested&&!active&&<p role="status">This function is loading or is not available to your account. Return to the dashboard to choose an available function.</p>}
  </section>
  <div ref={content} className={(!requested&&functions.length)||(requested&&!active)?'dashboardOnly':requested?'functionView':''}>{children}</div>
  <style jsx>{`.employeeDashboard{background:#080d08;color:#e7ede4;border-bottom:1px solid #344b2b;padding:28px max(20px,calc((100% - 1240px)/2));font-family:inherit}.dashTitle{display:flex;justify-content:space-between;gap:20px;align-items:center}.dashTitle span{font-size:11px;letter-spacing:.15em;color:#a6c894}.dashTitle h2{font-size:26px;color:#70c342;margin:8px 0}.dashTitle p{font-size:14px;margin:0;line-height:1.6}h3{font-size:14px;color:#a6c894;margin:22px 0 10px}.functionCards{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}.functionCards a{display:flex;flex-direction:column;gap:9px;padding:18px;background:linear-gradient(135deg,#142210,#0b110a);border:1px solid #39512e;border-radius:10px;text-decoration:none;color:#83ce51;min-height:85px;box-sizing:border-box}.functionCards a span{font-size:12px;color:#c0cfb8;line-height:1.5}.functionCards a:hover{border-color:#83ce51;background:#192b12}.functionCards a:focus-visible,.dashboardReturn:focus-visible{outline:3px solid #b6eb91;outline-offset:3px}.dashboardReturn{position:fixed;right:20px;bottom:20px;z-index:1000;border:1px solid #9bdb74;background:#142210;color:#c6f3aa;border-radius:8px;padding:12px 18px;font:inherit;cursor:pointer;box-shadow:0 4px 18px #0008}@media(max-width:640px){.dashTitle{display:block}.dashTitle>strong{display:block;margin-top:12px}.functionCards{grid-template-columns:repeat(2,minmax(0,1fr))}.functionCards a{padding:12px}.dashTitle h2{font-size:22px}.dashboardReturn{right:12px;bottom:12px}}`}</style>
  <style jsx global>{`.dashboardOnly{display:none}.functionView [data-function-concealed]{display:none!important}.functionView [data-function-path]{display:block!important;min-height:0!important;padding-top:0!important}.functionView{background:#080d08;min-height:60vh}.employeeDashboard .backLink{display:inline-block;color:#a6dc83;margin-top:18px;padding:10px 14px;border:1px solid #39512e;border-radius:6px}.functionView .staffFunctionTarget{margin-top:20px}.functionView #personal-payslip{display:block}@media print{.employeeDashboard,.dashboardReturn{display:none!important}}`}</style>
 </>;
}
