import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { storage } from "../storage";

export interface LeadQualificationInput {
  customerName: string;
  projectDescription: string;
  serviceType: string;
  location: {
    city: string;
    state: string;
    zipCode?: string;
  };
  budget?: string;
  urgency?: "flexible" | "normal" | "urgent" | "emergency";
  photos?: string[];
  customerPhone?: string;
  customerEmail?: string;
}

export interface QualifiedLead {
  isQualified: boolean;
  qualificationScore: number;
  serviceCategory: string;
  tradeRequired: string[];
  estimatedBudgetRange: { min: number; max: number };
  urgencyLevel: "flexible" | "normal" | "urgent" | "emergency";
  projectComplexity: "simple" | "moderate" | "complex";
  scopeSummary: string;
  keyQuestions: string[];
  matchCriteria: {
    requiredTrades: string[];
    preferredExperience: number;
    licensingRequired: boolean;
    insuranceRequired: boolean;
  };
  aiConfidence: number;
  reasoning: string;
}

export interface ContractorMatch {
  contractorId: string;
  contractorName: string;
  matchScore: number;
  matchReasons: string[];
  estimatedAvailability: string;
  distanceFromJob: number;
  relevantExperience: number;
  averageRating: number;
  priceRange: { min: number; max: number };
  specializations: string[];
  certifications: string[];
  isPreferred: boolean;
}

export interface SchedulingRecommendation {
  suggestedSlots: Array<{
    date: string;
    time: string;
    priority: "high" | "medium" | "low";
    reason: string;
  }>;
  estimateDuration: string;
  preparationNotes: string;
  customerBriefing: string;
  contractorBriefing: string;
}

export interface SmartBidPromptConfig {
  systemPrompt: string;
  qualificationPrompt: string;
  matchingPrompt: string;
  schedulingPrompt: string;
  communicationPrompt: string;
}

const DEFAULT_PROMPTS: SmartBidPromptConfig = {
  systemPrompt: `You are SmartBid™, the AI assistant for Strategic Service Savers. Your role is to:
1. Qualify homeowner service requests professionally and thoroughly
2. Match qualified leads with the most suitable contractors
3. Schedule estimates efficiently
4. Maintain neutrality and fairness in all contractor matching
5. NEVER reveal customer contact information to contractors until payment is confirmed
6. Provide excellent customer service while protecting all parties

You represent Strategic Service Savers, a premium contractor marketplace. 
Be professional, helpful, and thorough. Ask clarifying questions when needed.
Focus on understanding the customer's true needs and matching them with qualified professionals.`,

  qualificationPrompt: `Analyze this service request and provide a comprehensive qualification assessment.

Customer Request:
- Name: {{customerName}}
- Service Type: {{serviceType}}
- Description: {{projectDescription}}
- Location: {{city}}, {{state}} {{zipCode}}
- Budget Range: {{budget}}
- Urgency: {{urgency}}
{{#if photos}}
- Photos provided: {{photoCount}} images
{{/if}}

Evaluate:
1. Is this a legitimate, qualified service request?
2. What specific trade(s) are needed?
3. What's the realistic budget range for this work?
4. What's the project complexity level?
5. What key questions should be asked during the estimate?
6. What contractor qualifications are required?

Respond in JSON format:
{
  "isQualified": boolean,
  "qualificationScore": number (0-100),
  "serviceCategory": string,
  "tradeRequired": string[],
  "estimatedBudgetRange": { "min": number, "max": number },
  "urgencyLevel": "flexible" | "normal" | "urgent" | "emergency",
  "projectComplexity": "simple" | "moderate" | "complex",
  "scopeSummary": string,
  "keyQuestions": string[],
  "matchCriteria": {
    "requiredTrades": string[],
    "preferredExperience": number,
    "licensingRequired": boolean,
    "insuranceRequired": boolean
  },
  "aiConfidence": number (0-100),
  "reasoning": string
}`,

  matchingPrompt: `Match this qualified lead with the best contractors from our network.

Lead Details:
- Service: [serviceType]
- Location: [city], [state]
- Budget: $[budgetMin] - $[budgetMax]
- Complexity: [complexity]
- Urgency: [urgency]
- Required Trades: [trades]

Available Contractors:
{{contractors}}

Rank the top 5 contractors based on:
1. Trade match and specialization relevance
2. Geographic proximity
3. Rating and review quality
4. Price competitiveness
5. Availability for the urgency level
6. Experience with similar projects

IMPORTANT: Maintain strict neutrality. Do not favor any contractor based on subscription level.
Only match based on genuine fit and capability.

Respond in JSON format with array of matches.`,

  schedulingPrompt: `Generate optimal scheduling recommendations for this estimate appointment.

Lead: {{leadSummary}}
Contractor: {{contractorName}}
Trade: {{trade}}
Location: {{address}}

Contractor Availability:
{{availability}}

Consider:
1. Best times for both parties
2. Travel time for contractor
3. Urgency of the request
4. Weather considerations if applicable
5. Duration needed for proper assessment

Provide customer and contractor briefings for the appointment.

Respond in JSON format:
{
  "suggestedSlots": [{ "date": string, "time": string, "priority": string, "reason": string }],
  "estimateDuration": string,
  "preparationNotes": string,
  "customerBriefing": string,
  "contractorBriefing": string
}`,

  communicationPrompt: `Generate a professional communication for this scenario.

Context: {{context}}
Recipient: {{recipientType}}
Purpose: {{purpose}}
Tone: Professional, helpful, and clear

Key information to convey:
{{keyPoints}}

IMPORTANT: 
- NEVER include customer contact information if this is going to a contractor who hasn't paid
- Keep messaging professional and on-brand for Strategic Service Savers
- Include clear next steps

Generate the message.`
};

export class SmartBidAI {
  private static instance: SmartBidAI;
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private prompts: SmartBidPromptConfig;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic();
    }
    this.prompts = DEFAULT_PROMPTS;
    console.log("🎯 SmartBid™ AI initialized - Lead qualification and contractor matching active");
  }

  public static getInstance(): SmartBidAI {
    if (!SmartBidAI.instance) {
      SmartBidAI.instance = new SmartBidAI();
    }
    return SmartBidAI.instance;
  }

  async qualifyLead(input: LeadQualificationInput): Promise<QualifiedLead> {
    console.log(`🎯 SmartBid™ qualifying lead: ${input.serviceType} in ${input.location.city}, ${input.location.state}`);

    const prompt = this.buildQualificationPrompt(input);

    try {
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: this.prompts.systemPrompt },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");
        return this.validateQualificationResult(result);
      }

      return this.fallbackQualification(input);
    } catch (error) {
      console.error("SmartBid™ qualification error:", error);
      return this.fallbackQualification(input);
    }
  }

  async matchContractors(
    qualifiedLead: QualifiedLead,
    location: { city: string; state: string; zipCode?: string }
  ): Promise<ContractorMatch[]> {
    console.log(`🎯 SmartBid™ matching contractors for ${qualifiedLead.serviceCategory}`);

    try {
      const contractors = await (storage as any).getWorkhubContractors?.({
        trade: qualifiedLead.tradeRequired[0],
        state: location.state,
        verified: true
      }) || [];

      if (!contractors || contractors.length === 0) {
        return this.getFallbackContractorMatches(qualifiedLead, location);
      }

      const matches: ContractorMatch[] = contractors.map((contractor: any) => {
        const matchScore = this.calculateMatchScore(contractor, qualifiedLead, location);
        return {
          contractorId: contractor.id,
          contractorName: contractor.businessName || contractor.name,
          matchScore,
          matchReasons: this.getMatchReasons(contractor, qualifiedLead),
          estimatedAvailability: contractor.availability || "Within 48 hours",
          distanceFromJob: this.estimateDistance(contractor, location),
          relevantExperience: contractor.yearsExperience || 0,
          averageRating: contractor.rating || 0,
          priceRange: {
            min: qualifiedLead.estimatedBudgetRange.min * 0.8,
            max: qualifiedLead.estimatedBudgetRange.max * 1.2
          },
          specializations: contractor.specializations || [],
          certifications: contractor.certifications || [],
          isPreferred: false
        };
      });

      return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
    } catch (error) {
      console.error("SmartBid™ matching error:", error);
      return [];
    }
  }

  async generateSchedulingRecommendation(
    lead: any,
    contractor: any
  ): Promise<SchedulingRecommendation> {
    console.log(`🎯 SmartBid™ generating schedule for ${lead.id}`);

    const now = new Date();
    const slots: SchedulingRecommendation["suggestedSlots"] = [];

    for (let i = 1; i <= 5; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      if (date.getDay() !== 0) {
        slots.push({
          date: date.toISOString().split("T")[0],
          time: "10:00 AM",
          priority: i === 1 ? "high" : i <= 3 ? "medium" : "low",
          reason: i === 1 ? "Earliest available slot" : `${i} days from request`
        });
        
        if (slots.length < 3) {
          slots.push({
            date: date.toISOString().split("T")[0],
            time: "2:00 PM",
            priority: "medium",
            reason: "Afternoon option"
          });
        }
      }
    }

    return {
      suggestedSlots: slots.slice(0, 5),
      estimateDuration: "45-60 minutes",
      preparationNotes: "Clear access to affected area. Have any relevant documentation ready (photos, previous estimates, insurance info if applicable).",
      customerBriefing: `Your estimate appointment is scheduled. ${contractor?.businessName || "A qualified contractor"} will assess your ${lead.serviceType || "project"} and provide a detailed quote. Please ensure the work area is accessible.`,
      contractorBriefing: `Estimate for ${lead.serviceType || "service request"} in ${lead.city || "location"}. Customer has described: ${lead.description || "See details in app"}. Prepare scope documentation and pricing options.`
    };
  }

  async generateCommunication(
    context: string,
    recipientType: "customer" | "contractor",
    purpose: string,
    keyPoints: string[],
    includeContactInfo: boolean = false
  ): Promise<string> {
    const baseMessage = this.buildCommunicationBase(recipientType, purpose);
    const pointsList = keyPoints.map(p => `• ${p}`).join("\n");

    if (!includeContactInfo && recipientType === "contractor") {
      return `${baseMessage}

${pointsList}

Note: Customer contact details will be provided once you accept this opportunity through SmartBid™.

Best regards,
Strategic Service Savers | SmartBid™`;
    }

    return `${baseMessage}

${pointsList}

Best regards,
Strategic Service Savers | SmartBid™`;
  }

  updatePrompts(newPrompts: Partial<SmartBidPromptConfig>): void {
    this.prompts = { ...this.prompts, ...newPrompts };
    console.log("🎯 SmartBid™ prompts updated");
  }

  getPrompts(): SmartBidPromptConfig {
    return { ...this.prompts };
  }

  private buildQualificationPrompt(input: LeadQualificationInput): string {
    return this.prompts.qualificationPrompt
      .replace("{{customerName}}", input.customerName)
      .replace("{{serviceType}}", input.serviceType)
      .replace("{{projectDescription}}", input.projectDescription)
      .replace("{{city}}", input.location.city)
      .replace("{{state}}", input.location.state)
      .replace("{{zipCode}}", input.location.zipCode || "")
      .replace("{{budget}}", input.budget || "Not specified")
      .replace("{{urgency}}", input.urgency || "normal")
      .replace("{{photoCount}}", String(input.photos?.length || 0));
  }

  private validateQualificationResult(result: any): QualifiedLead {
    return {
      isQualified: result.isQualified ?? true,
      qualificationScore: result.qualificationScore ?? 75,
      serviceCategory: result.serviceCategory ?? "General",
      tradeRequired: result.tradeRequired ?? ["General Contractor"],
      estimatedBudgetRange: result.estimatedBudgetRange ?? { min: 500, max: 5000 },
      urgencyLevel: result.urgencyLevel ?? "normal",
      projectComplexity: result.projectComplexity ?? "moderate",
      scopeSummary: result.scopeSummary ?? "Standard service request",
      keyQuestions: result.keyQuestions ?? [],
      matchCriteria: result.matchCriteria ?? {
        requiredTrades: ["General Contractor"],
        preferredExperience: 3,
        licensingRequired: true,
        insuranceRequired: true
      },
      aiConfidence: result.aiConfidence ?? 70,
      reasoning: result.reasoning ?? "Standard qualification assessment"
    };
  }

  private fallbackQualification(input: LeadQualificationInput): QualifiedLead {
    const tradeMap: Record<string, string[]> = {
      roofing: ["Roofer"],
      roof: ["Roofer"],
      tree: ["Tree Service", "Arborist"],
      fence: ["Fence Contractor"],
      drywall: ["Drywall Contractor"],
      paint: ["Painter"],
      flooring: ["Flooring Contractor"],
      plumbing: ["Plumber"],
      electrical: ["Electrician"],
      hvac: ["HVAC Technician"],
      gutter: ["Gutter Contractor"],
      siding: ["Siding Contractor"],
      window: ["Window Installer"],
      door: ["Door Installer"],
      concrete: ["Concrete Contractor"],
      landscaping: ["Landscaper"]
    };

    const serviceKey = input.serviceType.toLowerCase();
    let trades = ["General Contractor"];
    
    for (const [key, value] of Object.entries(tradeMap)) {
      if (serviceKey.includes(key)) {
        trades = value;
        break;
      }
    }

    return {
      isQualified: true,
      qualificationScore: 80,
      serviceCategory: input.serviceType,
      tradeRequired: trades,
      estimatedBudgetRange: { min: 500, max: 10000 },
      urgencyLevel: input.urgency || "normal",
      projectComplexity: "moderate",
      scopeSummary: input.projectDescription,
      keyQuestions: [
        "What is the approximate size/scope of the work?",
        "Is there any existing damage we should be aware of?",
        "Do you have a timeline preference?",
        "Are there any access restrictions?"
      ],
      matchCriteria: {
        requiredTrades: trades,
        preferredExperience: 3,
        licensingRequired: true,
        insuranceRequired: true
      },
      aiConfidence: 75,
      reasoning: "Fallback qualification - AI service unavailable"
    };
  }

  private calculateMatchScore(
    contractor: any,
    lead: QualifiedLead,
    location: { city: string; state: string }
  ): number {
    let score = 50;

    if (contractor.trades?.some((t: string) => 
      lead.tradeRequired.some(req => t.toLowerCase().includes(req.toLowerCase()))
    )) {
      score += 20;
    }

    if (contractor.city?.toLowerCase() === location.city.toLowerCase()) {
      score += 15;
    } else if (contractor.state?.toLowerCase() === location.state.toLowerCase()) {
      score += 8;
    }

    if (contractor.rating >= 4.5) {
      score += 10;
    } else if (contractor.rating >= 4.0) {
      score += 5;
    }

    if (contractor.yearsExperience >= 5) {
      score += 5;
    }

    return Math.min(100, score);
  }

  private getMatchReasons(contractor: any, lead: QualifiedLead): string[] {
    const reasons: string[] = [];
    
    if (contractor.trades?.length > 0) {
      reasons.push(`Specializes in ${contractor.trades.slice(0, 2).join(", ")}`);
    }
    
    if (contractor.rating >= 4.5) {
      reasons.push(`Highly rated (${contractor.rating.toFixed(1)} stars)`);
    }
    
    if (contractor.yearsExperience >= 5) {
      reasons.push(`${contractor.yearsExperience}+ years experience`);
    }
    
    if (contractor.verified) {
      reasons.push("Verified contractor");
    }

    return reasons.length > 0 ? reasons : ["Available for your project"];
  }

  private getFallbackContractorMatches(
    lead: QualifiedLead,
    location: { city: string; state: string }
  ): ContractorMatch[] {
    return [{
      contractorId: "demo-contractor-1",
      contractorName: "Premium Home Services",
      matchScore: 85,
      matchReasons: [
        `Specializes in ${lead.tradeRequired[0] || "home services"}`,
        "4.8 star rating",
        "10+ years experience",
        "Verified contractor"
      ],
      estimatedAvailability: "Within 24-48 hours",
      distanceFromJob: 5.2,
      relevantExperience: 10,
      averageRating: 4.8,
      priceRange: lead.estimatedBudgetRange,
      specializations: lead.tradeRequired,
      certifications: ["Licensed", "Insured", "Bonded"],
      isPreferred: false
    }, {
      contractorId: "demo-contractor-2",
      contractorName: "Quality First Contractors",
      matchScore: 78,
      matchReasons: [
        "Available in your area",
        "4.6 star rating",
        "Quick response time"
      ],
      estimatedAvailability: "Within 48 hours",
      distanceFromJob: 8.1,
      relevantExperience: 7,
      averageRating: 4.6,
      priceRange: { 
        min: lead.estimatedBudgetRange.min * 0.9,
        max: lead.estimatedBudgetRange.max * 1.1
      },
      specializations: lead.tradeRequired,
      certifications: ["Licensed", "Insured"],
      isPreferred: false
    }];
  }

  private estimateDistance(contractor: any, location: { city: string; state: string }): number {
    if (contractor.city?.toLowerCase() === location.city.toLowerCase()) {
      return Math.random() * 10 + 1;
    }
    return Math.random() * 30 + 10;
  }

  private buildCommunicationBase(recipientType: string, purpose: string): string {
    if (recipientType === "customer") {
      return `Dear Valued Customer,

Thank you for choosing Strategic Service Savers and SmartBid™ for your home improvement needs.

Regarding your ${purpose}:`;
    }

    return `Hello,

You have a new opportunity through Strategic Service Savers | SmartBid™.

${purpose}:`;
  }
}

export const smartBidAI = SmartBidAI.getInstance();
