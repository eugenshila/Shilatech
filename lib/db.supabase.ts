import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function getAllProducts() {
  const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase.from('products').select('*').eq('slug', slug).limit(1).maybeSingle()
  if (error) throw error
  return data || null
}

export async function importProducts(items: any[]) {
  // Items should match the products table columns. Use upsert (on conflict) behavior by sending
  // the "on_conflict" query param via the REST API if needed; supabase-js upsert works too.
  const { data, error } = await supabase.from('products').upsert(items)
  if (error) throw error
  return data
}

export async function addRequest(r: any) {
  const { data, error } = await supabase.from('requests').insert([r])
  if (error) throw error
  return data
}

export async function getRequests() {
  const { data, error } = await supabase.from('requests').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}
