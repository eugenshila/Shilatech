## Summary

This PR makes the project deployable to serverless platforms (Vercel) by removing server-only native module imports from the client bundle and providing a path to a hosted DB for production writes.

### Changes
- lib/db.ts: runtime-safe SQLite implementation that falls back to reading data/products.json when better-sqlite3 is not available.
- lib/db.supabase.ts: Supabase adapter for production persistence.
- lib/db.wire.ts: runtime wiring that automatically selects Supabase (when SUPABASE env vars exist) or the SQLite/JSON fallback.
- pages/index.tsx, pages/products/index.tsx, pages/products/[slug].tsx: refactored to load products server-side using getStaticProps/getStaticPaths and call lib/db.wire; prevents bundling server-only modules into client JS.
- scripts/migrate-to-supabase.js: migration script to upsert data/products.json into Supabase via REST API.
- docs/SUPABASE_MIGRATION.md: step-by-step migration guide.
- package.json: added "migrate:supabase" script.

### Why
better-sqlite3 is a native module and causes build/runtime failures on Vercel. The JSON fallback allows the site to deploy as a read-only catalogue. Supabase is provided as the recommended production path for write operations and admin features.

### How to test
1. Checkout branch: `git fetch && git checkout chore/sqlite-fallback-and-supabase`
2. Install deps: `npm install`
3. Run dev server: `npm run dev` and verify `/` and `/products` render (JSON fallback used by default).
4. (Optional) Provision Supabase, run the migration script, set the SUPABASE_* env vars on Vercel, and verify the site uses Supabase.

### Follow-ups
- Move better-sqlite3 to optionalDependencies if you never plan to run native sqlite in production.
- Add CI smoke test to build and do a basic request to `/` to catch bundling errors.

---

Please review and merge when ready.
