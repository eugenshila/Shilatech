const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),{randomUUID}=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');const swc=require('next/dist/build/swc');
(async()=>{
 const mod=await import('../lib/receivables.mjs');const db=new PGlite();
 await db.exec("CREATE TABLE customers(id INTEGER PRIMARY KEY,name TEXT,role TEXT);INSERT INTO customers VALUES(1,'Admin','admin'),(2,'Sales','cashier'),(3,'Finance','finance'),(4,'Other sales','cashier'),(5,'Manager','general_manager'); CREATE TABLE products(id BIGINT PRIMARY KEY,name TEXT,part_no TEXT,price_kes INTEGER,active BOOLEAN);INSERT INTO products VALUES(1,'Test filter','TEST-1',1000,TRUE);");
 const admin={id:1,role:'admin'},sales={id:2,role:'cashier'},finance={id:3,role:'finance'},other={id:4,role:'cashier'},gm={id:5,role:'general_manager'};
 async function act(s,b){await db.query('BEGIN');try{const r=await mod.execute(db,s,{requestKey:randomUUID(),...b});await db.query('COMMIT');return r;}catch(e){await db.query('ROLLBACK');throw e;}}
 await assert.rejects(act(sales,{action:'SETUP'}));await act(admin,{action:'SETUP'});await act(admin,{action:'SETUP'});
 const a=await act(sales,{action:'CLIENT',name:'Sample customer',contact:'Test contact'});
 const quoteBody={action:'QUOTE',clientId:a.id,items:[{id:1,quantity:2,priceKes:1}],expectedTotalKes:2000,requestKey:randomUUID()};
 const q=await act(sales,quoteBody);assert.equal((await act(sales,quoteBody)).id,q.id);
 assert.equal((await db.query('SELECT total_kes FROM ar_documents WHERE id=$1',[q.id])).rows[0].total_kes,2000);
 await assert.rejects(act(other,{...quoteBody,requestKey:randomUUID()}));await assert.rejects(act(finance,{...quoteBody,requestKey:randomUUID()}));
 await assert.rejects(act(sales,{action:'INVOICE',quoteId:q.id,termsDays:30}));await assert.rejects(act(sales,{action:'CREDIT',clientId:a.id,limitKes:5000,note:'Self approval'}));await assert.rejects(act(gm,{action:'CREDIT',clientId:a.id,limitKes:5000,note:'Not admin'}));
 await act(admin,{action:'CREDIT',clientId:a.id,limitKes:3000,note:'Test approved credit'});
 const invoiceBody={action:'INVOICE',quoteId:q.id,termsDays:30,requestKey:randomUUID()};const inv=await act(sales,invoiceBody);assert.equal((await act(sales,invoiceBody)).id,inv.id);
 const dateCheck=await db.query('SELECT due_on-issued_on AS days FROM ar_documents WHERE id=$1',[inv.id]);assert.equal(dateCheck.rows[0].days,30);
 await assert.rejects(act(sales,{...invoiceBody,requestKey:randomUUID()}));
 const q2=await act(sales,{...quoteBody,requestKey:randomUUID()});await assert.rejects(act(sales,{action:'INVOICE',quoteId:q2.id,termsDays:30}));
 const today=(await db.query("SELECT to_char((NOW() AT TIME ZONE 'Africa/Nairobi')::date,'YYYY-MM-DD') AS day")).rows[0].day;
 const pay={action:'PAYMENT',invoiceId:inv.id,amountKes:1000,method:'Bank',reference:'TEST-REF-1',receivedOn:today,requestKey:randomUUID()};await assert.rejects(act(sales,pay));await act(finance,pay);await act(finance,pay);
 assert.equal(Number((await db.query('SELECT paid_kes FROM ar_documents WHERE id=$1',[inv.id])).rows[0].paid_kes),1000);
 await assert.rejects(act(finance,{...pay,requestKey:randomUUID()}));await assert.rejects(act(finance,{...pay,amountKes:1001,reference:'TEST-2',requestKey:randomUUID()}));
 await assert.rejects(act(admin,{action:'VOID',id:inv.id,note:'Has payment'}));
 await db.query("UPDATE ar_documents SET due_on=(NOW() AT TIME ZONE 'Africa/Nairobi')::date-1 WHERE id=$1",[inv.id]);await assert.rejects(act(sales,{action:'INVOICE',quoteId:q2.id,termsDays:30}));
 await db.query('UPDATE products SET price_kes=1200 WHERE id=1');await assert.rejects(act(sales,{action:'INVOICE',quoteId:q2.id,termsDays:0}));
 const q3=await act(sales,{...quoteBody,expectedTotalKes:2400,requestKey:randomUUID()});await db.query("UPDATE ar_documents SET due_on=(NOW() AT TIME ZONE 'Africa/Nairobi')::date-1 WHERE id=$1",[q3.id]);await assert.rejects(act(sales,{action:'INVOICE',quoteId:q3.id,termsDays:0}));
 for(const f of ['pages/receivables.js','pages/api/receivables.js'])await swc.transform(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),{filename:f,jsc:{parser:{syntax:'ecmascript',jsx:true}}});
 const compiled=await swc.transform(fs.readFileSync(path.join(__dirname,'..','pages/api/receivables.js'),'utf8'),{filename:'api.js',jsc:{parser:{syntax:'ecmascript'}},module:{type:'commonjs'}});let session=sales;const m={exports:{}};new Function('require','module','exports',compiled.code)(name=>name.endsWith('/db')?{getPool:()=>({connect:async()=>({query:(...a)=>db.query(...a),release(){}})})}:name.endsWith('/auth')?{readSession:async()=>session}:mod,m,m.exports);
 async function get(s){session=s;const r={statusCode:200,setHeader(){},status(n){this.statusCode=n;return this;},json(b){this.body=b;return this;}};await m.exports.default({method:'GET',headers:{},query:{}},r);return r;}
 assert.equal((await get(null)).statusCode,401);assert.equal((await get({id:6,role:'hr'})).statusCode,403);assert.equal((await get(other)).body.documents.length,0);assert.equal((await get(other)).body.clients.length,0);assert.equal((await get(finance)).body.documents.length,4);assert.equal(Number((await get(finance)).body.totals.outstanding),1000);
 await db.close();console.log('PASS: schema, permissions, price enforcement, credit approval/limit/overdue checks, 30-day due date, idempotent quotes/invoices/payments, duplicate references, overpayments, expiry, document ownership and report totals.');
})().catch(e=>{console.error(e);process.exit(1)});

