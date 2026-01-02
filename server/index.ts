import Agent3 from "./agent3";
import http from "http";
import express from "express";
import session from "express-session";
import { WebSocketServer } from "ws";
import cors from "cors";
import crypto from "crypto";
import { storage } from "./storage.js";
import { router as annotate } from "../apps/server/src/routes/annotate.js";
import { router as measure } from "../apps/server/src/routes/measure.js";
import { router as video } from "../apps/server/src/routes/video.js";
import { router as weight } from "../apps/server/src/routes/weight.js";
import { router as tape } from "../apps/server/src/routes/tape.js";
import { router as calibrate } from "./routes/calibrate.js";
import { router as hints } from "./routes/hints.js";
import { router as area } from "./routes/area.js";
import { router as damage } from "../apps/server/src/routes/damage.js";
import { registerRoutes } from "./routes.js";
import { setupVite, log } from "./vite.js";
import { scheduler } from "./scheduler.js";
import { jwksRefresher } from "./services/jwksRefresher.js";

const app = express();

// Trust Replit proxy so req.protocol is 'https'
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Session middleware - must be before routes that use sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'disaster-direct-session-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  },
}));

const port = Number(process.env.PORT || 5000);
const server = http.createServer(app);
// Start Agent 3
try {
  Agent3.start();
  console.log("✅ Agent 3 initialized");
} catch (err) {
  console.error("❌ Agent 3 failed to start:", err);
}

// B=asic API routes
app.get("/health", (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use("/api/annotate", annotate);
app.use("/api/measure", measure);
app.use("/api/video", video);
app.use("/api/weight", weight);
app.use("/api/tape", tape);
app.use("/api/calibrate", calibrate);
app.use("/api/hints", hints);
app.use("/api/area", area);
app.use("/api/damage", damage);

// Claims Agent routes
import claimsIntake from "./routes/claimsIntake.js";
import claimsPacket from "./routes/claimsPacket.js";
import claimsAgent from "./routes/claimsAgent.js";
import claimsWebhooks from "./routes/claimsWebhooks.js";

app.use("/api/claims-intake", claimsIntake);
app.use("/api/claims-packet", claimsPacket);
app.use("/api/claims-agent", claimsAgent);
app.use("/api/claims-webhooks", claimsWebhooks);

// AI Lead Management routes
import { aiLeadsRouter } from "./routes/aiLeads.js";
app.use("/api/ai-leads", aiLeadsRouter);

// Register main application routes (including property API endpoints)
await registerRoutes(app);

// Tool registry endpoint for LLM provider flexibility
app.get("/api/ai/tools", (req, res) => {
  res.json({
    tools: [
      {
        name: "annotate.addCircle",
        description: "Add circle annotation to media",
        parameters: {
          type: "object",
          properties: {
            mediaId: { type: "string" },
            x: { type: "number" },
            y: { type: "number" },
            r: { type: "number" },
            label: { type: "string" },
          },
          required: ["mediaId", "x", "y", "r", "label"],
        },
      },
      {
        name: "measure.diameter",
        description: "Measure diameter using frame coordinates",
        parameters: {
          type: "object",
          properties: {
            mediaId: { type: "string" },
            x1: { type: "number" },
            y1: { type: "number" },
            x2: { type: "number" },
            y2: { type: "number" },
            scalePxPerInch: { type: "number" },
          },
          required: ["mediaId", "x1", "y1", "x2", "y2", "scalePxPerInch"],
        },
      },
      {
        name: "tree.estimate_weight",
        description: "Estimate tree weight using allometric equations",
        parameters: {
          type: "object",
          properties: {
            species: { type: "string" },
            dbhIn: { type: "number" },
            lengthFt: { type: "number" },
            method: { type: "string" },
          },
          required: ["species", "dbhIn", "lengthFt", "method"],
        },
      },
    ],
    meta: {
      total_tools: 3,
      categories: {
        annotation: 1,
        measurement: 1,
        tree_analysis: 1,
      },
      server_authority: true,
      explicit_tool_calls: true,
    },
  });
});

// Attach WS
import { attachAssistantWSS } from "./ws/assistant.js";
attachAssistantWSS(server);

// Setup Vite for serving the React app
if (process.env.NODE_ENV === "development") {
  await setupVite(app, server);
}

server.listen(port, () => {
  log(`Server running at http://localhost:${port}`);
  if (process.env.NODE_ENV === "development") {
    log("Vite development server enabled with HMR");
  }
  
  const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;
  
  // Start DamageMonitoringScheduler for real-time updates
  scheduler.start();
  
  setInterval(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/claims-agent/run`);
      const result = await response.json();
      if (result.ran > 0) {
        console.log(`Claims Agent: Processed ${result.ran} follow-ups`);
      }
    } catch (err) {
      console.error('Claims Agent scheduler error:', err);
    }
  }, 60_000);
  
  console.log('✅ Claims Agent scheduler started (runs every 60 seconds)');

  // Contractor Opportunity Alerts - Check every 15 minutes
  setInterval(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/contractor-alerts/check-opportunities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minScore: 70 })
      });
      const result = await response.json();
      if (result.success && result.result?.sent > 0) {
        console.log(`🚨 Contractor Alerts: Sent ${result.result.sent} alerts for ${result.opportunities} opportunities`);
      }
    } catch (err) {
      console.error('Contractor alerts scheduler error:', err);
    }
  }, 15 * 60 * 1000); // Every 15 minutes
  
  console.log('✅ Contractor alerts scheduler started (runs every 15 minutes)');

  // Hazard Monitoring - Check every 10 minutes
  setInterval(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/hazards/dashboard`);
      const result = await response.json();
      if (result.success) {
        const { hurricanes, earthquakes, wildfires } = result.hazards;
        console.log(`⚠️ Hazards: ${hurricanes.count} hurricane(s), ${earthquakes.count} earthquake(s), ${wildfires.count} wildfire(s)`);
      }
    } catch (err) {
      console.error('Hazard monitoring scheduler error:', err);
    }
  }, 10 * 60 * 1000); // Every 10 minutes
  
  console.log('✅ Hazard monitoring scheduler started (runs every 10 minutes)');

  // AI Lead Re-engagement - Check every 6 hours
  import('./services/aiLeadReengagement.js').then(({ reengageStaleLeads }) => {
    setInterval(async () => {
      try {
        const result = await reengageStaleLeads();
        if (result.reminded > 0) {
          console.log(`🔄 AI Lead Re-engagement: Sent ${result.reminded} reminders to ${result.scanned} stale leads`);
        }
      } catch (err) {
        console.error('AI lead re-engagement scheduler error:', err);
      }
    }, 6 * 60 * 60 * 1000); // Every 6 hours
    
    console.log('✅ AI Lead re-engagement scheduler started (runs every 6 hours)');
  });
  
  // Start JWKS background refresher
  jwksRefresher.start().catch(err => {
    console.error('❌ Failed to start JWKS refresher:', err);
  });
});
