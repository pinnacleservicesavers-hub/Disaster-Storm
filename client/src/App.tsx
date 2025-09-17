import { Route, Switch, Link, useLocation } from 'wouter';
import StormOpsProHub from "./StormOpsProHub";
import WeatherCenter from "./pages/WeatherCenter";
import { TrafficCameras } from "./pages/Cameras";
import VictimLogin from "./pages/VictimLogin";
import VictimRegister from "./pages/VictimRegister";
import VictimDashboard from "./pages/VictimDashboard";
import DamageReport from "./pages/DamageReport";
import ServiceRequest from "./pages/ServiceRequest";
import MyRequests from "./pages/MyRequests";
import { DamageDetectionDashboard } from "./components/DamageDetectionDashboard";
import PredictionDashboard from "./pages/PredictionDashboard";
import ContractorPortal from "./pages/ContractorPortal";
import ContractorManagement from "./pages/ContractorManagement";
import Claims from "./pages/Claims";
import Customers from "./pages/Customers";
import Drones from "./pages/Drones";
import Legal from "./pages/Legal";
import EyesInSky from "./pages/EyesInSky";
import Leads from "./pages/Leads";
import FunnelBuilder from "./pages/FunnelBuilder";
import FormBuilder from "./pages/FormBuilder";
import CalendarBooking from "./pages/CalendarBooking";
import WorkflowBuilder from "./pages/WorkflowBuilder";
import StormShareCam from "./pages/StormShareCam";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cloud, Home, Menu, Camera, Heart, Eye, Zap, Users, FileText, User, Plane, Scale, Settings, Briefcase, Video, Target, Share2, Shield, Bell, Search, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { FadeIn } from '@/components/ui/animations';

function Navigation() {
  const [location] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Navigation sections with grouping
  const navSections = [
    {
      title: "Monitoring",
      items: [
        { 
          href: "/weather", 
          label: "Weather Center", 
          icon: Cloud, 
          testId: "nav-weather",
          badge: "Live",
          badgeColor: "bg-green-500"
        },
        { 
          href: "/prediction-dashboard", 
          label: "Storm Predictions", 
          icon: Zap, 
          testId: "nav-prediction-dashboard",
          badge: "AI",
          badgeColor: "bg-blue-500"
        },
        { 
          href: "/traffic-cameras", 
          label: "Traffic Cam Watcher", 
          icon: Camera, 
          testId: "nav-traffic-cameras",
          badge: "247",
          badgeColor: "bg-yellow-500"
        },
        { 
          href: "/eyes-in-sky", 
          label: "Eyes in the Sky", 
          icon: Video, 
          testId: "nav-eyes-in-sky",
          badge: "8",
          badgeColor: "bg-red-500"
        }
      ]
    },
    {
      title: "Operations",
      items: [
        { 
          href: "/drones", 
          label: "Drone Operations", 
          icon: Plane, 
          testId: "nav-drones",
          badge: "24",
          badgeColor: "bg-blue-500"
        },
        { 
          href: "/damage-detection", 
          label: "AI Damage Detection", 
          icon: Eye, 
          testId: "nav-damage-detection",
          badge: "New",
          badgeColor: "bg-emerald-500"
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
          label: "StormShareCam", 
          icon: Share2, 
          testId: "nav-stormshare",
          badge: "Hot",
          badgeColor: "bg-pink-500"
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
                    StormLead Master
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
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-gray-200 p-4 z-50"
          >
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search storm operations, alerts, contractors..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  data-testid="input-search"
                />
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
    <div className="min-h-screen bg-gray-50">
      {/* Set page title and meta tags */}
      <title>StormLead Master - Storm Operations Platform</title>
      <meta name="description" content="Comprehensive storm operations and claims management platform for contractors and property restoration professionals" />
      
      <Navigation />
      
      <Switch>
        <Route path="/weather">
          <title>Weather Center - StormLead Master</title>
          <meta name="description" content="Live weather monitoring, alerts, radar data, and hurricane tracking for emergency storm response operations" />
          <WeatherCenter />
        </Route>
        
        <Route path="/traffic-cameras">
          <title>TrafficCamWatcher - StormLead Master</title>
          <meta name="description" content="Monitor live traffic cameras and incidents across multiple states with AI-powered damage detection and contractor opportunity identification" />
          <TrafficCameras />
        </Route>
        
        <Route path="/damage-detection">
          <title>AI Damage Detection - StormLead Master</title>
          <meta name="description" content="Real-time AI-powered damage detection system analyzing traffic camera feeds to identify storm damage and generate contractor leads automatically" />
          <DamageDetectionDashboard />
        </Route>
        
        <Route path="/prediction-dashboard">
          <title>Storm Predictions - StormLead Master</title>
          <meta name="description" content="AI-powered predictive storm damage analysis with 24-48 hour forecasts, contractor deployment recommendations, and real-time risk assessment using NOAA radar and historical FEMA data" />
          <PredictionDashboard />
        </Route>
        
        <Route path="/contractors">
          <title>Contractor Portal - StormLead Master</title>
          <meta name="description" content="Professional contractor portal with AI-powered tools, lead management, photo documentation, invoicing, insurance claims, and compliance tracking for storm restoration professionals" />
          <ContractorPortal />
        </Route>
        
        <Route path="/contractor-management">
          <title>Contractor Management - StormLead Master</title>
          <meta name="description" content="Administrative oversight and management of contractor network, qualifications, assignments, and performance tracking for storm restoration projects" />
          <ContractorManagement />
        </Route>
        
        <Route path="/claims">
          <title>Claims Management - StormLead Master</title>
          <meta name="description" content="Process insurance claims, track settlements, manage documentation and communicate with insurance carriers" />
          <Claims />
        </Route>
        
        <Route path="/customers">
          <title>Customer Management - StormLead Master</title>
          <meta name="description" content="Manage customer relationships, communications, service history and project tracking for property restoration services" />
          <Customers />
        </Route>
        
        <Route path="/drones">
          <title>Drone Operations - StormLead Master</title>
          <meta name="description" content="Manage drone fleet, aerial inspections, automated damage assessment and real-time monitoring for storm response" />
          <Drones />
        </Route>
        
        <Route path="/eyes-in-sky">
          <title>Eyes in the Sky - StormLead Master</title>
          <meta name="description" content="Watch live storm chasing footage and streaming feeds from professional storm chasers and weather services" />
          <EyesInSky />
        </Route>
        
        <Route path="/leads">
          <title>Damage Leads - StormLead Master</title>
          <meta name="description" content="AI-powered damage detection leads from live footage with property owner information and contractor assignments" />
          <Leads />
        </Route>
        
        <Route path="/funnel-builder">
          <title>Funnel Builder - StormLead Master</title>
          <meta name="description" content="Create high-converting lead capture funnels with drag-and-drop simplicity for storm damage restoration leads" />
          <FunnelBuilder />
        </Route>
        
        <Route path="/form-builder">
          <title>Form Builder - StormLead Master</title>
          <meta name="description" content="Build intelligent forms with conditional logic and automated workflows for lead capture and qualification" />
          <FormBuilder />
        </Route>
        
        <Route path="/calendar-booking">
          <title>Calendar Booking - StormLead Master</title>
          <meta name="description" content="Manage appointments, consultations, and property inspections with advanced calendar booking system" />
          <CalendarBooking />
        </Route>
        
        <Route path="/workflow-builder">
          <title>Workflow Builder - StormLead Master</title>
          <meta name="description" content="Create automated sequences to nurture leads and streamline communication across multiple channels" />
          <WorkflowBuilder />
        </Route>
        
        <Route path="/stormshare">
          <title>StormShareCam - StormLead Master</title>
          <meta name="description" content="Social platform for storm victims and contractors to share videos, photos, go live, and request help or donations" />
          <StormShareCam />
        </Route>
        
        <Route path="/legal">
          <title>Legal Compliance - StormLead Master</title>
          <meta name="description" content="Manage legal compliance, contracts, liens, regulatory requirements and documentation for storm restoration business" />
          <Legal />
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
    </div>
  );
}