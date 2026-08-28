import {getPool} from '../../lib/db';
import {readSession} from '../../lib/auth';
import {staffPages} from '../../lib/staff-access.mjs';
import {isHR,canReadDocument,validateFile,recordsReady,medicalDecision} from '../../lib/hr-records.mjs';
export const config={api:{bodyParser:{sizeLimit:'3mb'},responseLimit:'3mb'}};
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('X-Content-Type-Options','nosniff');
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed.'});
 const s=await readSession(req);
 if(!s)return res.status(401).json({error:'Staff sign-in required.'});
 if(!staffPages(s.role).includes('/my-hr'))return res.status(403).json({error:'Staff access required.'});
 if(req.method==='POST'&&(!String(req.headers['content-type']||'').startsWith('application/json')||req.headers['sec-fetch-site']==='cross-site'))return res.status(403).json({error:'Use the staff portal to submit changes.'});
 let c,tx=false;
 try{
  c=await getPool().connect();
  if(!await recordsReady(c))return res.status(409).json({error:'Ask HR to enable document and medical records using the setup button.'});
  if(req.method==='GET'){
   if(req.query.document){
    if(!/^\d+$/.test(String(req.query.document)))return res.status(404).end();
    const r=await c.query('SELECT id,employee_id,application_id,name,mime FROM hr_documents WHERE id=$1',[req.query.document]);
    const d=r.rows[0];if(!d||!canReadDocument(s,d))return res.status(404).json({error:'Document not available.'});
    const f=await c.query('SELECT bytes FROM hr_documents WHERE id=$1',[d.id]);
    await c.query("INSERT INTO hr_record_events(employee_id,application_id,document_id,actor_id,action) VALUES($1,$2,$3,$4,'DOWNLOAD')",[d.employee_id,d.application_id,d.id,s.id]);
    res.setHeader('Content-Type',d.mime);res.setHeader('Content-Disposition',`attachment; filename="${d.name}"`);res.setHeader('Content-Security-Policy',"sandbox; default-src 'none'");
    return res.send(f.rows[0].bytes);
   }
   const docs=await c.query(`SELECT d.id,d.employee_id,d.application_id,d.category,d.name,d.created_at,u.name AS employee_name FROM hr_documents d JOIN customers u ON u.id=d.employee_id WHERE d.employee_id=$1 OR $2 OR ($3 AND d.application_id IS NOT NULL) ORDER BY d.created_at DESC LIMIT 500`,[s.id,isHR(s),s.role==='general_manager']);
   const applications=await c.query(`SELECT a.*,u.name AS employee_name FROM hr_medical_applications a JOIN customers u ON u.id=a.employee_id WHERE a.employee_id=$1 OR $2 ORDER BY a.created_at DESC LIMIT 200`,[s.id,isHR(s)||s.role==='general_manager']);
   const events=await c.query(`SELECT e.*,u.name AS actor_name FROM hr_record_events e JOIN customers u ON u.id=e.actor_id WHERE e.employee_id=$1 OR $2 OR ($3 AND e.application_id IS NOT NULL) ORDER BY e.created_at DESC LIMIT 200`,[s.id,isHR(s),s.role==='general_manager']);
   return res.json({documents:docs.rows,applications:applications.rows,events:events.rows});
  }
  const b=req.body||{};await c.query('BEGIN');tx=true;
  if(b.action==='UPLOAD'){
   if(!isHR(s))throw Error('Only HR or the administrator may upload staff documents.');
   const f=validateFile(b);
   if(!/^\d+$/.test(String(b.employeeId)))throw Error('Choose a staff member.');
   // Lock staff row so parallel uploads cannot exceed the per-employee limit.
   const u=await c.query('SELECT id,role FROM customers WHERE id=$1 FOR UPDATE',[b.employeeId]);
   if(!u.rowCount||!staffPages(u.rows[0].role).includes('/my-hr'))throw Error('Staff member not found.');
   const quota=await c.query('SELECT count(*)::int AS count FROM hr_documents WHERE employee_id=$1',[b.employeeId]);
   if(quota.rows[0].count>=20)throw Error('Test storage limit: 20 documents per employee.');
   let applicationId=null;
   if(b.category.startsWith('MEDICAL_')){
    if(!/^\d+$/.test(String(b.applicationId)))throw Error('Select the medical application.');
    const a=await c.query('SELECT * FROM hr_medical_applications WHERE id=$1 FOR UPDATE',[b.applicationId]);
    if(!a.rowCount||String(a.rows[0].employee_id)!==String(b.employeeId))throw Error('Application does not belong to this employee.');
    if(b.category==='MEDICAL_SUPPORT'&&a.rows[0].status!=='DRAFT')throw Error('Supporting documents are locked after HR submission.');
    if(b.category==='MEDICAL_APPROVAL'&&a.rows[0].status!=='APPROVED')throw Error('Attach approval documents after the general manager approves.');
    applicationId=a.rows[0].id;
   }else if(b.applicationId)throw Error('Personnel certificates cannot be attached to a medical application.');
   const r=await c.query('INSERT INTO hr_documents(employee_id,application_id,category,name,mime,bytes,uploaded_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',[b.employeeId,applicationId,b.category,f.name,f.mime,f.bytes,s.id]);
   await c.query("INSERT INTO hr_record_events(employee_id,application_id,document_id,actor_id,action,note) VALUES($1,$2,$3,$4,'UPLOAD',$5)",[b.employeeId,applicationId,r.rows[0].id,s.id,b.category]);
  }else if(b.action==='CREATE_MEDICAL'){
   const employeeId=isHR(s)?b.employeeId:s.id;
   if(!/^\d+$/.test(String(employeeId)))throw Error('Choose a staff member.');
   const u=await c.query('SELECT role FROM customers WHERE id=$1 FOR UPDATE',[employeeId]);
   if(!u.rowCount||!staffPages(u.rows[0].role).includes('/my-hr'))throw Error('Staff member not found.');
   const pending=await c.query("SELECT count(*)::int AS n FROM hr_medical_applications WHERE employee_id=$1 AND status IN ('DRAFT','PENDING_MANAGER')",[employeeId]);
   if(pending.rows[0].n>=5)throw Error('This employee already has five open applications.');
   const provider=String(b.provider||'').trim(),plan=String(b.plan||'').trim(),notes=String(b.notes||'').trim();
   if(!provider||provider.length>160||!plan||plan.length>160||notes.length>1000)throw Error('Provider and plan are required (up to 160 characters); notes up to 1,000 characters.');
   const r=await c.query('INSERT INTO hr_medical_applications(employee_id,provider,plan,notes,created_by) VALUES($1,$2,$3,$4,$5) RETURNING id',[employeeId,provider,plan,notes,s.id]);
   await c.query("INSERT INTO hr_record_events(employee_id,application_id,actor_id,action) VALUES($1,$2,$3,'APPLICATION_CREATED')",[employeeId,r.rows[0].id,s.id]);
  }else if(b.action==='MEDICAL_DECIDE'){
   if(!/^\d+$/.test(String(b.id)))throw Error('Select an application.');
   const r=await c.query('SELECT * FROM hr_medical_applications WHERE id=$1 FOR UPDATE',[b.id]);
   if(!r.rowCount)throw Error('Application not found.');const a=r.rows[0];
   const status=medicalDecision(s,a,b.decision,b.note);
   if(b.decision==='FORWARD'){
    const d=await c.query("SELECT id FROM hr_documents WHERE application_id=$1 AND category='MEDICAL_SUPPORT' LIMIT 1",[a.id]);
    if(!d.rowCount)throw Error('Attach a supporting application document before forwarding.');
   }
   await c.query("UPDATE hr_medical_applications SET status=$1,hr_id=CASE WHEN $2='hr' THEN $3 ELSE hr_id END,manager_id=CASE WHEN $2='general_manager' THEN $3 ELSE manager_id END,review_note=$4,updated_at=NOW() WHERE id=$5",[status,s.role,s.id,b.note.trim(),a.id]);
   await c.query('INSERT INTO hr_record_events(employee_id,application_id,actor_id,action,note) VALUES($1,$2,$3,$4,$5)',[a.employee_id,a.id,s.id,s.role+':'+b.decision,b.note.trim()]);
  }else throw Error('Unsupported action.');
  await c.query('COMMIT');tx=false;return res.json({ok:true});
 }catch(e){if(tx)await c.query('ROLLBACK');return res.status(400).json({error:e.code?'Could not save HR records. Please contact the administrator.':e.message||'Request failed.'});}finally{c?.release();}
}
