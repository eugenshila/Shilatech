export default async function handler(req, res) {
  const vin = String(req.query.vin || '').trim().toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    return res.status(400).json({ error: 'Invalid VIN format' });
  }
  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`;
    const response = await fetch(url);
    const json = await response.json();
    const row = json?.Results?.[0];
    if (!row) return res.status(404).json({ error: 'VIN not recognized' });
    return res.json({
      vin,
      make: row.Make || '',
      model: row.Model || '',
      year: row.ModelYear || '',
      engine: [row.DisplacementL && `${row.DisplacementL}L`, row.EngineCylinders && `${row.EngineCylinders} cyl`].filter(Boolean).join(' • '),
      trim: row.Trim || row.Series || '',
      source: 'NHTSA vPIC'
    });
  } catch {
    return res.status(502).json({ error: 'VIN service unavailable' });
  }
}
