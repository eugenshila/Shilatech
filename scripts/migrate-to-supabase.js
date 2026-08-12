#!/usr/bin/env node
/*
  scripts/migrate-to-supabase.js
  Reads data/products.json and inserts into a Supabase table named 'products' using the REST API.

  Required ENV:
    SUPABASE_URL           e.g. https://xyzcompany.supabase.co
    SUPABASE_SERVICE_ROLE_KEY  (service role key with write permissions)

  Usage:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-to-supabase.js
*/

const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const PRODUCTS_JSON = path.join(process.cwd(), 'data', 'products.json')
if (!fs.existsSync(PRODUCTS_JSON)) {
  console.error('data/products.json not found in repository root')
  process.exit(1)
}

const raw = fs.readFileSync(PRODUCTS_JSON, 'utf8')
let items
try {
  items = JSON.parse(raw)
} catch (e) {
  console.error('Failed to parse products.json', e)
  process.exit(1)
}

async function upsertBatch(batch) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/products`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(batch),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Supabase upsert failed: ${res.status} ${text}`)
  }
  return text
}

;(async () => {
  try {
    const batchSize = 100
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize).map(it => ({
        sku: it.sku,
        slug: it.slug,
        name: it.name,
        brand: it.brand,
        category: it.category,
        compatibility: JSON.stringify(it.compatibility || []),
        part_number: it.part_number,
        oem_number: it.oem_number,
        price: it.price,
        stock_status: it.stock_status,
        image: it.image,
        featured: it.featured ? 1 : 0,
        description: it.description,
      }))
      console.log(`Upserting batch ${i}..${i + batch.length - 1}`)
      const r = await upsertBatch(batch)
      console.log('Batch result:', r)
    }
    console.log('Migration completed')
  } catch (e) {
    console.error('Migration failed', e)
    process.exit(1)
  }
})()
