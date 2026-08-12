import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'

export default function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { password } = req.body
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe123!'
  if(password === ADMIN_PASSWORD){
    const token = jwt.sign({ role: 'admin' }, ADMIN_PASSWORD, { expiresIn: '8h' })
    return res.status(200).json({ token })
  }
  return res.status(401).json({ error: 'Invalid password' })
}
