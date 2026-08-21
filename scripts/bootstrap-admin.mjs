import pg from 'pg';
import bcrypt from 'bcryptjs';

const email=String(process.env.ADMIN_BOOTSTRAP_EMAIL||'').trim().toLowerCase();
const password=String(process.env.ADMIN_BOOTSTRAP_PASSWORD||'');

if(!email&&!password){
  console.log('Admin bootstrap skipped');
  process.exit(0);
}
if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if(!email||password.length<12) throw new Error('Both ADMIN_BOOTSTRAP_EMAIL and a password of at least 12 characters are required');

const {Pool}=pg;
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:false});
try{
  const hash=await bcrypt.hash(password,12);
  const result=await pool.query(`UPDATE customers SET name=$1,password_hash=$2,role='admin' WHERE LOWER(email)=$3 RETURNING email,role`,['Eugene Shilachilu',hash,email]);
  if(result.rowCount!==1) throw new Error(`Expected exactly one existing account, updated ${result.rowCount}`);
  console.log(`Admin bootstrap complete for ${result.rows[0].email}: ${result.rows[0].role}`);
}finally{
  await pool.end();
}
