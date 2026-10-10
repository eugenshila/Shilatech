import pg from 'pg';
import { loadDatabaseUrl } from '../lib/db-env.mjs';
import { assertLocalDatabase, createLocalAdministrator } from '../lib/local-admin.mjs';

// Run only on your own laptop, after db:migrate. Never store the printed password.
const email = process.argv[2];
if (!email) {
  console.error('Usage: npm run admin:bootstrap:local -- your-email@example.com');
  process.exitCode = 1;
} else {
  try {
    if (process.env.NODE_ENV === 'production') throw new Error('Local administrator setup is disabled in production.');
    loadDatabaseUrl();
    assertLocalDatabase(process.env.DATABASE_URL);
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const password = await createLocalAdministrator(client, email);
        await client.query('COMMIT');
        console.log(`Local administrator created for ${email.trim().toLowerCase()}.`);
        console.log(`One-time temporary password: ${password}`);
        console.log('Sign in at /staff-login and change the password immediately. Do not share or commit this password.');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
