import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";

const router = Router();

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

export default router;
