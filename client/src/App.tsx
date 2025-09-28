import { Route, Switch, Link, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import StormOpsProHub from "./StormOpsProHub";
import StormOpsDashboard from "./pages/StormOpsDashboard";
import WeatherIntelligenceCenter from "./pages/WeatherIntelligenceCenter";
import PredictionDashboard from "./pages/PredictionDashboard";
import StormPredictions from "./pages/StormPredictions";
import SurveillanceCenter from "./pages/SurveillanceCenter";
import EyesInSky from "./pages/EyesInSky";
import TrafficCamWatcher from "./pages/TrafficCamWatcher";
import DroneOperation from "./pages/DroneOperation";
import VictimLogin from "./pages/VictimLogin";
import VictimRegister from "./pages/VictimRegister";
import VictimDashboard from "./pages/VictimDashboard";
import DamageReport from "./pages/DamageReport";
import ServiceRequest from "./pages/ServiceRequest";
import MyRequests from "./pages/MyRequests";
import { DamageDetectionDashboard } from "./components/DamageDetectionDashboard";
import ContractorPortal from "./pages/ContractorPortal";
import ContractorManagement from "./pages/ContractorManagement";
import Claims from "./pages/Claims";
import Customers from "./pages/Customers";
import DisasterLens from "./pages/DisasterLens";
import Legal from "./pages/Legal";
import Leads from "./pages/Leads";
import FunnelBuilder from "./pages/FunnelBuilder";
import FormBuilder from "./pages/FormBuilder";
import CalendarBooking from "./pages/CalendarBooking";
import WorkflowBuilder from "./pages/WorkflowBuilder";
import StormShare from "./pages/StormShare";
import DisasterEssentialsMarketplace from "./pages/DisasterEssentialsMarketplace";
import HomeownerContacts from "./pages/HomeownerContacts";
import XRayRealityModule from "./modules/xray-reality/XRayRealityModule";
import EyesInTheSkyGlobe from "./modules/EyesInTheSky/EyesInTheSkyGlobe";
import { FloatingAIAssistant } from '@/components/FloatingAIAssistant';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cloud, Home, Menu, Camera, Heart, Eye, Zap, Users, FileText, User, Plane, Scale, Settings, Briefcase, Video, Target, Share2, Shield, Bell, Search, TrendingUp, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FadeIn } from '@/components/ui/animations';
import { ArrowLeft } from 'lucide-react';

// Back button component for modules
function BackButton() {
  return (
    <Link href="/">
      <motion.button
        whileHover={{ scale: 1.05, x: -2 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all duration-200"
        data-testid="button-back-to-hub"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Hub</span>
      </motion.button>
    </Link>
  );
}

// Role selector component
function RoleSelector(){
  const [role, setRole] = useState(localStorage.getItem('role')||'ops');
  useEffect(()=>{ localStorage.setItem('role', role); }, [role]);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-white/90">Active Role:</span>
      <select 
        className="border rounded-md px-2 py-1 text-sm bg-white text-gray-900" 
        value={role} 
        onChange={(e)=>setRole(e.target.value)}
        data-testid="role-selector"
      >
        <option value="ops">Ops</option>
        <option value="field">Field</option>
        <option value="admin">Admin</option>
      </select>
    </div>
  );
}

function Navigation() {
  const [location] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Navigation sections with grouping
  const navSections = [
    {
      title: "Monitoring",
      items: [
        { 
          href: "/weather-intelligence", 
          label: "Weather Intelligence", 
          icon: Cloud, 
          testId: "nav-weather-intelligence",
          badge: "AI+Live",
          badgeColor: "bg-gradient-to-r from-blue-500 to-purple-500"
        },
        { 
          href: "/surveillance", 
          label: "Surveillance Center", 
          icon: Eye, 
          testId: "nav-surveillance",
          badge: "Live",
          badgeColor: "bg-purple-500"
        }
      ]
    },
    {
      title: "Operations",
      items: [
        { 
          href: "/damage-detection", 
          label: "AI Damage Detection", 
          icon: Eye, 
          testId: "nav-damage-detection",
          badge: "New",
          badgeColor: "bg-emerald-500"
        },
        { 
          href: "/disaster-lens", 
          label: "Disaster Lens", 
          icon: Camera, 
          testId: "nav-disaster-lens",
          badge: "AI+Photo",
          badgeColor: "bg-gradient-to-r from-purple-500 to-pink-500"
        },
        { 
          href: "/leads", 
          label: "Leads", 
          icon: Target, 
          testId: "nav-leads",
          badge: "157",
          badgeColor: "bg-orange-500"
        }
      ]
    },
    {
      title: "People",
      items: [
        { 
          href: "/victim/login", 
          label: "Victim Portal", 
          icon: Heart, 
          testId: "nav-victim-portal",
          isVictimPortal: true
        },
        { 
          href: "/contractor-management", 
          label: "Contractors Management", 
          icon: Settings, 
          testId: "nav-contractor-management"
        },
        { 
          href: "/contractors", 
          label: "Contractors", 
          icon: Briefcase, 
          testId: "nav-contractor-portal",
          badge: "89",
          badgeColor: "bg-green-500"
        },
        { 
          href: "/customers", 
          label: "Customers", 
          icon: User, 
          testId: "nav-customers"
        }
      ]
    },
    {
      title: "Business",
      items: [
        { 
          href: "/claims", 
          label: "Claims Management", 
          icon: FileText, 
          testId: "nav-claims",
          badge: "1.2k",
          badgeColor: "bg-blue-500"
        },
        { 
          href: "/legal", 
          label: "Legal Compliance", 
          icon: Scale, 
          testId: "nav-legal",
          badge: "3",
          badgeColor: "bg-red-500"
        },
        { 
          href: "/stormshare", 
          label: "StormShare Community", 
          icon: Share2, 
          testId: "nav-stormshare",
          badge: "Hot",
          badgeColor: "bg-pink-500"
        }
      ]
    },
    {
      title: "Resources",
      items: [
        { 
          href: "/disaster-essentials-marketplace", 
          label: "Disaster Essentials Marketplace", 
          icon: ShoppingBag, 
          testId: "nav-dem",
          badge: "New",
          badgeColor: "bg-purple-500"
        }
      ]
    }
  ];

  const isActiveRoute = (href: string, isVictimPortal = false) => {
    if (isVictimPortal) {
      return location.startsWith('/victim');
    }
    return location === href;
  };

  return (
    <FadeIn>
      <nav className="storm-gradient-bg text-white shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <motion.div 
              className="flex items-center space-x-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"
                >
                  <Zap className="w-6 h-6 text-yellow-300" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">
                    DisasterDirect
                  </h1>
                  <p className="text-xs text-white/80 hidden sm:block">
                    Storm Operations Platform
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Navigation Items */}
            <div className="hidden lg:flex items-center space-x-1">
              {navSections.map((section, sectionIndex) => (
                <div key={section.title} className="flex items-center">
                  {sectionIndex > 0 && (
                    <div className="h-6 w-px bg-white/20 mx-2" />
                  )}
                  <div className="flex space-x-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = isActiveRoute(item.href, item.isVictimPortal);
                      
                      return (
                        <Link key={item.href} href={item.href}>
                          <motion.div
                            whileHover={{ 
                              scale: 1.05,
                              y: -2
                            }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                              nav-item relative px-3 py-2 rounded-lg text-sm font-medium
                              transition-all duration-300 cursor-pointer group
                              ${isActive 
                                ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm' 
                                : 'text-white/90 hover:bg-white/10 hover:text-white'
                              }
                            `}
                            data-testid={item.testId}
                          >
                            <div className="flex items-center space-x-2">
                              <Icon className={`w-4 h-4 ${isActive ? 'animate-storm-pulse' : ''}`} />
                              <span className="hidden xl:block">{item.label}</span>
                              {item.badge && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className={`
                                    px-1.5 py-0.5 text-xs font-bold text-white rounded-full
                                    ${item.badgeColor} ${item.badge === 'Live' ? 'animate-storm-pulse' : ''}
                                  `}
                                >
                                  {item.badge}
                                </motion.div>
                              )}
                            </div>
                            
                            {/* Active indicator */}
                            {isActive && (
                              <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-white/10 rounded-lg border border-white/30"
                                initial={false}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                              />
                            )}
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Role Selector */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2">
                <RoleSelector />
              </div>

              {/* Search */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                data-testid="button-search"
              >
                <Search className="w-5 h-5" />
              </motion.button>

              {/* Notifications */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  data-testid="button-notifications"
                >
                  <Bell className="w-5 h-5" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                  />
                </motion.button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    </div>
                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                      <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Storm Alert</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">High priority damage detected in Miami-Dade</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">2 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">New Leads</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">3 new contractor leads generated</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">5 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Weather Update</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Hurricane Alexandra forecast updated</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">15 minutes ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                      <button className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                        View All Notifications
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Status indicator */}
              <div className="hidden sm:flex items-center space-x-2">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-green-400 rounded-full"
                />
                <span className="text-xs text-white/80">All Systems Operational</span>
              </div>
            </div>
          </div>

          {/* Mobile menu - you can expand this later */}
          <div className="lg:hidden">
            {/* Mobile navigation can be added here if needed */}
          </div>
        </div>

        {/* Search overlay */}
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search across all DisasterDirect modules..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  autoFocus
                />
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Quick Actions</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">View Weather Alerts</li>
                    <li className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Check Storm Predictions</li>
                    <li className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Browse Contractor Leads</li>
                    <li className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Access Victim Portal</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Recent Searches</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Hurricane Alexandra</li>
                    <li className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Miami damage reports</li>
                    <li className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Roofing contractors</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Suggested</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Traffic camera alerts</li>
                    <li className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Drone operations status</li>
                    <li className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Insurance claims</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </nav>
    </FadeIn>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        {/* Set page title and meta tags */}
        <title>DisasterDirect - Storm Operations Platform</title>
        <meta name="description" content="Comprehensive storm operations and claims management platform for contractors and property restoration professionals" />
        
        <Navigation />
      
      <Switch>
        <Route path="/weather">
          <title>Weather Intelligence Center - DisasterDirect</title>
          <meta name="description" content="Live weather monitoring, alerts, radar data, and AI-powered storm predictions for emergency response operations" />
          <WeatherIntelligenceCenter />
        </Route>
        
        <Route path="/weather-intelligence">
          <title>Weather Intelligence Center - DisasterDirect</title>
          <meta name="description" content="Unified weather monitoring and AI-powered storm prediction for disaster response professionals" />
          <WeatherIntelligenceCenter />
        </Route>
        
        <Route path="/surveillance">
          <title>Surveillance Center - DisasterDirect</title>
          <meta name="description" content="Unified surveillance portal with live cameras, drone operations, traffic monitoring, and contractor opportunity detection across all states" />
          <SurveillanceCenter />
        </Route>
        
        <Route path="/damage-detection">
          <title>AI Damage Detection - DisasterDirect</title>
          <meta name="description" content="Real-time AI-powered damage detection system analyzing traffic camera feeds to identify storm damage and generate contractor leads automatically" />
          <DamageDetectionDashboard />
        </Route>
        
        <Route path="/prediction-dashboard">
          <title>Storm Prediction Dashboard - DisasterDirect</title>
          <meta name="description" content="AI-powered storm prediction and damage forecasting with comprehensive analytics and contractor opportunities" />
          <PredictionDashboard />
        </Route>
        
        <Route path="/contractors">
          <title>Contractor Portal - DisasterDirect</title>
          <meta name="description" content="Professional contractor portal with AI-powered tools, lead management, photo documentation, invoicing, insurance claims, and compliance tracking for storm restoration professionals" />
          <ContractorPortal />
        </Route>
        
        <Route path="/contractor-management">
          <title>Contractor Management - DisasterDirect</title>
          <meta name="description" content="Administrative oversight and management of contractor network, qualifications, assignments, and performance tracking for storm restoration projects" />
          <ContractorManagement />
        </Route>
        
        <Route path="/claims">
          <title>Claims Management - DisasterDirect</title>
          <meta name="description" content="Process insurance claims, track settlements, manage documentation and communicate with insurance carriers" />
          <Claims />
        </Route>
        
        <Route path="/disaster-lens">
          <title>Disaster Lens - DisasterDirect</title>
          <meta name="description" content="AI-powered disaster documentation and damage assessment with real-time photo/video analysis, automatic tagging, and professional reporting" />
          <DisasterLens />
        </Route>
        
        <Route path="/customers">
          <title>Customer Management - DisasterDirect</title>
          <meta name="description" content="Manage customer relationships, communications, service history and project tracking for property restoration services" />
          <Customers />
        </Route>
        
        <Route path="/homeowner-contacts">
          <title>Homeowner Contact Database - DisasterDirect</title>
          <meta name="description" content="Search and contact homeowners with property damage claims. Complete contact information, damage details, insurance companies, and claim numbers for efficient storm restoration outreach" />
          <HomeownerContacts />
        </Route>
        
        <Route path="/leads">
          <title>Damage Leads - DisasterDirect</title>
          <meta name="description" content="AI-powered damage detection leads from live footage with property owner information and contractor assignments" />
          <Leads />
        </Route>
        
        <Route path="/funnel-builder">
          <title>Funnel Builder - DisasterDirect</title>
          <meta name="description" content="Create high-converting lead capture funnels with drag-and-drop simplicity for storm damage restoration leads" />
          <FunnelBuilder />
        </Route>
        
        <Route path="/form-builder">
          <title>Form Builder - DisasterDirect</title>
          <meta name="description" content="Build intelligent forms with conditional logic and automated workflows for lead capture and qualification" />
          <FormBuilder />
        </Route>
        
        <Route path="/calendar-booking">
          <title>Calendar Booking - DisasterDirect</title>
          <meta name="description" content="Manage appointments, consultations, and property inspections with advanced calendar booking system" />
          <CalendarBooking />
        </Route>
        
        <Route path="/workflow-builder">
          <title>Workflow Builder - DisasterDirect</title>
          <meta name="description" content="Create automated sequences to nurture leads and streamline communication across multiple channels" />
          <WorkflowBuilder />
        </Route>
        
        <Route path="/stormshare">
          <title>StormShare Community - DisasterDirect</title>
          <meta name="description" content="Community platform for storm victims and contractors to share stories, request help, connect with local assistance, and access resources" />
          <StormShare />
        </Route>
        
        <Route path="/disaster-essentials-marketplace">
          <title>Disaster Essentials Marketplace - DisasterDirect</title>
          <meta name="description" content="Real-time disaster resource hub with hotels, gas stations, hardware supplies, shelters, critical alerts, and satellite communication vendors for contractors and victims" />
          <DisasterEssentialsMarketplace />
        </Route>
        
        <Route path="/modules/xray-reality">
          <title>X-RAY REALITY - DisasterDirect</title>
          <meta name="description" content="Augmented reality storm operations with live 3D storm views, AR measurement tools, traffic cameras, storm chaser feeds, drone integration, and time scrub replays" />
          <XRayRealityModule />
        </Route>
        
        <Route path="/eyes-in-sky">
          <title>Eyes in the Sky - DisasterDirect</title>
          <meta name="description" content="Aerial surveillance and reconnaissance with real-time satellite imagery and storm tracking capabilities" />
          <EyesInSky />
        </Route>
        
        <Route path="/legal">
          <title>Legal Compliance - DisasterDirect</title>
          <meta name="description" content="Manage legal compliance, contracts, liens, regulatory requirements and documentation for storm restoration business" />
          <Legal />
        </Route>
        
        {/* New Storm Ops Phase-Based Routes */}
        <Route path="/storm-predictions">
          <title>Storm Predictions - DisasterDirect</title>
          <meta name="description" content="AI storm modeling and risk mapping for advanced storm prediction" />
          <StormPredictions />
        </Route>
        
        <Route path="/traffic-cam-watcher">
          <title>Traffic Cam Watcher - DisasterDirect</title>
          <meta name="description" content="Road conditions and evacuation routes monitoring" />
          <TrafficCamWatcher />
        </Route>
        
        <Route path="/eyes-in-the-sky">
          <title>Eyes in the Sky - DisasterDirect</title>
          <meta name="description" content="Real-time storm chasing coverage and professional weather monitoring from across the United States" />
          <EyesInSky />
        </Route>
        
        <Route path="/eyes-globe">
          <title>3D Earth Globe - Eyes in the Sky - DisasterDirect</title>
          <meta name="description" content="Interactive 3D Earth globe with Google Photorealistic tiles for advanced storm tracking and satellite surveillance" />
          <EyesInTheSkyGlobe />
        </Route>
        
        <Route path="/drone-operation">
          <title>Drone Operation - DisasterDirect</title>
          <meta name="description" content="Real-time drone deployments with AI overlays for active storm operations" />
          <DroneOperation />
        </Route>
        
        {/* Storm Ops Dashboard Route */}
        <Route path="/storm-ops">
          <title>Storm Operations Dashboard - DisasterDirect</title>
          <meta name="description" content="Comprehensive storm operations workflow organized by operational phases for disaster response professionals" />
          <StormOpsDashboard />
        </Route>
        
        <Route path="/victim/login">
          <VictimLogin />
        </Route>
        
        <Route path="/victim/register">
          <VictimRegister />
        </Route>
        
        <Route path="/victim/dashboard">
          <VictimDashboard />
        </Route>
        
        <Route path="/victim/report-damage">
          <DamageReport />
        </Route>
        
        <Route path="/victim/request-help">
          <ServiceRequest />
        </Route>
        
        <Route path="/victim/my-requests">
          <MyRequests />
        </Route>
        
        <Route path="/">
          <title>DisasterDirect - Storm Operations Platform</title>
          <meta name="description" content="Comprehensive storm operations and claims management platform for contractors and property restoration professionals" />
          <StormOpsProHub />
        </Route>
        
        <Route>
          <div className="container mx-auto p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
            <Link href="/">
              <Button data-testid="button-home">Return to Dashboard</Button>
            </Link>
          </div>
        </Route>
      </Switch>
        
        {/* 🌍 FLOATING AI INTELLIGENCE PORTAL - Available on All Modules */}
        <FloatingAIAssistant />
      </div>
    </QueryClientProvider>
  );
}