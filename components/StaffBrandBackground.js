// Decorative only: existing company artwork, with no extra requests to external sites.
export default function StaffBrandBackground(){
 return <style jsx global>{`
  #employee-dashboard,div.functionView{
   background-color:#080d08;
   background-image:linear-gradient(90deg,rgba(8,13,8,.94) 0%,rgba(8,13,8,.80) 60%,rgba(8,13,8,.73) 100%),url('/shilatech-logo.webp');
   background-repeat:no-repeat;
   background-size:cover,cover;
   background-position:center,center;
  }
  #employee-dashboard{min-height:100vh;box-sizing:border-box}
  #employee-dashboard:has(.backLink){min-height:0;background-size:cover,cover;background-position:center,center}
  div.functionView{min-height:100vh;background-position:center,center}
  .functionView .counterShell,.functionView .hrPage,.functionView .warehousePage,.functionView .deliveryPage,.functionView .deliveryShell{
   background-color:transparent!important;
  }
  .functionView form,.functionView .counterCard,.functionView .warehousePanel,.functionView .panel,.functionView .staffRecord{
   background-color:rgba(8,15,8,.94);
  }
  /* Light text on the dark function view: the shared staff styles default to dark navy/green text for light pages. */
  .functionView .counterShell,.functionView .hrPage{color:#e8f1e4}
  .functionView .counterShell :is(h1,h2,h3,h4,legend),.functionView .staffRecord h3,.functionView .panel :is(h2,h3,h4){color:#e8f1e4}
  .functionView .staffForm label,.functionView .counterShell label{color:#dbe8d5}
  .functionView .staffHint,.functionView .counterShell small{color:#b4c5ad}
  .functionView .counterShell button:disabled{opacity:.75}
  .functionView .counterShell button small{color:#51685b}
  @media(max-width:640px){
   #employee-dashboard,div.functionView{background-size:cover,cover;background-position:center,center}
   #employee-dashboard:has(.backLink){background-size:cover,cover;background-position:center,center}
  }
  @media print{
   #employee-dashboard,div.functionView,.functionView .counterShell,.functionView .hrPage{background-image:none!important;background-color:white!important}
  }
 `}</style>;
}

