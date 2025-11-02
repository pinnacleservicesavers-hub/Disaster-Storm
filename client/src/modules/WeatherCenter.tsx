import { useState, useEffect } from 'react';
import { Activity, Satellite, Waves, Wind, CloudRain, Database, Brain, MapPin } from 'lucide-react';
import VoiceGuide from '@/components/VoiceGuide';
import { StateCitySelector, useStateCitySelector } from '@/components/StateCitySelector';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

export default function WeatherCenter() {
  const { selectedState, setSelectedState, selectedCity, setSelectedCity, availableCities } = useStateCitySelector('Florida', 'Miami');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [dataSourcesActive, setDataSourcesActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDataSourcesActive(prev => (prev + 1) % 7);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient Neon Backdrop */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(40% 40% at 20% 30%, rgba(0,194,255,0.15), transparent 60%), radial-gradient(50% 50% at 80% 70%, rgba(0,217,255,0.2), transparent 65%)'
          }}
        />
      </div>

      <div className="relative max-w-[1800px] mx-auto px-8 py-12">
        {/* Header with Live Status */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-6xl font-extrabold tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #00d9ff 0%, #00ffcc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 80px rgba(0, 255, 204, 0.5)'
              }}
            >
              Live Weather Intelligence
            </h1>
            
            {/* Live Monitoring Indicator */}
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <div className="relative">
                <span className="w-3 h-3 rounded-full bg-cyan-400 block" style={{ boxShadow: '0 0 15px rgba(0, 217, 255, 0.9)' }} />
                <span className="absolute inset-0 w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <span className="text-sm font-bold text-cyan-300">MONITORING LIVE</span>
            </div>
          </div>
          
          <p className="text-xl text-cyan-300/70 mb-6">
            Advanced Machine Learning Models • Live Weather Data • Expert Analysis • AI Intelligence
          </p>

          {/* State/City Selector */}
          <div className="flex justify-start mb-6">
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
        </div>

        {/* Data Sources Status Bar */}
        <div className="mb-8 p-6 rounded-2xl bg-slate-900/60 border border-cyan-500/30 backdrop-blur-sm"
          style={{ boxShadow: '0 0 40px rgba(0, 194, 255, 0.1)' }}
        >
          <h3 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Sources • Real-Time Feeds
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { name: 'NOAA', icon: Satellite, desc: 'Weather Service' },
              { name: 'NWS', icon: Activity, desc: 'Live Alerts' },
              { name: 'GOES', icon: Satellite, desc: 'Satellites' },
              { name: 'NDBC', icon: Waves, desc: 'Buoys' },
              { name: 'WAVEWATCH', icon: Waves, desc: 'Ocean Model' },
              { name: 'AMBEE', icon: Wind, desc: 'Environmental' },
              { name: 'ML Models', icon: Brain, desc: 'AI Analysis' }
            ].map((source, idx) => {
              const Icon = source.icon;
              const isActive = dataSourcesActive === idx;
              return (
                <div key={source.name} 
                  className={`p-3 rounded-lg border transition-all ${
                    isActive 
                      ? 'bg-cyan-500/20 border-cyan-400/50' 
                      : 'bg-slate-800/40 border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-cyan-300/50'}`} />
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-slate-500'
                    }`} />
                  </div>
                  <div className={`text-xs font-bold ${isActive ? 'text-cyan-300' : 'text-cyan-300/50'}`}>
                    {source.name}
                  </div>
                  <div className={`text-[10px] ${isActive ? 'text-cyan-400/70' : 'text-slate-400'}`}>
                    {source.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Live Weather Maps */}
          <div className="lg:col-span-2 rounded-2xl p-6 bg-slate-900/60 border border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-all"
            style={{ boxShadow: '0 0 40px rgba(0, 194, 255, 0.1)' }}
          >
            <h3 className="text-2xl font-bold text-cyan-300 mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              Live Weather Maps
            </h3>
            <div className="aspect-video bg-slate-800/50 rounded-lg border border-cyan-500/20 flex items-center justify-center">
              <div className="text-center">
                <Satellite className="w-16 h-16 text-cyan-400/50 mx-auto mb-3" />
                <p className="text-cyan-300/70">Real-time radar • Satellite imagery • Storm tracks</p>
                <p className="text-sm text-cyan-300/50 mt-2">GOES-16/17 Satellites • NEXRAD Radar Network</p>
              </div>
            </div>
          </div>

          {/* Environmental Conditions */}
          <div className="rounded-2xl p-6 bg-slate-900/60 border border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-all"
            style={{ boxShadow: '0 0 40px rgba(0, 194, 255, 0.1)' }}
          >
            <h3 className="text-2xl font-bold text-cyan-300 mb-4 flex items-center gap-2">
              <Wind className="w-6 h-6" />
              Environmental
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Air Quality', value: 'Good', color: 'text-green-400' },
                { label: 'Pollen Count', value: 'Moderate', color: 'text-yellow-400' },
                { label: 'UV Index', value: 'High', color: 'text-orange-400' },
                { label: 'Soil Moisture', value: 'Normal', color: 'text-blue-400' },
                { label: 'Fire Risk', value: 'Low', color: 'text-green-400' }
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                  <span className="text-sm text-cyan-300/70">{item.label}</span>
                  <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
              <p className="text-xs text-cyan-300/50 mt-4">Powered by Ambee Environmental API</p>
            </div>
          </div>
        </div>

        {/* AI Intelligence & Analysis Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="rounded-2xl p-6 bg-slate-900/60 border border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-all"
            style={{ boxShadow: '0 0 40px rgba(0, 194, 255, 0.1)' }}
          >
            <Brain className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="text-lg font-bold text-cyan-300 mb-2">AI Expert Analysis</h3>
            <p className="text-cyan-300/70 text-sm">
              Machine learning models analyze weather patterns and predict storm behavior
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-slate-900/60 border border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-all"
            style={{ boxShadow: '0 0 40px rgba(0, 194, 255, 0.1)' }}
          >
            <Activity className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="text-lg font-bold text-cyan-300 mb-2">Severe Alerts</h3>
            <p className="text-cyan-300/70 text-sm">
              NWS severe weather alerts with automated contractor notifications
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-slate-900/60 border border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-all"
            style={{ boxShadow: '0 0 40px rgba(0, 194, 255, 0.1)' }}
          >
            <Waves className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="text-lg font-bold text-cyan-300 mb-2">Ocean Data</h3>
            <p className="text-cyan-300/70 text-sm">
              NDBC buoys and WAVEWATCH III ocean forecast models for marine conditions
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-slate-900/60 border border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-all"
            style={{ boxShadow: '0 0 40px rgba(0, 194, 255, 0.1)' }}
          >
            <CloudRain className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="text-lg font-bold text-cyan-300 mb-2">Predictive Models</h3>
            <p className="text-cyan-300/70 text-sm">
              12-72 hour forecasts with damage predictions and contractor opportunities
            </p>
          </div>
        </div>

        {/* Voice Guide */}
        <div className="flex justify-center mb-8">
          <VoiceGuide currentPortal="weather" />
        </div>

        {/* Ask AI Intelligence - Prominent Section */}
        <div className="rounded-2xl p-8 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-2 border-cyan-400/50 backdrop-blur-sm"
          style={{ boxShadow: '0 0 60px rgba(0, 217, 255, 0.2)' }}
        >
          <div className="flex items-center gap-4 mb-4">
            <Brain className="w-10 h-10 text-cyan-400" />
            <div>
              <h3 className="text-3xl font-bold text-cyan-300">Ask Our AI Weather Expert</h3>
              <p className="text-cyan-300/70">Get instant answers • Weather analysis • Storm predictions • Deployment advice</p>
            </div>
          </div>
          <p className="text-sm text-cyan-300/60 mb-4">
            Click the AI assistant button (bottom-right) to ask questions about current conditions, forecast changes, storm risks, or contractor deployment strategies.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-800/40 rounded-lg border border-cyan-500/20 text-xs text-cyan-300/70">
              "What's the forecast for Miami?"
            </div>
            <div className="p-3 bg-slate-800/40 rounded-lg border border-cyan-500/20 text-xs text-cyan-300/70">
              "When should contractors deploy?"
            </div>
            <div className="p-3 bg-slate-800/40 rounded-lg border border-cyan-500/20 text-xs text-cyan-300/70">
              "Explain this storm system"
            </div>
            <div className="p-3 bg-slate-800/40 rounded-lg border border-cyan-500/20 text-xs text-cyan-300/70">
              "What are the wind speeds?"
            </div>
          </div>
        </div>
      </div>
      
      <ModuleAIAssistant moduleName="Weather Intelligence Center" />
    </div>
  );
}
