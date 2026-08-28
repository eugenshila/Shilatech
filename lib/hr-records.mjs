import {hrSchema} from './hr-workflow.mjs';
export const categories={PHOTO:'Employee photo',GOOD_CONDUCT:'Good conduct certificate',EDUCATION:'Education qualification certificate',MEDICAL_SUPPORT:'Medical insurance supporting document',MEDICAL_APPROVAL:'Medical insurance approval document'};
export const isHR=s=>['hr','admin'].includes(s.role);
export const canReadDocument=(s,d)=>isHR(s)||String(s.id)===String(d.employee_id)||(s.role==='general_manager'&&Boolean(d.application_id));
export function validateFile(b){
 if(!categories[b.category])throw Error('Select a document category.');
 if(typeof b.content!=='string'||b.content.length>2800000||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(b.content))throw Error('Invalid or oversized file.');
 const bytes=Buffer.from(b.content,'base64');
 if(!bytes.length||bytes.length>2*1024*1024)throw Error('Files must be between 1 byte and 2 MB.');
 const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const pdf=bytes.subarray(0,5).toString()==='%PDF-';
 const mime=png?'image/png':jpg?'image/jpeg':pdf?'application/pdf':null;
 if(!mime||b.mime!==mime||(b.category==='PHOTO'&&pdf))throw Error('Upload a PNG/JPEG photo or a PDF, PNG or JPEG certificate.');
 const name=String(b.name||'document').replace(/[^a-zA-Z0-9._ -]/g,'_').slice(0,120);
 if(!new RegExp(mime==='image/png'?'\\.png$':mime==='image/jpeg'?'\\.jpe?g$':'\\.pdf$','i').test(name))throw Error('File extension must match the file contents.');
 return {bytes,mime,name};
}
export async function setupRecords(c,actor){
 if(!isHR(actor))throw Error('HR or administrator access required.');
 await c.query('SELECT pg_advisory_xact_lock(184029)');
 for(const sql of hrSchema)await c.query(sql);
 await c.query('CREATE TABLE IF NOT EXISTS hr_schema_versions(version INTEGER PRIMARY KEY)');
 const v=await c.query('SELECT version FROM hr_schema_versions WHERE version=2');
 if(v.rowCount)return;
 await c.query('ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS hr_id INTEGER REFERENCES customers(id)');
 await c.query("ALTER TABLE hr_leave_requests ALTER COLUMN status SET DEFAULT 'PENDING_HR'");
 // Preserve completed requests. Pending requests must follow the new review chain, never auto-approve.
 await c.query("INSERT INTO hr_events(leave_id,actor_id,action,note) SELECT id,$1,'WORKFLOW_UPDATED','Pending request returned to HR review; general manager now makes the final decision.' FROM hr_leave_requests WHERE status IN ('PENDING_MANAGER','PENDING_ADMIN')",[actor.id]);
 await c.query("UPDATE hr_leave_requests SET status='PENDING_HR',hr_id=NULL,manager_id=NULL,admin_id=NULL,updated_at=NOW() WHERE status IN ('PENDING_MANAGER','PENDING_ADMIN')");
 await c.query(`CREATE TABLE IF NOT EXISTS hr_medical_applications(id BIGSERIAL PRIMARY KEY,employee_id INTEGER NOT NULL REFERENCES customers(id),provider TEXT NOT NULL,plan TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'DRAFT',created_by INTEGER NOT NULL REFERENCES customers(id),hr_id INTEGER REFERENCES customers(id),manager_id INTEGER REFERENCES customers(id),review_note TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
 await c.query(`CREATE TABLE IF NOT EXISTS hr_documents(id BIGSERIAL PRIMARY KEY,employee_id INTEGER NOT NULL REFERENCES customers(id),application_id BIGINT REFERENCES hr_medical_applications(id),category TEXT NOT NULL,name TEXT NOT NULL,mime TEXT NOT NULL,bytes BYTEA NOT NULL,uploaded_by INTEGER NOT NULL REFERENCES customers(id),created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),CHECK(octet_length(bytes)<=2097152))`);
 await c.query('CREATE INDEX IF NOT EXISTS hr_documents_employee ON hr_documents(employee_id)');
 await c.query(`CREATE TABLE IF NOT EXISTS hr_record_events(id BIGSERIAL PRIMARY KEY,employee_id INTEGER NOT NULL,application_id BIGINT,document_id BIGINT,actor_id INTEGER NOT NULL,action TEXT NOT NULL,note TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
 await c.query('INSERT INTO hr_schema_versions(version) VALUES(2)');
}
export async function recordsReady(c){
 const r=await c.query("SELECT to_regclass('public.hr_schema_versions') AS t");
 if(!r.rows[0].t)return false;
 return Boolean((await c.query('SELECT version FROM hr_schema_versions WHERE version=2')).rowCount);
}
export function medicalDecision(actor,app,action,note){
 if(String(actor.id)===String(app.employee_id))throw Error('You cannot review your own application.');
 if(!String(note||'').trim()||String(note).length>1000)throw Error('A review note of up to 1,000 characters is required.');
 if(actor.role==='hr'&&app.status==='DRAFT'&&action==='FORWARD')return 'PENDING_MANAGER';
 if(actor.role==='general_manager'&&app.status==='PENDING_MANAGER'&&app.hr_id&&String(app.hr_id)!==String(actor.id)&&['APPROVE','REJECT'].includes(action))return action==='APPROVE'?'APPROVED':'REJECTED';
 throw Error('Your role cannot perform this action at the current stage.');
}
