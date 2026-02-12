import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://openai-gateway.replit.dev/v1',
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || 'dummy-key-for-replit-ai'
});

export interface USACEDistrict {
  name: string;
  code: string;
  division: string;
  divisionColor: string;
  states: string[];
  url: string;
  priority: "critical" | "high" | "medium" | "low";
  priorityScore: number;
  stormRelevance: string;
  keyWorkTypes: string[];
  smallBusinessContact: string;
}

export const USACE_DISTRICTS: USACEDistrict[] = [
  {
    name: "Jacksonville District",
    code: "SAJ",
    division: "South Atlantic Division",
    divisionColor: "#3B82F6",
    states: ["FL"],
    url: "https://www.saj.usace.army.mil",
    priority: "critical",
    priorityScore: 98,
    stormRelevance: "Major hurricane & debris market. Highest volume of storm debris contracts in the nation. Primary activation district for FL hurricane response.",
    keyWorkTypes: ["Hurricane debris removal", "Emergency power", "Flood control", "Vegetation management", "Infrastructure repair"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Mobile District",
    code: "SAM",
    division: "South Atlantic Division",
    divisionColor: "#3B82F6",
    states: ["AL", "MS", "FL Panhandle"],
    url: "https://www.sam.usace.army.mil",
    priority: "critical",
    priorityScore: 96,
    stormRelevance: "Gulf Coast storm work. Covers AL, MS & FL Panhandle. One of the most active districts for emergency debris removal and hurricane response.",
    keyWorkTypes: ["Storm debris removal", "Emergency levee repair", "Waterway clearing", "Vegetation management", "Emergency power restoration"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "New Orleans District",
    code: "MVN",
    division: "Mississippi Valley Division",
    divisionColor: "#22C55E",
    states: ["LA"],
    url: "https://www.mvn.usace.army.mil",
    priority: "critical",
    priorityScore: 95,
    stormRelevance: "Highly active for hurricane response. Louisiana is a perennial storm target. Major flood control and levee maintenance. Post-Katrina infrastructure is massive.",
    keyWorkTypes: ["Hurricane debris", "Levee maintenance", "Flood control", "Emergency pumping", "Vegetation clearing", "Navigation channel maintenance"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Savannah District",
    code: "SAS",
    division: "South Atlantic Division",
    divisionColor: "#3B82F6",
    states: ["GA", "SC"],
    url: "https://www.sas.usace.army.mil",
    priority: "critical",
    priorityScore: 92,
    stormRelevance: "Georgia & Southeast disaster response. Coastal storm surge, hurricane debris, and inland flooding. Growing storm frequency makes this increasingly active.",
    keyWorkTypes: ["Storm debris removal", "Coastal protection", "Flood damage repair", "Vegetation management", "Emergency response"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Wilmington District",
    code: "SAW",
    division: "South Atlantic Division",
    divisionColor: "#3B82F6",
    states: ["NC"],
    url: "https://www.saw.usace.army.mil",
    priority: "high",
    priorityScore: 88,
    stormRelevance: "North Carolina coastal storm support. Frequent hurricane landfalls. Major debris operations after storms like Florence and Matthew.",
    keyWorkTypes: ["Coastal storm debris", "Beach renourishment", "Flood control", "Navigation maintenance", "Emergency response"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Charleston District",
    code: "SAC",
    division: "South Atlantic Division",
    divisionColor: "#3B82F6",
    states: ["SC"],
    url: "https://www.sac.usace.army.mil",
    priority: "high",
    priorityScore: 86,
    stormRelevance: "SC coastal operations. Hurricane-prone region with significant storm surge risk. Active debris removal after coastal storms.",
    keyWorkTypes: ["Coastal debris removal", "Harbor maintenance", "Flood risk management", "Emergency response"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Galveston District",
    code: "SWG",
    division: "Southwestern Division",
    divisionColor: "#EAB308",
    states: ["TX Gulf Coast"],
    url: "https://www.swg.usace.army.mil",
    priority: "critical",
    priorityScore: 94,
    stormRelevance: "Texas Gulf Coast hurricane response. Major storm debris market. Harvey-level events generate massive contracting needs. Active IDIQ programs.",
    keyWorkTypes: ["Hurricane debris removal", "Coastal protection", "Flood control", "Navigation channel maintenance", "Emergency response"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Fort Worth District",
    code: "SWF",
    division: "Southwestern Division",
    divisionColor: "#EAB308",
    states: ["TX inland", "OK partial"],
    url: "https://www.swf.usace.army.mil",
    priority: "high",
    priorityScore: 82,
    stormRelevance: "Inland Texas and Oklahoma. Tornado debris, severe storm damage, and flood control. Supports Galveston during major hurricane events.",
    keyWorkTypes: ["Tornado debris", "Flood control", "Dam safety", "Vegetation management", "Emergency response"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Vicksburg District",
    code: "MVK",
    division: "Mississippi Valley Division",
    divisionColor: "#22C55E",
    states: ["MS", "LA partial"],
    url: "https://www.mvk.usace.army.mil",
    priority: "high",
    priorityScore: 84,
    stormRelevance: "Mississippi River flood control and storm debris. Active during hurricane season for inland debris and flooding support.",
    keyWorkTypes: ["Flood control", "Levee maintenance", "Storm debris", "Navigation", "Environmental restoration"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Memphis District",
    code: "MVM",
    division: "Mississippi Valley Division",
    divisionColor: "#22C55E",
    states: ["TN", "AR", "MS partial"],
    url: "https://www.mvm.usace.army.mil",
    priority: "medium",
    priorityScore: 72,
    stormRelevance: "Mid-South flooding and tornado debris. River flood control along Mississippi. Activated for severe weather events.",
    keyWorkTypes: ["Flood control", "Navigation", "Storm debris", "Levee maintenance"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Little Rock District",
    code: "SWL",
    division: "Southwestern Division",
    divisionColor: "#EAB308",
    states: ["AR"],
    url: "https://www.swl.usace.army.mil",
    priority: "medium",
    priorityScore: 68,
    stormRelevance: "Arkansas tornado and severe storm debris. Flood control and dam operations. Moderate storm activity.",
    keyWorkTypes: ["Tornado debris", "Flood control", "Dam operations", "Recreation area maintenance"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Tulsa District",
    code: "SWT",
    division: "Southwestern Division",
    divisionColor: "#EAB308",
    states: ["OK", "KS partial"],
    url: "https://www.swt.usace.army.mil",
    priority: "medium",
    priorityScore: 70,
    stormRelevance: "Oklahoma tornado alley. Severe storm and tornado debris removal. Flood control infrastructure.",
    keyWorkTypes: ["Tornado debris", "Flood control", "Dam safety", "Emergency response"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "New England District",
    code: "NAE",
    division: "North Atlantic Division",
    divisionColor: "#F59E0B",
    states: ["ME", "NH", "VT", "MA", "CT", "RI"],
    url: "https://www.nae.usace.army.mil",
    priority: "medium",
    priorityScore: 65,
    stormRelevance: "Nor'easter and hurricane debris. Coastal flooding. Growing storm intensity makes New England increasingly relevant.",
    keyWorkTypes: ["Coastal storm debris", "Beach renourishment", "Flood risk management", "Navigation"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "New York District",
    code: "NAN",
    division: "North Atlantic Division",
    divisionColor: "#F59E0B",
    states: ["NY", "NJ partial"],
    url: "https://www.nan.usace.army.mil",
    priority: "high",
    priorityScore: 78,
    stormRelevance: "Major coastal storm market. Sandy-level events generate enormous debris contracts. Critical infrastructure protection.",
    keyWorkTypes: ["Coastal storm debris", "Flood risk management", "Harbor maintenance", "Emergency response"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Philadelphia District",
    code: "NAP",
    division: "North Atlantic Division",
    divisionColor: "#F59E0B",
    states: ["PA", "NJ", "DE"],
    url: "https://www.nap.usace.army.mil",
    priority: "medium",
    priorityScore: 62,
    stormRelevance: "Mid-Atlantic coastal storms and flooding. Supports Sandy-type events. Navigation and flood control.",
    keyWorkTypes: ["Coastal protection", "Flood control", "Navigation", "Environmental restoration"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "St. Louis District",
    code: "MVS",
    division: "Mississippi Valley Division",
    divisionColor: "#22C55E",
    states: ["MO", "IL partial"],
    url: "https://www.mvs.usace.army.mil",
    priority: "medium",
    priorityScore: 64,
    stormRelevance: "Mississippi River flooding and tornado debris. Moderate storm activity. Flood control infrastructure.",
    keyWorkTypes: ["Flood control", "Navigation", "Levee maintenance", "Environmental restoration"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Rock Island District",
    code: "MVR",
    division: "Mississippi Valley Division",
    divisionColor: "#22C55E",
    states: ["IA", "IL", "MO partial"],
    url: "https://www.mvr.usace.army.mil",
    priority: "low",
    priorityScore: 50,
    stormRelevance: "Upper Mississippi flooding. Occasional severe weather debris. Lower storm frequency than Gulf/Atlantic districts.",
    keyWorkTypes: ["Flood control", "Navigation", "Lock & dam operations"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "St. Paul District",
    code: "MVP",
    division: "Mississippi Valley Division",
    divisionColor: "#22C55E",
    states: ["MN", "WI"],
    url: "https://www.mvp.usace.army.mil",
    priority: "low",
    priorityScore: 45,
    stormRelevance: "Northern flooding and occasional severe storms. Lower priority for storm debris but active in flood response.",
    keyWorkTypes: ["Flood control", "Navigation", "Environmental restoration"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Kansas City District",
    code: "NWK",
    division: "Northwestern Division",
    divisionColor: "#8B5CF6",
    states: ["KS", "MO partial"],
    url: "https://www.nwk.usace.army.mil",
    priority: "medium",
    priorityScore: 60,
    stormRelevance: "Tornado alley storms and flooding. Moderate debris removal needs. Dam and reservoir operations.",
    keyWorkTypes: ["Tornado debris", "Flood control", "Dam operations", "Environmental restoration"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Omaha District",
    code: "NWO",
    division: "Northwestern Division",
    divisionColor: "#8B5CF6",
    states: ["NE", "SD", "ND partial"],
    url: "https://www.nwo.usace.army.mil",
    priority: "low",
    priorityScore: 48,
    stormRelevance: "Plains flooding and severe weather. Lower priority for storm debris. Major dam and reservoir system management.",
    keyWorkTypes: ["Flood control", "Dam operations", "Navigation", "Environmental restoration"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Portland District",
    code: "NWP",
    division: "Northwestern Division",
    divisionColor: "#8B5CF6",
    states: ["OR"],
    url: "https://www.nwp.usace.army.mil",
    priority: "low",
    priorityScore: 42,
    stormRelevance: "Pacific Northwest storms and flooding. Wildfire-related debris increasingly relevant. Navigation and hydropower.",
    keyWorkTypes: ["Flood control", "Navigation", "Hydropower", "Environmental restoration"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Seattle District",
    code: "NWS",
    division: "Northwestern Division",
    divisionColor: "#8B5CF6",
    states: ["WA"],
    url: "https://www.nws.usace.army.mil",
    priority: "low",
    priorityScore: 40,
    stormRelevance: "Pacific Northwest flooding and mudslides. Emerging wildfire debris market. Navigation and flood control.",
    keyWorkTypes: ["Flood control", "Navigation", "Environmental restoration"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Walla Walla District",
    code: "NWW",
    division: "Northwestern Division",
    divisionColor: "#8B5CF6",
    states: ["WA", "OR", "ID partial"],
    url: "https://www.nww.usace.army.mil",
    priority: "low",
    priorityScore: 38,
    stormRelevance: "Inland Pacific NW. Limited storm debris work. Dam operations and environmental restoration.",
    keyWorkTypes: ["Dam operations", "Navigation", "Environmental restoration"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Alaska District",
    code: "POA",
    division: "Pacific Ocean Division",
    divisionColor: "#06B6D4",
    states: ["AK"],
    url: "https://www.poa.usace.army.mil",
    priority: "low",
    priorityScore: 35,
    stormRelevance: "Remote operations. Limited storm debris but unique environmental challenges. Requires specialized mobilization.",
    keyWorkTypes: ["Remote construction", "Coastal protection", "Environmental restoration"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Honolulu District",
    code: "POH",
    division: "Pacific Ocean Division",
    divisionColor: "#06B6D4",
    states: ["HI"],
    url: "https://www.poh.usace.army.mil",
    priority: "medium",
    priorityScore: 55,
    stormRelevance: "Pacific hurricane response. Island logistics add complexity. Growing storm threat with climate patterns.",
    keyWorkTypes: ["Hurricane debris", "Coastal protection", "Flood control"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Albuquerque District",
    code: "SPA",
    division: "South Pacific Division",
    divisionColor: "#A855F7",
    states: ["NM", "CO partial"],
    url: "https://www.spa.usace.army.mil",
    priority: "low",
    priorityScore: 40,
    stormRelevance: "Flash flooding and wildfire debris. Growing relevance with increased western fire activity.",
    keyWorkTypes: ["Flood control", "Dam safety", "Wildfire debris", "Environmental restoration"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Los Angeles District",
    code: "SPL",
    division: "South Pacific Division",
    divisionColor: "#A855F7",
    states: ["CA Southern", "AZ"],
    url: "https://www.spl.usace.army.mil",
    priority: "medium",
    priorityScore: 58,
    stormRelevance: "Wildfire debris, mudslide response, and flood control. Growing market with increasing fire intensity. Atmospheric river flooding.",
    keyWorkTypes: ["Wildfire debris", "Mudslide response", "Flood control", "Coastal protection"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "Sacramento District",
    code: "SPK",
    division: "South Pacific Division",
    divisionColor: "#A855F7",
    states: ["CA Northern", "NV partial"],
    url: "https://www.spk.usace.army.mil",
    priority: "medium",
    priorityScore: 56,
    stormRelevance: "Northern California wildfire and flood debris. Major flood control infrastructure. Atmospheric river events.",
    keyWorkTypes: ["Wildfire debris", "Flood control", "Levee maintenance", "Environmental restoration"],
    smallBusinessContact: "Small Business Office via district website"
  },
  {
    name: "San Francisco District",
    code: "SPN",
    division: "South Pacific Division",
    divisionColor: "#A855F7",
    states: ["CA Central Coast"],
    url: "https://www.spn.usace.army.mil",
    priority: "low",
    priorityScore: 44,
    stormRelevance: "Coastal protection and environmental restoration. Moderate storm debris needs. Navigation maintenance.",
    keyWorkTypes: ["Coastal protection", "Navigation", "Environmental restoration"],
    smallBusinessContact: "Small Business Office via district website"
  },
];

export const USACE_DIVISIONS = [
  { name: "South Atlantic Division", color: "#3B82F6", description: "Most relevant for storm/debris & emergency response work" },
  { name: "Mississippi Valley Division", color: "#22C55E", description: "Major river flooding and hurricane inland support" },
  { name: "Southwestern Division", color: "#EAB308", description: "Gulf Coast hurricanes, tornado alley, and severe storms" },
  { name: "North Atlantic Division", color: "#F59E0B", description: "Nor'easters and coastal storm response" },
  { name: "Northwestern Division", color: "#8B5CF6", description: "Plains flooding and Pacific NW storms" },
  { name: "Pacific Ocean Division", color: "#06B6D4", description: "Pacific hurricane and remote operations" },
  { name: "South Pacific Division", color: "#A855F7", description: "Wildfire debris and western flood control" },
];

export const MAJOR_PRIMES = [
  "AshBritt Environmental",
  "CrowderGulf",
  "DRC Emergency Services",
  "Ceres Environmental Services",
  "D&J Enterprises",
  "Phillips & Jordan",
  "TFR Enterprises",
  "Custom Tree Care",
];

export async function generateIntroductionEmail(
  districtName: string,
  companyInfo: {
    companyName: string;
    ownerName: string;
    certifications?: string[];
    capabilities?: string[];
    location?: string;
    phone?: string;
    email?: string;
    website?: string;
  }
): Promise<{ subject: string; body: string; tips: string[] }> {
  const district = USACE_DISTRICTS.find(d => d.name === districtName);

  const prompt = `Generate a powerful, professional introduction email from a contractor to the USACE ${districtName} Small Business Office.

COMPANY INFORMATION:
- Company Name: ${companyInfo.companyName}
- Owner/Contact: ${companyInfo.ownerName}
- Certifications: ${companyInfo.certifications?.join(', ') || 'SAM registered'}
- Core Capabilities: ${companyInfo.capabilities?.join(', ') || 'Storm debris removal, vegetation management, emergency response'}
- Location: ${companyInfo.location || 'Not specified'}
- Phone: ${companyInfo.phone || 'Not specified'}
- Email: ${companyInfo.email || 'Not specified'}
- Website: ${companyInfo.website || 'Not specified'}

DISTRICT CONTEXT:
${district ? `- District: ${district.name} (${district.code})
- Division: ${district.division}
- Coverage: ${district.states.join(', ')}
- Key work types: ${district.keyWorkTypes.join(', ')}
- Storm relevance: ${district.stormRelevance}` : `- District: ${districtName}`}

REQUIREMENTS:
1. Professional but direct tone - this is a business introduction, not a sales pitch
2. Emphasize storm-readiness and rapid mobilization capability
3. Mention SAM.gov registration and relevant certifications prominently
4. Express interest in both prime and subcontracting opportunities
5. Request to be added to vendor/small business lists
6. Ask about upcoming Industry Days or networking events
7. Keep it concise but impactful - max 300 words for the body
8. Include a clear call to action

Format as JSON:
{
  "subject": "Email subject line",
  "body": "Complete email body with proper formatting using \\n for line breaks",
  "tips": ["3-5 strategic tips specific to approaching this district"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert federal procurement consultant who specializes in helping contractors market themselves to USACE districts. Generate professional, compelling introduction emails that get noticed by Small Business Offices." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      subject: result.subject || `Introduction: ${companyInfo.companyName} — Storm-Ready Contractor`,
      body: result.body || `Dear Small Business Office,\n\nI am writing to introduce ${companyInfo.companyName}...`,
      tips: result.tips || ["Follow up within 2 weeks", "Attend Industry Days", "Register on district vendor list"]
    };
  } catch (error) {
    console.error("USACE email generation error:", error);
    return {
      subject: `Introduction: ${companyInfo.companyName} — Storm-Ready Small Business Contractor`,
      body: `Dear Small Business Specialist,\n\nI am writing to introduce ${companyInfo.companyName}, a ${companyInfo.certifications?.join(', ') || 'SAM-registered'} contractor specializing in ${companyInfo.capabilities?.join(', ') || 'storm debris removal and emergency response'}.\n\nWe are based in ${companyInfo.location || 'the region'} and maintain full readiness to mobilize within 24-48 hours for emergency response operations. Our team is experienced in USACE debris management operations and committed to meeting all federal compliance requirements.\n\nWe would appreciate the opportunity to:\n• Be added to your district's small business vendor list\n• Learn about upcoming Industry Days or networking events\n• Discuss prime and subcontracting opportunities in storm debris, vegetation management, and emergency response\n\nOur SAM.gov registration is current and we are fully insured and bonded for federal work.\n\nI would welcome a brief call or meeting to introduce our capabilities in more detail.\n\nRespectfully,\n${companyInfo.ownerName}\n${companyInfo.companyName}\n${companyInfo.phone || ''}\n${companyInfo.email || ''}\n${companyInfo.website || ''}`,
      tips: [
        "Follow up by phone within 2 weeks of sending",
        "Reference specific upcoming storm season preparedness",
        "Ask to attend the next Industry Day event",
        "Mention willingness to subcontract with established primes"
      ]
    };
  }
}

export async function generateCapabilityStatement(
  companyInfo: {
    companyName: string;
    ownerName: string;
    duns?: string;
    cage?: string;
    uei?: string;
    certifications?: string[];
    naicsCodes?: string[];
    capabilities?: string[];
    pastPerformance?: string[];
    location?: string;
    phone?: string;
    email?: string;
    website?: string;
    yearsInBusiness?: number;
    employees?: number;
    bondingCapacity?: string;
    insuranceTypes?: string[];
    equipmentList?: string[];
  }
): Promise<{ sections: Record<string, string>; tips: string[] }> {
  const prompt = `Generate a professional Federal Capability Statement for a contractor company. This is a one-page marketing document used to introduce the company to government contracting officers.

COMPANY INFORMATION:
- Company Name: ${companyInfo.companyName}
- Owner: ${companyInfo.ownerName}
- DUNS/UEI: ${companyInfo.duns || companyInfo.uei || 'Registered'}
- CAGE Code: ${companyInfo.cage || 'Registered'}
- Years in Business: ${companyInfo.yearsInBusiness || 'Established'}
- Employees: ${companyInfo.employees || 'Not specified'}
- Certifications: ${companyInfo.certifications?.join(', ') || 'SAM.gov registered'}
- NAICS Codes: ${companyInfo.naicsCodes?.join(', ') || '562119 (Debris Removal), 561730 (Landscaping), 562910 (Environmental Remediation)'}
- Core Capabilities: ${companyInfo.capabilities?.join(', ') || 'Storm debris removal, vegetation management, emergency response, ROW clearing'}
- Past Performance: ${companyInfo.pastPerformance?.join('; ') || 'Various storm response operations'}
- Location: ${companyInfo.location || 'Not specified'}
- Bonding Capacity: ${companyInfo.bondingCapacity || 'Available upon request'}
- Insurance: ${companyInfo.insuranceTypes?.join(', ') || 'General liability, workers comp, auto, umbrella'}
- Equipment: ${companyInfo.equipmentList?.join(', ') || 'Full fleet of debris removal and vegetation management equipment'}
- Contact: ${companyInfo.phone || ''} | ${companyInfo.email || ''} | ${companyInfo.website || ''}

Generate a capability statement with these sections:
1. "coreCompetencies" - 5-7 bullet points of core capabilities
2. "differentiators" - 3-5 key differentiators that set this company apart
3. "pastPerformance" - 3-4 past performance summaries (professional language)
4. "companyOverview" - 2-3 sentence company description
5. "certifications" - Formatted list of certifications and registrations
6. "contactBlock" - Formatted contact information block

Format as JSON:
{
  "sections": {
    "coreCompetencies": "Bullet points separated by \\n",
    "differentiators": "Bullet points separated by \\n",
    "pastPerformance": "Summaries separated by \\n\\n",
    "companyOverview": "Company description paragraph",
    "certifications": "Formatted certification list",
    "contactBlock": "Formatted contact block"
  },
  "tips": ["3-5 tips for using the capability statement effectively"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert federal procurement marketing consultant. Generate professional, compelling capability statements that follow GSA/DoD formatting standards and make small businesses stand out to contracting officers." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      sections: result.sections || {
        companyOverview: `${companyInfo.companyName} is a professional contractor specializing in storm debris removal and emergency response operations.`,
        coreCompetencies: "• Storm debris removal\n• Vegetation management\n• Emergency response\n• ROW clearing",
        differentiators: "• 24-48 hour mobilization capability\n• Fully bonded and insured\n• Veteran-owned",
        pastPerformance: "Various storm response and debris removal operations completed successfully.",
        certifications: companyInfo.certifications?.join('\n') || "SAM.gov Registered",
        contactBlock: `${companyInfo.ownerName}\n${companyInfo.companyName}\n${companyInfo.phone || ''}\n${companyInfo.email || ''}`
      },
      tips: result.tips || [
        "Print on high-quality cardstock for in-person meetings",
        "Keep to one page — contracting officers won't read more",
        "Update quarterly with new past performance",
        "Attach to every introduction email"
      ]
    };
  } catch (error) {
    console.error("Capability statement generation error:", error);
    return {
      sections: {
        companyOverview: `${companyInfo.companyName} is a ${companyInfo.certifications?.join(', ') || 'SAM-registered'} contractor providing ${companyInfo.capabilities?.join(', ') || 'storm debris removal and emergency response services'}.`,
        coreCompetencies: (companyInfo.capabilities || ["Storm debris removal", "Vegetation management", "Emergency response"]).map(c => `• ${c}`).join('\n'),
        differentiators: "• Rapid 24-48 hour mobilization\n• Fully bonded and insured for federal work\n• Experienced in USACE debris management operations\n• Committed to small business participation goals",
        pastPerformance: (companyInfo.pastPerformance || ["Successfully completed multiple storm response operations"]).join('\n\n'),
        certifications: (companyInfo.certifications || ["SAM.gov Registered"]).join('\n'),
        contactBlock: `${companyInfo.ownerName}\n${companyInfo.companyName}\n${companyInfo.phone || ''}\n${companyInfo.email || ''}\n${companyInfo.website || ''}`
      },
      tips: [
        "Print on professional cardstock for in-person meetings",
        "Keep to exactly one page",
        "Update with new past performance quarterly",
        "Attach to every introduction email to a district"
      ]
    };
  }
}

export function getPriorityDistricts(filterDivision?: string): USACEDistrict[] {
  let districts = [...USACE_DISTRICTS];
  if (filterDivision) {
    districts = districts.filter(d => d.division === filterDivision);
  }
  return districts.sort((a, b) => b.priorityScore - a.priorityScore);
}
