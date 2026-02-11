import OpenAI from "openai";
import { storage } from "../storage";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://openai-gateway.replit.dev/v1',
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || 'dummy-key-for-replit-ai'
});

const BID_INTEL_SYSTEM_PROMPT = `You are Rachel, an expert AI Procurement Intelligence Agent for AI BidIntel Pro™ on the Strategic Services Savers platform. You have decades of hands-on experience helping contractors find, prepare, and WIN government and commercial bids.

YOUR #1 DIRECTIVE: You are THE definitive expert on government bidding. You don't just advise — you actively GUIDE contractors through every step of the procurement process, from finding opportunities to completing forms to submitting winning proposals.

CORE IDENTITY:
- You are a procurement intelligence expert who knows every government bidding portal, every form, every compliance requirement
- You know SAM.gov, BidNet Direct, state procurement portals, FEMA contracting, USACE, GSA schedules, and municipal bidding inside and out
- You guide contractors through the ENTIRE bid process — finding opportunities, analyzing requirements, pricing strategy, proposal writing, form completion, submission, and post-award
- You speak with authority and give SPECIFIC, actionable answers — never vague or generic

KEY CAPABILITIES YOU MUST DEMONSTRATE:
1. **Find Opportunities**: Guide contractors to the right portals for their trade, state, and certification level
2. **Analyze Bids**: Break down solicitation requirements, identify risks, evaluate go/no-go decisions
3. **Price Strategy**: Help with competitive pricing — the 5-10% below IGCE sweet spot, unbalanced pricing, T&M vs FFP analysis
4. **Proposal Writing**: Help draft technical approaches, past performance narratives, compliance matrices
5. **Form Completion**: Walk contractors through SAM.gov registration, SF-330, SF-1449, W-9, bonding applications, insurance certificates
6. **Compliance**: NAICS codes, UEI numbers, CAGE codes, set-aside certifications (SDVOSB, WOSB, HUBZone, 8(a), DBE)
7. **Submission**: Portal navigation, upload requirements, deadline management
8. **Post-Award**: Contract management, invoicing, CPARS, modifications

PLATFORM KNOWLEDGE:
- This app has a Procurement Portal Finder with all 50 state procurement sites and county-level lookup
- Contractors can access BidNet Direct and SAM.gov directly through tabs in this module
- The app tracks bid opportunities, submissions, win rates, and provides TrueCost profit analysis
- You should reference these tools and guide contractors to use them

INSIDER TIPS DATABASE:
1. **Price Psychology**: Government evaluators have a "price reasonableness" range. Being 5-10% below the IGCE is ideal — too low triggers concerns about ability to perform.
2. **Past Performance**: Always include 3-5 strong references. Call them beforehand to confirm they'll give positive feedback.
3. **Technical Approach**: Mirror the solicitation language exactly. Use their terminology, not yours.
4. **Compliance Matrix**: Create a cross-reference matrix showing where each requirement is addressed. Evaluators score with checklists.
5. **Pre-Bid Meetings**: Ask strategic questions that showcase expertise. "What's the anticipated timeline for NTP after award?"
6. **RFI Strategy**: Submit questions that highlight scope gaps — this creates addenda that level the playing field.
7. **Set-Aside Leverage**: If you have certifications, emphasize them prominently. Many contracts are set-aside only.
8. **Local Preference**: Some municipalities give 5-10% price preference to local businesses.
9. **Subcontracting Plans**: For larger contracts, strong subcontracting plans with small/disadvantaged businesses win points.
10. **CPARS/PPQ**: Your past performance in CPARS matters. Request copies of evaluations.
11. **The 24-Hour Rule**: Never submit in the final 24 hours. Portal issues happen. Submit 48-72 hours early.
12. **Incumbent Strategy**: When competing against incumbents, emphasize innovation and improvements they can't offer.

STATE PROCUREMENT PORTALS (Direct contractors here):
- Federal: SAM.gov (sam.gov/opportunities)
- Each state has an official procurement portal — use the Procurement Portal Finder in this module
- County/city bids are often on aggregators: BidNet Direct, DemandStar, Bonfire, PlanetBids, PublicPurchase

RESPONSE STYLE:
- Be direct, specific, and actionable — like a seasoned procurement consultant briefing a contractor
- Use bold headers to organize detailed answers
- Include specific examples, form numbers, and portal names
- When asked about forms, walk through them field by field
- When asked about strategy, give the insider approach that wins
- NEVER be vague or say "it depends" without following up with specific scenarios
- After giving a complete answer, STOP. Don't add unnecessary follow-up questions.`;

const INSIDER_TIPS_DATABASE = [
  {
    category: "pricing",
    title: "The Government Estimate Sweet Spot",
    tip: "Bid 5-10% below the Independent Government Cost Estimate (IGCE). Being too low triggers 'price realism' concerns - evaluators will question if you can perform the work.",
    example: "If the government estimate is $500,000, target $450,000-$475,000 for best positioning."
  },
  {
    category: "pricing",
    title: "Unbalanced Pricing Strategy",
    tip: "Front-load mobilization and early-phase line items slightly higher. Cash flow matters, and evaluators rarely scrutinize individual line items if total is competitive.",
    example: "Mobilization at 8-10% of total vs standard 5% - recovers costs faster and reduces risk."
  },
  {
    category: "compliance",
    title: "The Compliance Matrix Secret",
    tip: "Create a cross-reference matrix showing exactly where in your proposal each requirement is addressed. Evaluators score with checklists - make their job easy.",
    example: "Section L/M compliance matrix: Requirement 1.a → Proposal Section 2.3, Page 12"
  },
  {
    category: "strategy",
    title: "Pre-Bid Intelligence Gathering",
    tip: "Research past awards for similar work. FPDS (fpds.gov) shows who won, at what price, and who else bid. This is public information most contractors ignore.",
    example: "Search FPDS for the NAICS code and see historical award prices and competitors."
  },
  {
    category: "strategy",
    title: "The Incumbent Weakness",
    tip: "When competing against incumbents, emphasize innovation, fresh perspective, and specific improvements. Incumbents often get complacent.",
    example: "Propose technology upgrades, efficiency improvements, or enhanced reporting the incumbent doesn't offer."
  },
  {
    category: "pre_bid",
    title: "Strategic Question Timing",
    tip: "Submit questions early in the Q&A period - don't wait until the deadline. Early questions get thorough responses and may prompt addenda that help your bid.",
    example: "Ask about ambiguous specs, unclear deliverables, or missing information. Shows expertise."
  },
  {
    category: "pre_bid",
    title: "Site Visit Photography",
    tip: "At site visits, photograph everything - especially access constraints, existing conditions, and potential hazards. Reference these photos in your technical approach.",
    example: "Include a photo showing 'limited staging area requiring phased equipment deployment.'"
  },
  {
    category: "submission",
    title: "The 24-Hour Rule",
    tip: "Never submit in the final 24 hours. Portal issues, upload failures, and system timeouts happen. Submit 48-72 hours early if possible.",
    example: "SAM.gov has known peak-time slowdowns. Submit Tuesday morning for Thursday deadlines."
  },
  {
    category: "submission",
    title: "Sealed Bid Presentation",
    tip: "For sealed bids, use professional binding, clear tabs, and high-quality printing. First impressions matter before evaluators read a word.",
    example: "Coil-bound with colored tab dividers matching the solicitation sections."
  },
  {
    category: "certifications",
    title: "Certification Stacking",
    tip: "Multiple certifications compound your advantage. A SDVOSB + HUBZone company gets preference on multiple set-aside types.",
    example: "Actively pursue additional certifications - each one opens new opportunity pools."
  },
  {
    category: "references",
    title: "Reference Preparation",
    tip: "Before listing references, call them. Remind them of the project, share key points to emphasize, and confirm they'll respond promptly.",
    example: "Send your reference a one-page summary of the work they can reference when contacted."
  },
  {
    category: "technical",
    title: "Mirror Language Technique",
    tip: "Use the exact terminology from the solicitation in your proposal. If they say 'stakeholder engagement,' don't say 'client communication.'",
    example: "Extract keywords from the PWS/SOW and use them 3-5 times in your technical approach."
  },
  {
    category: "negotiation",
    title: "Best and Final Offer Strategy",
    tip: "When asked for BAFO, improve something - price, schedule, or added value. Submitting the same proposal signals inflexibility.",
    example: "Reduce price 3-5% OR add 2 extra months of warranty OR include additional training."
  },
  {
    category: "protest",
    title: "When to Protest",
    tip: "If you lose and see evaluation errors, consider protesting. Success rates at GAO are 15-20%. Sometimes agencies re-evaluate rather than litigate.",
    example: "Request a debriefing first. If you find procedural errors, a well-crafted protest can succeed."
  }
];

export interface BidIntelResponse {
  message: string;
  tips?: typeof INSIDER_TIPS_DATABASE[0][];
  category?: string;
  audioUrl?: string;
}

export async function generateBidIntelResponse(
  contractorId: string,
  userMessage: string,
  opportunityContext?: {
    title?: string;
    agency?: string;
    bidType?: string;
    value?: number;
  }
): Promise<BidIntelResponse> {
  const contextMessage = opportunityContext
    ? `\n\nCurrent opportunity context:\n- Title: ${opportunityContext.title || 'Not specified'}\n- Agency: ${opportunityContext.agency || 'Not specified'}\n- Type: ${opportunityContext.bidType || 'Not specified'}\n- Estimated Value: ${opportunityContext.value ? `$${opportunityContext.value.toLocaleString()}` : 'Not specified'}`
    : '';

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: BID_INTEL_SYSTEM_PROMPT + contextMessage },
        { role: "user", content: userMessage }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const message = response.choices[0]?.message?.content || "I apologize, I couldn't generate a response. Please try again.";

    const relevantTips = findRelevantTips(userMessage);

    return {
      message,
      tips: relevantTips.length > 0 ? relevantTips : undefined,
      category: categorizeQuestion(userMessage),
    };
  } catch (error) {
    console.error("BidIntel AI error:", error);
    return {
      message: "I'm having trouble connecting right now. Here's a quick tip: Always submit bids at least 48 hours before the deadline to avoid portal issues. Can I help with something else?",
      tips: [INSIDER_TIPS_DATABASE[7]],
      category: "general"
    };
  }
}

function findRelevantTips(question: string): typeof INSIDER_TIPS_DATABASE[0][] {
  const lowerQuestion = question.toLowerCase();
  const keywords: Record<string, string[]> = {
    pricing: ['price', 'cost', 'bid amount', 'estimate', 'margin', 'pricing'],
    compliance: ['compliance', 'requirement', 'certification', 'matrix', 'checklist'],
    strategy: ['win', 'strategy', 'compete', 'incumbent', 'advantage'],
    pre_bid: ['pre-bid', 'site visit', 'question', 'rfi', 'meeting'],
    submission: ['submit', 'deadline', 'portal', 'upload', 'sealed'],
    certifications: ['certification', 'sdvosb', 'wosb', 'hubzone', '8a', 'dbe', 'small business'],
    references: ['reference', 'past performance', 'cpars', 'experience'],
    technical: ['technical', 'proposal', 'approach', 'writing'],
    negotiation: ['negotiate', 'bafo', 'best and final', 'counter'],
    protest: ['protest', 'gao', 'dispute', 'lost', 'unfair']
  };

  const matchedCategories = new Set<string>();
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => lowerQuestion.includes(word))) {
      matchedCategories.add(category);
    }
  }

  if (matchedCategories.size === 0) {
    return INSIDER_TIPS_DATABASE.slice(0, 2);
  }

  return INSIDER_TIPS_DATABASE.filter(tip => matchedCategories.has(tip.category)).slice(0, 3);
}

function categorizeQuestion(question: string): string {
  const lowerQuestion = question.toLowerCase();
  if (lowerQuestion.includes('price') || lowerQuestion.includes('cost') || lowerQuestion.includes('bid amount')) return 'pricing';
  if (lowerQuestion.includes('pre-bid') || lowerQuestion.includes('site visit')) return 'pre_bid';
  if (lowerQuestion.includes('submit') || lowerQuestion.includes('deadline')) return 'submission';
  if (lowerQuestion.includes('win') || lowerQuestion.includes('strategy')) return 'strategy';
  if (lowerQuestion.includes('compliance') || lowerQuestion.includes('requirement')) return 'compliance';
  return 'general';
}

export async function generateRFIQuestion(
  opportunityDetails: {
    title: string;
    description?: string;
    agency: string;
    scope?: string;
  },
  contractorConcern: string
): Promise<{ question: string; rationale: string; emailSubject: string; emailBody: string }> {
  const prompt = `Generate a professional RFI (Request for Information) question for this procurement opportunity:

Opportunity: ${opportunityDetails.title}
Agency: ${opportunityDetails.agency}
${opportunityDetails.description ? `Description: ${opportunityDetails.description}` : ''}
${opportunityDetails.scope ? `Scope: ${opportunityDetails.scope}` : ''}

Contractor's concern/question area: ${contractorConcern}

Generate:
1. A clear, professional question that addresses the concern
2. Brief rationale explaining why this question is strategically valuable
3. A professional email subject line
4. A complete email body ready to send

Format response as JSON:
{
  "question": "...",
  "rationale": "...",
  "emailSubject": "...",
  "emailBody": "..."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert procurement consultant helping contractors craft strategic RFI questions. Generate professional, clear questions that showcase expertise and extract valuable information." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      question: result.question || contractorConcern,
      rationale: result.rationale || "This question clarifies important scope details.",
      emailSubject: result.emailSubject || `RFI - ${opportunityDetails.title}`,
      emailBody: result.emailBody || `Dear Procurement Officer,\n\n${result.question}\n\nThank you for your consideration.\n\nBest regards`
    };
  } catch (error) {
    console.error("RFI generation error:", error);
    return {
      question: contractorConcern,
      rationale: "Clarifies scope requirements for accurate bid preparation.",
      emailSubject: `RFI - ${opportunityDetails.title}`,
      emailBody: `Dear Procurement Officer,\n\nRegarding solicitation "${opportunityDetails.title}", we respectfully request clarification on the following:\n\n${contractorConcern}\n\nYour response will help ensure our proposal accurately addresses the requirements.\n\nThank you for your assistance.\n\nBest regards`
    };
  }
}

export async function analyzeBidOpportunity(opportunity: {
  title: string;
  description?: string;
  agency: string;
  estimatedValue?: number;
  requirements?: string;
  dueDate?: Date;
}): Promise<{
  qualificationScore: number;
  riskFlags: string[];
  recommendedBidRange: { min: number; target: number; aggressive: number };
  analysis: string;
  tips: string[];
}> {
  const prompt = `Analyze this bid opportunity for a contractor:

Title: ${opportunity.title}
Agency: ${opportunity.agency}
${opportunity.description ? `Description: ${opportunity.description}` : ''}
${opportunity.estimatedValue ? `Estimated Value: $${opportunity.estimatedValue.toLocaleString()}` : ''}
${opportunity.requirements ? `Requirements: ${opportunity.requirements}` : ''}
${opportunity.dueDate ? `Due Date: ${opportunity.dueDate.toISOString()}` : ''}

Provide:
1. Qualification score (0-100) based on typical small contractor capability
2. Risk flags (array of concerns)
3. Recommended bid range (min, target, aggressive prices)
4. Brief analysis
5. Top 3 tips for this specific opportunity

Format as JSON:
{
  "qualificationScore": number,
  "riskFlags": ["...", "..."],
  "recommendedBidRange": { "min": number, "target": number, "aggressive": number },
  "analysis": "...",
  "tips": ["...", "...", "..."]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert procurement analyst. Analyze opportunities realistically. Base pricing on industry standards. For government contracts, use 10-20% margin typically." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    const estimatedValue = opportunity.estimatedValue || 100000;
    
    return {
      qualificationScore: result.qualificationScore || 75,
      riskFlags: result.riskFlags || ["Review insurance requirements", "Verify bonding capacity"],
      recommendedBidRange: result.recommendedBidRange || {
        min: estimatedValue * 0.85,
        target: estimatedValue * 0.92,
        aggressive: estimatedValue * 0.80
      },
      analysis: result.analysis || "This opportunity requires standard contractor capabilities. Review requirements carefully.",
      tips: result.tips || ["Submit 48 hours before deadline", "Include compliance matrix", "Call references beforehand"]
    };
  } catch (error) {
    console.error("Opportunity analysis error:", error);
    const estimatedValue = opportunity.estimatedValue || 100000;
    return {
      qualificationScore: 70,
      riskFlags: ["Verify all requirements before submitting"],
      recommendedBidRange: {
        min: estimatedValue * 0.85,
        target: estimatedValue * 0.92,
        aggressive: estimatedValue * 0.80
      },
      analysis: "Standard procurement opportunity. Review all requirements carefully.",
      tips: ["Review solicitation thoroughly", "Submit early to avoid portal issues", "Prepare compliance matrix"]
    };
  }
}

export { INSIDER_TIPS_DATABASE };
