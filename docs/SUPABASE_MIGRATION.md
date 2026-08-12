# Supabase migration guide

This guide explains how to migrate the local JSON catalogue (data/products.json) into a hosted Supabase Postgres database and how to switch the app to use Supabase in production.

Important: the migration script uses the Supabase REST endpoint and requires the Service Role Key (server-side secret) with write permissions. Do NOT use the anon/public key for this.

1) Provision a Supabase project
- Create a project at https://app.supabase.com and note the Project URL (SUPABASE_URL) and the Service Role Key (Settings → API).

2) Create the `products` table
Run the SQL below in the Supabase SQL editor (ensure schema public):

```sql
CREATE TABLE IF NOT EXISTS products (
  sku text primary key,
  slug text,
  name text,
  brand text,
  category text,
  compatibility jsonb,
  part_number text,
  oem_number text,
  price numeric,
  stock_status text,
  image text,
  featured int,
  description text
);
```

3) Run the migration script
From the repository root:

```bash
# Ensure Node 18+ so fetch is available, then run:
SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node scripts/migrate-to-supabase.js
```

The script will upsert products in batches. Inspect the table in the Supabase UI after completion.

4) Switching the app to Supabase
- Create a new file `lib/db.supabase.ts` (example snippet below) and load it conditionally in your app when environment variables are present.

Example minimal client (server-side only):

```ts
// lib/db.supabase.ts
import { createClient } from '@supabase/supabase-js'
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY // or a restricted service key for server operations
if(!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(url, key)

export async function getAllProducts(){
  const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true })
  if(error) throw error
  return data
}
```

- Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel (Project Settings → Environment Variables). Use the service role key only for server-side operations; do not expose it to the browser.

5) Notes
- The repo already contains `lib/db.ts` which uses better-sqlite3. To keep Vercel-friendly deployment we added a runtime-safe fallback (it reads data/products.json when native sqlite isn't available). For production writes and admin features use Supabase or another hosted DB.

If you want, I can add the `lib/db.supabase.ts` implementation and modify the app to switch between the SQLite and Supabase backends based on environment variables.