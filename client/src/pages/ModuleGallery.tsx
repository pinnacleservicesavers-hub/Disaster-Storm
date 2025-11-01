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
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Inject animated neon backdrop keyframes */}
      <style>{`
        @keyframes neon-flow {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.15; }
          33% { transform: translate(20%, -15%) scale(1.1); opacity: 0.2; }
          66% { transform: translate(-15%, 20%) scale(0.95); opacity: 0.18; }
        }
      `}</style>
      
      {/* Animated neon flowing backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ 
            background: `radial-gradient(circle, ${NEON.yellow}40 0%, transparent 70%)`,
            animation: 'neon-flow 12s ease-in-out infinite'
          }} 
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ 
            background: `radial-gradient(circle, ${NEON.blue}40 0%, transparent 70%)`,
            animation: 'neon-flow 15s ease-in-out infinite',
            animationDelay: '2s'
          }} 
        />
        <div 
          className="absolute top-2/3 left-1/2 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ 
            background: `radial-gradient(circle, ${NEON.yellow}30 0%, ${NEON.blue}20 50%, transparent 70%)`,
            animation: 'neon-flow 18s ease-in-out infinite',
            animationDelay: '4s'
          }} 
        />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 backdrop-blur-md bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight text-white drop-shadow-lg">
              {brand.name || 'StormOps Modules'}
            </h1>
            <p className="mt-2 text-white/70 max-w-2xl">
              High-performance tools for real-time storm response. Curated, focused, and built for pros.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
              <Badge tone="sky">
                <BadgeInfo className="w-3.5 h-3.5 mr-1" /> Tip
              </Badge>
              Try the <em>Priority: High</em> filter to plan deployments.
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {brand.logoUrl && (
              <img
                src={brand.logoUrl}
                alt={brand.name || 'Brand logo'}
                className="w-16 h-16 object-contain opacity-90 mr-2"
              />
            )}
            <button 
              className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/15 hover:bg-white/20 hover:ring-white/30 inline-flex items-center gap-2 transition-all text-white shadow-lg"
              data-testid="button-favorites"
            >
              <Star className="w-4 h-4" /> Favorites
            </button>
            <button 
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 inline-flex items-center gap-2 transition-all text-white shadow-lg shadow-purple-500/30 ring-2 ring-white/20"
              data-testid="button-deploy"
            >
              <Rocket className="w-4 h-4" /> Deploy
            </button>
            <button
              onClick={() => setVoiceGuideActive(!voiceGuideActive)}
              className={`px-4 py-2.5 rounded-xl inline-flex items-center gap-2 transition-all backdrop-blur-md shadow-lg ${
                voiceGuideActive
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/40 ring-2 ring-white/30'
                  : 'bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/20 hover:ring-white/30'
              }`}
              data-testid="button-voice-guide"
            >
              {voiceGuideActive ? (
                <>
                  <Volume2 className="w-4 h-4" /> Voice On
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" /> Start Voice Guide
                </>
              )}
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-8">
          <Toolbar
            query={query}
            setQuery={setQuery}
            cat={cat}
            setCat={setCat}
            highOnly={highOnly}
            setHighOnly={setHighOnly}
          />
        </div>

        {/* Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
            <ModuleCard 
              key={m.id} 
              m={{ ...m, path: routes[m.id] || m.path }}
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
