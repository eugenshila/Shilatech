import type { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs'
import path from 'path'
import nodemailer from 'nodemailer'

const DATA_PATH = path.join(process.cwd(), 'data', 'requests.json')

async function writeRequest(entry:any){
  const content = await fs.readFile(DATA_PATH, 'utf8').catch(()=> '[]')
  const list = JSON.parse(content || '[]')
  list.unshift(entry)
  await fs.writeFile(DATA_PATH, JSON.stringify(list, null, 2), 'utf8')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  try{
    if(req.method === 'GET'){
      const content = await fs.readFile(DATA_PATH, 'utf8').catch(()=> '[]')
      const list = JSON.parse(content || '[]')
      return res.status(200).json({ requests: list })
    }

    if(req.method === 'POST'){
      const body = req.body
      const entry = {
        id: 'REQ-' + Date.now(),
        name: body.name || '',
        phone: body.phone || '',
        whatsapp: body.whatsapp || '',
        email: body.email || '',
        make: body.make || '',
        model: body.model || '',
        year: body.year || '',
        engine: body.engine || '',
        registration: body.registration || '',
        vin: body.vin || '',
        part_required: body.part_required || '',
        part_number: body.part_number || '',
        notes: body.notes || '',
        images: body.images || [],
        created_at: new Date().toISOString()
      }

      await writeRequest(entry)

      // Send notification email if SMTP configured
      if(process.env.SMTP_HOST){
        try{
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
          })

          const adminEmail = process.env.ADMIN_EMAIL || 'Eugene.Shilachilu@gmail.com'
          const subject = `New part request ${entry.id} — ${entry.part_required || entry.part_number || 'No part specified'}`
          const html = `<p>New part request received:</p>
            <ul>
              <li><strong>Name:</strong> ${entry.name}</li>
              <li><strong>Phone/WhatsApp:</strong> ${entry.phone}</li>
              <li><strong>Email:</strong> ${entry.email}</li>
              <li><strong>Vehicle:</strong> ${entry.make} ${entry.model} ${entry.year}</li>
              <li><strong>Part:</strong> ${entry.part_required} (${entry.part_number})</li>
              <li><strong>Notes:</strong> ${entry.notes}</li>
            </ul>`

          await transporter.sendMail({ from: process.env.SMTP_FROM || 'no-reply@shilatech.co.ke', to: adminEmail, subject, html })
        }catch(err){
          console.error('Email send failed', err)
        }
      }

      return res.status(201).json({ success: true, request: entry })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  }catch(err:any){
    console.error('requests API error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
