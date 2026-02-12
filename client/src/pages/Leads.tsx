import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Target, MapPin, Phone, Mail, Users, Wrench, Home, Car, Trees, Zap, 
  AlertTriangle, Brain, Sparkles, Clock, CheckCircle, UserCheck, 
  Calendar, ArrowRight, TrendingUp, BarChart3, Maximize2, 
  PlayCircle, PauseCircle, MoreHorizontal, Plus, Filter, Search,
  Star, DollarSign, Camera, FileText, MessageSquare, UserPlus,
  Building2, Shield, Activity, Eye, ChevronRight, RefreshCw,
  Briefcase, Award, Timer, Globe, Navigation, Volume2, VolumeX,
  List, Download, UserX, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift, CountUp, ScaleIn, SlideIn } from '@/components/ui/animations';
import { apiRequest } from '@/lib/queryClient';
import { StateCitySelector, useStateCitySelector } from '@/components/StateCitySelector';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

interface Lead {
  id: string;
  type: string;
  address: string;
  ownerName: string;
  phone: string;
  email: string;
  damageDescription: string;
  coverageType: string;
  estimatedValue: number;
  priority: 'emergency' | 'urgent' | 'high' | 'medium' | 'low';
  contractorsNeeded: string[];
  aiConfidence: number;
  images: number;
  timestamp: string;
  status: 'new' | 'contacted' | 'qualified' | 'assigned' | 'in_progress' | 'completed';
  assignedTo?: string;
  lastContact?: string;
  notes: string;
  latitude: number;
  longitude: number;
  propertyValue: number;
  insuranceCompany: string;
  claimNumber?: string;
  weatherConditions: string;
  urgencyScore: number;
}

interface LeadStats {
  totalLeads: number;
  newToday: number;
  totalValue: number;
  averageResponse: number;
  conversionRate: number;
  activeAssignments: number;
}

interface ContractorAssignment {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  availability: 'available' | 'busy' | 'unavailable';
  distance: number;
  cost: number;
}

export default function Leads() {
  const { selectedState, setSelectedState, selectedCity, setSelectedCity, availableCities } = useStateCitySelector('Florida', 'Miami');
  const [activeTab, setActiveTab] = useState('board');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'map'>('kanban');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [bulkAssignContractor, setBulkAssignContractor] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedWelcome = useRef(false);
  const voiceEnabledRef = useRef(true);

  const queryClient = useQueryClient();

  const voiceMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/closebot/chat", {
        message,
        history: [],
        context: { leadName: "contractor", companyName: "your company", trade: "lead_management" },
        enableVoice: true
      });
      return res;
    },
    onSuccess: (data: any) => {
      if (data.audioUrl && audioRef.current) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
        audioRef.current.onended = () => setIsPlaying(false);
      }
    },
  });

  useEffect(() => {
    if (!hasPlayedWelcome.current && voiceEnabledRef.current) {
      hasPlayedWelcome.current = true;
      voiceMutation.mutate("Welcome to Lead Management System! This comprehensive CRM platform manages all contractor leads from initial contact through project completion.");
    }
  }, []);

  const toggleVoice = () => {
    const newState = !isVoiceEnabled;
    setIsVoiceEnabled(newState);
    voiceEnabledRef.current = newState;
    if (!newState && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const playRachelVoice = (prompt: string) => {
    if (voiceEnabledRef.current) {
      voiceMutation.mutate(prompt);
    }
  };

  const allMockLeads: Lead[] = [
    {
      id: 'L001', type: 'hurricane_damage', address: '2847 Bayshore Drive, Tampa, FL 33602',
      ownerName: 'Sarah Johnson', phone: '(813) 555-0123', email: 'sarah.johnson@email.com',
      damageDescription: 'Extensive roof damage from Hurricane winds, missing shingles, water damage to attic',
      coverageType: 'Homeowners - Full Coverage', estimatedValue: 45000, priority: 'urgent',
      contractorsNeeded: ['Roofing', 'Water Damage', 'General Contractor'], aiConfidence: 94, images: 8,
      timestamp: '2024-01-15 14:30:00', status: 'new',
      notes: 'Property owner reports active leaks, needs immediate attention',
      latitude: 27.9506, longitude: -82.4572, propertyValue: 485000,
      insuranceCompany: 'State Farm', weatherConditions: 'Clear, winds 15mph', urgencyScore: 92
    },
    {
      id: 'L002', type: 'tree_damage', address: '1456 Pine Ridge Circle, Orlando, FL 32801',
      ownerName: 'Michael Chen', phone: '(407) 555-0456', email: 'mike.chen@email.com',
      damageDescription: 'Large oak tree fell across property, damaged roof and blocked driveway',
      coverageType: 'Homeowners - Standard', estimatedValue: 28500, priority: 'high',
      contractorsNeeded: ['Tree Services', 'Roofing', 'Cleanup Crew'], aiConfidence: 89, images: 5,
      timestamp: '2024-01-15 13:45:00', status: 'contacted', assignedTo: 'Rodriguez Tree Service',
      lastContact: '2024-01-15 15:20:00', notes: 'Tree removal scheduled for tomorrow morning',
      latitude: 28.5383, longitude: -81.3792, propertyValue: 320000,
      insuranceCompany: 'Allstate', claimNumber: 'AS-2024-001847', weatherConditions: 'Partly cloudy', urgencyScore: 78
    },
    {
      id: 'L003', type: 'flood_damage', address: '892 Coastal Highway, Jacksonville, FL 32205',
      ownerName: 'Emma Rodriguez', phone: '(904) 555-0789', email: 'emma.rodriguez@email.com',
      damageDescription: 'Storm surge flooding, 2 feet of water in first floor, damaged flooring and drywall',
      coverageType: 'Flood Insurance + Homeowners', estimatedValue: 67000, priority: 'emergency',
      contractorsNeeded: ['Water Damage', 'Flooring', 'Drywall', 'Mold Remediation'], aiConfidence: 97, images: 12,
      timestamp: '2024-01-15 15:15:00', status: 'qualified', assignedTo: 'FloodPro Restoration',
      lastContact: '2024-01-15 16:45:00', notes: 'Emergency extraction completed, dehumidifiers running',
      latitude: 30.3322, longitude: -81.6557, propertyValue: 275000,
      insuranceCompany: 'FEMA + USAA', claimNumber: 'FEMA-FL-2024-0892', weatherConditions: 'Heavy rain expected', urgencyScore: 95
    },
    {
      id: 'L004', type: 'wind_damage', address: '3421 Sunset Boulevard, Miami, FL 33139',
      ownerName: 'James Wilson', phone: '(305) 555-0321', email: 'james.wilson@email.com',
      damageDescription: 'High winds damaged siding, windows broken, fence destroyed',
      coverageType: 'Condo Association + Personal', estimatedValue: 32000, priority: 'medium',
      contractorsNeeded: ['Siding', 'Windows', 'Fencing'], aiConfidence: 85, images: 6,
      timestamp: '2024-01-15 12:20:00', status: 'assigned', assignedTo: 'Miami Storm Repairs',
      lastContact: '2024-01-15 14:15:00', notes: 'Contractor scheduled site visit for Monday',
      latitude: 25.7617, longitude: -80.1918, propertyValue: 425000,
      insuranceCompany: 'Progressive', claimNumber: 'PG-2024-003421', weatherConditions: 'Sunny, 78°F', urgencyScore: 65
    },
    {
      id: 'L005', type: 'hail_damage', address: '567 Country Club Drive, Fort Myers, FL 33919',
      ownerName: 'Lisa Thompson', phone: '(239) 555-0654', email: 'lisa.t@email.com',
      damageDescription: 'Golf ball sized hail damaged roof, gutters, and outdoor equipment',
      coverageType: 'Homeowners - Premium', estimatedValue: 22000, priority: 'medium',
      contractorsNeeded: ['Roofing', 'Gutters', 'HVAC'], aiConfidence: 91, images: 4,
      timestamp: '2024-01-15 11:30:00', status: 'in_progress', assignedTo: 'Gulf Coast Roofing',
      lastContact: '2024-01-15 16:00:00', notes: 'Insurance adjuster approved claim, work starting next week',
      latitude: 26.6406, longitude: -81.8723, propertyValue: 380000,
      insuranceCompany: 'Travelers', claimNumber: 'TR-2024-000567', weatherConditions: 'Clear skies', urgencyScore: 55
    },
    {
      id: 'L006', type: 'storm_surge', address: '1234 Ocean View Lane, Key Largo, FL 33037',
      ownerName: 'Roberto Martinez', phone: '(305) 555-0987', email: 'roberto.martinez@email.com',
      damageDescription: 'Storm surge damaged foundation, flooding in crawl space, salt water corrosion',
      coverageType: 'Flood Insurance', estimatedValue: 89000, priority: 'urgent',
      contractorsNeeded: ['Foundation', 'Waterproofing', 'Structural'], aiConfidence: 93, images: 10,
      timestamp: '2024-01-15 16:45:00', status: 'completed', assignedTo: 'Keys Foundation Experts',
      lastContact: '2024-01-15 17:30:00', notes: 'Project completed successfully, final inspection passed',
      latitude: 25.0865, longitude: -80.4473, propertyValue: 650000,
      insuranceCompany: 'FEMA', claimNumber: 'FEMA-FL-2024-1234', weatherConditions: 'Tropical storm warning', urgencyScore: 88
    },
    {
      id: 'L007', type: 'hurricane_damage', address: '4567 Magnolia Street, Naples, FL 34102',
      ownerName: 'William Smith', phone: '(239) 555-0147', email: 'william.smith@email.com',
      damageDescription: 'Hurricane winds caused significant roof damage, tree fell on garage, power lines down',
      coverageType: 'Homeowners - Comprehensive', estimatedValue: 52000, priority: 'high',
      contractorsNeeded: ['Roofing', 'Tree Services', 'Electrical', 'Structural'], aiConfidence: 96, images: 14,
      timestamp: '2024-01-15 17:30:00', status: 'new',
      notes: 'High priority - multiple damage types, safety hazards present',
      latitude: 26.1420, longitude: -81.7948, propertyValue: 725000,
      insuranceCompany: 'Citizens Property Insurance', weatherConditions: 'Storm conditions, high winds', urgencyScore: 87
    },
    {
      id: 'L008', type: 'hurricane_damage', address: '1520 Lakeshore Drive, Lake Charles, LA 70601',
      ownerName: 'Denise Thibodaux', phone: '(337) 555-0198', email: 'denise.t@email.com',
      damageDescription: 'Hurricane Laura remnants caused major roof loss, siding torn off, carport collapsed',
      coverageType: 'Homeowners - Full Coverage', estimatedValue: 78000, priority: 'emergency',
      contractorsNeeded: ['Roofing', 'Siding', 'Structural', 'General Contractor'], aiConfidence: 96, images: 15,
      timestamp: '2024-01-16 08:30:00', status: 'new',
      notes: 'Entire rear section of roof missing, interior exposed to elements, emergency tarp needed',
      latitude: 30.2132, longitude: -93.2083, propertyValue: 195000,
      insuranceCompany: 'Louisiana Citizens', weatherConditions: 'Overcast, 62°F, rain expected', urgencyScore: 97
    },
    {
      id: 'L009', type: 'flood_damage', address: '408 Ryan Street, Lake Charles, LA 70601',
      ownerName: 'Marcus Broussard', phone: '(337) 555-0245', email: 'marcus.b@email.com',
      damageDescription: 'Flash flooding from heavy rains, 18 inches of water in home, all flooring destroyed',
      coverageType: 'Flood Insurance + Homeowners', estimatedValue: 54000, priority: 'urgent',
      contractorsNeeded: ['Water Damage', 'Flooring', 'Drywall', 'Mold Remediation'], aiConfidence: 93, images: 9,
      timestamp: '2024-01-16 09:15:00', status: 'contacted',
      lastContact: '2024-01-16 10:00:00', notes: 'Homeowner evacuated, water extraction in progress',
      latitude: 30.2266, longitude: -93.2174, propertyValue: 165000,
      insuranceCompany: 'FEMA + State Farm', claimNumber: 'FEMA-LA-2024-0408', weatherConditions: 'Heavy rain continuing', urgencyScore: 91
    },
    {
      id: 'L010', type: 'tree_damage', address: '2200 Common Street, Lake Charles, LA 70601',
      ownerName: 'Patricia Fontenot', phone: '(337) 555-0312', email: 'pat.fontenot@email.com',
      damageDescription: 'Large pine tree crashed through garage roof, vehicle trapped, power lines tangled',
      coverageType: 'Homeowners - Standard', estimatedValue: 35000, priority: 'high',
      contractorsNeeded: ['Tree Services', 'Roofing', 'Electrical', 'Auto Recovery'], aiConfidence: 91, images: 7,
      timestamp: '2024-01-16 07:45:00', status: 'qualified', assignedTo: 'Bayou Tree Specialists',
      lastContact: '2024-01-16 11:30:00', notes: 'Utility company notified, power lines need clearance before tree removal',
      latitude: 30.2241, longitude: -93.2127, propertyValue: 210000,
      insuranceCompany: 'Allstate', claimNumber: 'AS-2024-002200', weatherConditions: 'Wind gusts 35mph', urgencyScore: 84
    },
    {
      id: 'L011', type: 'wind_damage', address: '3015 Country Club Road, Lake Charles, LA 70605',
      ownerName: 'Thomas Guidry', phone: '(337) 555-0478', email: 'tom.guidry@email.com',
      damageDescription: 'Wind damage to commercial building, partial roof separation, signage destroyed',
      coverageType: 'Commercial Property', estimatedValue: 120000, priority: 'urgent',
      contractorsNeeded: ['Commercial Roofing', 'Structural', 'Signage', 'General Contractor'], aiConfidence: 88, images: 11,
      timestamp: '2024-01-16 10:00:00', status: 'assigned', assignedTo: 'Gulf South Construction',
      lastContact: '2024-01-16 12:30:00', notes: 'Business closed until repairs complete, temporary roof covering installed',
      latitude: 30.1735, longitude: -93.2392, propertyValue: 850000,
      insuranceCompany: 'Hartford', claimNumber: 'HF-2024-003015', weatherConditions: 'Clearing, winds subsiding', urgencyScore: 86
    },
    {
      id: 'L012', type: 'hurricane_damage', address: '780 Broad Street, New Orleans, LA 70119',
      ownerName: 'Angela LeBlanc', phone: '(504) 555-0167', email: 'angela.lb@email.com',
      damageDescription: 'Roof shingles stripped, water intrusion in 3 rooms, ceiling collapse in kitchen',
      coverageType: 'Homeowners - Full Coverage', estimatedValue: 62000, priority: 'high',
      contractorsNeeded: ['Roofing', 'Water Damage', 'Drywall', 'Painting'], aiConfidence: 94, images: 10,
      timestamp: '2024-01-16 11:00:00', status: 'new',
      notes: 'Tarping completed by neighbor, insurance adjuster visit scheduled',
      latitude: 29.9711, longitude: -90.0942, propertyValue: 310000,
      insuranceCompany: 'USAA', weatherConditions: 'Partly cloudy, humid', urgencyScore: 79
    },
    {
      id: 'L013', type: 'flood_damage', address: '1445 Magazine Street, New Orleans, LA 70130',
      ownerName: 'Charles Dupree', phone: '(504) 555-0289', email: 'c.dupree@email.com',
      damageDescription: 'Street flooding entered first floor, hardwood floors buckled, appliances damaged',
      coverageType: 'Flood Insurance + Homeowners', estimatedValue: 48000, priority: 'urgent',
      contractorsNeeded: ['Water Damage', 'Flooring', 'Appliance', 'Mold Remediation'], aiConfidence: 90, images: 8,
      timestamp: '2024-01-16 12:30:00', status: 'in_progress', assignedTo: 'NOLA Flood Recovery',
      lastContact: '2024-01-16 14:00:00', notes: 'Dehumidification underway, mold testing scheduled',
      latitude: 29.9391, longitude: -90.0812, propertyValue: 425000,
      insuranceCompany: 'FEMA + Liberty Mutual', claimNumber: 'FEMA-LA-2024-1445', weatherConditions: 'Humid, 75°F', urgencyScore: 82
    },
    {
      id: 'L014', type: 'wind_damage', address: '2890 Airline Highway, Baton Rouge, LA 70805',
      ownerName: 'Derek Washington', phone: '(225) 555-0356', email: 'd.washington@email.com',
      damageDescription: 'Strong winds ripped off metal roofing panels on warehouse, inventory exposed',
      coverageType: 'Commercial Property', estimatedValue: 95000, priority: 'emergency',
      contractorsNeeded: ['Commercial Roofing', 'Metal Work', 'General Contractor'], aiConfidence: 92, images: 13,
      timestamp: '2024-01-16 06:00:00', status: 'new',
      notes: 'Warehouse contents at risk, emergency covering needed immediately',
      latitude: 30.4515, longitude: -91.1871, propertyValue: 1200000,
      insuranceCompany: 'Zurich Commercial', weatherConditions: 'Wind advisory active', urgencyScore: 96
    },
    {
      id: 'L015', type: 'tree_damage', address: '567 Johnston Street, Lafayette, LA 70501',
      ownerName: 'Marie Comeaux', phone: '(337) 555-0534', email: 'marie.c@email.com',
      damageDescription: 'Two large oaks uprooted in backyard, one leaning on neighbor fence, root damage to patio',
      coverageType: 'Homeowners - Standard', estimatedValue: 18000, priority: 'medium',
      contractorsNeeded: ['Tree Services', 'Fencing', 'Landscaping'], aiConfidence: 87, images: 6,
      timestamp: '2024-01-16 13:15:00', status: 'contacted',
      lastContact: '2024-01-16 14:30:00', notes: 'No structural damage to home, neighbor aware of fence situation',
      latitude: 30.2241, longitude: -92.0198, propertyValue: 225000,
      insuranceCompany: 'Progressive', weatherConditions: 'Clearing skies', urgencyScore: 52
    },
    {
      id: 'L016', type: 'hurricane_damage', address: '1100 Broad Street, Shreveport, LA 71101',
      ownerName: 'Kevin Boudreaux', phone: '(318) 555-0621', email: 'kevin.b@email.com',
      damageDescription: 'Storm damage to older home, porch roof collapsed, siding damage, window leaks',
      coverageType: 'Homeowners - Basic', estimatedValue: 41000, priority: 'high',
      contractorsNeeded: ['Roofing', 'Siding', 'Windows', 'Porch Repair'], aiConfidence: 85, images: 9,
      timestamp: '2024-01-16 14:00:00', status: 'new',
      notes: 'Historic district - may need special permits for restoration',
      latitude: 32.5252, longitude: -93.7502, propertyValue: 175000,
      insuranceCompany: 'Nationwide', weatherConditions: 'Cool, 55°F, clear', urgencyScore: 73
    },
    {
      id: 'L017', type: 'hurricane_damage', address: '450 Peachtree Street NE, Atlanta, GA 30308',
      ownerName: 'Jennifer Hayes', phone: '(404) 555-0198', email: 'j.hayes@email.com',
      damageDescription: 'Tropical storm remnants caused roof damage, fallen trees blocked driveway',
      coverageType: 'Homeowners - Full Coverage', estimatedValue: 38000, priority: 'high',
      contractorsNeeded: ['Roofing', 'Tree Services', 'Cleanup Crew'], aiConfidence: 88, images: 7,
      timestamp: '2024-01-16 09:00:00', status: 'new',
      notes: 'Multiple trees down in neighborhood, widespread damage reported',
      latitude: 33.7700, longitude: -84.3855, propertyValue: 520000,
      insuranceCompany: 'State Farm', weatherConditions: 'Overcast, 58°F', urgencyScore: 76
    },
    {
      id: 'L018', type: 'tree_damage', address: '1200 Main Street, Columbia, SC 29201',
      ownerName: 'David Richardson', phone: '(803) 555-0432', email: 'd.richardson@email.com',
      damageDescription: 'Ice storm brought down multiple large branches, power lines tangled, roof punctured',
      coverageType: 'Homeowners - Premium', estimatedValue: 29000, priority: 'urgent',
      contractorsNeeded: ['Tree Services', 'Roofing', 'Electrical'], aiConfidence: 91, images: 8,
      timestamp: '2024-01-16 07:30:00', status: 'contacted',
      lastContact: '2024-01-16 09:00:00', notes: 'Power company dispatched, tree crew on standby',
      latitude: 34.0007, longitude: -81.0348, propertyValue: 285000,
      insuranceCompany: 'Erie Insurance', weatherConditions: 'Ice advisory, 32°F', urgencyScore: 85
    },
    {
      id: 'L019', type: 'wind_damage', address: '789 Broadway, Nashville, TN 37203',
      ownerName: 'Rachel Turner', phone: '(615) 555-0567', email: 'rachel.t@email.com',
      damageDescription: 'Tornado-strength winds damaged commercial storefront, awning destroyed, glass shattered',
      coverageType: 'Commercial Property', estimatedValue: 72000, priority: 'emergency',
      contractorsNeeded: ['Commercial Glass', 'Structural', 'General Contractor'], aiConfidence: 95, images: 11,
      timestamp: '2024-01-16 05:45:00', status: 'qualified',
      assignedTo: 'Music City Restoration', lastContact: '2024-01-16 08:00:00',
      notes: 'Business district, multiple storefronts affected, coordinating with city',
      latitude: 36.1627, longitude: -86.7816, propertyValue: 950000,
      insuranceCompany: 'Hartford', claimNumber: 'HF-2024-000789', weatherConditions: 'Severe storm warning', urgencyScore: 94
    },
    {
      id: 'L020', type: 'hail_damage', address: '2345 Mockingbird Lane, Dallas, TX 75205',
      ownerName: 'Brandon Clark', phone: '(214) 555-0789', email: 'b.clark@email.com',
      damageDescription: 'Severe hailstorm damaged entire roof, 3 skylights broken, gutters crushed, vehicle dented',
      coverageType: 'Homeowners - Comprehensive', estimatedValue: 55000, priority: 'high',
      contractorsNeeded: ['Roofing', 'Skylights', 'Gutters', 'Auto Body'], aiConfidence: 93, images: 16,
      timestamp: '2024-01-16 15:00:00', status: 'new',
      notes: 'Neighborhood-wide hail event, multiple claims expected',
      latitude: 32.8328, longitude: -96.7984, propertyValue: 680000,
      insuranceCompany: 'GEICO', weatherConditions: 'Post-storm, clear', urgencyScore: 77
    },
    {
      id: 'L021', type: 'flood_damage', address: '1500 Memorial Drive, Houston, TX 77007',
      ownerName: 'Maria Santos', phone: '(713) 555-0345', email: 'm.santos@email.com',
      damageDescription: 'Bayou overflow flooded ground floor, 3 feet of standing water, complete loss of furnishings',
      coverageType: 'Flood Insurance + Homeowners', estimatedValue: 110000, priority: 'emergency',
      contractorsNeeded: ['Water Damage', 'Flooring', 'Drywall', 'HVAC', 'Mold Remediation'], aiConfidence: 98, images: 20,
      timestamp: '2024-01-16 04:00:00', status: 'in_progress', assignedTo: 'Texas Flood Masters',
      lastContact: '2024-01-16 10:00:00', notes: 'Major flooding event, FEMA disaster declaration pending',
      latitude: 29.7604, longitude: -95.3698, propertyValue: 450000,
      insuranceCompany: 'FEMA + Travelers', claimNumber: 'FEMA-TX-2024-1500', weatherConditions: 'Flash flood warning', urgencyScore: 99
    },
    {
      id: 'L022', type: 'hurricane_damage', address: '321 Meeting Street, Charleston, SC 29401',
      ownerName: 'William Barrett', phone: '(843) 555-0234', email: 'w.barrett@email.com',
      damageDescription: 'Hurricane winds caused porch collapse, shutter damage, flooding in basement',
      coverageType: 'Homeowners - Historic Property', estimatedValue: 85000, priority: 'urgent',
      contractorsNeeded: ['Historic Restoration', 'Roofing', 'Foundation', 'Water Damage'], aiConfidence: 90, images: 12,
      timestamp: '2024-01-16 08:00:00', status: 'assigned', assignedTo: 'Lowcountry Restoration',
      lastContact: '2024-01-16 11:00:00', notes: 'Historic district - preservation requirements apply',
      latitude: 32.7765, longitude: -79.9311, propertyValue: 890000,
      insuranceCompany: 'Chubb', claimNumber: 'CH-2024-000321', weatherConditions: 'Post-hurricane, clearing', urgencyScore: 83
    },
    {
      id: 'L023', type: 'wind_damage', address: '1876 Dexter Avenue, Montgomery, AL 36104',
      ownerName: 'Shirley Coleman', phone: '(334) 555-0456', email: 's.coleman@email.com',
      damageDescription: 'Severe thunderstorm winds removed sections of roof, debris scattered across property',
      coverageType: 'Homeowners - Standard', estimatedValue: 33000, priority: 'high',
      contractorsNeeded: ['Roofing', 'Cleanup Crew', 'Fencing'], aiConfidence: 86, images: 8,
      timestamp: '2024-01-16 11:30:00', status: 'new',
      notes: 'Debris cleanup needed before roof assessment can begin',
      latitude: 32.3792, longitude: -86.3077, propertyValue: 195000,
      insuranceCompany: 'Alfa Insurance', weatherConditions: 'Severe weather watch', urgencyScore: 74
    },
    {
      id: 'L024', type: 'tree_damage', address: '555 Hillsborough Street, Raleigh, NC 27603',
      ownerName: 'Gregory Foster', phone: '(919) 555-0678', email: 'g.foster@email.com',
      damageDescription: 'Pine tree fell on detached garage during ice storm, crushing structure and vehicle inside',
      coverageType: 'Homeowners + Auto', estimatedValue: 47000, priority: 'high',
      contractorsNeeded: ['Tree Services', 'Structural', 'Auto Recovery', 'Demolition'], aiConfidence: 92, images: 9,
      timestamp: '2024-01-16 06:30:00', status: 'contacted',
      lastContact: '2024-01-16 08:30:00', notes: 'Garage is total loss, planning demolition and rebuild',
      latitude: 35.7796, longitude: -78.6382, propertyValue: 340000,
      insuranceCompany: 'Nationwide', claimNumber: 'NW-2024-000555', weatherConditions: 'Ice storm, 28°F', urgencyScore: 80
    }
  ];

  const getStateFromAddress = (address: string): string => {
    const stateMap: Record<string, string> = {
      ', FL ': 'Florida', ', LA ': 'Louisiana', ', GA ': 'Georgia', ', SC ': 'South Carolina',
      ', NC ': 'North Carolina', ', TN ': 'Tennessee', ', AL ': 'Alabama', ', TX ': 'Texas',
      ', MS ': 'Mississippi', ', AR ': 'Arkansas', ', OK ': 'Oklahoma',
    };
    for (const [abbr, name] of Object.entries(stateMap)) {
      if (address.includes(abbr)) return name;
    }
    return '';
  };

  const getCityFromAddress = (address: string): string => {
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim();
    }
    return '';
  };

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['leads', filterStatus, filterPriority, searchQuery, selectedState, selectedCity],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));

      let filteredLeads = allMockLeads;

      if (selectedState) {
        filteredLeads = filteredLeads.filter(lead => getStateFromAddress(lead.address) === selectedState);
      }

      if (selectedCity) {
        filteredLeads = filteredLeads.filter(lead => getCityFromAddress(lead.address).toLowerCase() === selectedCity.toLowerCase());
      }

      if (searchQuery) {
        filteredLeads = filteredLeads.filter(lead => 
          lead.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.damageDescription.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (filterStatus !== 'all') {
        filteredLeads = filteredLeads.filter(lead => lead.status === filterStatus);
      }

      if (filterPriority !== 'all') {
        filteredLeads = filteredLeads.filter(lead => lead.priority === filterPriority);
      }

      return filteredLeads;
    },
    refetchInterval: autoRefresh ? 15000 : false,
  });

  // Mock lead statistics
  const { data: leadStats } = useQuery<LeadStats>({
    queryKey: ['lead-stats'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        totalLeads: leads.length,
        newToday: leads.filter(l => l.status === 'new').length,
        totalValue: leads.reduce((sum, lead) => sum + lead.estimatedValue, 0),
        averageResponse: 127, // minutes
        conversionRate: 78.5, // percentage
        activeAssignments: leads.filter(l => l.assignedTo).length
      };
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Kanban columns configuration
  const kanbanColumns = [
    { 
      id: 'new', 
      title: 'New Leads', 
      icon: Plus, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    { 
      id: 'contacted', 
      title: 'Contacted', 
      icon: Phone, 
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800'
    },
    { 
      id: 'qualified', 
      title: 'Qualified', 
      icon: CheckCircle, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800'
    },
    { 
      id: 'assigned', 
      title: 'Assigned', 
      icon: UserCheck, 
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800'
    },
    { 
      id: 'in_progress', 
      title: 'In Progress', 
      icon: PlayCircle, 
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-800'
    },
    { 
      id: 'completed', 
      title: 'Completed', 
      icon: Award, 
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'emergency': return 'bg-red-600 text-white border-red-600';
      case 'urgent': return 'bg-orange-500 text-white border-orange-500';
      case 'high': return 'bg-yellow-500 text-black border-yellow-500';
      case 'medium': return 'bg-blue-500 text-white border-blue-500';
      default: return 'bg-green-500 text-white border-green-500';
    }
  };

  const getDamageIcon = (type: string) => {
    switch(type) {
      case 'hurricane_damage': return <Zap className="w-4 h-4" />;
      case 'tree_damage': return <Trees className="w-4 h-4" />;
      case 'flood_damage': return <Activity className="w-4 h-4" />;
      case 'wind_damage': return <Navigation className="w-4 h-4" />;
      case 'hail_damage': return <Globe className="w-4 h-4" />;
      case 'storm_surge': return <Activity className="w-4 h-4" />;
      default: return <Home className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'new': return <Plus className="w-4 h-4" />;
      case 'contacted': return <Phone className="w-4 h-4" />;
      case 'qualified': return <CheckCircle className="w-4 h-4" />;
      case 'assigned': return <UserCheck className="w-4 h-4" />;
      case 'in_progress': return <PlayCircle className="w-4 h-4" />;
      case 'completed': return <Award className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedLead) {
      console.log(`Moving lead ${draggedLead} to ${newStatus}`);
      // In real app, would update via API
      setDraggedLead(null);
    }
  };

  const handleAssignContractor = (leadId: string) => {
    console.log(`Assigning contractor to lead ${leadId}`);
    setAssignmentModal(true);
  };

  const handleBulkAssign = () => {
    if (selectedLeads.length === 0 || !bulkAssignContractor) {
      alert('Please select leads and a contractor');
      return;
    }
    console.log(`Bulk assigning ${selectedLeads.length} leads to ${bulkAssignContractor}`);
    // In real implementation, would make API call to assign contractors
    setSelectedLeads([]);
    setBulkAssignContractor('');
    setAssignmentModal(false);
    alert(`Successfully assigned ${selectedLeads.length} leads to ${bulkAssignContractor}`);
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(lead => lead.id));
    }
  };

  const handleExportLeads = () => {
    const csvHeaders = [
      'ID', 'Owner Name', 'Phone', 'Email', 'Address', 'Damage Type', 
      'Estimated Value', 'Priority', 'Status', 'AI Confidence', 'Insurance Company',
      'Claim Number', 'Contractors Needed', 'Notes'
    ];
    
    const csvData = leads.map(lead => [
      lead.id,
      lead.ownerName,
      lead.phone,
      lead.email,
      lead.address,
      lead.type.replace(/_/g, ' '),
      lead.estimatedValue,
      lead.priority,
      lead.status,
      lead.aiConfidence,
      lead.insuranceCompany || '',
      lead.claimNumber || '',
      lead.contractorsNeeded.join('; '),
      lead.notes
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalValue = leads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
  const urgentCount = leads.filter(l => ['emergency', 'urgent'].includes(l.priority)).length;
  const avgConfidence = Math.round(leads.reduce((sum, lead) => sum + lead.aiConfidence, 0) / leads.length) || 0;

  return (
    <div className="space-y-6" data-testid="leads-page">
      <audio ref={audioRef} className="hidden" />
      {/* Enhanced Header Section */}
      <FadeIn>
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-900 dark:from-indigo-800 dark:via-purple-800 dark:to-blue-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  x: [0, Math.random() * 40 - 20],
                  y: [0, Math.random() * 40 - 20]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
              />
            ))}
          </div>

          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/">
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
              <StateCitySelector
                selectedState={selectedState}
                selectedCity={selectedCity}
                availableCities={availableCities}
                onStateChange={setSelectedState}
                onCityChange={setSelectedCity}
                variant="default"
                showAllStates={true}
              />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <ScaleIn>
                  <div className="relative">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <Target className="h-8 w-8 text-purple-400" />
                    </div>
                    <motion.div
                      className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Brain className="h-2 w-2 text-white" />
                    </motion.div>
                  </div>
                </ScaleIn>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    AI Lead Intelligence Center
                  </h1>
                  <p className="text-purple-200">
                    Advanced damage detection and lead management with automated contractor matching
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant={autoRefresh ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  data-testid="button-auto-refresh"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                  Live Feed
                </Button>
                <Button
                  variant="default"
                  onClick={() => setAssignmentModal(true)}
                  data-testid="button-bulk-assign"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Bulk Assign
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleExportLeads}
                  data-testid="button-export-leads"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleVoice}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  data-testid="button-voice-guide"
                  aria-label="Voice guide for Lead Management"
                >
                  {isPlaying ? (
                    <>
                      <Volume2 className="h-4 w-4 animate-pulse" />
                      Playing
                    </>
                  ) : isVoiceEnabled ? (
                    <>
                      <Volume2 className="h-4 w-4" />
                      Voice Guide
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-4 w-4" />
                      Voice Off
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Target className="h-5 w-5 text-purple-400 mr-2" />
                        <span className="text-sm font-medium text-white">Active Leads</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-active-leads">
                        <CountUp end={leads.length} duration={1} />
                      </div>
                      <div className="text-xs text-purple-200">{leads.filter(l => l.status === 'new').length} new today</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <DollarSign className="h-5 w-5 text-green-400 mr-2" />
                        <span className="text-sm font-medium text-white">Total Value</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-total-value">
                        $<CountUp end={Math.floor(totalValue / 1000)} duration={1} />K
                      </div>
                      <div className="text-xs text-purple-200">potential revenue</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-sm font-medium text-white">Urgent Cases</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-urgent-cases">
                        <CountUp end={urgentCount} duration={1} />
                      </div>
                      <div className="text-xs text-purple-200">need attention</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Brain className="h-5 w-5 text-blue-400 mr-2" />
                        <span className="text-sm font-medium text-white">AI Accuracy</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-ai-accuracy">
                        <CountUp end={avgConfidence} duration={1} suffix="%" />
                      </div>
                      <div className="text-xs text-purple-200">confidence level</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </div>
      </FadeIn>

      {/* AI Status Banner */}
      <FadeIn>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Brain className="h-4 w-4 text-white" />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">AI Detection System Active</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Monitoring 2,847 data sources including traffic cameras, social media, and weather stations
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-green-900 dark:text-green-100">Last Detection</div>
                  <div className="text-xs text-green-700 dark:text-green-300">2 minutes ago</div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-3 h-3 bg-green-500 rounded-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Controls and Filters */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
          <TabsList className="grid grid-cols-3 w-fit">
            <TabsTrigger value="board" data-testid="tab-board">Kanban Board</TabsTrigger>
            <TabsTrigger value="list" data-testid="tab-list">List View</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
              data-testid="input-search-leads"
            />
          </div>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32" data-testid="select-filter-priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32" data-testid="select-filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Kanban Board Tab */}
        <TabsContent value="board" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 min-h-[600px]">
            {kanbanColumns.map((column) => {
              const columnLeads = leads.filter(lead => lead.status === column.id);
              
              return (
                <div
                  key={column.id}
                  className={`${column.bgColor} ${column.borderColor} border rounded-lg p-4 min-h-[500px]`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                  data-testid={`column-${column.id}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <column.icon className="h-4 w-4" />
                      <h3 className="font-semibold text-sm">{column.title}</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {columnLeads.length}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {columnLeads.map((lead, index) => (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        draggable
                        onDragStart={() => handleDragStart(lead.id)}
                        className="cursor-move"
                      >
                        <HoverLift>
                          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg">
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                              lead.priority === 'emergency' ? 'from-red-500 to-red-600' :
                              lead.priority === 'urgent' ? 'from-orange-500 to-orange-600' :
                              lead.priority === 'high' ? 'from-yellow-500 to-yellow-600' :
                              lead.priority === 'medium' ? 'from-blue-500 to-blue-600' :
                              'from-green-500 to-green-600'
                            }`} />
                            
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  {getDamageIcon(lead.type)}
                                  <div className="truncate">
                                    <h4 className="font-medium text-sm truncate" data-testid={`lead-title-${lead.id}`}>
                                      {lead.ownerName}
                                    </h4>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {lead.address.split(',')[0]}
                                    </p>
                                  </div>
                                </div>
                                <Badge className={`text-xs ${getPriorityColor(lead.priority)}`}>
                                  {lead.priority}
                                </Badge>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="pt-0 space-y-3">
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {lead.damageDescription}
                              </div>
                              
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-green-600">
                                  ${(lead.estimatedValue / 1000).toFixed(0)}K
                                </span>
                                <div className="flex items-center space-x-1">
                                  <Brain className="h-3 w-3 text-blue-500" />
                                  <span className="text-blue-600">{lead.aiConfidence}%</span>
                                </div>
                              </div>
                              
                              {lead.assignedTo && (
                                <div className="text-xs text-muted-foreground">
                                  <UserCheck className="h-3 w-3 inline mr-1" />
                                  {lead.assignedTo}
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs px-2"
                                  onClick={() => setSelectedLead(selectedLead === lead.id ? null : lead.id)}
                                  data-testid={`button-view-details-${lead.id}`}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Details
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs px-2"
                                  onClick={() => handleAssignContractor(lead.id)}
                                  data-testid={`button-assign-${lead.id}`}
                                >
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  Assign
                                </Button>
                              </div>

                              {/* Expanded Details */}
                              <AnimatePresence>
                                {selectedLead === lead.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="border-t pt-3 space-y-2 text-xs"
                                  >
                                    <div><strong>Phone:</strong> {lead.phone}</div>
                                    <div><strong>Insurance:</strong> {lead.insuranceCompany}</div>
                                    <div><strong>Property Value:</strong> ${(lead.propertyValue / 1000).toFixed(0)}K</div>
                                    <div><strong>Weather:</strong> {lead.weatherConditions}</div>
                                    <div><strong>Images:</strong> {lead.images} available</div>
                                    <div className="flex space-x-1">
                                      <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                                        <Phone className="h-3 w-3 mr-1" />
                                        Call
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                                        <Mail className="h-3 w-3 mr-1" />
                                        Email
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        Map
                                      </Button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </CardContent>
                          </Card>
                        </HoverLift>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* List View Tab */}
        <TabsContent value="list" className="space-y-6">
          <FadeIn>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <List className="h-5 w-5 mr-2" />
                  Comprehensive Lead List
                </CardTitle>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">
                    Total: {leads.length} leads
                  </Badge>
                  <Badge variant="outline" className="text-green-600">
                    ${leads.reduce((sum, lead) => sum + lead.estimatedValue, 0).toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedLeads.length === leads.length}
                              onChange={handleSelectAll}
                              className="mr-2"
                            />
                            Select
                          </div>
                        </th>
                        <th className="text-left p-3 font-semibold">Owner Name</th>
                        <th className="text-left p-3 font-semibold">Address</th>
                        <th className="text-left p-3 font-semibold">Damage Type</th>
                        <th className="text-left p-3 font-semibold">Value</th>
                        <th className="text-left p-3 font-semibold">Priority</th>
                        <th className="text-left p-3 font-semibold">Status</th>
                        <th className="text-left p-3 font-semibold">AI Confidence</th>
                        <th className="text-left p-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr key={lead.id} className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selectedLeads.includes(lead.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(lead.id)}
                              onChange={() => handleSelectLead(lead.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{lead.ownerName}</div>
                              <div className="text-sm text-gray-500">{lead.phone}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm">{lead.address}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {lead.type.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-green-600">
                              ${lead.estimatedValue.toLocaleString()}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={
                              lead.priority === 'emergency' ? 'bg-red-500 text-white' :
                              lead.priority === 'urgent' ? 'bg-orange-500 text-white' :
                              lead.priority === 'high' ? 'bg-yellow-500 text-white' :
                              'bg-gray-500 text-white'
                            }>
                              {lead.priority.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant={
                              lead.status === 'new' ? 'default' :
                              lead.status === 'completed' ? 'destructive' :
                              'secondary'
                            }>
                              {lead.status.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${lead.aiConfidence}%` }}
                                ></div>
                              </div>
                              <span className="text-sm">{lead.aiConfidence}%</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex space-x-1">
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                <Phone className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                <Mail className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Target className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium">Total Leads</span>
                  </div>
                  <div className="text-2xl font-bold">
                    <CountUp end={leadStats?.totalLeads || 0} duration={1} />
                  </div>
                  <div className="text-xs text-muted-foreground">All time</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Plus className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium">New Today</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    <CountUp end={leadStats?.newToday || 0} duration={1} />
                  </div>
                  <div className="text-xs text-muted-foreground">+24 hours</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-5 w-5 text-amber-500 mr-2" />
                    <span className="text-sm font-medium">Total Value</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-600">
                    $<CountUp end={leadStats?.totalValue || 0} duration={1} />
                  </div>
                  <div className="text-xs text-muted-foreground">Est. revenue</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-500 mr-2" />
                    <span className="text-sm font-medium">Conversion Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    <CountUp end={leadStats?.conversionRate || 0} duration={1} suffix="%" />
                  </div>
                  <div className="text-xs text-muted-foreground">Success rate</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(leads.reduce((acc, lead) => {
                      acc[lead.status] = (acc[lead.status] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            status === 'new' ? 'bg-blue-500' :
                            status === 'contacted' ? 'bg-yellow-500' :
                            status === 'qualified' ? 'bg-purple-500' :
                            status === 'assigned' ? 'bg-orange-500' :
                            status === 'in_progress' ? 'bg-indigo-500' :
                            'bg-green-500'
                          }`}></div>
                          <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{count}</span>
                          <span className="text-sm text-muted-foreground">
                            ({((count / leads.length) * 100).toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(leads.reduce((acc, lead) => {
                      acc[lead.priority] = (acc[lead.priority] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)).map(([priority, count]) => (
                      <div key={priority} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            priority === 'emergency' ? 'bg-red-500' :
                            priority === 'urgent' ? 'bg-orange-500' :
                            priority === 'high' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`}></div>
                          <span className="capitalize">{priority}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{count}</span>
                          <span className="text-sm text-muted-foreground">
                            ({((count / leads.length) * 100).toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Damage Types by Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(leads.reduce((acc, lead) => {
                    const type = lead.type.replace(/_/g, ' ').toUpperCase();
                    if (!acc[type]) {
                      acc[type] = { count: 0, value: 0 };
                    }
                    acc[type].count += 1;
                    acc[type].value += lead.estimatedValue;
                    return acc;
                  }, {} as Record<string, { count: number; value: number }>))
                  .sort(([,a], [,b]) => b.value - a.value)
                  .slice(0, 5)
                  .map(([type, data]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{type}</div>
                        <div className="text-sm text-muted-foreground">{data.count} incidents</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">${data.value.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          Avg: ${(data.value / data.count).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>
      </Tabs>

      {/* Bulk Assignment Modal */}
      {assignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {selectedLeads.length > 0 ? `Bulk Assign ${selectedLeads.length} Leads` : 'Assign Contractor'}
            </h3>
            
            <div className="space-y-4">
              {selectedLeads.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Selected {selectedLeads.length} leads for bulk assignment
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Select Contractor</label>
                <Select value={bulkAssignContractor} onValueChange={setBulkAssignContractor}>
                  <SelectTrigger className="bg-background text-foreground">
                    <SelectValue placeholder="Choose contractor..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background text-foreground border border-border">
                    <SelectItem value="Rodriguez Tree Service" className="text-foreground hover:bg-accent hover:text-accent-foreground">Rodriguez Tree Service</SelectItem>
                    <SelectItem value="FloodPro Restoration" className="text-foreground hover:bg-accent hover:text-accent-foreground">FloodPro Restoration</SelectItem>
                    <SelectItem value="Miami Storm Repairs" className="text-foreground hover:bg-accent hover:text-accent-foreground">Miami Storm Repairs</SelectItem>
                    <SelectItem value="Gulf Coast Roofing" className="text-foreground hover:bg-accent hover:text-accent-foreground">Gulf Coast Roofing</SelectItem>
                    <SelectItem value="Keys Foundation Experts" className="text-foreground hover:bg-accent hover:text-accent-foreground">Keys Foundation Experts</SelectItem>
                    <SelectItem value="Tampa Bay Emergency Response" className="text-foreground hover:bg-accent hover:text-accent-foreground">Tampa Bay Emergency Response</SelectItem>
                    <SelectItem value="Orlando Tree Masters" className="text-foreground hover:bg-accent hover:text-accent-foreground">Orlando Tree Masters</SelectItem>
                    <SelectItem value="Naples Restoration Pro" className="text-foreground hover:bg-accent hover:text-accent-foreground">Naples Restoration Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAssignmentModal(false);
                    setBulkAssignContractor('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkAssign}
                  disabled={!bulkAssignContractor}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {selectedLeads.length > 0 ? `Assign ${selectedLeads.length} Leads` : 'Assign Lead'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Leads Counter */}
      {selectedLeads.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{selectedLeads.length} leads selected</span>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-white border-white hover:bg-white hover:text-blue-600"
              onClick={() => setAssignmentModal(true)}
            >
              Bulk Assign
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-white/20"
              onClick={() => setSelectedLeads([])}
            >
              <UserX className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <ModuleAIAssistant moduleName="Lead Management" />
    </div>
  );
}