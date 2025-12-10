import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TropicalStorm {
  id: string;
  name: string;
  stormName: string;
  stormType: string;
  category: number;
  windSpeedMPH: number;
  position: {
    lat: number;
    lon: number;
  };
  basin: string;
}

interface StormSummary {
  totalActive: number;
  byBasin: Record<string, number>;
  byCategory: Record<string, number>;
  storms: TropicalStorm[];
  timestamp: string;
}

const basinNames: Record<string, string> = {
  'AL': 'Atlantic',
  'EP': 'East Pacific',
  'CP': 'Central Pacific',
  'WP': 'West Pacific',
  'IO': 'Indian Ocean',
  'SH': 'South Pacific',
};

const stormTypeLabels: Record<string, string> = {
  'TD': 'Tropical Depression',
  'TS': 'Tropical Storm',
  'H1': 'Cat 1 Hurricane',
  'H2': 'Cat 2 Hurricane',
  'H3': 'Cat 3 Hurricane',
  'H4': 'Cat 4 Hurricane',
  'H5': 'Cat 5 Hurricane',
  'TY': 'Typhoon',
  'STY': 'Super Typhoon',
};

export default function NamedStormsIndicator() {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data, isLoading } = useQuery<StormSummary>({
    queryKey: ['/api/xweather/tropicalcyclones/summary'],
    refetchInterval: 5 * 60 * 1000,
  });

  const stormCount = data?.totalActive || 0;
  const storms = data?.storms || [];
  const hasActiveStorms = stormCount > 0;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-slate-600/50">
        <Wind className="w-4 h-4 text-slate-400 animate-pulse" />
        <span className="text-sm text-slate-400">Loading...</span>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.button
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
            hasActiveStorms
              ? 'bg-cyan-600/30 border-cyan-500/50 hover:bg-cyan-600/40'
              : 'bg-slate-800/60 border-slate-600/50 hover:bg-slate-700/60'
          }`}
          data-testid="indicator-named-storms"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <AnimatePresence mode="wait">
            {hasActiveStorms ? (
              <motion.div
                key="active"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative"
              >
                <Wind className="w-4 h-4 text-cyan-400" />
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>
            ) : (
              <Wind className="w-4 h-4 text-slate-400" />
            )}
          </AnimatePresence>
          
          <span className={`text-sm font-medium ${hasActiveStorms ? 'text-cyan-300' : 'text-slate-400'}`}>
            🌀 {stormCount} Named {stormCount === 1 ? 'Storm' : 'Storms'}
          </span>
        </motion.button>
      </DialogTrigger>
      
      <DialogContent className="bg-slate-900/95 border-slate-700 backdrop-blur-lg max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Wind className="w-5 h-5 text-cyan-400" />
            Active Named Storms
            <Badge variant="outline" className="ml-2 text-cyan-400 border-cyan-500/50">
              {stormCount} Active
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {hasActiveStorms ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {storms.map((storm) => (
                <div
                  key={storm.id}
                  className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-white">{storm.stormName}</p>
                      <p className="text-sm text-slate-400">
                        {stormTypeLabels[storm.stormType] || storm.stormType} • {basinNames[storm.basin] || storm.basin}
                      </p>
                    </div>
                    <Badge 
                      className={`text-xs ${
                        storm.category >= 3 
                          ? 'bg-red-600 text-white' 
                          : storm.category >= 1 
                            ? 'bg-orange-500 text-white'
                            : 'bg-yellow-500 text-black'
                      }`}
                    >
                      {storm.windSpeedMPH} mph
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <span>📍 {storm.position.lat.toFixed(1)}°, {storm.position.lon.toFixed(1)}°</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <Wind className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No active named storms</p>
              <p className="text-xs text-slate-500 mt-1">Data from Xweather Tropical Cyclones API</p>
            </div>
          )}
          
          {data?.timestamp && (
            <p className="text-xs text-slate-500 text-center pt-2 border-t border-slate-700/50">
              Last updated: {new Date(data.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
