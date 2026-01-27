import { useState, useContext, createContext, useEffect } from 'react';
import { Link } from 'wouter';
import { 
  Cloud, Camera, Bot, Zap, Users, ArrowRight, Plane, HardHat, Scale, FileText, UserCheck, Phone,
  Eye, Target, Video, Activity, MapPin, Shield, AlertTriangle, Wifi, Radar, Satellite, ShoppingBag
} from 'lucide-react';

// Import our amazing animation components
import {
  FadeIn, SlideIn, ScaleIn, HoverLift, PulseAlert, StaggerContainer, StaggerItem,
  RainEffect, LightningFlash, CountUp
} from '@/components/ui/animations';

// Import Voice Guide Component
import VoiceGuide, { VoiceExplanation } from '@/components/VoiceGuide';

// ===== INCREDIBLE SPINNING TORNADO COMPONENT =====
const SpinningTornado = ({ size = 48, showEffects = true }: { size?: number; showEffects?: boolean }) => {
  const [isSpinning, setIsSpinning] = useState(true);
  
  // Respect user's motion preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsSpinning(!mediaQuery.matches && showEffects);
    
    const handler = () => setIsSpinning(!mediaQuery.matches && showEffects);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [showEffects]);

  return (
    <div 
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      {/* Main Tornado SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        className={`
          relative z-10 filter drop-shadow-lg
          ${isSpinning ? 'animate-spin' : ''}
        `}
        style={{
          animationDuration: isSpinning ? '3s' : 'none',
          transformOrigin: 'center'
        }}
      >
        {/* Tornado Gradient Definitions */}
        <defs>
          <radialGradient id="tornadoGradient" cx="50%" cy="20%" r="60%">
            <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#cbd5e1" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#64748b" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#334155" stopOpacity="0.9" />
          </radialGradient>
          
          <radialGradient id="tornadoCore" cx="50%" cy="30%" r="40%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
          </radialGradient>
          
          <linearGradient id="stormGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {/* Tornado Funnel Shape */}
        <path
          d="M24 4 C20 4, 18 6, 16 10 C14 14, 12 18, 10 22 C8 26, 6 30, 8 34 C10 38, 14 40, 18 42 C22 44, 26 44, 30 42 C34 40, 38 38, 40 34 C42 30, 40 26, 38 22 C36 18, 34 14, 32 10 C30 6, 28 4, 24 4 Z"
          fill="url(#tornadoGradient)"
          stroke="none"
        />
        
        {/* Inner Tornado Core */}
        <path
          d="M24 8 C22 8, 21 9, 20 12 C19 15, 18 18, 17 21 C16 24, 15 27, 16 30 C17 33, 19 35, 22 36 C25 37, 27 37, 29 36 C32 35, 34 33, 35 30 C36 27, 35 24, 34 21 C33 18, 32 15, 31 12 C30 9, 29 8, 24 8 Z"
          fill="url(#tornadoCore)"
          stroke="none"
          opacity="0.6"
        />
        
        {/* Swirling Detail Lines */}
        <path
          d="M20 12 Q24 14, 28 16 Q32 20, 30 24 Q26 28, 22 30"
          stroke="#f1f5f9"
          strokeWidth="1"
          fill="none"
          opacity="0.7"
          strokeLinecap="round"
        />
        
        <path
          d="M22 16 Q24 18, 26 20 Q28 24, 26 26"
          stroke="#e2e8f0"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
          strokeLinecap="round"
        />
      </svg>
      
      {/* Spinning Debris Particles */}
      {isSpinning && (
        <>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-slate-400/60 rounded-full animate-spin"
              style={{
                left: `${20 + Math.cos(i * 45 * Math.PI / 180) * (size * 0.35)}px`,
                top: `${20 + Math.sin(i * 45 * Math.PI / 180) * (size * 0.35)}px`,
                animationDuration: `${2 + (i % 3)}s`,
                animationDelay: `${i * 0.2}s`,
                animationDirection: i % 2 === 0 ? 'normal' : 'reverse'
              }}
            />
          ))}
        </>
      )}
      
      {/* Storm Glow Effect */}
      <div 
        className={`
          absolute inset-0 rounded-full opacity-40 blur-md -z-10
          ${isSpinning ? 'animate-pulse' : ''}
        `}
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(99, 102, 241, 0.2) 50%, rgba(139, 92, 246, 0.3) 100%)',
          animationDuration: '4s'
        }}
      />
    </div>
  );
};

// ===== LIVE DATA STREAMING INDICATOR =====
const LiveDataStream = ({ showEffects = true }: { showEffects?: boolean }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-full border border-green-400/30">
    <div className="flex items-center gap-1">
      <div className={`w-2 h-2 bg-green-400 rounded-full ${showEffects ? 'animate-pulse' : ''}`} />
      <div className={`w-2 h-2 bg-green-400 rounded-full ${showEffects ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.5s' }} />
      <div className={`w-2 h-2 bg-green-400 rounded-full ${showEffects ? 'animate-pulse' : ''}`} style={{ animationDelay: '1s' }} />
    </div>
    <span className="text-green-400 text-xs font-semibold tracking-wide">LIVE STREAM</span>
    <Wifi className="w-3 h-3 text-green-400" />
  </div>
);

// ===== WEATHER ALERT BADGE =====
const WeatherAlertBadge = ({ showEffects = true }: { showEffects?: boolean }) => (
  <div className={`
    inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm
    bg-gradient-to-r from-orange-500/90 to-red-500/90 text-white shadow-lg border border-orange-400/50
    ${showEffects ? 'animate-pulse' : ''}
  `} style={{ animationDuration: '2s' }}>
    <AlertTriangle className="w-4 h-4" />
    <span>STORM ALERT ACTIVE</span>
    <div className={`w-2 h-2 bg-white rounded-full ${showEffects ? 'animate-ping' : ''}`} />
  </div>
);

// ===== REAL-TIME SYSTEM STATUS =====
const SystemStatus = ({ showEffects = true }: { showEffects?: boolean }) => (
  <div className="flex items-center gap-6 text-sm">
    <div className="flex items-center gap-2">
      <Radar className={`w-4 h-4 text-blue-400 ${showEffects ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
      <span className="text-blue-300 font-medium">RADAR ONLINE</span>
    </div>
    <div className="flex items-center gap-2">
      <Satellite className={`w-4 h-4 text-purple-400 ${showEffects ? 'animate-bounce' : ''}`} />
      <span className="text-purple-300 font-medium">SAT ACTIVE</span>
    </div>
    <div className="flex items-center gap-2">
      <Activity className={`w-4 h-4 text-green-400 ${showEffects ? 'animate-pulse' : ''}`} />
      <span className="text-green-300 font-medium">AI PROCESSING</span>
    </div>
  </div>
);

// Enhanced 3D Card Tilt Effect
const CardTilt = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`transform-gpu transition-all duration-500 hover:scale-[1.02] ${className}`}
    style={{
      perspective: '1000px',
      transformStyle: 'preserve-3d'
    }}
    onMouseMove={(e) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    }}
  >
    {children}
  </div>
);

// ===== Role Context =====
const RoleContext = createContext<{ role: string; setRole: (role: string) => void }>({ role: 'ops', setRole: () => {} });

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState(() => localStorage.getItem('storm_role') || 'ops');
  
  const updateRole = (newRole: string) => {
    setRole(newRole);
    localStorage.setItem('storm_role', newRole);
  };
  
  return (
    <RoleContext.Provider value={{ role, setRole: updateRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}

export function RoleBar() {
  const { role, setRole } = useRole();
  
  return (
    <FadeIn delay={0.3}>
      <div className="flex items-center gap-2 p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border text-sm">
        <span className="text-gray-600 font-medium">Active Role:</span>
        {['ops', 'field', 'admin'].map(r => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`px-4 py-2 rounded-lg capitalize transition-all duration-300 transform hover:scale-105 ${
              role === r 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md'
            }`}
            data-testid={`button-role-${r}`}
          >
            {r}
          </button>
        ))}
      </div>
    </FadeIn>
  );
}

// Floating Particles Background
const FloatingParticles = () => (
  <div className="fixed inset-0 pointer-events-none z-0">
    {Array.from({ length: 30 }).map((_, i) => (
      <div
        key={i}
        className="absolute w-2 h-2 bg-blue-400/20 rounded-full animate-pulse"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${2 + Math.random() * 2}s`
        }}
      />
    ))}
  </div>
);

// Enhanced Module Card Component
const ModuleCard = ({ 
  portal, 
  IconComponent, 
  hasLiveData, 
  index 
}: { 
  portal: any; 
  IconComponent: any; 
  hasLiveData: boolean;
  index: number;
}) => (
  <div className={`
    group relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-2 ${portal.borderClass}
    hover:shadow-3xl transition-all duration-500 transform-gpu
    cursor-pointer overflow-hidden h-full
    hover:border-opacity-50
  `}>
    {/* Shimmer Background Effect */}
    <div 
      className={`absolute inset-0 bg-gradient-to-r ${portal.bgClass} opacity-5 group-hover:opacity-15 transition-opacity duration-500`}
    />
    
    {/* Live Data Indicator */}
    {hasLiveData && (
      <div className="absolute top-4 right-4 z-10">
        <div className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded-full shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="font-semibold">LIVE</span>
        </div>
      </div>
    )}
    
    {/* Priority Badge */}
    {portal.priority === 'high' && (
      <div className="absolute top-4 left-4 z-10">
        <div className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full shadow-lg font-semibold">
          HIGH
        </div>
      </div>
    )}
    
    {/* Content */}
    <div className="relative p-8 h-full flex flex-col">
      {/* Icon */}
      <div className={`
        inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6
        bg-gradient-to-br ${portal.bgClass} text-white shadow-2xl
        group-hover:scale-110 group-hover:rotate-3 transition-all duration-500
        relative overflow-hidden
      `}>
        {/* Icon Glow Effect */}
        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <IconComponent size={40} className="relative z-10" />
      </div>
      
      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-700 transition-colors duration-300">
        {portal.title}
      </h3>
      
      {/* Description */}
      <p className="text-gray-600 mb-6 leading-relaxed flex-1 group-hover:text-gray-700 transition-colors duration-300">
        {portal.description}
      </p>
      
      {/* Action Row */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center text-gray-400 group-hover:text-gray-600 transition-colors duration-300">
          <span className="text-sm font-semibold mr-2">Launch Module</span>
          <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
        </div>
        
        {/* Module Number */}
        <div className="text-xs font-bold text-gray-300 group-hover:text-gray-500 transition-colors duration-300">
          #{String(index + 1).padStart(2, '0')}
        </div>
      </div>
    </div>
    
    {/* Enhanced Hover Effect */}
    <div className={`
      absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r ${portal.bgClass}
      transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left
    `} />
    
    {/* Hover Glow */}
    <div className={`
      absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500
      bg-gradient-to-br ${portal.bgClass} blur-xl -z-10
    `} />
  </div>
);

// Dashboard Portal Explanations for Voice Guide
const DASHBOARD_PORTAL_EXPLANATIONS: Record<string, VoiceExplanation> = {
  welcome: {
    id: 'welcome',
    portal: 'welcome',
    title: 'Welcome to Disaster Direct Operations Hub',
    content: `Welcome to Disaster Direct, the ultimate storm operations platform! I'm your voice guide, ready to walk you through our comprehensive 17-module disaster management system. This platform monitors weather conditions, detects damage using AI, generates contractor leads, helps victims, and coordinates complete storm response operations. Each portal is designed to work together, creating a seamless workflow from storm prediction to recovery completion.`,
    keyFeatures: ['17 integrated modules', 'Real-time monitoring', 'AI-powered damage detection', 'Complete storm workflow'],
    navigation: 'Click any portal card below to launch that module, or let me guide you through each one.',
    benefits: ['Complete storm operations management', 'Automated lead generation', 'Multi-state coordination', 'Real-time data insights'],
    duration: 50
  },
  'weather-center': {
    id: 'weather-center',
    portal: 'weather-center',
    title: 'Weather Center Portal',
    content: `The Weather Center is your command headquarters for storm monitoring. This high-priority module provides live weather data, radar feeds, and alerts from NOAA and multiple weather services. You'll see real-time storm tracking, precipitation forecasts, wind patterns, and severe weather warnings. The live data streams update every few minutes, ensuring you always have the most current weather intelligence for your operations.`,
    keyFeatures: ['Live NOAA radar data', 'Multi-state weather tracking', 'Severe weather alerts', 'Real-time storm prediction'],
    navigation: 'Click the blue Weather Center portal to access live weather monitoring and alerts.',
    benefits: ['Stay ahead of storms', 'Plan operations safely', 'Coordinate team deployments', 'Track damage opportunities'],
    duration: 35
  },
  'storm-predictions': {
    id: 'storm-predictions',
    portal: 'storm-predictions',
    title: 'AI Storm Predictions Portal',
    content: `Storm Predictions uses advanced AI and machine learning to forecast storm damage potential before it happens. This high-priority module analyzes historical data, current weather patterns, and geographic risk factors to predict where storm damage is most likely to occur. You'll get predictive damage maps, risk assessments, and opportunity forecasts that help you position your teams and resources proactively.`,
    keyFeatures: ['AI damage forecasting', 'Predictive risk mapping', 'Resource positioning guidance', 'Historical pattern analysis'],
    navigation: 'Click the purple Storm Predictions portal to access AI-powered forecasting tools.',
    benefits: ['Proactive team positioning', 'Higher lead conversion rates', 'Reduced travel time', 'Maximize opportunity capture'],
    duration: 35
  },
  'traffic-cam-watcher': {
    id: 'traffic-cam-watcher',
    portal: 'traffic-cam-watcher',
    title: 'TrafficCam Watcher Portal',
    content: `TrafficCam Watcher is your eyes on the ground across multiple states. This innovative module monitors live traffic cameras and uses AI to automatically detect storm damage like fallen trees, flooding, roof damage, and debris. When damage is detected, the system immediately generates contractor leads with exact locations, photos, and damage assessments. It's like having thousands of scouts working for you 24/7.`,
    keyFeatures: ['Multi-state camera monitoring', 'AI damage detection', 'Automatic lead generation', 'Real-time damage photos'],
    navigation: 'Click the green TrafficCam Watcher portal to monitor live damage detection.',
    benefits: ['Instant damage detection', 'Precise location data', 'Photo evidence included', 'First-mover advantage'],
    duration: 40
  },
  'eyes-in-sky': {
    id: 'eyes-in-sky',
    portal: 'eyes-in-sky',
    title: 'Eyes in the Sky Portal',
    content: `Eyes in the Sky provides satellite surveillance and aerial reconnaissance capabilities. This high-priority module offers real-time satellite imagery, aerial damage assessment, and wide-area storm tracking. You can monitor large geographic regions, identify damage patterns from above, and coordinate with drone operations for detailed inspections. It's your bird's-eye view of storm impact and recovery operations.`,
    keyFeatures: ['Satellite surveillance', 'Aerial damage assessment', 'Wide-area monitoring', 'Drone coordination'],
    navigation: 'Click the sky-blue Eyes in the Sky portal for satellite and aerial intelligence.',
    benefits: ['Comprehensive area coverage', 'Strategic damage overview', 'Efficient resource allocation', 'Advanced reconnaissance'],
    duration: 35
  },
  'drones': {
    id: 'drones',
    portal: 'drones',
    title: 'Drone Operations Portal',
    content: `Drone Operations manages your aerial fleet for detailed damage assessment and documentation. This module handles drone deployment, flight planning, aerial footage analysis, and damage documentation workflows. You can dispatch drones to specific locations, capture high-resolution damage photos and videos, create detailed damage reports, and generate professional documentation for insurance claims and contractor estimates.`,
    keyFeatures: ['Fleet management', 'Automated flight planning', 'HD damage documentation', 'Insurance-ready reports'],
    navigation: 'Click the emerald Drone Operations portal to manage your aerial assessment fleet.',
    benefits: ['Detailed damage documentation', 'Professional reports', 'Safe remote assessment', 'Enhanced claim success'],
    duration: 35
  },
  'ai-damage-detection': {
    id: 'ai-damage-detection',
    portal: 'ai-damage-detection',
    title: 'AI Damage Detection Portal',
    content: `AI Damage Detection is the brain of your operation, analyzing camera feeds and images to identify storm damage automatically. This high-priority module uses advanced computer vision to detect roof damage, siding issues, fallen trees, flooding, and structural problems. It processes thousands of images per hour, generates detailed damage reports, and creates qualified contractor leads with damage assessments and repair recommendations.`,
    keyFeatures: ['Advanced computer vision', 'Multi-damage type detection', 'Automated damage reports', 'Qualified lead generation'],
    navigation: 'Click the orange AI Damage Detection portal to access intelligent damage analysis.',
    benefits: ['Scale damage assessment', 'Consistent quality analysis', 'Automated reporting', 'Higher accuracy rates'],
    duration: 40
  },
  'leads': {
    id: 'leads',
    portal: 'leads',
    title: 'Lead Management Portal',
    content: `Lead Management is your sales command center for tracking and converting storm damage opportunities. This high-priority module manages leads from detection through conversion, with AI-powered insights and automated follow-ups. You'll see lead quality scores, contact history, conversion tracking, and performance analytics. The system helps prioritize your best opportunities and maximize your conversion rates through intelligent lead nurturing.`,
    keyFeatures: ['AI lead scoring', 'Automated follow-ups', 'Conversion tracking', 'Performance analytics'],
    navigation: 'Click the rose Lead Management portal to optimize your sales pipeline.',
    benefits: ['Higher conversion rates', 'Efficient lead prioritization', 'Automated nurturing', 'Data-driven decisions'],
    duration: 35
  },
  'victim-portal': {
    id: 'victim-portal',
    portal: 'victim-portal',
    title: 'Victim Portal',
    content: `The Victim Portal is where storm-affected property owners report damage and request assistance. This portal provides a simple interface for homeowners to submit damage reports, upload photos, request contractor services, and track repair progress. It creates a direct pipeline of legitimate repair opportunities while helping victims connect with qualified contractors in their area.`,
    keyFeatures: ['Damage reporting interface', 'Photo upload capability', 'Contractor matching', 'Progress tracking'],
    navigation: 'Click the red Victim Portal to access homeowner damage reporting.',
    benefits: ['Direct victim connection', 'Legitimate repair needs', 'Local contractor matching', 'Streamlined intake process'],
    duration: 30
  },
  'storm-share': {
    id: 'storm-share',
    portal: 'storm-share',
    title: 'StormShare Community Portal',
    content: `StormShare is the heart of your storm operations - a community platform where victims get help, contractors network, and businesses advertise their services. This dynamic portal includes social features, help requests, contractor networking, and business advertising opportunities. It creates a thriving ecosystem where all stakeholders can connect, collaborate, and support recovery efforts.`,
    keyFeatures: ['Community networking', 'Help request system', 'Contractor collaboration', 'Business advertising'],
    navigation: 'Click the violet StormShare portal to join the recovery community.',
    benefits: ['Network building', 'Community support', 'Business opportunities', 'Collaborative recovery'],
    duration: 35
  },
  'disaster-essentials-marketplace': {
    id: 'disaster-essentials-marketplace',
    portal: 'disaster-essentials-marketplace',
    title: 'Disaster Essentials Marketplace Portal',
    content: `The Disaster Essentials Marketplace is your one-stop resource hub for emergency supplies and services. This high-priority portal provides real-time information on hotels, fuel stations, hardware stores, shelters, FEMA resources, emergency alerts, and satellite communication equipment. With voice-guided navigation and live pricing data, you'll quickly find exactly what you need during disaster operations.`,
    keyFeatures: ['Real-time marketplace data', 'Voice-guided navigation', 'Seven essential categories', 'Live pricing information'],
    navigation: 'Click the emerald Marketplace portal to access essential disaster resources.',
    benefits: ['One-stop resource access', 'Real-time availability', 'Professional guidance', 'Emergency preparedness'],
    duration: 35
  },
  'xray-reality': {
    id: 'xray-reality',
    portal: 'xray-reality',
    title: 'X-RAY REALITY Portal',
    content: `X-RAY REALITY is your augmented reality storm operations command center. This cutting-edge module provides live 3D storm views with continuously refreshing radar and GOES satellite data. You'll access traffic cameras in a 3x3 grid organized by state, storm chaser YouTube feeds, your drone HLS streams, ocean surface temperature data, and powerful AR measurement tools. The system includes voice guidance throughout, AR measurement capabilities for phones and computers, and time-scrub replays showing the last 6 to 24 hours of storm movement across properties.`,
    keyFeatures: ['Live 3D storm visualization', 'AR measurement tools', '7 specialized tabs', 'Voice guidance system'],
    navigation: 'Click the purple X-RAY REALITY portal to enter augmented reality storm operations.',
    benefits: ['Real-time storm monitoring', 'AR damage assessment', 'Multi-source intelligence', 'Professional documentation'],
    duration: 40
  },
  'customers': {
    id: 'customers',
    portal: 'customers',
    title: 'Customer Hub Portal',
    content: `Customer Hub manages all your client relationships, project history, and communication tracking. This portal centralizes customer information, tracks project timelines, manages communication logs, and provides customer service insights. You can view complete customer histories, schedule follow-ups, track satisfaction scores, and ensure no customer falls through the cracks during busy storm seasons.`,
    keyFeatures: ['Centralized customer data', 'Project history tracking', 'Communication logging', 'Satisfaction monitoring'],
    navigation: 'Click the teal Customer Hub portal to manage client relationships.',
    benefits: ['Better customer service', 'Improved retention rates', 'Organized communication', 'Project accountability'],
    duration: 30
  },
  'claims': {
    id: 'claims',
    portal: 'claims',
    title: 'Claims Central Portal',
    content: `Claims Central streamlines insurance claims processing with automated documentation and letter generation. This portal helps you create professional insurance claims, track claim status, generate required documentation, and manage the entire claims process from initial damage assessment through final payment. The automated letter generation ensures consistent, professional communication with insurance companies.`,
    keyFeatures: ['Automated claims processing', 'Professional letter generation', 'Documentation management', 'Status tracking'],
    navigation: 'Click the indigo Claims Central portal to manage insurance processing.',
    benefits: ['Faster claim processing', 'Professional documentation', 'Higher approval rates', 'Streamlined workflow'],
    duration: 30
  },
  'contractor-management': {
    id: 'contractor-management',
    portal: 'contractor-management',
    title: 'Contractor Command Portal',
    content: `Contractor Command is your internal operations center for crew dispatch and project tracking. This portal manages your internal contractor network, dispatches crews to job sites, tracks project progress, and coordinates storm response operations. You can view crew availability, assign projects, monitor work completion, and ensure efficient resource utilization across all your operations.`,
    keyFeatures: ['Crew dispatch system', 'Project tracking', 'Resource coordination', 'Operations management'],
    navigation: 'Click the cyan Contractor Command portal to manage internal operations.',
    benefits: ['Efficient crew utilization', 'Coordinated operations', 'Project visibility', 'Resource optimization'],
    duration: 30
  },
  'contractors': {
    id: 'contractors',
    portal: 'contractors',
    title: 'Contractor Portal',
    content: `The Contractor Portal is where external contractors sign up and access your platform services. This portal provides contractor registration, AI support tools, leads management, invoicing capabilities, and compliance tracking. External contractors can join your network, access available leads, manage their projects, submit invoices, and maintain their professional credentials through this comprehensive portal.`,
    keyFeatures: ['Contractor registration', 'AI support tools', 'Lead access', 'Invoicing system'],
    navigation: 'Click the amber Contractor Portal to manage external contractor relationships.',
    benefits: ['Expanded contractor network', 'Streamlined onboarding', 'Integrated operations', 'Professional compliance'],
    duration: 30
  },
  'legal': {
    id: 'legal',
    portal: 'legal',
    title: 'Legal Command Portal',
    content: `Legal Command keeps you compliant with state lien deadlines, attorney directories, and legal requirements. This portal tracks important legal deadlines, provides access to attorney networks, manages compliance documentation, and ensures your operations meet all legal requirements across different states. It's your legal safety net for complex multi-state storm operations.`,
    keyFeatures: ['Lien deadline tracking', 'Attorney directories', 'Compliance management', 'Multi-state legal support'],
    navigation: 'Click the slate Legal Command portal to ensure legal compliance.',
    benefits: ['Legal protection', 'Compliance assurance', 'Professional networks', 'Risk mitigation'],
    duration: 30
  }
};

// ===== Main Portal Hub Component =====
export default function StormOpsProHub() {
  const [showEffects, setShowEffects] = useState(true);
  const [currentPortal, setCurrentPortal] = useState('welcome');
  
  // Respect user's motion preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShowEffects(!mediaQuery.matches);
    
    const handler = () => setShowEffects(!mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Inject shimmer animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Check if victim user is logged in to determine link
  const victimUser = localStorage.getItem('victimUser');
  const victimPortalLink = victimUser ? '/victim/dashboard' : '/victim/login';

  // Handle portal change for voice guide
  const handlePortalChange = (portalId: string) => {
    setCurrentPortal(portalId);
    // Optionally scroll to the portal card or highlight it
    const portalElement = document.querySelector(`[data-testid="portal-${portalId}"]`);
    if (portalElement) {
      portalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Complete 14-module workflow in optimal order
  const portals = [
    // 1. Weather Center - Start here to understand conditions
    {
      id: 'weather-center',
      title: 'Weather Center',
      description: 'Live weather monitoring, alerts, and radar data for storm operations',
      icon: Cloud,
      link: '/weather',
      color: 'blue',
      bgClass: 'from-blue-500 to-blue-600',
      borderClass: 'border-blue-200',
      testId: 'portal-weather-center',
      priority: 'high',
      liveData: true
    },
    // 2. Storm Predictions - Understand what's coming
    {
      id: 'storm-predictions',
      title: 'Storm Predictions',
      description: 'AI-powered predictive storm damage analysis using NOAA radar and historical data',
      icon: Zap,
      link: '/prediction-dashboard',
      color: 'purple',
      bgClass: 'from-purple-500 to-purple-600',
      borderClass: 'border-purple-200',
      testId: 'portal-predictions',
      priority: 'high',
      liveData: true
    },
    // 3. Traffic Cam Watcher - Monitor current conditions
    {
      id: 'traffic-cam-watcher',  
      title: 'TrafficCamWatcher',
      description: 'Live traffic camera monitoring with AI-powered damage detection across multiple states',
      icon: Camera,
      link: '/traffic-cam-watcher',
      color: 'green',
      bgClass: 'from-green-500 to-green-600',
      borderClass: 'border-green-200',
      testId: 'portal-traffic-cameras',
      priority: 'high',
      liveData: true
    },
    // 4. Eyes in the Sky - NEW MODULE
    {
      id: 'eyes-in-sky',
      title: 'Eyes in the Sky',
      description: 'Storm operations with route planning, address search, elevation data, and Google Maps integration on 3D Earth globe',
      icon: Eye,
      link: '/eyes-tools',
      color: 'sky',
      bgClass: 'from-sky-500 to-sky-600',
      borderClass: 'border-sky-200',
      testId: 'portal-eyes-in-sky',
      priority: 'high',
      liveData: true
    },
    // 5. Drone Operations - Deploy assets
    {
      id: 'drones',
      title: 'Drone Operations',
      description: 'Drone fleet management, aerial footage analysis, and damage assessment workflows',
      icon: Plane,
      link: '/drone-operation',
      color: 'emerald',
      bgClass: 'from-emerald-500 to-emerald-600',
      borderClass: 'border-emerald-200',
      testId: 'portal-drones',
      priority: 'medium',
      liveData: false
    },
    // 6. AI Damage Detection - Analyze the data
    {
      id: 'ai-damage-detection',
      title: 'AI Damage Detection', 
      description: 'Real-time AI analysis of camera feeds to identify storm damage and generate contractor leads',
      icon: Bot,
      link: '/damage-detection',
      color: 'orange',
      bgClass: 'from-orange-500 to-orange-600',
      borderClass: 'border-orange-200',
      testId: 'portal-damage-detection',
      priority: 'high',
      liveData: true
    },
    // 7. Leads - NEW MODULE
    {
      id: 'leads',
      title: 'Lead Management',
      description: 'Advanced lead capture, qualification, and conversion tracking with AI-powered insights and automated follow-ups',
      icon: Target,
      link: '/leads',
      color: 'rose',
      bgClass: 'from-rose-500 to-rose-600',
      borderClass: 'border-rose-200',
      testId: 'portal-leads',
      priority: 'high',
      liveData: true
    },
    // 8. Victim Portal - Help those affected
    {
      id: 'victim-portal',
      title: 'Victim Portal',
      description: 'Storm damage reporting and assistance portal for affected property owners',
      icon: Users,
      link: victimPortalLink,
      color: 'red',
      bgClass: 'from-red-500 to-red-600',
      borderClass: 'border-red-200',
      testId: 'portal-victim',
      priority: 'medium',
      liveData: false
    },
    // 9. StormShare Community - UPDATED MODULE  
    {
      id: 'storm-share',
      title: 'StormShare',
      description: 'Community platform where victims get help, contractors network, and businesses advertise - the heart of your storm operations',
      icon: Video,
      link: '/stormshare',
      color: 'violet',
      bgClass: 'from-violet-500 to-violet-600',
      borderClass: 'border-violet-200',
      testId: 'portal-storm-share-cam',
      priority: 'medium',
      liveData: true
    },
    // 10. Disaster Essentials Marketplace - NEW MODULE
    {
      id: 'disaster-essentials-marketplace',
      title: 'Disaster Essentials Marketplace',
      description: 'Real-time marketplace for hotels, fuel, hardware, shelters, FEMA resources, and emergency supplies with voice-guided navigation',
      icon: ShoppingBag,
      link: '/disaster-essentials-marketplace',
      color: 'emerald',
      bgClass: 'from-emerald-500 to-emerald-600',
      borderClass: 'border-emerald-200',
      testId: 'portal-disaster-essentials-marketplace',
      priority: 'high',
      liveData: true
    },
    // 11. Customers - Manage relationships
    {
      id: 'customers',
      title: 'Customer Hub',
      description: 'Customer relationship management, project history, and communication tracking',
      icon: UserCheck,
      link: '/customers',
      color: 'teal',
      bgClass: 'from-teal-500 to-teal-600',
      borderClass: 'border-teal-200',
      testId: 'portal-customers',
      priority: 'medium',
      liveData: false
    },
    // 12. Claims Management - Process insurance
    {
      id: 'claims',
      title: 'Claims Central',
      description: 'Insurance claims processing, documentation, and tracking with automated letter generation',
      icon: FileText,
      link: '/claims',
      color: 'indigo',
      bgClass: 'from-indigo-500 to-indigo-600',
      borderClass: 'border-indigo-200',
      testId: 'portal-claims',
      priority: 'medium',
      liveData: false
    },
    // 13. Contractor Management - Internal operations
    {
      id: 'contractor-management',
      title: 'Contractor Command',
      description: 'Internal contractor management, crew dispatch, and project tracking for storm response operations',
      icon: HardHat,
      link: '/contractor-management',
      color: 'cyan',
      bgClass: 'from-cyan-500 to-cyan-600',
      borderClass: 'border-cyan-200',
      testId: 'portal-contractor-management',
      priority: 'medium',
      liveData: false
    },
    // 14. Contractors - External contractors
    {
      id: 'contractors',
      title: 'Contractor Portal',
      description: 'Contractor sign-up portal with AI support, leads management, invoicing, and compliance tools',
      icon: UserCheck,
      link: '/contractors',
      color: 'amber',
      bgClass: 'from-amber-500 to-amber-600',
      borderClass: 'border-amber-200',
      testId: 'portal-contractors',
      priority: 'low',
      liveData: false
    },
    // 15. Legal Compliance - Stay compliant
    {
      id: 'legal',
      title: 'Legal Command',
      description: 'State lien deadlines, attorney directories, and legal compliance tracking tools',
      icon: Scale,
      link: '/legal',
      color: 'slate',
      bgClass: 'from-slate-500 to-slate-600',
      borderClass: 'border-slate-200',
      testId: 'portal-legal',
      priority: 'low',
      liveData: false
    },
    // 16. Disaster Lens - Professional documentation
    {
      id: 'disaster-lens',
      title: 'Disaster Lens',
      description: 'Professional damage documentation with QR calibration, AI measurement tools, and PDF reports',
      icon: Camera,
      link: '/disaster-lens',
      color: 'emerald',
      bgClass: 'from-emerald-500 to-emerald-600',
      borderClass: 'border-emerald-200',
      testId: 'portal-disaster-lens',
      priority: 'high',
      liveData: false
    },
    // 17. X-RAY REALITY - Augmented Reality Storm Operations
    {
      id: 'xray-reality',
      title: 'X-RAY REALITY',
      description: 'Watch the storm in real time with live 3D radar, satellite data, traffic cameras, drone feeds, and AR measurement tools',
      icon: Eye,
      link: '/modules/xray-reality',
      color: 'purple',
      bgClass: 'from-purple-500 to-pink-500',
      borderClass: 'border-purple-200',
      testId: 'portal-xray-reality',
      priority: 'high',
      liveData: true
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient Storm Effects */}
      {showEffects && (
        <>
          <RainEffect intensity="light" />
          <LightningFlash />
          <FloatingParticles />
        </>
      )}
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 animate-pulse" 
           style={{ animationDuration: '8s' }} />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/90 to-slate-100/90 backdrop-blur-sm" />
      
      {/* Enhanced Hero Section */}
      <div className="relative z-20">
        <div className="bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-md shadow-2xl border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <FadeIn duration={1}>
              <div className="text-center">
                <SlideIn direction="down" duration={0.8}>
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <SpinningTornado size={64} showEffects={showEffects} />
                    <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-indigo-300 tracking-tight" 
                        data-testid="heading-main">
                      Disaster Direct
                    </h1>
                    <SpinningTornado size={64} showEffects={showEffects} />
                  </div>
                </SlideIn>
                
                <SlideIn direction="up" delay={0.3} duration={0.8}>
                  <div className="flex flex-col items-center gap-4 mb-8">
                    <p className="text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
                      The Ultimate Storm Operations Platform - Monitor Weather, Detect Damage, Generate Leads, Victims Resources & Help
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                      <LiveDataStream showEffects={showEffects} />
                      <WeatherAlertBadge showEffects={showEffects} />
                    </div>
                  </div>
                </SlideIn>
                
                <SlideIn direction="up" delay={0.6} duration={0.8}>
                  <div className="flex flex-col items-center gap-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <div className="flex items-center gap-2 text-green-300 font-semibold">
                        <Activity className={`w-5 h-5 ${showEffects ? 'animate-pulse' : ''}`} />
                        <CountUp end={17} suffix=" Active Modules" />
                      </div>
                      <div className="flex items-center gap-2 text-blue-300 font-semibold">
                        <MapPin className={`w-5 h-5 ${showEffects ? 'animate-pulse' : ''}`} />
                        <span>Multi-State Coverage</span>
                      </div>
                      <div className="flex items-center gap-2 text-yellow-300 font-semibold">
                        <Shield className={`w-5 h-5 ${showEffects ? 'animate-pulse' : ''}`} />
                        <span>Enterprise Ready</span>
                      </div>
                    </div>
                    <SystemStatus showEffects={showEffects} />
                  </div>
                </SlideIn>
                
                <ScaleIn delay={1}>
                  <div className="inline-block p-1 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600">
                    <div className="px-8 py-4 bg-slate-900/50 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-3">
                        <div className={`w-2 h-2 bg-green-400 rounded-full ${showEffects ? 'animate-ping' : ''}`} />
                        <p className="text-white font-bold text-lg">
                          🚀 Enter Storm Operations Mode - Select Your Portal Below
                        </p>
                        <div className={`w-2 h-2 bg-blue-400 rounded-full ${showEffects ? 'animate-pulse' : ''}`} />
                      </div>
                    </div>
                  </div>
                </ScaleIn>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Role Bar */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-center">
            <RoleBar />
          </div>
        </div>

        {/* Voice Guide for Dashboard Portals */}
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <FadeIn delay={0.2}>
            <div className="flex justify-center">
              <VoiceGuide
                currentPortal={currentPortal}
                explanations={DASHBOARD_PORTAL_EXPLANATIONS}
                onPortalChange={handlePortalChange}
                className="relative"
              />
            </div>
          </FadeIn>
        </div>

        {/* Portal Grid with Staggered Animation */}
        <div className="max-w-7xl mx-auto px-6 pb-20 relative z-10">
          <StaggerContainer staggerDelay={0.05}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {portals.map((portal, index) => {
                const IconComponent = portal.icon;
                const isHighPriority = portal.priority === 'high';
                const hasLiveData = portal.liveData;
                
                return (
                  <StaggerItem key={portal.id}>
                    <Link to={portal.link} data-testid={`portal-${portal.id}`}>
                      <CardTilt>
                        {isHighPriority ? (
                          <PulseAlert intensity="subtle">
                            <ModuleCard 
                              portal={portal} 
                              IconComponent={IconComponent}
                              hasLiveData={hasLiveData}
                              index={index}
                            />
                          </PulseAlert>
                        ) : (
                          <HoverLift lift={12}>
                            <ModuleCard 
                              portal={portal} 
                              IconComponent={IconComponent}
                              hasLiveData={hasLiveData}
                              index={index}
                            />
                          </HoverLift>
                        )}
                      </CardTilt>
                    </Link>
                  </StaggerItem>
                );
              })}
            </div>
          </StaggerContainer>
        </div>
        
        {/* Enhanced Footer */}
        <div className="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-md border-t border-white/10 mt-16">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <FadeIn delay={0.5}>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Ready to Transform Storm Response?
                </h3>
                <p className="text-slate-300 mb-6 text-lg">
                  Click any portal above to access cutting-edge storm operations technology
                </p>
                <div className="flex flex-col items-center gap-4">
                  <div className={`
                    inline-flex items-center gap-3 px-6 py-3 rounded-xl text-white font-semibold shadow-lg
                    bg-gradient-to-r from-blue-500 to-indigo-600
                    ${showEffects ? 'animate-pulse' : ''}
                  `} style={{ animationDuration: '3s' }}>
                    <AlertTriangle className={`w-5 h-5 ${showEffects ? 'animate-bounce' : ''}`} />
                    <span>Live Storm Monitoring Active</span>
                    <div className={`flex gap-1 ${showEffects ? '' : 'hidden'}`}>
                      <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                      <div className="w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
                      <div className="w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.6s' }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <SpinningTornado size={16} showEffects={showEffects} />
                      Real-Time Processing
                    </span>
                    <span>•</span>
                    <span>Multi-State Coverage</span>
                    <span>•</span>
                    <span>AI-Powered Detection</span>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  );
}