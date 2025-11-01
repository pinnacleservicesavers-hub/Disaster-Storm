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
  onLaunch?: () => void;
  onPreview?: () => void;
  onDocs?: () => void;
}

export function ModuleCard({ m, onLaunch, onPreview, onDocs }: ModuleCardProps) {
  const Icon = m.icon;
  
  const handleLaunch = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onLaunch) onLaunch();
  };
  
  const handlePreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPreview) onPreview();
  };
  
  const handleDocs = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDocs) onDocs();
  };
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="group relative cursor-pointer"
      data-testid={`card-module-${m.id}`}
    >
      {/* Neon Blue Glowing Border */}
      <div 
        className="absolute inset-0 rounded-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${NEON.blue}60, ${NEON.blue}30)`,
          filter: 'blur(8px)',
          padding: '2px'
        }}
      />
      
      <div 
        className="relative rounded-3xl p-6 bg-slate-900/95 border border-cyan-500/30 group-hover:border-cyan-400/60 transition-all duration-300"
        style={{ backdropFilter: 'blur(10px)' }}
      >
        {/* HIGH Badge */}
        {m.priority === 'HIGH' && (
          <div 
            className="absolute top-6 left-6 px-3 py-1 rounded-full text-xs font-bold"
            style={{ 
              backgroundColor: NEON.yellow, 
              color: '#000' 
            }}
          >
            HIGH
          </div>
        )}
        
        {/* Icon & Title */}
        <div className="flex items-start gap-4 mb-4 mt-8">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${NEON.blue}20`, border: `1px solid ${NEON.blue}40` }}
          >
            <Icon className="w-7 h-7 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-2" data-testid={`text-module-name-${m.id}`}>
              {m.name}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {m.description}
            </p>
          </div>
        </div>
        
        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
          {m.status === 'LIVE' && (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              LIVE
            </span>
          )}
          {m.category === 'operations' && (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              ⚡ SAFETY
            </span>
          )}
          {m.category === 'intelligence' && (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              🔄 AI PROCESS
            </span>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 pt-2 border-t border-slate-700/50">
          <button 
            onClick={(e) => { e.preventDefault(); handleLaunch(e); }}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            data-testid={`button-launch-${m.id}`}
          >
            Launch
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); if (onPreview) handlePreview(e); }}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            Preview
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); if (onDocs) handleDocs(e); }}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            Docs
          </button>
        </div>
      </div>
    </motion.div>
  );
}
