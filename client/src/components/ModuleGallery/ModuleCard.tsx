import { ArrowRight, Eye, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ModuleData } from '@shared/moduleGallery';
import { Badge } from './Badge';

const NEON = {
  yellow: '#eaff00',
  blue: '#00c2ff',
};

const NEON_GLOW = `linear-gradient(135deg, ${NEON.yellow} 0%, ${NEON.blue} 100%)`;

interface ModuleCardProps {
  m: ModuleData;
  delay?: number;
  launchPath?: string;
  previewPath?: string;
  docsPath?: string;
  onLaunch?: () => void;
  onPreview?: () => void;
  onDocs?: () => void;
  onRipple?: (e: React.MouseEvent) => void;
}

const rainbowGradients = [
  'linear-gradient(135deg, #00d9ff 0%, #0080ff 50%, #00d9ff 100%)', // cyan-blue
  'linear-gradient(135deg, #8000ff 0%, #ff00ff 50%, #8000ff 100%)', // purple-magenta
  'linear-gradient(135deg, #00ff88 0%, #00d9ff 50%, #00ff88 100%)', // green-cyan
  'linear-gradient(135deg, #0066ff 0%, #00ff88 50%, #0066ff 100%)', // blue-green
  'linear-gradient(135deg, #00d9ff 0%, #00ff88 50%, #00d9ff 100%)', // cyan-green
  'linear-gradient(135deg, #ff00ff 0%, #ff6600 50%, #ff00ff 100%)', // magenta-orange
];

const glowColors = [
  { color: '#00d9ff', shadow: 'rgba(0, 217, 255, 0.8)' }, // cyan
  { color: '#8000ff', shadow: 'rgba(128, 0, 255, 0.8)' }, // purple
  { color: '#00ff88', shadow: 'rgba(0, 255, 136, 0.8)' }, // green
  { color: '#0066ff', shadow: 'rgba(0, 102, 255, 0.8)' }, // blue
  { color: '#00d9ff', shadow: 'rgba(0, 217, 255, 0.8)' }, // cyan
  { color: '#ff00ff', shadow: 'rgba(255, 0, 255, 0.8)' }, // magenta
];

const iconColors = [
  'bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 
  'bg-blue-600', 'bg-emerald-600', 'bg-purple-600'
];

export function ModuleCard({ m, delay = 0, launchPath, previewPath, docsPath, onLaunch, onPreview, onDocs, onRipple }: ModuleCardProps) {
  const Icon = m.icon;
  const cardIndex = parseInt(m.num?.replace('#', '') || '1') - 1;
  const glow = glowColors[cardIndex % glowColors.length];
  const gradient = rainbowGradients[cardIndex % rainbowGradients.length];
  const iconBg = iconColors[cardIndex % iconColors.length];
  
  const handleCardClick = (e: React.MouseEvent) => {
    if (onRipple) onRipple(e);
  };
  
  return (
    <div
      className="relative rounded-3xl p-1 group"
      style={{ 
        background: gradient,
        boxShadow: `0 0 60px ${glow.shadow}, 0 0 100px ${glow.shadow}, inset 0 0 80px rgba(0,0,0,0.9)`
      }}
      data-testid={`card-module-${m.id}`}
      onClick={handleCardClick}
    >
      {/* Static Glow Halo - NO ANIMATION */}
      <div
        className="absolute inset-0 rounded-3xl opacity-50 blur-3xl"
        style={{
          background: `radial-gradient(circle at center, ${glow.shadow} 0%, transparent 70%)`,
          zIndex: 0,
        }}
      />
      
      {/* Inner card with dark gradient background */}
      <div className="relative rounded-3xl p-6 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl h-full"
        style={{
          background: `linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(10,10,20,0.98) 50%, rgba(0,0,0,0.95) 100%)`
        }}
      >

        <div className="relative z-10">
          {/* Top row: Icon + Badges */}
          <div className="flex items-start justify-between mb-5">
            {/* Large circular icon with glow */}
            <div className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0 shadow-lg`}
              style={{ boxShadow: `0 0 30px ${glow.shadow}` }}
            >
              <Icon className="w-8 h-8 text-white" />
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {m.priority === "HIGH" && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                  style={{ boxShadow: '0 0 20px rgba(255, 140, 0, 0.6)' }}
                >
                  HIGH
                </span>
              )}
              {m.status === 'LIVE' && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center gap-1.5 shadow-lg"
                  style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  LIVE
                </span>
              )}
            </div>
          </div>
          
          {/* Title and description */}
          <h3 className="text-2xl font-bold text-white mb-3" data-testid={`text-module-name-${m.id}`}>
            {m.name}
          </h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            {m.description}
          </p>
          
          {/* Launch button with arrow - Wouter Link for buttery-smooth client-side navigation */}
          {launchPath ? (
            <Link 
              to={launchPath}
              onClick={(e) => { e.stopPropagation(); if (onLaunch) onLaunch(); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-black bg-white hover:bg-slate-100 transition-all shadow-lg group"
              data-testid={`button-launch-${m.id}`}
              style={{ boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)' }}
            >
              Launch
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); if (onLaunch) onLaunch(); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-black bg-white hover:bg-slate-100 transition-all shadow-lg group"
              data-testid={`button-launch-${m.id}`}
              style={{ boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)' }}
            >
              Launch
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
