import pg from 'pg';
import { readFile } from 'node:fs/promises';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:false});
try {
 await pool.query(await readFile(new URL('./locations-pos.sql',import.meta.url),'utf8'));
 console.log('Location and counter POS migration complete. Run the stock reconciliation check before selling.');
} finally { await pool.end(); }
