import { useEffect, useState } from 'react';
import { placesAutocomplete, placeDetails } from '@/lib/google';

export default function AddressSearch({ label, onPick }: { label: string; onPick: (addr: { description: string; lat: number; lng: number }) => void; }) {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.length < 3) { setSuggestions([]); return; }
      try {
        const res = await placesAutocomplete(q);
        setSuggestions(res.predictions || []);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const pick = async (p: any) => {
    try {
      const details = await placeDetails(p.place_id);
      const loc = details.result.geometry.location;
      onPick({ description: p.description, lat: loc.lat, lng: loc.lng });
      setQ(p.description);
      setSuggestions([]);
    } catch (error) {
      console.error('Place details error:', error);
    }
  };

  return (
    <div className="addr-box">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input 
        value={q} 
        onChange={(e) => setQ(e.target.value)} 
        placeholder="Start typing address…" 
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        data-testid={`input-${label.toLowerCase().replace(/\s+/g, '-')}`}
      />
      {suggestions.length > 0 && (
        <ul className="dropdown absolute bg-white border border-gray-200 w-full z-50 max-h-60 overflow-auto rounded-lg shadow-lg mt-1">
          {suggestions.map((s) => (
            <li 
              key={s.place_id} 
              onClick={() => pick(s)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
              data-testid={`suggestion-${s.place_id}`}
            >
              {s.description}
            </li>
          ))}
        </ul>
      )}
      <style>{`
        .addr-box { position: relative; max-width: 520px; }
      `}</style>
    </div>
  );
}