/**
 * Module Theme Taxonomy
 * Enterprise-grade visual identity system for all Disaster Direct modules
 * Each module gets a unique, professional background and design tokens
 */

export interface ModuleTheme {
  id: string;
  title: string;
  description: string;
  
  // Visual Identity
  backgroundType: 'gradient' | 'image' | 'video' | 'hybrid';
  backgroundImage?: string; // URL or stock image path
  gradientOverlay: string; // CSS gradient for depth/readability
  
  // Color Palette (Professional)
  primaryColor: string;
  accentColor: string;
  textColor: string;
  
  // AI Image Generation Prompts (Fallback)
  dallePrompt: string;
  
  // Design Tokens
  glassEffect: boolean;
  cardOpacity: number;
  iconTheme: 'light' | 'dark' | 'color';
  
  // Typography Scale
  headingWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  
  // Motion & Animation
  heroAnimation: 'fade' | 'slide' | 'zoom' | 'parallax';
}

export const MODULE_THEMES: Record<string, ModuleTheme> = {
  // 1. Weather Intelligence Center
  weather: {
    id: 'weather',
    title: 'Weather Intelligence Center',
    description: 'Real-time severe weather monitoring and radar analysis',
    backgroundType: 'hybrid',
    backgroundImage: 'storm-radar-satellite-dramatic',
    gradientOverlay: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.75) 100%)',
    primaryColor: '#0ea5e9', // Sky blue
    accentColor: '#f59e0b', // Amber for alerts
    textColor: '#f1f5f9',
    dallePrompt: 'Cinematic satellite view of a massive storm system with dramatic lightning, swirling clouds, radar overlays, and weather monitoring screens, professional meteorology command center aesthetic, high-tech blue and electric tones, 8K resolution',
    glassEffect: true,
    cardOpacity: 0.15,
    iconTheme: 'light',
    headingWeight: 'bold',
    heroAnimation: 'parallax'
  },
  
  // 2. Storm Prediction Portal
  prediction: {
    id: 'prediction',
    title: 'Storm Prediction Portal',
    description: 'AI-powered predictive analytics and storm forecasting',
    backgroundType: 'hybrid',
    backgroundImage: 'hurricane-eye-satellite-futuristic',
    gradientOverlay: 'linear-gradient(135deg, rgba(88, 28, 135, 0.9) 0%, rgba(30, 27, 75, 0.85) 100%)',
    primaryColor: '#a855f7', // Purple
    accentColor: '#ec4899', // Pink
    textColor: '#faf5ff',
    dallePrompt: 'Stunning aerial view of hurricane eye from space, with AI neural network overlays, predictive trajectory lines, futuristic holographic storm data visualization, deep purple and electric pink color scheme, ultra-modern technology aesthetic, photorealistic 8K',
    glassEffect: true,
    cardOpacity: 0.2,
    iconTheme: 'light',
    headingWeight: 'extrabold',
    heroAnimation: 'zoom'
  },
  
  // 3. Environmental Intelligence
  environmental: {
    id: 'environmental',
    title: 'Environmental Intelligence',
    description: 'Air quality, pollen, soil conditions, and fire detection',
    backgroundType: 'hybrid',
    backgroundImage: 'nature-earth-forest-aerial-clean',
    gradientOverlay: 'linear-gradient(135deg, rgba(5, 46, 22, 0.88) 0%, rgba(20, 83, 45, 0.82) 100%)',
    primaryColor: '#10b981', // Emerald
    accentColor: '#84cc16', // Lime
    textColor: '#ecfdf5',
    dallePrompt: 'Breathtaking aerial view of pristine forest and landscape with environmental monitoring sensors, air quality data overlays, clean earth tones with vibrant green and natural colors, scientific precision meets natural beauty, professional environmental science aesthetic, 8K ultra-detailed',
    glassEffect: true,
    cardOpacity: 0.18,
    iconTheme: 'light',
    headingWeight: 'semibold',
    heroAnimation: 'fade'
  },
  
  // 4. Damage Lens (Disaster Lens)
  damageLens: {
    id: 'damageLens',
    title: 'Damage Lens',
    description: 'AI-powered photo/video damage assessment and documentation',
    backgroundType: 'hybrid',
    backgroundImage: 'professional-camera-construction-damage-doc',
    gradientOverlay: 'linear-gradient(135deg, rgba(23, 23, 23, 0.92) 0%, rgba(64, 64, 64, 0.85) 100%)',
    primaryColor: '#ef4444', // Red
    accentColor: '#f97316', // Orange
    textColor: '#fef2f2',
    dallePrompt: 'High-end professional camera equipment focused on storm-damaged building, AI analysis overlays showing damage assessment, construction documentation aesthetic with dramatic lighting, red and orange alert tones, industrial professional photography vibe, cinematic 8K quality',
    glassEffect: true,
    cardOpacity: 0.22,
    iconTheme: 'light',
    headingWeight: 'bold',
    heroAnimation: 'slide'
  },
  
  // 5. Claims Management
  claims: {
    id: 'claims',
    title: 'Claims Management',
    description: 'Insurance claim tracking, documentation, and submission',
    backgroundType: 'hybrid',
    backgroundImage: 'modern-office-professional-documents',
    gradientOverlay: 'linear-gradient(135deg, rgba(12, 74, 110, 0.9) 0%, rgba(15, 23, 42, 0.88) 100%)',
    primaryColor: '#0284c7', // Blue
    accentColor: '#06b6d4', // Cyan
    textColor: '#f0f9ff',
    dallePrompt: 'Sleek modern office with professional insurance documents, digital claim processing screens, executive business aesthetic with navy blue and cyan accents, high-tech paperwork management, corporate professionalism, ultra-sharp 8K photography',
    glassEffect: true,
    cardOpacity: 0.16,
    iconTheme: 'light',
    headingWeight: 'semibold',
    heroAnimation: 'fade'
  },
  
  // 6. Live Intelligence AI (Grok)
  liveIntelligence: {
    id: 'liveIntelligence',
    title: 'Live Intelligence AI',
    description: 'Real-time AI assistant powered by Grok-2',
    backgroundType: 'hybrid',
    backgroundImage: 'ai-neural-network-futuristic-tech',
    gradientOverlay: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(55, 65, 81, 0.9) 100%)',
    primaryColor: '#8b5cf6', // Violet
    accentColor: '#06b6d4', // Cyan
    textColor: '#f5f3ff',
    dallePrompt: 'Futuristic AI command center with holographic displays, neural network visualization, real-time data streams, cutting-edge technology aesthetic with violet and cyan lighting, sci-fi meets reality, advanced artificial intelligence interface, photorealistic 8K',
    glassEffect: true,
    cardOpacity: 0.25,
    iconTheme: 'light',
    headingWeight: 'extrabold',
    heroAnimation: 'parallax'
  },
  
  // 7. Insurance Tracker
  insurance: {
    id: 'insurance',
    title: 'Insurance Tracker',
    description: 'Company database, contact info, and policy tracking',
    backgroundType: 'hybrid',
    backgroundImage: 'corporate-building-glass-modern',
    gradientOverlay: 'linear-gradient(135deg, rgba(30, 58, 138, 0.9) 0%, rgba(15, 23, 42, 0.87) 100%)',
    primaryColor: '#1e40af', // Blue
    accentColor: '#3b82f6', // Lighter blue
    textColor: '#eff6ff',
    dallePrompt: 'Impressive modern corporate office building with glass facade, professional insurance industry aesthetic, clean blue corporate colors, executive business environment, architectural photography perfection, 8K ultra-detailed',
    glassEffect: true,
    cardOpacity: 0.17,
    iconTheme: 'light',
    headingWeight: 'semibold',
    heroAnimation: 'fade'
  },
  
  // 8. Legal Compliance
  legal: {
    id: 'legal',
    title: 'Legal Compliance',
    description: 'Lien deadlines, attorney directory, state regulations',
    backgroundType: 'hybrid',
    backgroundImage: 'law-library-legal-books-professional',
    gradientOverlay: 'linear-gradient(135deg, rgba(55, 48, 163, 0.92) 0%, rgba(30, 27, 75, 0.88) 100%)',
    primaryColor: '#4f46e5', // Indigo
    accentColor: '#818cf8', // Lighter indigo
    textColor: '#eef2ff',
    dallePrompt: 'Prestigious law library with leather-bound legal books, mahogany furniture, professional attorney office aesthetic, indigo and gold accents, traditional legal elegance meets modern technology, high-end legal services photography, 8K quality',
    glassEffect: true,
    cardOpacity: 0.19,
    iconTheme: 'light',
    headingWeight: 'bold',
    heroAnimation: 'slide'
  },
  
  // 9. Field Reporting
  fieldReporting: {
    id: 'fieldReporting',
    title: 'Field Reporting',
    description: 'On-site damage reports, crew coordination, real-time updates',
    backgroundType: 'hybrid',
    backgroundImage: 'construction-site-workers-field-work',
    gradientOverlay: 'linear-gradient(135deg, rgba(120, 53, 15, 0.88) 0%, rgba(69, 26, 3, 0.85) 100%)',
    primaryColor: '#ea580c', // Orange
    accentColor: '#f59e0b', // Amber
    textColor: '#fff7ed',
    dallePrompt: 'Professional construction site with workers in safety gear, field damage assessment in action, industrial work site aesthetic with orange and amber safety colors, on-the-ground contractor professionalism, dynamic work photography, 8K resolution',
    glassEffect: true,
    cardOpacity: 0.2,
    iconTheme: 'light',
    headingWeight: 'bold',
    heroAnimation: 'zoom'
  },
  
  // 10. Drone Integration
  drone: {
    id: 'drone',
    title: 'Drone Integration',
    description: 'Aerial footage analysis, roof inspections, damage mapping',
    backgroundType: 'hybrid',
    backgroundImage: 'drone-aerial-view-rooftop-inspection',
    gradientOverlay: 'linear-gradient(135deg, rgba(7, 89, 133, 0.9) 0%, rgba(15, 23, 42, 0.85) 100%)',
    primaryColor: '#0891b2', // Cyan
    accentColor: '#14b8a6', // Teal
    textColor: '#ecfeff',
    dallePrompt: 'Stunning drone aerial perspective of rooftop inspection, professional UAV technology in action, bird\'s eye view with advanced camera overlays, cyan and teal tech aesthetic, cutting-edge aerial photography, cinematic 8K quality',
    glassEffect: true,
    cardOpacity: 0.18,
    iconTheme: 'light',
    headingWeight: 'semibold',
    heroAnimation: 'parallax'
  },
  
  // 11. Location Watchlist
  watchlist: {
    id: 'watchlist',
    title: 'Location Watchlist',
    description: 'Multi-site monitoring, impact scoring, alert configuration',
    backgroundType: 'hybrid',
    backgroundImage: 'map-pins-locations-monitoring-global',
    gradientOverlay: 'linear-gradient(135deg, rgba(127, 29, 29, 0.9) 0%, rgba(69, 26, 3, 0.87) 100%)',
    primaryColor: '#dc2626', // Red
    accentColor: '#f59e0b', // Amber
    textColor: '#fef2f2',
    dallePrompt: 'Global map with multiple location pins and monitoring zones, command center surveillance aesthetic, red alert markers and amber warning zones, professional geographic intelligence visualization, high-tech tracking system, 8K ultra-detailed',
    glassEffect: true,
    cardOpacity: 0.21,
    iconTheme: 'light',
    headingWeight: 'bold',
    heroAnimation: 'zoom'
  },
  
  // 12. Traffic Monitoring (511/DOT)
  traffic: {
    id: 'traffic',
    title: 'Traffic Monitoring',
    description: 'Real-time road incidents, DOT cameras, contractor opportunities',
    backgroundType: 'hybrid',
    backgroundImage: 'highway-traffic-aerial-night-lights',
    gradientOverlay: 'linear-gradient(135deg, rgba(17, 24, 39, 0.88) 0%, rgba(31, 41, 55, 0.82) 100%)',
    primaryColor: '#f59e0b', // Amber
    accentColor: '#ef4444', // Red
    textColor: '#fffbeb',
    dallePrompt: 'Dramatic aerial view of highway at night with flowing traffic lights, DOT camera perspective, road incident monitoring aesthetic with amber and red warning tones, transportation infrastructure photography, cinematic night photography, 8K quality',
    glassEffect: true,
    cardOpacity: 0.2,
    iconTheme: 'light',
    headingWeight: 'semibold',
    heroAnimation: 'slide'
  },
  
  // 13. Dashboard (Home)
  dashboard: {
    id: 'dashboard',
    title: 'Command Center',
    description: 'Unified operations dashboard and system overview',
    backgroundType: 'hybrid',
    backgroundImage: 'command-center-monitors-control-room',
    gradientOverlay: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 100%)',
    primaryColor: '#0ea5e9', // Sky
    accentColor: '#8b5cf6', // Violet
    textColor: '#f0f9ff',
    dallePrompt: 'High-tech command center with multiple monitoring screens, professional operations control room, emergency management aesthetic with blue and violet accent lighting, NASA mission control meets disaster response, photorealistic 8K',
    glassEffect: true,
    cardOpacity: 0.17,
    iconTheme: 'light',
    headingWeight: 'extrabold',
    heroAnimation: 'parallax'
  },
  
  // 14. Storm Intelligence AI
  stormAI: {
    id: 'stormAI',
    title: 'Storm Intelligence AI',
    description: 'Educational meteorology analysis and storm expertise',
    backgroundType: 'hybrid',
    backgroundImage: 'tornado-funnel-dramatic-storm-chase',
    gradientOverlay: 'linear-gradient(135deg, rgba(71, 85, 105, 0.9) 0%, rgba(30, 41, 59, 0.88) 100%)',
    primaryColor: '#64748b', // Slate
    accentColor: '#f59e0b', // Amber
    textColor: '#f1f5f9',
    dallePrompt: 'Powerful tornado funnel touching ground with dramatic storm clouds, professional storm chasing photography, meteorology expertise aesthetic with slate gray and amber lightning tones, nature\'s raw power captured, award-winning weather photography, 8K resolution',
    glassEffect: true,
    cardOpacity: 0.22,
    iconTheme: 'light',
    headingWeight: 'bold',
    heroAnimation: 'zoom'
  },
  
  // 15. Geo-Fencing & Targeting
  geoFencing: {
    id: 'geoFencing',
    title: 'Geo-Fencing & Targeting',
    description: 'Law enforcement-grade device tracking for marketing',
    backgroundType: 'hybrid',
    backgroundImage: 'satellite-tracking-gps-location-tech',
    gradientOverlay: 'linear-gradient(135deg, rgba(17, 94, 89, 0.9) 0%, rgba(6, 78, 59, 0.87) 100%)',
    primaryColor: '#14b8a6', // Teal
    accentColor: '#10b981', // Emerald
    textColor: '#f0fdfa',
    dallePrompt: 'Advanced satellite tracking system with GPS coordinates, geo-fence boundaries, location-based targeting visualization, teal and emerald tech aesthetic, precision targeting technology, professional surveillance-grade mapping, 8K ultra-detailed',
    glassEffect: true,
    cardOpacity: 0.19,
    iconTheme: 'light',
    headingWeight: 'semibold',
    heroAnimation: 'fade'
  },
  
  // 16. Calendar & Booking
  calendar: {
    id: 'calendar',
    title: 'Calendar & Booking',
    description: 'Appointment scheduling and crew coordination',
    backgroundType: 'hybrid',
    backgroundImage: 'modern-calendar-scheduling-professional',
    gradientOverlay: 'linear-gradient(135deg, rgba(91, 33, 182, 0.88) 0%, rgba(107, 33, 168, 0.85) 100%)',
    primaryColor: '#7c3aed', // Violet
    accentColor: '#a78bfa', // Lighter violet
    textColor: '#faf5ff',
    dallePrompt: 'Elegant modern calendar interface with scheduling blocks, professional appointment management aesthetic, violet and lavender color scheme, clean business organization, executive productivity design, 8K sharp detail',
    glassEffect: true,
    cardOpacity: 0.18,
    iconTheme: 'light',
    headingWeight: 'semibold',
    heroAnimation: 'slide'
  },
  
  // 17. Homeowner Contacts
  homeowners: {
    id: 'homeowners',
    title: 'Homeowner Contacts',
    description: 'Property owner database and communication tools',
    backgroundType: 'hybrid',
    backgroundImage: 'residential-homes-neighborhood-aerial',
    gradientOverlay: 'linear-gradient(135deg, rgba(21, 94, 117, 0.88) 0%, rgba(14, 116, 144, 0.85) 100%)',
    primaryColor: '#0e7490',
    accentColor: '#06b6d4',
    textColor: '#ecfeff',
    dallePrompt: 'Beautiful aerial view of suburban neighborhood with well-maintained homes, residential property management aesthetic, cyan and blue tones suggesting trust and community, professional real estate photography, 8K quality',
    glassEffect: true,
    cardOpacity: 0.17,
    iconTheme: 'light',
    headingWeight: 'semibold',
    heroAnimation: 'fade'
  },

  'fema-audit': {
    id: 'fema-audit',
    title: 'AuditShield Grant & Contract Compliance AI',
    description: 'Multi-agency compliance, AI fraud detection & audit export',
    backgroundType: 'hybrid',
    backgroundImage: 'government-compliance-audit-documents',
    gradientOverlay: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 58, 138, 0.85) 100%)',
    primaryColor: '#3b82f6',
    accentColor: '#ef4444',
    textColor: '#eff6ff',
    dallePrompt: 'Professional FEMA disaster response command center with digital compliance dashboards, audit document stacks, GPS tracking screens, government building in background, enterprise blue and navy color scheme with red accent alerts, photorealistic 8K',
    glassEffect: true,
    cardOpacity: 0.18,
    iconTheme: 'light',
    headingWeight: 'bold',
    heroAnimation: 'fade'
  },
  'connected-accounts': {
    id: 'connected-accounts',
    name: 'Connected Accounts',
    description: 'Integrations Hub - Social Media, Ads & Calendars',
    primaryColor: '#06b6d4',
    accentColor: '#3b82f6',
    textColor: '#ecfeff',
    dallePrompt: 'Professional digital integrations hub showing connected social media platforms and calendar apps floating as holographic icons around a central command dashboard, cyan and blue color scheme with glowing connection lines, modern tech aesthetic, photorealistic 8K',
    glassEffect: true,
    cardOpacity: 0.15,
    iconTheme: 'light',
    headingWeight: 'bold',
    heroAnimation: 'fade'
  }
};

/**
 * Get theme configuration for a specific module
 */
export function getModuleTheme(moduleId: string): ModuleTheme | undefined {
  return MODULE_THEMES[moduleId];
}

/**
 * Get all available module themes
 */
export function getAllModuleThemes(): ModuleTheme[] {
  return Object.values(MODULE_THEMES);
}
