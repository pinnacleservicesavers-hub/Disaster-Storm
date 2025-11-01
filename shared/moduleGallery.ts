import { 
  Cloud, Zap, Camera, Eye, Plane, Cpu, FileText, Scale, 
  Users, Building, Target, TrendingUp, Video, Package,
  ShoppingCart, UserCheck, Briefcase, Navigation, Globe
} from 'lucide-react';

export interface ModuleData {
  id: string;
  num: string;
  name: string;
  description: string;
  path: string;
  icon: any;
  gradient: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'LIVE' | 'BETA' | 'COMING_SOON';
  category: 'operations' | 'intelligence' | 'customers' | 'sales' | 'management';
}

export const MODULES: ModuleData[] = [
  {
    id: 'weather',
    num: '#01',
    name: 'Weather Center',
    description: 'Live weather monitoring, alerts, and radar data for storm operations',
    path: '/weather',
    icon: Cloud,
    gradient: 'from-blue-400 via-blue-500 to-blue-600',
    priority: 'HIGH',
    status: 'LIVE',
    category: 'operations'
  },
  {
    id: 'predictions',
    num: '#02',
    name: 'Storm Predictions',
    description: 'AI-powered predictive storm damage analysis using NOAA radar and historical data',
    path: '/prediction-dashboard',
    icon: Zap,
    gradient: 'from-purple-400 via-purple-500 to-purple-600',
    priority: 'HIGH',
    status: 'LIVE',
    category: 'intelligence'
  },
  {
    id: 'traffic-cam',
    num: '#03',
    name: 'TrafficCamWatcher',
    description: 'Live traffic camera monitoring with AI-powered damage detection across multiple states',
    path: '/traffic-cam-watcher',
    icon: Camera,
    gradient: 'from-green-400 via-green-500 to-green-600',
    priority: 'HIGH',
    status: 'LIVE',
    category: 'operations'
  },
  {
    id: 'eyes-sky',
    num: '#04',
    name: 'Eyes in the Sky',
    description: 'Storm operations with route planning, address search, elevation data, and Google Maps integration on 3D Earth globe',
    path: '/eyes-in-the-sky',
    icon: Eye,
    gradient: 'from-cyan-400 via-cyan-500 to-cyan-600',
    priority: 'HIGH',
    status: 'LIVE',
    category: 'operations'
  },
  {
    id: 'drone-ops',
    num: '#05',
    name: 'Drone Operations',
    description: 'Drone fleet management, aerial footage analysis, and damage assessment workflows',
    path: '/drone-operation',
    icon: Plane,
    gradient: 'from-teal-400 via-teal-500 to-teal-600',
    priority: 'MEDIUM',
    status: 'LIVE',
    category: 'operations'
  },
  {
    id: 'ai-damage',
    num: '#06',
    name: 'AI Damage Detection',
    description: 'Real-time AI analysis of camera feeds to identify storm damage and generate contractor leads',
    path: '/damage-detection',
    icon: Cpu,
    gradient: 'from-orange-400 via-orange-500 to-orange-600',
    priority: 'HIGH',
    status: 'LIVE',
    category: 'intelligence'
  },
  {
    id: 'lead-mgmt',
    num: '#07',
    name: 'Lead Management',
    description: 'Advanced lead capture, qualification, and conversion tracking with AI-powered insights and automated follow-ups',
    path: '/leads',
    icon: Target,
    gradient: 'from-pink-400 via-pink-500 to-pink-600',
    priority: 'HIGH',
    status: 'LIVE',
    category: 'sales'
  },
  {
    id: 'victim-portal',
    num: '#08',
    name: 'Victim Portal',
    description: 'Storm damage reporting and assistance portal for affected property owners',
    path: '/victim/dashboard',
    icon: Users,
    gradient: 'from-red-400 via-red-500 to-red-600',
    priority: 'MEDIUM',
    status: 'LIVE',
    category: 'customers'
  },
  {
    id: 'stormshare',
    num: '#09',
    name: 'StormShare',
    description: 'Community platform where victims get help, contractors network, and businesses advertise - the heart of your storm operations',
    path: '/stormshare',
    icon: Video,
    gradient: 'from-purple-400 via-purple-500 to-indigo-600',
    priority: 'MEDIUM',
    status: 'LIVE',
    category: 'customers'
  },
  {
    id: 'essentials',
    num: '#10',
    name: 'Disaster Essentials Marketplace',
    description: 'Real-time marketplace for hotels, fuel, hardware, shelters, FEMA resources, and emergency supplies with voice-guided navigation',
    path: '/disaster-essentials-marketplace',
    icon: ShoppingCart,
    gradient: 'from-emerald-400 via-emerald-500 to-emerald-600',
    priority: 'HIGH',
    status: 'LIVE',
    category: 'operations'
  },
  {
    id: 'customer-hub',
    num: '#11',
    name: 'Customer Hub',
    description: 'Customer relationship management, project history, and communication tracking',
    path: '/customers',
    icon: UserCheck,
    gradient: 'from-teal-400 via-teal-500 to-cyan-600',
    priority: 'MEDIUM',
    status: 'LIVE',
    category: 'customers'
  },
  {
    id: 'claims',
    num: '#12',
    name: 'Claims Central',
    description: 'Insurance claims processing, documentation, and tracking with automated letter generation',
    path: '/claims',
    icon: FileText,
    gradient: 'from-indigo-400 via-indigo-500 to-indigo-600',
    priority: 'MEDIUM',
    status: 'LIVE',
    category: 'management'
  },
  {
    id: 'contractor-cmd',
    num: '#13',
    name: 'Contractor Command',
    description: 'Internal contractor management, crew dispatch, and project tracking for storm response operations',
    path: '/contractor-management',
    icon: Briefcase,
    gradient: 'from-sky-400 via-sky-500 to-sky-600',
    priority: 'MEDIUM',
    status: 'LIVE',
    category: 'management'
  },
  {
    id: 'contractor-portal',
    num: '#14',
    name: 'Contractor Portal',
    description: 'Contractor sign-up portal with AI support, leads management, invoicing, and compliance tools',
    path: '/contractors',
    icon: Building,
    gradient: 'from-amber-400 via-amber-500 to-amber-600',
    priority: 'MEDIUM',
    status: 'LIVE',
    category: 'management'
  },
  {
    id: 'legal',
    num: '#15',
    name: 'Legal Command',
    description: 'State lien deadlines, attorney directories, and legal compliance tracking tools',
    path: '/legal',
    icon: Scale,
    gradient: 'from-slate-400 via-slate-500 to-slate-600',
    priority: 'MEDIUM',
    status: 'LIVE',
    category: 'management'
  },
  {
    id: 'disaster-lens',
    num: '#16',
    name: 'Disaster Lens',
    description: 'Professional damage documentation with QR calibration, AI measurement tools, and PDF reports',
    path: '/disaster-lens',
    icon: Camera,
    gradient: 'from-green-400 via-green-500 to-teal-600',
    priority: 'HIGH',
    status: 'LIVE',
    category: 'operations'
  },
  {
    id: 'xray',
    num: '#17',
    name: 'X-RAY REALITY',
    description: 'Watch the storm in real time with live 3D radar, satellite data, traffic cameras, drone feeds, and AR measurement tools',
    path: '/modules/xray-reality',
    icon: Globe,
    gradient: 'from-fuchsia-400 via-pink-500 to-pink-600',
    priority: 'HIGH',
    status: 'LIVE',
    category: 'intelligence'
  }
];
