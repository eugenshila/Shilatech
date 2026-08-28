const destinations={
 admin:['/pos','/admin','/operations','/warehouse','/delivery'],
 warehouse_manager:['/pos','/warehouse','/operations','/delivery'],
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
