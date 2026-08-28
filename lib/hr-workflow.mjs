export const reviewers=['admin','general_manager','hr'];
export function validateLeave(body){
 const reason=String(body.reason||'').trim(),type=body.leaveType;
 const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 if(!validDate(body.startDate)||!validDate(body.endDate)||body.endDate<body.startDate)throw Error('Valid start and end dates are required.');
 if(!['Annual','Sick','Unpaid'].includes(type)||!reason||reason.length>1000)throw Error('Choose a leave type and provide a reason of up to 1,000 characters.');
 return {start:body.startDate,end:body.endDate,type,reason};
}
export function leaveDecision(actor,leave,decision,note){
 if(String(actor.id)===String(leave.employee_id))throw Error('You cannot review your own leave request.');
 if(!String(note||'').trim()||String(note).length>1000)throw Error('A review note of up to 1,000 characters is required.');
 if(actor.role==='hr'&&decision==='FORWARD'&&leave.status==='PENDING_HR')return 'PENDING_MANAGER';
 const expected=actor.role==='general_manager'?'PENDING_MANAGER':null;
 if(!expected||leave.status!==expected||!['APPROVE','REJECT'].includes(decision))throw Error('Your role cannot perform this action at the current stage.');
 if(!leave.hr_id||String(leave.hr_id)===String(actor.id))throw Error('A separate HR reviewer must forward this request first.');
 return decision==='REJECT'?'REJECTED':'APPROVED';
}
export const hrSchema=[
 `CREATE TABLE IF NOT EXISTS hr_leave_requests(id BIGSERIAL PRIMARY KEY,employee_id INTEGER NOT NULL REFERENCES customers(id),start_date DATE NOT NULL,end_date DATE NOT NULL,leave_type TEXT NOT NULL,reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'PENDING_MANAGER',manager_id INTEGER,admin_id INTEGER,review_note TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),CHECK(end_date>=start_date))`,
 `CREATE TABLE IF NOT EXISTS hr_events(id BIGSERIAL PRIMARY KEY,leave_id BIGINT REFERENCES hr_leave_requests(id),actor_id INTEGER NOT NULL,action TEXT NOT NULL,note TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
];
export async function reviewLeave(c,actor,body){
 if(!/^\d+$/.test(String(body.id)))throw Error('Valid leave request required.');
 const q=await c.query('SELECT * FROM hr_leave_requests WHERE id=$1 FOR UPDATE',[body.id]);
 if(!q.rowCount)throw Error('Leave request not found.');
 const status=leaveDecision(actor,q.rows[0],body.decision,body.note);
 await c.query(`UPDATE hr_leave_requests SET status=$1,manager_id=CASE WHEN $2='general_manager' THEN $3 ELSE manager_id END,hr_id=CASE WHEN $2='hr' THEN $3 ELSE hr_id END,review_note=$4,updated_at=NOW() WHERE id=$5`,[status,actor.role,actor.id,body.note.trim(),body.id]);
 await c.query('INSERT INTO hr_events(leave_id,actor_id,action,note) VALUES($1,$2,$3,$4)',[body.id,actor.id,actor.role+':'+body.decision,body.note.trim()]);
 return status;
}
