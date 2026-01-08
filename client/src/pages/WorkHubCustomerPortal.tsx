import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Camera, Video, Upload, MapPin, Sparkles, CheckCircle,
  ArrowRight, ArrowLeft, Image, Loader2, Volume2, VolumeX,
  DollarSign, Clock, Star, User, Phone, Mail, Calendar,
  MessageSquare, MessageCircle, Shield, Zap, ChevronRight, Building2,
  TreePine, Home, Wind, Droplets, Plug, Paintbrush, Car,
  Hammer, Wrench, Settings, ThumbsUp, AlertCircle, AlertTriangle, Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

const SERVICE_CATEGORIES = [
  { id: 'tree', name: 'Tree Services', icon: TreePine, description: 'Removal, trimming, stump grinding' },
  { id: 'roofing', name: 'Roofing', icon: Home, description: 'Repairs, replacement, inspections' },
  { id: 'hvac', name: 'HVAC', icon: Wind, description: 'Heating, cooling, ventilation' },
  { id: 'plumbing', name: 'Plumbing', icon: Droplets, description: 'Pipes, fixtures, water heaters' },
  { id: 'electrical', name: 'Electrical', icon: Plug, description: 'Wiring, panels, outlets' },
  { id: 'painting', name: 'Painting', icon: Paintbrush, description: 'Interior, exterior, commercial' },
  { id: 'auto', name: 'Auto Repair', icon: Car, description: 'Mechanical, body, paint' },
  { id: 'general', name: 'General Contractor', icon: Hammer, description: 'Renovations, remodels' },
  { id: 'flooring', name: 'Flooring', icon: Building2, description: 'Hardwood, tile, carpet' },
  { id: 'fence', name: 'Fencing', icon: Settings, description: 'Wood, chain link, privacy' },
  { id: 'concrete', name: 'Concrete', icon: Wrench, description: 'Driveways, patios, repairs' },
  { id: 'other', name: 'Other', icon: Settings, description: 'Custom project' }
];

interface ProjectRequest {
  category: string;
  description: string;
  photos: File[];
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  preferences: {
    urgency: string;
    schedulingOption: string;
    estimatePreference: string;
  };
}

export default function WorkHubCustomerPortal() {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [budgetConfirmed, setBudgetConfirmed] = useState<boolean | null>(null);
  const [budgetReason, setBudgetReason] = useState('');
  const [customerBudgetMin, setCustomerBudgetMin] = useState<string>('');
  const [customerBudgetMax, setCustomerBudgetMax] = useState<string>('');
  const [preferredDate, setPreferredDate] = useState<string>('');
  const [showContractors, setShowContractors] = useState(false);
  const [preferredTimeframe, setPreferredTimeframe] = useState<string | null>(null);
  const [estimateDateFrom, setEstimateDateFrom] = useState<string>('');
  const [estimateDateTo, setEstimateDateTo] = useState<string>('');
  const [estimateTimePreference, setEstimateTimePreference] = useState<string>('any');
  const [desiredQuoteCount, setDesiredQuoteCount] = useState<number | null>(null);
  const [jobCompletionDate, setJobCompletionDate] = useState<string>('');
  const [schedulingConfirmed, setSchedulingConfirmed] = useState(false);
  const [isMatchingContractors, setIsMatchingContractors] = useState(false);
  const [jobDetails, setJobDetails] = useState<{
    itemType: string;
    primaryMeasurement: string;
    primaryValue: number | string;
    secondaryMeasurement?: string;
    secondaryValue?: number | string;
    additionalInfo?: string;
    complexity: string;
    complexityReason: string;
    workType: string;
    equipmentNeeded?: string[];
    crewSize?: number;
    crewBreakdown?: {
      climbers: number;
      bucketTruckOperator: number;
      craneOperator: number;
      groundWorkers: number;
    };
    debrisInfo?: {
      volumeCuYd: number;
      needsDumpTrailer: boolean;
      needsDebrisHauler: boolean;
      estimatedLoads: number;
      disposalMethod: string;
    };
    estimatedHours?: number;
    contractorCosts?: {
      laborCost: number;
      equipmentCost: number;
      debrisDisposalCost: number;
      overheadPercent: number;
      totalCost: number;
    };
    profitProjection?: {
      projectedProfit: number;
      profitMargin: number;
      profitRating: string;
    };
  } | null>(null);
  const [afterPreviewUrl, setAfterPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [measurements, setMeasurements] = useState<any>(null);
  const [materialOptions, setMaterialOptions] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [pricingBreakdown, setPricingBreakdown] = useState<{ materialCost: number; laborCost: number; totalCost: number } | null>(null);
  const [treePricing, setTreePricing] = useState<{
    riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    crewInfo: { crewSize: number; estimatedHours: number; laborRate: number };
    breakdown: {
      baseRemoval: { min: number; max: number; description: string };
      hazardPremium: { min: number; max: number; factors: string[] };
      equipmentCost: { min: number; max: number; equipment: string };
      stumpGrinding?: { min: number; max: number };
      haulOff?: { min: number; max: number };
      utilityCoordination?: { min: number; max: number };
    };
    warnings: string[];
  } | null>(null);
  const [request, setRequest] = useState<ProjectRequest>({
    category: '',
    description: '',
    photos: [],
    location: { address: '', city: '', state: '', zip: '' },
    contact: { name: '', phone: '', email: '' },
    preferences: { urgency: 'normal', schedulingOption: 'customer', estimatePreference: 'multiple' }
  });
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [matchedContractors, setMatchedContractors] = useState<any[]>([]);
  const [isLoadingContractors, setIsLoadingContractors] = useState(false);
  
  // Upsell options for contractors - helps maximize job value
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [upsellTotal, setUpsellTotal] = useState(0);

  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  // Upsell options by job category - designed to help contractors maximize revenue
  const UPSELL_OPTIONS: Record<string, { id: string; name: string; description: string; price: number; recommended?: boolean }[]> = {
    tree: [
      { id: 'stump_removal', name: 'Stump Grinding', description: 'Remove stump to below ground level', price: 250, recommended: true },
      { id: 'root_removal', name: 'Root Removal', description: 'Remove visible surface roots', price: 150 },
      { id: 'debris_hauling', name: 'Full Debris Hauling', description: 'Haul away all wood and debris', price: 200 },
      { id: 'trimming_nearby', name: 'Trim Nearby Trees', description: 'Shape and trim adjacent trees', price: 175 },
      { id: 'mulch_delivery', name: 'Mulch from Wood Chips', description: 'Convert debris to usable mulch', price: 75 },
    ],
    tree_removal: [
      { id: 'stump_removal', name: 'Stump Grinding', description: 'Remove stump to below ground level', price: 250, recommended: true },
      { id: 'root_removal', name: 'Root Removal', description: 'Remove visible surface roots', price: 150 },
      { id: 'debris_hauling', name: 'Full Debris Hauling', description: 'Haul away all wood and debris', price: 200 },
      { id: 'trimming_nearby', name: 'Trim Nearby Trees', description: 'Shape and trim adjacent trees', price: 175 },
      { id: 'mulch_delivery', name: 'Mulch from Wood Chips', description: 'Convert debris to usable mulch', price: 75 },
    ],
    roofing: [
      { id: 'gutter_cleaning', name: 'Gutter Cleaning', description: 'Clean and flush all gutters', price: 150, recommended: true },
      { id: 'gutter_guards', name: 'Gutter Guards', description: 'Install leaf guards on gutters', price: 350 },
      { id: 'attic_ventilation', name: 'Attic Ventilation Check', description: 'Inspect and improve attic airflow', price: 125 },
      { id: 'skylight_seal', name: 'Skylight Resealing', description: 'Reseal skylights to prevent leaks', price: 200 },
      { id: 'chimney_flashing', name: 'Chimney Flashing', description: 'Replace chimney flashing', price: 275 },
    ],
    painting: [
      { id: 'trim_painting', name: 'Trim & Molding', description: 'Paint all trim, baseboards, crown molding', price: 350, recommended: true },
      { id: 'ceiling_paint', name: 'Ceiling Painting', description: 'Fresh coat on all ceilings', price: 250 },
      { id: 'drywall_repair', name: 'Drywall Repair', description: 'Patch holes and repair damage', price: 175 },
      { id: 'power_wash', name: 'Exterior Power Wash', description: 'Deep clean before painting', price: 200 },
      { id: 'caulking', name: 'Window/Door Caulking', description: 'Seal all gaps and cracks', price: 125 },
    ],
    flooring: [
      { id: 'baseboard_install', name: 'New Baseboards', description: 'Install matching baseboards', price: 400, recommended: true },
      { id: 'subfloor_repair', name: 'Subfloor Repair', description: 'Fix squeaks and damaged areas', price: 300 },
      { id: 'furniture_moving', name: 'Furniture Moving', description: 'Move and replace all furniture', price: 150 },
      { id: 'old_floor_removal', name: 'Old Floor Removal', description: 'Remove and dispose of old flooring', price: 350 },
      { id: 'transitions', name: 'Transition Strips', description: 'Install professional transitions', price: 125 },
    ],
    hvac: [
      { id: 'duct_cleaning', name: 'Duct Cleaning', description: 'Full HVAC duct cleaning', price: 350, recommended: true },
      { id: 'smart_thermostat', name: 'Smart Thermostat', description: 'Install wifi-enabled thermostat', price: 250 },
      { id: 'air_filter_sub', name: 'Filter Subscription', description: '1 year of filter deliveries', price: 75 },
      { id: 'uv_light', name: 'UV Air Purifier', description: 'Install UV light for air quality', price: 400 },
      { id: 'maintenance_plan', name: 'Annual Maintenance Plan', description: '2 tune-ups per year', price: 200 },
    ],
    plumbing: [
      { id: 'water_heater_flush', name: 'Water Heater Flush', description: 'Drain and flush sediment', price: 125, recommended: true },
      { id: 'drain_cleaning', name: 'Whole House Drain Clean', description: 'Snake all drains', price: 275 },
      { id: 'pressure_regulator', name: 'Pressure Regulator', description: 'Install water pressure regulator', price: 200 },
      { id: 'shut_off_valves', name: 'Replace Shut-offs', description: 'New fixture shut-off valves', price: 150 },
      { id: 'expansion_tank', name: 'Expansion Tank', description: 'Install thermal expansion tank', price: 225 },
    ],
    electrical: [
      { id: 'surge_protection', name: 'Whole House Surge', description: 'Install surge protection', price: 350, recommended: true },
      { id: 'outlet_upgrade', name: 'USB Outlet Upgrade', description: 'Add USB outlets to 5 locations', price: 200 },
      { id: 'dimmer_switches', name: 'Dimmer Switches', description: 'Install dimmers in 3 rooms', price: 175 },
      { id: 'smoke_detectors', name: 'Smoke Detector Upgrade', description: 'New interconnected detectors', price: 250 },
      { id: 'outdoor_lighting', name: 'Outdoor Lighting', description: 'Add security/landscape lights', price: 400 },
    ],
    fence: [
      { id: 'gate_install', name: 'Gate Installation', description: 'Add matching gate', price: 400, recommended: true },
      { id: 'post_caps', name: 'Decorative Post Caps', description: 'Add caps to all posts', price: 100 },
      { id: 'staining', name: 'Fence Staining', description: 'Stain and seal fence', price: 300 },
      { id: 'lattice_top', name: 'Lattice Topper', description: 'Add decorative lattice', price: 250 },
      { id: 'pet_barrier', name: 'Pet Barrier', description: 'Add dig-proof barrier', price: 175 },
    ],
    concrete: [
      { id: 'sealing', name: 'Concrete Sealing', description: 'Seal to prevent staining', price: 200, recommended: true },
      { id: 'expansion_joints', name: 'Expansion Joints', description: 'Cut control joints', price: 150 },
      { id: 'colored_finish', name: 'Colored Finish', description: 'Add integral color', price: 350 },
      { id: 'non_slip', name: 'Non-Slip Finish', description: 'Add textured non-slip surface', price: 175 },
      { id: 'drainage', name: 'Drainage Solution', description: 'Install drain or slope correction', price: 400 },
    ],
  };

  useEffect(() => {
    const fetchContractors = async () => {
      if (!request.location.state || request.location.state.length < 2) {
        setMatchedContractors([]);
        return;
      }
      
      setIsLoadingContractors(true);
      try {
        const stateCode = request.location.state.toUpperCase().substring(0, 2);
        const params = new URLSearchParams({ state: stateCode });
        if (request.category && request.category !== 'other') {
          params.append('trade', request.category);
        }
        
        const response = await fetch(`/api/public/contractor-directory?${params}`);
        if (response.ok) {
          const data = await response.json();
          setMatchedContractors(data.contractors || []);
        }
      } catch (error) {
        console.error('Failed to fetch contractors:', error);
      } finally {
        setIsLoadingContractors(false);
      }
    };

    const debounceTimer = setTimeout(fetchContractors, 500);
    return () => clearTimeout(debounceTimer);
  }, [request.location.state, request.category]);

  // Auto-submit when scheduling is confirmed and we have contact info
  useEffect(() => {
    if (schedulingConfirmed && request.contact.name && request.contact.email && !isSubmitting && !submissionComplete) {
      submitCustomerRequest();
    }
  }, [schedulingConfirmed]);

  const speakGuidance = async (text: string) => {
    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        setCurrentAudio(null);
      }
      
      setIsVoiceActive(true);
      
      // Use ElevenLabs natural voice via backend API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        console.error('TTS request failed');
        setIsVoiceActive(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
        setCurrentAudio(audio);
        
        audio.onended = () => {
          setIsVoiceActive(false);
          setCurrentAudio(null);
        };
        
        audio.onerror = () => {
          setIsVoiceActive(false);
          setCurrentAudio(null);
        };
        
        await audio.play();
      } else {
        setIsVoiceActive(false);
      }
    } catch (error) {
      console.error('Voice guidance error:', error);
      setIsVoiceActive(false);
    }
  };
  
  const stopVoice = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
    }
    setIsVoiceActive(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setRequest(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
    const newUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
  };

  const handleAnalyzePhotos = async () => {
    if (request.photos.length === 0) return;
    
    // Reset all analysis-related state for fresh analysis
    setAiAnalysis(null);
    setJobDetails(null);
    setBudgetConfirmed(null);
    setPreferredTimeframe(null);
    setShowContractors(false);
    setBudgetReason('');
    setAfterPreviewUrl(null);
    setMeasurements(null);
    setMaterialOptions([]);
    setSelectedMaterial(null);
    setPricingBreakdown(null);
    setTreePricing(null); // Reset tree pricing to avoid showing stale data for non-tree jobs
    
    setIsAnalyzing(true);
    speakGuidance("Analyzing your photos with AI. I'm identifying the type of work needed and potential issues.");
    
    try {
      // Convert first photo to base64 for AI analysis
      const file = request.photos[0];
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data:image/...;base64, prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const imageBase64 = await base64Promise;

      // Call the real AI analysis API
      const response = await fetch('/api/workhub/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: imageBase64,
          description: request.description || '',
          jobType: request.category || '',
          location: request.location.city && request.location.state 
            ? `${request.location.city}, ${request.location.state}` 
            : ''
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      
      // Transform API response to match the expected format
      // details is a string, convert to array for display
      const issuesList: string[] = [];
      if (data.analysis?.summary) issuesList.push(data.analysis.summary);
      if (data.analysis?.details) issuesList.push(data.analysis.details);
      if (issuesList.length === 0) issuesList.push('Work identified from photo analysis');
      
      // Confidence is 0-1 from backend, convert to percentage
      const confidencePercent = Math.round((data.analysis?.confidence || 0.85) * 100);
      
      const analysis = {
        detectedCategory: data.analysis?.detectedJobType || request.category || 'general',
        identifiedIssues: issuesList,
        recommendedTrades: data.analysis?.recommendations || [],
        estimatedPriceRange: { 
          min: data.analysis?.priceEstimate?.min || 500, 
          max: data.analysis?.priceEstimate?.max || 2000 
        },
        complexity: data.analysis?.complexity || data.analysis?.severity || 'minimal',
        timeEstimate: data.analysis?.timeEstimate || data.analysis?.urgency || 'routine',
        hazards: data.analysis?.hazards || {},
        isHazardous: data.analysis?.isHazardous || false,
        aiConfidence: confidencePercent,
        contractors: data.contractors || [],
        tags: data.analysis?.tags || [],
        safetyNotes: data.analysis?.safetyNotes || ''
      };
      
      setAiAnalysis(analysis);
      
      // Capture measurements and material options from the enhanced API
      if (data.measurements) {
        setMeasurements(data.measurements);
      }
      if (data.materialOptions && data.materialOptions.length > 0) {
        setMaterialOptions(data.materialOptions);
        // Auto-select the recommended material
        const recommended = data.materialOptions.find((m: any) => m.isRecommended);
        if (recommended) {
          setSelectedMaterial(recommended);
          setPricingBreakdown({
            materialCost: recommended.materialCost,
            laborCost: recommended.laborCost,
            totalCost: recommended.totalCost
          });
        }
      }
      
      // Capture professional tree pricing breakdown
      if (data.analysis?.treePricing) {
        setTreePricing(data.analysis.treePricing);
      }
      
      // Extract job details based on work type
      const detectedCategory = analysis.detectedCategory || request.category || 'general';
      const complexityLevel = analysis.complexity || 'Medium';
      const minPrice = analysis.estimatedPriceRange.min;
      const maxPrice = analysis.estimatedPriceRange.max;
      
      // Build work-type specific job details
      const workTypeLabels: Record<string, string> = {
        'tree': 'Tree Services', 'tree_removal': 'Tree Removal',
        'roofing': 'Roofing', 'hvac': 'HVAC', 
        'plumbing': 'Plumbing', 'electrical': 'Electrical',
        'painting': 'Painting', 'fence': 'Fencing',
        'flooring': 'Flooring', 'concrete': 'Concrete',
        'general': 'General Contractor', 'auto': 'Auto Repair',
        'other': 'Custom Project'
      };
      
      let jobInfo: any = {
        workType: workTypeLabels[detectedCategory] || detectedCategory,
        complexity: complexityLevel,
        complexityReason: ''
      };
      
      // Work-type specific measurements and details
      if (detectedCategory === 'tree' || detectedCategory === 'tree_removal') {
        const treeType = data.analysis?.treeDetails?.species || data.analysis?.title?.split(' ').slice(0, 2).join(' ') || 'Tree';
        const height = data.measurements?.heightFt || 30;
        const width = data.measurements?.widthFt || 20;
        const weight = data.measurements?.estimatedWeightLb || 4500;
        
        // Enhanced equipment and crew requirements from API
        const equipmentNeeded = data.jobRequirements?.equipmentNeeded || data.measurements?.equipmentNeeded;
        const crewRequirements = data.jobRequirements?.crewRequirements || data.measurements?.crewRequirements;
        const debrisHandling = data.jobRequirements?.debrisHandling || data.measurements?.debrisHandling;
        const estimatedDuration = data.jobRequirements?.estimatedDuration || data.measurements?.estimatedDuration;
        const contractorFinancials = data.contractorFinancials;
        
        // Build equipment list for display
        const equipmentList: string[] = [];
        if (equipmentNeeded?.crane) equipmentList.push('Crane');
        if (equipmentNeeded?.bucketTruck) equipmentList.push('Bucket Truck');
        if (equipmentNeeded?.climber) equipmentList.push('Climber');
        if (equipmentNeeded?.chainsaw) equipmentList.push('Chainsaw');
        if (equipmentNeeded?.chipper) equipmentList.push('Chipper');
        if (equipmentNeeded?.stumpGrinder) equipmentList.push('Stump Grinder');
        
        jobInfo = {
          ...jobInfo,
          itemType: treeType,
          primaryMeasurement: 'Height',
          primaryValue: `${height} ft`,
          secondaryMeasurement: 'Width',
          secondaryValue: `${width} ft`,
          additionalInfo: `Est. Weight: ${weight.toLocaleString()} lbs`,
          complexityReason: complexityLevel === 'High' || complexityLevel === 'severe' 
            ? 'Large tree requiring heavy equipment or close to structures'
            : complexityLevel === 'Medium' || complexityLevel === 'moderate'
            ? 'Standard removal with moderate accessibility'
            : 'Straightforward removal with easy access',
          // Enhanced tree job details
          equipmentNeeded: equipmentList,
          crewSize: crewRequirements?.totalCrew || 2,
          crewBreakdown: crewRequirements ? {
            climbers: crewRequirements.climbers || 0,
            bucketTruckOperator: crewRequirements.bucketTruckOperator || 0,
            craneOperator: crewRequirements.craneOperator || 0,
            groundWorkers: crewRequirements.groundWorkers || 2
          } : null,
          debrisInfo: debrisHandling ? {
            volumeCuYd: debrisHandling.estimatedVolumeCuYd || 0,
            needsDumpTrailer: debrisHandling.needsDumpTrailer || false,
            needsDebrisHauler: debrisHandling.needsDebrisHauler || false,
            estimatedLoads: debrisHandling.estimatedLoads || 1,
            disposalMethod: debrisHandling.disposalMethod || 'Standard dump trailer'
          } : null,
          estimatedHours: estimatedDuration?.hours || 4,
          // Contractor financials for contractor view
          contractorCosts: contractorFinancials?.contractorCosts || null,
          profitProjection: contractorFinancials?.profitProjection || null
        };
        
        // Build voice guidance with equipment details
        let voiceMessage = `I've analyzed your photo. This appears to be ${treeType}, approximately ${height} feet tall and ${width} feet wide, with an estimated weight of about ${weight.toLocaleString()} pounds. `;
        
        if (equipmentNeeded?.crane) {
          voiceMessage += `This job will require a crane due to the tree's size. `;
        } else if (equipmentNeeded?.bucketTruck) {
          voiceMessage += `This job will need a bucket truck for safe access. `;
        } else if (equipmentNeeded?.climber) {
          voiceMessage += `A professional climber will handle this removal. `;
        }
        
        if (crewRequirements?.totalCrew) {
          voiceMessage += `We estimate ${crewRequirements.totalCrew} crew members will be needed. `;
        }
        
        if (debrisHandling?.estimatedLoads > 1) {
          voiceMessage += `Debris removal will require ${debrisHandling.estimatedLoads} loads to haul away. `;
        }
        
        voiceMessage += `Based on the size and complexity, I estimate this job would cost between $${minPrice.toLocaleString()} and $${maxPrice.toLocaleString()}. `;
        voiceMessage += `Now, keep in mind this is just an estimate based on the photos you provided. A contractor will need to come out in person to give you a final quote. `;
        voiceMessage += `Prices can change based on things like access to the tree, hidden damage, roots that need removal, or obstacles nearby. `;
        voiceMessage += `Does this initial estimate fit your budget?`;
        
        speakGuidance(voiceMessage);
      } else if (detectedCategory === 'roofing') {
        const sqFt = data.measurements?.squareFt || data.measurements?.areaSqFt || 1500;
        const roofType = data.analysis?.roofType || data.analysis?.material || 'Shingle Roof';
        
        jobInfo = {
          ...jobInfo,
          itemType: roofType,
          primaryMeasurement: 'Area',
          primaryValue: `${sqFt.toLocaleString()} sq ft`,
          secondaryMeasurement: 'Squares',
          secondaryValue: Math.ceil(sqFt / 100),
          complexityReason: complexityLevel === 'High' ? 'Steep pitch, multiple layers, or structural repairs needed'
            : complexityLevel === 'Medium' ? 'Standard roof with moderate accessibility'
            : 'Simple repair or flat/low-pitch roof'
        };
        
        speakGuidance(
          `I've analyzed your roofing photos. The area appears to be approximately ${sqFt.toLocaleString()} square feet. ` +
          `Based on the condition and scope of work, I estimate this job would cost between $${minPrice.toLocaleString()} and $${maxPrice.toLocaleString()}. ` +
          `Keep in mind, this is just an estimate based on photos. A contractor will need to inspect in person to give you a final quote. ` +
          `Prices can change based on hidden damage, material upgrades, or structural repairs that aren't visible in photos. ` +
          `Does this initial estimate fit your budget?`
        );
      } else if (detectedCategory === 'hvac') {
        const units = data.measurements?.units || 1;
        const systemType = data.analysis?.systemType || 'HVAC System';
        const tonnage = data.measurements?.tonnage || data.analysis?.tonnage || 'N/A';
        
        jobInfo = {
          ...jobInfo,
          itemType: systemType,
          primaryMeasurement: 'Units',
          primaryValue: units,
          secondaryMeasurement: 'Tonnage',
          secondaryValue: tonnage,
          complexityReason: complexityLevel === 'High' ? 'Full system replacement or major ductwork modifications'
            : complexityLevel === 'Medium' ? 'Component replacement or significant repairs'
            : 'Minor repair or maintenance'
        };
        
        speakGuidance(
          `I've analyzed your HVAC photos. I can see the ${systemType} needs attention. ` +
          `Based on the scope of work, I estimate this job would cost between $${minPrice.toLocaleString()} and $${maxPrice.toLocaleString()}. ` +
          `This is just an estimate based on what I can see in the photos. A technician will need to inspect the system in person to give you a final quote. ` +
          `Prices can change based on the age of your system, ductwork condition, or parts availability. ` +
          `Does this initial estimate fit your budget?`
        );
      } else if (detectedCategory === 'fence') {
        const linearFt = data.measurements?.linearFt || data.measurements?.lengthFt || 100;
        const heightFt = data.measurements?.heightFt || 6;
        const fenceType = data.analysis?.fenceType || data.analysis?.material || 'Fence';
        
        jobInfo = {
          ...jobInfo,
          itemType: fenceType,
          primaryMeasurement: 'Length',
          primaryValue: `${linearFt} linear ft`,
          secondaryMeasurement: 'Height',
          secondaryValue: `${heightFt} ft`,
          complexityReason: complexityLevel === 'High' ? 'Difficult terrain, removal of old fence, or custom design'
            : complexityLevel === 'Medium' ? 'Standard installation with some obstacles'
            : 'Simple repair or basic installation'
        };
        
        speakGuidance(
          `I've analyzed your fencing photos. This appears to be approximately ${linearFt} linear feet of ${fenceType.toLowerCase()}. ` +
          `I estimate this job would cost between $${minPrice.toLocaleString()} and $${maxPrice.toLocaleString()}. ` +
          `This is just an estimate based on photos. A contractor will need to come out to measure and check the terrain before giving a final quote. ` +
          `Prices can change based on soil conditions, old fence removal, or gate requirements. ` +
          `Does this initial estimate fit your budget?`
        );
      } else if (detectedCategory === 'electrical') {
        const outlets = data.measurements?.outlets || data.measurements?.points || 'Multiple';
        const amperage = data.measurements?.amperage || data.analysis?.amperage || 'Standard';
        
        jobInfo = {
          ...jobInfo,
          itemType: data.analysis?.workType || 'Electrical Work',
          primaryMeasurement: 'Points/Outlets',
          primaryValue: outlets,
          secondaryMeasurement: 'Service',
          secondaryValue: amperage,
          complexityReason: complexityLevel === 'High' ? 'Panel upgrade, rewiring, or major electrical work'
            : complexityLevel === 'Medium' ? 'Multiple outlets, circuits, or fixture installations'
            : 'Simple repairs or single fixture installation'
        };
        
        speakGuidance(
          `I've analyzed your electrical photos. Based on the scope of work needed, ` +
          `I estimate this job would cost between $${minPrice.toLocaleString()} and $${maxPrice.toLocaleString()}. ` +
          `This is just an estimate based on what I can see. An electrician will need to inspect in person to give a final quote. ` +
          `Prices can change based on panel capacity, wiring condition, or permit requirements. ` +
          `Does this initial estimate fit your budget?`
        );
      } else if (detectedCategory === 'plumbing') {
        const fixtures = data.measurements?.fixtures || 'Multiple';
        
        jobInfo = {
          ...jobInfo,
          itemType: data.analysis?.workType || 'Plumbing Work',
          primaryMeasurement: 'Fixtures',
          primaryValue: fixtures,
          complexityReason: complexityLevel === 'High' ? 'Main line work, repiping, or water heater replacement'
            : complexityLevel === 'Medium' ? 'Fixture replacement or drain repairs'
            : 'Minor leak repair or simple fixture work'
        };
        
        speakGuidance(
          `I've analyzed your plumbing photos. Based on what I can see, ` +
          `I estimate this job would cost between $${minPrice.toLocaleString()} and $${maxPrice.toLocaleString()}. ` +
          `This is just an estimate based on photos. A plumber will need to inspect in person to give a final quote. ` +
          `Prices can change based on pipe condition, access difficulty, or additional issues found. ` +
          `Does this initial estimate fit your budget?`
        );
      } else if (detectedCategory === 'painting') {
        const sqFt = data.measurements?.squareFt || data.measurements?.areaSqFt || 500;
        const rooms = data.measurements?.rooms || 1;
        
        jobInfo = {
          ...jobInfo,
          itemType: data.analysis?.paintType || 'Paint Job',
          primaryMeasurement: 'Area',
          primaryValue: `${sqFt.toLocaleString()} sq ft`,
          secondaryMeasurement: 'Rooms',
          secondaryValue: rooms,
          complexityReason: complexityLevel === 'High' ? 'High ceilings, extensive prep work, or specialty finishes'
            : complexityLevel === 'Medium' ? 'Standard rooms with moderate prep'
            : 'Simple touch-up or single room'
        };
        
        speakGuidance(
          `I've analyzed your painting project photos. This looks like approximately ${sqFt.toLocaleString()} square feet of work. ` +
          `I estimate this job would cost between $${minPrice.toLocaleString()} and $${maxPrice.toLocaleString()}. ` +
          `This is just an estimate based on photos. A painter will need to see the space in person to give a final quote. ` +
          `Prices can change based on wall condition, prep work needed, or paint quality you choose. ` +
          `Does this initial estimate fit your budget?`
        );
      } else if (detectedCategory === 'flooring') {
        const sqFt = data.measurements?.squareFt || data.measurements?.areaSqFt || 300;
        const floorType = data.analysis?.floorType || data.analysis?.material || 'Flooring';
        
        jobInfo = {
          ...jobInfo,
          itemType: floorType,
          primaryMeasurement: 'Area',
          primaryValue: `${sqFt.toLocaleString()} sq ft`,
          complexityReason: complexityLevel === 'High' ? 'Subfloor repair, pattern installation, or multiple rooms'
            : complexityLevel === 'Medium' ? 'Standard installation with furniture moving'
            : 'Simple repair or small area'
        };
        
        speakGuidance(
          `I've analyzed your flooring photos. This looks like approximately ${sqFt.toLocaleString()} square feet of ${floorType.toLowerCase()}. ` +
          `I estimate this job would cost between $${minPrice.toLocaleString()} and $${maxPrice.toLocaleString()}. ` +
          `This is just an estimate based on photos. A flooring installer will need to measure in person and check the subfloor to give a final quote. ` +
          `Prices can change based on subfloor condition, transitions, or material selection. ` +
          `Does this initial estimate fit your budget?`
        );
      } else if (detectedCategory === 'concrete') {
        const sqFt = data.measurements?.squareFt || data.measurements?.areaSqFt || 200;
        const thickness = data.measurements?.thicknessIn || 4;
        
        jobInfo = {
          ...jobInfo,
          itemType: data.analysis?.concreteType || 'Concrete Work',
          primaryMeasurement: 'Area',
          primaryValue: `${sqFt.toLocaleString()} sq ft`,
          secondaryMeasurement: 'Thickness',
          secondaryValue: `${thickness} inches`,
          complexityReason: complexityLevel === 'High' ? 'Demolition required, stamped/decorative, or structural work'
            : complexityLevel === 'Medium' ? 'Standard pour with forming'
            : 'Simple repair or small slab'
        };
        
        speakGuidance(
          `I've analyzed your concrete project photos. This looks like approximately ${sqFt.toLocaleString()} square feet of work. ` +
          `I estimate this job would cost between $${minPrice.toLocaleString()} and $${maxPrice.toLocaleString()}. ` +
          `This is just an estimate based on photos. A concrete contractor will need to inspect the site in person to give a final quote. ` +
          `Prices can change based on site prep, demolition needs, or finish options. ` +
          `This is a ${complexityLevel.toLowerCase()} complexity job. Does this fit your budget?`
        );
      } else {
        // Generic job details for other work types
        jobInfo = {
          ...jobInfo,
          itemType: data.analysis?.title || 'Service Request',
          primaryMeasurement: 'Scope',
          primaryValue: data.analysis?.summary || 'See analysis details',
          complexityReason: complexityLevel === 'High' ? 'Complex project requiring specialized skills or equipment'
            : complexityLevel === 'Medium' ? 'Standard project with moderate requirements'
            : 'Simple repair or basic service'
        };
        
        speakGuidance(
          `Analysis complete. I've identified the work needed. The estimated price range is $${minPrice.toLocaleString()} to $${maxPrice.toLocaleString()}. ` +
          `Keep in mind, this is just an estimate based on the photos you provided. A contractor will need to come out in person to give you a final quote. ` +
          `Prices can change once they see the full scope of work and any hidden issues. ` +
          `Does this initial estimate fit your budget?`
        );
      }
      
      setJobDetails(jobInfo);
    } catch (error) {
      console.error('AI analysis error:', error);
      // Fallback to basic analysis if API fails
      const workTypeLabels: Record<string, string> = {
        'tree': 'Tree Services', 'tree_removal': 'Tree Removal',
        'roofing': 'Roofing', 'hvac': 'HVAC', 
        'plumbing': 'Plumbing', 'electrical': 'Electrical',
        'painting': 'Painting', 'fence': 'Fencing',
        'flooring': 'Flooring', 'concrete': 'Concrete',
        'general': 'General Contractor', 'auto': 'Auto Repair',
        'other': 'Custom Project'
      };
      const detectedCategory = request.category || 'general';
      const fallbackAnalysis = {
        detectedCategory: detectedCategory,
        identifiedIssues: ['Photo uploaded - professional inspection recommended'],
        recommendedTrades: [SERVICE_CATEGORIES.find(c => c.id === request.category)?.name || 'General Contractor'],
        estimatedPriceRange: { min: 500, max: 2500 },
        complexity: 'Medium',
        timeEstimate: '1-3 days',
        aiConfidence: 70,
        contractors: []
      };
      setAiAnalysis(fallbackAnalysis);
      
      // Set fallback jobDetails so scheduling flow can proceed
      const fallbackJobDetails = {
        itemType: workTypeLabels[detectedCategory] || 'Project',
        primaryMeasurement: 'Scope',
        primaryValue: 'To be determined',
        complexity: 'Medium',
        complexityReason: 'Professional on-site inspection recommended for accurate estimate',
        workType: workTypeLabels[detectedCategory] || detectedCategory
      };
      setJobDetails(fallbackJobDetails);
      
      speakGuidance("I've received your photos. Based on your project type, I estimate this would cost between $500 and $2,500. Keep in mind, this is just an estimate based on the photos. A contractor will need to visit in person to give you an accurate quote. Prices can vary based on what they find on-site. Does this initial estimate fit your budget?");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle budget confirmation
  const handleBudgetConfirm = async (confirmed: boolean) => {
    // Reset timeframe and contractors state to ensure fresh flow
    setPreferredTimeframe(null);
    setShowContractors(false);
    setBudgetConfirmed(confirmed);
    setCustomerBudgetMin('');
    setCustomerBudgetMax('');
    setBudgetReason('');
    
    if (confirmed) {
      // Ask about timeframe before showing contractors
      speakGuidance("Excellent! That's great to hear this fits your budget. Are you ready to have your work completed now, or would you like to pick a specific date?");
      
      // Generate after preview for visualization
      if (previewUrls.length > 0 && !afterPreviewUrl) {
        generateAfterPreview();
      }
    } else {
      speakGuidance("No problem! Please enter your budget range and we'll match you with contractors who can work within it.");
    }
  };
  
  // Handle timeframe selection
  const handleTimeframeSelect = (timeframe: string) => {
    setPreferredTimeframe(timeframe);
    setShowContractors(true);
    
    if (timeframe === 'ready_now') {
      speakGuidance("Perfect! You're ready to get started right away. A contractor will be in contact with you shortly to schedule your project.");
    } else {
      speakGuidance(`Perfect! You've selected ${timeframe}. A contractor will be in contact with you shortly to schedule your project.`);
    }
  };

  // Generate AI "after" preview image
  const generateAfterPreview = async () => {
    if (!previewUrls.length || !request.photos.length) return;
    
    setIsGeneratingPreview(true);
    try {
      const firstPhoto = request.photos[0];
      const reader = new FileReader();
      
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const response = await fetch('/api/workhub/generate-after-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            jobType: request.category || aiAnalysis?.detectedCategory || 'general',
            issues: aiAnalysis?.identifiedIssues || []
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setAfterPreviewUrl(data.afterImageUrl);
          speakGuidance("I've generated a preview of how your project could look when completed.");
        }
      };
      
      reader.readAsDataURL(firstPhoto);
    } catch (error) {
      console.error('After preview generation error:', error);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Submit customer request to backend
  const submitCustomerRequest = async () => {
    if (!request.contact.name || !request.contact.email) {
      speakGuidance("Please provide your name and email so contractors can reach you.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Use enhanced contractor matching endpoint if scheduling is confirmed
      const apiEndpoint = schedulingConfirmed 
        ? '/api/workhub/match-contractors' 
        : '/api/workhub/submissions';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workType: request.category || aiAnalysis?.detectedCategory || 'general',
          customerName: request.contact.name,
          email: request.contact.email,
          phone: request.contact.phone,
          address: request.location.address,
          city: request.location.city,
          state: request.location.state,
          zip: request.location.zip,
          description: request.description,
          photoUrls: previewUrls,
          aiAnalysis: aiAnalysis,
          estimatedPrice: aiAnalysis?.estimatedPriceRange ? {
            min: aiAnalysis.estimatedPriceRange.min,
            max: aiAnalysis.estimatedPriceRange.max
          } : null,
          budgetConfirmed,
          budgetReason: budgetReason || null,
          customerBudget: customerBudgetMin && customerBudgetMax ? {
            min: parseInt(customerBudgetMin),
            max: parseInt(customerBudgetMax)
          } : null,
          afterPreviewUrl,
          matchedContractors: aiAnalysis?.contractors || [],
          urgency: request.preferences.urgency,
          preferredTimeframe: preferredTimeframe || null,
          preferredDate: preferredDate || null,
          jobDetails: jobDetails || null,
          estimateDateFrom: estimateDateFrom || null,
          estimateDateTo: estimateDateTo || null,
          estimateTimePreference: estimateTimePreference || 'any',
          desiredQuoteCount: desiredQuoteCount || 1,
          jobCompletionDate: jobCompletionDate || null,
          // Upsell add-ons selected by customer
          selectedUpsells: selectedUpsells.length > 0 ? selectedUpsells.map(id => {
            const upsell = UPSELL_OPTIONS[request.category]?.find(u => u.id === id);
            return upsell ? { id: upsell.id, name: upsell.name, price: upsell.price } : null;
          }).filter(Boolean) : [],
          upsellTotal: upsellTotal
        }),
      });
      
      if (response.ok) {
        const submissionData = await response.json();
        
        // If customer confirmed budget, distribute lead to subscribed contractors
        if (budgetConfirmed && aiAnalysis?.estimatedPriceRange) {
          try {
            await fetch('/api/workhub/distribute-lead', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                submissionId: submissionData.submission?.id || submissionData.id,
                customerName: request.contact.name,
                customerEmail: request.contact.email,
                customerPhone: request.contact.phone,
                customerAddress: request.location.address,
                customerCity: request.location.city,
                customerState: request.location.state,
                customerZip: request.location.zip,
                workType: request.category || aiAnalysis?.detectedCategory || 'general',
                description: request.description,
                photoUrls: previewUrls,
                afterImageUrl: afterPreviewUrl,
                estimateLow: aiAnalysis.estimatedPriceRange.min,
                estimateHigh: aiAnalysis.estimatedPriceRange.max,
                estimatedDescription: aiAnalysis.summary || null,
                customerBudgetMin: customerBudgetMin ? parseInt(customerBudgetMin) : null,
                customerBudgetMax: customerBudgetMax ? parseInt(customerBudgetMax) : null,
                urgency: request.preferences.urgency,
                preferredTimeframe: preferredTimeframe || null,
                // Upsell opportunities for contractors
                selectedUpsells: selectedUpsells.length > 0 ? selectedUpsells.map(id => {
                  const upsell = UPSELL_OPTIONS[request.category]?.find(u => u.id === id);
                  return upsell ? { id: upsell.id, name: upsell.name, price: upsell.price } : null;
                }).filter(Boolean) : [],
                upsellTotal: upsellTotal
              }),
            });
            console.log('Lead distributed to subscribed contractors');
          } catch (leadError) {
            console.error('Lead distribution error:', leadError);
          }
        }
        
        setSubmissionComplete(true);
        speakGuidance(budgetConfirmed 
          ? "Your request has been submitted! Qualified contractors in your area will contact you shortly."
          : "Your request has been submitted. Our team will review options that fit your budget."
        );
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      speakGuidance("There was an issue submitting your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (step / 4) * 100;

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">What type of work do you need?</h2>
              <p className="text-slate-600 dark:text-slate-400">Select the category that best matches your project</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {SERVICE_CATEGORIES.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setRequest(prev => ({ ...prev, category: category.id }));
                    speakGuidance(`${category.name} selected. ${category.description}`);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all text-left relative ${
                    request.category === category.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                  }`}
                  data-testid={`category-${category.id}`}
                >
                  <category.icon className={`w-8 h-8 mb-2 ${
                    request.category === category.id ? 'text-purple-600' : 'text-slate-500'
                  }`} />
                  <p className="font-semibold text-slate-900 dark:text-white">{category.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{category.description}</p>
                  {request.category === category.id && (
                    <CheckCircle className="w-5 h-5 text-purple-600 absolute top-2 right-2" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 2:
        // Step 2: Your Information (Contact + Location combined)
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Your Information</h2>
              <p className="text-slate-600 dark:text-slate-400">We need a few details to get you accurate local pricing</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    placeholder="John Smith"
                    value={request.contact.name}
                    onChange={(e) => setRequest(prev => ({
                      ...prev,
                      contact: { ...prev.contact, name: e.target.value }
                    }))}
                    data-testid="input-name"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number *</Label>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={request.contact.phone}
                      onChange={(e) => setRequest(prev => ({
                        ...prev,
                        contact: { ...prev.contact, phone: e.target.value }
                      }))}
                      data-testid="input-phone"
                    />
                  </div>
                  <div>
                    <Label>Email Address *</Label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={request.contact.email}
                      onChange={(e) => setRequest(prev => ({
                        ...prev,
                        contact: { ...prev.contact, email: e.target.value }
                      }))}
                      data-testid="input-email"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  Project Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Street Address</Label>
                  <Input
                    placeholder="123 Main Street"
                    value={request.location.address}
                    onChange={(e) => setRequest(prev => ({
                      ...prev,
                      location: { ...prev.location, address: e.target.value }
                    }))}
                    data-testid="input-address"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>City *</Label>
                    <Input
                      placeholder="Atlanta"
                      value={request.location.city}
                      onChange={(e) => setRequest(prev => ({
                        ...prev,
                        location: { ...prev.location, city: e.target.value }
                      }))}
                      data-testid="input-city"
                    />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Input
                      placeholder="GA"
                      value={request.location.state}
                      onChange={(e) => setRequest(prev => ({
                        ...prev,
                        location: { ...prev.location, state: e.target.value }
                      }))}
                      data-testid="input-state"
                    />
                  </div>
                  <div>
                    <Label>ZIP Code</Label>
                    <Input
                      placeholder="30301"
                      value={request.location.zip}
                      onChange={(e) => setRequest(prev => ({
                        ...prev,
                        location: { ...prev.location, zip: e.target.value }
                      }))}
                      data-testid="input-zip"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Location helps us provide accurate pricing for your area
                </p>
              </CardContent>
            </Card>

          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Upload Photos & Videos</h2>
              <p className="text-slate-600 dark:text-slate-400">AI will analyze your project and identify the work needed</p>
            </div>

            <Card className="border-2 border-dashed border-purple-300 bg-purple-50/50 dark:bg-purple-900/10">
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="flex justify-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Video className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                  
                  <input
                    type="file"
                    id="photo-upload"
                    multiple
                    accept="image/*,video/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <label htmlFor="photo-upload">
                    <Button asChild className="mb-4" data-testid="button-upload-photos">
                      <span>
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Photos or Videos
                      </span>
                    </Button>
                  </label>
                  <p className="text-sm text-slate-500">
                    Drag & drop or click to upload • Up to 20 photos/videos
                  </p>
                </div>
              </CardContent>
            </Card>

            {previewUrls.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{previewUrls.length} files uploaded</h3>
                  <Button 
                    onClick={handleAnalyzePhotos} 
                    disabled={isAnalyzing}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600"
                    data-testid="button-analyze-photos"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        AI Analyze
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border">
                      <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-green-300 bg-green-50 dark:bg-green-900/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Sparkles className="w-5 h-5" />
                      AI Analysis Complete
                      <Badge className="ml-auto bg-green-600">{aiAnalysis.aiConfidence}% Confident</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Identified Issues</p>
                        <ul className="space-y-1">
                          {aiAnalysis.identifiedIssues.map((issue: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-500">Estimated Price Range</p>
                          <p className="text-2xl font-bold text-green-700">
                            ${aiAnalysis.estimatedPriceRange.min.toLocaleString()} - ${aiAnalysis.estimatedPriceRange.max.toLocaleString()}
                          </p>
                          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md">
                            <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1">
                              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>This is an AI estimate based on your photos. A contractor will visit in person to give you the final quote. Prices may vary based on site conditions.</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <p className="text-sm text-slate-500">Complexity</p>
                            <Badge 
                              variant="outline" 
                              className={aiAnalysis.complexity === 'high' ? 'border-red-500 text-red-600' : aiAnalysis.complexity === 'moderate' ? 'border-amber-500 text-amber-600' : ''}
                            >
                              {aiAnalysis.complexity}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Time Estimate</p>
                            <Badge variant="outline">{aiAnalysis.timeEstimate}</Badge>
                          </div>
                        </div>
                        
                        {/* Hazard Warnings */}
                        {aiAnalysis.isHazardous && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                            <p className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-1">
                              <AlertCircle className="w-4 h-4" />
                              Hazard Detected
                            </p>
                            <ul className="text-sm text-red-600 dark:text-red-300 space-y-1">
                              {aiAnalysis.hazards?.powerlines && (
                                <li className="flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  Power lines involved - requires utility coordination
                                </li>
                              )}
                              {aiAnalysis.hazards?.nearStructure && (
                                <li className="flex items-center gap-1">
                                  <Home className="w-3 h-3" />
                                  Near structures - careful work required
                                </li>
                              )}
                              {aiAnalysis.hazards?.accessDifficult && (
                                <li className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  Difficult access - may affect pricing
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Measurements Section */}
                    {measurements && (
                      <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-purple-600" />
                          AI-Estimated Dimensions
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {measurements.sqft && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{measurements.sqft}</p>
                              <p className="text-xs text-slate-500">Square Feet</p>
                            </div>
                          )}
                          {measurements.linearFt && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{measurements.linearFt}</p>
                              <p className="text-xs text-slate-500">Linear Feet</p>
                            </div>
                          )}
                          {measurements.heightFt && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{measurements.heightFt}</p>
                              <p className="text-xs text-slate-500">Height (ft)</p>
                            </div>
                          )}
                          {measurements.widthFt && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{measurements.widthFt}</p>
                              <p className="text-xs text-slate-500">Width (ft)</p>
                            </div>
                          )}
                          {measurements.estimatedWeightLb && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{measurements.estimatedWeightLb.toLocaleString()}</p>
                              <p className="text-xs text-slate-500">Est. Weight (lbs)</p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          AI confidence: {Math.round((measurements.confidence || 0.7) * 100)}% - Final measurements verified on-site
                        </p>
                      </div>
                    )}

                    {/* Professional Tree Pricing Breakdown - ChatGPT-level detail */}
                    {treePricing && (aiAnalysis?.detectedCategory === 'tree' || aiAnalysis?.detectedCategory === 'tree_removal') && (
                      <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <AlertTriangle className={`w-5 h-5 ${
                            treePricing.riskLevel === 'extreme' ? 'text-red-600' :
                            treePricing.riskLevel === 'high' ? 'text-orange-500' :
                            treePricing.riskLevel === 'medium' ? 'text-amber-500' : 'text-green-500'
                          }`} />
                          Professional Risk Assessment
                        </h4>
                        
                        {/* Risk Level Badge */}
                        <div className="mb-4">
                          <Badge className={`text-sm px-3 py-1 ${
                            treePricing.riskLevel === 'extreme' ? 'bg-red-600 text-white' :
                            treePricing.riskLevel === 'high' ? 'bg-orange-500 text-white' :
                            treePricing.riskLevel === 'medium' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'
                          }`} data-testid="tree-risk-level">
                            {treePricing.riskLevel.toUpperCase()} RISK REMOVAL
                          </Badge>
                        </div>

                        {/* Warnings */}
                        {treePricing.warnings && treePricing.warnings.length > 0 && (
                          <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="font-semibold text-red-700 dark:text-red-400 text-sm mb-2 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Important Safety Considerations
                            </p>
                            <ul className="space-y-1">
                              {treePricing.warnings.map((warning, idx) => (
                                <li key={idx} className="text-sm text-red-600 dark:text-red-300 flex items-start gap-2">
                                  <span className="text-red-400 mt-0.5">•</span>
                                  {warning}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Hazard Factors */}
                        {treePricing.breakdown.hazardPremium.factors.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Complexity Factors Affecting Price:</p>
                            <div className="flex flex-wrap gap-2">
                              {treePricing.breakdown.hazardPremium.factors.map((factor, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs bg-amber-50 dark:bg-amber-900/20 border-amber-300">
                                  {factor}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Detailed Cost Breakdown - Note: tree pricing values are in cents, convert to dollars */}
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <h5 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Detailed Price Breakdown</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Base Removal ({treePricing.breakdown.baseRemoval.description})</span>
                              <span className="font-medium">${Math.round(treePricing.breakdown.baseRemoval.min / 100).toLocaleString()} - ${Math.round(treePricing.breakdown.baseRemoval.max / 100).toLocaleString()}</span>
                            </div>
                            {treePricing.breakdown.hazardPremium.min > 0 && (
                              <div className="flex justify-between text-orange-600 dark:text-orange-400">
                                <span>Risk/Hazard Premium</span>
                                <span className="font-medium">+ ${Math.round(treePricing.breakdown.hazardPremium.min / 100).toLocaleString()} - ${Math.round(treePricing.breakdown.hazardPremium.max / 100).toLocaleString()}</span>
                              </div>
                            )}
                            {treePricing.breakdown.equipmentCost.min > 0 && (
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">{treePricing.breakdown.equipmentCost.equipment}</span>
                                <span className="font-medium">+ ${Math.round(treePricing.breakdown.equipmentCost.min / 100).toLocaleString()} - ${Math.round(treePricing.breakdown.equipmentCost.max / 100).toLocaleString()}</span>
                              </div>
                            )}
                            {treePricing.breakdown.utilityCoordination && (
                              <div className="flex justify-between text-blue-600 dark:text-blue-400">
                                <span>Utility Coordination</span>
                                <span className="font-medium">+ ${Math.round(treePricing.breakdown.utilityCoordination.min / 100).toLocaleString()} - ${Math.round(treePricing.breakdown.utilityCoordination.max / 100).toLocaleString()}</span>
                              </div>
                            )}
                            {treePricing.breakdown.stumpGrinding && (
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Stump Grinding</span>
                                <span className="font-medium">+ ${Math.round(treePricing.breakdown.stumpGrinding.min / 100).toLocaleString()} - ${Math.round(treePricing.breakdown.stumpGrinding.max / 100).toLocaleString()}</span>
                              </div>
                            )}
                            {treePricing.breakdown.haulOff && (
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Debris Haul-Off</span>
                                <span className="font-medium">+ ${Math.round(treePricing.breakdown.haulOff.min / 100).toLocaleString()} - ${Math.round(treePricing.breakdown.haulOff.max / 100).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Crew Information */}
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                            <Users className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{treePricing.crewInfo.crewSize}</p>
                            <p className="text-xs text-slate-500">Crew Members</p>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                            <Clock className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{treePricing.crewInfo.estimatedHours}+</p>
                            <p className="text-xs text-slate-500">Hours</p>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                            <DollarSign className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">${Math.round(treePricing.crewInfo.laborRate / 100)}</p>
                            <p className="text-xs text-slate-500">/hr per person</p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          This is a professional-grade estimate. Actual price confirmed after on-site inspection.
                        </p>
                      </div>
                    )}

                    {/* Material Selection Section */}
                    {materialOptions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <Settings className="w-4 h-4 text-blue-600" />
                          Choose Your Materials
                        </h4>
                        <div className="space-y-2">
                          {materialOptions.map((material: any) => (
                            <motion.div
                              key={material.id}
                              whileHover={{ scale: 1.01 }}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedMaterial?.id === material.id
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-slate-200 hover:border-blue-300 bg-white dark:bg-slate-800'
                              }`}
                              onClick={() => {
                                setSelectedMaterial(material);
                                setPricingBreakdown({
                                  materialCost: material.materialCost,
                                  laborCost: material.laborCost,
                                  totalCost: material.totalCost
                                });
                              }}
                              data-testid={`material-option-${material.id}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-4 h-4 rounded-full border-2 ${
                                    selectedMaterial?.id === material.id
                                      ? 'bg-blue-500 border-blue-500'
                                      : 'border-slate-300'
                                  }`}>
                                    {selectedMaterial?.id === material.id && (
                                      <CheckCircle className="w-4 h-4 text-white -m-0.5" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                      {material.name}
                                      {material.isRecommended && (
                                        <Badge className="bg-amber-500 text-xs">Recommended</Badge>
                                      )}
                                    </p>
                                    <p className="text-sm text-slate-500">{material.description}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg text-blue-600">
                                    ${(material.totalCost / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                  </p>
                                  <p className="text-xs text-slate-500">Total est.</p>
                                </div>
                              </div>
                              <div className="mt-2 flex gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {material.grade}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  ~{material.estimatedHours} hrs
                                </Badge>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Pricing Breakdown */}
                        {pricingBreakdown && selectedMaterial && (
                          <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h5 className="font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              Your Pricing Breakdown
                            </h5>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Materials ({selectedMaterial.name})</span>
                                <span className="font-medium">${(pricingBreakdown.materialCost / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Labor & Installation</span>
                                <span className="font-medium">${(pricingBreakdown.laborCost / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="border-t border-blue-200 dark:border-blue-700 pt-2 mt-2">
                                <div className="flex justify-between">
                                  <span className="font-semibold text-blue-800 dark:text-blue-300">Estimated Total</span>
                                  <span className="font-bold text-xl text-blue-700 dark:text-blue-400">
                                    ${(pricingBreakdown.totalCost / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Price based on AI estimates. Final quote provided after inspection.
                            </p>
                          </div>
                        )}
                        
                        {/* Upsell Section - Helps contractors maximize job value */}
                        {UPSELL_OPTIONS[request.category] && UPSELL_OPTIONS[request.category].length > 0 && (
                          <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                            <h5 className="font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                              <Star className="w-4 h-4" />
                              Would You Like to Add Any of These Services?
                            </h5>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                              Many homeowners choose these popular add-ons to complete their project
                            </p>
                            
                            <div className="space-y-2">
                              {UPSELL_OPTIONS[request.category].map((upsell) => (
                                <motion.div
                                  key={upsell.id}
                                  whileHover={{ scale: 1.01 }}
                                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    selectedUpsells.includes(upsell.id)
                                      ? 'border-amber-500 bg-amber-100 dark:bg-amber-900/30'
                                      : 'border-slate-200 hover:border-amber-300 bg-white dark:bg-slate-800'
                                  }`}
                                  onClick={() => {
                                    const isSelected = selectedUpsells.includes(upsell.id);
                                    const newUpsells = isSelected
                                      ? selectedUpsells.filter(id => id !== upsell.id)
                                      : [...selectedUpsells, upsell.id];
                                    setSelectedUpsells(newUpsells);
                                    
                                    const newTotal = newUpsells.reduce((sum, id) => {
                                      const opt = UPSELL_OPTIONS[request.category]?.find(u => u.id === id);
                                      return sum + (opt?.price || 0);
                                    }, 0);
                                    setUpsellTotal(newTotal);
                                  }}
                                  data-testid={`upsell-option-${upsell.id}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                                        selectedUpsells.includes(upsell.id)
                                          ? 'bg-amber-500 border-amber-500'
                                          : 'border-slate-300'
                                      }`}>
                                        {selectedUpsells.includes(upsell.id) && (
                                          <CheckCircle className="w-4 h-4 text-white" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                          {upsell.name}
                                          {upsell.recommended && (
                                            <Badge className="bg-amber-500 text-xs">Popular</Badge>
                                          )}
                                        </p>
                                        <p className="text-xs text-slate-500">{upsell.description}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-amber-600">+${upsell.price}</p>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                            
                            {/* Upsell Total */}
                            {selectedUpsells.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-amber-800 dark:text-amber-300">
                                    Add-on Services ({selectedUpsells.length} selected)
                                  </span>
                                  <span className="font-bold text-lg text-amber-700 dark:text-amber-400">
                                    +${upsellTotal.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-amber-200 dark:border-amber-700">
                                  <span className="font-bold text-amber-800 dark:text-amber-300">
                                    New Estimated Total
                                  </span>
                                  <span className="font-bold text-xl text-green-600">
                                    ${((pricingBreakdown?.totalCost || 0) / 100 + upsellTotal).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Job Details Section - Shows AI analysis for any work type */}
                    {jobDetails && (
                      <div className="mt-6 pt-4 border-t border-emerald-200 dark:border-emerald-800">
                        <Card className="border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                              <Sparkles className="w-5 h-5" />
                              AI {jobDetails.workType} Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-emerald-100">
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{jobDetails.workType} Type</p>
                                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{jobDetails.itemType}</p>
                              </div>
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-emerald-100">
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{jobDetails.primaryMeasurement}</p>
                                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{jobDetails.primaryValue}</p>
                              </div>
                              {jobDetails.secondaryMeasurement && (
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-emerald-100">
                                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{jobDetails.secondaryMeasurement}</p>
                                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{jobDetails.secondaryValue}</p>
                                </div>
                              )}
                              {jobDetails.additionalInfo && (
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-emerald-100">
                                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Additional Info</p>
                                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{jobDetails.additionalInfo}</p>
                                </div>
                              )}
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-emerald-100">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Job Complexity</p>
                                <Badge className={`${
                                  jobDetails.complexity.toLowerCase() === 'high' || jobDetails.complexity.toLowerCase() === 'severe' 
                                    ? 'bg-red-500' 
                                    : jobDetails.complexity.toLowerCase() === 'medium' || jobDetails.complexity.toLowerCase() === 'moderate'
                                    ? 'bg-amber-500'
                                    : 'bg-green-500'
                                }`}>
                                  {jobDetails.complexity}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{jobDetails.complexityReason}</p>
                            </div>
                            
                            {/* Equipment/Crew for tree jobs */}
                            {jobDetails.equipmentNeeded && jobDetails.equipmentNeeded.length > 0 && (
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-emerald-100">
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Equipment Required</p>
                                <div className="flex flex-wrap gap-2">
                                  {jobDetails.equipmentNeeded.map((equip, idx) => (
                                    <Badge key={idx} variant="outline" className="text-emerald-700 border-emerald-300">
                                      {equip}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {jobDetails.crewSize && (
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-emerald-100">
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Crew Size</p>
                                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{jobDetails.crewSize} Workers</p>
                                {jobDetails.estimatedHours && (
                                  <p className="text-sm text-slate-500 mt-1">Estimated duration: {jobDetails.estimatedHours} hours</p>
                                )}
                              </div>
                            )}
                            
                            {/* Questions prompt */}
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
                              <div className="flex items-start gap-3">
                                <MessageCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                                <div>
                                  <p className="font-semibold text-purple-800 dark:text-purple-300">Questions about this estimate?</p>
                                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                                    Click the chat button in the bottom right to ask Evelyn about pricing, materials, what's included, or anything else!
                                  </p>
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-800">
                                      "Why does it cost this much?"
                                    </Badge>
                                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-800">
                                      "What materials do you recommend?"
                                    </Badge>
                                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-800">
                                      "Can I get it cheaper?"
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
                    {/* Budget Confirmation Section */}
                    {budgetConfirmed === null && (
                      <div className="mt-6 pt-4 border-t border-green-200 dark:border-green-800">
                        <div className="text-center space-y-4">
                          <h4 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center justify-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            AI Estimate Range
                          </h4>
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800 max-w-md mx-auto">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                              Based on your photos, here's our estimate:
                            </p>
                            <div className="flex items-center justify-center gap-4">
                              <div className="text-center">
                                <p className="text-xs text-slate-500 uppercase">Low End</p>
                                <p className="text-2xl font-bold text-green-600">${aiAnalysis.estimatedPriceRange.min.toLocaleString()}</p>
                              </div>
                              <div className="text-slate-400">—</div>
                              <div className="text-center">
                                <p className="text-xs text-slate-500 uppercase">High End</p>
                                <p className="text-2xl font-bold text-green-600">${aiAnalysis.estimatedPriceRange.max.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-700 mt-3">
                              <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>
                                  <strong>This is a ballpark estimate.</strong> Prices are subject to change once a contractor inspects the job in person. The final quote may be lower or higher depending on actual conditions.
                                </span>
                              </p>
                            </div>
                          </div>
                          <p className="text-lg text-slate-700 dark:text-slate-300 max-w-md mx-auto font-medium">
                            Will this fit your budget?
                          </p>
                          <div className="flex justify-center gap-4">
                            <Button
                              onClick={() => handleBudgetConfirm(true)}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-3 text-lg"
                              data-testid="button-budget-yes"
                            >
                              <ThumbsUp className="w-5 h-5 mr-2" />
                              Yes
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleBudgetConfirm(false)}
                              className="px-8 py-3 text-lg"
                              data-testid="button-budget-no"
                            >
                              No
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Budget Declined - Ask for their budget range */}
                    {budgetConfirmed === false && preferredTimeframe === null && (
                      <div className="mt-6 pt-4 border-t border-amber-200 dark:border-amber-800">
                        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10">
                          <CardContent className="pt-4 space-y-4">
                            <h4 className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              What is your budget?
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Enter your budget range and we'll match you with contractors who can work within it.
                            </p>
                            <div className="flex items-center gap-4 justify-center">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold text-slate-700">$</span>
                                <Input
                                  type="number"
                                  placeholder="Min"
                                  value={customerBudgetMin}
                                  onChange={(e) => setCustomerBudgetMin(e.target.value)}
                                  className="w-28 text-center text-lg font-semibold"
                                  data-testid="input-budget-min"
                                />
                              </div>
                              <span className="text-slate-400 font-medium">to</span>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold text-slate-700">$</span>
                                <Input
                                  type="number"
                                  placeholder="Max"
                                  value={customerBudgetMax}
                                  onChange={(e) => setCustomerBudgetMax(e.target.value)}
                                  className="w-28 text-center text-lg font-semibold"
                                  data-testid="input-budget-max"
                                />
                              </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>
                                  We'll only send your request to contractors who can work within your budget range.
                                </span>
                              </p>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setBudgetConfirmed(null)}
                                data-testid="button-budget-back"
                              >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                              </Button>
                              <Button
                                onClick={() => {
                                  setBudgetReason(`Budget: $${customerBudgetMin} - $${customerBudgetMax}`);
                                  speakGuidance("Great! Now when would you like this work completed?");
                                }}
                                disabled={!customerBudgetMin || !customerBudgetMax}
                                className="bg-gradient-to-r from-amber-600 to-orange-600"
                                data-testid="button-submit-budget-range"
                              >
                                Continue
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
                    {/* Step 1: Estimate Date Range - Shows after budget confirmed */}
                    {((budgetConfirmed === true) || (budgetConfirmed === false && budgetReason)) && !estimateDateFrom && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 pt-4 border-t border-purple-200 dark:border-purple-800"
                      >
                        <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                              <Calendar className="w-5 h-5" />
                              When would you like a contractor to come give you an estimate?
                            </CardTitle>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Select a date range that works for you
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">From Date</Label>
                                <Input
                                  type="date"
                                  value={estimateDateFrom}
                                  onChange={(e) => setEstimateDateFrom(e.target.value)}
                                  min={new Date().toISOString().split('T')[0]}
                                  className="mt-1"
                                  data-testid="input-estimate-date-from"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium">To Date</Label>
                                <Input
                                  type="date"
                                  value={estimateDateTo}
                                  onChange={(e) => setEstimateDateTo(e.target.value)}
                                  min={estimateDateFrom || new Date().toISOString().split('T')[0]}
                                  className="mt-1"
                                  data-testid="input-estimate-date-to"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Preferred Time of Day</Label>
                              <div className="grid grid-cols-4 gap-2 mt-2">
                                {[
                                  { id: 'morning', label: 'Morning', time: '8am-12pm' },
                                  { id: 'afternoon', label: 'Afternoon', time: '12pm-5pm' },
                                  { id: 'evening', label: 'Evening', time: '5pm-8pm' },
                                  { id: 'any', label: 'Any Time', time: 'Flexible' }
                                ].map((time) => (
                                  <button
                                    key={time.id}
                                    type="button"
                                    onClick={() => setEstimateTimePreference(time.id)}
                                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                                      estimateTimePreference === time.id
                                        ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/30'
                                        : 'border-slate-200 hover:border-purple-300'
                                    }`}
                                    data-testid={`time-${time.id}`}
                                  >
                                    <p className="font-medium text-sm">{time.label}</p>
                                    <p className="text-xs text-slate-500">{time.time}</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* Step 2: Quote Count - Shows after date range selected with "Continue" button */}
                    {estimateDateFrom && !estimateDateTo && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4"
                      >
                        <div className="flex justify-end">
                          <Button
                            onClick={() => {
                              if (!estimateDateTo) {
                                setEstimateDateTo(estimateDateFrom);
                              }
                              speakGuidance("Great! Now how many estimates would you like?");
                            }}
                            disabled={!estimateDateFrom}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600"
                            data-testid="button-continue-dates"
                          >
                            Continue
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Quote Count - Shows after date range selected */}
                    {estimateDateFrom && estimateDateTo && desiredQuoteCount === null && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-800"
                      >
                        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                              <Users className="w-5 h-5" />
                              How many estimates would you like?
                            </CardTitle>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              We'll match you with the best-rated contractors in your area
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                              {[1, 2, 3].map((count) => (
                                <motion.button
                                  key={count}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setDesiredQuoteCount(count);
                                    speakGuidance(`Great choice! ${count === 1 ? 'One contractor' : `${count} contractors`} will come to give you an estimate. Now, when would you like the work to be completed?`);
                                  }}
                                  className="p-6 rounded-xl border-2 border-blue-200 hover:border-blue-400 bg-white dark:bg-slate-800 text-center transition-all hover:shadow-lg"
                                  data-testid={`quote-count-${count}`}
                                >
                                  <p className="text-4xl font-bold text-blue-600 mb-2">{count}</p>
                                  <p className="font-medium text-slate-700 dark:text-slate-300">
                                    {count === 1 ? 'Estimate' : 'Estimates'}
                                  </p>
                                </motion.button>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* Step 3: Job Completion Date - Shows after quote count selected */}
                    {desiredQuoteCount !== null && !jobCompletionDate && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 pt-4 border-t border-amber-200 dark:border-amber-800"
                      >
                        <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                              <Calendar className="w-5 h-5" />
                              When would you like the work to be completed?
                            </CardTitle>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              We'll share this with contractors so they can plan accordingly
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Input
                              type="date"
                              value={jobCompletionDate}
                              onChange={(e) => setJobCompletionDate(e.target.value)}
                              min={estimateDateTo || new Date().toISOString().split('T')[0]}
                              className="text-lg p-4"
                              data-testid="input-job-completion-date"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setDesiredQuoteCount(null)}
                                data-testid="button-completion-back"
                              >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                              </Button>
                              <Button
                                onClick={() => {
                                  setJobCompletionDate(jobCompletionDate);
                                  setSchedulingConfirmed(true);
                                  speakGuidance("Perfect! We're now matching you with contractors based on your budget, dates, and preferences. No worries about receiving tons of phone calls - we have you on the schedule. The contractor will come out to give you an estimate.");
                                }}
                                disabled={!jobCompletionDate}
                                className="bg-gradient-to-r from-amber-600 to-orange-600"
                                data-testid="button-confirm-completion"
                              >
                                Confirm & Find Contractors
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* Final Confirmation - Shows after all scheduling confirmed */}
                    {schedulingConfirmed && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 pt-4 border-t border-green-200 dark:border-green-800"
                      >
                        <Card className="border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                          <CardContent className="py-6">
                            <div className="text-center space-y-4">
                              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                              </div>
                              <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">
                                You're All Set!
                              </h3>
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 max-w-lg mx-auto">
                                <p className="text-blue-700 dark:text-blue-300 font-medium">
                                  No worries about receiving tons of phone calls - we have you on the schedule!
                                </p>
                                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                                  {desiredQuoteCount === 1 
                                    ? 'A contractor will come out to give you an estimate.'
                                    : `${desiredQuoteCount} contractors will come out to give you estimates.`}
                                </p>
                              </div>
                              <div className="grid md:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200">
                                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Estimate Appointment</p>
                                  <p className="text-sm text-purple-700 dark:text-purple-300">
                                    {new Date(estimateDateFrom).toLocaleDateString()} - {new Date(estimateDateTo).toLocaleDateString()}
                                    <br />
                                    <span className="text-xs">{estimateTimePreference === 'any' ? 'Any time' : estimateTimePreference}</span>
                                  </p>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200">
                                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">Work Completion By</p>
                                  <p className="text-sm text-amber-700 dark:text-amber-300">
                                    {new Date(jobCompletionDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                              {customerBudgetMin && customerBudgetMax && (
                                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg border border-green-300 inline-block">
                                  <p className="text-sm text-green-700 dark:text-green-300">
                                    <DollarSign className="w-4 h-4 inline mr-1" />
                                    Budget: <strong>${parseInt(customerBudgetMin).toLocaleString()} - ${parseInt(customerBudgetMax).toLocaleString()}</strong>
                                  </p>
                                </div>
                              )}
                              <p className="text-slate-500 text-sm max-w-md mx-auto">
                                We're notifying contractors now. They'll receive your photos, job details, budget, and preferred dates.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                    
                    {/* Before/After Preview Section - Show right after analysis */}
                    {previewUrls.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          Your Before & After Preview
                        </h4>
                        <p className="text-sm text-slate-500 mb-3">
                          See what your project could look like when completed!
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-red-600 text-center flex items-center justify-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Before (Your Photo)
                            </p>
                            <div className="aspect-video rounded-lg overflow-hidden border-2 border-red-200 shadow-md">
                              <img src={previewUrls[0]} alt="Before" className="w-full h-full object-cover" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-green-600 text-center flex items-center justify-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              After (AI Vision)
                            </p>
                            <div className="aspect-video rounded-lg overflow-hidden border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-md">
                              {isGeneratingPreview ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">AI is creating your preview...</p>
                                    <p className="text-xs text-slate-400 mt-1">This takes about 10-15 seconds</p>
                                  </div>
                                </div>
                              ) : afterPreviewUrl ? (
                                <>
                                  <img src={afterPreviewUrl} alt="After Preview" className="w-full h-full object-cover" />
                                </>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center p-4">
                                  <Button
                                    onClick={generateAfterPreview}
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                    data-testid="button-generate-preview"
                                  >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    See Completed Work Preview
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {afterPreviewUrl && (
                          <p className="text-xs text-slate-400 mt-3 text-center italic">
                            AI-generated preview for illustration only. Actual results may vary based on on-site conditions.
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Matched Contractors Section - Only show after timeframe selected */}
                    {showContractors && preferredTimeframe && aiAnalysis.contractors && aiAnalysis.contractors.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 pt-4 border-t border-green-200 dark:border-green-800"
                      >
                        <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Your Matched Contractors ({aiAnalysis.contractors.length})
                        </h4>
                        <p className="text-sm text-slate-500 mb-4">
                          {budgetConfirmed 
                            ? "These contractors will contact you to discuss your project and provide detailed quotes."
                            : "These contractors will review your budget situation and explore options with you."
                          }
                        </p>
                        <div className="grid gap-3">
                          {aiAnalysis.contractors.slice(0, 3).map((contractor: any, idx: number) => (
                            <div 
                              key={contractor.id || idx} 
                              className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 transition-all"
                              data-testid={`contractor-${contractor.id || idx}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                      <User className="w-6 h-6 text-purple-600" />
                                    </div>
                                    {contractor.availabilityStatus === 'ready' && (
                                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" title="Available Now" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">{contractor.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                      <span className="font-medium">{contractor.rating}</span>
                                      <span className="text-slate-400">•</span>
                                      <span>{contractor.reviews} reviews</span>
                                      {contractor.distance && (
                                        <>
                                          <span className="text-slate-400">•</span>
                                          <span>{contractor.distance} mi away</span>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {contractor.trades?.[0]?.replace(/_/g, ' ') || 'Contractor'}
                                      </Badge>
                                      {contractor.yearsExp && (
                                        <Badge variant="outline" className="text-xs">
                                          {contractor.yearsExp} yrs exp
                                        </Badge>
                                      )}
                                      {contractor.licensed && (
                                        <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                                          Licensed
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right space-y-1">
                                  {contractor.availabilityStatus === 'ready' ? (
                                    <Badge className="bg-green-500">
                                      <Zap className="w-3 h-3 mr-1" />
                                      Available Now
                                    </Badge>
                                  ) : contractor.availabilityStatus === 'busy' ? (
                                    <Badge className="bg-amber-500">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Busy
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-slate-500">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      Scheduled
                                    </Badge>
                                  )}
                                  {contractor.nextAvailable && (
                                    <p className="text-xs text-slate-500">
                                      Next: {contractor.nextAvailable}
                                    </p>
                                  )}
                                  {contractor.responseTime && (
                                    <p className="text-xs text-green-600 flex items-center justify-end gap-1">
                                      <MessageSquare className="w-3 h-3" />
                                      Responds {contractor.responseTime}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {aiAnalysis.contractors.length > 3 && (
                          <p className="text-sm text-center text-purple-600 mt-3">
                            +{aiAnalysis.contractors.length - 3} more contractors available
                          </p>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label>Describe Your Project (Optional)</Label>
              <Textarea
                placeholder="Any additional details about your project..."
                value={request.description}
                onChange={(e) => setRequest(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px]"
                data-testid="input-description"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Review & Submit</h2>
              <p className="text-slate-600 dark:text-slate-400">Confirm your project details</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hammer className="w-5 h-5 text-purple-600" />
                    Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category</span>
                    <span className="font-medium">
                      {SERVICE_CATEGORIES.find(c => c.id === request.category)?.name || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Photos</span>
                    <span className="font-medium">{request.photos.length} uploaded</span>
                  </div>
                  {aiAnalysis && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Est. Price Range</span>
                        <span className="font-medium text-green-600">
                          ${aiAnalysis.estimatedPriceRange.min} - ${aiAnalysis.estimatedPriceRange.max}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Complexity</span>
                        <Badge variant="outline">{aiAnalysis.complexity}</Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{request.location.address}</p>
                  <p>{request.location.city}, {request.location.state} {request.location.zip}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    Contact Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {request.contact.name}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {request.contact.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {request.contact.email}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-600" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Urgency</span>
                    <span className="capitalize">{request.preferences.urgency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduling</span>
                    <span className="capitalize">{request.preferences.schedulingOption}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimates</span>
                    <span className="capitalize">{request.preferences.estimatePreference}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Ready to Find Contractors!</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      AI will match you with verified contractors based on your project needs.
                      You'll receive estimates within 24 hours.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {submissionComplete ? (
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                <CardContent className="py-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                    Request Submitted Successfully!
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    {budgetConfirmed 
                      ? "Matched contractors will contact you within 24 hours."
                      : "Our team will review options that fit your budget."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Button 
                className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                onClick={submitCustomerRequest}
                disabled={isSubmitting}
                data-testid="button-submit-request"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6 mr-2" />
                    Submit Project Request
                  </>
                )}
              </Button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Link to="/workhub" className="text-purple-200 hover:text-white">
              WorkHub
            </Link>
            <ChevronRight className="w-4 h-4 text-purple-200" />
            <span>Submit Project</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Get Your Project Done</h1>
          <p className="text-purple-100">Upload photos, get AI analysis, and connect with verified contractors</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of 4</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                isVoiceActive 
                  ? stopVoice() 
                  : speakGuidance("I'm Evelyn, your AI assistant. I'll guide you through submitting your project request. Let's get started!");
              }}
            >
              {isVoiceActive ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between mt-2">
            {['Category', 'Your Info', 'Photos', 'Review'].map((label, idx) => (
              <span 
                key={label}
                className={`text-xs ${step > idx ? 'text-purple-600 font-medium' : 'text-slate-400'}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            disabled={step === 1}
            data-testid="button-prev-step"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Previous
          </Button>

          {step < 4 && (
            <Button
              onClick={() => setStep(prev => Math.min(4, prev + 1))}
              disabled={(step === 1 && !request.category) || (step === 2 && (!request.contact.name || !request.contact.phone || !request.contact.email || !request.location.city || !request.location.state))}
              data-testid="button-next-step"
            >
              Next Step
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>

      <ModuleAIAssistant 
        moduleName="Home Project Helper"
        moduleContext={`You are Evelyn, a friendly AI assistant helping homeowners with their home improvement projects. Speak conversationally and be helpful.

CURRENT PROJECT STATUS:
- Category: ${request.category ? SERVICE_CATEGORIES.find(c => c.id === request.category)?.name || request.category : 'Not selected yet'}
- Photos uploaded: ${request.photos.length}
- Location: ${request.location.city ? `${request.location.city}, ${request.location.state}` : 'Not entered yet'}
${aiAnalysis ? `
AI ANALYSIS RESULTS:
- Detected work type: ${aiAnalysis.detectedCategory || 'General'}
- Identified issues: ${aiAnalysis.identifiedIssues?.join(', ') || 'None identified'}
- Estimated price range: $${aiAnalysis.estimatedPriceRange?.min?.toLocaleString() || '500'} - $${aiAnalysis.estimatedPriceRange?.max?.toLocaleString() || '2,500'}
- Complexity: ${aiAnalysis.complexity || 'Medium'}
- Time estimate: ${aiAnalysis.timeEstimate || '1-3 days'}
` : ''}
${jobDetails ? `
JOB DETAILS:
- Work type: ${jobDetails.workType}
- Item: ${jobDetails.itemType || 'N/A'}
- ${jobDetails.primaryMeasurement || 'Scope'}: ${jobDetails.primaryValue || 'TBD'}
${jobDetails.secondaryMeasurement ? `- ${jobDetails.secondaryMeasurement}: ${jobDetails.secondaryValue}` : ''}
- Complexity reason: ${jobDetails.complexityReason || 'Standard job'}
${jobDetails.equipmentNeeded ? `
EQUIPMENT NEEDED:
${jobDetails.equipmentNeeded.join(', ')}` : ''}
${jobDetails.crewSize ? `
CREW REQUIREMENTS:
- Total crew: ${jobDetails.crewSize} workers
${jobDetails.crewBreakdown ? `- Climbers: ${jobDetails.crewBreakdown.climbers}
- Ground workers: ${jobDetails.crewBreakdown.groundWorkers}
${jobDetails.crewBreakdown.craneOperator ? `- Crane operator: ${jobDetails.crewBreakdown.craneOperator}` : ''}
${jobDetails.crewBreakdown.bucketTruckOperator ? `- Bucket truck operator: ${jobDetails.crewBreakdown.bucketTruckOperator}` : ''}` : ''}` : ''}
${jobDetails.debrisInfo ? `
DEBRIS HANDLING:
- Estimated volume: ${jobDetails.debrisInfo.volumeCuYd} cubic yards
- Disposal method: ${jobDetails.debrisInfo.disposalMethod}
- Number of loads: ${jobDetails.debrisInfo.estimatedLoads}` : ''}
${jobDetails.estimatedHours ? `- Estimated duration: ${jobDetails.estimatedHours} hours` : ''}
` : ''}

${request.category === 'flooring' && aiAnalysis ? `
FLOORING-SPECIFIC DETAILS:
- Square footage estimate: ${jobDetails?.primaryValue || 'Based on photos'}
- Flooring type detected: ${jobDetails?.itemType || 'TBD'}
- Subfloor assessment: May need inspection for hidden damage
- Common flooring options: Hardwood ($8-15/sqft installed), Laminate ($4-8/sqft), Vinyl/LVP ($5-10/sqft), Tile ($10-20/sqft), Carpet ($3-8/sqft)

FLOORING QUOTE FACTORS TO EXPLAIN:
1. Material quality - builder grade vs premium affects durability and look
2. Subfloor condition - repairs add $1-3/sqft if needed
3. Removal of old flooring - adds $1-2/sqft for disposal
4. Transitions and trim - baseboards, thresholds between rooms
5. Furniture moving - some contractors include, others charge extra
6. Pattern complexity - diagonal or herringbone costs more than straight lay
7. Moisture barriers - required for concrete subfloors
` : ''}
${request.category === 'roofing' && aiAnalysis ? `
ROOFING-SPECIFIC DETAILS:
- Roof area estimate: ${jobDetails?.primaryValue || 'Based on photos'}
- Roof type: ${jobDetails?.itemType || 'TBD'}

ROOFING QUOTE FACTORS TO EXPLAIN:
1. Material options - 3-tab shingles ($) vs architectural shingles ($$) vs metal ($$$)
2. Layers - removing old shingles adds to cost
3. Pitch/steepness - steeper roofs are harder to work on
4. Decking condition - damaged plywood needs replacement
5. Ventilation - ridge vents, soffit vents for attic airflow
6. Flashing - around chimneys, vents, skylights
` : ''}
${(request.category === 'tree' || request.category === 'tree_removal') && aiAnalysis ? `
TREE-SPECIFIC DETAILS:
- Tree dimensions: ${jobDetails?.primaryValue || 'Based on photos'} height, ${jobDetails?.secondaryValue || 'TBD'} width
- Equipment needed: ${jobDetails?.equipmentNeeded?.join(', ') || 'TBD based on size'}
- Crew requirements: ${jobDetails?.crewSize || 2} workers
- Debris handling: ${jobDetails?.debrisInfo?.volumeCuYd || 'TBD'} cubic yards

TREE QUOTE FACTORS TO EXPLAIN:
1. Tree height and diameter - larger trees need more equipment
2. Access - tight spaces, fences, or slopes add difficulty
3. Proximity to structures - near houses/power lines requires more care
4. Stump removal - usually separate cost, $100-400 per stump
5. Debris hauling - wood chips vs log sections vs full removal
6. Crane rental - required for very large trees, adds $500-1500
` : ''}
${request.category === 'hvac' && aiAnalysis ? `
HVAC-SPECIFIC DETAILS:
- System type: ${jobDetails?.itemType || 'TBD'}
- Units: ${jobDetails?.primaryValue || 'TBD'}

HVAC QUOTE FACTORS TO EXPLAIN:
1. System size (tonnage) - larger homes need bigger systems ($3,000-10,000+)
2. Efficiency rating (SEER) - higher efficiency costs more upfront but saves on bills
3. Ductwork condition - repairs or replacement adds $1,000-5,000
4. Refrigerant type - R-410A systems are standard, older R-22 requires special handling
5. Permits and inspections - required in most areas, adds $100-300
6. Thermostat upgrade - smart thermostats add $150-400
` : ''}
${request.category === 'electrical' && aiAnalysis ? `
ELECTRICAL-SPECIFIC DETAILS:
- Work type: ${jobDetails?.itemType || 'TBD'}
- Scope: ${jobDetails?.primaryValue || 'TBD'}

ELECTRICAL QUOTE FACTORS TO EXPLAIN:
1. Panel upgrade - 100A to 200A costs $1,500-3,000
2. Wiring condition - older homes may need rewiring ($8,000-15,000)
3. Permits required - electrical work always needs permits ($50-200)
4. Number of circuits - each new circuit costs $150-300
5. Outlet/switch count - basic outlets $75-200 each installed
6. GFCI/AFCI requirements - code requires in bathrooms, kitchens, bedrooms
` : ''}
${request.category === 'plumbing' && aiAnalysis ? `
PLUMBING-SPECIFIC DETAILS:
- Work type: ${jobDetails?.itemType || 'TBD'}
- Fixtures: ${jobDetails?.primaryValue || 'TBD'}

PLUMBING QUOTE FACTORS TO EXPLAIN:
1. Pipe material - PEX ($4-6/ft) vs copper ($8-12/ft)
2. Water heater type - tank ($800-1,500) vs tankless ($1,500-3,000)
3. Drain cleaning - snaking ($150-300) vs hydro jetting ($300-600)
4. Fixture quality - basic vs designer affects price significantly
5. Access difficulty - opening walls/floors adds labor costs
6. Permits - required for most plumbing work ($50-150)
` : ''}
${request.category === 'painting' && aiAnalysis ? `
PAINTING-SPECIFIC DETAILS:
- Area: ${jobDetails?.primaryValue || 'TBD'}
- Rooms: ${jobDetails?.secondaryValue || 'TBD'}

PAINTING QUOTE FACTORS TO EXPLAIN:
1. Paint quality - basic ($25-35/gal) vs premium ($50-80/gal)
2. Number of coats - typically 2 coats needed, dark colors may need 3
3. Prep work - patching, sanding, priming adds 30-50% to labor
4. Ceiling height - above 10ft requires ladders/scaffolding
5. Trim and doors - painting trim adds $2-4 per linear foot
6. Interior vs exterior - exterior costs more due to prep and durability needs
` : ''}
${request.category === 'concrete' && aiAnalysis ? `
CONCRETE-SPECIFIC DETAILS:
- Area: ${jobDetails?.primaryValue || 'TBD'}
- Thickness: ${jobDetails?.secondaryValue || 'TBD'}

CONCRETE QUOTE FACTORS TO EXPLAIN:
1. Thickness - standard 4" vs reinforced 6" for driveways
2. Finish type - broom finish ($) vs stamped/decorative ($$-$$$)
3. Demolition - removing old concrete adds $2-5 per sqft
4. Rebar/wire mesh - reinforcement adds $0.50-1.50 per sqft
5. Drainage/grading - proper slope prevents water issues
6. Curing time - 7 days before use, 28 days for full strength
` : ''}

WHAT YOU CAN HELP WITH:
1. Explain what type of work is needed based on photos
2. Answer questions about pricing estimates and what affects cost
3. Explain the repair/service process
4. Help decide on materials or options
5. Answer general home improvement questions
6. Explain what contractors will do
7. Help with scheduling and timeline questions

IMPORTANT REMINDERS WHEN ANSWERING QUOTE QUESTIONS:
- Always remind customers that the AI estimate is based on photos only
- Explain that a contractor will visit in person to give the final quote
- Be transparent about what could make the price go up or down
- Help customers understand what's included vs what might be extra
- If they ask "why is it so expensive" - break down labor, materials, equipment costs
- If they ask "can I get it cheaper" - explain DIY options or material alternatives

Be friendly, use simple language (avoid jargon), and always offer to explain anything the homeowner doesn't understand. If they ask about something you can see in their photos/analysis, reference that specific information.`}
      />
    </div>
  );
}
