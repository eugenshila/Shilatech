const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const swc=require('next/dist/build/swc');
(async()=>{
 const {employeeShortcuts,functionCard}=await import('../lib/staff-dashboard.mjs');
 for(const role of ['hr','warehouse_clerk','warehouse_manager','garage_staff','cashier','delivery_driver','admin','general_manager','finance','auditor','picker','packer','dispatch']){
  const cards=employeeShortcuts(role,'/warehouse');assert(cards.some(c=>c.href==='/my-hr#leave'));assert(cards.some(c=>c.href==='/my-hr#payslips'));
  const docs=cards.find(c=>c.href==='/my-hr#documents');assert.equal(docs.detail.startsWith('Upload'),['admin','hr'].includes(role));
 }
 assert.deepEqual(employeeShortcuts('customer','/warehouse'),[]);
 assert(!employeeShortcuts('warehouse_clerk','/warehouse/jeep').some(c=>c.href==='/pos'));
 assert(!employeeShortcuts('hr','/my-hr').some(c=>c.href==='/admin'));
 assert.equal(functionCard('Receive stock').id,'receive');assert.equal(functionCard('Medical insurance applications').id,'medical');assert.equal(functionCard('Employee photo'),null);
 await swc.transform(fs.readFileSync(path.join(__dirname,'../components/EmployeeDashboard.js'),'utf8'),{filename:'EmployeeDashboard.js',jsc:{parser:{syntax:'ecmascript',jsx:true}}});
 console.log('PASS: all 13 staff roles have personal-service cards, restricted department links, HR/admin-only upload wording, function mappings and JSX compile.');
})().catch(e=>{console.error(e);process.exit(1)});

