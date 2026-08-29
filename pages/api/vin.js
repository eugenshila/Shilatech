const attempts = new Map();

function limited(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter(t => now - t < 60000);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > 10;
}

function findValue(value, names, depth = 0) {
  if (!value || depth > 5) return '';
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findValue(item, names, depth + 1);
      if (found !== '') return found;
    }
    return '';
  }
  if (typeof value !== 'object') return '';
  const wanted = names.map(name => name.toLowerCase());
  for (const [key, item] of Object.entries(value)) {
    if (wanted.includes(key.toLowerCase()) && item !== null && typeof item !== 'object' && String(item).trim()) {
      return String(item).trim();
    }
  }
  for (const item of Object.values(value)) {
    const found = findValue(item, names, depth + 1);
    if (found !== '') return found;
  }
  return '';
}

function normaliseCatalog(json, vin) {
  const make = findValue(json, ['make','manufacturer','manufacturerName','manuName','brand']);
  const model = findValue(json, ['model','modelName','modelSeries','vehicleModel']);
  const year = findValue(json, ['year','modelYear','productionYear','yearFrom']);
  const engine = findValue(json, ['engine','engineName','engineCode','motorCode']);
  const trim = findValue(json, ['trim','variant','typeName','description']);
  const vehicleId = findValue(json, ['vehicleId','vehicleTypeId','typeId']);
  if (!make && !model && !vehicleId) return null;
  return {vin,make,model,year,engine,trim,vehicleId,source:'Auto Parts Catalog'};
}

async function catalogLookup(vin) {
  const key = process.env.AUTO_PARTS_API_KEY;
  if (!key) return null;
  const base = String(process.env.AUTO_PARTS_API_BASE_URL || 'https://auto-parts-catalog.apiprofile.com').replace(/\/$/,'');
  const response = await fetch(`${base}/api/vin/tecdoc-vin-check/${encodeURIComponent(vin)}`, {
    headers:{'x-apiprofile-key':key,'accept':'application/json'},
    signal:AbortSignal.timeout(9000),
    cache:'no-store'
  });
  if (!response.ok) return null;
  return normaliseCatalog(await response.json(), vin);
}

async function nhtsaLookup(vin) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`;
  const response = await fetch(url,{signal:AbortSignal.timeout(9000),cache:'no-store'});
  if (!response.ok) throw new Error('VIN fallback unavailable');
  const row = (await response.json())?.Results?.[0];
  if (!row) return null;
  return {
    vin,
    make:row.Make || '',
    model:row.Model || '',
    year:row.ModelYear || '',
    engine:[row.DisplacementL && `${row.DisplacementL}L`,row.EngineCylinders && `${row.EngineCylinders} cyl`].filter(Boolean).join(' • '),
    trim:row.Trim || row.Series || '',
    vehicleId:'',
    source:'NHTSA vPIC fallback'
  };
}

export default async function handler(req,res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow','GET');
    return res.status(405).json({error:'Method not allowed'});
  }
  res.setHeader('Cache-Control','no-store');
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (limited(ip)) return res.status(429).json({error:'Too many VIN checks. Please wait one minute'});
  const vin = String(req.query.vin || '').trim().toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return res.status(400).json({error:'Invalid VIN format'});
  try {
    const catalog = await catalogLookup(vin).catch(() => null);
    if (catalog) return res.json(catalog);
    const fallback = await nhtsaLookup(vin);
    if (!fallback || (!fallback.make && !fallback.model)) return res.status(404).json({error:'VIN not recognized'});
    return res.json(fallback);
  } catch {
    return res.status(502).json({error:'VIN service temporarily unavailable'});
  }
}
