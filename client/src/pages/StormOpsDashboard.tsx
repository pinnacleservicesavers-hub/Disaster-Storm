import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Cloud, 
  Target, 
  Eye, 
  Car, 
  Plane, 
  Zap, 
  Camera, 
  FileText,
  Users,
  Heart,
  User,
  Briefcase,
  Settings,
  ShoppingBag,
  Share2,
  ArrowRight,
  Activity,
  Timer,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { FadeIn, SlideIn, StaggerContainer, StaggerItem } from '@/components/ui/animations';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

// Phase data structure matching the document exactly
const phases = [
  {
    id: 'phase1',
    title: 'Phase 1: Awareness & Monitoring',
    subtitle: 'before the storm hits',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    modules: [
      {
        title: 'Weather Center',
        description: 'Live weather radar, alerts, forecasts',
        href: '/weather',
        icon: Cloud,
        badge: 'Live',
        badgeColor: 'bg-blue-500',
        testId: 'module-weather-center'
      },
      {
        title: 'Storm Predictions',
        description: 'AI storm modeling and risk mapping',
        href: '/storm-predictions',
        icon: Target,
        badge: 'AI',
        badgeColor: 'bg-purple-500',
        testId: 'module-storm-predictions'
      },
      {
        title: 'Eyes in the Sky',
        description: 'Drone operations + aerial imaging',
        href: '/eyes-in-the-sky',
        icon: Eye,
        badge: 'Live',
        badgeColor: 'bg-green-500',
        testId: 'module-eyes-in-the-sky'
      },
      {
        title: 'Traffic Cam Watcher',
        description: 'Road conditions & evacuation routes',
        href: '/traffic-cam-watcher',
        icon: Car,
        badge: 'Real-time',
        badgeColor: 'bg-orange-500',
        testId: 'module-traffic-cam-watcher'
      }
    ]
  },
  {
    id: 'phase2',
    title: 'Phase 2: Active Storm Operations',
    subtitle: 'during/after impact',
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    modules: [
      {
        title: 'Drone Operation',
        description: 'Real-time drone deployments with AI overlays',
        href: '/drone-operation',
        icon: Plane,
        badge: 'Active',
        badgeColor: 'bg-red-500',
        testId: 'module-drone-operation'
      },
      {
        title: 'AI Damage Detection',
        description: 'Automatic detection & measurement of damages (trees, roofs, flooding, etc.)',
        href: '/damage-detection',
        icon: Zap,
        badge: 'AI',
        badgeColor: 'bg-purple-500',
        testId: 'module-ai-damage-detection'
      },
      {
        title: 'Disaster Lens',
        description: 'Contractor field photo/video capture with AI tools (measurements, highlights, water/gas line circles)',
        href: '/disaster-lens',
        icon: Camera,
        badge: 'Pro',
        badgeColor: 'bg-emerald-500',
        testId: 'module-disaster-lens'
      },
      {
        title: 'Claims Central',
        description: 'Auto-generate reports, measurements, adjuster packets',
        href: '/claims',
        icon: FileText,
        badge: '1.2k',
        badgeColor: 'bg-blue-500',
        testId: 'module-claims-central'
      }
    ]
  },
  {
    id: 'phase3',
    title: 'Phase 3: Response & Coordination',
    subtitle: 'response management',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    modules: [
      {
        title: 'Lead Management',
        description: 'Assign incoming jobs, track estimates',
        href: '/leads',
        icon: Target,
        badge: '157',
        badgeColor: 'bg-orange-500',
        testId: 'module-lead-management'
      },
      {
        title: 'Victim Portal',
        description: 'Homeowners/customers submit photos, see claim status, track crews',
        href: '/victim/login',
        icon: Heart,
        badge: 'Support',
        badgeColor: 'bg-pink-500',
        testId: 'module-victim-portal'
      },
      {
        title: 'Customer Hub',
        description: 'Customer communication, updates, billing',
        href: '/customers',
        icon: User,
        badge: 'Active',
        badgeColor: 'bg-blue-500',
        testId: 'module-customer-hub'
      },
      {
        title: 'Contractor Portal',
        description: 'Subcontractors manage work orders, submit compliance docs',
        href: '/contractors',
        icon: Briefcase,
        badge: '89',
        badgeColor: 'bg-green-500',
        testId: 'module-contractor-portal'
      },
      {
        title: 'Contractor Command',
        description: 'HQ command dashboard for scheduling, payroll, crew coordination',
        href: '/contractor-management',
        icon: Settings,
        badge: 'Command',
        badgeColor: 'bg-red-500',
        testId: 'module-contractor-command'
      }
    ]
  },
  {
    id: 'phase4',
    title: 'Phase 4: Support & Long-Term Recovery',
    subtitle: 'recovery & community',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    modules: [
      {
        title: 'Disaster Essentials Marketplace',
        description: 'Supplies, rentals, food, fuel, PPE for contractors & victims',
        href: '/disaster-essentials-marketplace',
        icon: ShoppingBag,
        badge: 'New',
        badgeColor: 'bg-purple-500',
        testId: 'module-disaster-essentials-marketplace'
      },
      {
        title: 'Storm Share',
        description: 'Community engagement: photos, updates, live maps, insurance/contractor collaboration',
        href: '/stormshare',
        icon: Share2,
        badge: 'Hot',
        badgeColor: 'bg-pink-500',
        testId: 'module-storm-share'
      }
    ]
  }
];

export default function StormOpsDashboard() {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <FadeIn>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1 
              className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Storm Operations Dashboard
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Comprehensive storm response workflow organized by operational phases
            </motion.p>
          </div>

          {/* Workflow Overview */}
          <motion.div 
            className="mb-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Activity className="w-6 h-6 mr-2 text-blue-500" />
              Operational Workflow
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {phases.map((phase, index) => (
                <div key={phase.id} className="flex items-center">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${phase.color} text-white text-center flex-1`}>
                    <div className="text-sm font-medium">Phase {index + 1}</div>
                    <div className="text-xs opacity-90">{phase.subtitle}</div>
                  </div>
                  {index < phases.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-gray-400 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Phase Sections */}
          <StaggerContainer className="space-y-8">
            {phases.map((phase, phaseIndex) => (
              <StaggerItem key={phase.id}>
                <motion.div
                  className={`rounded-lg border-2 ${phase.borderColor} ${phase.bgColor} overflow-hidden`}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Phase Header */}
                  <div 
                    className={`p-6 bg-gradient-to-r ${phase.color} text-white cursor-pointer`}
                    onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{phase.title}</h2>
                        <p className="text-white/90 capitalize">{phase.subtitle}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          {phase.modules.length} modules
                        </Badge>
                        <motion.div
                          animate={{ rotate: expandedPhase === phase.id ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ArrowRight className="w-6 h-6" />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Phase Modules */}
                  <motion.div
                    initial={false}
                    animate={{ height: expandedPhase === phase.id ? 'auto' : 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {phase.modules.map((module, moduleIndex) => {
                          const Icon = module.icon;
                          return (
                            <motion.div
                              key={module.href}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: moduleIndex * 0.1 }}
                            >
                              <Link to={module.href}>
                                <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg bg-gradient-to-r ${phase.color} text-white`}>
                                          <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                          <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {module.title}
                                          </CardTitle>
                                        </div>
                                      </div>
                                      <Badge className={`${module.badgeColor} text-white`}>
                                        {module.badge}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <CardDescription className="text-sm">
                                      {module.description}
                                    </CardDescription>
                                    <div className="mt-4 flex items-center text-sm text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300">
                                      Open Module
                                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Quick Status Overview */}
          <motion.div 
            className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">15</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Modules</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">12</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Systems</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Timer className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Monitoring</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Critical Issues</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </FadeIn>
      
      <ModuleAIAssistant 
        moduleName="Storm Operations Dashboard"
        moduleContext="Complete storm operations workflow from pre-storm monitoring to post-storm recovery. Rachel can guide contractors through all phases: awareness, deployment, response, and recovery. Includes weather monitoring, predictions, damage assessment, claims, and contractor tools."
      />
    </div>
  );
}