import { useEffect, useState } from 'react';
import { rankLeadsByDriveTime } from '@/lib/leadRanker';
import { Contractor, Lead, RankedLead } from '@/types/geo';

const pillColor: Record<Lead['priority'], string> = {
  TREE_ON_HOME: '#e11d48',      // red
  TREE_ON_BUILDING: '#f97316',  // orange
  TREE_ON_STRUCTURE: '#f59e0b', // amber
  CAR_ON_HOUSE: '#06b6d4',      // cyan
  OTHER: '#64748b',             // slate
};

export default function LeadBoard({ contractors, leads, onOpenOnGlobe }:{
  contractors: Contractor[];
  leads: Lead[];
  onOpenOnGlobe: (lead: RankedLead) => void;
}){
  const [ranked, setRanked] = useState<RankedLead[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await rankLeadsByDriveTime(contractors, leads);
      setRanked(r);
      setLoading(false);
    })();
  }, [contractors, leads]);

  return (
    <div className="lead-board">
      <header>
        <h2>Lead Auto‑Ranking</h2>
        {loading && <span className="spinner">Ranking…</span>}
      </header>
      <table>
        <thead>
          <tr>
            <th>Priority</th><th>Address</th><th>Best Contractor</th><th>ETA</th><th>Distance</th><th></th>
          </tr>
        </thead>
        <tbody>
          {ranked.map(l => (
            <tr key={l.id}>
              <td><span className="pill" style={{background:pillColor[l.priority]}}>{l.priority.replace(/_/g, ' ')}</span></td>
              <td>{l.address}</td>
              <td>{l.bestContractorId}</td>
              <td>{(l.etaSec/60).toFixed(0)} min</td>
              <td>{(l.distanceMeters/1609.34).toFixed(1)} mi</td>
              <td><button onClick={()=> onOpenOnGlobe(l)} data-testid={`button-open-globe-${l.id}`}>Open on Globe</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        .lead-board{ padding:12px; }
        .spinner{ font-size:12px; opacity:0.7; margin-left:8px; }
        table{ width:100%; border-collapse:collapse; }
        th,td{ padding:8px 10px; border-bottom:1px solid #eee; text-align:left; }
        .pill{ color:#fff; padding:4px 8px; border-radius:999px; font-size:12px; white-space:nowrap; }
      `}</style>
    </div>
  );
}