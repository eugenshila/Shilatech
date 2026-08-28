// Decorative only: existing company artwork, with no extra requests to external sites.
export default function StaffBrandBackground(){
 return <style jsx global>{`
  #employee-dashboard,div.functionView{
   background-color:#080d08;
   background-image:linear-gradient(90deg,rgba(8,13,8,.94) 0%,rgba(8,13,8,.80) 60%,rgba(8,13,8,.73) 100%),url('/shilatech-logo.webp');
   background-repeat:no-repeat;
   background-size:cover,680px auto;
   background-position:center,center;
  }
  #employee-dashboard{min-height:65vh;box-sizing:border-box}
  #employee-dashboard:has(.backLink){min-height:0;background-size:cover,320px auto;background-position:center,center}
  div.functionView{min-height:72vh;background-position:center,center}
  .functionView .counterShell,.functionView .hrPage,.functionView .warehousePage,.functionView .deliveryPage,.functionView .deliveryShell{
   background-color:transparent!important;
  }
  .functionView form,.functionView .counterCard,.functionView .warehousePanel,.functionView .panel,.functionView .staffRecord{
   background-color:rgba(8,15,8,.94);
  }
  @media(max-width:640px){
   #employee-dashboard,div.functionView{background-size:cover,min(420px,90vw) auto;background-position:center,center}
   #employee-dashboard:has(.backLink){background-size:cover,240px auto;background-position:center,center}
  }
  @media print{
   #employee-dashboard,div.functionView,.functionView .counterShell,.functionView .hrPage{background-image:none!important;background-color:white!important}
  }
 `}</style>;
}

