import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'shilatech_session';

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
  return value;
}

export function signSession(user) {
  return jwt.sign({ sub: String(user.id), email: user.email, role: user.role || 'customer', name: user.name }, secret(), { expiresIn: '7d' });
}

export function readSession(req) {
  const raw = req.headers.cookie || '';
  const cookie = raw.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return null;
  try {
    return jwt.verify(decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1)), secret());
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
