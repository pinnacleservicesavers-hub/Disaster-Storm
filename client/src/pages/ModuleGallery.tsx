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
      {/* Inject CSS custom properties and backdrop animation */}
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
      
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <h1 
            className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, ${NEON.yellow}, ${NEON.blue})`,
              filter: `drop-shadow(0 0 25px rgba(0, 194, 255, 0.5))`
            }}
          >
            {brand.name || 'StormOps Modules'}
          </h1>
          {brand.logoUrl && (
            <img
              src={brand.logoUrl}
              alt={brand.name || 'Brand logo'}
              className="w-16 h-16 object-contain opacity-90"
            />
          )}
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
