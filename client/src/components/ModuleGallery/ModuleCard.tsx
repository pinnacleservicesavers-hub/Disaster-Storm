import { ArrowRight, Eye, FileText } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
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
  onLaunch?: () => void;
  onPreview?: () => void;
  onDocs?: () => void;
  onRipple?: (e: React.MouseEvent) => void;
}

const glowColors = [
  { border: 'rgba(0, 123, 255, 0.8)', shadow: 'rgba(0, 123, 255, 0.4)' }, // blue
  { border: 'rgba(0, 194, 255, 0.8)', shadow: 'rgba(0, 194, 255, 0.4)' }, // cyan
  { border: 'rgba(16, 185, 129, 0.8)', shadow: 'rgba(16, 185, 129, 0.4)' }, // green
  { border: 'rgba(168, 85, 247, 0.8)', shadow: 'rgba(168, 85, 247, 0.4)' }, // purple
  { border: 'rgba(234, 255, 0, 0.8)', shadow: 'rgba(234, 255, 0, 0.4)' }, // yellow
  { border: 'rgba(0, 194, 255, 0.8)', shadow: 'rgba(0, 194, 255, 0.4)' }, // cyan
  { border: 'rgba(16, 185, 129, 0.8)', shadow: 'rgba(16, 185, 129, 0.4)' }, // green
  { border: 'rgba(168, 85, 247, 0.8)', shadow: 'rgba(168, 85, 247, 0.4)' }, // purple
];

const iconColors = [
  'bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-orange-500', 'bg-orange-500', 'bg-orange-500', 'bg-purple-500'
];

export function ModuleCard({ m, delay = 0, onLaunch, onPreview, onDocs, onRipple }: ModuleCardProps) {
  const Icon = m.icon;
  const cardIndex = parseInt(m.num?.replace('#', '') || '1') - 1;
  const glow = glowColors[cardIndex % glowColors.length];
  const iconBg = iconColors[cardIndex % iconColors.length];
  
  const handleCardClick = (e: React.MouseEvent) => {
    if (onRipple) onRipple(e);
  };
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative rounded-3xl p-6 bg-slate-900/40 backdrop-blur-md group"
      style={{ 
        border: `2px solid ${glow.border}`,
        boxShadow: `0 0 40px ${glow.shadow}, inset 0 0 60px rgba(0,0,0,0.3)`
      }}
      data-testid={`card-module-${m.id}`}
      onClick={handleCardClick}
    >
      {/* Animated Halo */}
      <div
        className="absolute inset-0 rounded-3xl opacity-40 blur-2xl animate-energyWave"
        style={{
          background: `radial-gradient(circle at center, ${glow.border} 0%, transparent 70%)`,
          animationDelay: `${delay}s`,
          zIndex: 0,
        }}
      />

      <div className="relative z-10">
        {/* Top row: Icon + Badges */}
        <div className="flex items-start justify-between mb-4">
          {/* Large circular icon */}
          <div className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {m.priority === "HIGH" && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/90 text-black">
                HIGH
              </span>
            )}
            {m.status === 'LIVE' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/90 text-white flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                LIVE
              </span>
            )}
            {m.num && (
              <span className="text-xs text-slate-400 font-mono">{m.num}</span>
            )}
          </div>
        </div>
        
        {/* Title and description */}
        <h3 className="text-xl font-bold text-white mb-2" data-testid={`text-module-name-${m.id}`}>
          {m.name}
        </h3>
        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          {m.description}
        </p>
        
        {/* Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); if (onLaunch) onLaunch(); }}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-black bg-yellow-400 hover:bg-yellow-300 transition-colors"
            data-testid={`button-launch-${m.id}`}
          >
            Launch
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); if (onPreview) onPreview(); }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            Preview
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); if (onDocs) onDocs(); }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            Docs
          </button>
        </div>
      </div>
    </motion.div>
  );
}
