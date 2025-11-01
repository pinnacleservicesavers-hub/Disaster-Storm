import { ArrowRight, Eye, FileText } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ModuleData } from '@shared/moduleGallery';
import { Badge } from './Badge';

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
          scale: 1.03, 
          rotateY: 2,
          rotateX: -2,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        whileTap={{ scale: 0.98 }}
        className="group relative"
        style={{ transformStyle: "preserve-3d", perspective: 1000 }}
        data-testid={`card-module-${m.id}`}
      >
        <div 
          className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${m.gradient} min-h-[320px] flex flex-col cursor-pointer transition-all duration-500 shadow-lg`}
        >
          {/* Glassmorphic overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 backdrop-blur-[2px]" />
          
          {/* Neon glow on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl bg-gradient-to-br from-cyan-400/20 via-purple-400/20 to-pink-400/20 -z-10" />
          
          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-400/30 via-purple-400/30 to-pink-400/30 blur-sm" />
          </div>

          {/* Content wrapper */}
          <div className="relative z-10">
            {/* Badges */}
            <div className="flex items-start justify-between mb-3">
              {m.priority === 'HIGH' && (
                <Badge tone="orange" className="shadow-lg backdrop-blur-sm">HIGH</Badge>
              )}
              {m.status === 'LIVE' && (
                <Badge tone="green" className="ml-auto shadow-lg backdrop-blur-sm">● LIVE</Badge>
              )}
              {m.status === 'BETA' && (
                <Badge tone="blue" className="ml-auto shadow-lg backdrop-blur-sm">BETA</Badge>
              )}
            </div>

            {/* Icon with glow */}
            <motion.div 
              className="mt-4 mb-6"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-20 h-20 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center shadow-2xl ring-1 ring-white/40 relative">
                <Icon className="w-10 h-10 text-white drop-shadow-lg" />
                {/* Icon glow */}
                <div className="absolute inset-0 rounded-2xl bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-[140px]">
              <h3 className="text-2xl font-bold text-white mb-3 drop-shadow-lg tracking-tight" data-testid={`text-module-name-${m.id}`}>
                {m.name}
              </h3>
              <p className="text-white/90 text-sm leading-relaxed mb-4 flex-1 drop-shadow-md">
                {m.description}
              </p>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mb-3">
                <motion.button
                  onClick={handleLaunch}
                  whileHover={{ scale: 1.05, x: 3 }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-md hover:bg-white/30 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all ring-1 ring-white/30 shadow-lg"
                  data-testid={`button-launch-${m.id}`}
                >
                  Launch <ArrowRight className="w-4 h-4" />
                </motion.button>
                {onPreview && (
                  <motion.button
                    onClick={handlePreview}
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-2.5 rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 text-white transition-all ring-1 ring-white/20"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </motion.button>
                )}
                {onDocs && (
                  <motion.button
                    onClick={handleDocs}
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-2.5 rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 text-white transition-all ring-1 ring-white/20"
                    title="Documentation"
                  >
                    <FileText className="w-4 h-4" />
                  </motion.button>
                )}
              </div>

              {/* Module number */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50 font-mono">{m.num}</span>
                <span className="text-xs text-white/60 capitalize px-2 py-1 rounded-md bg-white/10">{m.category}</span>
              </div>
            </div>
          </div>

          {/* Shimmer effect on hover */}
          <motion.div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
}
