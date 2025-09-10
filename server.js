// server.js - Static server for frontend development
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve static files from dist (for production mode)
const DIST_DIR = path.join(__dirname, 'dist', 'public');
app.use(express.static(DIST_DIR));

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Mock API endpoints for frontend development
app.get('/api/customers', (_req, res) => res.json([]));
app.get('/api/contractors', (_req, res) => res.json([]));
app.get('/api/schedule/list', (_req, res) => res.json([]));

// Legacy endpoints for compatibility
app.post("/api/dsp-ingest", (req, res) => res.json({ ok: true, item: req.body }));
app.get("/api/inbox", (req, res) => res.json([]));

// Catch-all for client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));