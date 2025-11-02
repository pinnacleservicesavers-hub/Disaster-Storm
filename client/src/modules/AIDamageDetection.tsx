export default function AIDamageDetection() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient Neon Backdrop */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(40% 40% at 20% 30%, rgba(255,0,255,0.15), transparent 60%), radial-gradient(50% 50% at 80% 70%, rgba(0,194,255,0.2), transparent 65%)'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-16">
        {/* Title with Magenta-Cyan Gradient */}
        <h1 className="text-6xl font-extrabold tracking-tight mb-4"
          style={{
            background: 'linear-gradient(90deg, #ff00ff 0%, #00d9ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 80px rgba(255, 0, 255, 0.5)'
          }}
        >
          AI Damage Detection
        </h1>
        
        <p className="text-xl text-cyan-300/70 mb-12">
          Real-time inference on camera feeds.
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="rounded-2xl p-6 bg-slate-900/60 border border-fuchsia-500/30 backdrop-blur-sm hover:border-fuchsia-400/50 transition-all"
            style={{ boxShadow: '0 0 40px rgba(255, 0, 255, 0.1)' }}
          >
            <h3 className="text-xl font-bold text-fuchsia-300 mb-3">Real-Time Inference</h3>
            <p className="text-fuchsia-300/70 text-sm">
              AI vision models detect damage in real-time from camera feeds.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl p-6 bg-slate-900/60 border border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-all"
            style={{ boxShadow: '0 0 40px rgba(0, 194, 255, 0.1)' }}
          >
            <h3 className="text-xl font-bold text-cyan-300 mb-3">Object Classification</h3>
            <p className="text-cyan-300/70 text-sm">
              Automated classification of roof damage, tree damage, and flooding.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl p-6 bg-slate-900/60 border border-fuchsia-500/30 backdrop-blur-sm hover:border-fuchsia-400/50 transition-all"
            style={{ boxShadow: '0 0 40px rgba(255, 0, 255, 0.1)' }}
          >
            <h3 className="text-xl font-bold text-fuchsia-300 mb-3">Confidence Scoring</h3>
            <p className="text-fuchsia-300/70 text-sm">
              Confidence scores and severity ratings for detected damage.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-12 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30">
          <span className="w-2 h-2 rounded-full bg-fuchsia-400" style={{ boxShadow: '0 0 10px rgba(255, 0, 255, 0.8)' }} />
          <span className="text-sm font-medium text-fuchsia-300">Module Active</span>
        </div>
      </div>
    </div>
  );
}
