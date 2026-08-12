import { useEffect, useState } from 'react'

export default function AdminRequests(){
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ fetchList() }, [])

  async function fetchList(){
    setLoading(true)
    const res = await fetch('/api/requests')
    const json = await res.json()
    setRequests(json.requests||[])
    setLoading(false)
  }

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
