import { useState, useMemo } from 'react';
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

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Inject CSS custom properties and animations */}
      <style>{`
        :root {
          --neon-yellow: ${NEON.yellow};
          --neon-blue: ${NEON.blue};
        }
        
        @keyframes floatBG {
          0% { transform: translate3d(-10%, -10%, 0); }
          50% { transform: translate3d(10%, 10%, 0); }
          100% { transform: translate3d(-10%, -10%, 0); }
        }
        
        @keyframes energyWave {
          0% { opacity: 0.4; filter: blur(55px) brightness(1); transform: translateY(0); }
          25% { opacity: 0.7; filter: blur(60px) brightness(1.3); transform: translateY(-6px); }
          50% { opacity: 0.5; filter: blur(70px) brightness(1.1); transform: translateY(0); }
          75% { opacity: 0.8; filter: blur(65px) brightness(1.4); transform: translateY(6px); }
          100% { opacity: 0.4; filter: blur(55px) brightness(1); transform: translateY(0); }
        }
        
        .animate-energyWave {
          animation: energyWave 5s ease-in-out infinite;
        }
        
        .neon-backdrop {
          position: absolute;
          inset: -20%;
          background:
            radial-gradient(40% 40% at 30% 20%, rgba(234, 255, 0, 0.12), transparent 70%),
            radial-gradient(50% 50% at 70% 80%, rgba(0, 194, 255, 0.18), transparent 70%);
          animation: floatBG 25s ease-in-out infinite;
          filter: blur(60px);
          mix-blend-mode: screen;
          z-index: 0;
        }
      `}</style>
      
      {/* Animated neon flowing backdrop */}
      <div className="neon-backdrop"></div>
      
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Search & Filter Bar */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search modules..."
              className="w-full px-4 py-3 pl-12 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/50 transition-colors"
              data-testid="input-search"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="px-6 py-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-white focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
            data-testid="select-category"
          >
            <option value="all">All categories</option>
            <option value="operations">Operations</option>
            <option value="intelligence">Intelligence</option>
            <option value="customers">Customers</option>
            <option value="sales">Sales</option>
            <option value="management">Management</option>
          </select>
          
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          {filtered.map((m, i) => (
            <ModuleCard 
              key={m.id} 
              m={{ ...m, path: routes[m.id] || m.path }}
              delay={i * 0.4}
              onLaunch={onLaunch ? () => onLaunch(m) : () => navigate(routes[m.id] || m.path)}
              onPreview={onPreview ? () => onPreview(m) : undefined}
              onDocs={onDocs ? () => onDocs(m) : undefined}
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
