import { useEffect,useState } from 'react';
import Layout from '../components/Layout';
import { calculatePayroll } from '../lib/payroll.mjs';

const money = value => Number(value).toLocaleString('en-KE',{minimumFractionDigits:2,maximumFractionDigits:2});
const labels = {basic:'Basic pay',allowances:'Regular cash allowances',gross:'Gross pay',nssf:'Employee NSSF',shif:'SHIF',housing:'Employee housing levy',taxable:'Taxable pay',relief:'Personal relief applied',paye:'PAYE',net:'Net salary',employerNssf:'Employer NSSF',employerHousing:'Employer housing levy'};
function Breakdown({amounts}) { return <dl className="payrollAmounts">{Object.entries(labels).map(([key,label])=><div key={key}><dt>{label}</dt><dd>KSh {money(amounts[key])}</dd></div>)}</dl>; }
export default function Payroll() {
  const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  const [form,setForm]=useState({employeeId:'',period:new Date().toISOString().slice(0,7),basic:'',allowances:'0',method:'BANK',resident:true,confirmScope:false});
  const [selected,setSelected]=useState(null),[note,setNote]=useState('');
  async function refresh(){const r=await fetch('/api/payroll',{cache:'no-store'});const j=await r.json();if(!r.ok)throw new Error(j.error);setData(j);}
  useEffect(()=>{refresh().catch(e=>setError(e.message));},[]);
  async function send(body){setBusy(true);setError('');setNotice('');try{const r=await fetch('/api/payroll',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw new Error(j.error);await refresh();setNotice('Saved. No payment was sent.');setNote('');}catch(e){setError(e.message);}finally{setBusy(false);}}
  let preview=null;try{preview=calculatePayroll(form);}catch{}
  const entry=data?.entries.find(e=>String(e.id)===String(selected));
  async function printPayslip(){
    if(entry?.status!=='APPROVED'||busy)return;
    try{
      const logo=document.querySelector('#payroll-statement img');
      if(logo)await logo.decode();
      await document.fonts.ready;
      window.print();
    }catch{setError('The company logo could not load. Please reload before printing.');}
  }
  const update=e=>setForm({...form,[e.target.name]:e.target.value});
  return <Layout title="Payroll | Shilatech staff" noindex><section className="counterShell payrollPage">
    <div className="noPrint"><span className="staffEyebrow">SHILATECH · ERP / PAYROLL</span><h1>Kenya payroll</h1>
    <p>Monthly salary preparation → general manager review → administrator approval.</p>
    <p className="payrollNotice">Preparation and approval only. Bank and M-Pesa transfers are not connected. Approval does not pay employees or remit statutory deductions.</p>
    <p>Initial scope: regular monthly cash pay, ordinary NSSF contributions, SHIF, housing levy and PAYE. No benefits in kind, overtime, bonuses, loans, insurance relief, exemptions or additional pension schemes. Employer totals exclude other obligations such as NITA. Have a qualified payroll reviewer verify calculations before using them for payment or filing.</p>
    <p>Rules: February–December 2026. Sources: <a href="https://www.kra.go.ke/individual/filing-paying/types-of-taxes/paye" target="_blank" rel="noreferrer">KRA PAYE</a>, <a href="https://www.nssf.or.ke/notice-to-employers-year-4-2026-nssf-contribution-rates/notice" target="_blank" rel="noreferrer">NSSF Year 4</a>, <a href="https://new.kenyalaw.org/akn/ke/act/ln/2024/49/eng%402024-03-08" target="_blank" rel="noreferrer">SHIF regulations</a>.</p>
    {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
    {!data&&!error&&<p>Checking payroll access…</p>}
    {data&&!data.ready&&<div><h2>Initialise payroll records</h2><p>No payroll tables exist yet. Initialisation creates empty payroll and audit tables; it does not alter stock, sales, staff salaries or send money.</p>{data.role==='admin'?<button disabled={busy} onClick={()=>send({action:'SETUP'})}>Initialise payroll</button>:<p>Ask the administrator to initialise payroll.</p>}</div>}
    {data?.ready&&data.role==='admin'&&<form onSubmit={e=>{e.preventDefault();send({...form,action:'CREATE'});}}>
      <h2>Prepare a salary record</h2><div className="payrollFields">
      <label>Employee<select required name="employeeId" value={form.employeeId} onChange={update}><option value="">Select staff account</option>{data.employees.map(e=><option key={e.id} value={e.id}>{e.name} — {e.role.replaceAll('_',' ')}</option>)}</select></label>
      <label>Month<input required type="month" min="2026-02" max="2026-12" name="period" value={form.period} onChange={update}/></label>
      <label>Basic pay (KSh)<input required type="number" min="0.01" max="10000000" step="0.01" name="basic" value={form.basic} onChange={update}/></label>
      <label>Regular cash allowances (KSh)<input required type="number" min="0" max="10000000" step="0.01" name="allowances" value={form.allowances} onChange={update}/></label>
      <label>Preferred payment method<select name="method" value={form.method} onChange={update}><option value="BANK">Bank transfer</option><option value="MPESA">M-Pesa</option></select></label>
      <label>Tax residency<select value={String(form.resident)} onChange={e=>setForm({...form,resident:e.target.value==='true'})}><option value="true">Kenyan tax resident — personal relief</option><option value="false">Non-resident — no personal relief</option></select></label>
      </div><label><input type="checkbox" required checked={form.confirmScope} onChange={e=>setForm({...form,confirmScope:e.target.checked})}/> I confirm this employee falls within the supported scope and the pay inputs are correct.</label>
      {preview&&<><h3>Calculation preview</h3><Breakdown amounts={preview}/></>}
      <button disabled={busy||!preview||!form.confirmScope}>Submit for general manager review</button>
    </form>}
    {data?.ready&&<><h2>Salary records</h2><p>Latest 200 records. Rejected records can be replaced; submitted amounts cannot be edited.</p><div style={{overflowX:'auto'}}><table><thead><tr><th>Month</th><th>Employee</th><th>Method</th><th>Net KSh</th><th>Status</th><th>Details</th></tr></thead><tbody>{data.entries.map(e=><tr key={e.id}><td>{e.period}</td><td>{e.employee_name}</td><td>{e.amounts.method==='BANK'?'Bank':'M-Pesa'}</td><td>{money(e.amounts.net)}</td><td>{e.status.replaceAll('_',' ')}</td><td><button onClick={()=>{setSelected(e.id);setNote('');}}>Open record {e.id}</button></td></tr>)}</tbody></table></div>{!data.entries.length&&<p>No salary records yet.</p>}</>}
    </div>
    {entry&&<><article id="payroll-statement" data-approved={entry.status==='APPROVED'}><div className="payslipHeader"><img src="/shilatech-logo.webp" alt="Shilatech Auto Spares" width="100" height="64"/><div><strong>SHILATECH AUTO SPARES</strong><h2>Monthly payslip</h2></div></div><p>{entry.employee_name} · {entry.period} · Record {entry.id}</p><p><strong>{entry.status==='APPROVED'?'APPROVED — PAYMENT NOT SENT':'DRAFT / '+entry.status.replaceAll('_',' ')}</strong></p><p>Method: {entry.amounts.method==='BANK'?'Bank transfer':'M-Pesa'} · Currency: KES · Rules: {entry.amounts.ruleVersion}</p><Breakdown amounts={entry.amounts}/><p>This statement records salary calculations only. It is not proof of salary payment or statutory remittance.</p></article>
      <div className="noPrint">{entry.status==='APPROVED'?<><button disabled={busy} onClick={printPayslip}>Print approved payslip (A5)</button><p>Select A5, portrait, 100% scale and turn off browser headers and footers in the print dialog.</p></>:<p>Printing is available after administrator approval.</p>}
      {((data.role==='general_manager'&&entry.status==='PENDING_MANAGER')||(data.role==='admin'&&entry.status==='PENDING_ADMIN'))&&<div><label>Review note<textarea required maxLength={1000} value={note} onChange={e=>setNote(e.target.value)}/></label><button disabled={busy||!note.trim()} onClick={()=>send({id:entry.id,action:data.role==='general_manager'?'REVIEW':'APPROVE',note})}>{data.role==='general_manager'?'Recommend to administrator':'Approve salary record (no payment)'}</button> <button disabled={busy||!note.trim()} onClick={()=>send({id:entry.id,action:'REJECT',note})}>Reject</button></div>}
      <h3>Audit trail</h3>{data.events.filter(e=>String(e.entry_id)===String(entry.id)).map(e=><p key={e.id}>{new Date(e.created_at).toLocaleString()} · {e.actor_name} · {e.action}: {e.note}</p>)}</div>
    </>}
    <style jsx>{`
      .payrollPage{color:#e7ede4;background:#080c08;line-height:1.7}.payrollPage h1,.payrollPage h2,.payrollPage h3,.payrollPage a{color:#70c342}.payrollNotice{border-left:3px solid #70c342;padding:12px;background:#14200f}.payrollFields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:20px 0}label{display:block}input:not([type=checkbox]),select,textarea{display:block;width:100%;padding:10px;color:#f1f5ef;background:#101910;border:1px solid #53654b}button{padding:10px 16px;background:#65bd35;color:#071003;border:0;border-radius:4px;cursor:pointer;margin:12px 0}button:disabled{opacity:.5;cursor:not-allowed}td,th{text-align:left;padding:10px;border-bottom:1px solid #30402a}#payroll-statement{box-sizing:border-box;max-width:148mm;margin:28px 0;padding:20px;border:1px solid #405338;overflow-wrap:anywhere}.payslipHeader{display:flex;align-items:center;gap:16px;border-bottom:2px solid #70c342;padding-bottom:12px}.payslipHeader img{object-fit:contain;flex-shrink:0}.payslipHeader strong{color:#70c342}.payslipHeader h2{margin:4px 0;font-size:22px} @media(max-width:640px){.payrollFields{grid-template-columns:1fr}}
    `}</style>
    <style jsx global>{`.payrollAmounts{max-width:650px}.payrollAmounts>div{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid #30402a;padding:5px 0}.payrollAmounts dd{margin:0}@page{size:A5 portrait;margin:10mm}
@media print{
 body{margin:0!important;background:#fff!important}
 body *:not(:has(#payroll-statement)):not(#payroll-statement):not(#payroll-statement *){display:none!important}
 body *:has(#payroll-statement){display:block!important;position:static!important;margin:0!important;padding:0!important;border:0!important;min-height:0!important;height:auto!important;width:auto!important;max-width:none!important;background:#fff!important}
 #payroll-statement{display:block!important;position:static!important;box-sizing:border-box!important;width:128mm!important;max-width:100%!important;margin:0!important;padding:0!important;border:0!important;break-inside:avoid;font-size:9pt!important;line-height:1.3!important}
 #payroll-statement,#payroll-statement *{color:#111!important;background:transparent!important;box-shadow:none!important}
 #payroll-statement[data-approved="false"]{display:none!important}
 #payroll-statement .payslipHeader{display:flex!important;gap:4mm!important;padding-bottom:3mm!important;border-bottom:1pt solid #385c26!important}
 #payroll-statement .payslipHeader img{width:24mm!important;height:16mm!important;object-fit:contain!important}
 #payroll-statement h2{font-size:15pt!important;margin:1mm 0!important}
 #payroll-statement p{margin:2mm 0!important}
 #payroll-statement .payrollAmounts{max-width:none!important;margin:3mm 0!important}
 #payroll-statement .payrollAmounts>div{padding:1mm 0!important;gap:3mm!important;border-bottom:.3pt solid #bbb!important;break-inside:avoid}
 #payroll-statement .payrollAmounts dd{white-space:nowrap}
 .noPrint{display:none!important}
}`}</style>
  </section></Layout>;
}
