import { query } from '../../lib/db';
import { readSession } from '../../lib/auth';

const validVin = vin => /^[A-HJ-NPR-Z0-9]{17}$/.test(String(vin || '').toUpperCase());

export default async function handler(req, res) {
  const session = await readSession(req);
  if (!session) return res.status(401).json({ error: 'Sign in required.' });

  try {
    if (req.method === 'GET') {
      const result = await query(
        `SELECT id,vin,make,model,model_year AS "modelYear",engine,trim,created_at AS "createdAt"
         FROM garage_vehicles WHERE customer_id=$1 ORDER BY created_at DESC`,
        [session.sub]
      );
      return res.status(200).json({ vehicles: result.rows });
    }

    if (req.method === 'POST') {
      const { vin, make, model, modelYear, engine, trim } = req.body || {};
      const normalized = String(vin || '').toUpperCase().trim();
      if (!validVin(normalized)) return res.status(400).json({ error: 'Enter a valid 17-character VIN.' });
      const result = await query(
        `INSERT INTO garage_vehicles (customer_id,vin,make,model,model_year,engine,trim)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (customer_id,vin) DO UPDATE SET
           make=EXCLUDED.make, model=EXCLUDED.model, model_year=EXCLUDED.model_year,
           engine=EXCLUDED.engine, trim=EXCLUDED.trim
         RETURNING id,vin,make,model,model_year AS "modelYear",engine,trim`,
        [session.sub, normalized, make || null, model || null, modelYear || null, engine || null, trim || null]
      );
      return res.status(200).json({ vehicle: result.rows[0] });
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'Vehicle id is required.' });
      await query('DELETE FROM garage_vehicles WHERE id=$1 AND customer_id=$2', [id, session.sub]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not update My Garage.' });
  }
}
