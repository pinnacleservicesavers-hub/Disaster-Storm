import { Router, Request, Response } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { storage } from "../storage";
import { smartBidAI, LeadQualificationInput } from "../services/smartBidAI";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'));
    }
  }
});

const contractorRegisterFields = upload.fields([
  { name: 'licenseDocument', maxCount: 1 },
  { name: 'insuranceDocument', maxCount: 1 },
  { name: 'businessDocument', maxCount: 1 },
  { name: 'nonprofitDocument', maxCount: 1 }
]);

// ===== CONTRACTOR REGISTRATION WITH FILE UPLOADS =====

router.post("/contractors/register", contractorRegisterFields, async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    const contractorData = {
      businessName: req.body.businessName,
      ownerName: req.body.ownerName,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address || '',
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      website: req.body.website || '',
      trades: JSON.parse(req.body.trades || '[]'),
      yearsInBusiness: parseInt(req.body.yearsInBusiness) || 0,
      employeeCount: req.body.employeeCount || '',
      licenseNumber: req.body.licenseNumber || '',
      licenseState: req.body.licenseState || '',
      insuranceProvider: req.body.insuranceProvider || '',
      insurancePolicy: req.body.insurancePolicy || '',
      insuranceExpiry: req.body.insuranceExpiry || '',
      serviceZipCodes: JSON.parse(req.body.serviceZipCodes || '[]'),
      serviceRadius: parseInt(req.body.serviceRadius) || 25,
      subscriptionTier: req.body.subscriptionTier || 'starter',
      isNonprofit: req.body.isNonprofit === 'true',
      nonprofitEIN: req.body.nonprofitEIN || '',
      status: 'pending_verification',
      hasLicenseDocument: !!(files?.licenseDocument?.length),
      hasInsuranceDocument: !!(files?.insuranceDocument?.length),
      hasBusinessDocument: !!(files?.businessDocument?.length),
      hasNonprofitDocument: !!(files?.nonprofitDocument?.length),
    };

    const contractor = await storage.createWorkhubContractor(contractorData);
    res.status(201).json({ 
      success: true, 
      contractor,
      message: 'Registration submitted successfully. Your credentials are pending verification.'
    });
  } catch (error) {
    console.error('Contractor registration error:', error);
    res.status(500).json({ error: "Failed to register contractor" });
  }
});

// ===== WORKHUB CONTRACTORS =====

router.get("/contractors", async (req: Request, res: Response) => {
  try {
    const { trade, city, state, zipCode, verified } = req.query;
    const contractors = await storage.getWorkhubContractors({
      trade: trade as string,
      city: city as string,
      state: state as string,
      zipCode: zipCode as string,
      verified: verified === "true"
    });
    res.json(contractors);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contractors" });
  }
});

router.get("/contractors/:id", async (req: Request, res: Response) => {
  try {
    const contractor = await storage.getWorkhubContractor(req.params.id);
    if (!contractor) {
      return res.status(404).json({ error: "Contractor not found" });
    }
    res.json(contractor);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contractor" });
  }
});

router.post("/contractors", async (req: Request, res: Response) => {
  try {
    const contractor = await storage.createWorkhubContractor(req.body);
    res.status(201).json(contractor);
  } catch (error) {
    res.status(500).json({ error: "Failed to create contractor" });
  }
});

router.patch("/contractors/:id", async (req: Request, res: Response) => {
  try {
    const contractor = await storage.updateWorkhubContractor(req.params.id, req.body);
    res.json(contractor);
  } catch (error) {
    res.status(500).json({ error: "Failed to update contractor" });
  }
});

// ===== WORKHUB CUSTOMERS =====

router.get("/customers/:id", async (req: Request, res: Response) => {
  try {
    const customer = await storage.getWorkhubCustomer(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

router.post("/customers", async (req: Request, res: Response) => {
  try {
    const customer = await storage.createWorkhubCustomer(req.body);
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// ===== WORKHUB PROJECTS =====

router.get("/projects", async (req: Request, res: Response) => {
  try {
    const { contractorId, customerId, status } = req.query;
    const projects = await storage.getWorkhubProjects({
      contractorId: contractorId as string,
      customerId: customerId as string,
      status: status as string
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.get("/projects/:id", async (req: Request, res: Response) => {
  try {
    const project = await storage.getWorkhubProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

router.post("/projects", async (req: Request, res: Response) => {
  try {
    const project = await storage.createWorkhubProject(req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: "Failed to create project" });
  }
});

router.patch("/projects/:id", async (req: Request, res: Response) => {
  try {
    const project = await storage.updateWorkhubProject(req.params.id, req.body);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: "Failed to update project" });
  }
});

router.patch("/projects/:id/status", async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const project = await storage.updateWorkhubProjectStatus(req.params.id, status);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: "Failed to update project status" });
  }
});

// ===== WORKHUB REVIEWS =====

router.get("/reviews", async (req: Request, res: Response) => {
  try {
    const { contractorId, projectId } = req.query;
    const reviews = await storage.getWorkhubReviews({
      contractorId: contractorId as string,
      projectId: projectId as string
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.post("/reviews", async (req: Request, res: Response) => {
  try {
    const review = await storage.createWorkhubReview(req.body);
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: "Failed to create review" });
  }
});

router.post("/reviews/:id/respond", async (req: Request, res: Response) => {
  try {
    const { response } = req.body;
    const review = await storage.respondToWorkhubReview(req.params.id, response);
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: "Failed to respond to review" });
  }
});

// ===== WORKHUB INVOICES =====

router.get("/invoices", async (req: Request, res: Response) => {
  try {
    const { contractorId, customerId, status } = req.query;
    const invoices = await storage.getWorkhubInvoices({
      contractorId: contractorId as string,
      customerId: customerId as string,
      status: status as string
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

router.post("/invoices", async (req: Request, res: Response) => {
  try {
    const invoice = await storage.createWorkhubInvoice(req.body);
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

router.post("/invoices/:id/send", async (req: Request, res: Response) => {
  try {
    const invoice = await storage.sendWorkhubInvoice(req.params.id);
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Failed to send invoice" });
  }
});

// ===== WORKHUB PRICING TIERS =====

router.get("/pricing", async (req: Request, res: Response) => {
  try {
    const tiers = await storage.getWorkhubPricingTiers();
    res.json(tiers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pricing tiers" });
  }
});

// ===== WORKHUB SUBSCRIPTIONS =====

router.get("/subscriptions/:contractorId", async (req: Request, res: Response) => {
  try {
    const subscription = await storage.getWorkhubSubscription(req.params.contractorId);
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

router.post("/subscriptions", async (req: Request, res: Response) => {
  try {
    const subscription = await storage.createWorkhubSubscription(req.body);
    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

// ===== WORKHUB AGENT SCRIPTS =====

router.get("/agent-scripts", async (req: Request, res: Response) => {
  try {
    const { agentType, category } = req.query;
    const scripts = await storage.getWorkhubAgentScripts({
      agentType: agentType as string,
      category: category as string
    });
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch agent scripts" });
  }
});

router.get("/agent-scripts/:id", async (req: Request, res: Response) => {
  try {
    const script = await storage.getWorkhubAgentScript(req.params.id);
    if (!script) {
      return res.status(404).json({ error: "Script not found" });
    }
    res.json(script);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch script" });
  }
});

// ===== WORKHUB LEGAL DOCUMENTS =====

router.get("/legal", async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const docs = await storage.getWorkhubLegalDocuments(type as string);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch legal documents" });
  }
});

router.get("/legal/:type/current", async (req: Request, res: Response) => {
  try {
    const doc = await storage.getCurrentWorkhubLegalDocument(req.params.type);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

router.post("/legal/accept", async (req: Request, res: Response) => {
  try {
    const { documentId, userType, userId, ipAddress, userAgent } = req.body;
    const acceptance = await storage.acceptWorkhubLegalDocument({
      documentId,
      userType,
      userId,
      ipAddress,
      userAgent,
      acceptedAt: new Date()
    });
    res.status(201).json(acceptance);
  } catch (error) {
    res.status(500).json({ error: "Failed to record acceptance" });
  }
});

// ===== AI ANALYSIS ENDPOINTS =====

router.post("/ai/scopesnap", async (req: Request, res: Response) => {
  try {
    const { images, description } = req.body;
    const analysis = {
      detectedIssues: [
        "Water stain on ceiling indicating possible roof leak",
        "Damaged shingle visible in photo 2",
        "Gutter appears to be detached"
      ],
      recommendedTrades: ["roofing", "gutter repair"],
      estimatedComplexity: "moderate",
      estimatedDuration: "2-4 hours",
      aiConfidence: 0.87,
      suggestedQuestions: [
        "How long has the water stain been visible?",
        "When was the roof last inspected?",
        "Have you noticed any leaks during rain?"
      ]
    };
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: "AI analysis failed" });
  }
});

router.post("/ai/pricewhisperer", async (req: Request, res: Response) => {
  try {
    const { tradeType, scopeDetails, zipCode } = req.body;
    const priceRange = {
      low: 850,
      mid: 1250,
      high: 1800,
      marketAverage: 1150,
      confidence: "high",
      factors: [
        "Regional labor rates",
        "Material costs",
        "Project complexity",
        "Seasonal demand"
      ],
      comparison: {
        vsMarket: "+8% above average",
        reason: "Higher complexity due to steep roof pitch"
      }
    };
    res.json(priceRange);
  } catch (error) {
    res.status(500).json({ error: "Price analysis failed" });
  }
});

router.post("/ai/contractormatch", async (req: Request, res: Response) => {
  try {
    const { tradeType, zipCode, urgency, budget } = req.body;
    const matches = [
      {
        contractorId: "demo-contractor-1",
        businessName: "Smith Roofing Co.",
        matchScore: 95,
        fairnessScore: 88,
        rating: 4.8,
        reviewCount: 127,
        estimatedResponseTime: "15 minutes",
        availability: "Available this week",
        matchReasons: [
          "Specializes in your project type",
          "Excellent reviews for similar work",
          "Within your budget range"
        ]
      },
      {
        contractorId: "demo-contractor-2",
        businessName: "ABC Home Services",
        matchScore: 88,
        fairnessScore: 92,
        rating: 4.6,
        reviewCount: 84,
        estimatedResponseTime: "30 minutes",
        availability: "Next available: Monday",
        matchReasons: [
          "Top-rated in your area",
          "Verified and insured",
          "Offers financing"
        ]
      }
    ];
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: "Contractor matching failed" });
  }
});

// ===== WORKHUB LEADS CRM =====

// Pipeline stages configuration
const LEAD_STAGES = [
  { id: "new_lead", label: "New Lead", color: "#3B82F6" },
  { id: "contacted", label: "Contacted", color: "#8B5CF6" },
  { id: "estimate_scheduled", label: "Estimate Scheduled", color: "#F59E0B" },
  { id: "estimate_completed", label: "Estimate Completed", color: "#10B981" },
  { id: "closing", label: "Closing", color: "#EC4899" },
  { id: "job_scheduled", label: "Job Scheduled", color: "#6366F1" },
  { id: "job_completed", label: "Job Completed", color: "#22C55E" },
  { id: "lost", label: "Lost", color: "#EF4444" }
];

// Get all leads with filtering
router.get("/leads", async (req: Request, res: Response) => {
  try {
    const { stage, serviceType, contractorId, source, priority, search } = req.query;
    const leads = await storage.getWorkhubLeads({
      stage: stage as string,
      serviceType: serviceType as string,
      contractorId: contractorId as string,
      source: source as string,
      priority: priority as string,
      search: search as string
    });
    res.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// Get pipeline stages configuration
router.get("/leads/stages", async (req: Request, res: Response) => {
  res.json(LEAD_STAGES);
});

// Get leads grouped by stage for Kanban view
router.get("/leads/pipeline", async (req: Request, res: Response) => {
  try {
    const { contractorId, serviceType } = req.query;
    const leads = await storage.getWorkhubLeads({
      contractorId: contractorId as string,
      serviceType: serviceType as string
    });
    
    // Group leads by stage
    const pipeline: Record<string, any[]> = {};
    LEAD_STAGES.forEach(stage => {
      pipeline[stage.id] = leads.filter((lead: any) => lead.stage === stage.id);
    });
    
    // Calculate pipeline metrics
    const metrics = {
      totalLeads: leads.length,
      newLeads: pipeline.new_lead.length,
      activeLeads: leads.filter((l: any) => !["job_completed", "lost"].includes(l.stage)).length,
      wonLeads: pipeline.job_completed.length,
      lostLeads: pipeline.lost.length,
      totalPotentialValue: leads
        .filter((l: any) => !["job_completed", "lost"].includes(l.stage))
        .reduce((sum: number, l: any) => sum + (parseFloat(l.estimatedAmount) || 0), 0),
      totalWonValue: leads
        .filter((l: any) => l.stage === "job_completed")
        .reduce((sum: number, l: any) => sum + (parseFloat(l.finalAmount) || parseFloat(l.estimatedAmount) || 0), 0),
      conversionRate: leads.length > 0 
        ? ((pipeline.job_completed.length / leads.length) * 100).toFixed(1) 
        : "0"
    };
    
    res.json({ stages: LEAD_STAGES, pipeline, metrics });
  } catch (error) {
    console.error("Error fetching pipeline:", error);
    res.status(500).json({ error: "Failed to fetch pipeline" });
  }
});

// Get single lead with full details
router.get("/leads/:id", async (req: Request, res: Response) => {
  try {
    const lead = await storage.getWorkhubLead(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    // Get related data
    const [communications, notes, stageHistory, quotes] = await Promise.all([
      storage.getWorkhubCommunicationLogs(req.params.id),
      storage.getWorkhubLeadNotes(req.params.id),
      storage.getWorkhubLeadStageHistory(req.params.id),
      storage.getWorkhubLeadQuotes(req.params.id)
    ]);
    
    res.json({
      ...lead,
      communications,
      notes,
      stageHistory,
      quotes
    });
  } catch (error) {
    console.error("Error fetching lead:", error);
    res.status(500).json({ error: "Failed to fetch lead" });
  }
});

// Create new lead
router.post("/leads", async (req: Request, res: Response) => {
  try {
    const lead = await storage.createWorkhubLead(req.body);
    
    // Log initial stage
    await storage.createWorkhubLeadStageHistory({
      leadId: lead.id,
      fromStage: null,
      toStage: req.body.stage || "new_lead",
      changedBy: req.body.createdBy || "system"
    });
    
    res.status(201).json(lead);
  } catch (error) {
    console.error("Error creating lead:", error);
    res.status(500).json({ error: "Failed to create lead" });
  }
});

// Update lead
router.patch("/leads/:id", async (req: Request, res: Response) => {
  try {
    const existingLead = await storage.getWorkhubLead(req.params.id);
    if (!existingLead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    const lead = await storage.updateWorkhubLead(req.params.id, {
      ...req.body,
      updatedAt: new Date()
    });
    
    res.json(lead);
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

// Update lead stage (with history tracking)
router.patch("/leads/:id/stage", async (req: Request, res: Response) => {
  try {
    const { stage, notes, changedBy } = req.body;
    
    const existingLead = await storage.getWorkhubLead(req.params.id);
    if (!existingLead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    // Calculate time in previous stage
    const lastStageChange = await storage.getLatestStageHistory(req.params.id);
    const timeInPreviousStage = lastStageChange 
      ? Math.floor((Date.now() - new Date(lastStageChange.createdAt).getTime()) / 1000)
      : null;
    
    // Create stage history entry
    await storage.createWorkhubLeadStageHistory({
      leadId: req.params.id,
      fromStage: existingLead.stage,
      toStage: stage,
      changedBy: changedBy || "user",
      notes,
      timeInPreviousStage
    });
    
    // Update lead stage
    const updateData: any = { stage, updatedAt: new Date() };
    
    // If marking as lost, set lostAt
    if (stage === "lost") {
      updateData.lostAt = new Date();
    }
    
    // If marking as completed, set completedDate
    if (stage === "job_completed") {
      updateData.completedDate = new Date();
    }
    
    const lead = await storage.updateWorkhubLead(req.params.id, updateData);
    
    res.json(lead);
  } catch (error) {
    console.error("Error updating lead stage:", error);
    res.status(500).json({ error: "Failed to update lead stage" });
  }
});

// Mark lead as lost
router.post("/leads/:id/lost", async (req: Request, res: Response) => {
  try {
    const { lostReason, lostNotes, changedBy } = req.body;
    
    const existingLead = await storage.getWorkhubLead(req.params.id);
    if (!existingLead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    // Create stage history entry
    await storage.createWorkhubLeadStageHistory({
      leadId: req.params.id,
      fromStage: existingLead.stage,
      toStage: "lost",
      changedBy: changedBy || "user",
      notes: lostNotes
    });
    
    // Update lead
    const lead = await storage.updateWorkhubLead(req.params.id, {
      stage: "lost",
      lostReason,
      lostNotes,
      lostAt: new Date(),
      updatedAt: new Date()
    });
    
    res.json(lead);
  } catch (error) {
    console.error("Error marking lead as lost:", error);
    res.status(500).json({ error: "Failed to mark lead as lost" });
  }
});

// Reactivate lost lead
router.post("/leads/:id/reactivate", async (req: Request, res: Response) => {
  try {
    const { stage, notes, changedBy } = req.body;
    
    const existingLead = await storage.getWorkhubLead(req.params.id);
    if (!existingLead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    // Create stage history entry
    await storage.createWorkhubLeadStageHistory({
      leadId: req.params.id,
      fromStage: "lost",
      toStage: stage || "new_lead",
      changedBy: changedBy || "user",
      notes: notes || "Lead reactivated"
    });
    
    // Update lead
    const lead = await storage.updateWorkhubLead(req.params.id, {
      stage: stage || "new_lead",
      lostReason: null,
      lostNotes: null,
      lostAt: null,
      updatedAt: new Date()
    });
    
    res.json(lead);
  } catch (error) {
    console.error("Error reactivating lead:", error);
    res.status(500).json({ error: "Failed to reactivate lead" });
  }
});

// ===== COMMUNICATION LOGS =====

// Get communication logs for a lead
router.get("/leads/:id/communications", async (req: Request, res: Response) => {
  try {
    const logs = await storage.getWorkhubCommunicationLogs(req.params.id);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching communication logs:", error);
    res.status(500).json({ error: "Failed to fetch communication logs" });
  }
});

// Add communication log
router.post("/leads/:id/communications", async (req: Request, res: Response) => {
  try {
    const log = await storage.createWorkhubCommunicationLog({
      ...req.body,
      leadId: req.params.id
    });
    res.status(201).json(log);
  } catch (error) {
    console.error("Error creating communication log:", error);
    res.status(500).json({ error: "Failed to create communication log" });
  }
});

// ===== LEAD NOTES =====

// Get notes for a lead
router.get("/leads/:id/notes", async (req: Request, res: Response) => {
  try {
    const notes = await storage.getWorkhubLeadNotes(req.params.id);
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// Add note to lead
router.post("/leads/:id/notes", async (req: Request, res: Response) => {
  try {
    const note = await storage.createWorkhubLeadNote({
      ...req.body,
      leadId: req.params.id
    });
    res.status(201).json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// Delete note
router.delete("/leads/:id/notes/:noteId", async (req: Request, res: Response) => {
  try {
    await storage.deleteWorkhubLeadNote(req.params.noteId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// ===== LEAD QUOTES =====

// Get quotes for a lead
router.get("/leads/:id/quotes", async (req: Request, res: Response) => {
  try {
    const quotes = await storage.getWorkhubLeadQuotes(req.params.id);
    res.json(quotes);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
});

// Create quote for lead
router.post("/leads/:id/quotes", async (req: Request, res: Response) => {
  try {
    // Generate quote number
    const quoteNumber = `WH-${Date.now().toString(36).toUpperCase()}`;
    
    const quote = await storage.createWorkhubLeadQuote({
      ...req.body,
      leadId: req.params.id,
      quoteNumber
    });
    res.status(201).json(quote);
  } catch (error) {
    console.error("Error creating quote:", error);
    res.status(500).json({ error: "Failed to create quote" });
  }
});

// Update quote
router.patch("/leads/:leadId/quotes/:quoteId", async (req: Request, res: Response) => {
  try {
    const quote = await storage.updateWorkhubLeadQuote(req.params.quoteId, {
      ...req.body,
      updatedAt: new Date()
    });
    res.json(quote);
  } catch (error) {
    console.error("Error updating quote:", error);
    res.status(500).json({ error: "Failed to update quote" });
  }
});

// ===== LOST REASONS =====

// Get all lost reasons
router.get("/lost-reasons", async (req: Request, res: Response) => {
  try {
    const reasons = await storage.getWorkhubLostReasons();
    res.json(reasons);
  } catch (error) {
    console.error("Error fetching lost reasons:", error);
    res.status(500).json({ error: "Failed to fetch lost reasons" });
  }
});

// ===== PIPELINE ANALYTICS =====

// Get pipeline analytics
router.get("/leads/analytics/summary", async (req: Request, res: Response) => {
  try {
    const { contractorId, startDate, endDate } = req.query;
    const analytics = await storage.getWorkhubLeadAnalytics({
      contractorId: contractorId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Get lost job report
router.get("/leads/analytics/lost", async (req: Request, res: Response) => {
  try {
    const { contractorId, startDate, endDate } = req.query;
    const report = await storage.getWorkhubLostLeadReport({
      contractorId: contractorId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });
    res.json(report);
  } catch (error) {
    console.error("Error fetching lost job report:", error);
    res.status(500).json({ error: "Failed to fetch lost job report" });
  }
});

// ===== SMARTBID™ AI ROUTES =====

const qualificationSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  projectDescription: z.string().min(10, "Please provide more details about your project"),
  serviceType: z.string().min(1, "Service type is required"),
  location: z.object({
    city: z.string().min(1, "City is required"),
    state: z.string().min(2, "State is required"),
    zipCode: z.string().optional()
  }),
  budget: z.string().optional(),
  urgency: z.enum(["flexible", "normal", "urgent", "emergency"]).optional(),
  photos: z.array(z.string()).optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional()
});

router.post("/smartbid/qualify", async (req: Request, res: Response) => {
  try {
    const validated = qualificationSchema.parse(req.body);
    const qualification = await smartBidAI.qualifyLead(validated as LeadQualificationInput);
    res.json({
      success: true,
      qualification,
      message: qualification.isQualified 
        ? "Your request has been qualified. We're finding the best contractors for you."
        : "We need more information to process your request."
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors
      });
    }
    console.error("SmartBid qualification error:", error);
    res.status(500).json({ success: false, error: "Failed to qualify lead" });
  }
});

router.post("/smartbid/match", async (req: Request, res: Response) => {
  try {
    const { qualifiedLead, location } = req.body;
    
    if (!qualifiedLead || !location) {
      return res.status(400).json({
        success: false,
        error: "Qualified lead and location are required"
      });
    }
    
    const matches = await smartBidAI.matchContractors(qualifiedLead, location);
    
    const secureMatches = matches.map(match => ({
      ...match,
      contactInfo: null
    }));
    
    res.json({
      success: true,
      matches: secureMatches,
      matchCount: matches.length,
      message: matches.length > 0 
        ? `Found ${matches.length} qualified contractors for your project.`
        : "No contractors currently available. We'll notify you when matches are found."
    });
  } catch (error) {
    console.error("SmartBid matching error:", error);
    res.status(500).json({ success: false, error: "Failed to match contractors" });
  }
});

router.post("/smartbid/schedule", async (req: Request, res: Response) => {
  try {
    const { lead, contractor } = req.body;
    
    if (!lead) {
      return res.status(400).json({
        success: false,
        error: "Lead information is required"
      });
    }
    
    const schedule = await smartBidAI.generateSchedulingRecommendation(lead, contractor);
    
    res.json({
      success: true,
      schedule,
      message: "Scheduling options generated successfully."
    });
  } catch (error) {
    console.error("SmartBid scheduling error:", error);
    res.status(500).json({ success: false, error: "Failed to generate schedule" });
  }
});

router.post("/smartbid/communicate", async (req: Request, res: Response) => {
  try {
    const { context, recipientType, purpose, keyPoints, includeContactInfo } = req.body;
    
    if (!context || !recipientType || !purpose || !keyPoints) {
      return res.status(400).json({
        success: false,
        error: "Context, recipient type, purpose, and key points are required"
      });
    }
    
    const hasPayment = includeContactInfo === true;
    
    const message = await smartBidAI.generateCommunication(
      context,
      recipientType,
      purpose,
      keyPoints,
      hasPayment
    );
    
    res.json({
      success: true,
      message,
      contactIncluded: hasPayment
    });
  } catch (error) {
    console.error("SmartBid communication error:", error);
    res.status(500).json({ success: false, error: "Failed to generate communication" });
  }
});

router.get("/smartbid/prompts", async (req: Request, res: Response) => {
  try {
    const prompts = smartBidAI.getPrompts();
    res.json({ success: true, prompts });
  } catch (error) {
    console.error("Error fetching prompts:", error);
    res.status(500).json({ success: false, error: "Failed to fetch prompts" });
  }
});

router.post("/smartbid/prompts", async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    smartBidAI.updatePrompts(updates);
    res.json({ 
      success: true, 
      message: "SmartBid™ prompts updated successfully",
      prompts: smartBidAI.getPrompts()
    });
  } catch (error) {
    console.error("Error updating prompts:", error);
    res.status(500).json({ success: false, error: "Failed to update prompts" });
  }
});

export default router;
