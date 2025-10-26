/**
 * AI-Generated Module Background Images
 * Each module has a custom DALL-E generated background with watermarked title/description
 * Generated using OpenAI via Replit AI Integrations (October 2025)
 */

export interface BackgroundAsset {
  moduleId: string;
  url: string;
  source: 'unsplash' | 'pexels' | 'ai-generated';
  prompt?: string;
  credit?: string;
}

/**
 * AI-Generated Backgrounds with Watermarks
 * Each image is uniquely created with the module title and description embedded
 */
export const MODULE_BACKGROUNDS: Record<string, BackgroundAsset> = {
  weather: {
    moduleId: 'weather',
    url: '/attached_assets/module_backgrounds/weather_1761486836365.png',
    source: 'ai-generated',
    prompt: 'Cinematic satellite view of a massive storm system with dramatic lightning, swirling clouds, radar overlays',
    credit: 'AI-Generated via DALL-E'
  },
  
  prediction: {
    moduleId: 'prediction',
    url: '/attached_assets/module_backgrounds/prediction_1761486907960.png',
    source: 'ai-generated',
    prompt: 'Stunning aerial view of hurricane eye from space, with AI neural network overlays, predictive trajectory lines',
    credit: 'AI-Generated via DALL-E'
  },
  
  environmental: {
    moduleId: 'environmental',
    url: '/attached_assets/module_backgrounds/environmental_1761486979231.png',
    source: 'ai-generated',
    prompt: 'Breathtaking aerial view of pristine forest and landscape with environmental monitoring sensors',
    credit: 'AI-Generated via DALL-E'
  },
  
  damageLens: {
    moduleId: 'damageLens',
    url: '/attached_assets/module_backgrounds/damageLens_1761487063959.png',
    source: 'ai-generated',
    prompt: 'High-end professional camera equipment focused on storm-damaged building, AI analysis overlays',
    credit: 'AI-Generated via DALL-E'
  },
  
  claims: {
    moduleId: 'claims',
    url: '/attached_assets/module_backgrounds/claims_1761487129320.png',
    source: 'ai-generated',
    prompt: 'Sleek modern office with professional insurance documents, digital claim processing screens',
    credit: 'AI-Generated via DALL-E'
  },
  
  liveIntelligence: {
    moduleId: 'liveIntelligence',
    url: '/attached_assets/module_backgrounds/liveIntelligence_1761487201246.png',
    source: 'ai-generated',
    prompt: 'Futuristic AI command center with holographic displays, neural network visualization',
    credit: 'AI-Generated via DALL-E'
  },
  
  insurance: {
    moduleId: 'insurance',
    url: '/attached_assets/module_backgrounds/insurance_1761487287060.png',
    source: 'ai-generated',
    prompt: 'Impressive modern corporate office building with glass facade, professional insurance industry aesthetic',
    credit: 'AI-Generated via DALL-E'
  },
  
  legal: {
    moduleId: 'legal',
    url: '/attached_assets/module_backgrounds/legal_1761487458935.png',
    source: 'ai-generated',
    prompt: 'Prestigious law library with leather-bound legal books, professional attorney office aesthetic',
    credit: 'AI-Generated via DALL-E'
  },
  
  fieldReporting: {
    moduleId: 'fieldReporting',
    url: '/attached_assets/module_backgrounds/fieldReporting_1761487532619.png',
    source: 'ai-generated',
    prompt: 'Professional construction site with workers in safety gear, field damage assessment in action',
    credit: 'AI-Generated via DALL-E'
  },
  
  drone: {
    moduleId: 'drone',
    url: '/attached_assets/module_backgrounds/drone_1761487607263.png',
    source: 'ai-generated',
    prompt: 'Stunning drone aerial perspective of rooftop inspection, professional UAV technology in action',
    credit: 'AI-Generated via DALL-E'
  },
  
  watchlist: {
    moduleId: 'watchlist',
    url: '/attached_assets/module_backgrounds/watchlist_1761487679372.png',
    source: 'ai-generated',
    prompt: 'Global map with multiple location pins and monitoring zones, command center surveillance aesthetic',
    credit: 'AI-Generated via DALL-E'
  },
  
  traffic: {
    moduleId: 'traffic',
    url: '/attached_assets/module_backgrounds/traffic_1761487747312.png',
    source: 'ai-generated',
    prompt: 'Dramatic aerial view of highway at night with flowing traffic lights, DOT camera perspective',
    credit: 'AI-Generated via DALL-E'
  },
  
  dashboard: {
    moduleId: 'dashboard',
    url: '/attached_assets/module_backgrounds/dashboard_1761487820330.png',
    source: 'ai-generated',
    prompt: 'High-tech command center with multiple monitoring screens, professional operations control room',
    credit: 'AI-Generated via DALL-E'
  },
  
  stormAI: {
    moduleId: 'stormAI',
    url: '/attached_assets/module_backgrounds/stormAI_1761487890926.png',
    source: 'ai-generated',
    prompt: 'Powerful tornado funnel touching ground with dramatic storm clouds, professional storm chasing photography',
    credit: 'AI-Generated via DALL-E'
  },
  
  geoFencing: {
    moduleId: 'geoFencing',
    url: '/attached_assets/module_backgrounds/geoFencing_1761487971063.png',
    source: 'ai-generated',
    prompt: 'Advanced satellite tracking system with GPS coordinates, geo-fence boundaries',
    credit: 'AI-Generated via DALL-E'
  },
  
  calendar: {
    moduleId: 'calendar',
    url: '/attached_assets/module_backgrounds/calendar_1761488028044.png',
    source: 'ai-generated',
    prompt: 'Elegant modern calendar interface with scheduling blocks, professional appointment management aesthetic',
    credit: 'AI-Generated via DALL-E'
  },
  
  homeowners: {
    moduleId: 'homeowners',
    url: '/attached_assets/module_backgrounds/homeowners_1761488098224.png',
    source: 'ai-generated',
    prompt: 'Beautiful aerial view of suburban neighborhood with well-maintained homes, residential property management aesthetic',
    credit: 'AI-Generated via DALL-E'
  }
};

/**
 * Get background asset for a module
 */
export function getModuleBackground(moduleId: string): BackgroundAsset | undefined {
  return MODULE_BACKGROUNDS[moduleId];
}

/**
 * Legacy function - no longer needed as all backgrounds are AI-generated
 */
export async function generateAIBackground(prompt: string): Promise<string> {
  console.warn('generateAIBackground is deprecated - all backgrounds are pre-generated');
  return '';
}
