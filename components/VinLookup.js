import { useState } from 'react';
import { useRouter } from 'next/router';

const validVin = vin => /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);

export default function VinLookup({ compact=false }) {
  const router = useRouter();
  const [vin,setVin]=useState('');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');

  async function submit(e) {
    e.preventDefault();
    const clean = vin.trim().toUpperCase();
    if (!validVin(clean)) {
      setError('Enter a valid 17-character VIN. Letters I, O and Q are not used.');
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/vin?vin=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'VIN lookup failed');
      const q = new URLSearchParams({
        vin: clean,
        brand: data.make || '',
        model: data.model || '',
        year: data.year || ''
      }).toString();
      router.push(`/shop?${q}`);
    } catch (e) {
      setError(e.message + '. You can still search manually in the catalog.');
    } finally { setLoading(false); }
  }

  return (
    <form className={`vinForm ${compact?'compact':''}`} onSubmit={submit}>
      <div className="vinInputWrap">
        <input maxLength="17" value={vin} onChange={e=>setVin(e.target.value)} placeholder="Enter 17-character VIN" aria-label="Vehicle VIN" />
        <span>{vin.trim().length}/17</span>
      </div>
      <button className="button primary" disabled={loading}>{loading?'Checking…':'Check VIN'}</button>
      {error && <p className="formError">{error}</p>}
    </form>
  );
}
