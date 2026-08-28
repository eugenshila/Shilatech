const destinations={
 admin:['/staff','/admin','/operations','/warehouse','/delivery','/pos','/staff-garage','/approvals','/payroll'],
 general_manager:['/staff','/admin','/operations','/warehouse','/delivery','/pos','/staff-garage','/approvals','/payroll'],
 garage_staff:['/staff-garage','/approvals'],
 warehouse_manager:['/warehouse','/approvals'],
 cashier:['/pos'],
 warehouse_clerk:['/warehouse'],picker:['/warehouse'],packer:['/warehouse'],
 dispatch:['/warehouse','/delivery'],finance:['/warehouse'],auditor:['/warehouse'],
 delivery_driver:['/delivery']
};

// Only known local destinations are accepted; never redirect to an arbitrary query-string URL.
export function staffDestination(role,requested){
 const allowed=Object.prototype.hasOwnProperty.call(destinations,role)?destinations[role]:null;
 if(!allowed)return null;
 return typeof requested==='string'&&allowed.includes(requested)?requested:allowed[0];
}

export function staffPages(role){
 const allowed=Object.prototype.hasOwnProperty.call(destinations,role)?destinations[role]:[];
 return allowed.length?[...new Set([...allowed,'/approvals','/my-hr'])]:[];
}
export function canViewStaffPage(role,path){
 const root=path.startsWith('/warehouse/')?'/warehouse':path;
 return staffPages(role).includes(root);
}
export const staffPageLabels={'/my-hr':'My HR','/payroll':'ERP & payroll','/staff':'Staff home','/admin':'Reports & administration','/operations':'Operations & staff','/warehouse':'Warehouse','/pos':'Sales counter','/staff-garage':'Garage jobs','/delivery':'Delivery','/approvals':'Requests & approvals'};
