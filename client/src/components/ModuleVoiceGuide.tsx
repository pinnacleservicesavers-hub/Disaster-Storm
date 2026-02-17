import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MODULE_SCRIPTS: Record<string, string> = {
  'storm-ops-dashboard': `Welcome to the Storm Operations Dashboard. I'm Rachel, your AI guide. This is your central command center for all active storm response operations. Here you can monitor live storm events, track deployed crews, view real-time damage reports, and coordinate your entire response effort from one screen. The dashboard shows active storms with severity levels, crew deployment status, job completion rates, and revenue tracking. Use the quick action buttons to dispatch crews, create new jobs, or generate reports. The live feed shows incoming alerts and field updates from your teams in real-time.`,

  'storm-lead-command': `Welcome to Storm Lead Command. I'm Rachel. This module is your strategic headquarters for converting storm events into profitable jobs. Track storm-generated leads across all your service areas, prioritize opportunities by damage severity and property value, and deploy sales teams to the highest-value targets. The command board shows lead volume by storm event, conversion rates, and estimated revenue potential. Use automated outreach campaigns to contact property owners in affected areas before your competitors. The AI scoring system ranks each lead from zero to one hundred based on damage probability, property value, and response urgency.`,

  'hazard-dashboard': `Welcome to the Hazard Dashboard. I'm Rachel. This module provides comprehensive multi-hazard monitoring across all threat types including severe weather, hurricanes, earthquakes, wildfires, and flooding. The dashboard aggregates data from eight real-time sources including the National Weather Service, Storm Prediction Center, USGS earthquake monitoring, and NASA wildfire detection. Each hazard is displayed with severity level, affected area, and recommended response actions. Use the map view to see geographic distribution of all active threats, or switch to list view for detailed hazard analysis. The AI system automatically prioritizes hazards based on your service areas and crew locations.`,

  'eyes-in-sky': `Welcome to Eyes in the Sky. I'm Rachel. This is your satellite intelligence center for aerial reconnaissance and damage assessment. Access high-resolution satellite imagery from Maxar's WorldView constellation, track satellite overflight schedules with SpyMeSat, and perform before-and-after storm damage change detection. The archive marketplace lets you purchase imagery at per-square-kilometer pricing. Use satellite tasking requests to schedule custom imagery captures with priority levels from routine to critical. The AI change detection system automatically identifies roof damage, vegetation loss, debris fields, and flood extent by comparing pre and post-storm imagery.`,

  'goes17-portal': `Welcome to the GOES-17 Satellite Portal. I'm Rachel. This portal delivers professional-grade meteorological data from NOAA's geostationary satellite. Access real-time infrared imagery updated every fifteen minutes, lightning detection data from the Geostationary Lightning Mapper, and atmospheric temperature profiles. The portal shows cloud-top temperatures, storm intensity analysis, and tropical cyclone tracking for the western United States and Pacific Ocean. Use the loop animation to track storm development over time, analyze lightning strike patterns for severe weather detection, and monitor atmospheric moisture for precipitation forecasting.`,

  'watchlist': `Welcome to the Location Watchlist. I'm Rachel. This module lets you monitor multiple sites for disaster impact and receive automated alerts when conditions threaten your properties or service areas. Add key locations like your office, equipment yards, customer properties, or potential job sites. Each location receives a real-time impact score from zero to one hundred based on active weather threats, storm predictions, and environmental conditions. When a location exceeds your custom alert threshold, automated notifications are sent to your Slack channel. Use CSV import to bulk-add locations, and export your monitoring data for reports.`,

  'deployment-intelligence': `Welcome to Deployment Intelligence. I'm Rachel. This module uses AI-powered analytics to optimize your crew deployment strategy. The system analyzes current storm predictions, damage forecasts, and crew availability to recommend optimal positioning for your teams. View heat maps showing predicted damage density, calculate travel times between job sites, and identify staging areas that minimize response time. The AI considers crew specialties, equipment availability, and historical response data to generate deployment recommendations that maximize your coverage and revenue potential.`,

  'damage-report': `Welcome to the Damage Report module. I'm Rachel. This is where you create professional damage documentation for insurance claims and customer records. Upload photos from the field, add detailed descriptions of damage types and severity, and generate formatted reports ready for insurance adjusters. The system supports multiple damage categories including roof, siding, gutters, windows, fencing, and interior water damage. Each report includes property information, damage classification, estimated repair scope, and photo evidence with timestamps and location data. Reports can be exported as PDFs or shared directly with insurance companies.`,

  'emergency-contractor-readiness': `Welcome to Emergency Contractor Readiness. I'm Rachel. This module ensures your team is fully prepared before storms hit. Track certification status, equipment inventory, insurance coverage, and crew availability across your entire organization. The readiness checklist covers safety training, OSHA compliance, vehicle inspections, equipment maintenance, and supply inventory. Use the readiness score to identify gaps in your preparation and take action before deployments. The system monitors expiring certifications and insurance policies, sending alerts thirty days before renewal deadlines.`,

  'monitoring-dashboard': `Welcome to the Monitoring Dashboard. I'm Rachel. This is your real-time operations monitoring center that tracks system health, data feeds, and alert processing across all Disaster Direct modules. Monitor the status of weather data feeds, API connections, and background processing tasks. View alert delivery metrics, system uptime statistics, and processing queue depth. The dashboard helps ensure all your data sources are operational and alerts are being delivered reliably to your team.`,

  'ai-bid-intel-pro': `Welcome to AI BidIntel Pro. I'm Rachel. This is your advanced procurement intelligence module designed to help contractors win more government and commercial bids. Access the USACE Outreach Center for Army Corps of Engineers opportunities, the Utility Contractor Readiness Center for power restoration contracts, and the Procurement Portal Finder for state and local government bids. The DOT Vendor Registration guide walks you through highway department qualification. The Portal Assistant helps you navigate complex procurement websites, while Bid Tracking monitors all your active bids with status updates and deadline alerts. The AI analyzes bid requirements and suggests optimal pricing strategies.`,

  'ai-lead-management': `Welcome to AI Lead Management. I'm Rachel. This module provides an AI-powered lead pipeline with multi-service tracking, automated outreach, and smart contractor routing. The AI system scores each lead based on damage probability, property value, and service match. Automated campaigns reach out to property owners via email and SMS with personalized messaging. The routing engine matches leads to the best available contractor based on location, specialty, and availability. Track conversion rates, response times, and revenue by lead source. The re-engagement system automatically follows up with cold leads using optimized timing and messaging.`,

  'leads': `Welcome to Lead Management. I'm Rachel. This module helps you track and manage all your sales opportunities from first contact through to signed contracts. Add new leads manually or import them from storm events, marketing campaigns, and referral sources. Each lead card shows contact information, property details, estimated job value, and current pipeline stage. Use drag and drop to move leads through your pipeline stages. The system tracks follow-up tasks, appointment schedules, and communication history for every lead. Filter by source, status, priority, or assigned team member to focus on your highest-value opportunities.`,

  'homeowner-portal': `Welcome to the Homeowner Portal. I'm Rachel. This portal is designed for property owners to report damage, track their service requests, and communicate with their assigned contractor. Homeowners can upload photos of damage, describe the issue, and receive status updates as work progresses. The portal provides transparency into the repair timeline, scheduled appointments, and billing information. Contractors benefit from having organized customer communication in one place, reducing phone calls and improving customer satisfaction.`,

  'auto-form-filler': `Welcome to the Auto Form Filler. I'm Rachel. This is your Digital Compliance Vault and Smart Form Auto-Filling system. Store your master business profile including EIN, UEI, CAGE code, NAICS codes, insurance details, banking information, and certifications in one secure location. Upload critical documents like W-9 forms, insurance certificates, licenses, OSHA logs, and master service agreements to your document vault. When you need to fill out government forms, vendor applications, or compliance documents, the AI auto-fill engine matches over one hundred smart field synonyms to populate forms instantly with your stored data, saving hours of repetitive paperwork.`,

  'tree-incident-tracker': `Welcome to the Tree Incident Tracker. I'm Rachel. This module provides street-level tracking of tree-on-structure incidents in real-time. Log incidents with location data, severity ratings, and photo documentation. The system generates Comparative Market Analysis reports for each incident, helping you estimate job value. Use crew routing to dispatch the nearest available team, and bulk import capabilities to process multiple incidents at once. Priority-based sorting ensures critical incidents like trees on occupied homes are addressed first. Each incident detail view shows photos, location map, estimated removal cost, and crew assignment status.`,

  'fema-audit-dashboard': `Welcome to the FEMA Audit Dashboard. I'm Rachel. This is your enterprise-grade FEMA compliance system designed to enhance monitor efficiency and ensure audit readiness. The dashboard tracks digital field verification events with layered location intelligence using multiple signals including GPS, EXIF data, time correlation, weather matching, crew sign-in records, and device fingerprints. Every verification event is recorded in an immutable hash-chained audit log using SHA-256 encryption. The AI confidence scoring system rates each field event for reliability. Track compliance status per job, crew, and project in real-time. Monitor T&M seventy-hour caps, validate pay rates, and detect potential fraud with AI analysis. Generate one-click FEMA-compliant audit packets for submission.`,

  'contractor-alerts-dashboard': `Welcome to the Contractor Alerts Dashboard. I'm Rachel. This module delivers real-time notifications and alerts to keep you informed about opportunities, weather changes, and operational updates. Receive instant alerts for new job opportunities in your service area, severe weather updates that affect active projects, lead assignments, schedule changes, and system notifications. Customize your alert preferences by type, severity, and delivery method. The dashboard shows alert history, response times, and missed opportunity tracking to help you improve your response rate.`,

  'drone-operation': `Welcome to Drone Operations. I'm Rachel. This module provides comprehensive drone fleet management for damage assessment and documentation. Track your entire drone fleet including model specifications, battery levels, maintenance schedules, and deployment status. Log flights with GPS tracking, altitude data, and mission parameters for FAA compliance. Execute standardized damage assessment workflows with automated photo capture sequences, geo-tagging, and measurement overlays. Generate professional assessment reports with annotated imagery for insurance claims. The system maintains complete flight logs and maintenance records required for commercial drone operations.`,

  'scope-snap': `Welcome to ScopeSnap. I'm Rachel. This is your AI Vision Analysis tool that turns photos into professional scope documents. Simply take a photo of any damage or project area, and the AI instantly identifies materials, measurements, damage types, and repair requirements. ScopeSnap recognizes over two hundred material types including roofing shingles, siding panels, flooring materials, and structural components. The AI generates detailed line items with quantities, specifications, and industry-standard descriptions ready for estimating. Use batch mode to process multiple photos at once for large projects.`,

  'price-whisperer': `Welcome to PriceWhisperer. I'm Rachel. This is your Smart Estimate Engine that generates accurate, competitive pricing in seconds. Enter the scope of work, materials, and project details, and PriceWhisperer calculates pricing using real-time market data, labor rates, and material costs specific to your region. The engine supports multiple contractor trades including roofing, tree removal, auto repair, flooring, and general construction. Compare your pricing against industry benchmarks, adjust for complexity factors, and generate professional estimates with your company branding. The AI learns from your pricing history to improve accuracy over time.`,

  'contractor-match': `Welcome to ContractorMatch. I'm Rachel. This AI-powered matching system connects customers with the best available contractor for their specific needs. The algorithm considers contractor specialty, location proximity, availability, customer ratings, pricing competitiveness, and past performance to generate match scores. Contractors receive matched leads with pre-qualified customer information and estimated job value. Customers see contractor profiles with verified reviews, credentials, and response times. The system handles scheduling, communication, and follow-up automatically.`,

  'calendar-sync': `Welcome to CalendarSync. I'm Rachel. This is your AI-powered scheduling assistant that optimizes your work calendar for maximum efficiency. The system integrates with your existing calendar to manage appointments, job schedules, crew assignments, and customer meetings. AI scheduling considers travel time between job sites, crew availability, weather conditions, and job priority to suggest optimal time slots. Automatic reminders and confirmations reduce no-shows. The drag-and-drop interface lets you quickly reschedule jobs, and the crew view shows everyone's schedule at a glance.`,

  'job-flow': `Welcome to JobFlow. I'm Rachel. This is your Project Command Center for managing active jobs from start to completion. Track every job through customizable workflow stages including scheduling, materials ordering, crew assignment, execution, quality check, and invoicing. Each job card shows real-time status, assigned crew, scheduled dates, materials list, and customer communication history. The timeline view displays all active jobs with milestone tracking. Use automated status updates to keep customers informed, and generate progress reports with photo documentation. Financial tracking shows costs, revenue, and profit margins per job.`,

  'media-vault': `Welcome to MediaVault. I'm Rachel. This is your Protected Documentation and Creative Studio with five powerful tabs. The Media Vault tab provides secure photo and video storage with geo-tagging and timestamp verification for legal documentation. AI Video generates text-to-video concept storyboards for marketing and training. Flyers and Ads creates AI-generated promotional materials with professional images and copy. Brochures produces full marketing campaign materials. The Created Gallery stores all your AI-generated content for reuse. All media is encrypted and timestamped for legal defensibility in insurance claims and disputes.`,

  'close-bot': `Welcome to CloseBot. I'm Rachel. This is your AI Sales Agent that helps you close more deals with data-driven sales strategies. CloseBot analyzes each lead's profile, property data, damage assessment, and market conditions to generate personalized sales scripts and objection responses. The AI coaches you through sales calls in real-time, suggesting talking points, pricing strategies, and closing techniques. Track your close rate by lead source, script variation, and sales rep. CloseBot learns from successful closes to continuously improve recommendations.`,

  'pay-stream': `Welcome to PayStream. I'm Rachel. This is your seamless payment processing system integrated with Stripe for secure transactions. Create and send professional invoices, accept credit card and ACH payments, set up payment plans for larger projects, and track all financial transactions in one place. The dashboard shows outstanding invoices, payment history, revenue trends, and accounts receivable aging. Automated payment reminders reduce collection time. Customers can pay online through a branded payment portal. PayStream handles tax calculations, receipt generation, and financial reporting.`,

  'review-rocket': `Welcome to ReviewRocket. I'm Rachel. This is your Reputation Automation system that helps you build and maintain a five-star online presence. After each completed job, ReviewRocket automatically sends review requests to satisfied customers via email and SMS with direct links to Google, Yelp, and Facebook. The sentiment analysis AI monitors incoming reviews and alerts you to negative feedback for immediate response. Review response templates help you reply professionally to both positive and negative reviews. Track your rating trends, review volume, and sentiment scores across all platforms.`,

  'fairness-score': `Welcome to FairnessScore. I'm Rachel. This Trust Transparency system provides unbiased ratings for contractor pricing, service quality, and customer satisfaction. FairnessScore analyzes pricing against regional benchmarks, evaluates service delivery timelines, and aggregates customer feedback to generate transparent trust scores. Customers can view a contractor's FairnessScore before hiring, building confidence in fair pricing and quality work. Contractors benefit from verified trust badges that differentiate them from competitors. The system also identifies areas for improvement and tracks score trends over time.`,

  'quick-finance': `Welcome to QuickFinance. I'm Rachel. This Instant Financing module helps your customers afford larger projects by offering multiple financing options at the point of sale. Present payment plan options during estimates, calculate monthly payments for different loan terms, and connect customers with lending partners for instant approval. QuickFinance increases your average job size by making larger projects affordable. Track financing applications, approval rates, and funded amounts. Customers can apply directly from your branded portal, and approved financing is linked directly to their job for seamless payment processing.`,

  'content-forge': `Welcome to ContentForge. I'm Rachel. This is your AI Marketing Engine that creates professional promotional materials in seconds. Generate photo ads, video concepts, animated content in cartoon and Pixar styles, and full marketing campaigns with just a text description. Choose from multiple creative styles including professional, bold, comical, and animated. The AI generates eye-catching visuals with compelling ad copy, hashtags, and call-to-action text tailored to your target audience. Export finished materials for social media, print, email campaigns, and website use. The Created Gallery saves all your generated content for reuse and editing.`,

  'lead-pipeline': `Welcome to Lead Pipeline. I'm Rachel. This visual pipeline management tool gives you a bird's-eye view of all leads moving through your sales process. Drag and drop leads between pipeline stages, track conversion rates at each stage, and identify bottlenecks slowing your sales cycle. The pipeline shows total value at each stage, average time to convert, and win-loss ratios. Use filters to view pipeline by source, assigned rep, date range, or estimated value. Automated actions trigger follow-up tasks when leads sit in a stage too long, ensuring no opportunity falls through the cracks.`,

  'job-snap': `Welcome to JobSnap. I'm Rachel. This quick job documentation tool lets you capture and organize job site information in seconds. Snap photos, record voice notes, add measurements, and tag materials all from your phone. JobSnap automatically organizes documentation by job, creates before-and-after comparisons, and generates formatted reports. The AI identifies materials and damage types from your photos, adding professional descriptions automatically. Share job documentation with customers, insurance adjusters, or your office team instantly.`,

  'pitch-deck': `Welcome to PitchDeck. I'm Rachel. This module helps you create professional business presentations and proposals that win contracts. Generate polished pitch decks with your company branding, service descriptions, case studies, and pricing. The AI builds compelling slides with data visualizations, customer testimonials, and project portfolios. Customize templates for different audiences including homeowners, commercial property managers, insurance companies, and government agencies. Export presentations as PDFs or interactive web links to share with prospects.`,

  'auto-repair-diag': `Welcome to Auto Repair Diagnostics. I'm Rachel. This AI-powered diagnostic tool helps auto repair professionals quickly identify vehicle damage and generate accurate repair estimates. Upload photos of vehicle damage, and the AI analyzes dent depth, paint damage, panel deformation, and structural impact. The system generates itemized repair estimates with labor hours, parts pricing, and paint material costs aligned with industry databases. Support for hail damage assessment, collision repair scoping, and insurance supplement documentation makes this an essential tool for auto body shops and mobile repair services.`,

  'workhub-marketplace': `Welcome to the WorkHub Marketplace. I'm Rachel. This is your central hub for everyday contractor and customer interactions, featuring twelve AI-powered modules designed to streamline your business. From ScopeSnap's AI vision analysis to PayStream's seamless payments, every tool you need to run a professional contracting business is right here. Browse available modules, check your subscription status, and launch any tool with one click. The marketplace shows module descriptions, feature highlights, and usage statistics. Each module works independently but shares data across the platform for a unified experience.`,

  'workhub-contractor-dashboard': `Welcome to your Contractor Dashboard. I'm Rachel. This is your personalized home base showing all your key business metrics at a glance. View your active jobs, pending leads, upcoming appointments, recent payments, and performance scores in one unified dashboard. The activity feed shows real-time updates from all your WorkHub modules. Quick action buttons let you create new leads, schedule jobs, send invoices, or request reviews without navigating away. Performance charts track your monthly revenue, job completion rate, customer satisfaction, and response time trends.`,

  'workhub-contractor-crm': `Welcome to the Contractor CRM. I'm Rachel. This customer relationship management system keeps all your client interactions organized and accessible. Store customer contact information, property details, job history, communication logs, and payment records in one place. The timeline view shows every interaction with each customer, from initial contact through completed jobs and follow-up. Use tags and segments to organize customers by service type, location, or value. Automated follow-up reminders ensure you maintain relationships with past customers for repeat business and referrals.`,

  'workhub-customer-portal': `Welcome to the Customer Portal. I'm Rachel. This is the client-facing interface where your customers can view their projects, communicate with your team, approve estimates, make payments, and leave reviews. The portal provides transparency into job progress with status updates, scheduled appointments, and photo documentation. Customers can submit new service requests, upload photos of damage, and track everything from estimate to completion. A branded experience with your company logo and colors builds trust and professionalism.`,

  'crewlink-exchange': `Welcome to CrewLink Exchange. I'm Rachel. This is the national workforce and equipment marketplace connecting skilled workers, professional crews, and equipment owners with opportunities. Browse worker listings by trade specialty and location, find professional crews for large-scale deployments, or rent equipment from verified owners. Each listing includes skills verification, availability status, pricing, and ratings from previous engagements. Post your own availability to attract job opportunities, or search for subcontractors and equipment when demand exceeds your capacity.`,
};

interface ModuleVoiceGuideProps {
  moduleName: string;
  className?: string;
}

export default function ModuleVoiceGuide({ moduleName, className = '' }: ModuleVoiceGuideProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stopPlaying = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (isMountedRef.current) {
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, []);

  const playGuide = useCallback(async () => {
    if (isPlaying) {
      stopPlaying();
      return;
    }

    const script = MODULE_SCRIPTS[moduleName];
    if (!script) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script })
      });

      if (!response.ok) throw new Error('TTS failed');
      const data = await response.json();

      if (data.audioBase64 && isMountedRef.current) {
        const format = data.format || 'mp3';
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0))],
          { type: `audio/${format}` }
        );
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioRef.current) audioRef.current.pause();
        audioRef.current = new Audio(audioUrl);

        audioRef.current.onended = () => {
          if (isMountedRef.current) {
            setIsPlaying(false);
          }
          URL.revokeObjectURL(audioUrl);
        };

        audioRef.current.onerror = () => {
          if (isMountedRef.current) {
            setIsPlaying(false);
            setIsLoading(false);
          }
          URL.revokeObjectURL(audioUrl);
        };

        await audioRef.current.play();
        if (isMountedRef.current) {
          setIsPlaying(true);
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error('Voice guide error:', err);
      if (isMountedRef.current) {
        setIsPlaying(false);
        setIsLoading(false);
      }
    }
  }, [moduleName, isPlaying, stopPlaying]);

  if (!MODULE_SCRIPTS[moduleName]) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`fixed bottom-6 right-6 z-50 ${className}`}
      >
        <Button
          onClick={playGuide}
          disabled={isLoading}
          className={`rounded-full shadow-lg px-4 py-2 flex items-center gap-2 ${
            isPlaying
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white'
          }`}
          size="lg"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">
            {isLoading ? 'Loading...' : isPlaying ? 'Stop Rachel' : 'Rachel Voice Guide'}
          </span>
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
