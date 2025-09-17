import { useState, useContext, createContext, useEffect } from 'react';
import { Link } from 'wouter';
import { 
  Cloud, Camera, Bot, Zap, Users, ArrowRight, Plane, HardHat, Scale, FileText, UserCheck, Phone,
  Eye, Target, Video, Activity, MapPin, Shield, AlertTriangle
} from 'lucide-react';

// Import our amazing animation components
import {
  FadeIn, SlideIn, ScaleIn, HoverLift, PulseAlert, StaggerContainer, StaggerItem,
  RainEffect, LightningFlash, CountUp
} from '@/components/ui/animations';

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

// ===== Main Portal Hub Component =====
export default function StormOpsProHub() {
  const [showEffects, setShowEffects] = useState(true);
  
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
      link: '/traffic-cameras',
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
      description: 'Satellite surveillance and aerial reconnaissance with real-time storm tracking and damage assessment',
      icon: Eye,
      link: '/eyes-in-sky',
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
      link: '/drones',
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
    // 9. StormShareCam - NEW MODULE  
    {
      id: 'storm-share-cam',
      title: 'StormShareCam',
      description: 'Community-driven storm documentation platform with social features and real-time damage sharing',
      icon: Video,
      link: '/storm-share-cam',
      color: 'violet',
      bgClass: 'from-violet-500 to-violet-600',
      borderClass: 'border-violet-200',
      testId: 'portal-storm-share-cam',
      priority: 'medium',
      liveData: true
    },
    // 10. Customers - Manage relationships
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
    // 11. Claims Management - Process insurance
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
    // 12. Contractor Management - Internal operations
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
    // 13. Contractors - External contractors
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
    // 14. Legal Compliance - Stay compliant
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
                  <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-indigo-300 mb-6 tracking-tight" 
                      data-testid="heading-main">
                    🌪️ StormLead Master
                  </h1>
                </SlideIn>
                
                <SlideIn direction="up" delay={0.3} duration={0.8}>
                  <p className="text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed mb-8">
                    The Ultimate Storm Operations Platform - Monitor Weather, Detect Damage, Generate Leads
                  </p>
                </SlideIn>
                
                <SlideIn direction="up" delay={0.6} duration={0.8}>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                    <div className="flex items-center gap-2 text-green-300 font-semibold">
                      <Activity className="w-5 h-5 animate-pulse" />
                      <CountUp end={14} suffix=" Active Modules" />
                    </div>
                    <div className="flex items-center gap-2 text-blue-300 font-semibold">
                      <MapPin className="w-5 h-5 animate-pulse" />
                      <span>Multi-State Coverage</span>
                    </div>
                    <div className="flex items-center gap-2 text-yellow-300 font-semibold">
                      <Shield className="w-5 h-5 animate-pulse" />
                      <span>Enterprise Ready</span>
                    </div>
                  </div>
                </SlideIn>
                
                <ScaleIn delay={1}>
                  <div className="inline-block p-1 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600">
                    <div className="px-8 py-4 bg-slate-900/50 rounded-xl backdrop-blur-sm">
                      <p className="text-white font-bold text-lg">
                        🚀 Enter Storm Operations Mode - Select Your Portal Below
                      </p>
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
                    <Link href={portal.link} data-testid={portal.testId}>
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
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white font-semibold shadow-lg">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Live Storm Monitoring Active</span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  );
}