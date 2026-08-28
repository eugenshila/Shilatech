import {staffPages,staffPageLabels} from './staff-access.mjs';
export function employeeShortcuts(role,path){
 const pages=staffPages(role);if(!pages.length)return [];
 const root=path.startsWith('/warehouse/')?'/warehouse':path;
 const cards=pages.filter(p=>p!==root&&p!=='/my-hr').map(p=>({href:p,label:staffPageLabels[p],detail:'Open department'}));
 if(root!=='/my-hr'){
  cards.push({href:'/my-hr#leave',label:'Leave applications',detail:'Apply and check your requests'},
   {href:'/my-hr#payslips',label:'My payslips',detail:'View and download approved payslips'},
   {href:'/my-hr#documents',label:'Employee documents',detail:['hr','admin'].includes(role)?'Upload and manage private records':'View your own documents'},
   {href:'/my-hr#medical',label:'Medical insurance',detail:'Applications and supporting records'},
   {href:'/my-hr#email',label:'Email',detail:'Not connected yet'});
 }
 return cards;
}
const functions=[
 [/^Add account customer$/,'account-customer','Add customer'],[/^Approve customer credit$/,'credit','Approve credit limits'],[/^Create quotation$/,'quotation','Create quotation'],[/^Create invoice from quotation$/,'invoice','Issue invoice'],[/^Record invoice payment$/,'payment','Record customer payment'],[/^Document history$/,'documents-history','Quotations & invoices'],[/^Receivables reports$/,'receivables-reports','Receivables reports'],
 [/^Apply for leave$/,'leave','Apply for leave'],[/^(Leave review|My leave requests)$/,'leave-review','Leave requests'],
 [/^My approved payslips$/,'payslips','My payslips'],[/^Staff directory$/,'directory','Staff directory'],
 [/^Employee documents$/,'documents','Employee documents'],[/^Medical insurance applications$/,'medical','Medical insurance'],[/^Email$/,'email','Email (not connected)'],
 [/^Customer order fulfilment queue$/,'fulfilment','Pick, pack & dispatch'],[/^Separate storage area/,'brand-storage','Brand warehouses'],
 [/^Upload parts from CSV$/,'parts-import','Bulk parts receiving'],[/^Receive stock$/,'receive','Receive parts'],[/^Create preorder$/,'preorder','Create preorder'],[/^Return \/ factory defect$/,'return','Receive returns'],[/FIFO stock batches$/,'batches','Stock batches & labels'],[/^Open preorders$/,'preorders','Open preorders'],[/^Open returns & defects$/,'returns','Returns & defects'],
 [/^Find a part$/,'find-part','Find parts'],[/^Counter sale$/,'counter-sale','Create counter sale'],[/^Recent receipts$/,'receipts','Sales receipts'],
 [/^New booking$/,'booking','New garage booking'],[/^Job cards \(/,'jobs','Garage job cards'],
 [/^Driver accounts$/,'drivers','Driver accounts'],[/^Assign deliveries$/,'assign','Assign deliveries'],[/^(Active delivery queue|My delivery queue)$/,'deliveries','Delivery queue'],
 [/^Add supplier$/,'suppliers','Add supplier'],[/^Create purchase order$/,'purchase','Create purchase order'],[/^Create employee$/,'create-employee','Create staff account'],[/^Low stock alerts$/,'low-stock','Low stock alerts'],[/^Recent purchase orders$/,'purchase-orders','Purchase orders'],[/^Employee access$/,'staff-access','Staff account management'],
 [/^Add staff account$/,'add-staff','Add staff account'],[/^Add product$/,'add-product','Add product'],[/^Recent order pipeline$/,'orders','Customer orders'],[/^Products$/,'products','Products'],
 [/^Prepare a salary record$/,'salary','Prepare payroll'],[/^Salary records$/,'salary-records','Salary records'],
 [/^New request$/,'new-request','New approval request'],[/^Request history$/,'request-history','Requests & decisions'],[/^Approved refunds$/,'refunds','Approved refunds']
];
export function functionCard(text){const item=functions.find(([pattern])=>pattern.test(text.trim()));return item?{id:item[1],label:item[2]}:null;}
