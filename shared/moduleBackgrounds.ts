/**
 * Background Asset Pipeline
 * Maps module themes to curated high-quality Unsplash imagery
 * Fallback: AI generation via DALL-E
 */

export interface BackgroundAsset {
  moduleId: string;
  url: string;
  source: 'unsplash' | 'pexels' | 'ai-generated';
  prompt?: string;
  credit?: string;
}

/**
 * Curated professional backgrounds from Unsplash
 * High-resolution, enterprise-quality imagery
 */
export const MODULE_BACKGROUNDS: Record<string, BackgroundAsset> = {
  weather: {
    moduleId: 'weather',
    url: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'NASA on Unsplash - Hurricane from space'
  },
  
  prediction: {
    moduleId: 'prediction',
    url: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'NASA on Unsplash - Hurricane eye satellite view'
  },
  
  environmental: {
    moduleId: 'environmental',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'Casey Horner on Unsplash - Forest aerial view'
  },
  
  damageLens: {
    moduleId: 'damageLens',
    url: 'https://images.unsplash.com/photo-1590396482183-aee2e37a06d0?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'Iewek Gnos on Unsplash - Professional camera equipment'
  },
  
  claims: {
    moduleId: 'claims',
    url: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'Sohne on Unsplash - Modern office documents'
  },
  
  liveIntelligence: {
    moduleId: 'liveIntelligence',
    url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'Google DeepMind on Unsplash - AI neural network'
  },
  
  insurance: {
    moduleId: 'insurance',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'Paxson Woelber on Unsplash - Corporate building'
  },
  
  legal: {
    moduleId: 'legal',
    url: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'Giammarco Boscaro on Unsplash - Law library'
  },
  
  fieldReporting: {
    moduleId: 'fieldReporting',
    url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'Scott Blake on Unsplash - Construction site workers'
  },
  
  drone: {
    moduleId: 'drone',
    url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'Dose Media on Unsplash - Drone aerial photography'
  },
  
  watchlist: {
    moduleId: 'watchlist',
    url: 'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'Timo Wielink on Unsplash - World map with pins'
  },
  
  traffic: {
    moduleId: 'traffic',
    url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'Denys Nevozhai on Unsplash - Highway night traffic'
  },
  
  dashboard: {
    moduleId: 'dashboard',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'Luke Chesser on Unsplash - Command center monitors'
  },
  
  stormAI: {
    moduleId: 'stormAI',
    url: 'https://images.unsplash.com/photo-1527482937786-6608042b0e21?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'NOAA on Unsplash - Tornado formation'
  },
  
  geoFencing: {
    moduleId: 'geoFencing',
    url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'NASA on Unsplash - Satellite tracking'
  },
  
  calendar: {
    moduleId: 'calendar',
    url: 'https://images.unsplash.com/photo-1611224885990-ab7363d1f2a4?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'Waldemar on Unsplash - Calendar planning'
  },
  
  homeowners: {
    moduleId: 'homeowners',
    url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=3000&auto=format&fit=crop',
    source: 'unsplash',
    credit: 'Ralph Ravi Kayden on Unsplash - Residential neighborhood'
  }
};

/**
 * Get background asset for a module
 */
export function getModuleBackground(moduleId: string): BackgroundAsset | undefined {
  return MODULE_BACKGROUNDS[moduleId];
}

/**
 * Generate AI background via DALL-E (fallback)
 */
export async function generateAIBackground(prompt: string): Promise<string> {
  // This would call the OpenAI DALL-E API
  // For now, return a placeholder
  return `https://api.placeholder.com/ai-generated?prompt=${encodeURIComponent(prompt)}`;
}
