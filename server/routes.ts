import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import fetch from "node-fetch";
import multer from "multer";
import path from "path";
import fs from "fs";
import cron from "node-cron";
import twilio from "twilio";
import nodemailer from "nodemailer";
import { storage } from "./storage";
import { weatherService } from "./services/weather";
import { aiService } from "./services/ai";
import { propertyService } from "./services/property";
import { legalService } from "./services/legal";
import { translationService } from "./services/translation";
import { insertClaimSchema, insertFieldReportSchema, insertDroneFootageSchema, insertDspFootageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Tornado alerts endpoint - get active Tornado Warnings in multiple states
  app.get("/api/alerts", async (_req, res) => {
    try {
      const states = ["GA","FL","AL","SC","NC","MS","LA","TX","OK","KS"];
      const urls = states.map(s =>
        `https://api.weather.gov/alerts/active?area=${s}&event=Tornado%20Warning`
      );
      const results = await Promise.all(urls.map(u => fetch(u).then(r => r.json() as any)));
      const features = results.flatMap(r => r.features || []);
      res.json({ count: features.length, features });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // YouTube live streams endpoint - search for live streams by keywords
  app.get("/api/live", async (req, res) => {
    try {
      const YT_KEY = process.env.YT_API_KEY!;
      if (!YT_KEY) {
        return res.status(500).json({ error: "YT_API_KEY not configured" });
      }
      
      const q = req.query.q || "tornado live";
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&eventType=live&maxResults=8&q=${encodeURIComponent(
        String(q)
      )}&key=${YT_KEY}`;
      const data = await fetch(url).then(r => r.json() as any);
      const items = (data.items || []).map((i: any) => ({
        id: i.id.videoId,
        title: i.snippet.title,
        channel: i.snippet.channelTitle
      }));
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Property owner lookup endpoint - get owner info by address
  app.get("/api/owner", async (req, res) => {
    try {
      const address = String(req.query.address || "");
      if (!address) return res.status(400).json({ error: "address required" });
      
      const ESTATED_KEY = process.env.ESTATED_KEY!;
      if (!ESTATED_KEY) {
        return res.status(500).json({ error: "ESTATED_KEY not configured" });
      }
      
      const url = `https://api.estated.com/property/v5?token=${ESTATED_KEY}&combined_address=${encodeURIComponent(address)}`;
      const data = await fetch(url).then(r => r.json() as any);
      // pick out owner info if present
      const owner = data?.data?.owner || data?.data?.owners?.[0] || null;
      res.json({ owner, raw: data });
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

  // simple in-memory store; swap for a DB later
  const inbox: any[] = [];
  
  // SSE client connections
  const clients = new Set();

  async function reverseGeocode(lat: number, lon: number) {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
      headers: { "User-Agent": "StormOpsHub/1.0" }
    });
    const j = await r.json().catch(() => null) as any;
    return j?.display_name || "";
  }

  function pushSSE(item: any) {
    const msg = `data: ${JSON.stringify(item)}\n\n`;
    clients.forEach((c: any) => {
      try {
        c.write(msg);
      } catch (error) {
        // Remove dead connections
        clients.delete(c);
      }
    });
  }

  app.post("/api/dsp-ingest", async (req, res) => {
    const item = req.body || {};
    if (!item.mediaUrl) return res.status(400).json({ error: "mediaUrl required" });

    if (!item.address && item.lat && item.lon) {
      item.address = await reverseGeocode(item.lat, item.lon);
    }
    item.id = Date.now().toString();
    inbox.unshift(item);

    // Broadcast to SSE clients in real-time
    pushSSE(item);

    return res.json({ ok: true, item });
  });

  app.get("/api/inbox", (req, res) => res.json(inbox));

  // Owner lookup endpoint - placeholder for property records integration
  app.get("/api/owner-lookup", async (req, res) => {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: "Address parameter required" });
    }

    try {
      // TODO: Wire to real property data provider (ESTATED_KEY, assessor records, etc)
      // For now, return mock data structure that matches expected format
      const mockOwner = {
        name: "John Smith", 
        phone: "555-123-4567",
        email: "john.smith@email.com",
        mailingAddress: address,
        parcelId: "1234567890",
        assessedValue: "$285,000",
        lastSale: "2019-03-15",
        salePrice: "$265,000"
      };

      res.json({ 
        owner: mockOwner,
        source: "mock_data",
        address: address,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Server-Sent Events endpoint for real-time updates
  app.get("/api/stream", (req, res) => {
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control"
    });
    res.flushHeaders();
    res.write("retry: 5000\n\n");
    
    clients.add(res);
    
    req.on("close", () => {
      clients.delete(res);
    });
    
    req.on("error", () => {
      clients.delete(res);
    });
  });

  // WebSocket for real-time updates
  const httpServer = createServer(app);
  
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (socket) => {
    console.log('Client connected to DSP alerts');
    
    socket.send(JSON.stringify({
      type: 'connection_established',
      message: 'Connected to StormLead DSP alerts'
    }));

    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'subscribe_to_dsp') {
          socket.send(JSON.stringify({
            type: 'subscription_confirmed',
            message: 'Subscribed to DSP footage alerts'
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    socket.on('close', () => {
      console.log('Client disconnected');
    });
  });

  // ===== ENHANCED BACKEND FUNCTIONALITY =====

  // --- File uploads setup
  const UPLOAD_DIR = "./uploads";
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  app.use("/uploads", express.static(UPLOAD_DIR));

  // --- Upload endpoint (proof of insurance, photos, etc.)
  const upload = multer({ dest: UPLOAD_DIR });
  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ ok: true, file: { name: req.file.originalname, path: `/uploads/${req.file.filename}` } });
  });

  // --- Contract PDF serving
  app.get("/files/contract.pdf", (req, res) => {
    const contractPath = path.join(process.cwd(), "assets", "contract.pdf");
    if (fs.existsSync(contractPath)) {
      return res.sendFile(contractPath);
    }
    return res.status(404).send("Contract file not found — place it at ./assets/contract.pdf");
  });

  // --- Twilio Setup (SMS + Voice)
  const tw = (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) 
    ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN) 
    : null;

  app.post("/api/sms", async (req, res) => {
    try {
      const { to, body } = req.body || {};
      if (!tw) return res.status(500).json({ error: "Twilio not configured - add TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM" });
      if (!to || !body) return res.status(400).json({ error: "to and body required" });
      
      const message = await tw.messages.create({ 
        to, 
        from: process.env.TWILIO_FROM!, 
        body 
      });
      res.json({ ok: true, sid: message.sid });
    } catch (e) { 
      console.error("SMS Error:", e);
      res.status(500).json({ error: "SMS failed", detail: String(e) }); 
    }
  });

  app.post("/api/call", async (req, res) => {
    try {
      const { to, twiml } = req.body || {};
      if (!tw) return res.status(500).json({ error: "Twilio not configured" });
      if (!to) return res.status(400).json({ error: "to required" });
      
      const call = await tw.calls.create({
        to, 
        from: process.env.TWILIO_FROM!,
        twiml: twiml || `<Response><Say voice="alice">This is Strategic Land Management calling regarding your storm damage. Please call us at ${process.env.PUBLIC_PHONE||'888-628-2229'}.</Say></Response>`
      });
      res.json({ ok: true, sid: call.sid });
    } catch (e) { 
      console.error("Call Error:", e);
      res.status(500).json({ error: "Call failed", detail: String(e) }); 
    }
  });

  // --- Email Setup (SMTP via Nodemailer)
  const emailTransporter = (process.env.SMTP_HOST)
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: { 
          user: process.env.SMTP_USER!, 
          pass: process.env.SMTP_PASS! 
        }
      })
    : null;

  app.post("/api/email", async (req, res) => {
    try {
      if (!emailTransporter) {
        return res.status(500).json({ 
          error: "Email not configured - add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM" 
        });
      }
      
      const { to, subject, html, attachments } = req.body || {};
      if (!to || !subject) return res.status(400).json({ error: "to and subject required" });
      
      const info = await emailTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to, 
        subject, 
        html: html || "", 
        attachments
      });
      res.json({ ok: true, id: info.messageId });
    } catch (e) { 
      console.error("Email Error:", e);
      res.status(500).json({ error: "Email failed", detail: String(e) }); 
    }
  });

  // --- AI describe placeholder
  app.post("/api/describe", async (req, res) => {
    res.json({ captions: ["Tree on roof; broken ridge; tarp recommended"] });
  });

  // --- Reminders System (claim 30/60d; completion 45d; lien 10mo)
  const scheduledJobs: any[] = [];
  
  function scheduleReminder(whenISO: string, label: string) {
    const d = new Date(whenISO);
    if (isNaN(d.getTime())) return;
    
    const cronExp = `${d.getUTCMinutes()} ${d.getUTCHours()} ${d.getUTCDate()} ${d.getUTCMonth()+1} *`;
    const job = cron.schedule(cronExp, () => {
      console.log(`⏰ Reminder: ${label} at ${new Date().toISOString()}`);
      
      // Send notification via email if configured
      if (emailTransporter && process.env.ADMIN_EMAIL) {
        emailTransporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: process.env.ADMIN_EMAIL,
          subject: `⏰ Reminder: ${label}`,
          html: `<p>Time to act: <strong>${label}</strong></p><p>Scheduled for: ${d.toLocaleDateString()}</p>`
        }).catch(console.error);
      }
      
      // Send SMS if configured
      if (tw && process.env.ADMIN_PHONE) {
        tw.messages.create({
          to: process.env.ADMIN_PHONE,
          from: process.env.TWILIO_FROM!,
          body: `⏰ Reminder: ${label}`
        }).catch(console.error);
      }
    }, { timezone: "UTC" });
    
    scheduledJobs.push(job);
  }

  app.post("/api/reminders", (req, res) => {
    const { claimDate, completeDate, lienDate } = req.body || {};
    
    const addDays = (start: string, days: number) => {
      return new Date(new Date(start).getTime() + days * 86400000).toISOString();
    };
    
    if (claimDate) { 
      scheduleReminder(addDays(claimDate, 30), "30 days since claim submission"); 
      scheduleReminder(addDays(claimDate, 60), "60 days since claim submission"); 
    }
    
    if (completeDate) {
      scheduleReminder(addDays(completeDate, 45), "45 days since work completion (consider lien)");
    }
    
    if (lienDate) { 
      const tenMonthsMs = 1000 * 60 * 60 * 24 * 30 * 10; 
      scheduleReminder(
        new Date(new Date(lienDate).getTime() + tenMonthsMs).toISOString(), 
        "10 months since lien filed"
      ); 
    }
    
    res.json({ ok: true, scheduled: { claimDate, completeDate, lienDate } });
  });

  // --- Owner lookup with enhanced functionality
  app.post("/api/owner-lookup", async (req, res) => {
    const { address, lat, lon } = req.body || {};
    
    try {
      // TODO: integrate ATTOM/Estated/CoreLogic or county API
      // Keep audit logs & comply with TCPA/privacy
      
      // For now, return enhanced mock data
      const mockResult = {
        owner: null,
        mailingAddress: address || null,
        phone: null,
        email: null,
        sources: [],
        propertyValue: null,
        yearBuilt: null,
        parcelId: null,
        message: "Owner lookup service requires integration with licensed property data provider"
      };
      
      res.json(mockResult);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
