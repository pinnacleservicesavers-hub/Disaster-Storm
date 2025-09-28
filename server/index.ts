import Agent3 from "./agent3";
import http from "http";
import express from "express";
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

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

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
});
