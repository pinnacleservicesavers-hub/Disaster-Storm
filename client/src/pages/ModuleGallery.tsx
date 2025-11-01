import { useState, useMemo, useRef } from 'react';
import { Star, Rocket, Volume2, VolumeX, BadgeInfo } from 'lucide-react';
import { useLocation } from 'wouter';
import { MODULES, ModuleData } from '@shared/moduleGallery';
import { ModuleCard } from '@/components/ModuleGallery/ModuleCard';
import { Toolbar } from '@/components/ModuleGallery/Toolbar';
import { Badge } from '@/components/ModuleGallery/Badge';

const NEON = {
  yellow: '#eaff00',
  blue: '#00c2ff',
};

interface ModuleGalleryProps {
  routes?: Record<string, string>;
  onLaunch?: (module: ModuleData) => void;
  onPreview?: (module: ModuleData) => void;
  onDocs?: (module: ModuleData) => void;
  brand?: {
    name?: string;
    logoUrl?: string;
  };
}

export default function ModuleGallery({
  routes = {},
  onLaunch,
  onPreview,
  onDocs,
  brand = { name: 'Disaster Direct', logoUrl: undefined }
}: ModuleGalleryProps) {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [highOnly, setHighOnly] = useState(false);
  const [voiceGuideActive, setVoiceGuideActive] = useState(false);
  const [shock, setShock] = useState({ key: 0, x: '50%', y: '50%' });
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let results = MODULES;

    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }

    if (cat !== 'all') {
      results = results.filter((m) => m.category === cat);
    }

    if (highOnly) {
      results = results.filter((m) => m.priority === 'HIGH');
    }

    return results;
  }, [query, cat, highOnly]);

  const triggerRipple = (e: React.MouseEvent) => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setShock({ key: Date.now(), x: `${x}px`, y: `${y}px` });
  };

  return (
    <div ref={rootRef} className="relative min-h-screen text-white overflow-hidden bg-black" style={{ 
      '--shock-x': shock.x, 
      '--shock-y': shock.y 
    } as React.CSSProperties}>
      {/* Inject CSS custom properties and animations */}
      <style>{`
        :root {
          --neon-yellow: ${NEON.yellow};
          --neon-blue: ${NEON.blue};
        }
        
        @keyframes energyWave {
          0% { opacity: 0.4; filter: blur(55px) brightness(1); transform: translateY(0); }
          25% { opacity: 0.8; filter: blur(60px) brightness(1.4); transform: translateY(-6px); }
          50% { opacity: 0.55; filter: blur(70px) brightness(1.15); transform: translateY(0); }
          75% { opacity: 0.9; filter: blur(65px) brightness(1.6); transform: translateY(6px); }
          100% { opacity: 0.4; filter: blur(55px) brightness(1); transform: translateY(0); }
        }
        
        .animate-energyWave {
          animation: energyWave 5s ease-in-out infinite;
        }
        
        /* FULL IMPACT SHOCKWAVE */
        @keyframes shockExpand {
          0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0.95; filter: blur(8px); box-shadow: 0 0 0 0 rgba(0,194,255,0.75), 0 0 0 0 rgba(234,255,0,0.55); }
          30% { opacity: 0.95; filter: blur(10px); }
          60% { opacity: 0.75; }
          100% { transform: translate(-50%, -50%) scale(6); opacity: 0; filter: blur(16px); box-shadow: 0 0 150px 60px rgba(0,194,255,0), 0 0 120px 40px rgba(234,255,0,0); }
        }
        .shockwave-ring {
          position: absolute; left: var(--shock-x); top: var(--shock-y);
          width: 220px; height: 220px; border-radius: 9999px; pointer-events:none; z-index: 1;
          background: radial-gradient(closest-side, rgba(0,194,255,0.95) 10%, rgba(234,255,0,0.85) 18%, rgba(0,194,255,0.4) 30%, rgba(0,0,0,0) 60%);
          box-shadow: 0 0 120px 40px rgba(0,194,255,.55), 0 0 80px 24px rgba(234,255,0,.45);
          animation: shockExpand 1.5s cubic-bezier(.2,.8,.2,1) forwards;
          mix-blend-mode: screen;
        }
        
        /* Title shimmer when shockwave fires */
        @keyframes titleShimmer {
          0% { text-shadow: 0 0 0 rgba(0,194,255,0); }
          30% { text-shadow: 0 0 18px rgba(0,194,255,0.8), 0 0 8px rgba(234,255,0,0.6); }
          60% { text-shadow: 0 0 28px rgba(0,194,255,1), 0 0 14px rgba(234,255,0,0.8); }
          100% { text-shadow: 0 0 0 rgba(0,194,255,0); }
        }
        .title-reactive { animation: titleShimmer 1.2s ease-out; }
      `}</style>
      
      {/* FULL IMPACT SHOCKWAVE RING (re-render to replay) */}
      <div key={shock.key} className="shockwave-ring" />
      
      <div className="max-w-7xl mx-auto px-8 py-16 relative z-10">
        {/* Title - Centered with cyan glow */}
        <div className="text-center mb-12">
          <h1 className={`text-7xl font-extrabold tracking-tight mb-8 ${shock.key ? 'title-reactive' : ''}`}
            style={{
              background: 'linear-gradient(90deg, #00d9ff 0%, #00ffcc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 80px rgba(0, 255, 204, 0.5)'
            }}
          >
            StormOps Modules
          </h1>
          
          {/* Search & Filter Bar */}
          <div className="flex items-center justify-center gap-4 mb-16">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-64 px-5 py-3 pl-12 rounded-xl bg-slate-900/60 border border-cyan-500/30 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all text-sm backdrop-blur-sm"
                data-testid="input-search"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <select
              onChange={(e) => setHighOnly(e.target.value === 'high')}
              className="px-5 py-3 rounded-xl bg-slate-900/60 border border-yellow-500/30 text-yellow-300 focus:outline-none focus:border-yellow-400 transition-all appearance-none cursor-pointer text-sm backdrop-blur-sm font-medium"
              style={{ paddingRight: '2.5rem' }}
            >
              <option value="all">Priority: High</option>
              <option value="high">High Priority Only</option>
            </select>
            
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="px-5 py-3 rounded-xl bg-slate-900/60 border border-cyan-500/30 text-cyan-300 focus:outline-none focus:border-cyan-400 transition-all appearance-none cursor-pointer text-sm backdrop-blur-sm font-medium"
              style={{ paddingRight: '2.5rem' }}
              data-testid="select-category"
            >
              <option value="all">Category</option>
              <option value="operations">Operations</option>
              <option value="intelligence">Intelligence</option>
              <option value="customers">Customers</option>
              <option value="sales">Sales</option>
              <option value="management">Management</option>
            </select>
          </div>
        </div>

        {/* Grid - 3 columns */}
        <div className="grid grid-cols-3 gap-8">
          {filtered.map((m, i) => (
            <ModuleCard 
              key={m.id} 
              m={{ ...m, path: routes[m.id] || m.path }}
              delay={i * 0.4}
              onLaunch={onLaunch ? () => onLaunch(m) : () => navigate(routes[m.id] || m.path)}
              onPreview={onPreview ? () => onPreview(m) : undefined}
              onDocs={onDocs ? () => onDocs(m) : undefined}
              onRipple={triggerRipple}
            />
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="mt-24 text-center text-white/60" data-testid="text-empty-state">
            No modules match your filters.
          </div>
        )}

        {/* Footer */}
        <div className="py-16" />
      </div>
    </div>
  );
}

/**
 * INTEGRATION EXAMPLES
 * ====================
 * 
 * 1) Basic usage (default routes):
 *    <ModuleGallery />
 * 
 * 2) Custom brand:
 *    <ModuleGallery 
 *      brand={{ 
 *        name: 'Storm Command Pro',
 *        logoUrl: '/assets/logo.png' 
 *      }} 
 *    />
 * 
 * 3) Custom routes for specific modules:
 *    const routes = {
 *      'weather': '/app/weather-intelligence',
 *      'claims': '/app/insurance-claims',
 *      'disaster-lens': '/app/documentation'
 *    };
 *    <ModuleGallery routes={routes} />
 * 
 * 4) Custom handlers with analytics:
 *    <ModuleGallery
 *      onLaunch={(module) => {
 *        analytics.track('module_launched', { id: module.id });
 *        navigate(`/modules/${module.id}`);
 *      }}
 *      onPreview={(module) => {
 *        analytics.track('module_previewed', { id: module.id });
 *        navigate(`/modules/${module.id}?mode=preview`);
 *      }}
 *      onDocs={(module) => {
 *        analytics.track('docs_opened', { id: module.id });
 *        window.open(`https://docs.example.com/${module.id}`, '_blank');
 *      }}
 *    />
 * 
 * 5) White-label integration:
 *    <ModuleGallery
 *      brand={{
 *        name: 'Strategic Land Management',
 *        logoUrl: '/client-logos/strategic-land.svg'
 *      }}
 *      routes={{
 *        'weather': '/slm/weather',
 *        'predictions': '/slm/storm-intel'
 *      }}
 *      onLaunch={(m) => customNavigationHandler(m)}
 *    />
 */
