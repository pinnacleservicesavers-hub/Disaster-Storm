import { useState } from 'react';
import EyesInTheSkyGlobe from './EyesInTheSkyGlobe';
import Map2DView from '@/modules/Map2D/Map2DView';
import LeadBoard from '@/modules/Leads/LeadBoard';
import type { Contractor, Lead, RankedLead } from '@/types/geo';

export default function EyesTabs({ contractors, leads }:{ contractors: Contractor[]; leads: Lead[]; }){
  const [tab, setTab] = useState<'GLOBE'|'MAP'|'LEADS'>('GLOBE');

  const openOnGlobe = (lead: RankedLead) => {
    // Dispatch an event or use a global store to ask the globe view to fly to this lead
    window.dispatchEvent(new CustomEvent('open-lead', { detail: lead }));
    setTab('GLOBE');
  };

  return (
    <div className="wrap">
      <div className="tabs">
        <button 
          className={tab==='GLOBE'?'on':''} 
          onClick={()=>setTab('GLOBE')}
          data-testid="tab-globe"
        >
          🌍 Globe
        </button>
        <button 
          className={tab==='MAP'?'on':''} 
          onClick={()=>setTab('MAP')}
          data-testid="tab-map"
        >
          🗺️ 2D Map
        </button>
        <button 
          className={tab==='LEADS'?'on':''} 
          onClick={()=>setTab('LEADS')}
          data-testid="tab-leads"
        >
          📋 Leads
        </button>
      </div>
      <div className="view">
        {tab==='GLOBE' && <EyesInTheSkyGlobe/>}
        {tab==='MAP' && <Map2DView leads={leads} contractors={contractors}/>}
        {tab==='LEADS' && <LeadBoard contractors={contractors} leads={leads} onOpenOnGlobe={openOnGlobe}/>}
      </div>
      <style>{`
        .wrap{ height:100vh; display:flex; flex-direction:column; }
        .tabs{ display:flex; gap:8px; padding:8px; border-bottom:1px solid #eee; background:#fff; }
        .tabs button{ padding:8px 12px; border-radius:10px; border:1px solid #ddd; background:#fafafa; }
        .tabs button.on{ background:#111; color:#fff; border-color:#111; }
        .view{ height: calc(100vh - 50px); }
      `}</style>
    </div>
  );
}