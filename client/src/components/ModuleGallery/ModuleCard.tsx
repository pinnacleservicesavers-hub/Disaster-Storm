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

export function ModuleCard({ m, delay = 0, onLaunch, onPreview, onDocs, onRipple }: ModuleCardProps) {
  const Icon = m.icon;
  
  const handleCardClick = (e: React.MouseEvent) => {
    if (onRipple) onRipple(e);
  };
  
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative overflow-hidden rounded-3xl p-6 bg-slate-900/80 ring-1 ring-white/10 backdrop-blur-lg group"
      style={{ boxShadow: `0 0 30px rgba(0,194,255,0.25), inset 0 0 0 1px rgba(255,255,255,0.05)` }}
      data-testid={`card-module-${m.id}`}
      onClick={handleCardClick}
    >
      {/* Animated Neon Blue Halo */}
      <div
        className="absolute inset-0 rounded-3xl opacity-60 blur-3xl animate-energyWave"
        style={{
          background: `radial-gradient(circle at center, ${NEON.blue}33 0%, transparent 70%)`,
          filter: "blur(60px)",
          animationDelay: `${delay}s`,
          zIndex: 0,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
              {Icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-md" data-testid={`text-module-name-${m.id}`}>
                {m.name}
              </h3>
              <p className="text-[11px] text-white/50">{m.num}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {m.priority === "HIGH" && <Badge tone="yellow">HIGH</Badge>}
            {m.status && <Badge tone="blue">{m.status}</Badge>}
          </div>
        </div>
        <p className="text-sm text-white/70 mb-4 leading-relaxed">{m.description}</p>
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.preventDefault(); if (onLaunch) onLaunch(); }}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-black bg-[color:var(--neon-yellow,#eaff00)] hover:bg-white transition-shadow shadow-[0_0_15px_rgba(234,255,0,0.35)] hover:shadow-[0_0_30px_rgba(234,255,0,0.6)]"
            data-testid={`button-launch-${m.id}`}
          >
            Launch
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); if (onPreview) onPreview(); }}
            className="px-3.5 py-2 rounded-xl text-sm font-medium text-white bg-white/10 hover:bg-white/20 ring-1 ring-white/15"
          >
            Preview
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); if (onDocs) onDocs(); }}
            className="px-3.5 py-2 rounded-xl text-sm font-medium text-white/80 bg-transparent hover:bg-white/10 ring-1 ring-white/10"
          >
            Docs
          </button>
        </div>
      </div>
    </motion.div>
  );
}
