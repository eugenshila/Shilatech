import { readFile } from 'node:fs/promises';
import { bootstrapAdministrator } from '../lib/account-security.mjs';
import { createDatabasePool } from '../lib/db-env.mjs';
const pool=createDatabasePool();
try {
 await pool.query(await readFile(new URL('./locations-pos.sql',import.meta.url),'utf8'));
 await pool.query(await readFile(new URL('./staff-workflows.sql',import.meta.url),'utf8'));
 const client=await pool.connect();
 try{await client.query('BEGIN');const reset=await bootstrapAdministrator(client,process.env);await client.query('COMMIT');if(reset)console.log('Authorised administrator setup applied once. Password change required on sign-in.');}
 catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 console.log('Location and counter POS migration complete. Run the stock reconciliation check before selling.');
} finally { await pool.end(); }
