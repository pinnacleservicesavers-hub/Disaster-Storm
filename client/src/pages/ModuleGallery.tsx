import { useState, useMemo, useRef } from 'react';
import { Star, Rocket, Volume2, VolumeX, BadgeInfo } from 'lucide-react';
import { MODULES, ModuleData } from '@shared/moduleGallery';
import { ModuleCard } from '@/components/ModuleGallery/ModuleCard';
import { Toolbar } from '@/components/ModuleGallery/Toolbar';
import { Badge } from '@/components/ModuleGallery/Badge';

const NEON = {
  yellow: '#eaff00',
  blue: '#00c2ff',
};

interface ModuleRoutes {
  launch?: string;
  preview?: string;
  docs?: string;
}

interface ModuleGalleryProps {
  routes?: Record<string, string | ModuleRoutes>;
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
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [highOnly, setHighOnly] = useState(false);
  const [voiceGuideActive, setVoiceGuideActive] = useState(false);
  const [shockKey, setShockKey] = useState(0);
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
    const container = rootRef.current;
    if (!container) return;
    const bounds = container.getBoundingClientRect();
    container.style.setProperty("--shock-x", `${e.clientX - bounds.left}px`);
    container.style.setProperty("--shock-y", `${e.clientY - bounds.top}px`);
    setShockKey((k) => k + 1);
  };

  return (
    <div ref={rootRef} className="relative min-h-screen text-white overflow-hidden bg-black">
      {/* Inject CSS custom properties and animations */}
      <style>{`
        :root {
          --neon-yellow: ${NEON.yellow};
          --neon-blue: ${NEON.blue};
        }
        
        /* Ambient cinematic field */
        @keyframes floatBG {
          0% { transform: translate3d(-10%, -10%, 0); }
          50% { transform: translate3d(10%, 10%, 0); }
          100% { transform: translate3d(-10%, -10%, 0); }
        }
        .neon-backdrop {
          position: absolute;
          inset: -20%;
          background:
            radial-gradient(40% 40% at 15% 20%, rgba(234,255,0,.12), transparent 60%),
            radial-gradient(50% 50% at 85% 80%, rgba(0,194,255,.22), transparent 65%),
            radial-gradient(30% 30% at 80% 10%, rgba(234,255,0,.10), transparent 70%);
          animation: floatBG 26s ease-in-out infinite;
          filter: blur(64px);
          mix-blend-mode: screen;
          z-index: 0;
        }
        
        @keyframes energyWave {
          0% { opacity: .45; filter: blur(55px) brightness(1); }
          25% { opacity: .85; filter: blur(60px) brightness(1.4); }
          50% { opacity: .55; filter: blur(70px) brightness(1.15); }
          75% { opacity: .9; filter: blur(65px) brightness(1.6); }
          100% { opacity: .45; filter: blur(55px) brightness(1); }
        }
        
        /* FULL IMPACT SHOCKWAVE - Dual Layer */
        @keyframes shockExpand {
          0% { transform: translate(-50%, -50%) scale(.2); opacity: .95; filter: blur(6px); }
          30% { opacity: .95; filter: blur(8px); }
          60% { opacity: .75; }
          100% { transform: translate(-50%, -50%) scale(7); opacity: 0; filter: blur(16px); }
        }
        .shockwave-layer {
          position: absolute; left: var(--shock-x); top: var(--shock-y); 
          pointer-events: none; border-radius: 9999px; mix-blend-mode: screen; z-index: 1;
          animation: shockExpand 1.5s cubic-bezier(.2,.8,.2,1) forwards;
        }
        .shock-outer { 
          width: 260px; height: 260px; 
          background: radial-gradient(closest-side, rgba(0,194,255,.95) 6%, rgba(234,255,0,.85) 16%, rgba(0,194,255,.35) 34%, rgba(0,0,0,0) 60%); 
          box-shadow: 0 0 140px 50px rgba(0,194,255,.55), 0 0 100px 34px rgba(234,255,0,.4); 
        }
        .shock-inner { 
          width: 160px; height: 160px; 
          background: radial-gradient(closest-side, rgba(0,194,255,.9) 20%, rgba(234,255,0,.7) 40%, rgba(0,0,0,0) 70%); 
          filter: blur(6px); 
        }
        
        /* Electrical arcs */
        @keyframes arcDash { to { stroke-dashoffset: -1000; } }
        @keyframes arcFlash { 0%,100% { opacity: .25; } 40% { opacity: .9; } 60% { opacity: .5; } }
        .arcs path { 
          stroke: rgba(0,194,255,.85); 
          stroke-width: 2; 
          stroke-linecap: round; 
          fill: none; 
          filter: drop-shadow(0 0 8px rgba(0,194,255,.9)); 
          stroke-dasharray: 8 14; 
          animation: arcDash 6s linear infinite, arcFlash 2.2s ease-in-out infinite; 
        }
      `}</style>
      
      {/* Ambient backdrop */}
      <div className="neon-backdrop" />
      
      {/* Electrical arcs SVG */}
      <svg className="arcs absolute inset-0 -z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M5,20 C20,30 30,10 50,20 70,30 80,15 95,25" />
        <path d="M5,70 C25,60 40,85 55,70 70,55 80,80 95,68" />
      </svg>
      
      {/* FULL IMPACT SHOCKWAVE - Two layers */}
      <div key={`outer-${shockKey}`} className="shockwave-layer shock-outer" />
      <div key={`inner-${shockKey}`} className="shockwave-layer shock-inner" />
      
      <div className="max-w-7xl mx-auto px-8 py-16 relative z-10">
        {/* Title - Centered with cyan glow */}
        <div className="text-center mb-12">
          <h1 className="text-7xl font-extrabold tracking-tight mb-8"
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
          {filtered.map((m, i) => {
            const route = routes[m.id];
            const getLaunchPath = () => {
              if (typeof route === 'string') return route;
              if (typeof route === 'object') return route.launch;
              return m.path;
            };
            const getPreviewPath = () => {
              if (typeof route === 'object') return route.preview;
              return undefined;
            };
            const getDocsPath = () => {
              if (typeof route === 'object') return route.docs;
              return undefined;
            };

            return (
              <ModuleCard 
                key={m.id} 
                m={m}
                delay={i * 0.4}
                launchPath={getLaunchPath() || m.path}
                previewPath={getPreviewPath()}
                docsPath={getDocsPath()}
                onLaunch={onLaunch ? () => onLaunch(m) : undefined}
                onPreview={onPreview ? () => onPreview(m) : undefined}
                onDocs={onDocs ? () => onDocs(m) : undefined}
                onRipple={triggerRipple}
              />
            );
          })}
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
