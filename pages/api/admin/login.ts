import type { NextApiRequest, NextApiResponse } from 'next'

// Simple admin login for demo. Use environment variable ADMIN_PASSWORD to control.

export default function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { password } = req.body
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe123!'
  if(password === ADMIN_PASSWORD){
    // return a simple token (not secure) — front-end stores in localStorage
    return res.status(200).json({ token: 'demo-admin-token' })
  }
  return res.status(401).json({ error: 'Invalid password' })
}
