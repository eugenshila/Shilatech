import { promises as fs } from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  try{
    if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const { filename, data } = req.body
    if(!filename || !data) return res.status(400).json({ error: 'filename and data required' })

    // data should be data:<mime>;base64,AAAA
    const match = data.match(/^data:(.+);base64,(.+)$/)
    if(!match) return res.status(400).json({ error: 'Invalid data format' })
    const base64 = match[2]
    const buffer = Buffer.from(base64, 'base64')

    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const outPath = path.join(UPLOAD_DIR, safeName)
    await fs.writeFile(outPath, buffer)

    return res.status(200).json({ url: '/uploads/' + safeName })
  }catch(err:any){
    console.error('upload error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
