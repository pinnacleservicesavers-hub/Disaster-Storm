export default function TrafficCamWatcherModule() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient Neon Backdrop */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(40% 40% at 20% 30%, rgba(0,255,136,0.15), transparent 60%), radial-gradient(50% 50% at 80% 70%, rgba(0,194,255,0.2), transparent 65%)'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-16">
        {/* Title with Green-Cyan Gradient */}
        <h1 className="text-6xl font-extrabold tracking-tight mb-4"
          style={{
            background: 'linear-gradient(90deg, #00ff88 0%, #00d9ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 80px rgba(0, 255, 136, 0.5)'
          }}
        >
          TrafficCamWatcher
        </h1>
        
        <p className="text-xl text-cyan-300/70 mb-12">
          Live traffic cams with AI damage detection.
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="rounded-2xl p-6 bg-slate-900/60 border border-emerald-500/30 backdrop-blur-sm hover:border-emerald-400/50 transition-all"
            style={{ boxShadow: '0 0 40px rgba(0, 255, 136, 0.1)' }}
          >
            <h3 className="text-xl font-bold text-emerald-300 mb-3">Live Feeds</h3>
            <p className="text-emerald-300/70 text-sm">
              Real-time traffic camera monitoring across Florida DOT network.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl p-6 bg-slate-900/60 border border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-all"
            style={{ boxShadow: '0 0 40px rgba(0, 194, 255, 0.1)' }}
          >
            <h3 className="text-xl font-bold text-cyan-300 mb-3">AI Detection</h3>
            <p className="text-cyan-300/70 text-sm">
              Automated damage detection from live camera feeds.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl p-6 bg-slate-900/60 border border-emerald-500/30 backdrop-blur-sm hover:border-emerald-400/50 transition-all"
            style={{ boxShadow: '0 0 40px rgba(0, 255, 136, 0.1)' }}
          >
            <h3 className="text-xl font-bold text-emerald-300 mb-3">Geo-Matching</h3>
            <p className="text-emerald-300/70 text-sm">
              Contractor geo-matching for detected damage opportunities.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-12 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 10px rgba(0, 255, 136, 0.8)' }} />
          <span className="text-sm font-medium text-emerald-300">Module Active</span>
        </div>
      </div>
    </div>
  );
}
