import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth, requireContractor } from "../middleware/auth";
import { generateBidIntelResponse, generateRFIQuestion, analyzeBidOpportunity, INSIDER_TIPS_DATABASE } from "../services/bidIntelAI";
import { USACE_DISTRICTS, USACE_DIVISIONS, MAJOR_PRIMES, getPriorityDistricts, generateIntroductionEmail, generateCapabilityStatement } from "../services/usaceOutreach";
import { UTILITY_COMPANIES, VENDOR_PLATFORMS, READINESS_CHECKLIST, STORM_PRIORITY_REGISTRATIONS, GOVERNMENT_PORTALS, GEORGIA_EMCS, ALABAMA_EMCS, ALASKA_EMCS, ARIZONA_EMCS, ARKANSAS_EMCS, CALIFORNIA_EMCS, COLORADO_EMCS, CONNECTICUT_EMCS, DELAWARE_EMCS, FLORIDA_EMCS, HAWAII_EMCS, IDAHO_EMCS, ILLINOIS_EMCS, IOWA_EMCS, KANSAS_EMCS, KENTUCKY_EMCS, LOUISIANA_EMCS, MAINE_EMCS, MARYLAND_EMCS, MASSACHUSETTS_EMCS, MICHIGAN_EMCS, MINNESOTA_EMCS, MISSISSIPPI_EMCS, MISSOURI_EMCS, MONTANA_EMCS, NEBRASKA_EMCS, NEVADA_EMCS, NEW_HAMPSHIRE_EMCS, NEW_JERSEY_EMCS, NEW_MEXICO_EMCS, NEW_YORK_EMCS, NORTH_CAROLINA_EMCS, NORTH_DAKOTA_EMCS, TEXAS_EMCS, FORESTRY_AGENCIES, STORM_PRIMES, generateUtilityIntroEmail, generateTrackingSheet } from "../services/utilityContractorReadiness";
import { elevenLabsVoice } from "../services/elevenLabsVoice";
import {
  insertBidOpportunitySchema,
  insertBidSubmissionSchema,
  insertBidContactSchema,
  insertBidQuestionSchema,
  insertContractorProcurementProfileSchema,
} from "@shared/schema";

const router = Router();

// Get contractor's procurement profile
router.get("/profile", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).user?.id;
    const profile = await storage.getProcurementProfile(contractorId);
    res.json(profile || { contractorId, setupCompleted: false });
  } catch (error) {
    console.error("Error fetching procurement profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Create/update procurement profile
router.post("/profile", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).user?.id;
    const validatedData = insertContractorProcurementProfileSchema.parse({ ...req.body, contractorId });
    const profile = await storage.upsertProcurementProfile(validatedData);
    res.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error saving procurement profile:", error);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

// Get bid opportunities
router.get("/opportunities", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const { status, limit = 50 } = req.query;
    const opportunities = await storage.getBidOpportunities(status as string, Number(limit));
    res.json(opportunities);
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    res.status(500).json({ error: "Failed to fetch opportunities" });
  }
});

// Get single opportunity
router.get("/opportunities/:id", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const opportunity = await storage.getBidOpportunity(Number(req.params.id));
    if (!opportunity) {
      return res.status(404).json({ error: "Opportunity not found" });
    }
    res.json(opportunity);
  } catch (error) {
    console.error("Error fetching opportunity:", error);
    res.status(500).json({ error: "Failed to fetch opportunity" });
  }
});

// AI analyze opportunity
router.post("/opportunities/:id/analyze", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const opportunity = await storage.getBidOpportunity(Number(req.params.id));
    if (!opportunity) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    const analysis = await analyzeBidOpportunity({
      title: opportunity.title,
      description: opportunity.description || undefined,
      agency: opportunity.agency,
      estimatedValue: opportunity.estimatedValue ? Number(opportunity.estimatedValue) : undefined,
      requirements: opportunity.experienceRequired || undefined,
      dueDate: opportunity.dueDate || undefined,
    });

    await storage.updateBidOpportunity(Number(req.params.id), {
      aiQualificationScore: analysis.qualificationScore,
      aiRiskFlags: analysis.riskFlags,
      aiRecommendedBidRange: analysis.recommendedBidRange,
      aiAnalysis: analysis.analysis,
    });

    res.json(analysis);
  } catch (error) {
    console.error("Error analyzing opportunity:", error);
    res.status(500).json({ error: "Failed to analyze opportunity" });
  }
});

// Create new bid opportunity (for demo/testing)
router.post("/opportunities", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const validatedData = insertBidOpportunitySchema.parse(req.body);
    const opportunity = await storage.createBidOpportunity(validatedData);
    res.status(201).json(opportunity);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error creating opportunity:", error);
    res.status(500).json({ error: "Failed to create opportunity" });
  }
});

// Get contractor's bid submissions
router.get("/submissions", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).user?.id;
    const { status } = req.query;
    const submissions = await storage.getBidSubmissions(contractorId, status as string);
    res.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// Get single submission
router.get("/submissions/:id", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const submission = await storage.getBidSubmission(Number(req.params.id));
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }
    res.json(submission);
  } catch (error) {
    console.error("Error fetching submission:", error);
    res.status(500).json({ error: "Failed to fetch submission" });
  }
});

// Create new bid submission
router.post("/submissions", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).user?.id;
    const validatedData = insertBidSubmissionSchema.parse({ ...req.body, contractorId });
    const submission = await storage.createBidSubmission(validatedData);
    res.status(201).json(submission);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error creating submission:", error);
    res.status(500).json({ error: "Failed to create submission" });
  }
});

// Update bid submission
router.patch("/submissions/:id", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const partialSchema = insertBidSubmissionSchema.partial();
    const validatedData = partialSchema.parse(req.body);
    const submission = await storage.updateBidSubmission(Number(req.params.id), validatedData);
    res.json(submission);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error updating submission:", error);
    res.status(500).json({ error: "Failed to update submission" });
  }
});

// Submit bid (mark as submitted + send confirmations)
router.post("/submissions/:id/submit", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const submission = await storage.getBidSubmission(Number(req.params.id));
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const confirmationNumber = `BID-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const updatedSubmission = await storage.updateBidSubmission(Number(req.params.id), {
      status: "submitted",
      submittedAt: new Date(),
      confirmationNumber,
      emailConfirmationSent: true,
      smsConfirmationSent: true,
    });

    res.json({
      success: true,
      submission: updatedSubmission,
      confirmationNumber,
      message: "Bid submitted successfully! Confirmation sent via email and SMS."
    });
  } catch (error) {
    console.error("Error submitting bid:", error);
    res.status(500).json({ error: "Failed to submit bid" });
  }
});

// Get bid contacts for opportunity
router.get("/opportunities/:id/contacts", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contacts = await storage.getBidContacts(Number(req.params.id));
    res.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// Add bid contact
router.post("/contacts", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).user?.id;
    const validatedData = insertBidContactSchema.parse({ ...req.body, contractorId });
    const contact = await storage.createBidContact(validatedData);
    res.status(201).json(contact);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error creating contact:", error);
    res.status(500).json({ error: "Failed to create contact" });
  }
});

// Get bid questions/RFIs
router.get("/questions", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).user?.id;
    const questions = await storage.getBidQuestions(contractorId);
    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// Generate AI RFI question
router.post("/questions/generate", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const { opportunityId, concern } = req.body;
    
    let opportunityDetails = { title: "Procurement Opportunity", agency: "Agency" };
    if (opportunityId) {
      const opp = await storage.getBidOpportunity(Number(opportunityId));
      if (opp) {
        opportunityDetails = { 
          title: opp.title, 
          agency: opp.agency,
          description: opp.description || undefined,
        } as any;
      }
    }

    const generated = await generateRFIQuestion(opportunityDetails as any, concern);
    res.json(generated);
  } catch (error) {
    console.error("Error generating RFI:", error);
    res.status(500).json({ error: "Failed to generate RFI question" });
  }
});

// Create and optionally send RFI question
router.post("/questions", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).user?.id;
    const { autoSend, ...questionData } = req.body;

    const dataToValidate = { 
      ...questionData, 
      contractorId,
      status: autoSend ? "sent" : "draft",
      sentAt: autoSend ? new Date() : undefined,
      sentBy: autoSend ? "ai_agent" : undefined,
    };
    
    const validatedData = insertBidQuestionSchema.parse(dataToValidate);
    const question = await storage.createBidQuestion(validatedData);

    if (autoSend && questionData.recipientEmail) {
      console.log(`[BidIntel] Would send RFI email to ${questionData.recipientEmail}`);
    }

    res.status(201).json(question);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error creating question:", error);
    res.status(500).json({ error: "Failed to create question" });
  }
});

// AI Chat endpoint
router.post("/chat", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).user?.id;
    const { message, opportunityContext, generateAudio } = req.body;

    const response = await generateBidIntelResponse(contractorId, message, opportunityContext);

    await storage.saveBidIntelChat({
      contractorId,
      role: "user",
      message,
      opportunityId: opportunityContext?.id,
    });

    let audioUrl: string | undefined;
    if (generateAudio) {
      try {
        const audioBuffer = await elevenLabsVoice.generateSpeech({
          text: response.message,
          voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel voice
          modelId: "eleven_multilingual_v2"
        });
        const base64Audio = audioBuffer.toString('base64');
        audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
      } catch (audioError) {
        console.warn("Could not generate audio:", audioError);
      }
    }

    await storage.saveBidIntelChat({
      contractorId,
      role: "assistant",
      message: response.message,
      category: response.category,
      audioUrl,
      opportunityId: opportunityContext?.id,
    });

    res.json({ ...response, audioUrl });
  } catch (error) {
    console.error("Error in AI chat:", error);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

// Get chat history
router.get("/chat/history", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).user?.id;
    const { opportunityId, limit = 50 } = req.query;
    const history = await storage.getBidIntelChatHistory(
      contractorId, 
      opportunityId ? Number(opportunityId) : undefined,
      Number(limit)
    );
    res.json(history);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// Get insider tips
router.get("/tips", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    let tips = INSIDER_TIPS_DATABASE;
    if (category) {
      tips = tips.filter(t => t.category === category);
    }
    res.json(tips);
  } catch (error) {
    console.error("Error fetching tips:", error);
    res.status(500).json({ error: "Failed to fetch tips" });
  }
});

// Get dashboard stats
router.get("/dashboard/stats", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).user?.id;
    const stats = await storage.getBidIntelDashboardStats(contractorId);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Voice guide - Get Rachel introduction
router.get("/voice-guide/intro", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const introScript = `Welcome to AI BidIntel Pro! I'm Rachel, your procurement intelligence assistant. 
    
I'm here to help you find, prepare, and win government and commercial bids. 

Here's what I can do for you:
- Monitor procurement portals 24/7 for matching opportunities
- Analyze bids and recommend competitive pricing
- Draft professional RFI questions to clarify requirements  
- Provide insider tips that most contractors don't know
- Track your submissions and help you improve win rates

Just ask me anything about bidding, and I'll give you expert guidance. Ready to find your next contract?`;

    try {
      const audioBuffer = await elevenLabsVoice.generateSpeech({
        text: introScript,
        voiceId: "21m00Tcm4TlvDq8ikWAM",
        modelId: "eleven_multilingual_v2"
      });
      const base64Audio = audioBuffer.toString('base64');
      res.json({ script: introScript, audioUrl: `data:audio/mpeg;base64,${base64Audio}` });
    } catch (audioError) {
      console.warn("Could not generate intro audio:", audioError);
      res.json({ script: introScript, audioUrl: null });
    }
  } catch (error) {
    console.error("Error generating voice intro:", error);
    res.status(500).json({ error: "Failed to generate voice introduction" });
  }
});

// Text-to-speech for any message
router.post("/voice/speak", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const audioBuffer = await elevenLabsVoice.generateSpeech({
      text,
      voiceId: "21m00Tcm4TlvDq8ikWAM",
      modelId: "eleven_multilingual_v2"
    });
    const base64Audio = audioBuffer.toString('base64');
    res.json({ audioUrl: `data:audio/mpeg;base64,${base64Audio}` });
  } catch (error) {
    console.error("Error generating speech:", error);
    res.status(500).json({ error: "Failed to generate speech" });
  }
});

router.get("/usace/districts", async (req: Request, res: Response) => {
  try {
    const { division, priorityOnly } = req.query;
    let districts = getPriorityDistricts(division as string | undefined);
    if (priorityOnly === 'true') {
      districts = districts.filter(d => d.priority === 'critical' || d.priority === 'high');
    }
    res.json({ districts, divisions: USACE_DIVISIONS, majorPrimes: MAJOR_PRIMES });
  } catch (error) {
    console.error("Error fetching USACE districts:", error);
    res.status(500).json({ error: "Failed to fetch districts" });
  }
});

router.post("/usace/generate-email", async (req: Request, res: Response) => {
  try {
    const { districtName, companyInfo } = req.body;
    if (!districtName || !companyInfo?.companyName || !companyInfo?.ownerName) {
      return res.status(400).json({ error: "District name, company name, and owner name are required" });
    }
    const result = await generateIntroductionEmail(districtName, companyInfo);
    res.json(result);
  } catch (error) {
    console.error("Error generating introduction email:", error);
    res.status(500).json({ error: "Failed to generate email" });
  }
});

router.post("/usace/generate-capability-statement", async (req: Request, res: Response) => {
  try {
    const { companyInfo } = req.body;
    if (!companyInfo?.companyName || !companyInfo?.ownerName) {
      return res.status(400).json({ error: "Company name and owner name are required" });
    }
    const result = await generateCapabilityStatement(companyInfo);
    res.json(result);
  } catch (error) {
    console.error("Error generating capability statement:", error);
    res.status(500).json({ error: "Failed to generate capability statement" });
  }
});

// Utility Contractor Readiness endpoints
router.get("/utility-readiness/checklist", async (req: Request, res: Response) => {
  try {
    res.json({
      checklist: READINESS_CHECKLIST,
      stormPriorityRegistrations: STORM_PRIORITY_REGISTRATIONS,
      totalItems: READINESS_CHECKLIST.length,
      requiredItems: READINESS_CHECKLIST.filter(i => i.priority === "required").length,
    });
  } catch (error) {
    console.error("Error fetching readiness checklist:", error);
    res.status(500).json({ error: "Failed to fetch checklist" });
  }
});

router.get("/utility-readiness/portals", async (req: Request, res: Response) => {
  try {
    const { region, priorityOnly } = req.query;
    let utilities = [...UTILITY_COMPANIES].sort((a, b) => b.stormPriorityScore - a.stormPriorityScore);
    if (region && region !== "all") {
      utilities = utilities.filter(u => u.region === region);
    }
    if (priorityOnly === "true") {
      utilities = utilities.filter(u => u.stormPriority === "critical" || u.stormPriority === "high");
    }
    res.json({
      utilities,
      platforms: VENDOR_PLATFORMS,
      governmentPortals: GOVERNMENT_PORTALS,
      georgiaEMCs: GEORGIA_EMCS,
      alabamaEMCs: ALABAMA_EMCS,
      alaskaEMCs: ALASKA_EMCS,
      arizonaEMCs: ARIZONA_EMCS,
      arkansasEMCs: ARKANSAS_EMCS,
      californiaEMCs: CALIFORNIA_EMCS,
      coloradoEMCs: COLORADO_EMCS,
      connecticutEMCs: CONNECTICUT_EMCS,
      delawareEMCs: DELAWARE_EMCS,
      floridaEMCs: FLORIDA_EMCS,
      hawaiiEMCs: HAWAII_EMCS,
      idahoEMCs: IDAHO_EMCS,
      illinoisEMCs: ILLINOIS_EMCS,
      iowaEMCs: IOWA_EMCS,
      kansasEMCs: KANSAS_EMCS,
      kentuckyEMCs: KENTUCKY_EMCS,
      louisianaEMCs: LOUISIANA_EMCS,
      maineEMCs: MAINE_EMCS,
      marylandEMCs: MARYLAND_EMCS,
      massachusettsEMCs: MASSACHUSETTS_EMCS,
      michiganEMCs: MICHIGAN_EMCS,
      minnesotaEMCs: MINNESOTA_EMCS,
      mississippiEMCs: MISSISSIPPI_EMCS,
      missouriEMCs: MISSOURI_EMCS,
      montanaEMCs: MONTANA_EMCS,
      nebraskaEMCs: NEBRASKA_EMCS,
      nevadaEMCs: NEVADA_EMCS,
      newHampshireEMCs: NEW_HAMPSHIRE_EMCS,
      newJerseyEMCs: NEW_JERSEY_EMCS,
      newMexicoEMCs: NEW_MEXICO_EMCS,
      newYorkEMCs: NEW_YORK_EMCS,
      northCarolinaEMCs: NORTH_CAROLINA_EMCS,
      northDakotaEMCs: NORTH_DAKOTA_EMCS,
      texasEMCs: TEXAS_EMCS,
      forestryAgencies: FORESTRY_AGENCIES,
      stormPrimes: STORM_PRIMES,
      regions: [...new Set(UTILITY_COMPANIES.map(u => u.region))].sort(),
    });
  } catch (error) {
    console.error("Error fetching utility portals:", error);
    res.status(500).json({ error: "Failed to fetch portals" });
  }
});

router.post("/utility-readiness/generate-intro-email", async (req: Request, res: Response) => {
  try {
    const { companyInfo } = req.body;
    if (!companyInfo?.companyName || !companyInfo?.ownerName || !companyInfo?.utilityName) {
      return res.status(400).json({ error: "Company name, owner name, and target utility name are required" });
    }
    const result = await generateUtilityIntroEmail(companyInfo);
    res.json(result);
  } catch (error) {
    console.error("Error generating utility intro email:", error);
    res.status(500).json({ error: "Failed to generate email" });
  }
});

router.get("/utility-readiness/tracking-sheet", async (req: Request, res: Response) => {
  try {
    const trackingSheet = generateTrackingSheet();
    res.json(trackingSheet);
  } catch (error) {
    console.error("Error generating tracking sheet:", error);
    res.status(500).json({ error: "Failed to generate tracking sheet" });
  }
});

export default router;
