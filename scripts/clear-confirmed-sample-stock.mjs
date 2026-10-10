import {readFile} from 'node:fs/promises';
import { createDatabasePool } from '../lib/db-env.mjs';
const pool=createDatabasePool();
try {
 await pool.query(await readFile(new URL('./clear-confirmed-sample-stock.sql',import.meta.url),'utf8'));
 console.log('Confirmed sample-stock correction completed or already applied. Catalogue and warehouse records preserved.');
} finally { await pool.end(); }
