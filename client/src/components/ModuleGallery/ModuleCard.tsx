import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { ModuleData } from '@shared/moduleGallery';
import { Badge } from './Badge';

interface ModuleCardProps {
  m: ModuleData;
}

export function ModuleCard({ m }: ModuleCardProps) {
  const Icon = m.icon;
  
  return (
    <Link href={m.path}>
      <div 
        className={`group relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${m.gradient} min-h-[280px] flex flex-col cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
        data-testid={`card-module-${m.id}`}
      >
        {/* Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          {m.priority === 'HIGH' && (
            <Badge tone="orange" className="shadow-lg">HIGH</Badge>
          )}
          {m.status === 'LIVE' && (
            <Badge tone="green" className="ml-auto shadow-lg">● LIVE</Badge>
          )}
          {m.status === 'BETA' && (
            <Badge tone="blue" className="ml-auto shadow-lg">BETA</Badge>
          )}
        </div>

        {/* Icon */}
        <div className="mt-12 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl ring-1 ring-white/30">
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-2xl font-bold text-white mb-2" data-testid={`text-module-name-${m.id}`}>
            {m.name}
          </h3>
          <p className="text-white/80 text-sm leading-relaxed mb-4 flex-1">
            {m.description}
          </p>

          {/* Launch Button */}
          <div className="flex items-center justify-between">
            <button 
              className="text-white/70 hover:text-white text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all"
              data-testid={`button-launch-${m.id}`}
            >
              Launch Module <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-white/40 text-xs font-mono">{m.num}</span>
          </div>
        </div>

        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </Link>
  );
}
