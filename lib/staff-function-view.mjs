// Keep existing forms mounted so moving between functions never discards a draft.
export function clearFunctionView(root){
 for(const el of root.querySelectorAll('[data-function-concealed]')){el.removeAttribute('data-function-concealed');}
 for(const el of root.querySelectorAll('[data-function-path]'))el.removeAttribute('data-function-path');
}
export function isolateFunction(root,heading){
 clearFunctionView(root);
 const keep=new Set();
 const special=heading.closest('#documents,#medical,.counterGrid,.brandStorageHead,.deliveryQueueTitle');
 let panel=special||heading.closest('form,details,.panel,.warehousePanel,.counterCard,.deliveryManagerPanel');
 if(panel&&!root.contains(panel))panel=null;
 if(panel&&panel.querySelectorAll('.staffFunctionTarget').length>1&&!panel.matches('.counterGrid'))panel=null;
 if(panel&&!panel.matches('.brandStorageHead,.deliveryQueueTitle'))keep.add(panel);
 else{
  let start=panel||heading;
  for(let el=start;el;el=el.nextElementSibling){
   if(el!==start&&(el.matches('.staffFunctionTarget')||el.querySelector('.staffFunctionTarget')))break;
   keep.add(el);
  }
 }
 // Keep outcome messages and generated statements visible after saving/printing.
 for(const el of root.querySelectorAll('[role="alert"],[role="status"],.counterError,.warehouseAlert,.deliveryAlert,.deliverySuccess,.staffSuccess,.counterReceipt,#personal-payslip,#personal-payslip + button'))keep.add(el);
 const paths=new Set();
 for(const node of keep)for(let p=node.parentElement;p&&p!==root;p=p.parentElement)paths.add(p);
 function walk(node){for(const child of node.children){if(keep.has(child))continue;if(paths.has(child)){child.setAttribute('data-function-path','');walk(child);}else if(!['STYLE','SCRIPT'].includes(child.tagName))child.setAttribute('data-function-concealed','');}}
 walk(root);
}
export function functionUrl(path,id){return path+'?function='+encodeURIComponent(id);}
