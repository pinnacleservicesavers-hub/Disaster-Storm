/**
 * Voice Guide Configuration for Evelyn - Disaster Direct AI Assistant
 * 
 * Centralized voice scripts for each module and trade-specific guidance.
 * Evelyn provides accurate, professional contractor guidance using
 * industry-neutral language (no Xactimate/Verisk branding).
 */

export interface VoiceGuideScript {
  moduleId: string;
  moduleName: string;
  intro: string;
  keyFeatures: string[];
  safetyNotes: string[];
  actionPrompts: Record<string, string>;
}

export interface TradeGuideScript {
  tradeId: string;
  tradeName: string;
  intro: string;
  captureSteps: CaptureStep[];
  scopeQuestions: ScopeQuestionPrompt[];
  lineItemTemplates: string[];
  safetyReminders: string[];
}

export interface CaptureStep {
  step: number;
  prompt: string;
  voiceScript: string;
  required: boolean;
  mediaType: 'photo' | 'video' | 'lidar';
  tips: string[];
}

export interface ScopeQuestionPrompt {
  key: string;
  prompt: string;
  voiceScript: string;
  options?: string[];
  required: boolean;
}

// ===== MODULE VOICE GUIDES =====

export const moduleVoiceGuides: Record<string, VoiceGuideScript> = {
  dashboard: {
    moduleId: 'dashboard',
    moduleName: 'Dashboard',
    intro: "Welcome to Disaster Direct. I'm Evelyn, your AI assistant. This dashboard gives you a real-time overview of active storms, open jobs, and pending claims across your service area. Let me know if you'd like me to explain any metrics or help you prioritize your day.",
    keyFeatures: [
      'Active storm tracking with AI predictions',
      'Job pipeline overview and revenue metrics',
      'Pending claims requiring attention',
      'Contractor deployment status'
    ],
    safetyNotes: [
      'Always check weather alerts before dispatching crews',
      'Verify insurance authorization before starting work'
    ],
    actionPrompts: {
      'view_storms': "I'm showing you active storms in your region. The map highlights high-probability damage zones where you might find leads.",
      'view_jobs': "Here are your current jobs organized by status. Tap any job to see full details and documentation.",
      'view_claims': "These claims need your attention. I've flagged items that are approaching lien deadlines."
    }
  },

  weather: {
    moduleId: 'weather',
    moduleName: 'Weather Intelligence',
    intro: "This is your Weather Intelligence Center. I monitor 8 real-time data sources including the National Weather Service, Storm Prediction Center, and NOAA radar. I'll alert you to severe weather that could create service opportunities in your area.",
    keyFeatures: [
      'Real-time severe weather alerts',
      'Hail and wind damage probability maps',
      'Storm path predictions with timeline',
      'Historical storm data for claims support'
    ],
    safetyNotes: [
      'Never deploy crews during active severe warnings',
      'Wait for storm passage before damage assessment',
      'Document weather conditions with timestamps for claims'
    ],
    actionPrompts: {
      'view_alerts': "Here are the active weather alerts. Red zones indicate severe warnings - hold deployments until these clear.",
      'view_predictions': "My AI analysis predicts storm impact in these areas over the next 12 to 72 hours. This helps you pre-position crews.",
      'view_radar': "Live radar shows precipitation and storm cells. I'm tracking movement to estimate when conditions will be safe for work."
    }
  },

  'disaster-lens': {
    moduleId: 'disaster-lens',
    moduleName: 'Disaster Lens',
    intro: "Welcome to Disaster Lens, your AI-powered damage documentation system. I help you capture, measure, and document property damage for insurance claims. My measurement AI supports tree removal, roofing, drywall, flooring, and more. Would you like to start a new capture session?",
    keyFeatures: [
      'AI-assisted damage detection and measurement',
      'Multi-trade support with specialized capture flows',
      'Reference object calibration for accurate sizing',
      'Automatic scope generation with confidence scores'
    ],
    safetyNotes: [
      'Always include a reference object in your photos for accurate measurements',
      'Document damage before any temporary repairs',
      'Capture wide shots showing property context',
      'AI measurements require human verification before claim submission'
    ],
    actionPrompts: {
      'start_capture': "Let's start a new measurement session. First, select the trade type - tree removal, roofing, interior drywall, or flooring.",
      'view_sessions': "Here are your recent capture sessions. Sessions with review flags need your attention before export.",
      'export_scope': "I've generated scope items from your measurements. Review the confidence scores - anything below 70% should be manually verified."
    }
  },

  claims: {
    moduleId: 'claims',
    moduleName: 'Claims Management',
    intro: "This is your Claims Management Center. I help you track insurance claims from initial filing through final payment. I monitor lien deadlines by state and flag claims requiring action. What claim would you like to review?",
    keyFeatures: [
      'Full claim lifecycle tracking',
      'State-specific lien deadline calculations',
      'Document organization and evidence linking',
      'Payment tracking and supplement management'
    ],
    safetyNotes: [
      'Verify claim numbers with carriers before work begins',
      'Document all communications with adjusters',
      'Never miss a lien filing deadline - I will remind you'
    ],
    actionPrompts: {
      'view_claim': "Here's the full claim record with all documentation. I've organized evidence by category.",
      'check_deadlines': "These claims are approaching critical deadlines. Lien notice periods vary by state - I've calculated specific dates for each.",
      'add_supplement': "To add a supplement, we need additional documentation. Let me guide you through capturing the required evidence."
    }
  },

  leads: {
    moduleId: 'leads',
    moduleName: 'Lead Pipeline',
    intro: "Welcome to your Lead Pipeline. I help you manage storm leads from initial contact through job booking. My AI can prioritize leads based on storm damage probability and property characteristics. Would you like to see today's hot leads?",
    keyFeatures: [
      'AI-powered lead scoring and prioritization',
      'Automated outreach via SMS and email',
      'Storm correlation for damage probability',
      'Kanban pipeline visualization'
    ],
    safetyNotes: [
      'Always verify property ownership before inspections',
      'Get signed authorization before any work',
      'Document pre-existing conditions separately from storm damage'
    ],
    actionPrompts: {
      'view_leads': "Here are your leads organized by status. The heat score indicates damage probability based on storm data.",
      'contact_lead': "I can send a personalized outreach message. Would you like SMS, email, or both?",
      'convert_lead': "Great - let's convert this lead to a job. I'll generate the initial inspection checklist."
    }
  },

  quotes: {
    moduleId: 'quotes',
    moduleName: 'Scope Builder',
    intro: "This is the Scope Builder, where you create detailed work scopes for customer approval and insurance submission. I help you build complete, industry-compliant scope documents with all required line items. Remember - we generate scope-ready data for your estimating workflow.",
    keyFeatures: [
      'Line item templates by trade',
      'Quantity calculations from AI measurements',
      'Industry-standard scope categories',
      'PDF export for customer and carrier'
    ],
    safetyNotes: [
      'Scope completeness is where claims are won or lost',
      'Include all protection, demo, repair, and cleanup items',
      'My AI suggests items but human estimators set final pricing'
    ],
    actionPrompts: {
      'new_quote': "Let's build a new scope. Start by selecting the trade and importing measurements from Disaster Lens.",
      'add_items': "I'm suggesting line items based on your measurements. Review each and adjust quantities as needed.",
      'export_scope': "Your scope is ready for export. This generates an industry-neutral worksheet for your estimating software."
    }
  },

  contracts: {
    moduleId: 'contracts',
    moduleName: 'Contract Center',
    intro: "Welcome to the Contract Center. I manage your job contracts, work authorizations, and assignment of benefits documents. All contracts are sent via secure electronic signature. Would you like to prepare a new contract?",
    keyFeatures: [
      'Electronic signature via secure platform',
      'Assignment of Benefits templates',
      'Work authorization tracking',
      'Contract version control'
    ],
    safetyNotes: [
      'Always get signed authorization before starting work',
      'AOB requirements vary by state - verify local rules',
      'Keep copies of all signed documents'
    ],
    actionPrompts: {
      'new_contract': "I'll prepare a contract based on your approved scope. Select the template that matches this job type.",
      'send_signature': "The contract is ready to send. The customer will receive a secure link to review and sign.",
      'view_status': "Here's the signature status. Once signed, I'll mark the job as ready to schedule."
    }
  }
};

// ===== TRADE-SPECIFIC VOICE GUIDES =====

export const tradeVoiceGuides: Record<string, TradeGuideScript> = {
  roofing: {
    tradeId: 'roofing',
    tradeName: 'Roofing',
    intro: "I'll guide you through capturing roofing measurements. For best results, we need exterior photos from all four sides, plus a walkaround video. Drone footage works best if available, otherwise ground-level photos with a reference object.",
    captureSteps: [
      {
        step: 1,
        prompt: 'Front elevation photo',
        voiceScript: "Start with a front elevation photo. Stand far enough back to capture the entire roof line. Include something with known size in the frame - a standard door or a person works well.",
        required: true,
        mediaType: 'photo',
        tips: ['Include full roof edge to ridge', 'Capture any visible damage', 'Note the material type']
      },
      {
        step: 2,
        prompt: 'Back elevation photo',
        voiceScript: "Now the back elevation. Same approach - capture the full roof line from eave to ridge. Look for any damage or wear not visible from the front.",
        required: true,
        mediaType: 'photo',
        tips: ['Check for missing shingles', 'Note gutter condition', 'Capture chimney and vents']
      },
      {
        step: 3,
        prompt: 'Left side photo',
        voiceScript: "Left side view. This helps me calculate roof area and pitch. Include the full height from ground to ridge if possible.",
        required: true,
        mediaType: 'photo',
        tips: ['Show roof pitch angle', 'Capture side trim and flashing']
      },
      {
        step: 4,
        prompt: 'Right side photo',
        voiceScript: "Right side view. Same as the left - I need to see the full roof profile for accurate square footage.",
        required: true,
        mediaType: 'photo',
        tips: ['Document any penetrations', 'Note valley locations']
      },
      {
        step: 5,
        prompt: 'Roof edge close-up',
        voiceScript: "Get a close-up of the roof edge showing the eave and drip edge. This helps me assess demo and edge work.",
        required: false,
        mediaType: 'photo',
        tips: ['Show shingle overhang', 'Capture fascia condition', 'Document starter course']
      },
      {
        step: 6,
        prompt: 'Walkaround video (10-20 seconds)',
        voiceScript: "Now do a slow walkaround video, about 15 seconds. Start at the front and walk around the entire house. Keep the roof line in frame the whole time.",
        required: true,
        mediaType: 'video',
        tips: ['Slow and steady movement', 'Keep camera pointed at roof', 'Narrate any visible damage']
      }
    ],
    scopeQuestions: [
      {
        key: 'roof_material',
        prompt: 'What is the roofing material?',
        voiceScript: "What's the existing roof material? I can usually detect this from photos, but please confirm - is it asphalt shingles, metal, tile, or flat membrane?",
        options: ['Asphalt shingles', 'Metal', 'Tile', 'Flat/membrane', 'Other'],
        required: true
      },
      {
        key: 'tearoff_layers',
        prompt: 'How many layers need to be removed?',
        voiceScript: "How many existing layers need tear-off? One layer is standard, but older roofs may have two or more layers - this significantly affects labor.",
        options: ['1 layer', '2 layers', '3+ layers', 'Overlay (no tear-off)'],
        required: true
      },
      {
        key: 'replace_drip_edge',
        prompt: 'Replace drip edge?',
        voiceScript: "Should we include drip edge replacement in the scope? This is typically required for full re-roofs.",
        options: ['Yes', 'No', 'Partial'],
        required: true
      },
      {
        key: 'decking_damage',
        prompt: 'Any visible decking damage?',
        voiceScript: "Is there any visible decking damage or soft spots? This affects material and labor scope.",
        options: ['None visible', 'Minor spots', 'Significant damage', 'Unknown - need inspection'],
        required: true
      },
      {
        key: 'permit_required',
        prompt: 'Permit required?',
        voiceScript: "Does this jurisdiction require a roofing permit? I can suggest based on location, but please confirm local requirements.",
        options: ['Yes', 'No', 'Check with municipality'],
        required: false
      }
    ],
    lineItemTemplates: [
      'Protection - tarp and landscape protection',
      'Tear-off - remove existing roofing and haul',
      'Underlayment - synthetic or felt',
      'Drip edge - aluminum or galvanized',
      'Flashing - step, chimney, and wall flashing',
      'Pipe boots and vent flashing',
      'Ridge cap and ventilation',
      'Cleanup and magnet sweep'
    ],
    safetyReminders: [
      'Never walk on a damaged roof without safety equipment',
      'Ground-level photos are sufficient for initial assessment',
      'Drone footage provides the best measurements for complex roofs'
    ]
  },

  tree: {
    tradeId: 'tree',
    tradeName: 'Tree Removal',
    intro: "I'll help you document this tree for removal or trimming. For accurate measurements, I need photos showing the full tree from base to crown, plus a trunk close-up with a reference object. My AI uses forestry equations to estimate size and weight.",
    captureSteps: [
      {
        step: 1,
        prompt: 'Full tree photo - front view',
        voiceScript: "First, a full tree photo showing base to crown. Stand 20 to 30 feet back so the entire tree fits in frame. Include something with known size - a person standing at the base works perfectly.",
        required: true,
        mediaType: 'photo',
        tips: ['Capture ground to top of crown', 'Include reference object at base', 'Show surroundings for access assessment']
      },
      {
        step: 2,
        prompt: 'Full tree photo - side angle',
        voiceScript: "Now a second full-tree photo from a different angle, ideally 90 degrees from the first. This helps me calculate crown spread and detect any lean.",
        required: true,
        mediaType: 'photo',
        tips: ['Different angle from first photo', 'Show lean direction if any', 'Capture obstacles like fences or structures']
      },
      {
        step: 3,
        prompt: 'Trunk close-up at chest height',
        voiceScript: "Get a trunk close-up at about chest height - that's 4 and a half feet from ground. Place something with known size against the trunk - a credit card, tape measure, or letter-size paper works great.",
        required: true,
        mediaType: 'photo',
        tips: ['Chest height measurement point', 'Reference object touching trunk', 'Show bark condition for species ID']
      },
      {
        step: 4,
        prompt: 'Hazards and access photo',
        voiceScript: "Finally, a wider shot showing any hazards or access issues - power lines, structures, fences, or slope. This affects equipment needs and pricing.",
        required: false,
        mediaType: 'photo',
        tips: ['Show powerline proximity', 'Document fence gates and access paths', 'Capture any nearby structures']
      }
    ],
    scopeQuestions: [
      {
        key: 'species',
        prompt: 'Tree species (if known)',
        voiceScript: "Do you know the tree species? I can suggest from the photos, but species affects weight calculations. Common options are oak, pine, maple, or tell me unknown.",
        options: ['Oak', 'Pine', 'Maple', 'Elm', 'Ash', 'Cedar', 'Palm', 'Other', 'Unknown'],
        required: false
      },
      {
        key: 'emergency',
        prompt: 'Is this an emergency removal?',
        voiceScript: "Is this an emergency removal - tree on structure, blocking access, or immediate hazard?",
        options: ['Yes - emergency', 'No - scheduled removal'],
        required: true
      },
      {
        key: 'stump_included',
        prompt: 'Include stump grinding?',
        voiceScript: "Should the scope include stump grinding, or removal only down to ground level?",
        options: ['Yes - grind stump', 'No - cut at ground', 'Quote separately'],
        required: true
      },
      {
        key: 'haul_debris',
        prompt: 'Haul away debris?',
        voiceScript: "Will you haul away all debris, or leave wood on site for the customer?",
        options: ['Haul everything', 'Leave logs for customer', 'Chip on site', 'Quote separately'],
        required: true
      },
      {
        key: 'access_equipment',
        prompt: 'Equipment access available?',
        voiceScript: "What's the equipment access situation? Can a bucket truck reach the tree, or is this a climb-and-rig job?",
        options: ['Bucket truck access', 'Crane required', 'Climb only', 'Backyard - limited access'],
        required: true
      }
    ],
    lineItemTemplates: [
      'Site protection - fencing and ground cover',
      'Tree removal - size-based pricing',
      'Bucket truck or crane (if required)',
      'Rigging and sectioning',
      'Debris haul and disposal',
      'Stump grinding (optional)',
      'Temporary repairs if structure impacted'
    ],
    safetyReminders: [
      'Always check for overhead power lines before climbing',
      'Document hazards in photos for insurance justification',
      'Note any lean direction - this affects rigging plan'
    ]
  },

  drywall: {
    tradeId: 'drywall',
    tradeName: 'Drywall & Paint',
    intro: "I'll help you document interior damage for drywall and paint repairs. For best measurements, use LiDAR scan if your device supports it, otherwise a corner-to-corner video with a door as reference. My AI calculates wall and ceiling areas automatically.",
    captureSteps: [
      {
        step: 1,
        prompt: 'Room overview from doorway',
        voiceScript: "Start in the doorway and capture a full room overview. Include the door frame in the shot - standard interior doors are 80 inches tall, which I'll use as my reference.",
        required: true,
        mediaType: 'photo',
        tips: ['Show full room from doorway', 'Include door frame for reference', 'Capture ceiling condition']
      },
      {
        step: 2,
        prompt: 'Slow 360 room video',
        voiceScript: "Now do a slow 360 video scan of the room. Start at one corner and pan around all four walls, then tilt up to show the ceiling. Keep it smooth and steady.",
        required: true,
        mediaType: 'video',
        tips: ['Slow smooth rotation', 'Capture all four corners', 'Show ceiling at the end']
      },
      {
        step: 3,
        prompt: 'Damage close-up photos',
        voiceScript: "Take close-up photos of any specific damage areas. Water stains, cracks, holes, or areas needing patch work. These help justify scope items.",
        required: false,
        mediaType: 'photo',
        tips: ['Document each damage area', 'Show stain patterns for water damage', 'Capture crack length and width']
      },
      {
        step: 4,
        prompt: 'Corner photos for dimensions',
        voiceScript: "If LiDAR isn't available, capture each corner where walls meet. This helps me calculate room dimensions more accurately.",
        required: false,
        mediaType: 'photo',
        tips: ['Vertical corner shots', 'Floor to ceiling visible', 'Note window and door locations']
      }
    ],
    scopeQuestions: [
      {
        key: 'finish_level',
        prompt: 'Drywall finish level',
        voiceScript: "What finish level is required? Level 3 is standard for textured walls, level 4 for flat paint, level 5 for high-gloss or critical lighting areas.",
        options: ['Level 3 - texture', 'Level 4 - flat paint', 'Level 5 - smooth premium'],
        required: true
      },
      {
        key: 'paint_scope',
        prompt: 'Paint scope',
        voiceScript: "What's the paint scope? Walls only, walls and ceiling, or full including trim and baseboards?",
        options: ['Walls only', 'Walls and ceiling', 'Full - walls, ceiling, and trim'],
        required: true
      },
      {
        key: 'texture_type',
        prompt: 'Texture type',
        voiceScript: "What texture needs to be matched? Options include smooth, orange peel, knockdown, or popcorn ceiling.",
        options: ['Smooth - no texture', 'Orange peel', 'Knockdown', 'Popcorn', 'Skip trowel', 'Other'],
        required: true
      },
      {
        key: 'occupied',
        prompt: 'Is the home occupied?',
        voiceScript: "Is the home occupied during repairs? This affects containment, protection, and scheduling requirements.",
        options: ['Yes - occupied', 'No - vacant', 'Partial - some rooms in use'],
        required: true
      }
    ],
    lineItemTemplates: [
      'Containment and protection',
      'Demo - remove damaged drywall',
      'Drywall replace - by square foot',
      'Tape, mud, and finish',
      'Texture match',
      'Prime and paint - walls',
      'Prime and paint - ceiling',
      'Trim and baseboard paint',
      'Cleanup'
    ],
    safetyReminders: [
      'Check for asbestos or lead paint in older homes before demo',
      'Document water source for insurance - plumbing, roof, or external',
      'Note contents protection requirements in occupied homes'
    ]
  },

  flooring: {
    tradeId: 'flooring',
    tradeName: 'Flooring',
    intro: "I'll help you document flooring damage and measure for replacement. I need a room sweep video and photos of transitions and stairs. My AI calculates square footage and identifies scope items for demo, prep, and installation.",
    captureSteps: [
      {
        step: 1,
        prompt: 'Room sweep video',
        voiceScript: "Do a slow sweep video of the floor area. Start at one corner and walk the perimeter, keeping the camera pointed down at the floor. Show all edges where flooring meets walls.",
        required: true,
        mediaType: 'video',
        tips: ['Keep camera pointed at floor', 'Walk the entire perimeter', 'Show damage areas clearly']
      },
      {
        step: 2,
        prompt: 'Transition photos',
        voiceScript: "Take photos of each transition - doorways between rooms, changes in flooring material, and thresholds. I need to count these for the scope.",
        required: true,
        mediaType: 'photo',
        tips: ['Each doorway or material change', 'Show current transition condition', 'Note height differences']
      },
      {
        step: 3,
        prompt: 'Stair photos (if applicable)',
        voiceScript: "If there are stairs, photograph the full staircase showing the number of treads. Stairs are priced per tread, so I need an accurate count.",
        required: false,
        mediaType: 'photo',
        tips: ['Show full stair run', 'Count visible treads', 'Note riser and landing conditions']
      },
      {
        step: 4,
        prompt: 'Damage close-ups',
        voiceScript: "Capture close-ups of any specific damage - water staining, warping, buckling, or delamination. These photos support the claim scope.",
        required: false,
        mediaType: 'photo',
        tips: ['Document water damage patterns', 'Show warping or buckling', 'Note affected edges and seams']
      }
    ],
    scopeQuestions: [
      {
        key: 'flooring_material',
        prompt: 'Replacement material type',
        voiceScript: "What material is being installed? LVP, hardwood, tile, carpet, or laminate?",
        options: ['LVP - luxury vinyl plank', 'Hardwood', 'Tile', 'Carpet', 'Laminate', 'Other'],
        required: true
      },
      {
        key: 'demo_required',
        prompt: 'Demo existing flooring?',
        voiceScript: "Does the existing flooring need to be removed, or can new material go over the top?",
        options: ['Yes - demo required', 'No - install over existing', 'Partial demo'],
        required: true
      },
      {
        key: 'subfloor_condition',
        prompt: 'Subfloor condition',
        voiceScript: "What's the subfloor condition? Will it need leveling, repair, or replacement in any areas?",
        options: ['Good - no prep needed', 'Needs leveling', 'Needs repair', 'Unknown - check after demo'],
        required: true
      },
      {
        key: 'move_furniture',
        prompt: 'Furniture moving required?',
        voiceScript: "Does the scope include moving furniture, or will the customer clear rooms before work?",
        options: ['Yes - move furniture', 'No - rooms will be cleared', 'Move and return'],
        required: true
      },
      {
        key: 'baseboards',
        prompt: 'Baseboard scope',
        voiceScript: "What about baseboards? Remove and reinstall, replace with new, or leave in place?",
        options: ['Remove and reinstall', 'Replace with new', 'Leave in place', 'Quarter round only'],
        required: true
      }
    ],
    lineItemTemplates: [
      'Furniture move (if applicable)',
      'Demo - remove existing flooring',
      'Haul and dispose',
      'Subfloor prep and leveling',
      'Install flooring - by square foot',
      'Transitions',
      'Stairs - per tread',
      'Baseboard remove/reinstall or replace',
      'Quarter round',
      'Cleanup'
    ],
    safetyReminders: [
      'Check for asbestos in older vinyl or tile before demo',
      'Document moisture source for water damage claims',
      'Test moisture levels in subfloor before installation approval'
    ]
  }
};

// ===== GENERAL VOICE SCRIPTS =====

export const generalVoiceScripts = {
  welcome: "Welcome to Disaster Direct. I'm Evelyn, your AI assistant for storm operations and claims management. How can I help you today?",
  
  measurementDisclaimer: "All measurements are AI-generated estimates using computer vision analysis. These outputs require verification by a qualified estimator before use in insurance claims. Confidence scores indicate AI certainty based on image quality and reference object visibility.",
  
  lowConfidenceWarning: "This measurement has low confidence and should be manually verified. Consider recapturing with a better reference object or clearer photos.",
  
  scopeExportReminder: "Remember - our scope outputs are designed to feed into your estimating workflow. We provide complete, documented scope data, but pricing is set by your estimating software and team.",
  
  claimDeadlineWarning: "You have claims approaching lien deadlines. Missing these deadlines could affect your ability to collect payment. Would you like me to show you the priority list?",
  
  safetyCheck: "Before you head out, let me check weather conditions. Active severe warnings mean crews should stand down until conditions clear.",
  
  sessionComplete: "Capture session complete. I've generated measurements and scope items from your documentation. Review the confidence scores - anything flagged needs your attention before export.",
  
  dataIntegrityNotice: "All data in Disaster Direct is verified against authoritative sources. I never fabricate or estimate data that should come from actual weather services, property records, or your own measurements."
};

// ===== HELPER FUNCTIONS =====

export function getModuleVoiceGuide(moduleId: string): VoiceGuideScript | null {
  return moduleVoiceGuides[moduleId] || null;
}

export function getTradeVoiceGuide(tradeId: string): TradeGuideScript | null {
  return tradeVoiceGuides[tradeId] || null;
}

export function getWelcomeScript(moduleName: string): string {
  const guide = Object.values(moduleVoiceGuides).find(g => g.moduleName === moduleName);
  return guide?.intro || generalVoiceScripts.welcome;
}

export function getCaptureStepScript(tradeId: string, stepNumber: number): string | null {
  const guide = tradeVoiceGuides[tradeId];
  if (!guide) return null;
  const step = guide.captureSteps.find(s => s.step === stepNumber);
  return step?.voiceScript || null;
}

export function getScopeQuestionScript(tradeId: string, questionKey: string): string | null {
  const guide = tradeVoiceGuides[tradeId];
  if (!guide) return null;
  const question = guide.scopeQuestions.find(q => q.key === questionKey);
  return question?.voiceScript || null;
}

export function getAllTradeIds(): string[] {
  return Object.keys(tradeVoiceGuides);
}

export function getAllModuleIds(): string[] {
  return Object.keys(moduleVoiceGuides);
}
