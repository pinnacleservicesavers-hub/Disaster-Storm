import { useState, useContext, createContext } from 'react';
import { Link } from 'wouter';
import { Cloud, Camera, Bot, Zap, Users, ArrowRight, Plane, HardHat, Scale, FileText, UserCheck, Phone } from 'lucide-react';

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
    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg text-sm">
      <span className="text-gray-600">Role:</span>
      {['ops', 'field', 'admin'].map(r => (
        <button
          key={r}
          onClick={() => setRole(r)}
          className={`px-3 py-1 rounded capitalize transition-colors ${
            role === r 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

// ===== Main Portal Hub Component =====
export default function StormOpsProHub() {
  // Check if victim user is logged in to determine link
  const victimUser = localStorage.getItem('victimUser');
  const victimPortalLink = victimUser ? '/victim/dashboard' : '/victim/login';

  const portals = [
    // Core Operations
    {
      id: 'weather-center',
      title: 'Weather Center',
      description: 'Live weather monitoring, alerts, and radar data for storm operations',
      icon: Cloud,
      link: '/weather',
      color: 'blue',
      bgClass: 'from-blue-500 to-blue-600',
      borderClass: 'border-blue-200',
      testId: 'portal-weather-center'
    },
    {
      id: 'traffic-cam-watcher',  
      title: 'TrafficCamWatcher',
      description: 'Live traffic camera monitoring with AI-powered damage detection across multiple states',
      icon: Camera,
      link: '/traffic-cameras',
      color: 'green',
      bgClass: 'from-green-500 to-green-600',
      borderClass: 'border-green-200',
      testId: 'portal-traffic-cameras'
    },
    {
      id: 'ai-damage-detection',
      title: 'AI Damage Detection', 
      description: 'Real-time AI analysis of camera feeds to identify storm damage and generate contractor leads',
      icon: Bot,
      link: '/damage-detection',
      color: 'orange',
      bgClass: 'from-orange-500 to-orange-600',
      borderClass: 'border-orange-200',
      testId: 'portal-damage-detection'
    },
    {
      id: 'storm-predictions',
      title: 'Storm Predictions',
      description: 'AI-powered predictive storm damage analysis using NOAA radar and historical data',
      icon: Zap,
      link: '/prediction-dashboard',
      color: 'purple',
      bgClass: 'from-purple-500 to-purple-600',
      borderClass: 'border-purple-200',
      testId: 'portal-predictions'
    },
    // Business Operations
    {
      id: 'contractors',
      title: 'Contractors',
      description: 'Contractor management, crew dispatch, and project tracking for storm response operations',
      icon: HardHat,
      link: '/contractors',
      color: 'cyan',
      bgClass: 'from-cyan-500 to-cyan-600',
      borderClass: 'border-cyan-200',
      testId: 'portal-contractors'
    },
    {
      id: 'claims',
      title: 'Claims Management',
      description: 'Insurance claims processing, documentation, and tracking with automated letter generation',
      icon: FileText,
      link: '/claims',
      color: 'indigo',
      bgClass: 'from-indigo-500 to-indigo-600',
      borderClass: 'border-indigo-200',
      testId: 'portal-claims'
    },
    {
      id: 'customers',
      title: 'Customers',
      description: 'Customer relationship management, project history, and communication tracking',
      icon: UserCheck,
      link: '/customers',
      color: 'teal',
      bgClass: 'from-teal-500 to-teal-600',
      borderClass: 'border-teal-200',
      testId: 'portal-customers'
    },
    {
      id: 'drones',
      title: 'Drone Operations',
      description: 'Drone fleet management, aerial footage analysis, and damage assessment workflows',
      icon: Plane,
      link: '/drones',
      color: 'emerald',
      bgClass: 'from-emerald-500 to-emerald-600',
      borderClass: 'border-emerald-200',
      testId: 'portal-drones'
    },
    {
      id: 'legal',
      title: 'Legal Compliance',
      description: 'State lien deadlines, attorney directories, and legal compliance tracking tools',
      icon: Scale,
      link: '/legal',
      color: 'slate',
      bgClass: 'from-slate-500 to-slate-600',
      borderClass: 'border-slate-200',
      testId: 'portal-legal'
    },
    // Customer Facing
    {
      id: 'victim-portal',
      title: 'Victim Portal',
      description: 'Storm damage reporting and assistance portal for affected property owners',
      icon: Users,
      link: victimPortalLink,
      color: 'red',
      bgClass: 'from-red-500 to-red-600',
      borderClass: 'border-red-200',
      testId: 'portal-victim'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="heading-main">
              🌪️ StormLead Master
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive storm operations platform for contractors - Monitor weather, track damage, and generate leads
            </p>
          </div>
        </div>
      </div>

      {/* Portal Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portals.map((portal) => {
            const IconComponent = portal.icon;
            return (
              <Link key={portal.id} href={portal.link} data-testid={portal.testId}>
                <div className={`
                  group relative bg-white rounded-2xl shadow-lg border-2 ${portal.borderClass}
                  hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2
                  cursor-pointer overflow-hidden
                `}>
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${portal.bgClass} opacity-5 group-hover:opacity-10 transition-opacity`} />
                  
                  {/* Content */}
                  <div className="relative p-8">
                    {/* Icon */}
                    <div className={`
                      inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6
                      bg-gradient-to-r ${portal.bgClass} text-white shadow-lg
                      group-hover:scale-110 transition-transform
                    `}>
                      <IconComponent size={32} />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                      {portal.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {portal.description}
                    </p>
                    
                    {/* Arrow */}
                    <div className="flex items-center text-gray-400 group-hover:text-gray-600 transition-colors">
                      <span className="text-sm font-medium mr-2">Enter Module</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  
                  {/* Hover Effect */}
                  <div className={`
                    absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${portal.bgClass}
                    transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left
                  `} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-gray-500">
            <p>Click any portal above to access that module's full dashboard and features</p>
          </div>
        </div>
      </div>
    </div>
  );
}