import { useEffect, useState } from 'react'

export default function AdminProducts(){
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any|null>(null)
  const [message, setMessage] = useState('')
  const [token, setToken] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('shila_admin_token') : null)
  const [password, setPassword] = useState('')

  useEffect(()=>{ if(token) fetchList() }, [token])

  async function login(){
    const res = await fetch('/api/admin/login', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password })})
    if(res.ok){ const json = await res.json(); localStorage.setItem('shila_admin_token', json.token); setToken(json.token); setMessage('Logged in') }
    else { setMessage('Login failed') }
  }

  async function fetchList(){
    setLoading(true)
    const res = await fetch('/api/admin/products', { headers: token? { 'Authorization': 'Bearer ' + token } : undefined })
    const data = await res.json()
    setProducts(data.products || [])
    setLoading(false)
  }

  async function remove(sku:string){
    if(!confirm('Delete product '+sku+'?')) return
    await fetch('/api/admin/products', { method: 'POST', headers: {'Content-Type':'application/json', 'Authorization': 'Bearer ' + token}, body: JSON.stringify({ action: 'delete', product: { sku } }) })
    setMessage('Product deleted')
    fetchList()
  }

  function openCreate(){ setEditing({ sku: `SHL-${Date.now()}`, name: '', brand: '', category: '', compatibility: [], part_number: '', oem_number: '', price: null, stock_status: 'In Stock', image: '', featured: false, description: '' }) }

  function openEdit(p:any){ setEditing(p) }

  async function saveProduct(p:any){
    await fetch('/api/admin/products', { method:'POST', headers:{'Content-Type':'application/json', 'Authorization': 'Bearer ' + token}, body: JSON.stringify({ action: 'update', product: p }) })
    setMessage('Product saved')
    setEditing(null)
    fetchList()
  }

  function downloadCSVTemplate(){
    const header = ['sku','name','brand','category','compatibility','part_number','oem_number','price','stock_status','image','featured','description']
    const csv = header.join(',') + '\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'shilatech_products_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCSVFile(file:File){
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    if(lines.length<2) { alert('CSV appears empty'); return }
    const headers = lines[0].split(',').map(h=>h.trim())
    const rows = lines.slice(1).map(line => {
      const cols = line.split(',')
      const obj:any = {}
      headers.forEach((h,i)=> obj[h]=cols[i] ? cols[i].trim() : '')
      if(obj.compatibility) obj.compatibility = obj.compatibility.split(/\||\//).map((s:string)=>s.trim()).filter(Boolean)
      obj.price = obj.price? Number(obj.price) : null
      obj.featured = obj.featured === 'true' || obj.featured === '1'
      return obj
    })
    // send to import
    await fetch('/api/admin/products', { method:'POST', headers:{'Content-Type':'application/json', 'Authorization': 'Bearer ' + token}, body: JSON.stringify({ action: 'import', products: rows }) })
    setMessage('CSV imported successfully')
    fetchList()
  }

  if(!token) return (
    <div className="pt-24 max-w-4xl mx-auto px-4">
      <h1 className="text-2xl font-bold mt-8">Admin Login</h1>
      <p className="mt-2 text-shilaSilver">Enter admin password to continue.</p>
      <div className="mt-4">
        <input type="password" className="p-2 rounded bg-neutral-900" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Admin password" />
        <button onClick={login} className="ml-2 px-4 py-2 bg-shilaAccent rounded-md">Login</button>
      </div>
      {message && <div className="mt-4 text-shilaSilver">{message}</div>}
    </div>
  )

  return (
    <div className="pt-24 max-w-6xl mx-auto px-4 pb-16">
      <h1 className="text-2xl font-bold mt-8">Admin — Products</h1>
      <p className="text-sm text-shilaSilver mt-2">Manage product catalogue.</p>

      <div className="mt-6 flex gap-3">
        <button onClick={openCreate} className="px-4 py-2 bg-shilaAccent rounded-md">Add Product</button>
        <button onClick={downloadCSVTemplate} className="px-4 py-2 border rounded-md">Download CSV Template</button>
        <label className="px-4 py-2 border rounded-md cursor-pointer">
          Import CSV
          <input type="file" accept=".csv" onChange={e=>{ const f = e.target.files?.[0]; if(f) handleCSVFile(f) }} className="hidden" />
        </label>
      </div>

      {message && <div className="mt-4 text-green-400">{message}</div>}

      <div className="mt-6 overflow-x-auto">
        {loading ? <div className="text-shilaSilver">Loading…</div> : (
          <table className="w-full text-sm text-left">
            <thead className="text-shilaSilver">
              <tr><th className="p-2">SKU</th><th className="p-2">Name</th><th className="p-2">Brand</th><th className="p-2">Price</th><th className="p-2">Stock</th><th className="p-2">Actions</th></tr>
            </thead>
            <tbody>
              {products.map(p=> (
                <tr key={p.sku} className="border-t border-white/5">
                  <td className="p-2">{p.sku}</td>
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.brand}</td>
                  <td className="p-2">{p.price? `KSh ${p.price}` : 'Request'}</td>
                  <td className="p-2">{p.stock_status}</td>
                  <td className="p-2">
                    <button onClick={()=>openEdit(p)} className="mr-2 px-2 py-1 border rounded">Edit</button>
                    <button onClick={()=>remove(p.sku)} className="px-2 py-1 border rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="mt-6 card p-4 rounded">
          <h3 className="font-semibold">{editing && editing.name ? 'Edit Product' : 'Add Product'}</h3>
          <ProductForm product={editing} onCancel={()=>setEditing(null)} onSave={saveProduct} />
        </div>
      )}
    </div>
  )
}

function ProductForm({ product, onCancel, onSave }:{product:any, onCancel:()=>void, onSave:(p:any)=>void}){
  const [p, setP] = useState({ ...product })

  function update(k:string, v:any){ setP((s:any)=>({ ...s, [k]: v })) }

  return (
    <form onSubmit={e=>{ e.preventDefault(); onSave(p) }} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm">SKU</label>
        <input value={p.sku} onChange={e=>update('sku', e.target.value)} className="w-full p-2 rounded bg-neutral-900" />
      </div>
      <div>
        <label className="text-sm">Name</label>
        <input value={p.name} onChange={e=>update('name', e.target.value)} className="w-full p-2 rounded bg-neutral-900" />
      </div>
      <div>
        <label className="text-sm">Brand</label>
        <input value={p.brand} onChange={e=>update('brand', e.target.value)} className="w-full p-2 rounded bg-neutral-900" />
      </div>
      <div>
        <label className="text-sm">Category</label>
        <input value={p.category} onChange={e=>update('category', e.target.value)} className="w-full p-2 rounded bg-neutral-900" />
      </div>

      <div>
        <label className="text-sm">Compatibility (comma separated)</label>
        <input value={(p.compatibility||[]).join(', ')} onChange={e=>update('compatibility', e.target.value.split(',').map((s:string)=>s.trim()))} className="w-full p-2 rounded bg-neutral-900" />
      </div>

      <div>
        <label className="text-sm">Part Number</label>
        <input value={p.part_number} onChange={e=>update('part_number', e.target.value)} className="w-full p-2 rounded bg-neutral-900" />
      </div>

      <div>
        <label className="text-sm">OEM Number</label>
        <input value={p.oem_number} onChange={e=>update('oem_number', e.target.value)} className="w-full p-2 rounded bg-neutral-900" />
      </div>

      <div>
        <label className="text-sm">Price (KSh)</label>
        <input value={p.price||''} onChange={e=>update('price', e.target.value ? Number(e.target.value) : null)} className="w-full p-2 rounded bg-neutral-900" />
      </div>

      <div>
        <label className="text-sm">Stock Status</label>
        <select value={p.stock_status} onChange={e=>update('stock_status', e.target.value)} className="w-full p-2 rounded bg-neutral-900">
          <option>In Stock</option>
          <option>Low Stock</option>
          <option>Request</option>
          <option>Out of Stock</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="text-sm">Image URL (public path)</label>
        <input value={p.image} onChange={e=>update('image', e.target.value)} className="w-full p-2 rounded bg-neutral-900" />
      </div>

      <div className="md:col-span-2">
        <label className="text-sm">Short Description</label>
        <textarea value={p.description} onChange={e=>update('description', e.target.value)} className="w-full p-2 rounded bg-neutral-900" />
      </div>

      <div className="flex gap-3 md:col-span-2">
        <button className="px-4 py-2 bg-shilaAccent rounded-md" type="submit">Save Product</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md">Cancel</button>
      </div>
    </form>
  )
}
