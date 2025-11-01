import { useState, useMemo } from 'react';
import { Star, Rocket, Volume2, VolumeX } from 'lucide-react';
import { MODULES } from '@shared/moduleGallery';
import { ModuleCard } from '@/components/ModuleGallery/ModuleCard';
import { Toolbar } from '@/components/ModuleGallery/Toolbar';
import { Badge } from '@/components/ModuleGallery/Badge';

export default function ModuleGallery() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                Storm Ops
              </h1>
              <Badge tone="sky" className="text-xs">
                17 Modules
              </Badge>
            </div>
            <p className="text-white/70 text-lg max-w-2xl">
              Your complete disaster response command center. Access real-time intelligence, 
              manage operations, and deploy resources with enterprise-grade tools.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
              <Badge tone="sky" className="px-2">
                💡 Tip
              </Badge>{' '}
              Try the <em className="text-orange-400">Priority: High</em> filter to plan deployments.
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 opacity-80">
            <button 
              className="px-4 py-2 rounded-xl bg-white/10 ring-1 ring-white/15 hover:bg-white/15 inline-flex items-center gap-2 transition-all"
              data-testid="button-favorites"
            >
              <Star className="w-4 h-4" /> Favorites
            </button>
            <button 
              className="px-4 py-2 rounded-xl bg-white/10 ring-1 ring-white/15 hover:bg-white/15 inline-flex items-center gap-2 transition-all"
              data-testid="button-deploy"
            >
              <Rocket className="w-4 h-4" /> Deploy
            </button>
            <button
              onClick={() => setVoiceGuideActive(!voiceGuideActive)}
              className={`px-4 py-2 rounded-xl inline-flex items-center gap-2 transition-all ${
                voiceGuideActive
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-white/10 ring-1 ring-white/15 hover:bg-white/15'
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
            <ModuleCard key={m.id} m={m} />
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
