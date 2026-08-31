const windows = new Map()
const fallbackCategories = [
  ['service','Service parts','service kit'],['brakes','Brakes','brake'],['suspension','Suspension & steering','suspension'],
  ['engine','Engine','engine'],['filters','Filters','filter'],['electrical','Electrical','electrical'],
  ['cooling','Cooling','cooling'],['transmission','Transmission','transmission'],['body','Body & lighting','body']
].map(([id,name,searchTerm]) => ({ id, name, searchTerm, fallback:true }))
function rateLimited(ip) { const now = Date.now(); const recent = (windows.get(ip) || []).filter(t => now - t < 60000); recent.push(now); windows.set(ip, recent); return recent.length > 12 }
function flatten(value, out = []) { if (!value || out.length >= 80) return out; if (Array.isArray(value)) { value.forEach(v => flatten(v, out)); return out } if (typeof value !== 'object') return out; const id = value.categoryId ?? value.categoryID ?? value.assemblyGroupNodeId ?? value.productGroupId ?? value.id; const name = value.description ?? value.name ?? value.assemblyGroupName ?? value.assemblyGroupNameEn ?? value.productGroup ?? value.productGroupDescription; if (id != null && name && !out.some(item => item.id === String(id))) out.push({ id: String(id), name: String(name) }); Object.values(value).forEach(v => flatten(v, out)); return out }
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const vehicleId = String(req.query.vehicleId || '').trim()
  if (!/^\d{1,10}$/.test(vehicleId)) return res.status(400).json({ error: 'Invalid vehicle' })
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()
  if (rateLimited(ip)) return res.status(429).json({ error: 'Too many catalogue requests' })
  const key = process.env.AUTO_PARTS_API_KEY
  if (!key) return res.status(503).json({ error: 'Parts catalogue is not configured' })
  const base = String(process.env.AUTO_PARTS_API_BASE_URL || 'https://auto-parts-catalog.apiprofile.com').replace(/\/$/, '')
  const url = `${base}/api/category/type-id/1/products-groups-variant-2/${vehicleId}/lang-id/4`
  try { const response = await fetch(url, { headers: { 'x-apiprofile-key': key, accept: 'application/json' }, signal: AbortSignal.timeout(12000), cache: 'no-store' }); if (response.status === 404) return res.json({ categories: fallbackCategories, source: 'Auto Parts Catalog', fallback:true }); if (!response.ok) throw new Error(String(response.status)); const categories=flatten(await response.json()); return res.json({ categories: categories.length ? categories : fallbackCategories, source: 'Auto Parts Catalog', fallback:!categories.length }) } catch (error) { console.error('Catalog category lookup failed:', error.message); return res.json({ categories: fallbackCategories, source: 'Auto Parts Catalog', fallback:true }) }
}

