import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://openai-gateway.replit.dev/v1',
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || 'dummy-key-for-replit-ai'
});

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
}

export interface VendorPlatform {
  name: string;
  url: string;
  description: string;
  usedBy: string[];
  costToRegister: string;
  priority: "critical" | "high" | "medium";
  features: string[];
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
    registrationNotes: "Largest utility in FL. Massive storm activation needs. Must be ISNetworld compliant. They activate hundreds of contractors per hurricane season.",
    annualStormSpend: "$500M+"
  },
  {
    name: "Entergy (TX, LA, MS, AR)",
    states: ["TX", "LA", "MS", "AR"],
    region: "Gulf Coast",
    registrationUrl: "https://www.entergy.com/suppliers/",
    vendorPlatform: "SAP Ariba / ISNetworld",
    stormPriority: "critical",
    stormPriorityScore: 97,
    contractTypes: ["Storm restoration", "Vegetation management", "Debris removal", "Transmission line repair", "Distribution maintenance"],
    registrationNotes: "Covers 4 Gulf states. Hurricane corridor. Registers contractors through SAP Ariba. ISNetworld safety compliance required for field work.",
    annualStormSpend: "$300M+"
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
    registrationNotes: "Multi-state operations. Uses PowerAdvocate for vendor management. Avetta for safety prequalification. Major storm player in Carolinas and Florida.",
    annualStormSpend: "$400M+"
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
    registrationNotes: "Parent company Southern Company manages procurement for Georgia Power, Alabama Power, Mississippi Power. Register through Southern Company supplier portal.",
    annualStormSpend: "$350M+"
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
    vendorPlatform: "SAP Ariba / ISNetworld",
    stormPriority: "medium",
    stormPriorityScore: 76,
    contractTypes: ["Storm restoration", "Vegetation management", "Transmission construction", "Distribution maintenance"],
    registrationNotes: "Five-state footprint. Nor'easters and severe weather. SAP Ariba for procurement, ISNetworld for safety.",
    annualStormSpend: "$130M+"
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
    annualStormSpend: "$50M+"
  }
];

export const VENDOR_PLATFORMS: VendorPlatform[] = [
  {
    name: "ISNetworld",
    url: "https://www.isnetworld.com",
    description: "Industry-leading contractor safety management platform. Most major utilities require ISNetworld compliance for field work. Tracks safety records, training, insurance, and OSHA compliance.",
    usedBy: ["FPL", "Entergy", "Southern Company", "CenterPoint", "PG&E", "SCE", "Oncor", "AEP", "Ameren", "FirstEnergy"],
    costToRegister: "$400-$1,200/year",
    priority: "critical",
    features: ["Safety records tracking", "Insurance verification", "OSHA compliance", "Drug testing tracking", "Training records", "EMR tracking"]
  },
  {
    name: "PowerAdvocate (Wood Mackenzie)",
    url: "https://www.poweradvocate.com",
    description: "Utility industry-specific sourcing and procurement platform. Used by utilities for competitive bidding, vendor qualification, and contract management. Essential for T&D contractor work.",
    usedBy: ["Duke Energy", "FPL", "Southern Company", "Eversource", "SCE", "NextEra"],
    costToRegister: "Free for suppliers",
    priority: "critical",
    features: ["RFP response platform", "Bid management", "Vendor qualification", "Contract management", "Performance tracking"]
  },
  {
    name: "Avetta",
    url: "https://www.avetta.com",
    description: "Supply chain risk management and contractor prequalification platform. Tracks safety, insurance, compliance, and financial health. Used alongside or instead of ISNetworld.",
    usedBy: ["Duke Energy", "Eversource", "ConEd"],
    costToRegister: "$300-$900/year",
    priority: "high",
    features: ["Prequalification management", "Insurance tracking", "Safety audits", "Compliance monitoring", "Financial screening"]
  },
  {
    name: "SAP Ariba",
    url: "https://www.ariba.com",
    description: "Enterprise procurement platform used by large utilities for supplier registration, sourcing events, and purchase orders. Registration is free but the process can be complex.",
    usedBy: ["Entergy", "Dominion", "AEP", "CenterPoint", "Xcel Energy", "Ameren", "PPL", "FirstEnergy", "WEC"],
    costToRegister: "Free for suppliers",
    priority: "critical",
    features: ["Supplier registration", "Sourcing events", "RFP/RFQ response", "Purchase orders", "Invoice management", "Contract management"]
  },
  {
    name: "Browz (now Avetta)",
    url: "https://www.avetta.com",
    description: "Merged with Avetta. Some utilities still reference Browz for contractor prequalification and compliance management.",
    usedBy: ["Various utilities transitioning"],
    costToRegister: "$300-$900/year",
    priority: "medium",
    features: ["Prequalification", "Safety compliance", "Insurance verification"]
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
