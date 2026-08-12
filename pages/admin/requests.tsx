import { useEffect, useState } from 'react'

export default function AdminRequests(){
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('shila_admin_token') : null)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  useEffect(()=>{ if(token) fetchList() }, [token])

  async function login(){
    const res = await fetch('/api/admin/login', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password })})
    if(res.ok){ const json = await res.json(); localStorage.setItem('shila_admin_token', json.token); setToken(json.token); setMessage('Logged in') }
    else { setMessage('Login failed') }
  }

  async function fetchList(){
    setLoading(true)
    const res = await fetch('/api/requests', { headers: token? { 'Authorization': 'Bearer ' + token } : undefined })
    const data = await res.json()
    setRequests(data.requests || [])
    setLoading(false)
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
      <h1 className="text-2xl font-bold mt-8">Admin — Part Requests</h1>
      <p className="text-sm text-shilaSilver mt-2">Recent part requests submitted by customers.</p>

      <div className="mt-6 overflow-x-auto">
        {loading ? <div className="text-shilaSilver">Loading…</div> : (
          <table className="w-full text-sm text-left">
            <thead className="text-shilaSilver">
              <tr><th className="p-2">ID</th><th className="p-2">Customer</th><th className="p-2">Vehicle</th><th className="p-2">Part</th><th className="p-2">Date</th></tr>
            </thead>
            <tbody>
              {requests.map(r=> (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">{r.name} <div className="text-xs text-shilaSilver">{r.phone} / {r.whatsapp} / {r.email}</div></td>
                  <td className="p-2">{r.make} {r.model} {r.year}</td>
                  <td className="p-2">{r.part_required || r.part_number}</td>
                  <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
