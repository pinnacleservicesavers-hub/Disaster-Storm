import type { Express } from "express";
import { createServer, type Server } from "http";
import fetch from "node-fetch";
import { storage } from "./storage";
import { weatherService } from "./services/weather";
import { aiService } from "./services/ai";
import { propertyService } from "./services/property";
import { legalService } from "./services/legal";
import { translationService } from "./services/translation";
import { insertClaimSchema, insertFieldReportSchema, insertDroneFootageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Tornado alerts endpoint - get active Tornado Warnings in multiple states
  app.get("/api/alerts", async (_req, res) => {
    try {
      const states = ["GA","FL","AL","SC","NC","MS","LA","TX","OK","KS"];
      const urls = states.map(s =>
        `https://api.weather.gov/alerts/active?area=${s}&event=Tornado%20Warning`
      );
      const results = await Promise.all(urls.map(u => fetch(u).then(r => r.json())));
      const features = results.flatMap(r => r.features || []);
      res.json({ count: features.length, features });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Weather API routes
  app.get("/api/weather/alerts", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      const alerts = await weatherService.getWeatherAlerts(
        lat ? parseFloat(lat as string) : undefined,
        lon ? parseFloat(lon as string) : undefined
      );
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/weather/radar", async (req, res) => {
    try {
      const { lat, lon, zoom } = req.query;
      if (!lat || !lon) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const radarData = await weatherService.getRadarData(
        parseFloat(lat as string),
        parseFloat(lon as string),
        zoom ? parseInt(zoom as string) : 6
      );
      res.json(radarData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/weather/forecast", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      if (!lat || !lon) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const forecast = await weatherService.getForecast(
        parseFloat(lat as string),
        parseFloat(lon as string)
      );
      res.json(forecast);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Claims management routes
  app.get("/api/claims", async (req, res) => {
    try {
      const claims = await storage.getClaims();
      res.json(claims);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/claims/:id", async (req, res) => {
    try {
      const claim = await storage.getClaim(req.params.id);
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      res.json(claim);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/claims", async (req, res) => {
    try {
      const validatedData = insertClaimSchema.parse(req.body);
      const claim = await storage.createClaim(validatedData);
      res.status(201).json(claim);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/claims/:id", async (req, res) => {
    try {
      const claim = await storage.updateClaim(req.params.id, req.body);
      res.json(claim);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Insurance company routes
  app.get("/api/insurance-companies", async (req, res) => {
    try {
      const companies = await storage.getInsuranceCompanies();
      res.json(companies);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/insurance-companies/:id", async (req, res) => {
    try {
      const company = await storage.getInsuranceCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Insurance company not found" });
      }
      res.json(company);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Legal compliance routes
  app.get("/api/legal/lien-rules", async (req, res) => {
    try {
      const rules = await storage.getLienRules();
      res.json(rules);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/legal/lien-rules/:state", async (req, res) => {
    try {
      const rule = await storage.getLienRule(req.params.state.toUpperCase());
      if (!rule) {
        return res.status(404).json({ message: "Lien rule not found for state" });
      }
      res.json(rule);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/legal/calculate-deadline", async (req, res) => {
    try {
      const { state, completionDate, projectType } = req.body;
      if (!state || !completionDate) {
        return res.status(400).json({ message: "State and completion date are required" });
      }

      const deadline = await legalService.calculateLienDeadline(
        state,
        new Date(completionDate),
        projectType
      );
      res.json(deadline);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/legal/attorneys/:state", async (req, res) => {
    try {
      const { specialty } = req.query;
      const attorneys = await legalService.getAttorneysByState(
        req.params.state.toUpperCase(),
        specialty as string
      );
      res.json(attorneys);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/legal/check-compliance", async (req, res) => {
    try {
      const { claimId, state } = req.body;
      if (!claimId || !state) {
        return res.status(400).json({ message: "Claim ID and state are required" });
      }

      const compliance = await legalService.checkCompliance(claimId, state);
      res.json(compliance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Property lookup routes
  app.get("/api/property/lookup", async (req, res) => {
    try {
      const { lat, lon, address } = req.query;
      
      let propertyData;
      if (lat && lon) {
        propertyData = await propertyService.lookupByCoordinates(
          parseFloat(lat as string),
          parseFloat(lon as string)
        );
      } else if (address) {
        propertyData = await propertyService.lookupByAddress(address as string);
      } else {
        return res.status(400).json({ message: "Either coordinates or address is required" });
      }

      if (!propertyData) {
        return res.status(404).json({ message: "Property not found" });
      }

      res.json(propertyData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/property/verify-contact", async (req, res) => {
    try {
      const verifiedContact = await propertyService.verifyContact(req.body);
      res.json(verifiedContact);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Field reports routes
  app.get("/api/field-reports", async (req, res) => {
    try {
      const { crewId } = req.query;
      
      let reports;
      if (crewId) {
        reports = await storage.getFieldReportsByCrew(crewId as string);
      } else {
        reports = await storage.getFieldReports();
      }
      
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/field-reports", async (req, res) => {
    try {
      const validatedData = insertFieldReportSchema.parse(req.body);
      const report = await storage.createFieldReport(validatedData);
      res.status(201).json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/field-reports/:id", async (req, res) => {
    try {
      const report = await storage.updateFieldReport(req.params.id, req.body);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Drone footage routes
  app.get("/api/drone-footage", async (req, res) => {
    try {
      const { live } = req.query;
      
      let footage;
      if (live === 'true') {
        footage = await storage.getLiveDroneFootage();
      } else {
        footage = await storage.getDroneFootage();
      }
      
      res.json(footage);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/drone-footage", async (req, res) => {
    try {
      const validatedData = insertDroneFootageSchema.parse(req.body);
      const footage = await storage.createDroneFootage(validatedData);
      res.status(201).json(footage);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Market comparables routes
  app.get("/api/market-comparables", async (req, res) => {
    try {
      const comparables = await storage.getMarketComparables();
      res.json(comparables);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/market-comparables/analyze", async (req, res) => {
    try {
      const analysis = await aiService.analyzeMarketComparables(req.body);
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // AI assistant routes
  app.post("/api/ai/generate-letter", async (req, res) => {
    try {
      const letter = await aiService.generateClaimLetter(req.body);
      
      // Log the interaction
      await storage.createAiInteraction({
        userId: req.body.userId || 'anonymous',
        interactionType: 'letter_generation',
        input: req.body,
        output: letter,
        language: req.body.language || 'en',
        claimId: req.body.claimNumber,
        tokensUsed: 0 // Would be calculated from actual API response
      });

      res.json(letter);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/analyze-image", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ message: "Image data is required" });
      }

      const analysis = await aiService.analyzeDamageImage(imageBase64);
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/transcribe", async (req, res) => {
    try {
      // Handle audio file upload and transcription
      const transcription = await aiService.transcribeAudio(req.body.audioBuffer);
      res.json(transcription);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/generate-scope", async (req, res) => {
    try {
      const scopeNotes = await aiService.generateScopeNotes(req.body);
      res.json({ scopeNotes });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Translation routes
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLanguage, context } = req.body;
      if (!text || !targetLanguage) {
        return res.status(400).json({ message: "Text and target language are required" });
      }

      const translation = await translationService.translateText(text, targetLanguage, context);
      res.json(translation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/translate/claim", async (req, res) => {
    try {
      const { content, targetLanguage } = req.body;
      const translatedContent = await translationService.translateClaimContent(content, targetLanguage);
      res.json(translatedContent);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/translate/phrases", async (req, res) => {
    try {
      const { context } = req.query;
      const phrases = await translationService.getPreTranslatedPhrases(context as string);
      res.json(phrases);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dashboard data aggregation route
  app.get("/api/dashboard/summary", async (req, res) => {
    try {
      const [claims, companies, alerts, reports] = await Promise.all([
        storage.getClaims(),
        storage.getInsuranceCompanies(),
        storage.getActiveWeatherAlerts(),
        storage.getFieldReports()
      ]);

      const activeClaims = claims.filter(claim => claim.status === 'active').length;
      const totalPayouts = claims.reduce((sum, claim) => sum + (parseFloat(claim.paidAmount || '0')), 0);
      const stormAlerts = alerts.length;
      const successRate = claims.length > 0 ? (claims.filter(claim => claim.status === 'settled').length / claims.length) * 100 : 0;

      const urgentReports = reports.filter(report => report.priority === 'urgent').length;

      res.json({
        activeClaims,
        totalPayouts,
        stormAlerts,
        successRate,
        urgentReports,
        lastUpdated: new Date()
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // WebSocket for real-time updates would be implemented here
  const httpServer = createServer(app);

  // TODO: Implement WebSocket connections for real-time weather and claim updates
  // const io = new Server(httpServer);
  // io.on('connection', (socket) => {
  //   console.log('Client connected');
  //   // Handle real-time subscriptions
  // });

  return httpServer;
}
