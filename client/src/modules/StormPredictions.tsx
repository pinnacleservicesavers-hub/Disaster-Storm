import VoiceGuide from '@/components/VoiceGuide';
import { StateCitySelector, useStateCitySelector } from '@/components/StateCitySelector';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

export default function StormPredictions() {
  const { selectedState, setSelectedState, selectedCity, setSelectedCity, availableCities } = useStateCitySelector('Florida', 'Miami');
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient Neon Backdrop */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(40% 40% at 20% 30%, rgba(128,0,255,0.15), transparent 60%), radial-gradient(50% 50% at 80% 70%, rgba(0,194,255,0.2), transparent 65%)'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-16">
        {/* Title with Purple-Cyan Gradient */}
        <h1 className="text-6xl font-extrabold tracking-tight mb-4"
          style={{
            background: 'linear-gradient(90deg, #8000ff 0%, #00d9ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 80px rgba(128, 0, 255, 0.5)'
          }}
        >
          Storm Predictions
        </h1>
        
        <p className="text-xl text-cyan-300/70 mb-8">
          AI-powered predictive damage analysis.
        </p>

        {/* State/City Selector */}
        <div className="flex justify-center mb-8">
          <StateCitySelector
            selectedState={selectedState}
            selectedCity={selectedCity}
            availableCities={availableCities}
            onStateChange={setSelectedState}
            onCityChange={setSelectedCity}
            variant="dark"
            showAllStates={true}
          />
        </div>

        {/* Voice Guide */}
        <div className="flex justify-center mb-12">
          <VoiceGuide currentPortal="predictions" />
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="rounded-2xl p-6 bg-slate-900/60 border border-purple-500/30 backdrop-blur-sm hover:border-purple-400/50 transition-all"
            style={{ boxShadow: '0 0 40px rgba(128, 0, 255, 0.1)' }}
          >
            <h3 className="text-xl font-bold text-purple-300 mb-3">AI Analysis</h3>
            <p className="text-purple-300/70 text-sm">
              Machine learning models predict storm damage with 89% accuracy.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl p-6 bg-slate-900/60 border border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-all"
            style={{ boxShadow: '0 0 40px rgba(0, 194, 255, 0.1)' }}
          >
            <h3 className="text-xl font-bold text-cyan-300 mb-3">Impact Forecast</h3>
            <p className="text-cyan-300/70 text-sm">
              County-level damage forecasts for strategic crew deployment.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl p-6 bg-slate-900/60 border border-purple-500/30 backdrop-blur-sm hover:border-purple-400/50 transition-all"
            style={{ boxShadow: '0 0 40px rgba(128, 0, 255, 0.1)' }}
          >
            <h3 className="text-xl font-bold text-purple-300 mb-3">Opportunity Score</h3>
            <p className="text-purple-300/70 text-sm">
              Contractor opportunity scoring based on predicted damage levels.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-12 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
          <span className="w-2 h-2 rounded-full bg-purple-400" style={{ boxShadow: '0 0 10px rgba(128, 0, 255, 0.8)' }} />
          <span className="text-sm font-medium text-purple-300">Module Active</span>
        </div>
      </div>
      
      <ModuleAIAssistant moduleName="Storm Predictions" />
    </div>
  );
}
