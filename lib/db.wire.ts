// lib/db.wire.ts
// Runtime wiring: pick backend implementation based on environment variables.
// - If SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set, use the Supabase adapter (server-side only).
// - Else, use the SQLite/JSON fallback implementation in lib/db.ts

let adapter: any = null

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  adapter = require('./db.supabase')
} else {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  adapter = require('./db')
}

export const initDb = adapter.initDb
export const getAllProducts = adapter.getAllProducts
export const getProductBySlug = adapter.getProductBySlug
export const upsertProduct = adapter.upsertProduct
export const deleteProduct = adapter.deleteProduct
export const importProducts = adapter.importProducts
export const addRequest = adapter.addRequest
export const getRequests = adapter.getRequests
