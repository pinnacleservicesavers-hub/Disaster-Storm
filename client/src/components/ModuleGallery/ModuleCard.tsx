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
    <Link href={m.path}>
      <motion.div
        onClick={handleLaunch}
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        whileTap={{ scale: 0.98 }}
        className="group relative"
        data-testid={`card-module-${m.id}`}
      >
        {/* Neon Blue Halo */}
        <div
          className="absolute inset-0 rounded-3xl opacity-60 blur-3xl group-hover:opacity-90 transition-all duration-500"
          style={{
            background: `radial-gradient(circle at center, ${NEON.blue}33 0%, transparent 70%)`,
            filter: "blur(60px)",
            zIndex: 0,
          }}
        />
        
        <div 
          className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${m.gradient} min-h-[280px] flex flex-col cursor-pointer transition-all duration-500 shadow-lg`}
          style={{ zIndex: 10 }}
        >
          {/* Glassmorphic overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 backdrop-blur-[2px]" />

          {/* Content wrapper */}
          <div className="relative z-10">
            {/* Header with icon and badges */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-md" data-testid={`text-module-name-${m.id}`}>
                    {m.name}
                  </h3>
                  <p className="text-[11px] text-white/50">{m.num}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {m.priority === 'HIGH' && (
                  <Badge 
                    tone="orange"
                    style={{ 
                      backgroundColor: NEON.yellow, 
                      color: '#000',
                      fontWeight: 700 
                    }}
                  >
                    HIGH
                  </Badge>
                )}
                {m.status === 'LIVE' && (
                  <Badge 
                    tone="green"
                    style={{ 
                      backgroundColor: NEON.blue, 
                      color: '#000',
                      fontWeight: 700 
                    }}
                  >
                    {m.status}
                  </Badge>
                )}
                {m.status === 'BETA' && (
                  <Badge tone="blue">{m.status}</Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-white/70 mb-4 leading-relaxed">
              {m.description}
            </p>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button 
                onClick={handleLaunch}
                className="px-3.5 py-2 rounded-xl text-sm font-semibold text-black hover:bg-white transition-shadow"
                style={{
                  backgroundColor: `var(--neon-yellow, ${NEON.yellow})`,
                  boxShadow: '0 0 15px rgba(234, 255, 0, 0.35)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(234, 255, 0, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(234, 255, 0, 0.35)';
                }}
                data-testid={`button-launch-${m.id}`}
              >
                Launch
              </button>
              {onPreview && (
                <button 
                  onClick={handlePreview}
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-white bg-white/10 hover:bg-white/20 ring-1 ring-white/15"
                  title="Preview"
                >
                  Preview
                </button>
              )}
              {onDocs && (
                <button 
                  onClick={handleDocs}
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-white/80 bg-transparent hover:bg-white/10 ring-1 ring-white/10"
                  title="Documentation"
                >
                  Docs
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
