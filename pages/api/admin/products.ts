import type { NextApiRequest, NextApiResponse } from 'next'
import { initDb, getAllProducts, upsertProduct, deleteProduct, importProducts } from '../../../lib/db'

initDb()

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  try{
    if(req.method === 'GET'){
      const products = getAllProducts()
      return res.status(200).json({ products })
    }

    if(req.method === 'POST'){
      const { action, product, products } = req.body
      if(action === 'add' && product){ upsertProduct(product); return res.status(200).json({ success: true }) }
      if(action === 'update' && product){ upsertProduct(product); return res.status(200).json({ success: true }) }
      if(action === 'delete' && product && product.sku){ deleteProduct(product.sku); return res.status(200).json({ success: true }) }
      if(action === 'import' && Array.isArray(products)){ importProducts(products); return res.status(200).json({ success: true }) }
      return res.status(400).json({ error: 'Invalid action or payload' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  }catch(err:any){
    console.error('products API error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
