import { readSession } from './auth';

const BRAND_BY_EMAIL={jeep:'Jeep','mercedesbenz':'Mercedes-Benz',volkswagen:'Volkswagen','ranger rover':'Range Rover',volvo:'Volvo',ford:'Ford'};
export function assignedBrand(session){const local=String(session?.email||'').split('@')[0].toLowerCase();return BRAND_BY_EMAIL[local]||null;}

export const WAREHOUSE_ROLES = new Set([
  'admin',
  'general_manager',
  'warehouse_manager',
  'warehouse_clerk',
  'picker',
  'packer',
  'dispatch',
  'finance',
  'auditor'
]);

export async function requireWarehouseStaff(req, res, allowedRoles = null) {
  const session = await readSession(req);
  if (!session) {
    res.status(401).json({ error: 'Staff sign-in required.' });
    return null;
  }
  if (!WAREHOUSE_ROLES.has(session.role)) {
    res.status(403).json({ error: 'Warehouse access denied.' });
    return null;
  }
  session.assignedBrand=assignedBrand(session);
  if(session.role==='general_manager'){if(req.method==='GET')return session;res.status(403).json({error:'General managers have read-only access. Submit a request for administrator approval.'});return null;}
  if (allowedRoles && !allowedRoles.includes(session.role) && session.role !== 'admin') {
    res.status(403).json({ error: 'Your staff role does not allow this action.' });
    return null;
  }
  return session;
}
