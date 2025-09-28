import { useEffect, useMemo, useState } from 'react';
import { placesAutocomplete, placeDetails } from '@/lib/google';

export default function AddressSearch({ label, onPick }: { label: string; onPick: (addr: { description: string; lat: number; lng: number }) => void; }) {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.length < 3) { setSuggestions([]); return; }
      const res = await placesAutocomplete(q);
      setSuggestions(res.predictions || []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const pick = async (p: any) => {
    const details = await placeDetails(p.place_id);
    const loc = details.result.geometry.location;
    onPick({ description: p.description, lat: loc.lat, lng: loc.lng });
    setQ(p.description);
    setSuggestions([]);
  };

  return (
    <div className="addr-box">
      <label>{label}</label>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Start typing address…" />
      {suggestions.length > 0 && (
        <ul className="dropdown">
          {suggestions.map((s) => (
            <li key={s.place_id} onClick={() => pick(s)}>{s.description}</li>
          ))}
        </ul>
      )}
      <style>{`
        .addr-box{ position:relative; max-width:520px; }
        .addr-box input{ width:100%; padding:10px; border:1px solid #ccc; border-radius:10px; }
        .dropdown{ position:absolute; background:#fff; border:1px solid #ddd; width:100%; z-index:10; max-height:220px; overflow:auto; }
        .dropdown li{ padding:8px 10px; cursor:pointer; }
        .dropdown li:hover{ background:#f5f5f5; }
      `}</style>
    </div>
  );
}