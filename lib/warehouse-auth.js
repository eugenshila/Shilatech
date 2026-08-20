import { readSession } from './auth';

export const WAREHOUSE_ROLES = new Set([
  'admin',
  'warehouse_manager',
  'warehouse_clerk',
  'picker',
  'packer',
  'dispatch',
  'finance',
  'auditor'
]);

export function requireWarehouseStaff(req, res, allowedRoles = null) {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: 'Staff sign-in required.' });
    return null;
  }
  if (!WAREHOUSE_ROLES.has(session.role)) {
    res.status(403).json({ error: 'Warehouse access denied.' });
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(session.role) && session.role !== 'admin') {
    res.status(403).json({ error: 'Your staff role does not allow this action.' });
    return null;
  }
  return session;
}
