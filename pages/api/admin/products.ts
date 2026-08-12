import { promises as fs } from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'

const DATA_PATH = path.join(process.cwd(), 'data', 'products.json')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const content = await fs.readFile(DATA_PATH, 'utf8')
      const products = JSON.parse(content)
      return res.status(200).json({ products })
    }

    if (req.method === 'POST') {
      // Add a single product or replace entire list when importing
      const { action, product, products } = req.body
      const content = await fs.readFile(DATA_PATH, 'utf8')
      const current = JSON.parse(content)

      if (action === 'add' && product) {
        current.push(product)
        await fs.writeFile(DATA_PATH, JSON.stringify(current, null, 2), 'utf8')
        return res.status(200).json({ success: true })
      }

      if (action === 'update' && product) {
        const idx = current.findIndex((p: any) => p.sku === product.sku)
        if (idx !== -1) current[idx] = product
        else current.push(product)
        await fs.writeFile(DATA_PATH, JSON.stringify(current, null, 2), 'utf8')
        return res.status(200).json({ success: true })
      }

      if (action === 'delete' && product && product.sku) {
        const filtered = current.filter((p: any) => p.sku !== product.sku)
        await fs.writeFile(DATA_PATH, JSON.stringify(filtered, null, 2), 'utf8')
        return res.status(200).json({ success: true })
      }

      if (action === 'import' && Array.isArray(products)) {
        // Replace current dataset with imported products
        await fs.writeFile(DATA_PATH, JSON.stringify(products, null, 2), 'utf8')
        return res.status(200).json({ success: true })
      }

      return res.status(400).json({ error: 'Invalid action or payload' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err:any) {
    console.error('API error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
