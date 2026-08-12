import { useEffect, useState } from 'react'

export default function RequestForm(){
  const [form, setForm] = useState({ name:'', phone:'', whatsapp:'', email:'', make:'', model:'', year:'', engine:'', registration:'', vin:'', part_required:'', part_number:'', notes:'' })
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(()=>{ setForm(f=>({...f, whatsapp: '+254721802597'})) }, [])

  function update(k:string, v:any){ setForm(s=>({...s, [k]: v})) }

  async function handleFile(file:File){
    const data = await fileToDataUrl(file)
    // upload to server
    const filename = `${Date.now()}-${file.name}`
    const res = await fetch('/api/admin/upload', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ filename, data }) })
    const json = await res.json()
    if(json.url) setImages(prev=>[...prev, json.url])
  }

  function fileToDataUrl(file:File){
    return new Promise<string>((resolve, reject)=>{
      const r = new FileReader()
      r.onload = ()=> resolve(String(r.result))
      r.onerror = reject
      r.readAsDataURL(file)
    })
  }

  async function submit(e:any){
    e.preventDefault()
    setLoading(true)
    const payload = { ...form, images }
    const res = await fetch('/api/requests', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    const json = await res.json()
    setLoading(false)
    if(json.success){
      setMessage('Request submitted — our team will contact you shortly.')
      // open WhatsApp follow-up
      const text = encodeURIComponent(`Hello Shilatech Auto Spares, I submitted a part request (${json.request.id}). Please confirm availability and price.`)
      window.open(`https://wa.me/254721802597?text=${text}`, '_blank')
    }else{
      setMessage('Submission failed, please try again or contact us on WhatsApp.')
    }
  }

  return (
    <div className="pt-24 max-w-3xl mx-auto px-4 pb-12">
      <h1 className="text-2xl font-bold mt-8">Request a Part</h1>
      <p className="text-sm text-shilaSilver mt-2">Fill the form below and our team will help identify and source the correct part. You can also continue the conversation on WhatsApp after submitting.</p>

      <form className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={submit}>
        <input value={form.name} onChange={e=>update('name', e.target.value)} placeholder="Customer Name" className="p-3 rounded bg-neutral-900 md:col-span-1" required />
        <input value={form.phone} onChange={e=>update('phone', e.target.value)} placeholder="Phone Number" className="p-3 rounded bg-neutral-900" required />
        <input value={form.whatsapp} onChange={e=>update('whatsapp', e.target.value)} placeholder="WhatsApp Number" className="p-3 rounded bg-neutral-900" />
        <input value={form.email} onChange={e=>update('email', e.target.value)} placeholder="Email" className="p-3 rounded bg-neutral-900" />

        <input value={form.make} onChange={e=>update('make', e.target.value)} placeholder="Vehicle Make" className="p-3 rounded bg-neutral-900" />
        <input value={form.model} onChange={e=>update('model', e.target.value)} placeholder="Vehicle Model" className="p-3 rounded bg-neutral-900" />
        <input value={form.year} onChange={e=>update('year', e.target.value)} placeholder="Year" className="p-3 rounded bg-neutral-900" />
        <input value={form.engine} onChange={e=>update('engine', e.target.value)} placeholder="Engine" className="p-3 rounded bg-neutral-900" />

        <input value={form.registration} onChange={e=>update('registration', e.target.value)} placeholder="Registration Number" className="p-3 rounded bg-neutral-900" />
        <input value={form.vin} onChange={e=>update('vin', e.target.value)} placeholder="VIN / Chassis Number" className="p-3 rounded bg-neutral-900" />

        <input value={form.part_required} onChange={e=>update('part_required', e.target.value)} placeholder="Part Required" className="p-3 rounded bg-neutral-900 md:col-span-2" />
        <input value={form.part_number} onChange={e=>update('part_number', e.target.value)} placeholder="Part Number (if known)" className="p-3 rounded bg-neutral-900 md:col-span-2" />

        <textarea value={form.notes} onChange={e=>update('notes', e.target.value)} placeholder="Additional Information" className="p-3 rounded bg-neutral-900 md:col-span-2" />

        <div className="md:col-span-2">
          <label className="text-sm">Upload Part Photo (optional)</label>
          <input type="file" accept="image/*" onChange={e=>{ const f = e.target.files?.[0]; if(f) handleFile(f) }} className="mt-2" />
          <div className="mt-2 flex gap-2">
            {images.map((u,i)=> <img key={i} src={u} className="h-16" />)}
          </div>
        </div>

        <div className="md:col-span-2 flex gap-3">
          <button type="submit" className="px-4 py-2 bg-shilaAccent rounded-md" disabled={loading}>{loading? 'Submitting…' : 'SUBMIT PART REQUEST'}</button>
          <button type="button" onClick={()=> window.open('https://wa.me/254721802597?text=Hello%20Shilatech%20Auto%20Spares%2C%20I%20need%20help%20finding%20a%20part', '_blank')} className="px-4 py-2 border rounded-md">Contact on WhatsApp</button>
        </div>
      </form>

      {message && <div className="mt-4 text-shilaSilver">{message}</div>}
    </div>
  )
}
