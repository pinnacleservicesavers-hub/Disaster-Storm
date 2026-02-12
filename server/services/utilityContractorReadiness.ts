import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://openai-gateway.replit.dev/v1',
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || 'dummy-key-for-replit-ai'
});

export interface RegistrationStep {
  step: number;
  title: string;
  description: string;
  documentsNeeded?: string[];
  estimatedTime?: string;
  tips?: string;
}

export interface UtilityCompany {
  name: string;
  states: string[];
  region: string;
  registrationUrl: string;
  vendorPlatform: string;
  stormPriority: "critical" | "high" | "medium" | "low";
  stormPriorityScore: number;
  contractTypes: string[];
  registrationNotes: string;
  annualStormSpend: string;
  registrationSteps?: RegistrationStep[];
}

export interface GovernmentPortal {
  name: string;
  url: string;
  type: "state" | "municipal" | "association";
  description: string;
  region: string;
  registrationSteps?: RegistrationStep[];
}

export interface StateEMC {
  name: string;
  website: string;
  type: "emc" | "support_org";
  state: string;
  description: string;
  serviceTypes: string[];
}

export interface VendorPlatform {
  name: string;
  url: string;
  description: string;
  usedBy: string[];
  costToRegister: string;
  priority: "critical" | "high" | "medium";
  features: string[];
  registrationSteps?: RegistrationStep[];
}

export interface ReadinessChecklistItem {
  id: string;
  category: string;
  item: string;
  description: string;
  priority: "required" | "highly_recommended" | "recommended";
  forStormWork: boolean;
  tips: string;
}

export const UTILITY_COMPANIES: UtilityCompany[] = [
  {
    name: "Florida Power & Light (FPL)",
    states: ["FL"],
    region: "Southeast",
    registrationUrl: "https://www.fpl.com/landing/contractors.html",
    vendorPlatform: "PowerAdvocate / ISNetworld",
    stormPriority: "critical",
    stormPriorityScore: 99,
    contractTypes: ["Vegetation management", "Storm debris removal", "Line clearing", "ROW restoration", "Emergency power restoration"],
    registrationNotes: "Largest utility in FL. Part of NextEra Energy — huge storm response market. Massive storm activation needs. Must be ISNetworld compliant. They activate hundreds of contractors per hurricane season.",
    annualStormSpend: "$500M+",
    registrationSteps: [
      { step: 1, title: "Visit FPL Supplier Page", description: "Go to FPL's existing & new suppliers page and review their vendor requirements.", documentsNeeded: [], estimatedTime: "15 minutes", tips: "FPL is part of NextEra Energy — registering here also positions you for NextEra opportunities." },
      { step: 2, title: "Complete ISNetworld Profile", description: "FPL requires ISNetworld compliance for all field contractors. Create or update your ISNetworld profile with all safety documentation.", documentsNeeded: ["OSHA 300 logs", "Safety manual", "Drug testing program", "EMR rating documentation"], estimatedTime: "2-3 hours" },
      { step: 3, title: "Register on PowerAdvocate", description: "Create a supplier profile on PowerAdvocate (Wood Mackenzie) to receive bid invitations and sourcing events from FPL.", documentsNeeded: ["W-9", "Company capabilities overview", "Equipment list"], estimatedTime: "1-2 hours" },
      { step: 4, title: "Upload Insurance Documents", description: "Upload your Certificate of Insurance (COI) with FPL named as Additional Insured. Minimum $5M umbrella required.", documentsNeeded: ["COI with $1M+ GL", "Auto liability $1M", "Workers' comp", "Umbrella $5M+"], estimatedTime: "30 minutes" },
      { step: 5, title: "Submit W-9 and Business Documents", description: "Provide your W-9, EIN, state contractor license, and any SBA/DBE certifications.", documentsNeeded: ["W-9", "EIN letter", "FL contractor license", "SBA certifications"], estimatedTime: "30 minutes" },
      { step: 6, title: "Complete Safety Prequalification", description: "Ensure ISNetworld status shows green/compliant. Upload all training records, OSHA certifications, and drug testing program documentation.", documentsNeeded: ["OSHA 10/30 certs for all workers", "CPR/First Aid certs", "Tailgate safety meeting logs"], estimatedTime: "1-2 weeks for full compliance" },
      { step: 7, title: "Send Introduction Email", description: "Use the AI email generator in this module to draft a professional introduction to FPL's vendor management team. Reference your ISNetworld compliance and storm response capabilities.", estimatedTime: "15 minutes", tips: "Mention your ISNetworld ID number and that your profile is compliant/green." }
    ]
  },
  {
    name: "Entergy (TX, LA, MS, AR)",
    states: ["TX", "LA", "MS", "AR"],
    region: "Gulf Coast",
    registrationUrl: "https://www.entergy.com/suppliers/",
    vendorPlatform: "PowerAdvocate / Avetta / SAP Ariba",
    stormPriority: "critical",
    stormPriorityScore: 97,
    contractTypes: ["Storm restoration", "Vegetation management", "Debris removal", "Transmission line repair", "Distribution maintenance"],
    registrationNotes: "Covers Entergy Louisiana, Entergy Arkansas, Entergy Mississippi, Entergy New Orleans, and Entergy Texas. Runs a centralized supplier database through PowerAdvocate. Also uses Avetta for safety prequalification. Hurricane corridor — great for storm restoration work.",
    annualStormSpend: "$300M+",
    registrationSteps: [
      { step: 1, title: "Visit Entergy Suppliers Page", description: "Go to Entergy's centralized supplier portal and review their vendor registration requirements and procurement process.", estimatedTime: "15 minutes", tips: "Entergy covers 5 operating companies — one registration covers all of them." },
      { step: 2, title: "Register on PowerAdvocate", description: "Entergy uses PowerAdvocate as their centralized supplier database. Create your company profile, upload capabilities, insurance, and W-9.", documentsNeeded: ["W-9", "Insurance certificates", "Company capabilities statement", "Equipment list"], estimatedTime: "1-2 hours" },
      { step: 3, title: "Complete Avetta Safety Prequalification", description: "Entergy uses Avetta for safety prequalification. Register on Avetta and upload all safety documentation, training records, and compliance proof.", documentsNeeded: ["Safety manual", "OSHA logs", "Drug testing program", "EMR documentation", "Training certificates"], estimatedTime: "2-4 hours" },
      { step: 4, title: "Upload Insurance Documents", description: "Provide COI with Entergy named as Additional Insured. Ensure umbrella coverage meets their minimum requirements.", documentsNeeded: ["COI with GL coverage", "Auto liability", "Workers' comp", "Umbrella/excess coverage"], estimatedTime: "30 minutes" },
      { step: 5, title: "Submit Business & Tax Documents", description: "Upload W-9, EIN letter, state contractor licenses for TX, LA, MS, and AR as applicable.", documentsNeeded: ["W-9", "EIN", "State licenses", "SBA certifications"], estimatedTime: "30 minutes" },
      { step: 6, title: "Complete SAP Ariba Registration", description: "Some Entergy procurement events are managed through SAP Ariba. Register as a supplier on Ariba to receive sourcing event invitations.", estimatedTime: "1 hour" },
      { step: 7, title: "Send Introduction Email", description: "Use the AI email generator to send a professional introduction to Entergy's procurement team. Highlight your Gulf Coast storm response capabilities.", estimatedTime: "15 minutes", tips: "Mention you're registered on PowerAdvocate and Avetta-compliant." }
    ]
  },
  {
    name: "Duke Energy",
    states: ["NC", "SC", "FL", "IN", "OH", "KY"],
    region: "Southeast / Midwest",
    registrationUrl: "https://www.duke-energy.com/partner-with-us/suppliers",
    vendorPlatform: "PowerAdvocate / Avetta",
    stormPriority: "critical",
    stormPriorityScore: 96,
    contractTypes: ["Storm restoration", "Vegetation management", "Line construction", "Debris management", "Emergency response"],
    registrationNotes: "Multi-state operations across 6 states. Uses PowerAdvocate for vendor management and sourcing events. Avetta for contractor safety compliance. Also operates a supplier management program. Major storm player in Carolinas and Florida.",
    annualStormSpend: "$400M+",
    registrationSteps: [
      { step: 1, title: "Visit Duke Energy Partner Page", description: "Go to Duke Energy's 'Partner With Us' suppliers page. Review their supplier registration resources and requirements.", estimatedTime: "15 minutes" },
      { step: 2, title: "Register on PowerAdvocate", description: "Duke Energy uses PowerAdvocate for vendor qualification and competitive bidding. Create your supplier profile with complete capabilities.", documentsNeeded: ["W-9", "Company overview", "Capabilities statement", "Equipment inventory"], estimatedTime: "1-2 hours", tips: "Complete every field — Duke's procurement team searches by capability, location, and certifications." },
      { step: 3, title: "Complete Avetta Prequalification", description: "Duke uses Avetta for contractor compliance and safety management. Register and upload all safety documentation.", documentsNeeded: ["Safety manual", "OSHA 300 logs", "EMR rating", "Drug testing program", "Training records"], estimatedTime: "2-4 hours" },
      { step: 4, title: "Upload Insurance & Bonding", description: "Submit COI with Duke Energy named as Additional Insured. Meet their minimum coverage requirements.", documentsNeeded: ["COI", "Workers' comp", "Auto liability", "Umbrella $5M+", "Bonding capacity proof"], estimatedTime: "30 minutes" },
      { step: 5, title: "Submit State Licenses", description: "Provide contractor licenses for NC, SC, FL, IN, OH, KY — whichever states you plan to work in.", documentsNeeded: ["State contractor licenses", "Business registrations"], estimatedTime: "30 minutes" },
      { step: 6, title: "Send Introduction Email", description: "Draft a professional introduction highlighting your multi-state capabilities and Avetta compliance status.", estimatedTime: "15 minutes", tips: "Duke operates in 6 states — emphasize your ability to mobilize across their footprint." }
    ]
  },
  {
    name: "Georgia Power / Southern Company",
    states: ["GA", "AL", "MS"],
    region: "Southeast",
    registrationUrl: "https://www.southerncompany.com/about/suppliers.html",
    vendorPlatform: "PowerAdvocate / ISNetworld",
    stormPriority: "critical",
    stormPriorityScore: 95,
    contractTypes: ["Storm restoration", "Vegetation management", "Transmission construction", "Distribution maintenance", "ROW clearing"],
    registrationNotes: "Parent company Southern Company manages procurement for Georgia Power (GA's biggest utility), Alabama Power, Mississippi Power, and Southern Company Gas. Register through Southern Company's supplier portal. Critical for right-of-way, storm cleanup, vegetation clearing, and emergency services.",
    annualStormSpend: "$350M+",
    registrationSteps: [
      { step: 1, title: "Visit Southern Company Supplier Page", description: "Go to Southern Company's supplier information page. This is the centralized portal covering Georgia Power, Alabama Power, Mississippi Power, and Southern Company Gas.", estimatedTime: "15 minutes", tips: "One registration covers all Southern Company subsidiaries." },
      { step: 2, title: "Complete Marketplace Profile", description: "Create your supplier marketplace profile through Southern Company's portal. Include all company details, capabilities, and service areas.", documentsNeeded: ["W-9", "Company overview", "Service area map", "Equipment list"], estimatedTime: "1-2 hours" },
      { step: 3, title: "Register on PowerAdvocate", description: "Southern Company uses PowerAdvocate for sourcing events and vendor qualification. Set up your profile.", documentsNeeded: ["Capabilities statement", "Past performance references", "Certifications"], estimatedTime: "1-2 hours" },
      { step: 4, title: "Complete ISNetworld Compliance", description: "ISNetworld compliance required for field work with Southern Company utilities. Ensure green/compliant status.", documentsNeeded: ["Safety manual", "OSHA documentation", "Drug testing program", "EMR rating", "Training records"], estimatedTime: "2-4 weeks for full compliance" },
      { step: 5, title: "Upload Insurance Documents", description: "Provide COI naming Southern Company as Additional Insured with appropriate coverage limits.", documentsNeeded: ["COI", "Workers' comp (multi-state)", "Auto liability", "Umbrella coverage"], estimatedTime: "30 minutes" },
      { step: 6, title: "Send Introduction Email", description: "Draft a professional email to Southern Company's procurement team highlighting your storm response capabilities across the Southeast.", estimatedTime: "15 minutes", tips: "Mention your ISNetworld compliance status and which Southern Company subsidiaries' service areas you cover." }
    ]
  },
  {
    name: "Dominion Energy",
    states: ["VA", "NC", "SC"],
    region: "Mid-Atlantic",
    registrationUrl: "https://www.dominionenergy.com/suppliers",
    vendorPlatform: "SAP Ariba / ISNetworld",
    stormPriority: "high",
    stormPriorityScore: 90,
    contractTypes: ["Storm restoration", "Vegetation management", "Underground construction", "Transmission maintenance"],
    registrationNotes: "Major mid-Atlantic utility. Nor'easters and hurricanes drive storm work. SAP Ariba supplier registration required.",
    annualStormSpend: "$200M+"
  },
  {
    name: "NextEra Energy (FPL parent)",
    states: ["FL", "NH", "WI"],
    region: "Multi-State",
    registrationUrl: "https://www.nexteraenergy.com/suppliers.html",
    vendorPlatform: "PowerAdvocate",
    stormPriority: "high",
    stormPriorityScore: 89,
    contractTypes: ["Renewable energy construction", "Storm restoration", "Vegetation management", "Solar/wind maintenance"],
    registrationNotes: "Parent of FPL. Massive renewable energy portfolio. Growing contractor needs for solar and wind farm maintenance alongside storm response.",
    annualStormSpend: "$150M+"
  },
  {
    name: "CenterPoint Energy",
    states: ["TX", "IN", "OH", "MN"],
    region: "Gulf Coast / Midwest",
    registrationUrl: "https://www.centerpointenergy.com/en-us/corporate/about-us/suppliers",
    vendorPlatform: "ISNetworld / SAP Ariba",
    stormPriority: "high",
    stormPriorityScore: 88,
    contractTypes: ["Storm restoration", "Gas distribution", "Electric distribution", "Vegetation management", "Emergency response"],
    registrationNotes: "Houston-based. Major hurricane exposure in Texas. Also covers gas distribution in multiple states. ISNetworld compliance required.",
    annualStormSpend: "$200M+"
  },
  {
    name: "TECO Energy / Tampa Electric",
    states: ["FL"],
    region: "Southeast",
    registrationUrl: "https://www.tampaelectric.com/company/doing-business/",
    vendorPlatform: "ISNetworld",
    stormPriority: "high",
    stormPriorityScore: 87,
    contractTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Emergency power"],
    registrationNotes: "Tampa Bay area utility. Direct hurricane exposure. Smaller but aggressive storm response program. ISNetworld safety prequalification required.",
    annualStormSpend: "$80M+"
  },
  {
    name: "Eversource Energy",
    states: ["CT", "MA", "NH"],
    region: "Northeast",
    registrationUrl: "https://www.eversource.com/content/general/about/doing-business-with-us",
    vendorPlatform: "PowerAdvocate / Avetta",
    stormPriority: "high",
    stormPriorityScore: 86,
    contractTypes: ["Storm restoration", "Vegetation management", "Transmission construction", "Distribution maintenance", "Ice storm response"],
    registrationNotes: "New England's largest utility. Nor'easters, ice storms, and occasional hurricanes. PowerAdvocate for sourcing, Avetta for safety.",
    annualStormSpend: "$150M+"
  },
  {
    name: "AEP (American Electric Power)",
    states: ["OH", "TX", "WV", "VA", "IN", "MI", "KY", "TN", "OK", "AR", "LA"],
    region: "Multi-State",
    registrationUrl: "https://www.aep.com/about/businesses/suppliers",
    vendorPlatform: "SAP Ariba / ISNetworld",
    stormPriority: "high",
    stormPriorityScore: 85,
    contractTypes: ["Transmission construction", "Distribution maintenance", "Storm restoration", "Vegetation management", "ROW clearing"],
    registrationNotes: "Massive multi-state footprint covering 11 states. SAP Ariba supplier registration. ISNetworld for safety. Large transmission construction program.",
    annualStormSpend: "$250M+"
  },
  {
    name: "PPL Corporation",
    states: ["PA", "KY", "RI"],
    region: "Northeast / Southeast",
    registrationUrl: "https://www.pplweb.com/suppliers/",
    vendorPlatform: "SAP Ariba",
    stormPriority: "medium",
    stormPriorityScore: 78,
    contractTypes: ["Storm restoration", "Vegetation management", "Distribution construction", "Transmission maintenance"],
    registrationNotes: "Pennsylvania and Kentucky operations. Ice storms and severe weather drive contractor needs.",
    annualStormSpend: "$100M+"
  },
  {
    name: "Xcel Energy",
    states: ["MN", "CO", "TX", "WI", "NM", "SD", "ND", "MI"],
    region: "Midwest / West",
    registrationUrl: "https://www.xcelenergy.com/company/suppliers",
    vendorPlatform: "SAP Ariba",
    stormPriority: "medium",
    stormPriorityScore: 75,
    contractTypes: ["Storm restoration", "Vegetation management", "Renewable construction", "Distribution maintenance"],
    registrationNotes: "Midwest-focused. Winter storms and severe weather events. Growing renewable energy contractor needs.",
    annualStormSpend: "$120M+"
  },
  {
    name: "Ameren",
    states: ["MO", "IL"],
    region: "Midwest",
    registrationUrl: "https://www.ameren.com/company/suppliers",
    vendorPlatform: "SAP Ariba / ISNetworld",
    stormPriority: "medium",
    stormPriorityScore: 73,
    contractTypes: ["Storm restoration", "Vegetation management", "Gas distribution", "Electric distribution"],
    registrationNotes: "Missouri and Illinois operations. Tornadoes and severe storms. ISNetworld safety compliance.",
    annualStormSpend: "$80M+"
  },
  {
    name: "Consolidated Edison (ConEd)",
    states: ["NY"],
    region: "Northeast",
    registrationUrl: "https://www.coned.com/en/business-partners/become-a-vendor",
    vendorPlatform: "Avetta / Custom Portal",
    stormPriority: "medium",
    stormPriorityScore: 72,
    contractTypes: ["Storm restoration", "Underground construction", "Emergency response", "Vegetation management"],
    registrationNotes: "NYC metro area. Superstorm Sandy type events. Heavy underground infrastructure. Avetta safety prequalification.",
    annualStormSpend: "$100M+"
  },
  {
    name: "Pacific Gas & Electric (PG&E)",
    states: ["CA"],
    region: "West",
    registrationUrl: "https://www.pge.com/en/about/doing-business-with-pge/become-a-supplier.html",
    vendorPlatform: "ISNetworld / SAP Ariba",
    stormPriority: "high",
    stormPriorityScore: 84,
    contractTypes: ["Wildfire mitigation", "Vegetation management", "Distribution hardening", "Emergency response", "Public Safety Power Shutoff support"],
    registrationNotes: "Wildfire-focused contractor needs. PSPS events and vegetation management are massive. ISNetworld required. Billions in wildfire mitigation spending.",
    annualStormSpend: "$2B+ (wildfire mitigation)"
  },
  {
    name: "Southern California Edison",
    states: ["CA"],
    region: "West",
    registrationUrl: "https://www.sce.com/about-us/who-we-are/doing-business-with-us",
    vendorPlatform: "ISNetworld / PowerAdvocate",
    stormPriority: "high",
    stormPriorityScore: 83,
    contractTypes: ["Wildfire mitigation", "Vegetation management", "Grid hardening", "Distribution maintenance"],
    registrationNotes: "Major wildfire mitigation spending. Vegetation management is critical. PowerAdvocate and ISNetworld compliance.",
    annualStormSpend: "$1.5B+ (wildfire mitigation)"
  },
  {
    name: "Oncor (TX)",
    states: ["TX"],
    region: "Gulf Coast",
    registrationUrl: "https://www.oncor.com/content/oncorwww/us/en/home/smart-energy-future/supplier-information.html",
    vendorPlatform: "ISNetworld",
    stormPriority: "high",
    stormPriorityScore: 82,
    contractTypes: ["Storm restoration", "Distribution construction", "Vegetation management", "Emergency response"],
    registrationNotes: "Texas' largest electric delivery company. Hurricane and severe storm exposure. ISNetworld safety compliance required.",
    annualStormSpend: "$150M+"
  },
  {
    name: "Evergy",
    states: ["KS", "MO"],
    region: "Midwest",
    registrationUrl: "https://www.evergy.com/about-evergy/suppliers-and-contractors",
    vendorPlatform: "ISNetworld",
    stormPriority: "medium",
    stormPriorityScore: 70,
    contractTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Ice storm response"],
    registrationNotes: "Kansas and Missouri. Ice storms and tornadoes. ISNetworld safety prequalification.",
    annualStormSpend: "$60M+"
  },
  {
    name: "FirstEnergy",
    states: ["OH", "PA", "WV", "MD", "NJ"],
    region: "Mid-Atlantic",
    registrationUrl: "https://www.firstenergycorp.com/supplier.html",
    vendorPlatform: "PowerAdvocate / ISNetworld",
    stormPriority: "medium",
    stormPriorityScore: 76,
    contractTypes: ["Storm restoration", "Vegetation management", "Transmission construction", "Distribution maintenance"],
    registrationNotes: "Uses the PowerAdvocate system for managing vendor records. Five-state footprint serving OH, PA, WV, MD, NJ. Nor'easters and severe weather drive contractor needs.",
    annualStormSpend: "$130M+",
    registrationSteps: [
      { step: 1, title: "Visit FirstEnergy Supplier Page", description: "Go to FirstEnergy's supplier registration page and review their vendor requirements.", estimatedTime: "15 minutes" },
      { step: 2, title: "Register on PowerAdvocate", description: "FirstEnergy uses the PowerAdvocate system for managing vendor records. Create your supplier profile.", documentsNeeded: ["W-9", "Company capabilities", "Insurance certificates"], estimatedTime: "1-2 hours" },
      { step: 3, title: "Complete ISNetworld Compliance", description: "Upload safety records, OSHA compliance, and training documentation to ISNetworld.", documentsNeeded: ["Safety manual", "OSHA logs", "EMR rating", "Drug testing program"], estimatedTime: "2-4 hours" },
      { step: 4, title: "Upload Insurance Documents", description: "Submit COI with FirstEnergy as Additional Insured. Include all required coverage.", documentsNeeded: ["COI", "Workers' comp", "Auto liability", "Umbrella coverage"], estimatedTime: "30 minutes" },
      { step: 5, title: "Submit State Licenses", description: "Provide contractor licenses for OH, PA, WV, MD, NJ as applicable.", documentsNeeded: ["State contractor licenses"], estimatedTime: "30 minutes" },
      { step: 6, title: "Send Introduction Email", description: "Draft a professional introduction to FirstEnergy's vendor management team.", estimatedTime: "15 minutes" }
    ]
  },
  {
    name: "Exelon (ComEd / PECO / BGE)",
    states: ["IL", "PA", "MD", "DE", "NJ", "DC"],
    region: "Mid-Atlantic / Midwest",
    registrationUrl: "https://www.exeloncorp.com/suppliers",
    vendorPlatform: "Exelon Sourcing Database",
    stormPriority: "high",
    stormPriorityScore: 80,
    contractTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Underground construction", "Emergency response"],
    registrationNotes: "Exelon allows suppliers to create a sourcing database profile to be considered for bid events. Includes utilities ComEd (IL), PECO (PA), BGE (MD), Pepco (DC/MD), Delmarva Power (DE/MD), and Atlantic City Electric (NJ). Useful for federal/utility projects across the Mid-Atlantic and Midwest regions.",
    annualStormSpend: "$200M+",
    registrationSteps: [
      { step: 1, title: "Visit Exelon Supplier Page", description: "Go to Exelon Corp's supplier page and review their vendor registration process. Exelon manages procurement centrally for all its utility subsidiaries.", estimatedTime: "15 minutes", tips: "One registration covers ComEd, PECO, BGE, Pepco, Delmarva Power, and Atlantic City Electric." },
      { step: 2, title: "Create Sourcing Database Profile", description: "Register in Exelon's supplier sourcing database. Complete your company profile with capabilities, certifications, and service areas.", documentsNeeded: ["W-9", "Company overview", "Capabilities statement", "Equipment list", "Past performance references"], estimatedTime: "1-2 hours" },
      { step: 3, title: "Upload Insurance & Compliance", description: "Submit all insurance documentation and safety compliance records as required by Exelon's vendor requirements.", documentsNeeded: ["COI", "Workers' comp", "Auto liability", "Umbrella coverage", "Safety manual"], estimatedTime: "1 hour" },
      { step: 4, title: "Submit Business Documents", description: "Provide W-9, EIN, state licenses for IL, PA, MD, DE, NJ, DC as applicable. Include any diversity or SBA certifications.", documentsNeeded: ["W-9", "EIN", "State licenses", "SBA/DBE certifications"], estimatedTime: "30 minutes" },
      { step: 5, title: "Monitor for Bid Events", description: "Once registered, Exelon's procurement team will consider your profile for relevant bid events and sourcing opportunities. Monitor your email for invitations.", estimatedTime: "Ongoing" },
      { step: 6, title: "Send Introduction Email", description: "Use the AI email generator to draft a professional introduction highlighting your multi-state storm response capabilities.", estimatedTime: "15 minutes", tips: "Mention which Exelon utilities' service territories you cover." }
    ]
  },
  {
    name: "WEC Energy Group",
    states: ["WI", "IL", "MI", "MN"],
    region: "Midwest",
    registrationUrl: "https://www.wecenergygroup.com/suppliers/",
    vendorPlatform: "SAP Ariba",
    stormPriority: "medium",
    stormPriorityScore: 68,
    contractTypes: ["Storm restoration", "Vegetation management", "Gas distribution", "Renewable construction"],
    registrationNotes: "Wisconsin-based. Winter storms and severe weather events.",
    annualStormSpend: "$50M+",
    registrationSteps: [
      { step: 1, title: "Visit WEC Energy Supplier Page", description: "Go to WEC Energy Group's suppliers page and review their vendor registration requirements.", estimatedTime: "15 minutes" },
      { step: 2, title: "Register on SAP Ariba", description: "WEC uses SAP Ariba for supplier registration and procurement events. Create your profile.", documentsNeeded: ["W-9", "Company capabilities", "Insurance certificates"], estimatedTime: "1 hour" },
      { step: 3, title: "Upload Safety & Insurance", description: "Submit safety documentation and insurance certificates meeting WEC requirements.", documentsNeeded: ["Safety manual", "COI", "Workers' comp", "EMR rating"], estimatedTime: "1 hour" },
      { step: 4, title: "Send Introduction Email", description: "Draft a professional introduction to WEC's procurement team.", estimatedTime: "15 minutes" }
    ]
  }
];

export const GOVERNMENT_PORTALS: GovernmentPortal[] = [
  {
    name: "State of Georgia — Team Georgia Marketplace",
    url: "https://doas.ga.gov/state-purchasing",
    type: "state",
    description: "Register to be a state vendor for local, county, and state government contracts in Georgia. Get notifications of procurement opportunities for ROW, emergency services, vegetation clearing, and maintenance.",
    region: "Southeast",
    registrationSteps: [
      { step: 1, title: "Visit Team Georgia Marketplace", description: "Go to the Georgia DOAS State Purchasing website and access the Team Georgia Marketplace vendor registration portal.", estimatedTime: "15 minutes" },
      { step: 2, title: "Create Vendor Account", description: "Register your company in the system with your EIN, business address, and contact information.", documentsNeeded: ["EIN", "Business registration", "Contact information"], estimatedTime: "30 minutes" },
      { step: 3, title: "Select Commodity Codes", description: "Choose the NIGP commodity codes that match your services (landscaping, tree removal, debris clearing, emergency services, etc.).", estimatedTime: "30 minutes", tips: "Select all applicable codes — this determines which bid notifications you receive." },
      { step: 4, title: "Upload Required Documents", description: "Submit business license, insurance, and any state-required vendor certifications.", documentsNeeded: ["GA business license", "COI", "W-9"], estimatedTime: "30 minutes" },
      { step: 5, title: "Monitor Bid Notifications", description: "Once registered, you'll receive automatic email notifications for matching procurement opportunities from state, county, and local agencies.", estimatedTime: "Ongoing" }
    ]
  },
  {
    name: "American Public Power Association (APPA)",
    url: "https://www.publicpower.org/supplier-guide",
    type: "association",
    description: "APPA represents community-owned utilities including municipal and cooperative power providers. Their supplier guide helps you find local utilities in towns and small cities to register with. Many municipal utilities hire contractors for storm-related services.",
    region: "Nationwide",
    registrationSteps: [
      { step: 1, title: "Visit APPA Supplier Guide", description: "Access the American Public Power Association's online supplier guide to find community-owned utilities looking for contractors.", estimatedTime: "15 minutes" },
      { step: 2, title: "Search for Municipal Utilities", description: "Use the supplier guide to identify municipal and cooperative utilities in your service area that need storm response and maintenance contractors.", estimatedTime: "1 hour", tips: "Many smaller municipal utilities have less competition for contractor spots than major IOUs." },
      { step: 3, title: "Contact Individual Utilities", description: "Reach out directly to each municipal utility's procurement or operations department. Smaller utilities often have simpler registration processes.", documentsNeeded: ["Capability statement", "COI", "W-9", "References"], estimatedTime: "Varies" },
      { step: 4, title: "Register as Local Vendor", description: "Complete each utility's individual vendor registration process. Many municipal utilities maintain their own approved contractor lists.", estimatedTime: "Varies by utility" }
    ]
  }
];

export const GEORGIA_EMCS: StateEMC[] = [
  { name: "Altamaha EMC", website: "https://altamahaemc.com", type: "emc", state: "GA", description: "Serves southeast Georgia communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Amicalola EMC", website: "https://amicalolaemc.com", type: "emc", state: "GA", description: "Serves north Georgia mountain communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Trucking/hauling"] },
  { name: "Blue Ridge Mountain EMC", website: "https://brmemc.com", type: "emc", state: "GA", description: "Serves Blue Ridge mountain area of north Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Canoochee EMC", website: "https://canoocheeemc.com", type: "emc", state: "GA", description: "Serves southeast Georgia area", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Carroll EMC", website: "https://cemc.com", type: "emc", state: "GA", description: "Serves west-central Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Central Georgia EMC", website: "https://cgemc.com", type: "emc", state: "GA", description: "Serves central Georgia communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Coastal Electric Cooperative", website: "https://coastalemc.com", type: "emc", state: "GA", description: "Serves Georgia's coastal communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Hurricane restoration", "Emergency response"] },
  { name: "Cobb EMC", website: "https://cobbemc.com", type: "emc", state: "GA", description: "Serves Cobb County and northwest metro Atlanta — one of the largest EMCs in Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Colquitt EMC", website: "https://colquittemc.com", type: "emc", state: "GA", description: "Serves southwest Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Coweta-Fayette EMC", website: "https://utility.org", type: "emc", state: "GA", description: "Serves Coweta and Fayette counties south of Atlanta", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Diverse Power Inc.", website: "https://diversepower.com", type: "emc", state: "GA", description: "Serves west Georgia and east Alabama border area", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Excelsior EMC", website: "https://excelsioremc.com", type: "emc", state: "GA", description: "Serves south-central Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Flint Energies", website: "https://flintenergies.com", type: "emc", state: "GA", description: "Serves middle Georgia area", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Grady EMC", website: "https://gradyemc.com", type: "emc", state: "GA", description: "Serves southwest Georgia near the Florida border", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "GreyStone Power Corporation", website: "https://greystonepower.com", type: "emc", state: "GA", description: "Serves west metro Atlanta — one of the largest EMCs in Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Habersham EMC", website: "https://habershamemc.com", type: "emc", state: "GA", description: "Serves northeast Georgia mountain area", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Hart EMC", website: "https://hartemc.com", type: "emc", state: "GA", description: "Serves northeast Georgia near Lake Hartwell", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Irwin EMC", website: "https://irwinemc.com", type: "emc", state: "GA", description: "Serves south-central Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Jackson EMC", website: "https://jacksonemc.com", type: "emc", state: "GA", description: "Serves northeast metro Atlanta and north Georgia — largest EMC in Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance", "Trucking/hauling"] },
  { name: "Jefferson Energy Cooperative", website: "https://jec.coop", type: "emc", state: "GA", description: "Serves Jefferson and surrounding counties in middle Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Little Ocmulgee EMC", website: "https://littleocmulgeeemc.com", type: "emc", state: "GA", description: "Serves southeast Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Middle Georgia EMC", website: "https://mgemc.com", type: "emc", state: "GA", description: "Serves middle Georgia communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Mitchell EMC", website: "https://mitchellemc.com", type: "emc", state: "GA", description: "Serves southwest Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "North Georgia EMC", website: "https://ngemc.com", type: "emc", state: "GA", description: "Serves north Georgia mountain communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Ocmulgee EMC", website: "https://ocmulgeeemc.com", type: "emc", state: "GA", description: "Serves east-central Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Oconee EMC", website: "https://oconeeemc.com", type: "emc", state: "GA", description: "Serves Oconee area of middle Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Okefenoke REMC", website: "https://oremc.com", type: "emc", state: "GA", description: "Serves southeast Georgia near the Okefenokee Swamp", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Planters EMC", website: "https://plantersemc.com", type: "emc", state: "GA", description: "Serves southeast Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Rayle EMC", website: "", type: "emc", state: "GA", description: "Serves northeast Georgia — check local site for vendor information", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration"] },
  { name: "Satilla REMC", website: "", type: "emc", state: "GA", description: "Serves southeast Georgia — check local site for vendor information", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration"] },
  { name: "Sawnee EMC", website: "https://sawnee.coop", type: "emc", state: "GA", description: "Serves north metro Atlanta and north Georgia — large membership cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Slash Pine EMC", website: "", type: "emc", state: "GA", description: "Serves southeast Georgia — check local site for vendor information", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration"] },
  { name: "Snapping Shoals EMC", website: "", type: "emc", state: "GA", description: "Serves east metro Atlanta area — check local site for vendor information", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration"] },
  { name: "Southern Rivers Energy", website: "https://southernriversenergy.com", type: "emc", state: "GA", description: "Serves west-central Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Sumter EMC", website: "", type: "emc", state: "GA", description: "Serves southwest Georgia — check local site for vendor information", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration"] },
  { name: "Three Notch EMC", website: "", type: "emc", state: "GA", description: "Serves south-central Georgia — check local site for vendor information", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration"] },
  { name: "Tri-County EMC", website: "https://tri-countyemc.com", type: "emc", state: "GA", description: "Serves southeast Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Tri-State EMC", website: "", type: "emc", state: "GA", description: "Serves northwest Georgia — check local site for vendor information", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration"] },
  { name: "Upson EMC", website: "https://upsonemc.com", type: "emc", state: "GA", description: "Serves west-central Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Walton EMC", website: "https://waltonemc.com", type: "emc", state: "GA", description: "Serves east metro Atlanta and northeast Georgia — large membership cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Washington EMC", website: "https://washingtonemc.com", type: "emc", state: "GA", description: "Serves east-central Georgia", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Oglethorpe Power Corporation", website: "https://opc.com", type: "support_org", state: "GA", description: "Generation supplier for many Georgia EMCs — generation and transmission cooperative. Registering here can open access to multiple EMC service territories.", serviceTypes: ["Generation support", "Transmission construction", "Vegetation management", "ROW clearing"] },
  { name: "Georgia Transmission Corporation", website: "", type: "support_org", state: "GA", description: "Transmission network supporting Georgia EMCs. Manages high-voltage transmission infrastructure across the state.", serviceTypes: ["Transmission construction", "ROW clearing", "Vegetation management", "Emergency restoration"] },
  { name: "Georgia System Operations Corporation", website: "", type: "support_org", state: "GA", description: "System operations and support organization for Georgia EMCs. Coordinates system reliability and emergency response.", serviceTypes: ["System operations support", "Emergency coordination", "Technical services"] },
  { name: "Green Power EMC", website: "", type: "support_org", state: "GA", description: "Renewables partner for Georgia EMCs. Manages renewable energy generation for the cooperative network.", serviceTypes: ["Renewable energy construction", "Solar installation", "Vegetation management"] }
];

export const ALABAMA_EMCS: StateEMC[] = [
  { name: "Arab Electric Cooperative", website: "https://arab-electric.org", type: "emc", state: "AL", description: "Serves Arab and surrounding communities in Marshall County", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Baldwin EMC", website: "https://www.baldwinemc.com", type: "emc", state: "AL", description: "Serves Baldwin County — Gulf Coast hurricane exposure", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Hurricane restoration", "Emergency response"] },
  { name: "Black Warrior EMC", website: "https://blackwarrioremc.com", type: "emc", state: "AL", description: "Serves west-central Alabama", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Central Alabama Electric Cooperative (CAEC)", website: "https://caec.coop", type: "emc", state: "AL", description: "Serves central Alabama — one of the largest cooperatives in the state", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance", "Trucking/hauling"] },
  { name: "Cherokee Electric Cooperative", website: "https://cherokee.coop", type: "emc", state: "AL", description: "Serves Cherokee County in northeast Alabama", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Clarke-Washington EMC", website: "https://cwemc.com", type: "emc", state: "AL", description: "Serves Clarke and Washington counties in southwest Alabama", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Coosa Valley Electric Cooperative", website: "https://coosavalleyec.com", type: "emc", state: "AL", description: "Serves Coosa Valley region of east-central Alabama", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Covington Electric Cooperative", website: "https://covington.coop", type: "emc", state: "AL", description: "Serves Covington County in south Alabama", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Cullman Electric Cooperative", website: "https://cullmanec.com", type: "emc", state: "AL", description: "Serves Cullman County in north-central Alabama", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Dixie Electric Cooperative", website: "https://www.dixie.coop", type: "emc", state: "AL", description: "Serves south Alabama communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Franklin Electric Cooperative", website: "https://fecoop.com", type: "emc", state: "AL", description: "Serves Franklin County in northwest Alabama", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Joe Wheeler EMC", website: "https://www.jwemc.coop", type: "emc", state: "AL", description: "Serves northwest Alabama — Tennessee Valley area", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Marshall-DeKalb Electric Cooperative", website: "https://mdec.org", type: "emc", state: "AL", description: "Serves Marshall and DeKalb counties in northeast Alabama", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "North Alabama Electric Cooperative", website: "https://naecoop.com", type: "emc", state: "AL", description: "Serves north Alabama communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Pea River Electric Cooperative", website: "https://peariver.com", type: "emc", state: "AL", description: "Serves southeast Alabama Wiregrass area", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Pioneer Electric Cooperative", website: "https://pioneerelectric.com", type: "emc", state: "AL", description: "Serves southeast Alabama", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Sand Mountain Electric Cooperative", website: "https://smec.coop", type: "emc", state: "AL", description: "Serves Sand Mountain region in northeast Alabama", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "South Alabama Electric Cooperative", website: "https://southaec.com", type: "emc", state: "AL", description: "Serves south Alabama communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Southern Pine Electric Cooperative", website: "https://www.southernpine.org", type: "emc", state: "AL", description: "Serves south-central Alabama", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Tallapoosa River Electric Cooperative", website: "https://trec.coop", type: "emc", state: "AL", description: "Serves east-central Alabama along the Tallapoosa River", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Tombigbee Electric Cooperative", website: "https://tombigbee.org", type: "emc", state: "AL", description: "Serves west Alabama communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Wiregrass Electric Cooperative", website: "https://wiregrass.coop", type: "emc", state: "AL", description: "Serves southeast Alabama Wiregrass region — tornado corridor", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Trucking/hauling"] },
  { name: "PowerSouth Energy Cooperative", website: "https://powersouth.com", type: "support_org", state: "AL", description: "Generation & transmission (G&T) cooperative supplying power to many Alabama EMCs. Registering here can open access to multiple EMC service territories.", serviceTypes: ["Generation support", "Transmission construction", "Vegetation management", "ROW clearing"] },
  { name: "Alabama Power Company", website: "https://www.alabamapower.com", type: "support_org", state: "AL", description: "Major investor-owned utility serving much of Alabama — key contractor target for storm restoration, vegetation management, and infrastructure work.", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission construction", "Emergency response"] },
  { name: "Alabama Rural Electric Association (AREA)", website: "https://areapower.coop", type: "support_org", state: "AL", description: "State association representing the Alabama EMC network. Useful for training, statewide contacts, and networking with all Alabama cooperatives.", serviceTypes: ["Industry networking", "Training programs", "Statewide contractor contacts"] }
];

export const ALASKA_EMCS: StateEMC[] = [
  { name: "Alaska Village Electric Cooperative (AVEC)", website: "https://www.avec.org", type: "emc", state: "AK", description: "Rural cooperative serving electricity to 58 villages across Alaska — largest rural utility in the state", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals", "Remote logistics"] },
  { name: "Chugach Electric Association", website: "https://www.chugachelectric.com", type: "emc", state: "AK", description: "Large cooperative serving the Anchorage area — acquired ML&P, one of Alaska's biggest utilities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance", "Line construction"] },
  { name: "Matanuska Electric Association", website: "https://www.mea.coop", type: "emc", state: "AK", description: "Major cooperative serving the Mat-Su Valley and surrounding areas north of Anchorage", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Golden Valley Electric Association", website: "https://www.gvea.com", type: "emc", state: "AK", description: "Serves Fairbanks and interior Alaska — extreme winter conditions require specialized contractors", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals", "Winter storm response"] },
  { name: "Copper Valley Electric Association", website: "https://www.cvea.org", type: "emc", state: "AK", description: "Electric cooperative serving Glennallen and surrounding remote areas", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Equipment rentals", "Remote logistics"] },
  { name: "Kodiak Electric Association", website: "https://www.kodiakelectric.com", type: "emc", state: "AK", description: "Cooperative serving Kodiak Island communities — island logistics apply", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Storm debris removal", "Equipment rentals"] },
  { name: "Homer Electric Association", website: "https://www.homerelectric.com", type: "emc", state: "AK", description: "Regionally significant cooperative on the Kenai Peninsula", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Naknek Electric Association", website: "", type: "emc", state: "AK", description: "Cooperative serving Naknek and surrounding Bristol Bay region — check main site for vendor info", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Equipment rentals"] },
  { name: "Barrow Utilities & Electric Cooperative", website: "https://www.barrowutilities.com", type: "emc", state: "AK", description: "Public cooperative in Utqiagvik (formerly Barrow) — Arctic conditions, specialized work", serviceTypes: ["Emergency restoration", "Equipment rentals", "Remote logistics"] },
  { name: "Anchorage Municipal Light & Power", website: "https://www.muni.org/Departments/prior/prior/ML&P", type: "emc", state: "AK", description: "Public utility in Anchorage — now part of Chugach Electric but may have separate vendor processes", serviceTypes: ["Distribution maintenance", "Emergency restoration", "Storm debris removal"] },
  { name: "City of Petersburg Municipal Power & Light", website: "https://www.ci.petersburg.ak.us", type: "emc", state: "AK", description: "Municipal utility in Petersburg, southeast Alaska", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "Sitka Electric Utility", website: "https://www.ci.sitka.ak.us", type: "emc", state: "AK", description: "Public power provider in Sitka, southeast Alaska", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Unalaska Electric Utility", website: "https://unalaskapublicutilities.org", type: "emc", state: "AK", description: "Municipal utility serving Unalaska in the Aleutian Islands", serviceTypes: ["Emergency restoration", "Equipment rentals", "Remote logistics"] },
  { name: "Alaska Electric Light & Power (AEL&P)", website: "https://www.aelp.com", type: "support_org", state: "AK", description: "Investor-owned utility serving Juneau — independent supplier/vendor registration system", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Alaska Power & Telephone Co. (AP&T)", website: "https://www.apandt.com", type: "support_org", state: "AK", description: "Utility serving parts of southeast Alaska — independent vendor registration available", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance", "Telecommunications support"] }
];

export const ARIZONA_EMCS: StateEMC[] = [
  { name: "Arizona Electric Cooperative (AEC)", website: "https://www.aeaz.com", type: "emc", state: "AZ", description: "Member-owned cooperative serving rural and regional areas of Arizona", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Mohave Electric Cooperative (MEC)", website: "https://www.mohaveelectric.com", type: "emc", state: "AZ", description: "Cooperative serving Mohave County and surrounding areas in northwest Arizona", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Navopache Electric Cooperative", website: "https://www.navopache.org", type: "emc", state: "AZ", description: "Cooperative serving the White Mountains region of eastern Arizona", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Trico Electric Cooperative", website: "https://www.trico.coop", type: "emc", state: "AZ", description: "Cooperative serving northwest Tucson and surrounding Pima County areas", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "UNS Electric (UniSource Energy)", website: "https://www.uns.com", type: "emc", state: "AZ", description: "Operates electric cooperatives and serves commercial/retail customers in southern Arizona — part of Fortis", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Arizona Public Service (APS)", website: "https://www.aps.com", type: "support_org", state: "AZ", description: "Largest utility in Arizona with vendor/contractor portal and storm-response contractor lists. Formal procurement system for all contractor work.", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission construction", "Emergency response", "ROW clearing"] },
  { name: "Salt River Project (SRP)", website: "https://www.srpnet.com", type: "support_org", state: "AZ", description: "Major utility covering Phoenix metro area with supplier/vendor registration system. Large-scale infrastructure and storm response.", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission construction", "Emergency response"] },
  { name: "Tucson Electric Power (TEP)", website: "https://www.tep.com", type: "support_org", state: "AZ", description: "Primary electric utility for Tucson with supplier info and procurement portal.", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Emergency response"] },
  { name: "UniSource Energy Services", website: "https://www.uns.com", type: "support_org", state: "AZ", description: "Provides electricity and gas in southern Arizona — now part of Fortis group.", serviceTypes: ["Distribution maintenance", "Vegetation management", "Emergency response"] },
  { name: "City of Scottsdale Electric Utility", website: "https://www.scottsdaleaz.gov/utility", type: "emc", state: "AZ", description: "Municipal electric utility serving Scottsdale", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Mesa — Power Division", website: "https://www.mesaaz.gov/residents/utilities", type: "emc", state: "AZ", description: "Municipal power division serving Mesa", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Glendale — Water & Energy Services", website: "https://www.glendaleaz.com/utilities", type: "emc", state: "AZ", description: "Municipal utility serving Glendale", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Flagstaff — Electric Utility", website: "https://www.flagstaffaz.gov/utilities", type: "emc", state: "AZ", description: "Municipal electric utility serving Flagstaff — winter storm exposure at elevation", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Winter storm response"] },
  { name: "City of Payson — Electric Department", website: "https://www.paysonutilities.org", type: "emc", state: "AZ", description: "Municipal electric utility serving Payson in the Rim Country", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Kingman — Electric Department", website: "https://www.cityofkingman.gov/departments/electric", type: "emc", state: "AZ", description: "Municipal electric utility serving Kingman in northwest Arizona", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Safford — Electric Utility", website: "https://www.cityofsafford.us/electric-department", type: "emc", state: "AZ", description: "Municipal electric utility serving Safford in eastern Arizona", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "Arizona Electric Power Cooperative (AEPCO)", website: "https://www.aepco.com", type: "support_org", state: "AZ", description: "Generation & transmission cooperative supporting Arizona utilities. Registering here can open access to multiple cooperative service territories.", serviceTypes: ["Generation support", "Transmission construction", "Vegetation management", "ROW clearing"] },
  { name: "Arizona Utility Suppliers Association", website: "https://azusa.org", type: "support_org", state: "AZ", description: "Networking and vendor contact group for utilities and suppliers — great for industry connections and procurement contacts.", serviceTypes: ["Industry networking", "Vendor contacts", "Procurement access"] },
  { name: "Arizona Municipal Electric Association (AMEA)", website: "https://www.amea.org", type: "support_org", state: "AZ", description: "Association representing municipal utilities in Arizona — great for contacts, industry events, and vendor opportunities.", serviceTypes: ["Industry networking", "Municipal utility contacts", "Training programs"] }
];

export const ARKANSAS_EMCS: StateEMC[] = [
  { name: "Craighead Electric Cooperative", website: "https://www.craighead-electric.coop", type: "emc", state: "AR", description: "Serves Craighead County in northeast Arkansas", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Carroll Electric Cooperative", website: "https://www.carrollelectric.com", type: "emc", state: "AR", description: "Serves Carroll County and northwest Arkansas — one of the larger Arkansas cooperatives", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Clay County Electric Cooperative", website: "https://www.ccecelectric.org", type: "emc", state: "AR", description: "Serves Clay County in northeast Arkansas", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Crawford Electric Cooperative", website: "https://www.cecarkansas.com", type: "emc", state: "AR", description: "Serves Crawford County in western Arkansas", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "Crooked Creek Electric Cooperative", website: "https://www.crookedcreek.com", type: "emc", state: "AR", description: "Serves north-central Arkansas communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "First Electric Cooperative", website: "https://www.firstelectric.coop", type: "emc", state: "AR", description: "Serves central Arkansas — one of the largest cooperatives in the state", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance", "Trucking/hauling"] },
  { name: "Mississippi County Electric Cooperative", website: "https://www.mceci.com", type: "emc", state: "AR", description: "Serves Mississippi County in northeast Arkansas delta region", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "North Arkansas Electric Cooperative (NAEC)", website: "https://www.naeci.com", type: "emc", state: "AR", description: "Serves north-central Arkansas communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Ouachita Electric Cooperative", website: "https://www.oecc.com", type: "emc", state: "AR", description: "Serves southwest Arkansas Ouachita region", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Rich Mountain Electric Cooperative", website: "https://www.rmec.com", type: "emc", state: "AR", description: "Serves western Arkansas mountain communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Line clearing"] },
  { name: "South Arkansas Electric Cooperative (SAEC)", website: "https://www.saec.coop", type: "emc", state: "AR", description: "Serves south Arkansas communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Southwest Arkansas Electric Cooperative", website: "https://www.swrelectric.com", type: "emc", state: "AR", description: "Serves southwest Arkansas communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Independence County Electric Cooperative", website: "https://www.icec.coop", type: "emc", state: "AR", description: "Serves Independence County in north-central Arkansas", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "City of Fayetteville Electric Utility", website: "https://www.fayettevillear.gov/1265/Electric-Utilities", type: "emc", state: "AR", description: "Municipal electric utility serving Fayetteville — northwest Arkansas", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Fort Smith Electric Utilities", website: "https://www.fortsmithar.gov/225/Electric-Utilities", type: "emc", state: "AR", description: "Municipal utility serving Fort Smith — western Arkansas", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Conway Utilities (Electric)", website: "https://www.cityofconway.org/utilities", type: "emc", state: "AR", description: "Municipal electric utility serving Conway — central Arkansas", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Benton Electric System", website: "https://www.bentoneg.com/electric", type: "emc", state: "AR", description: "Municipal electric system serving Benton — central Arkansas", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Russellville Electric Department", website: "https://www.russellvillearkansas.org/electric", type: "emc", state: "AR", description: "Municipal electric utility serving Russellville — Arkansas River Valley", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Pine Bluff Electric Division", website: "https://www.cityofpinebluff-ar.gov/128/Electric-Department", type: "emc", state: "AR", description: "Municipal electric utility serving Pine Bluff — southeast Arkansas", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of North Little Rock Electric Department", website: "https://www.nlr.ar.gov/electric", type: "emc", state: "AR", description: "Municipal electric utility serving North Little Rock", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Springdale Electric Utility", website: "https://www.springdalear.gov/99/Electric-Utilities", type: "emc", state: "AR", description: "Municipal electric utility serving Springdale — northwest Arkansas", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "Arkansas Electric Cooperative Corporation (AECC)", website: "https://www.aecc.com", type: "support_org", state: "AR", description: "Generation & transmission (G&T) cooperative supplying power to most Arkansas distribution cooperatives. Registering here can open access to multiple co-op service territories.", serviceTypes: ["Generation support", "Transmission construction", "Vegetation management", "ROW clearing"] },
  { name: "Entergy Arkansas", website: "https://www.entergy.com/about/suppliers", type: "support_org", state: "AR", description: "Major investor-owned utility — part of Entergy. Big storm response program and formal supplier portal for all contractor work.", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission construction", "Emergency response"] },
  { name: "Southwestern Electric Power Company (SWEPCO)", website: "https://www.swepco.com/aboutswepco/procurement", type: "support_org", state: "AR", description: "Part of American Electric Power (AEP). Formal supplier registration and procurement system for contractor work in Arkansas.", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission construction"] },
  { name: "CenterPoint Energy Arkansas", website: "https://www.centerpointenergy.com/en-us/about/suppliers/", type: "support_org", state: "AR", description: "Gas and electric services in Arkansas with formal supplier registration system.", serviceTypes: ["Distribution maintenance", "Vegetation management", "Emergency response", "Gas distribution"] }
];

export const CALIFORNIA_EMCS: StateEMC[] = [
  { name: "Plumas-Sierra Rural Electric Cooperative", website: "https://psrec.coop", type: "emc", state: "CA", description: "Rural electric cooperative serving northeast California communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Lassen Municipal Utility District (LMUD)", website: "https://www.lmud.org", type: "emc", state: "CA", description: "Municipal utility serving Lassen County in northeast California", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Modesto Irrigation District (MID)", website: "https://www.mid.org", type: "emc", state: "CA", description: "Irrigation and electric district serving Modesto area — vendor portal: https://www.mid.org/business/contracting", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Turlock Irrigation District (TID)", website: "https://www.tid.org", type: "emc", state: "CA", description: "Irrigation and electric district serving Turlock and surrounding areas in the Central Valley", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Los Angeles Dept of Water & Power (LADWP)", website: "https://www.ladwp.com", type: "emc", state: "CA", description: "Largest municipal utility in the United States — serves the City of Los Angeles", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Sacramento Municipal Utility District (SMUD)", website: "https://www.smud.org", type: "emc", state: "CA", description: "Major municipal utility serving Sacramento County — vendor portal: https://www.smud.org/en/Business-Community/Doing-Business-with-SMUD", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Burbank Water & Power", website: "https://www.burbankwaterandpower.com", type: "emc", state: "CA", description: "Municipal utility serving the City of Burbank", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Anaheim Public Utilities", website: "https://www.anaheim.net", type: "emc", state: "CA", description: "Municipal utility serving the City of Anaheim in Orange County", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Pasadena Water & Power", website: "https://www.cityofpasadena.net", type: "emc", state: "CA", description: "Municipal utility serving the City of Pasadena", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Riverside Public Utilities", website: "https://www.riversideca.gov/utilities", type: "emc", state: "CA", description: "Municipal utility serving the City of Riverside in the Inland Empire", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Bakersfield Electric Division", website: "https://www.bakersfieldcity.us", type: "emc", state: "CA", description: "Municipal electric utility serving the City of Bakersfield in the San Joaquin Valley", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Glendale Water & Power", website: "https://www.glendaleca.gov", type: "emc", state: "CA", description: "Municipal utility serving the City of Glendale in Los Angeles County", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Pacific Gas & Electric (PG&E)", website: "https://www.pge.com", type: "support_org", state: "CA", description: "Largest investor-owned utility in California — formal supplier portal: https://www.pge.com/en_US/about-pge/company-information/procurement/supplier/vendor-information.page", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission", "Wildfire mitigation"] },
  { name: "Southern California Edison (SCE)", website: "https://www.sce.com", type: "support_org", state: "CA", description: "Major investor-owned utility serving southern California — supplier portal: https://www.sce.com/business/suppliers", serviceTypes: ["Storm restoration", "Vegetation management", "Wildfire mitigation", "Distribution maintenance"] },
  { name: "San Diego Gas & Electric (SDG&E)", website: "https://www.sdge.com", type: "support_org", state: "CA", description: "Investor-owned utility serving San Diego and southern Orange County", serviceTypes: ["Vegetation management", "Storm restoration", "Wildfire mitigation", "Distribution maintenance"] },
  { name: "Southern California Gas (SoCalGas)", website: "https://www.socalgas.com", type: "support_org", state: "CA", description: "Gas utility serving southern California with formal supplier program", serviceTypes: ["Gas distribution", "Emergency response", "Pipeline maintenance"] },
  { name: "PacifiCorp/Pacific Power (CA region)", website: "https://www.pacificorp.com", type: "support_org", state: "CA", description: "Serves parts of northern California as part of the PacifiCorp system", serviceTypes: ["Vegetation management", "Storm restoration", "ROW clearing"] },
];

export const COLORADO_EMCS: StateEMC[] = [
  { name: "Arkansas Valley Electric Association (AVEA)", website: "https://www.avea.coop", type: "emc", state: "CO", description: "Electric cooperative serving the Arkansas Valley region of Colorado", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Delta-Montrose Electric Association (DMEA)", website: "https://www.dmea.com", type: "emc", state: "CO", description: "Electric cooperative serving Delta and Montrose counties on the Western Slope", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Empire Electric Association", website: "https://www.eea.coop", type: "emc", state: "CO", description: "Electric cooperative serving the Four Corners region of southwest Colorado", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Highline Electric Association (HEA)", website: "https://www.hea.coop", type: "emc", state: "CO", description: "Electric cooperative serving northeast Colorado's eastern plains", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Intermountain Rural Electric Association (IREA)", website: "https://www.irea.coop", type: "emc", state: "CO", description: "One of Colorado's largest cooperatives — serves the Front Range foothills and mountain communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "La Plata Electric Association (LPEA)", website: "https://www.lpea.coop", type: "emc", state: "CO", description: "Electric cooperative serving La Plata and Archuleta counties in southwest Colorado", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Mountain View Electric Association (MVEA)", website: "https://www.mvea.coop", type: "emc", state: "CO", description: "Electric cooperative serving eastern El Paso and Elbert counties along the Front Range", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "San Isabel Electric Association (SIEA)", website: "https://www.siea.com", type: "emc", state: "CO", description: "Electric cooperative serving southern Colorado including Huerfano and Las Animas counties", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "United Power, Inc.", website: "https://www.unitedpower.com", type: "emc", state: "CO", description: "Electric cooperative serving the northern Denver metro and surrounding communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "United Electric Cooperative (UEC)", website: "https://www.unitedelectric.coop", type: "emc", state: "CO", description: "Electric cooperative serving rural eastern Colorado communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Yampa Valley Electric Association (YVEA)", website: "https://www.yvea.com", type: "emc", state: "CO", description: "Electric cooperative serving the Yampa Valley and Steamboat Springs area in northwest Colorado", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Boulder Electric Utility", website: "https://bouldercolorado.gov/utility", type: "emc", state: "CO", description: "Municipal electric utility serving the City of Boulder", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Fort Collins Electric Utility", website: "https://www.fcgov.com/utilities", type: "emc", state: "CO", description: "Municipal electric utility serving the City of Fort Collins in northern Colorado", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Glenwood Springs Electric", website: "https://www.cogs.us/166/Electric", type: "emc", state: "CO", description: "Municipal electric utility serving Glenwood Springs on the Western Slope", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Town of Estes Park Electric", website: "https://www.estes.org/281/Electric", type: "emc", state: "CO", description: "Municipal electric utility serving the Town of Estes Park near Rocky Mountain National Park", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Xcel Energy (Colorado)", website: "https://www.xcelenergy.com", type: "support_org", state: "CO", description: "Largest investor-owned utility in Colorado — formal supplier portal: https://www.xcelenergy.com/working_with_us/suppliers", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission"] },
  { name: "Black Hills Energy", website: "https://www.blackhillsenergy.com", type: "support_org", state: "CO", description: "Investor-owned utility serving southern and eastern Colorado communities", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance"] },
  { name: "Colorado Springs Utilities", website: "https://coloradosprings.gov/utilities", type: "support_org", state: "CO", description: "Major municipal utility serving Colorado Springs and surrounding areas", serviceTypes: ["Vegetation management", "Storm restoration", "Distribution maintenance"] },
  { name: "Western Area Power Administration (WAPA)", website: "https://www.wapa.gov", type: "support_org", state: "CO", description: "Federal transmission agency serving the Rocky Mountain region with power marketing and transmission", serviceTypes: ["Transmission construction", "ROW clearing", "Federal power"] },
];

export const CONNECTICUT_EMCS: StateEMC[] = [
  { name: "Groton Utilities", website: "https://grotonutilities.com", type: "emc", state: "CT", description: "Municipal electric utility serving Groton — member of CMEEC", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "Bozrah Light & Power Company", website: "https://www.bozrahpower.com", type: "emc", state: "CT", description: "Municipal electric utility serving Bozrah — member of CMEEC", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "Jewett City Dept of Public Utilities", website: "https://www.jewettcitydpu.com", type: "emc", state: "CT", description: "Municipal electric utility serving Jewett City — member of CMEEC", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "Norwich Public Utilities", website: "https://www.norwichpublicutilities.com", type: "emc", state: "CT", description: "Municipal electric utility serving Norwich — member of CMEEC", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "South Norwalk Electric & Water (SNEW)", website: "https://www.snew.org", type: "emc", state: "CT", description: "Municipal electric and water utility serving South Norwalk — member of CMEEC", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "Wallingford Electric Division", website: "https://www.wallingfordutilities.com", type: "emc", state: "CT", description: "Municipal electric utility serving the Town of Wallingford", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "East Norwalk Electric (Third Taxing District)", website: "https://www.tnd.org", type: "emc", state: "CT", description: "Municipal electric utility serving East Norwalk — member of CMEEC", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "Eversource Energy", website: "https://www.eversource.com", type: "support_org", state: "CT", description: "Main investor-owned utility covering most of Connecticut with extensive storm response operations", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission"] },
  { name: "The United Illuminating Company", website: "https://www.uinet.com", type: "support_org", state: "CT", description: "Investor-owned utility covering southern Connecticut including Bridgeport and New Haven areas", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance"] },
  { name: "Connecticut Municipal Electric Energy Cooperative (CMEEC)", website: "https://cmeec.com", type: "support_org", state: "CT", description: "Wholesale cooperative providing power and support services for Connecticut's municipal utilities", serviceTypes: ["Wholesale power", "Cooperative projects", "Municipal utility support"] },
];

export const DELAWARE_EMCS: StateEMC[] = [
  { name: "Delaware Electric Cooperative", website: "https://www.delaware.coop", type: "emc", state: "DE", description: "Main rural electric cooperative serving Kent and Sussex Counties in Delaware", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Dover Electric Department", website: "https://www.cityofdover.com", type: "emc", state: "DE", description: "Municipal electric utility serving the state capital of Dover", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Newark Electric Department", website: "https://newarkde.gov", type: "emc", state: "DE", description: "Municipal electric utility serving the City of Newark — bids portal: https://newarkde.gov/Bids.aspx", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Milford Electric Department", website: "https://www.cityofmilford.com", type: "emc", state: "DE", description: "Municipal electric utility serving the City of Milford in central Delaware", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Seaford Electric Department", website: "https://www.seafordde.com", type: "emc", state: "DE", description: "Municipal electric utility serving the City of Seaford in western Sussex County", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "Lewes Board of Public Works", website: "https://www.lewesbpw.com", type: "emc", state: "DE", description: "Municipal utility serving the City of Lewes on the Delaware coast", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of New Castle MSC", website: "https://newcastlemsc.com", type: "emc", state: "DE", description: "Municipal services commission serving the City of New Castle", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "Town of Smyrna Electric", website: "https://www.smyrnade.com", type: "emc", state: "DE", description: "Municipal electric utility serving the Town of Smyrna in northern Kent County", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "Town of Middletown Electric", website: "https://www.middletownde.org", type: "emc", state: "DE", description: "Municipal electric utility serving the Town of Middletown in southern New Castle County", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "Town of Clayton Electric", website: "https://www.townofclayton.com", type: "emc", state: "DE", description: "Municipal electric utility serving the Town of Clayton in Kent County", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "Delmarva Power (Exelon)", website: "https://www.delmarva.com", type: "support_org", state: "DE", description: "Largest investor-owned utility in Delaware — part of Exelon serving most of the state", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission"] },
  { name: "Delaware Municipal Electric Corporation (DEMEC)", website: "https://www.demecinc.net", type: "support_org", state: "DE", description: "Joint action agency providing wholesale power and support for 9 Delaware municipal utilities", serviceTypes: ["Wholesale power", "Municipal utility support", "Cooperative projects"] },
  { name: "Delaware State Procurement Portal", website: "https://mymarketplace.delaware.gov", type: "support_org", state: "DE", description: "State vendor registration portal for Delaware government and municipal contracts", serviceTypes: ["State contracts", "Municipal contracts", "Bid notifications"] },
];

export const FLORIDA_EMCS: StateEMC[] = [
  { name: "Clay Electric Cooperative", website: "https://bidding.clayelectric.com/", type: "emc", state: "FL", description: "Large cooperative with bidding portal", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "SECO Energy", website: "https://bidding.secoenergy.com/", type: "emc", state: "FL", description: "Cooperative with bid portal", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Seminole Electric Cooperative", website: "https://bidding.seminole-electric.com/", type: "emc", state: "FL", description: "G&T cooperative with bid portal", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Kissimmee Utility Authority (KUA)", website: "https://kua.com/about-kua/corporate-information/procurement/", type: "emc", state: "FL", description: "Municipal utility with procurement portal", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Gainesville Regional Utilities (GRU)", website: "https://www.gru.com/Work-With-GRU/Procurement", type: "emc", state: "FL", description: "Municipal utility with vendor page", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "JEA (Jacksonville Electric Authority)", website: "https://www.jea.com/", type: "emc", state: "FL", description: "One of FL's largest public utilities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Homestead Electric", website: "https://www.homesteadfl.gov/594/Vendor-Registration", type: "emc", state: "FL", description: "Municipal utility with vendor registration", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Tallahassee Utilities", website: "https://www.talgov.com/doingbusiness/vendorlookup", type: "emc", state: "FL", description: "Municipal utility with vendor lookup", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Florida Power & Light (FPL)", website: "https://www.fpl.com", type: "support_org", state: "FL", description: "Largest FL utility — supplier registration: https://www.fpl.com/northwest/about/our-company/supplier-registration.html", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission", "Hurricane response"] },
  { name: "Duke Energy Florida", website: "https://www.duke-energy.com", type: "support_org", state: "FL", description: "Major IOU — supplier diversity: https://www.duke-energy.com/partner-with-us/suppliers/supplier-diversity", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission"] },
  { name: "Tampa Electric Company (TECO)", website: "https://www.tecoenergy.com/", type: "support_org", state: "FL", description: "Major investor-owned utility serving the Tampa Bay area", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance"] },
  { name: "Florida Public Utilities (FPU)", website: "https://www.fpu.com/", type: "support_org", state: "FL", description: "Smaller investor-owned utility in Florida", serviceTypes: ["Distribution maintenance", "Vegetation management", "Emergency response"] },
  { name: "MyFloridaMarketPlace", website: "https://vendor.myfloridamarketplace.com/", type: "support_org", state: "FL", description: "State vendor registration portal for Florida government contracts", serviceTypes: ["State contracts", "Storm/ROW services", "Equipment", "Construction"] },
];

export const HAWAII_EMCS: StateEMC[] = [
  { name: "Hawaiian Electric (HECO)", website: "https://www.hawaiianelectric.com", type: "emc", state: "HI", description: "Main utility on O'ahu, Maui, Hawai'i Island — procurement: https://www.hawaiianelectric.com/about-us/procurement-and-suppliers", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance", "Storm response"] },
  { name: "Kauai Island Utility Cooperative (KIUC)", website: "https://kiuc.coop", type: "emc", state: "HI", description: "Only electric cooperative in Hawaii, serves Kauai", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance", "Storm response"] },
  { name: "Hawaii Public Utilities Commission", website: "https://puc.hawaii.gov", type: "support_org", state: "HI", description: "Regulatory body for utility compliance in Hawaii", serviceTypes: ["Regulatory compliance", "Supplier licensing", "Utility oversight"] },
];

export const IDAHO_EMCS: StateEMC[] = [
  { name: "Clearwater Power Company", website: "https://www.clearwaterpower.com", type: "emc", state: "ID", description: "Cooperative serving north-central Idaho", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Fall River Rural Electric Cooperative", website: "https://fallriverelectric.com", type: "emc", state: "ID", description: "Eastern Idaho cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Idaho County Light & Power Cooperative", website: "https://iclp.coop", type: "emc", state: "ID", description: "Serves Idaho County", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Kootenai Electric Cooperative", website: "https://www.kec.com", type: "emc", state: "ID", description: "Northern Idaho cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Lost River Electric Cooperative", website: "https://www.lostriverelec.coop", type: "emc", state: "ID", description: "Central Idaho cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Northern Lights, Inc.", website: "https://www.nli.coop", type: "emc", state: "ID", description: "North Idaho cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Raft River Rural Electric Cooperative", website: "https://www.rrelectric.com", type: "emc", state: "ID", description: "South-central Idaho cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Salmon River Electric Cooperative", website: "https://www.srec.org", type: "emc", state: "ID", description: "Central Idaho mountains cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "United Electric Co-op", website: "https://www.uec.coop", type: "emc", state: "ID", description: "Southern Idaho cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Idaho Power Company", website: "https://www.idahopower.com", type: "support_org", state: "ID", description: "Main IOU serving southern Idaho — supplier portal: https://www.idahopower.com/doing-business-with-us/suppliers/", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission", "Wildfire mitigation"] },
  { name: "Rocky Mountain Power/PacifiCorp", website: "https://www.pacificorp.com", type: "support_org", state: "ID", description: "Serves eastern Idaho — supplier portal: https://www.pacificorp.com/suppliers.html", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission"] },
];

export const ILLINOIS_EMCS: StateEMC[] = [
  { name: "Monroe County Electric Cooperative", website: "https://mcec.org/", type: "emc", state: "IL", description: "Southern Illinois cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "SouthEastern Illinois Electric Cooperative", website: "https://seiec.com/", type: "emc", state: "IL", description: "Southeastern Illinois cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Norris Electric Cooperative", website: "https://www.norriselectric.com", type: "emc", state: "IL", description: "Central-eastern Illinois cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Shelby Electric Cooperative", website: "https://www.shelbyelectric.coop", type: "emc", state: "IL", description: "Central Illinois cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Southern Illinois Electric Cooperative", website: "https://www.siec.coop", type: "emc", state: "IL", description: "Southern Illinois cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Southwestern Electric Cooperative", website: "https://www.sweci.com", type: "emc", state: "IL", description: "Southwestern Illinois cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Spoon River Electric Cooperative", website: "https://www.sre.coop", type: "emc", state: "IL", description: "West-central Illinois cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Tri-County Electric Cooperative", website: "https://www.tricountyelectric.org", type: "emc", state: "IL", description: "Central Illinois cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Wayne-White Electric Cooperative", website: "https://www.waynewhiteelectric.com", type: "emc", state: "IL", description: "Southeastern Illinois cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Western Illinois Electrical Coop", website: "https://www.wiec.net", type: "emc", state: "IL", description: "Western Illinois cooperative", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "City Water, Light & Power (CWLP)", website: "http://www.cwlp.com", type: "emc", state: "IL", description: "Springfield municipal utility", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Commonwealth Edison (ComEd)", website: "https://www.comed.com/", type: "support_org", state: "IL", description: "Largest IL utility, serves northern IL and Chicago metro area", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission"] },
  { name: "Ameren Illinois", website: "https://www.ameren.com/partners/suppliers", type: "support_org", state: "IL", description: "Central and southern Illinois utility with supplier portal", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission"] },
  { name: "MidAmerican Energy", website: "https://www.midamericanenergy.com", type: "support_org", state: "IL", description: "Utility serving western Illinois", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance"] },
  { name: "Illinois Power Agency", website: "https://ipa.illinois.gov/electricity-procurement.html", type: "support_org", state: "IL", description: "Statewide electricity procurement agency", serviceTypes: ["Competitive procurement", "Energy supply", "State contracts"] },
  { name: "Rural Electric Convenience Cooperative (RECC) Directory", website: "https://www.recc.coop/illinois-cooperatives/", type: "support_org", state: "IL", description: "Directory of Illinois electric cooperatives for vendor opportunities", serviceTypes: ["Cooperative directory", "Vendor opportunities", "Industry networking"] },
];

export const IOWA_EMCS: StateEMC[] = [
  { name: "Northeast Iowa Energy Cooperative", website: "https://www.niecoop.com", type: "emc", state: "IA", description: "Serves northeast Iowa communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "East River Electric Cooperative", website: "https://www.eastriver.coop", type: "emc", state: "IA", description: "Regional cooperative serving eastern Iowa", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Heartland Power Cooperative", website: "https://www.heartlandpower.us", type: "emc", state: "IA", description: "Serves north-central Iowa", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Maquoketa Valley Electric Cooperative", website: "https://www.mvec.com", type: "emc", state: "IA", description: "Serves eastern Iowa Maquoketa Valley region", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "North West Rural Electric Cooperative (NWREC)", website: "https://www.nwrec.coop", type: "emc", state: "IA", description: "Serves northwest Iowa rural communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Raccoon Valley Electric Cooperative", website: "https://www.rvec.coop", type: "emc", state: "IA", description: "Serves central Iowa Raccoon Valley area", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Southern Iowa Electric Cooperative", website: "https://www.siec.coop", type: "emc", state: "IA", description: "Serves southern Iowa communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Tipton Electric Cooperative", website: "https://www.tiptonelectric.com", type: "emc", state: "IA", description: "Serves Tipton area in eastern Iowa", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Access Energy Cooperative", website: "https://accessenergycoop.com", type: "emc", state: "IA", description: "Serves southeastern Iowa", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Butler County Rural Electric Cooperative", website: "https://butlerrec.com", type: "emc", state: "IA", description: "Serves Butler County in north-central Iowa", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Calhoun County Electric Cooperative", website: "https://www.ccrec.coop", type: "emc", state: "IA", description: "Serves Calhoun County in central Iowa", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Crawford County Electric Cooperative", website: "https://www.crawfordrec.com", type: "emc", state: "IA", description: "Serves Crawford County in western Iowa", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Clay Rural Electric Cooperative", website: "https://www.clayrec.com", type: "emc", state: "IA", description: "Serves Clay County in northwest Iowa", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Corn Belt Power Cooperative", website: "https://www.cornbeltpower.com", type: "emc", state: "IA", description: "G&T cooperative providing power to many Iowa distribution co-ops", serviceTypes: ["Generation support", "Transmission construction", "Vegetation management", "ROW clearing"] },
  { name: "Hawkeye Electric Cooperative", website: "https://www.hawkeyerec.com", type: "emc", state: "IA", description: "Serves central Iowa communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Iowa Lakes Electric Cooperative", website: "https://www.ilec.coop", type: "emc", state: "IA", description: "Serves Iowa Great Lakes region in northwest Iowa", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Linn County Rural Electric Cooperative", website: "https://linncountyrec.com", type: "emc", state: "IA", description: "Serves Linn County in eastern Iowa", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Nodaway Valley Electric Cooperative", website: "https://www.nodawayrec.com", type: "emc", state: "IA", description: "Serves southwest Iowa Nodaway Valley area", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Northwest Iowa Power Cooperative (NIPCO)", website: "https://www.nipco.coop", type: "emc", state: "IA", description: "G&T cooperative serving northwest Iowa distribution co-ops", serviceTypes: ["Generation support", "Transmission construction", "Vegetation management", "ROW clearing"] },
  { name: "Osceola Electric Cooperative", website: "https://www.osceolaec.coop", type: "emc", state: "IA", description: "Serves Osceola County in northwest Iowa", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Story County Electric Cooperative", website: "https://www.storyrec.com", type: "emc", state: "IA", description: "Serves Story County in central Iowa", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Western Iowa Power Cooperative (WIPCO)", website: "https://www.wipco.com", type: "emc", state: "IA", description: "Serves western Iowa communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Valley Rural Electric Cooperative", website: "https://www.valleyrec.com", type: "emc", state: "IA", description: "Serves valley communities in Iowa", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "North Iowa Municipal Electric Cooperative (NIMEC)", website: "https://nimec.org", type: "emc", state: "IA", description: "Municipal electric cooperative serving northern Iowa cities", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Ames Electric Services", website: "https://www.cityofames.org/government/departments/electric-services", type: "emc", state: "IA", description: "Municipal electric utility serving Ames — central Iowa", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Cedar Falls Utilities", website: "https://www.cedarfalls.com/610/Utilities", type: "emc", state: "IA", description: "Municipal utility serving Cedar Falls — northeast Iowa", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Dubuque Utilities", website: "https://www.cityofdubuque.org/182/Utilities", type: "emc", state: "IA", description: "Municipal utility serving Dubuque — eastern Iowa", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "City of Iowa City Utilities", website: "https://www.icgov.org/departments/purchasing", type: "emc", state: "IA", description: "Municipal utility serving Iowa City — procurement/purchasing portal", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "MidAmerican Energy (Iowa)", website: "https://www.midamericanenergy.com/business/suppliers", type: "support_org", state: "IA", description: "Largest IOU in Iowa — formal supplier registration and procurement portal. Covers much of Iowa.", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission construction", "Emergency response"] },
  { name: "Alliant Energy — Interstate Power & Light (IPL)", website: "https://www.alliantenergy.com/PartnerWithUs", type: "support_org", state: "IA", description: "Major IOU serving Iowa — vendor registration and procurement contacts.", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission construction"] },
];

export const KANSAS_EMCS: StateEMC[] = [
  { name: "Flint Hills Rural Electric Cooperative", website: "https://www.flinthillsrec.com", type: "emc", state: "KS", description: "Serves Flint Hills region in east-central Kansas", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Bluestem Electric Cooperative", website: "https://www.bluestemelectric.com", type: "emc", state: "KS", description: "Serves south-central Kansas communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Butler Electric Cooperative", website: "https://www.butlerelectric.com", type: "emc", state: "KS", description: "Serves Butler County in south-central Kansas", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Caney Valley Electric Cooperative", website: "https://www.caneyvalley.com", type: "emc", state: "KS", description: "Serves southeast Kansas Caney Valley region", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "CMS Electric Cooperative", website: "https://www.cmselectric.com", type: "emc", state: "KS", description: "Serves central Kansas communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Doniphan Electric Cooperative", website: "https://www.doniphanelectric.com", type: "emc", state: "KS", description: "Serves northeast Kansas Doniphan County area", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "DS&O Electric Cooperative", website: "https://www.dsocoop.com", type: "emc", state: "KS", description: "Serves south-central Kansas", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "FreeState Electric Cooperative", website: "https://www.freestate.coop", type: "emc", state: "KS", description: "Serves northeast Kansas including Topeka area", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Heartland Rural Electric Cooperative", website: "https://www.heartland-rec.com", type: "emc", state: "KS", description: "Serves north-central Kansas", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Lane-Scott Electric Cooperative", website: "https://www.lanescott.com", type: "emc", state: "KS", description: "Serves west-central Kansas Lane/Scott County area", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Lyon-Coffey Electric Cooperative", website: "https://www.lyoncoffey.coop", type: "emc", state: "KS", description: "Serves east-central Kansas Lyon/Coffey County area", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Midwest Energy", website: "https://www.mwenergy.com", type: "emc", state: "KS", description: "Serves western and central Kansas — one of the largest Kansas cooperatives", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance", "Transmission"] },
  { name: "Nemaha-Marshall Electric Cooperative", website: "https://www.nemaha-marshall.coop", type: "emc", state: "KS", description: "Serves northeast Kansas Nemaha/Marshall County area", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Ninnescah Electric Cooperative", website: "https://www.ninnescah.com", type: "emc", state: "KS", description: "Serves south-central Kansas", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Pioneer Electric Cooperative", website: "https://www.pioneerelectric.coop", type: "emc", state: "KS", description: "Serves southwest Kansas — one of the larger Kansas cooperatives", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance", "Equipment rentals"] },
  { name: "Prairie Land Electric Cooperative", website: "https://www.prairieland.coop", type: "emc", state: "KS", description: "Serves north-central Kansas prairie communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Radiant Electric Cooperative", website: "https://www.radiantelectric.coop", type: "emc", state: "KS", description: "Serves central Kansas communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Rolling Hills Electric Cooperative", website: "https://www.rollinghills.coop", type: "emc", state: "KS", description: "Serves north-central Kansas rolling hills region", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Sedgwick County Electric Cooperative", website: "https://www.sedgwickcountyelectric.coop", type: "emc", state: "KS", description: "Serves Sedgwick County area around Wichita", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Sumner-Cowley Electric Cooperative", website: "https://www.sumcow.coop", type: "emc", state: "KS", description: "Serves south-central Kansas Sumner/Cowley County", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Twin Valley Electric Cooperative", website: "https://www.twinvalleyelectric.coop", type: "emc", state: "KS", description: "Serves southeast Kansas communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Victory Electric Cooperative", website: "https://www.victoryelectric.net", type: "emc", state: "KS", description: "Serves southwest Kansas including Dodge City area", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Western Cooperative Electric", website: "https://www.westerncoop.com", type: "emc", state: "KS", description: "Serves western Kansas communities", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Equipment rentals"] },
  { name: "Wheatland Electric Cooperative", website: "https://www.weci.net", type: "emc", state: "KS", description: "Serves southwest Kansas wheat belt region", serviceTypes: ["Vegetation/ROW clearing", "Storm debris removal", "Emergency restoration", "Distribution maintenance"] },
  { name: "Kansas City Board of Public Utilities (BPU)", website: "https://www.bpu.com", type: "emc", state: "KS", description: "Municipal utility serving Kansas City, KS — one of the largest Kansas municipals", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance", "Transmission"] },
  { name: "City of Winfield Electric", website: "https://www.winfieldks.org", type: "emc", state: "KS", description: "Municipal electric utility serving Winfield in south-central Kansas", serviceTypes: ["Vegetation/ROW clearing", "Emergency restoration", "Distribution maintenance"] },
  { name: "Evergy (Kansas)", website: "https://www.evergy.com/about-us/supplier-information", type: "support_org", state: "KS", description: "Largest IOU in Kansas — formal supplier registration, vendor diversity, and procurement contacts. Covers Kansas City metro, Topeka, Wichita and more.", serviceTypes: ["Storm restoration", "Vegetation management", "Distribution maintenance", "Transmission construction", "Emergency response"] },
  { name: "Kansas Electric Cooperatives (KEC)", website: "https://www.kec.coop", type: "support_org", state: "KS", description: "Statewide association representing Kansas electric cooperatives — industry networking, vendor opportunities, and cooperative directory.", serviceTypes: ["Cooperative directory", "Industry networking", "Vendor opportunities", "Training programs"] },
  { name: "Sunflower Electric Power Corporation", website: "https://www.sunflower.net", type: "support_org", state: "KS", description: "G&T cooperative providing wholesale power to six western Kansas distribution cooperatives.", serviceTypes: ["Generation support", "Transmission construction", "Vegetation management", "ROW clearing"] },
];

export interface ForestryAgency {
  name: string;
  type: "federal" | "state" | "utility_veg" | "consulting";
  state: string;
  phone?: string;
  email?: string;
  website: string;
  contact?: string;
  title?: string;
  description: string;
}

export interface StormPrime {
  name: string;
  website: string;
  type: "national_prime" | "utility_prime" | "national_association" | "procurement_portal";
  description: string;
  specialties: string[];
}

export const FORESTRY_AGENCIES: ForestryAgency[] = [
  { name: "U.S. Forest Service (USFS)", type: "federal", state: "National", phone: "202-205-8333", website: "https://www.fs.usda.gov", description: "Oversees national forests, wildfire management, forest health, and partnerships with utilities and contractors" },
  { name: "Natural Resources Conservation Service (NRCS)", type: "federal", state: "National", phone: "202-720-7240", website: "https://www.nrcs.usda.gov", description: "Forestry conservation programs, private landowner assistance" },
  { name: "Alabama Forestry Commission", type: "state", state: "AL", phone: "334-240-9300", website: "https://forestry.alabama.gov", contact: "Rick Oates", title: "State Forester", description: "State forestry agency — wildfire, forest health, contractor coordination" },
  { name: "Alabama Power – Vegetation Management", type: "utility_veg", state: "AL", website: "https://www.alabamapower.com", contact: "Chris Johnson", title: "Manager, Vegetation Management", description: "Major utility forestry program — distribution & transmission ROW" },
  { name: "Georgia Forestry Commission", type: "state", state: "GA", phone: "478-751-3500", website: "https://gatrees.org", contact: "Arthur Williams", title: "State Forester & Director", description: "State forestry agency — one of the largest in the Southeast" },
  { name: "Georgia Power – Vegetation Management", type: "utility_veg", state: "GA", website: "https://www.georgiapower.com", contact: "Scott Hall", title: "Manager, Vegetation Management", description: "One of the largest utility forestry programs in the Southeast" },
  { name: "Florida Forest Service", type: "state", state: "FL", phone: "850-681-5800", website: "https://www.fdacs.gov/Forest-Wildfire", contact: "Rick Dolan", title: "State Forester & Director", description: "State forestry agency — wildfire, hurricane response, forest management" },
  { name: "Florida Power & Light (FPL) – Vegetation Management", type: "utility_veg", state: "FL", website: "https://www.fpl.com", contact: "Jason Miller", title: "Principal, Vegetation Management", description: "Largest FL utility forestry program — hurricane preparation" },
  { name: "South Carolina Forestry Commission", type: "state", state: "SC", phone: "803-896-8800", email: "jonesd@scfc.gov", website: "https://www.scfc.gov", contact: "Darryl Jones", title: "State Forester", description: "State forestry agency for SC" },
  { name: "North Carolina Forest Service", type: "state", state: "NC", phone: "919-857-4846", email: "greg.hicks@ncagr.gov", website: "https://www.ncforestservice.gov", contact: "Greg Hicks", title: "State Forester", description: "State forestry agency for NC" },
  { name: "Duke Energy Carolinas – Vegetation Management", type: "utility_veg", state: "SC", website: "https://www.duke-energy.com", contact: "John Rhyne", title: "Director, Vegetation Management", description: "Major utility veg program covering SC/NC" },
  { name: "Duke Energy Progress – Vegetation Management", type: "utility_veg", state: "NC", website: "https://www.duke-energy.com", contact: "Mark Key", title: "Manager, Vegetation Management", description: "Eastern NC utility vegetation management" },
  { name: "Tennessee Division of Forestry", type: "state", state: "TN", phone: "615-837-5431", email: "david.arnold@tn.gov", website: "https://www.tn.gov/agriculture/forests.html", contact: "David Arnold", title: "State Forester", description: "State forestry agency for Tennessee" },
  { name: "Tennessee Valley Authority (TVA) – Vegetation Management", type: "utility_veg", state: "TN", website: "https://www.tva.com", contact: "Scott Bess", title: "Director, Vegetation Management", description: "Federal utility authority — serves TN/AL/KY/MS/GA" },
  { name: "Resource Management Service, LLC", type: "consulting", state: "AL", phone: "205-987-6000", website: "https://rmsforest.com", description: "Private consulting forester in Birmingham, AL" },
  { name: "F&W Forestry Services, Inc.", type: "consulting", state: "GA", phone: "229-436-2556", website: "https://fwforestry.com", description: "Private consulting forester in Albany, GA" },
];

export const STORM_PRIMES: StormPrime[] = [
  { name: "AshBritt", website: "https://www.ashbritt.com", type: "national_prime", description: "National disaster debris management and emergency services prime contractor", specialties: ["Disaster debris removal", "Emergency response", "FEMA work", "Storm restoration"] },
  { name: "DRC Emergency Services", website: "https://www.drcemergency.com", type: "national_prime", description: "National emergency response and disaster recovery prime contractor", specialties: ["Emergency response", "Disaster recovery", "Debris management", "Environmental services"] },
  { name: "Tetra Tech", website: "https://www.tetratech.com", type: "national_prime", description: "Global consulting and engineering firm — disaster response division", specialties: ["Disaster response", "Environmental consulting", "Engineering", "Program management"] },
  { name: "AECOM", website: "https://aecom.com", type: "national_prime", description: "Global infrastructure consulting — disaster recovery programs", specialties: ["Infrastructure", "Disaster recovery", "Program management", "Engineering"] },
  { name: "ICF", website: "https://www.icf.com", type: "national_prime", description: "Global consulting — disaster management and recovery programs", specialties: ["Disaster management", "FEMA programs", "Consulting", "Program management"] },
  { name: "Quanta Services", website: "https://www.quantaservices.com", type: "utility_prime", description: "Largest utility contractor in North America — storm restoration and grid work", specialties: ["Utility construction", "Storm restoration", "Transmission", "Distribution", "Vegetation management"] },
  { name: "MasTec", website: "https://www.mastec.com", type: "utility_prime", description: "Major infrastructure contractor — utility and telecom storm response", specialties: ["Utility construction", "Storm restoration", "Telecom", "Pipeline", "Infrastructure"] },
  { name: "Asplundh Tree Expert", website: "https://www.asplundh.com", type: "utility_prime", description: "Largest utility vegetation management company in the world — controls major ROW contracts", specialties: ["Vegetation management", "ROW clearing", "Storm response", "Line clearance", "Utility forestry"] },
  { name: "Wright Tree Service", website: "https://www.wrighttree.com", type: "utility_prime", description: "Major utility vegetation management contractor — nationwide operations", specialties: ["Vegetation management", "ROW clearing", "Storm response", "Line clearance"] },
  { name: "Davey Tree Expert Company", website: "https://www.davey.com", type: "utility_prime", description: "Major tree care and utility vegetation management company", specialties: ["Vegetation management", "Tree care", "Utility line clearance", "Storm response", "Consulting arborist"] },
  { name: "National Rural Electric Cooperative Association (NRECA)", website: "https://www.electric.coop", type: "national_association", description: "Umbrella org for 900+ electric co-ops — sets vegetation, safety, and storm standards", specialties: ["Co-op directory", "Safety standards", "Storm coordination", "Industry networking"] },
  { name: "American Public Power Association (APPA)", website: "https://www.publicpower.org", type: "national_association", description: "Represents 2,000+ municipal utilities — procurement standards and vendor networking", specialties: ["Municipal utility directory", "Procurement standards", "Vendor networking", "Industry events"] },
  { name: "Federated Rural Electric Insurance Exchange (FRE)", website: "https://www.freinsurance.com", type: "national_association", description: "Insurance and risk standards used by many co-ops — contractor compliance", specialties: ["Insurance standards", "Risk management", "Contractor compliance", "Safety requirements"] },
  { name: "SAM.gov", website: "https://sam.gov", type: "procurement_portal", description: "Federal procurement registration — required for all government contracting", specialties: ["Federal contracts", "State passthrough", "Vendor registration"] },
  { name: "BidNet Direct", website: "https://www.bidnetdirect.com", type: "procurement_portal", description: "Government bid notification and procurement platform", specialties: ["Bid notifications", "Government contracts", "RFP alerts"] },
  { name: "Bonfire", website: "https://www.gobonfire.com", type: "procurement_portal", description: "Strategic sourcing and procurement platform for public sector", specialties: ["Public procurement", "Bid management", "Vendor management"] },
];

export const VENDOR_PLATFORMS: VendorPlatform[] = [
  {
    name: "ISNetworld",
    url: "https://www.isnetworld.com",
    description: "Industry-leading contractor safety management platform. Most major utilities require ISNetworld compliance for field work. Tracks safety records, training, insurance, and OSHA compliance.",
    usedBy: ["FPL", "Entergy", "Southern Company", "CenterPoint", "PG&E", "SCE", "Oncor", "AEP", "Ameren", "FirstEnergy"],
    costToRegister: "$400-$1,200/year",
    priority: "critical",
    features: ["Safety records tracking", "Insurance verification", "OSHA compliance", "Drug testing tracking", "Training records", "EMR tracking"],
    registrationSteps: [
      { step: 1, title: "Create ISNetworld Account", description: "Go to isnetworld.com and click 'Contractor Sign Up'. Enter your company name, EIN, and primary contact information.", estimatedTime: "15 minutes" },
      { step: 2, title: "Select Hiring Clients", description: "Search for and select the utilities you want to work with (FPL, Entergy, etc.). Each client may have different requirements.", estimatedTime: "15 minutes", tips: "Add ALL utilities you want to work with — each one may unlock additional compliance requirements." },
      { step: 3, title: "Pay Annual Subscription", description: "Complete payment ($400-$1,200/year depending on company size and number of hiring clients).", estimatedTime: "10 minutes" },
      { step: 4, title: "Upload Safety Manual", description: "Upload your complete written safety manual/program. ISNetworld will review it against their grading criteria.", documentsNeeded: ["Written safety manual", "Job hazard analysis templates", "Emergency procedures"], estimatedTime: "30 minutes" },
      { step: 5, title: "Upload OSHA Documentation", description: "Submit OSHA 300/300A logs for the past 3 years, EMR documentation, and OSHA citation history.", documentsNeeded: ["OSHA 300 logs (3 years)", "OSHA 300A summaries", "EMR rating letter", "OSHA citation history"], estimatedTime: "1 hour" },
      { step: 6, title: "Upload Insurance Certificates", description: "Submit your COI, workers' comp, auto liability, and umbrella policies. Each hiring client may require specific coverage limits.", documentsNeeded: ["COI", "Workers' comp certificate", "Auto liability", "Umbrella/excess policy"], estimatedTime: "30 minutes" },
      { step: 7, title: "Upload Drug Testing Program", description: "Provide your written drug & alcohol policy and proof of testing program (pre-employment, random, post-accident).", documentsNeeded: ["Drug & alcohol policy", "MRO agreement", "Testing program documentation"], estimatedTime: "30 minutes" },
      { step: 8, title: "Upload Training Records", description: "Submit OSHA 10/30 certifications, CPR/First Aid, and any trade-specific training certificates for all field workers.", documentsNeeded: ["OSHA 10/30 cards", "CPR/First Aid certs", "Trade-specific certifications"], estimatedTime: "1-2 hours" },
      { step: 9, title: "Achieve Green/Compliant Status", description: "ISNetworld grades each section. Work toward green/compliant status on all requirements. Address any deficiencies identified during review.", estimatedTime: "2-4 weeks for full compliance", tips: "Utilities check ISNetworld status before activating storm contractors. Green status is your ticket to work." }
    ]
  },
  {
    name: "PowerAdvocate (Wood Mackenzie)",
    url: "https://www.poweradvocate.com",
    description: "Utility industry-specific sourcing and procurement platform. Used by utilities for competitive bidding, vendor qualification, and contract management. Essential for T&D contractor work.",
    usedBy: ["Duke Energy", "FPL", "Southern Company", "Eversource", "SCE", "NextEra", "Entergy", "FirstEnergy"],
    costToRegister: "Free for suppliers",
    priority: "critical",
    features: ["RFP response platform", "Bid management", "Vendor qualification", "Contract management", "Performance tracking"],
    registrationSteps: [
      { step: 1, title: "Visit PowerAdvocate Website", description: "Go to poweradvocate.com and look for the supplier/vendor registration option.", estimatedTime: "10 minutes" },
      { step: 2, title: "Create Supplier Profile", description: "Register your company with full details: legal name, EIN, DUNS number, address, and primary contact.", estimatedTime: "30 minutes" },
      { step: 3, title: "Complete Capabilities Profile", description: "Fill out your service capabilities, geographic coverage, equipment inventory, certifications, and past performance. Be thorough — utilities search by these fields.", documentsNeeded: ["Capabilities statement", "Equipment list", "Certifications", "Past performance references"], estimatedTime: "1-2 hours", tips: "Complete every field. Utilities search by capability, location, and certifications. This is where bid invitations come from." },
      { step: 4, title: "Upload Company Documents", description: "Upload W-9, insurance certificates, safety documentation, and any SBA/DBE certifications.", documentsNeeded: ["W-9", "COI", "Safety manual", "SBA certifications"], estimatedTime: "30 minutes" },
      { step: 5, title: "Connect to Utility Clients", description: "Accept connection requests from utilities you've registered with, or request connections to utilities you want to work with.", estimatedTime: "15 minutes" },
      { step: 6, title: "Monitor for Sourcing Events", description: "Once your profile is complete, you'll receive notifications for relevant RFPs, sourcing events, and bid invitations from connected utilities.", estimatedTime: "Ongoing" }
    ]
  },
  {
    name: "Avetta",
    url: "https://www.avetta.com",
    description: "Supply chain risk management and contractor prequalification platform. Tracks safety, insurance, compliance, and financial health. Used alongside or instead of ISNetworld. Browz (now merged with Avetta) — some utilities still reference Browz.",
    usedBy: ["Duke Energy", "Eversource", "ConEd", "Entergy"],
    costToRegister: "$300-$900/year",
    priority: "high",
    features: ["Prequalification management", "Insurance tracking", "Safety audits", "Compliance monitoring", "Financial screening"],
    registrationSteps: [
      { step: 1, title: "Create Avetta Account", description: "Go to avetta.com and register as a new supplier/contractor. Enter company details and select your hiring clients.", estimatedTime: "15 minutes" },
      { step: 2, title: "Pay Annual Subscription", description: "Complete payment ($300-$900/year depending on company size). Note: Browz has merged into Avetta.", estimatedTime: "10 minutes" },
      { step: 3, title: "Complete Company Profile", description: "Fill out your company profile with services, capabilities, geographic coverage, and trade classifications.", estimatedTime: "30 minutes" },
      { step: 4, title: "Upload Safety Documentation", description: "Submit your safety manual, OSHA logs, EMR documentation, and drug testing program.", documentsNeeded: ["Safety manual", "OSHA 300 logs", "EMR letter", "Drug & alcohol policy"], estimatedTime: "1 hour" },
      { step: 5, title: "Upload Insurance Certificates", description: "Provide all insurance documentation. Avetta tracks insurance expiration dates and sends renewal reminders.", documentsNeeded: ["COI", "Workers' comp", "Auto liability", "Umbrella/excess"], estimatedTime: "30 minutes" },
      { step: 6, title: "Complete Financial Screening", description: "Avetta may request basic financial information or Dun & Bradstreet reports for financial health verification.", estimatedTime: "30 minutes" },
      { step: 7, title: "Achieve Compliant Status", description: "Work through any deficiency items flagged by Avetta until your profile shows fully compliant.", estimatedTime: "1-2 weeks", tips: "Similar process to ISNetworld. Some utilities use Avetta instead of or in addition to ISN." }
    ]
  },
  {
    name: "SAP Ariba",
    url: "https://www.ariba.com",
    description: "Enterprise procurement platform used by large utilities for supplier registration, sourcing events, and purchase orders. Registration is free but the process can be complex. Each utility has its own Ariba network — you may need to register separately for each one.",
    usedBy: ["Entergy", "Dominion", "AEP", "CenterPoint", "Xcel Energy", "Ameren", "PPL", "FirstEnergy", "WEC"],
    costToRegister: "Free for suppliers",
    priority: "critical",
    features: ["Supplier registration", "Sourcing events", "RFP/RFQ response", "Purchase orders", "Invoice management", "Contract management"],
    registrationSteps: [
      { step: 1, title: "Go to SAP Ariba Network", description: "Visit ariba.com and click on 'Suppliers' to start the registration process. SAP Ariba is free for supplier registration.", estimatedTime: "10 minutes" },
      { step: 2, title: "Create Ariba Network Account", description: "Register with your company email, legal name, EIN/DUNS number, and primary contact information.", estimatedTime: "20 minutes" },
      { step: 3, title: "Complete Company Profile", description: "Fill out your detailed company profile including services, NAICS/UNSPSC codes, geographic coverage, and certifications.", documentsNeeded: ["Company capabilities overview", "NAICS codes list", "Certifications"], estimatedTime: "1 hour", tips: "Each utility has its own Ariba network — follow each utility's specific Ariba invitation link when available." },
      { step: 4, title: "Upload Business Documents", description: "Submit W-9, insurance certificates, state licenses, and SBA certifications.", documentsNeeded: ["W-9", "COI", "State licenses", "SBA certifications"], estimatedTime: "30 minutes" },
      { step: 5, title: "Accept Utility Connection Requests", description: "When a utility sends you a sourcing event or invitation, accept it through Ariba. You can also search for utilities to request connections.", estimatedTime: "15 minutes" },
      { step: 6, title: "Respond to Sourcing Events", description: "Once connected, you'll receive RFP/RFQ notifications. Submit proposals and bid responses through the Ariba platform.", estimatedTime: "Ongoing" }
    ]
  }
];

export const READINESS_CHECKLIST: ReadinessChecklistItem[] = [
  {
    id: "sam_gov",
    category: "Federal Registration",
    item: "SAM.gov Registration (Active)",
    description: "System for Award Management — required for ALL federal work including USACE, FEMA, and federal utility contracts. Get your UEI number and CAGE code.",
    priority: "required",
    forStormWork: true,
    tips: "Takes 7-10 business days. Do this FIRST. You need an active SAM.gov registration before you can bid on any federal work. Renew annually."
  },
  {
    id: "business_license",
    category: "Business & Legal",
    item: "State Contractor License (Active)",
    description: "Active contractor license in every state where you plan to work. Some states require separate licenses for electrical, general, tree work, etc.",
    priority: "required",
    forStormWork: true,
    tips: "Storm work crosses state lines. Get licensed in every state in your target corridor. Florida, Texas, Louisiana are essential for Gulf Coast storm work."
  },
  {
    id: "coi",
    category: "Insurance & Bonding",
    item: "Certificate of Insurance (COI)",
    description: "General liability ($1M-$5M), auto liability ($1M), workers' comp, umbrella/excess coverage ($5M+). Utilities require specific limits.",
    priority: "required",
    forStormWork: true,
    tips: "Most utilities require $5M+ umbrella coverage. Name each utility as Additional Insured on your COI. Get your agent familiar with utility requirements."
  },
  {
    id: "workers_comp",
    category: "Insurance & Bonding",
    item: "Workers' Compensation Insurance",
    description: "Required in all states. Coverage must meet each state's requirements where you'll perform work. Multi-state coverage is essential for storm work.",
    priority: "required",
    forStormWork: true,
    tips: "Get multi-state workers' comp. Storm work means crossing state lines quickly. Your carrier should be able to add states rapidly."
  },
  {
    id: "emr_rating",
    category: "Safety",
    item: "EMR Rating (Below 1.0)",
    description: "Experience Modification Rate from your workers' comp carrier. Below 1.0 is good, below 0.85 is excellent. Above 1.0 can disqualify you.",
    priority: "required",
    forStormWork: true,
    tips: "Most utilities won't work with contractors above 1.0 EMR. Some set the bar at 0.90. Focus on safety to keep this low."
  },
  {
    id: "safety_manual",
    category: "Safety",
    item: "Written Safety Manual / Safety Program",
    description: "Comprehensive safety manual covering OSHA requirements, job hazard analysis, PPE requirements, incident reporting, and emergency procedures.",
    priority: "required",
    forStormWork: true,
    tips: "ISNetworld and Avetta both require you to upload your safety manual. Have it professionally written or reviewed. Include utility-specific sections."
  },
  {
    id: "osha_compliance",
    category: "Safety",
    item: "OSHA Compliance Documentation",
    description: "OSHA 10/30 certifications for workers, documented safety training, OSHA 300 logs, and proof of compliance with all applicable OSHA standards.",
    priority: "required",
    forStormWork: true,
    tips: "OSHA 10 minimum for all field workers. OSHA 30 for supervisors. Keep training certificates current and organized."
  },
  {
    id: "drug_free",
    category: "Safety",
    item: "Drug-Free Workplace Program",
    description: "Written drug and alcohol policy, pre-employment testing, random testing program, and documented test results. Required by most utilities.",
    priority: "required",
    forStormWork: true,
    tips: "Use a nationally recognized testing provider. Keep results organized. Most utilities require random testing — not just pre-employment."
  },
  {
    id: "isnetworld",
    category: "Vendor Platform Registration",
    item: "ISNetworld Registration & Compliance",
    description: "Safety prequalification platform used by most major utilities. Upload safety records, insurance, training docs, and OSHA compliance proof.",
    priority: "required",
    forStormWork: true,
    tips: "Annual cost $400-$1,200 depending on company size. Worth every penny — it's the gateway to utility work. Maintain green/compliant status."
  },
  {
    id: "poweradvocate",
    category: "Vendor Platform Registration",
    item: "PowerAdvocate Registration",
    description: "Utility sourcing platform for competitive bids. Free for suppliers. Used by Duke, FPL, Southern Company, Eversource, and others.",
    priority: "required",
    forStormWork: true,
    tips: "Registration is free. Complete your profile thoroughly — utilities search by capability, location, and certifications. This is where bid invitations come from."
  },
  {
    id: "sap_ariba",
    category: "Vendor Platform Registration",
    item: "SAP Ariba Supplier Registration",
    description: "Enterprise procurement platform used by Entergy, AEP, Dominion, CenterPoint, Xcel, and many others. Free registration.",
    priority: "required",
    forStormWork: true,
    tips: "Free to register. Each utility has its own Ariba network — you may need to register separately for each one. Follow each utility's specific Ariba link."
  },
  {
    id: "avetta",
    category: "Vendor Platform Registration",
    item: "Avetta Prequalification",
    description: "Contractor prequalification platform used by Duke Energy, Eversource, ConEd. Tracks safety, insurance, and compliance.",
    priority: "highly_recommended",
    forStormWork: true,
    tips: "Annual fee $300-$900. Similar to ISNetworld. Some utilities use Avetta instead of or in addition to ISNetworld."
  },
  {
    id: "w9",
    category: "Business & Legal",
    item: "W-9 Tax Form (Current Year)",
    description: "IRS W-9 form with current legal company name, EIN, address. Required by every utility and prime contractor.",
    priority: "required",
    forStormWork: true,
    tips: "Keep multiple signed copies ready. You'll submit this with every new registration and contract."
  },
  {
    id: "ein",
    category: "Business & Legal",
    item: "EIN / Federal Tax ID",
    description: "Employer Identification Number from the IRS. Required for all business registrations, contracts, and tax reporting.",
    priority: "required",
    forStormWork: true,
    tips: "You can get an EIN instantly online from IRS.gov. Keep it on file with your W-9 and business docs."
  },
  {
    id: "capability_statement",
    category: "Marketing & Readiness",
    item: "Federal/Utility Capability Statement",
    description: "One-page professional document showing your company overview, core capabilities, certifications, past performance, and contact information.",
    priority: "highly_recommended",
    forStormWork: true,
    tips: "Use the USACE Outreach tab to AI-generate yours! Essential for Small Business Office outreach and prime contractor introductions."
  },
  {
    id: "equipment_list",
    category: "Marketing & Readiness",
    item: "Equipment List with Specifications",
    description: "Complete inventory of owned and leased equipment: trucks, bucket trucks, chippers, cranes, generators, etc. Include year, model, capacity.",
    priority: "highly_recommended",
    forStormWork: true,
    tips: "Utilities want to know your capacity. List everything — it shows capability. Include rental sources for equipment you can mobilize quickly."
  },
  {
    id: "crew_roster",
    category: "Marketing & Readiness",
    item: "Crew Roster with Certifications",
    description: "List of key personnel with their roles, certifications, years of experience, and specialty skills (CDL, crane operator, arborist, etc.)",
    priority: "highly_recommended",
    forStormWork: true,
    tips: "Show your bench strength. Utilities want to know you can actually staff the work. Include both full-time employees and reliable subcontractors."
  },
  {
    id: "past_performance",
    category: "Marketing & Readiness",
    item: "Past Performance / Reference List",
    description: "3-5 strong references from previous utility/government work. Include project name, scope, value, dates, and contact person.",
    priority: "highly_recommended",
    forStormWork: true,
    tips: "ALWAYS call your references before listing them. Confirm they'll give positive feedback. Include storm response work if you have it."
  },
  {
    id: "sba_certs",
    category: "Certifications",
    item: "SBA Certifications (SDVOSB, WOSB, HUBZone, 8(a), DBE)",
    description: "Small Business Administration certifications that qualify you for set-aside contracts. SDVOSB, WOSB, HUBZone, and 8(a) are most valuable.",
    priority: "highly_recommended",
    forStormWork: true,
    tips: "If you qualify, GET CERTIFIED. Many utility and government contracts are set-aside for certified small businesses. It's a huge competitive advantage."
  },
  {
    id: "dbe_mbe",
    category: "Certifications",
    item: "DBE/MBE/WBE State Certifications",
    description: "Disadvantaged Business Enterprise, Minority Business Enterprise, Women's Business Enterprise certifications from your state DOT or certification agency.",
    priority: "recommended",
    forStormWork: false,
    tips: "State-level diversity certifications. Many utility contracts have small business and diversity subcontracting goals."
  },
  {
    id: "bonding",
    category: "Insurance & Bonding",
    item: "Bonding Capacity (Bid & Performance Bonds)",
    description: "Surety bond capacity for bid bonds and performance bonds. Larger contracts require bonds. Build your capacity with your surety company.",
    priority: "highly_recommended",
    forStormWork: true,
    tips: "Start building bonding capacity early. $500K-$5M bonding capacity opens up many more contract opportunities. Your bonding agent is a key partner."
  },
  {
    id: "intro_emails",
    category: "Outreach & Positioning",
    item: "Introduction Emails Sent to Target Utilities",
    description: "Professional introduction emails to each utility's vendor management, procurement, and/or small business office.",
    priority: "highly_recommended",
    forStormWork: true,
    tips: "Use this module's AI email generator to draft professional introductions! Target the procurement or vendor management contact for each utility."
  },
  {
    id: "emergency_contact",
    category: "Outreach & Positioning",
    item: "24/7 Emergency Contact Established",
    description: "Designate a 24/7 emergency contact person and phone number for storm activation calls. Utilities need to reach you anytime during events.",
    priority: "required",
    forStormWork: true,
    tips: "Storm calls come at 2 AM. Have a designated emergency contact who WILL answer. Missing the call means missing the job."
  },
  {
    id: "mobilization_plan",
    category: "Outreach & Positioning",
    item: "Mobilization Plan Documented",
    description: "Written plan for how you mobilize for storm response: crew assembly, equipment staging, travel logistics, communications protocol, lodging plan.",
    priority: "highly_recommended",
    forStormWork: true,
    tips: "Shows utilities you're serious and prepared. Include your mobilization radius, response time, and staging area capabilities."
  }
];

export const STORM_PRIORITY_REGISTRATIONS = [
  { rank: 1, item: "SAM.gov Registration", reason: "Federal gateway — required for USACE, FEMA, and all federal utility contracts", timeToComplete: "7-10 business days" },
  { rank: 2, item: "ISNetworld Compliance", reason: "Most utilities check ISNetworld first before activating storm contractors", timeToComplete: "2-4 weeks" },
  { rank: 3, item: "PowerAdvocate Registration", reason: "Where bid invitations come from for Duke, FPL, Southern Company, Eversource", timeToComplete: "1-2 weeks" },
  { rank: 4, item: "SAP Ariba Registration", reason: "Required by Entergy, AEP, Dominion, CenterPoint — major storm utilities", timeToComplete: "1-2 weeks" },
  { rank: 5, item: "FPL Vendor Registration", reason: "Largest storm spender in the nation — $500M+ annual storm budget", timeToComplete: "2-4 weeks" },
  { rank: 6, item: "Entergy Supplier Portal", reason: "Covers 4 Gulf states — TX, LA, MS, AR — high hurricane exposure", timeToComplete: "2-3 weeks" },
  { rank: 7, item: "Duke Energy Supplier Portal", reason: "Multi-state coverage: NC, SC, FL, IN, OH, KY — $400M+ storm spend", timeToComplete: "2-3 weeks" },
  { rank: 8, item: "Southern Company Portal", reason: "GA, AL, MS coverage through Georgia Power, Alabama Power, Mississippi Power", timeToComplete: "2-3 weeks" },
  { rank: 9, item: "SBA Certifications", reason: "Set-aside eligibility multiplies your opportunities dramatically", timeToComplete: "2-6 months" },
  { rank: 10, item: "State Contractor Licenses", reason: "Multi-state licenses in your storm corridor (FL, TX, LA, GA, NC, SC)", timeToComplete: "4-8 weeks per state" },
];

export async function generateUtilityIntroEmail(companyInfo: {
  companyName: string;
  ownerName: string;
  utilityName: string;
  certifications?: string[];
  capabilities?: string[];
  location?: string;
  phone?: string;
  email?: string;
  yearsExperience?: string;
  crewSize?: string;
}): Promise<{ subject: string; body: string; tips: string[] }> {
  const prompt = `Generate a professional contractor introduction email to send to ${companyInfo.utilityName}'s vendor management / procurement department.

Company Details:
- Company: ${companyInfo.companyName}
- Owner: ${companyInfo.ownerName}
- Location: ${companyInfo.location || "Not specified"}
- Certifications: ${companyInfo.certifications?.join(", ") || "None listed"}
- Core Capabilities: ${companyInfo.capabilities?.join(", ") || "General contracting"}
- Years Experience: ${companyInfo.yearsExperience || "Not specified"}
- Crew Size: ${companyInfo.crewSize || "Not specified"}
- Phone: ${companyInfo.phone || ""}
- Email: ${companyInfo.email || ""}

IMPORTANT CONTEXT:
This is a contractor registering as a VENDOR with the utility company. The email should:
1. Introduce the company as a qualified contractor seeking to register as an approved vendor
2. Highlight storm response capabilities and readiness
3. Mention any relevant certifications (ISNetworld, safety compliance, SBA certs)
4. Express interest in being added to their storm activation / emergency response contractor pool
5. Request information about their vendor registration process if not already registered
6. Be professional, concise, and action-oriented
7. NOT be salesy — this is about positioning and eligibility

Format: Return a JSON object with:
- "subject": Email subject line
- "body": Full email body (professional, ready to send)
- "tips": Array of 3-4 tips for following up after sending

Return ONLY valid JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {
      subject: `Contractor Introduction: ${companyInfo.companyName} — Storm Response & Utility Services`,
      body: content,
      tips: ["Follow up within 7 days", "Attach your capability statement", "Reference your ISNetworld profile"]
    };
  } catch (error) {
    console.error("Error generating utility intro email:", error);
    return {
      subject: `Contractor Introduction: ${companyInfo.companyName} — Storm Response & Utility Services`,
      body: `Dear ${companyInfo.utilityName} Vendor Management Team,\n\nI am writing to introduce ${companyInfo.companyName} as a qualified contractor interested in registering as an approved vendor for storm response and utility services.\n\nOur company, led by ${companyInfo.ownerName}, specializes in ${companyInfo.capabilities?.join(", ") || "utility contracting services"}${companyInfo.location ? ` and is based in ${companyInfo.location}` : ""}.\n\n${companyInfo.certifications?.length ? `We maintain the following certifications: ${companyInfo.certifications.join(", ")}.\n\n` : ""}We would appreciate information about your vendor registration process and how to be included in your approved contractor and storm activation lists.\n\nThank you for your consideration.\n\nSincerely,\n${companyInfo.ownerName}\n${companyInfo.companyName}${companyInfo.phone ? `\n${companyInfo.phone}` : ""}${companyInfo.email ? `\n${companyInfo.email}` : ""}`,
      tips: [
        "Follow up within 7 business days if no response",
        "Attach your capability statement and equipment list",
        "Reference your ISNetworld or Avetta compliance status",
        "Ask specifically about their storm activation contractor pool"
      ]
    };
  }
}

export function generateTrackingSheet(): {
  utilities: Array<{
    name: string;
    states: string;
    platform: string;
    registrationUrl: string;
    stormPriority: string;
    status: string;
    dateRegistered: string;
    dateFollowUp: string;
    notes: string;
  }>;
  platforms: Array<{
    name: string;
    url: string;
    cost: string;
    priority: string;
    status: string;
    dateRegistered: string;
    notes: string;
  }>;
  checklist: Array<{
    item: string;
    category: string;
    priority: string;
    status: string;
    dateCompleted: string;
    notes: string;
  }>;
} {
  return {
    utilities: UTILITY_COMPANIES.map(u => ({
      name: u.name,
      states: u.states.join(", "),
      platform: u.vendorPlatform,
      registrationUrl: u.registrationUrl,
      stormPriority: u.stormPriority.toUpperCase(),
      status: "Not Started",
      dateRegistered: "",
      dateFollowUp: "",
      notes: ""
    })),
    platforms: VENDOR_PLATFORMS.map(p => ({
      name: p.name,
      url: p.url,
      cost: p.costToRegister,
      priority: p.priority.toUpperCase(),
      status: "Not Started",
      dateRegistered: "",
      notes: ""
    })),
    checklist: READINESS_CHECKLIST.map(c => ({
      item: c.item,
      category: c.category,
      priority: c.priority === "required" ? "REQUIRED" : c.priority === "highly_recommended" ? "HIGHLY RECOMMENDED" : "RECOMMENDED",
      status: "Not Started",
      dateCompleted: "",
      notes: ""
    }))
  };
}
