import { NextResponse } from 'next/server';

export function middleware(request){
  const response=NextResponse.next();
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('X-Frame-Options','DENY');
  response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy','camera=(self), geolocation=(self), microphone=()');
  response.headers.set('Cross-Origin-Opener-Policy','same-origin');
  if(process.env.NODE_ENV==='production') response.headers.set('Strict-Transport-Security','max-age=31536000; includeSubDomains');
  const p=request.nextUrl.pathname;
  if(p.startsWith('/staff')||p.startsWith('/approvals')||p.startsWith('/api/staff')||p.startsWith('/api/approvals')||p.startsWith('/staff-login')||p.startsWith('/pos')||p.startsWith('/api/pos')||p.startsWith('/admin')||p.startsWith('/warehouse')||p.startsWith('/delivery')||p.startsWith('/operations')||p.startsWith('/account')||p.startsWith('/api/admin')||p.startsWith('/api/warehouse')||p.startsWith('/api/delivery')){
    response.headers.set('Cache-Control','private, no-store, max-age=0');
    response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
  }
  return response;
}

export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
