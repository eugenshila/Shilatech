import jwt from 'jsonwebtoken';
import { query } from './db';

const COOKIE_NAME = 'shilatech_session';

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
  return value;
}

export function signSession(user) {
  return jwt.sign({ sub: String(user.id), email: user.email, role: user.role || 'customer', name: user.name }, secret(), { expiresIn: '7d' });
}

export async function readSession(req) {
  const raw = req.headers.cookie || '';
  const cookie = raw.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return null;
  try {
    const token=jwt.verify(decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1)), secret());
    const result=await query('SELECT id,name,email,role,location_id FROM customers WHERE id=$1',[token.sub]);
    const user=result.rows[0];
    return user?{...user,sub:String(user.id)}:null;
  } catch {
    return null;
  }
}

export function setSession(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`);
}

export function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}
