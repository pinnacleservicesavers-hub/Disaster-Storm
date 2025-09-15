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
import { Button } from '@/components/ui/button';
import { Cloud, Home, Menu, Camera, Heart, Eye, Zap, Users, FileText, User, Plane, Scale, Settings, Briefcase } from 'lucide-react';

function Navigation() {
  const [location] = useLocation();
  
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-bold text-blue-900">
            StormLead Master
          </h1>
          
          <div className="flex space-x-4">
            <Link href="/">
              <Button 
                variant={location === '/' ? 'default' : 'ghost'} 
                size="sm"
                data-testid="nav-home"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            
            <Link href="/weather">
              <Button 
                variant={location === '/weather' ? 'default' : 'ghost'} 
                size="sm"
                data-testid="nav-weather"
              >
                <Cloud className="w-4 h-4 mr-2" />
                Weather Center
              </Button>
            </Link>
            
            <Link href="/traffic-cameras">
              <Button 
                variant={location === '/traffic-cameras' ? 'default' : 'ghost'} 
                size="sm"
                data-testid="nav-traffic-cameras"
              >
                <Camera className="w-4 h-4 mr-2" />
                TrafficCamWatcher
              </Button>
            </Link>
            
            <Link href="/damage-detection">
              <Button 
                variant={location === '/damage-detection' ? 'default' : 'ghost'} 
                size="sm"
                data-testid="nav-damage-detection"
              >
                <Eye className="w-4 h-4 mr-2" />
                AI Damage Detection
              </Button>
            </Link>
            
            <Link href="/prediction-dashboard">
              <Button 
                variant={location === '/prediction-dashboard' ? 'default' : 'ghost'} 
                size="sm"
                data-testid="nav-prediction-dashboard"
              >
                <Zap className="w-4 h-4 mr-2" />
                Storm Predictions
              </Button>
            </Link>
            
            <Link href="/contractors">
              <Button 
                variant={location === '/contractors' ? 'default' : 'ghost'} 
                size="sm"
                data-testid="nav-contractor-portal"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Contractor Portal
              </Button>
            </Link>
            
            <Link href="/contractor-management">
              <Button 
                variant={location === '/contractor-management' ? 'default' : 'ghost'} 
                size="sm"
                data-testid="nav-contractor-management"
              >
                <Settings className="w-4 h-4 mr-2" />
                Contractor Management
              </Button>
            </Link>
            
            <Link href="/claims">
              <Button 
                variant={location === '/claims' ? 'default' : 'ghost'} 
                size="sm"
                data-testid="nav-claims"
              >
                <FileText className="w-4 h-4 mr-2" />
                Claims
              </Button>
            </Link>
            
            <Link href="/customers">
              <Button 
                variant={location === '/customers' ? 'default' : 'ghost'} 
                size="sm"
                data-testid="nav-customers"
              >
                <User className="w-4 h-4 mr-2" />
                Customers
              </Button>
            </Link>
            
            <Link href="/drones">
              <Button 
                variant={location === '/drones' ? 'default' : 'ghost'} 
                size="sm"
                data-testid="nav-drones"
              >
                <Plane className="w-4 h-4 mr-2" />
                Drones
              </Button>
            </Link>
            
            <Link href="/legal">
              <Button 
                variant={location === '/legal' ? 'default' : 'ghost'} 
                size="sm"
                data-testid="nav-legal"
              >
                <Scale className="w-4 h-4 mr-2" />
                Legal
              </Button>
            </Link>
            
            <Link href="/victim/login">
              <Button 
                variant={location.startsWith('/victim') ? 'default' : 'ghost'} 
                size="sm"
                data-testid="nav-victim-portal"
              >
                <Heart className="w-4 h-4 mr-2" />
                Victim Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
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