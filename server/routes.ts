// Storm Ops Backend (Express)
// --------------------------------------------
// Provides:
// - /api/dsp-ingest  : providers/DSPs post live items
// - /api/stream      : SSE for Inbox + Map markers
// - /api/inbox       : fetch recent items
// - /api/owner-lookup: Estated (if key) or reverse-geocode fallback
// - /api/sms, /api/call (Twilio)
// - /api/email       (Nodemailer) + inbound webhook + claim-thread store
// - /api/upload      (multer disk uploads)
// - /api/describe    (AI caption placeholder)
// - /api/invoice/checkout (Stripe Checkout)
// - /api/brochure/strategic (PDF tri-fold using pdfkit)
// - /api/reminders   (node-cron reminders for claims/liens)
// - /files/contract.pdf : serve your contract PDF from ./assets/contract.pdf
//
// ENV (set in Replit Secrets):
//   TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
//   ESTATED_API_KEY (optional)
//   STRIPE_SECRET_KEY (optional), PAY_SUCCESS_URL, PAY_CANCEL_URL
//   PUBLIC_PHONE (optional)

import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import cron from "node-cron";
import twilio from "twilio";
import nodemailer from "nodemailer";
import fetchPkg from "node-fetch";
import Stripe from "stripe";
import PDFDocument from "pdfkit";
import { createServer, type Server } from "http";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { weatherService, weatherStreamManager } from "./services/weather";
import { trafficCameraService } from "./services/trafficCameras";
import { damageDetectionService } from "./services/damageDetection";
import { unified511Directory } from "./services/unified511Directory";
import { storage } from "./storage";
import { insertContractorWatchlistSchema } from "@shared/schema";

// fetch polyfill if needed
const fetch = globalThis.fetch || fetchPkg;
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// ---- static assets (uploads + optional assets directory) ----
const ROOT = process.cwd();
const UPLOAD_DIR = path.join(ROOT, "uploads");
const ASSETS_DIR = path.join(ROOT, "assets");
const DATA_DIR = path.join(ROOT, "data");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ---- SLA tracking data file ----
const SLA_PATH = path.join(DATA_DIR, 'sla.json');
if (!fs.existsSync(SLA_PATH)) fs.writeFileSync(SLA_PATH, JSON.stringify({ items: [] }, null, 2));

function readSLA() { 
  try { 
    return JSON.parse(fs.readFileSync(SLA_PATH, 'utf8')); 
  } catch { 
    return { items: [] }; 
  } 
}

function writeSLA(data: any) { 
  try { 
    fs.writeFileSync(SLA_PATH, JSON.stringify(data, null, 2)); 
  } catch (e) {
    console.error('Failed to write SLA data:', e);
  } 
}

// ---- Customer storage system ----
const CUSTOMERS_PATH = path.join(DATA_DIR, 'customers.json');
if (!fs.existsSync(CUSTOMERS_PATH)) fs.writeFileSync(CUSTOMERS_PATH, JSON.stringify({ items: [] }, null, 2));

function readCustomers() { 
  try { 
    return JSON.parse(fs.readFileSync(CUSTOMERS_PATH, 'utf8')); 
  } catch { 
    return { items: [] }; 
  } 
}

function writeCustomers(data: any) { 
  try { 
    fs.writeFileSync(CUSTOMERS_PATH, JSON.stringify(data, null, 2)); 
  } catch (e) {
    console.error('Failed to write customers data:', e);
  } 
}

// ---- Owner lookup providers ----
async function ownerLookup(address: string) {
  if (!address) return null;
  const prov = (process.env.OWNER_PROVIDER || 'none').toLowerCase();
  
  try {
    if (prov === 'estated') {
      const token = process.env.ESTATED_TOKEN; 
      if (!token) return null;
      const url = `https://api.estated.com/property/v3?token=${encodeURIComponent(token)}&combined_address=${encodeURIComponent(address)}`;
      const r = await fetch(url); 
      const j = await r.json();
      const d = j?.data || j?.properties?.[0] || j?.property || null;
      const owner = d?.owner || d?.owners?.[0] || {};
      const name = [owner.owner1_first_name, owner.owner1_last_name, owner.name].filter(Boolean).join(' ').trim() || owner.owner1 || owner.owner2;
      const mail = d?.mailing_address?.formatted || [d?.mailing_address?.street, d?.mailing_address?.city, d?.mailing_address?.state, d?.mailing_address?.zip].filter(Boolean).join(', ');
      return name || mail ? { ownerName: name || null, mailingAddress: mail || null } : null;
    }
    
    if (prov === 'attom') {
      const key = process.env.ATTOM_KEY; 
      if (!key) return null;
      const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile?address=${encodeURIComponent(address)}`;
      const r = await fetch(url, { headers: { apikey: key } }); 
      const j = await r.json();
      const d = j?.property?.[0] || null;
      const own = d?.owner?.[0] || {};
      const name = [own.firstname, own.lastname].filter(Boolean).join(' ').trim() || own.name1 || own.corporationname;
      const mail = [own.mailingaddress1 || own.mailingaddress, own.mailingcity, own.mailingstate, own.mailingzip].filter(Boolean).join(', ');
      return name || mail ? { ownerName: name || null, mailingAddress: mail || null } : null;
    }
    
    if (prov === 'propapi') {
      const key = process.env.PROPAPI_KEY; 
      if (!key) return null;
      const url = `https://example-property-api.com/lookup?address=${encodeURIComponent(address)}`; // replace base URL
      const r = await fetch(url, { headers: { Authorization: `Bearer ${key}` } }); 
      const j = await r.json();
      const name = j?.owner?.name || j?.data?.ownerName || null;
      const mail = j?.owner?.mailing || j?.data?.mailingAddress || null;
      return name || mail ? { ownerName: name || null, mailingAddress: mail || null } : null;
    }
  } catch (e) { 
    console.error('Owner lookup failed:', e);
  }
  return null; // none/unknown
}

// ---- Address normalization + geo helpers ----
function normalizeAddressStr(s: string = '') {
  return s.toLowerCase()
    .replace(/\b(ste|unit|apt|suite|#)\b.*$/, '') // drop unit tails
    .replace(/[^a-z0-9]/g, '') // alnum only
    .trim();
}

function haversine(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000; // Earth radius in meters
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// ---- in-memory Inbox store (swap for DB in prod) ----
const inbox = []; // [{ id, provider, timestamp, mediaUrl, thumbnailUrl, lat, lon, address, notes, tags }]
const sseClients = new Set();

// ---- simple message store by claim number (for email threads) ----
const messagesByClaim = new Map(); // claimNumber -> [{ts, dir, from, to, subject, html, text}]
function addMessage(claimNumber, msg){
  if(!claimNumber) return;
  if(!messagesByClaim.has(claimNumber)) messagesByClaim.set(claimNumber, []);
  messagesByClaim.get(claimNumber).push({ ts: Date.now(), ...msg });
}
function extractClaim(text){
  if(!text) return null;
  const up = String(text).toUpperCase();
  const tag = '[CLAIM ';
  let i = up.indexOf(tag);
  if (i >= 0){
    const j = up.indexOf(']', i+tag.length);
    if (j > i) return String(text).substring(i+tag.length, j).trim();
  }
  i = up.indexOf('CLAIM');
  if (i >= 0){
    let rest = String(text).substring(i+5).trim();
    const prefixes = ['#','NO.','NO','NUMBER',':','-'];
    for (const pre of prefixes){ if (rest.toUpperCase().startsWith(pre)) { rest = rest.slice(pre.length).trim(); break; } }
    let token = '';
    for (const ch of rest){ const code = ch.charCodeAt(0); const ok = (code>=48&&code<=57)||(code>=65&&code<=90)||(code>=97&&code<=122)||ch==='-'; if (!ok) break; token+=ch; }
    if (token) return token;
  }
  return null;
}

function broadcast(item: any) {
  const line = `data: ${JSON.stringify(item)}\n\n`;
  for (const client of sseClients) {
    try {
      (client as any).write(line);
    } catch (e) {
      // Client disconnected, ignore error
    }
  }
}

// ---- reverse geocode helper (OSM/Nominatim) ----
async function reverseGeocode(lat, lon) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { "User-Agent": "StormOpsHub/1.0" } }
    );
    const j = await r.json();
    return j?.display_name || "";
  } catch (e) {
    return "";
  }
}

// ---- Twilio SMS + Voice ----
const tw = (process.env.TWILIO_SID && process.env.TWILIO_TOKEN)
  ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
  : null;

// ---- Email (Nodemailer SMTP) ----
const transporter = (process.env.SMTP_HOST)
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

// ---- Reminders ----
const scheduledJobs = [];
function scheduleAt(dateISO: string, label: string) {
  const dt = new Date(dateISO);
  if (isNaN(dt.getTime())) return;
  const cronExp = `${dt.getUTCMinutes()} ${dt.getUTCHours()} ${dt.getUTCDate()} ${dt.getUTCMonth() + 1} *`;
  const job = cron.schedule(
    cronExp,
    () => {
      console.log("Reminder:", label, new Date().toISOString());
      // Hook: notify admin via email/SMS if desired.
    },
    { timezone: "UTC" }
  );
  scheduledJobs.push(job);
}

export async function registerRoutes(app: express.Application): Promise<Server> {
  
  // ---- static assets setup ----
  app.use("/uploads", express.static(UPLOAD_DIR));
  app.use("/assets", express.static(ASSETS_DIR));

  // ---- health/version ----
  app.get("/health", (req, res) => res.json({ ok: true }));
  app.get("/api/version", (req, res) => res.json({ name: "storm-ops-backend", version: 2 }));

  // ---- SSE: stream Inbox items live to clients ----
  app.get("/api/stream", (req, res) => {
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.flushHeaders();
    res.write("retry: 5000\n\n");
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
  });

  // ---- providers/DSPs POST live items here ----
  app.post("/api/dsp-ingest", async (req, res) => {
    try {
      const item = req.body || {};
      if (!item.mediaUrl) return res.status(400).json({ error: "mediaUrl required" });
      if (!item.timestamp) item.timestamp = new Date().toISOString();
      if (!item.address && item.lat && item.lon) item.address = await reverseGeocode(item.lat, item.lon);
      item.id = String(Date.now());
      // naive tag derive (client also adds)
      const text = `${item.notes || ""} ${item.address || ""}`.toLowerCase();
      const tags = [];
      if (/tree on roof|through roof|roof damage/.test(text)) tags.push("tree_on_roof");
      if (/tree on (house|building|home|structure)/.test(text)) tags.push("tree_on_building");
      if (/tree.*across.*driveway|tree.*blocking.*driveway|blocking.*egress|blocking.*ingress|driveway.*blocked/i.test(text)) tags.push("tree_across_driveway");
      if (/line down|power line|utility line|pole down/.test(text)) tags.push("line_down");
      if (/collapse|structural|building damage|wall down/.test(text)) tags.push("structure_damage");
      item.tags = Array.from(new Set([...(item.tags||[]), ...tags]));

      inbox.unshift(item);
      broadcast(item);
      res.json({ ok: true, item });
    } catch (e) {
      res.status(500).json({ error: "ingest failed", detail: String(e) });
    }
  });

  // ---- inbox history (poll fallback) ----
  app.get("/api/inbox", (req, res) => res.json(inbox.slice(0, 500)));

  // ---- geocoding endpoint for map functionality (OpenStreetMap Nominatim) ----
  app.get("/api/geocode", async (req, res) => {
    try {
      const address = String(req.query.address || '').trim();
      if (!address) return res.json({});
      
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
      const response = await fetch(url, { 
        headers: { 'User-Agent': 'StormOps/1.0 (contact: strategiclandmgmt@gmail.com)' }
      });
      const arr = await response.json();
      
      if (Array.isArray(arr) && arr.length) {
        return res.json({ 
          lat: Number(arr[0].lat), 
          lng: Number(arr[0].lon), 
          raw: arr[0] 
        });
      }
      res.json({});
    } catch (error) {
      console.error('Geocoding error:', error);
      res.json({});
    }
  });

  // ---- owner lookup seam (plug licensed vendor/county APIs) ----
  app.post("/api/owner-lookup", async (req, res) => {
    const { address, lat, lon } = req.body || {};
    try {
      if (process.env.ESTATED_API_KEY && address) {
        const url = `https://api.estated.com/property/v4?token=${process.env.ESTATED_API_KEY}&address=${encodeURIComponent(address)}`;
        const r = await fetch(url);
        const j = await r.json();
        const p = j?.data?.properties?.[0] || j?.data || {};
        const owner = (p?.owner || (p?.owners && p.owners[0])) || {};
        const contact = p?.mailing_address || p?.mailing || {};
        return res.json({
          ownerName: [owner?.first_name, owner?.last_name].filter(Boolean).join(" ") || owner?.name || null,
          mailingAddress: [contact?.line1, contact?.line2, contact?.city, contact?.state, contact?.zip].filter(Boolean).join(", ") || null,
          phone: null,
          email: null,
          sources: ["Estated"],
        });
      }
      const guessed = address || ((lat && lon) ? await reverseGeocode(lat, lon) : null);
      res.json({ ownerName: null, mailingAddress: guessed, phone: null, email: null, sources: [] });
    } catch (e) {
      res.status(500).json({ error: "lookup_failed", detail: String(e) });
    }
  });

  // ---- uploads (proof of insurance, photos, etc.) ----
  const upload = multer({ dest: UPLOAD_DIR });
  app.post("/api/upload", upload.single("file"), (req, res) => {
    res.json({ ok: true, file: { name: req.file.originalname, path: `/uploads/${req.file.filename}` } });
  });

  // ---- contractor document management ----
  // Get upload URL for contractor documents
  app.post("/api/contractor-documents/upload-url", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Save contractor document metadata after upload
  app.post("/api/contractor-documents", async (req, res) => {
    try {
      const { contractorId, documentType, fileName, fileUrl, title, description } = req.body;
      
      if (!contractorId || !documentType || !fileName || !fileUrl || !title) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(fileUrl);

      // Store in memory for now (would use database in real app)
      const document = {
        id: String(Date.now()),
        contractorId,
        documentType,
        fileName,
        fileUrl: normalizedPath,
        title,
        description: description || "",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Read existing documents
      let documents = [];
      try {
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "contractor-documents.json"), "utf8"));
        documents = data.documents || [];
      } catch {
        // File doesn't exist yet
      }

      documents.push(document);
      
      // Save back to file
      fs.writeFileSync(
        path.join(DATA_DIR, "contractor-documents.json"),
        JSON.stringify({ documents }, null, 2)
      );

      res.json(document);
    } catch (error) {
      console.error("Error saving contractor document:", error);
      res.status(500).json({ error: "Failed to save document" });
    }
  });

  // Get contractor documents
  app.get("/api/contractor-documents/:contractorId", async (req, res) => {
    try {
      const { contractorId } = req.params;
      
      let documents = [];
      try {
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "contractor-documents.json"), "utf8"));
        documents = (data.documents || []).filter(
          (doc: any) => doc.contractorId === contractorId && doc.isActive
        );
      } catch {
        // File doesn't exist yet
      }

      res.json({ documents });
    } catch (error) {
      console.error("Error getting contractor documents:", error);
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  // Serve private contractor documents
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing contractor document:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // ---- SLA tracking endpoints ----
  // Types: claim_submitted → alerts at +30d, +60d; work_completed → lien at +45d; lien_filed → alert at +10mo (~300d, 330d)
  app.post("/api/sla/register", (req, res) => {
    try {
      const { customerId, type, ts = Date.now(), address, name } = req.body || {};
      if (!customerId || !type) return res.status(400).json({ error: 'missing_fields' });
      
      const db = readSLA();
      db.items.push({ 
        id: `${customerId}:${type}:${ts}`, 
        customerId, 
        type, 
        ts: Number(ts), 
        address: address || '', 
        name: name || '' 
      });
      writeSLA(db);
      res.json({ ok: true });
    } catch (error) {
      console.error('SLA registration error:', error);
      res.status(500).json({ error: 'sla_register_failed' });
    }
  });

  app.get("/api/sla/list", (req, res) => {
    try { 
      const db = readSLA(); 
      res.json(db.items || []); 
    } catch (error) { 
      console.error('SLA list error:', error);
      res.status(500).json([]); 
    }
  });

  // ---- Customers API ----
  app.get('/api/customers', (req, res) => { 
    try { 
      res.json(readCustomers().items || []); 
    } catch { 
      res.json([]); 
    } 
  });

  // ---- Lead storage system ----
  const LEADS_PATH = path.join(DATA_DIR, 'leads.json');
  if (!fs.existsSync(LEADS_PATH)) fs.writeFileSync(LEADS_PATH, JSON.stringify({ items: [] }, null, 2));

  function readLeads() { 
    try { 
      return JSON.parse(fs.readFileSync(LEADS_PATH, 'utf8')); 
    } catch { 
      return { items: [] }; 
    } 
  }

  function writeLeads(data: any) { 
    try { 
      fs.writeFileSync(LEADS_PATH, JSON.stringify(data, null, 2)); 
    } catch (e) {
      console.error('Failed to write leads data:', e);
    } 
  }

  // ---- Utility functions for enhanced customers ----
  function normalizeAddressStr(s=''){
    return s.toLowerCase()
      .replace(/\b(ste|unit|apt|suite|#)\b.*$/,'')
      .replace(/[^a-z0-9]/g,'')
      .trim();
  }

  // ---- Customers Panel API Extensions ----
  
  // Search customers with filters (main endpoint)
  app.get('/api/customers', (req, res) => {
    try {
      const { q, status, tags } = req.query;
      const db = readCustomers();
      let results = db.items || [];
      
      // Text search across name, address, phone, email
      if (q) {
        const query = String(q).toLowerCase();
        results = results.filter(c => 
          (c.name || '').toLowerCase().includes(query) ||
          (c.address || '').toLowerCase().includes(query) ||
          (c.phone || '').toLowerCase().includes(query) ||
          (c.email || '').toLowerCase().includes(query)
        );
      }
      
      // Status filter
      if (status && status !== 'all') {
        results = results.filter(c => c.status === status);
      }
      
      // Tags filter
      if (tags) {
        const tagArray = String(tags).split(',').map(t => t.trim().toLowerCase());
        results = results.filter(c => 
          (c.tags || []).some(tag => tagArray.includes(tag.toLowerCase()))
        );
      }
      
      res.json(results);
    } catch (e) {
      res.status(500).json({ error: 'search_failed' });
    }
  });

  // Export customers to CSV
  app.get('/api/customers/export', (req, res) => {
    try {
      const db = readCustomers();
      const customers = db.items || [];
      
      // CSV headers
      const headers = ['ID', 'Name', 'Address', 'Mailing Address', 'Phone', 'Email', 'Insurer', 'Claim Number', 'Status', 'Tags', 'Created'];
      
      // CSV rows
      const rows = customers.map(c => [
        c.id || '',
        c.name || '',
        c.address || '',
        c.mailingAddress || '',
        c.phone || '',
        c.email || '',
        c.insurer || '',
        c.claimNumber || '',
        c.status || '',
        (c.tags || []).join('; '),
        c.timeline?.[0]?.ts ? new Date(c.timeline[0].ts).toISOString() : ''
      ]);
      
      // Generate CSV content
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
      res.send(csvContent);
    } catch (e) {
      res.status(500).json({ error: 'export_failed' });
    }
  });

  // Detect duplicate customers
  app.get('/api/customers/duplicates', (req, res) => {
    try {
      const db = readCustomers();
      const customers = db.items || [];
      const duplicates = [];
      
      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        const matches = [];
        
        for (let j = i + 1; j < customers.length; j++) {
          const other = customers[j];
          const reasons = [];
          
          // Address similarity
          if (customer.address && other.address && 
              normalizeAddressStr(customer.address) === normalizeAddressStr(other.address)) {
            reasons.push('same_address');
          }
          
          // Geospatial proximity (within 25 meters)
          if (typeof customer.lat === 'number' && typeof customer.lng === 'number' &&
              typeof other.lat === 'number' && typeof other.lng === 'number' &&
              haversine(customer.lat, customer.lng, other.lat, other.lng) < 25) {
            reasons.push('same_location');
          }
          
          // Phone similarity
          if (customer.phone && other.phone && 
              customer.phone.replace(/\D/g, '') === other.phone.replace(/\D/g, '')) {
            reasons.push('same_phone');
          }
          
          // Email similarity
          if (customer.email && other.email && 
              customer.email.toLowerCase() === other.email.toLowerCase()) {
            reasons.push('same_email');
          }
          
          if (reasons.length > 0) {
            matches.push({ customer: other, reasons });
          }
        }
        
        if (matches.length > 0) {
          duplicates.push({ customer, matches });
        }
      }
      
      res.json(duplicates);
    } catch (e) {
      res.status(500).json({ error: 'duplicate_detection_failed' });
    }
  });

  // Bulk merge customers
  app.post('/api/customers/merge', express.json(), async (req, res) => {
    try {
      const { primaryId, mergeIds } = req.body;
      if (!primaryId || !Array.isArray(mergeIds) || mergeIds.length === 0) {
        return res.status(400).json({ error: 'invalid_merge_request' });
      }
      
      const db = readCustomers();
      const customers = db.items || [];
      
      const primary = customers.find(c => c.id === primaryId);
      const toMerge = customers.filter(c => mergeIds.includes(c.id));
      
      if (!primary || toMerge.length === 0) {
        return res.status(404).json({ error: 'customers_not_found' });
      }
      
      // Merge data into primary customer
      for (const customer of toMerge) {
        // Merge tags
        primary.tags = Array.from(new Set([...(primary.tags || []), ...(customer.tags || [])]));
        
        // Merge docs
        primary.docs = [...(primary.docs || []), ...(customer.docs || [])];
        
        // Merge messages
        primary.messages = [...(primary.messages || []), ...(customer.messages || [])];
        
        // Merge timeline
        primary.timeline = [...(primary.timeline || []), ...(customer.timeline || [])];
        primary.timeline.push({
          ts: Date.now(),
          type: 'customer_merged',
          text: `Merged customer ${customer.id} (${customer.name || 'Unknown'})`
        });
        
        // Update contact info if missing
        if (!primary.phone && customer.phone) primary.phone = customer.phone;
        if (!primary.email && customer.email) primary.email = customer.email;
        if (!primary.insurer && customer.insurer) primary.insurer = customer.insurer;
        if (!primary.claimNumber && customer.claimNumber) primary.claimNumber = customer.claimNumber;
        if (!primary.mailingAddress && customer.mailingAddress) primary.mailingAddress = customer.mailingAddress;
      }
      
      // Remove merged customers
      db.items = customers.filter(c => !mergeIds.includes(c.id));
      writeCustomers(db);
      
      // Broadcast merge event
      sseBroadcast({ 
        type: 'customers_merged', 
        primaryId, 
        mergedIds: mergeIds,
        customer: primary 
      });
      
      res.json({ ok: true, customer: primary, mergedCount: mergeIds.length });
    } catch (e) {
      res.status(500).json({ error: 'merge_failed', detail: String(e) });
    }
  });

  // Merge helpers
  function mergeCustomers(customers, primaryId){
    const byId = new Map(customers.map(c=>[c.id,c]));
    const primary = byId.get(primaryId) || customers[0];
    for (const c of customers){
      if (c.id===primary.id) continue;
      primary.docs = [...(primary.docs||[]), ...(c.docs||[])];
      primary.messages = [...(primary.messages||[]), ...(c.messages||[])];
      primary.timeline = [...(primary.timeline||[]), ...(c.timeline||[]), { ts: Date.now(), type:'merged', text:`Merged ${c.id}` }].sort((a,b)=>a.ts-b.ts);
      primary.tags = Array.from(new Set([...(primary.tags||[]), ...(c.tags||[])]));
      primary.phone = primary.phone || c.phone;
      primary.email = primary.email || c.email;
      primary.insurer = primary.insurer || c.insurer;
      primary.claimNumber = primary.claimNumber || c.claimNumber;
      primary.mailingAddress = primary.mailingAddress || c.mailingAddress;
      // Prefer precise lat/lng
      if (typeof c.lat==='number' && typeof c.lng==='number'){ primary.lat = primary.lat??c.lat; primary.lng = primary.lng??c.lng; }
    }
    return primary;
  }

  // Update customer
  app.post('/api/customers/update', express.json(), (req, res) => {
    try {
      const { id, patch } = req.body || {};
      if (!id || !patch) return res.status(400).json({ error: 'missing' });
      
      const db = readCustomers();
      const c = (db.items || []).find(x => x.id === id);
      if (!c) return res.status(404).json({ error: 'not_found' });
      
      Object.assign(c, patch);
      c.timeline = c.timeline || [];
      c.timeline.push({ ts: Date.now(), type: 'update', text: Object.keys(patch).join(', ') });
      
      writeCustomers(db);
      sseBroadcast({ type: 'customer_updated', customer: c });
      
      res.json({ ok: true, customer: c });
    } catch (e) {
      res.status(500).json({ ok: false });
    }
  });

  // Delete customers (bulk)
  app.post('/api/customers/delete', express.json(), (req, res) => {
    try {
      const ids = req.body?.ids || [];
      if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids_required' });
      
      const db = readCustomers();
      db.items = (db.items || []).filter(c => !ids.includes(c.id));
      
      writeCustomers(db);
      sseBroadcast({ type: 'customers_deleted', ids });
      
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false });
    }
  });

  // Dedupe scan
  app.get('/api/customers/dedupe-scan', (req, res) => {
    try {
      const radius = Number(req.query.radius || 40); // meters
      const db = readCustomers();
      const items = db.items || [];
      
      // Address groups
      const byAddr = new Map();
      for (const c of items) {
        const k = normalizeAddressStr(c.address || '');
        if (!k) continue;
        if (!byAddr.has(k)) byAddr.set(k, []);
        byAddr.get(k).push(c);
      }
      const addrClusters = [...byAddr.values()].filter(g => g.length > 1).map(g => ({ reason: 'address', items: g }));
      
      // Proximity clusters
      const proxClusters = [];
      const used = new Set();
      for (let i = 0; i < items.length; i++) {
        if (used.has(items[i].id)) continue;
        const cluster = [items[i]];
        for (let j = i + 1; j < items.length; j++) {
          if (used.has(items[j].id)) continue;
          if (typeof items[i].lat === 'number' && typeof items[i].lng === 'number' &&
              typeof items[j].lat === 'number' && typeof items[j].lng === 'number') {
            const d = haversine(items[i].lat, items[i].lng, items[j].lat, items[j].lng);
            if (d <= radius) {
              cluster.push(items[j]);
              used.add(items[j].id);
            }
          }
        }
        if (cluster.length > 1) proxClusters.push({ reason: `radius_${radius}m`, items: cluster });
      }
      
      res.json({ address: addrClusters, proximity: proxClusters });
    } catch (e) {
      res.status(500).json({ address: [], proximity: [] });
    }
  });

  // Bulk merge
  app.post('/api/customers/bulk-merge', express.json(), (req, res) => {
    try {
      const { strategy = 'address', radius = 40 } = req.body || {};
      const db = readCustomers();
      let clusters = [];
      
      if (strategy === 'address') {
        const byAddr = new Map();
        for (const c of (db.items || [])) {
          const k = normalizeAddressStr(c.address || '');
          if (!k) continue;
          if (!byAddr.has(k)) byAddr.set(k, []);
          byAddr.get(k).push(c);
        }
        clusters = [...byAddr.values()].filter(g => g.length > 1).map(g => ({ items: g }));
      } else if (strategy === 'radius') {
        const items = db.items || [];
        const used = new Set();
        for (let i = 0; i < items.length; i++) {
          if (used.has(items[i].id)) continue;
          const cluster = [items[i]];
          for (let j = i + 1; j < items.length; j++) {
            if (used.has(items[j].id)) continue;
            if (typeof items[i].lat === 'number' && typeof items[i].lng === 'number' &&
                typeof items[j].lat === 'number' && typeof items[j].lng === 'number') {
              const d = haversine(items[i].lat, items[i].lng, items[j].lat, items[j].lng);
              if (d <= Number(radius)) {
                cluster.push(items[j]);
                used.add(items[j].id);
              }
            }
          }
          if (cluster.length > 1) clusters.push({ items: cluster });
        }
      }
      
      // Perform merges per cluster (choose most complete as primary)
      const choosePrimary = (arr) => arr.slice().sort((a, b) => (b.docs?.length || 0) - (a.docs?.length || 0) || (b.timeline?.length || 0) - (a.timeline?.length || 0))[0];
      for (const cl of clusters) {
        const ids = cl.items.map(x => x.id);
        if (ids.length < 2) continue;
        const primaryId = choosePrimary(cl.items).id;
        const group = (db.items || []).filter(c => ids.includes(c.id));
        const merged = mergeCustomers(group, primaryId);
        db.items = [merged, ...db.items.filter(c => !ids.includes(c.id) || c.id === merged.id)]
          .filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);
      }
      
      writeCustomers(db);
      res.json({ ok: true, mergedGroups: clusters.length });
    } catch (e) {
      res.status(500).json({ ok: false });
    }
  });

  // ---- Leads API ----
  app.get('/api/leads', (req, res) => { 
    try { 
      res.json(readLeads().items.slice(-200).reverse()); 
    } catch { 
      res.json([]); 
    } 
  });

  // ---- Enhanced leads accept with owner enrichment and auto-merge ----
  app.post('/api/leads/accept', async (req, res) => {
    try {
      const { id } = req.body || {}; 
      if (!id) return res.status(400).json({ error: 'id_required' });
      
      const leadsDb = readLeads(); 
      const idx = (leadsDb.items || []).findIndex((x: any) => x.id === id);
      if (idx < 0) return res.status(404).json({ error: 'not_found' });
      
      const lead = leadsDb.items[idx]; 
      leadsDb.items.splice(idx, 1); 
      writeLeads(leadsDb);

      // Ensure address exists (reverse geocode if needed)
      let address = lead.address; 
      if (!address) { 
        address = await reverseGeocode(lead.lat, lead.lng); 
      }

      // Owner enrichment
      const enrich = await ownerLookup(address);

      // Auto-merge check
      const custDb = readCustomers();
      const byAddr = (custDb.items || []).find((c: any) => 
        normalizeAddressStr(c.address || '') === normalizeAddressStr(address || '')
      );
      let mergedInto = null;
      
      if (byAddr) { 
        mergedInto = byAddr; 
      }
      
      if (!mergedInto) {
        const near = (custDb.items || []).find((c: any) => 
          typeof c.lat === 'number' && typeof c.lng === 'number' && 
          haversine(c.lat, c.lng, lead.lat, lead.lng) < 40
        );
        if (near) mergedInto = near;
      }

      let finalCustomer = null;
      
      if (mergedInto) {
        // Merge: append tags/image to docs/timeline
        mergedInto.timeline = mergedInto.timeline || [];
        mergedInto.timeline.push({ 
          ts: Date.now(), 
          type: 'lead_merged', 
          text: `Merged lead ${lead.id} (${(lead.tags || []).join(', ')})` 
        });
        mergedInto.docs = mergedInto.docs || [];
        if (lead.image) {
          mergedInto.docs.push({ 
            name: `lead_${Date.now()}.jpg`, 
            url: lead.image, 
            caption: (lead.tags || []).join(', ') 
          });
        }
        mergedInto.tags = Array.from(new Set([...(mergedInto.tags || []), ...(lead.tags || [])]));
        
        if (enrich) {
          mergedInto.name = mergedInto.name && mergedInto.name !== 'Unknown Owner' ? mergedInto.name : (enrich.ownerName || mergedInto.name);
          if (enrich.mailingAddress) mergedInto.mailingAddress = enrich.mailingAddress;
        }
        
        finalCustomer = mergedInto;
        writeCustomers(custDb);
        
        // Broadcast merge event
        broadcast({ type: 'customer_merged', customerId: mergedInto.id, fromLead: lead.id });
        return res.json({ ok: true, merged: true, customer: mergedInto });
      }

      // Create new customer scaffold
      const customer = {
        id: `c:${Date.now()}:${Math.random().toString(36).slice(2, 6)}`,
        name: enrich?.ownerName || 'Unknown Owner',
        mailingAddress: enrich?.mailingAddress || null,
        address: address || `${lead.lat}, ${lead.lng}`,
        lat: lead.lat, 
        lng: lead.lng,
        phone: '', 
        email: '',
        insurer: '', 
        claimNumber: '',
        status: 'new',
        tags: lead.tags || [],
        docs: lead.image ? [{ 
          name: `lead_${Date.now()}.jpg`, 
          url: lead.image, 
          caption: (lead.tags || []).join(', ') 
        }] : [],
        messages: [],
        timeline: [{ 
          ts: Date.now(), 
          type: 'lead_accepted', 
          text: `From ${lead.provider || 'drone'}; tags: ${(lead.tags || []).join(', ')}` 
        }]
      };
      
      custDb.items.push(customer); 
      writeCustomers(custDb);
      finalCustomer = customer;

      // Broadcast new customer
      broadcast({ type: 'customer_created', customer: finalCustomer });

      return res.json({ ok: true, created: true, customer: finalCustomer });
    } catch (e) { 
      res.status(500).json({ error: 'accept_failed', detail: String(e) }); 
    }
  });

  // ---- serve contract PDF from ./assets/contract.pdf ----
  app.get("/files/contract.pdf", (req, res) => {
    const guess = path.join(ASSETS_DIR, "contract.pdf");
    if (fs.existsSync(guess)) return res.sendFile(guess);
    return res.status(404).send("Contract file not found — place it at ./assets/contract.pdf");
  });

  // ---- Twilio SMS + Voice ----
  app.post("/api/sms", async (req, res) => {
    try {
      const { to, body } = req.body || {};
      if (!tw) return res.status(500).json({ error: "Twilio not configured" });
      if (!to || !body) return res.status(400).json({ error: "to and body required" });
      const r = await tw.messages.create({ to, from: process.env.TWILIO_FROM, body });
      res.json({ ok: true, sid: r.sid });
    } catch (e) {
      res.status(500).json({ error: "SMS failed", detail: String(e) });
    }
  });

  app.post("/api/call", async (req, res) => {
    try {
      const { to, twiml } = req.body || {};
      if (!tw) return res.status(500).json({ error: "Twilio not configured" });
      if (!to) return res.status(400).json({ error: "to required" });
      const r = await tw.calls.create({
        to,
        from: process.env.TWILIO_FROM,
        twiml: twiml || `<Response><Say voice="alice">This is Strategic Land Management calling regarding your storm damage. Please call us at ${process.env.PUBLIC_PHONE || '888-628-2229'}.</Say></Response>`
      });
      res.json({ ok: true, sid: r.sid });
    } catch (e) {
      res.status(500).json({ error: "Call failed", detail: String(e) });
    }
  });

  // ---- Email (Nodemailer SMTP) ----
  app.post("/api/email", async (req, res) => {
    try {
      if (!transporter) return res.status(500).json({ error: "Email transport not configured" });
      let { to, subject, html, attachments, claimNumber } = req.body || {};
      if (!to || !subject) return res.status(400).json({ error: "to and subject required" });
      if (claimNumber && subject.toUpperCase().indexOf('[CLAIM ') === -1) subject = `[CLAIM ${claimNumber}] ` + subject;

      // Map public paths to filesystem paths for attachments (uploads/assets),
      // or accept absolute URLs.
      const mapAttach = (att) => {
        if (!att || !att.path) return att;
        try{
          let p = att.path;
          if (p.startsWith('/uploads/')) p = path.join(UPLOAD_DIR, path.basename(p));
          else if (p.startsWith('uploads/')) p = path.join(UPLOAD_DIR, path.basename(p));
          else if (p === '/files/contract.pdf') p = path.join(ASSETS_DIR, 'contract.pdf');
          // otherwise allow absolute URLs or direct fs paths
          return { ...att, path: p };
        }catch{ return att; }
      };
      const atts = Array.isArray(attachments) ? attachments.map(mapAttach) : undefined;

      const info = await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html: html || "", attachments: atts });
      if (claimNumber) addMessage(claimNumber, { dir: 'out', to, subject, html });
      res.json({ ok: true, id: info.messageId });
    } catch (e) { res.status(500).json({ error: "Email failed", detail: String(e) }); }
  });

  // ---- Inbound email webhook (use SendGrid Inbound Parse, Mailgun Routes, or Gmail relay) ----
  app.post("/api/email/inbound", express.json({limit:'2mb'}), async (req, res) => {
    try{
      const { from, to, subject, html, text } = req.body || {};
      const claimNumber = extractClaim(`${subject}\n${text||''}`) || extractClaim(html||'');
      if (claimNumber) addMessage(claimNumber, { dir:'in', from, to, subject, html, text });
      res.json({ ok: true, claimNumber: claimNumber || null });
    } catch(e){ res.status(500).json({ error:'inbound_failed', detail:String(e) }); }
  });

  // ---- Messages fetch by claim number ----
  app.get('/api/messages', (req, res) => {
    const claim = req.query.claim || req.query.claimNumber;
    const arr = (claim && messagesByClaim.get(claim)) || [];
    res.json(arr.slice(-200));
  });

  // ---- Stripe invoice/checkout ----
  app.post('/api/invoice/checkout', async (req, res) => {
    try{
      if (!stripe) return res.status(500).json({ error:'Stripe not configured' });
      const { customer, lineItems, metadata } = req.body || {};
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: customer?.email,
        metadata: metadata || {},
        line_items: (lineItems||[]).map(li => ({
          price_data: { currency:'usd', product_data:{ name: li.name || 'Service' }, unit_amount: Math.round(Number(li.amount||0)*100) },
          quantity: li.quantity || 1,
        })),
        success_url: process.env.PAY_SUCCESS_URL || 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: process.env.PAY_CANCEL_URL || 'https://example.com/cancel'
      });
      res.json({ ok:true, url: session.url, id: session.id });
    }catch(e){ res.status(500).json({ error:'stripe_checkout_failed', detail:String(e) }); }
  });

  // ---- PDF brochure generator (tri-fold, landscape letter) ----
  app.post('/api/brochure/strategic', async (req, res) => {
    try{
      const outPath = path.join(UPLOAD_DIR, `brochure_strategic_${Date.now()}.pdf`);
      const doc = new PDFDocument({ size: 'LETTER', layout: 'landscape', margin: 36 });
      const stream = fs.createWriteStream(outPath); doc.pipe(stream);
      const W = 792 - 72; // width minus margins
      const colW = W/3; const x0 = 36, y0 = 36;
      doc.fontSize(22).text('Strategic Land Management LLC — Emergency Storm Response', x0, y0, { width: W, align: 'center' });
      doc.moveDown(0.5).fontSize(12).text('📞 888-628-2229    🌐 www.strategiclandmgmt.com    ✉️ strategiclandmgmt@gmail.com', { align: 'center' });

      function col(n){ return x0 + n*colW; }
      doc.moveDown(1);
      // Column 1
      doc.fontSize(14).text('❤️ Our Mission', col(0), 120, { width: colW-12, continued:false });
      doc.fontSize(11).text('When storms strike, we respond quickly, work compassionately, and restore safety with as little financial burden as possible.');
      doc.moveDown(0.5).fontSize(14).text('🌳 Who We Are');
      doc.fontSize(11).text('Veteran-Owned & Disabled-Owned • Led by John Culpepper, certified arborist. Licensed, bonded, insured. CPR & line-clearance certified.');
      doc.moveDown(0.5).fontSize(12).text('Equipment: 2 Cranes • 10 Bucket Trucks • 3 Skid Steers • Trained Emergency Crew');

      // Column 2
      doc.fontSize(14).text('🏠 Tree Removal — Little to No Cost', col(1), 120, { width: colW-12 });
      doc.fontSize(11).text('Scan the QR → Sign digitally → We remove & bill insurance. No surprise costs. You focus on family—we focus on recovery.', { width: colW-12 });
      doc.moveDown(0.5).fontSize(14).text('💵 Storm Relief Action Plan');
      doc.fontSize(11).text('Insurance Billing • SBA/FEMA guidance • Flexible payments • Community partners', { width: colW-12 });
      doc.moveDown(0.25).fontSize(11).text('SBA Disaster Loans: Homeowners up to $500k; Renters up to $100k; Businesses up to $2M; Nonprofits eligible.');

      // Column 3
      doc.fontSize(14).text('⏱ Recovery Made Simple', col(2), 120, { width: colW-12 });
      doc.fontSize(11).text('Call 24/7 → We assess → We assist paperwork → We remove trees → You recover.', { width: colW-12 });
      doc.moveDown(0.5).fontSize(14).text('Why Choose Us?');
      doc.fontSize(11).text('20+ years • Veteran-owned • Licensed/bonded/insured • Compassionate & cost-conscious.', { width: colW-12 });
      doc.moveDown(0.5).fontSize(12).text('Scan for Priority Contract');
      doc.rect(col(2)+10, doc.y+5, 100, 100).stroke();

      doc.end();
      stream.on('finish', ()=> res.json({ ok:true, path: `/uploads/${path.basename(outPath)}` }));
    }catch(e){ res.status(500).json({ error:'brochure_failed', detail:String(e) }); }
  });

  // ---- Photo Report (PDF) generator ----
  app.post('/api/report/photo', async (req, res) => {
    try{
      const { claimNumber, address, customerName, contractor, photos = [], title } = req.body || {};
      if (!photos.length) return res.status(400).json({ error:'no_photos' });
      const outPath = path.join(UPLOAD_DIR, `photo_report_${Date.now()}.pdf`);
      const doc = new PDFDocument({ size: 'LETTER', margin: 36 });
      const stream = fs.createWriteStream(outPath); doc.pipe(stream);

      // Header
      doc.fontSize(18).text(title || 'Storm Damage Photo Report');
      doc.moveDown(0.3).fontSize(11).text(`Customer: ${customerName||''}`);
      if (address) doc.fontSize(11).text(`Address: ${address}`);
      if (claimNumber) doc.fontSize(11).text(`Claim #: ${claimNumber}`);
      if (contractor) doc.moveDown(0.3).fontSize(10).text(`Prepared by: ${contractor.name||''} • ${contractor.phone||''} • ${contractor.website||''}`);
      doc.moveDown(0.5);

      // Helper to convert public URL → local fs path or remote fetch
      const toFs = (u) => {
        try{
          if (!u) return null;
          if (u.startsWith('/uploads/')) return path.join(UPLOAD_DIR, path.basename(u));
          if (u.startsWith('uploads/')) return path.join(UPLOAD_DIR, path.basename(u));
          if (/^https?:\/\//i.test(u)) return u; // will fetch
          return u;
        }catch{return null;}
      };

      for (let i=0;i<photos.length;i++){
        const { url, note } = photos[i];
        const src = toFs(url);
        if (i>0) doc.addPage();
        let placed = false;
        try{
          if (/^https?:/i.test(src)){
            const r = await fetch(src);
            const buf = Buffer.from(await r.arrayBuffer());
            doc.image(buf, { fit: [540, 540], align: 'center', valign:'center' });
            placed = true;
          } else {
            doc.image(src, { fit: [540, 540], align: 'center', valign:'center' });
            placed = true;
          }
        }catch{}
        doc.moveDown(placed?0.5:0);
        const cap = note || 'Detected: storm damage';
        doc.fontSize(11).text(cap);
      }

      doc.end();
      stream.on('finish', ()=> res.json({ ok:true, path: `/uploads/${path.basename(outPath)}` }));
    }catch(e){ res.status(500).json({ error:'photo_report_failed', detail:String(e) }); }
  });

  // === Simple damage detection heuristics (placeholder AI) ===
  function detectLabels({ name='', url='', note='' }){
    const text = `${name} ${url} ${note}`.toLowerCase();
    const tags = new Set();
    if (/tree[^a-z]?on[^a-z]?(roof|home|house|building|structure)/.test(text)) tags.add('tree_on_roof');
    if (/line[^a-z]?(down|damaged)|power[^a-z]?line|utility[^a-z]?line|pole[^a-z]?down/.test(text)) tags.add('line_down');
    if (/collapse|structur(al|e)\s?damage|wall\s?down|building\s?damage/.test(text)) tags.add('structure_damage');
    if (/fence/.test(text)) tags.add('tree_on_fence');
    if (/car|vehicle|truck/.test(text)) tags.add('tree_on_car');
    if (/barn/.test(text)) tags.add('tree_on_barn');
    if (/shed/.test(text)) tags.add('tree_on_shed');
    if (/pool/.test(text)) tags.add('tree_in_pool');
    if (/playground|play\s?set/.test(text)) tags.add('tree_on_playground');
    const caption = tags.size ? `Detected: ${[...tags].join(', ')}` : 'Detected: storm damage';
    return { caption, tags: [...tags] };
  }

  app.post('/api/describe', async (req, res) => {
    try{ const out = detectLabels(req.body||{}); return res.json(out); }catch(e){ return res.status(500).json({ error:'describe_failed' }); }
  });

  app.post('/api/describe/batch', async (req, res) => {
    try{
      const photos = req.body?.photos || [];
      const results = photos.map(p => ({ ...p, ...detectLabels(p) }));
      res.json({ ok:true, results });
    }catch(e){ res.status(500).json({ error:'describe_batch_failed' }); }
  });

  // === Claim Package: build summary PDF + email with attachments ===
  app.post('/api/claim/package', async (req, res) => {
    try{
      if (!transporter) return res.status(500).json({ error:'email_not_configured' });
      const { to, claimNumber, address, customerName, contractor, attachments = [], invoice } = req.body || {};
      if (!to) return res.status(400).json({ error:'to_required' });

      const outPath = path.join(UPLOAD_DIR, `claim_package_${Date.now()}.pdf`);
      const doc = new PDFDocument({ size:'LETTER', margin:36 });
      const stream = fs.createWriteStream(outPath); doc.pipe(stream);

      doc.fontSize(18).text('Claim Package Summary');
      if (claimNumber) doc.moveDown(0.3).fontSize(11).text(`Claim #: ${claimNumber}`);
      if (customerName) doc.fontSize(11).text(`Customer: ${customerName}`);
      if (address) doc.fontSize(11).text(`Address: ${address}`);
      if (contractor) doc.moveDown(0.3).fontSize(10).text(`Prepared by: ${contractor.name||''} • ${contractor.phone||''} • ${contractor.website||''}`);

      if (invoice && Array.isArray(invoice.items)){
        doc.moveDown().fontSize(12).text('Invoice');
        invoice.items.forEach(it=> doc.fontSize(10).text(`• ${it.name||'Service'} — $${Number(it.amount||0).toFixed(2)} x ${Number(it.quantity||1)} `));
        doc.moveDown(0.2).fontSize(10).text(`Tax %: ${Number(invoice.taxRate||0)}%`);
        doc.fontSize(11).text(`Subtotal: $${Number(invoice.subtotal||0).toFixed(2)}  |  Total: $${Number(invoice.total||0).toFixed(2)}`);
      }

      if (attachments?.length){
        doc.moveDown().fontSize(12).text('Attachments');
        attachments.forEach((u,i)=> doc.fontSize(10).text(`${i+1}. ${u}`));
      }

      doc.end();
      await new Promise(resolve => stream.on('finish', resolve));

      // Map public paths to FS for attachments; keep URLs as-is
      const mapAttach = (p) => {
        try{
          if (p.startsWith('/uploads/')) return path.join(UPLOAD_DIR, path.basename(p));
          if (p.startsWith('uploads/')) return path.join(UPLOAD_DIR, path.basename(p));
          if (p === '/files/contract.pdf') return path.join(ASSETS_DIR, 'contract.pdf');
          return p; // remote URL or fs path
        }catch{ return p; }
      };

      const maxAttach = 10; // avoid huge emails
      const emailAttachments = [
        { filename: 'Claim_Package_Summary.pdf', path: outPath },
        ...attachments.slice(0, maxAttach).map(p => ({ path: mapAttach(p) }))
      ];

      const subject = `${claimNumber?`[CLAIM ${claimNumber}] `:''}Package for ${address||'property'}`;
      const html = `Please find attached the claim package summary for ${address||'the property'}. Additional files are listed and attached when possible.`;

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        cc: 'strategiclandmgmt@gmail.com',
        subject,
        html,
        attachments: emailAttachments
      });

      res.json({ ok:true, id: info.messageId, summaryPath: `/uploads/${path.basename(outPath)}` });
    }catch(e){ res.status(500).json({ error:'claim_package_failed', detail:String(e) }); }
  });

  // ---- Notification helpers for SLA alerts ----
  async function notify({ subject, html, sms }: { subject: string; html: string; sms?: string }) {
    try {
      if (typeof transporter !== 'undefined' && transporter) {
        await transporter.sendMail({ 
          from: process.env.SMTP_FROM || process.env.SMTP_USER, 
          to: process.env.ALERT_TO || 'strategiclandmgmt@gmail.com', 
          subject, 
          html 
        });
      }
    } catch (e) {
      console.error('Email notification failed:', e);
    }
    
    try {
      if (typeof tw !== 'undefined' && tw && process.env.ALERT_SMS_TO) {
        await tw.messages.create({ 
          to: process.env.ALERT_SMS_TO, 
          from: process.env.TWILIO_FROM, 
          body: sms || subject 
        });
      }
    } catch (e) {
      console.error('SMS notification failed:', e);
    }
  }

  function daysBetween(a: number, b: number) { 
    return Math.floor((b - a) / 86400000); 
  }

  // ---- Daily SLA scan at 09:00 America/New_York ----
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily SLA check...');
    const db = readSLA(); 
    const now = Date.now();
    
    for (const item of db.items) {
      const days = daysBetween(Number(item.ts), now);
      
      if (item.type === 'claim_submitted' && (days === 30 || days === 60)) {
        await notify({ 
          subject: `[SLA] Claim follow-up ${days} days — ${item.address}`, 
          html: `Claim follow-up at ${days} days for ${item.name || 'Customer'}<br/>Address: ${item.address}` 
        });
      }
      
      if (item.type === 'work_completed' && days === 45) {
        await notify({ 
          subject: `[SLA] File lien (45 days) — ${item.address}`, 
          html: `Work completed 45 days ago for ${item.name || 'Customer'}. Consider filing lien if unpaid.<br/>Address: ${item.address}` 
        });
      }
      
      if (item.type === 'lien_filed' && (days === 300 || days === 330)) {
        await notify({ 
          subject: `[SLA] Lien age ${days} days — ${item.address}`, 
          html: `Lien filed ${days} days ago for ${item.name || 'Customer'}. Check state deadlines.<br/>Address: ${item.address}` 
        });
      }
    }
  }, {
    timezone: 'America/New_York'
  });

  // ---- Quick links to lien services ----
  app.get('/api/lien/links', (req, res) => {
    res.json({ 
      links: [
        { name: 'LienIt', url: 'https://www.lienit.com/' },
        { name: 'LienItNow', url: 'https://www.lienitnow.com/' }
      ]
    });
  });

  // ---- Reminders (claim 30/60d; completion 45d; lien 10mo) ----
  app.post("/api/reminders", (req, res) => {
    const { claimDate, completeDate, lienDate } = req.body || {};
    const addDays = (start, d) => new Date(new Date(start).getTime() + d * 86400000).toISOString();
    if (claimDate) {
      scheduleAt(addDays(claimDate, 30), "30 days since claim submission");
      scheduleAt(addDays(claimDate, 60), "60 days since claim submission");
    }
    if (completeDate) scheduleAt(addDays(completeDate, 45), "45 days since work completion (consider lien)");
    if (lienDate) {
      const tenMonthsMs = 1000 * 60 * 60 * 24 * 30 * 10; // approx 10 months
      scheduleAt(new Date(new Date(lienDate).getTime() + tenMonthsMs).toISOString(), "10 months since lien filed");
    }
    res.json({ ok: true });
  });

  // ==== Drone Webhooks + SSE Live Feed ====
  const DRONE_PATH = path.join(DATA_DIR, 'drone_events.json');
  if (!fs.existsSync(DRONE_PATH)) fs.writeFileSync(DRONE_PATH, JSON.stringify({ events: [] }, null, 2));

  function readDrone() { 
    try { 
      return JSON.parse(fs.readFileSync(DRONE_PATH, 'utf8')); 
    } catch { 
      return { events: [] }; 
    } 
  }
  
  function writeDrone(d: any) { 
    try { 
      fs.writeFileSync(DRONE_PATH, JSON.stringify(d, null, 2)); 
    } catch (e) {
      console.error('Failed to write drone data:', e);
    } 
  }

  // Normalizer: accepts payloads from VOTIX, FlytBase, DJI FlightHub2, DroneDeploy (or custom)
  function detectLabelsFromText(text = '') {
    const t = (text || '').toLowerCase();
    const tags = new Set<string>();
    if (/tree[^a-z]?on[^a-z]?(roof|home|house|building|structure)/.test(t)) tags.add('tree_on_roof');
    if (/line[^a-z]?(down|damaged)|power[^a-z]?line|utility[^a-z]?line|pole[^a-z]?down/.test(t)) tags.add('line_down');
    if (/collapse|structur(al|e)\s?damage|wall\s?down|building\s?damage/.test(t)) tags.add('structure_damage');
    if (/fence/.test(t)) tags.add('tree_on_fence');
    if (/car|vehicle|truck/.test(t)) tags.add('tree_on_car');
    if (/barn/.test(t)) tags.add('tree_on_barn');
    if (/shed/.test(t)) tags.add('tree_on_shed');
    if (/pool/.test(t)) tags.add('tree_in_pool');
    if (/playground|play\s?set/.test(t)) tags.add('tree_on_playground');
    return [...tags];
  }

  async function geocodeAddress(address: string) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
      const r = await fetch(url, { headers: { 'User-Agent': 'StormOps/1.0 (contact: strategiclandmgmt@gmail.com)' } });
      const arr = await r.json();
      if (Array.isArray(arr) && arr.length) {
        return { lat: Number(arr[0].lat), lng: Number(arr[0].lon), address: address };
      }
    } catch (e) {
      console.error('Geocoding failed:', e);
    }
    return null;
  }

  async function normalizeDroneEvent(body: any) {
    const now = Date.now();
    const provider = body.provider || body.vendor || body.source || 'unknown';
    const droneId = body.droneId || body.uav_id || body.aircraft || body.device_id || null;
    const mission = body.mission || body.mission_id || body.job || body.project || null;
    const ts = Number(body.ts || body.timestamp || body.time || now);
    const img = body.image || body.image_url || body.snapshot || null;
    const stream = body.stream || body.stream_url || body.hls || body.hls_url || body.rtmp || body.rtmp_url || null;
    let lat = body.lat || body.latitude || body.location?.lat || body.position?.lat || null;
    let lng = body.lng || body.lon || body.long || body.longitude || body.location?.lng || body.location?.lon || body.position?.lng || body.position?.lon || null;
    let address = body.address || body.location?.address || body.addr || null;

    // Tags: prefer explicit, else infer from labels/notes
    let tags = Array.isArray(body.tags) ? body.tags : [];
    if (!tags.length) {
      const labelText = [body.caption, body.note, body.notes, (body.labels || []).join(' '), (body.objects || []).join(' ')].filter(Boolean).join(' ');
      tags = detectLabelsFromText(labelText);
    }

    // If we have address but no lat/lng → geocode; if we have lat/lng, keep.
    if ((!lat || !lng) && address) {
      const geo = await geocodeAddress(address);
      if (geo) { lat = geo.lat; lng = geo.lng; }
    }

    // Drop if no coordinates
    if (!lat || !lng) return null;

    return {
      id: `drone:${now}:${Math.random().toString(36).slice(2, 8)}`,
      provider, droneId, mission,
      lat: Number(lat), lng: Number(lng), address: address || null,
      tags, image: img, stream,
      ts
    };
  }

  // --- SSE stream for live events ---
  const sseClients = new Set<any>();
  app.get('/api/drone/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ type: 'hello', ts: Date.now() })}\n\n`);
    sseClients.add(res);
    req.on('close', () => { try { sseClients.delete(res); } catch {} });
  });
  
  function sseBroadcast(evt: any) {
    const data = `data: ${JSON.stringify(evt)}\n\n`;
    for (const res of sseClients) { try { res.write(data); } catch {} }
  }

  // ====== Haversine distance calculation ======
  function haversine(aLat: number, aLng: number, bLat: number, bLng: number) {
    const R = 6371000; // Earth radius in meters
    const toRad = (d: number) => d * Math.PI / 180;
    const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  // ====== VOTIX-specific mapping ======
  function fromVotix(body: any) {
    const c = body.coordinates || body.location || {};
    const lat = body.lat || c.lat || c.latitude;
    const lng = body.lng || body.lon || c.lon || c.longitude;
    const stream = body.hlsUrl || body.hls || body.stream_url || body.rtmpUrl || body.rtmp;
    const image = body.thumbnail || body.image_url || body.snapshot;
    const labels = body.labels || body.classifications || [];
    const address = body.address || body.addr || (body.location && body.location.address) || null;
    return {
      provider: 'votix',
      droneId: body.vehicleId || body.uav_id || body.droneId,
      mission: body.missionId || body.mission || body.project,
      lat, lng, address, stream, image,
      tags: Array.isArray(labels) ? labels : [],
      ts: Number(body.timestamp || body.ts || Date.now())
    };
  }

  // ====== Provider-aware drone event normalizer ======
  async function normalizeDroneEventProviderAware(body: any) {
    let base;
    const p = (body.provider || body.vendor || body.source || '').toString().toLowerCase();
    if (p.includes('votix')) {
      base = fromVotix(body);
    }
    if (!base) {
      // Fall back to existing generic normalizer
      base = await normalizeDroneEvent(body);
    }
    if (!base) return null;
    
    // Ensure tags from text if tags empty
    if (!base.tags || !base.tags.length) {
      const text = [body.caption, body.note, body.notes, (body.labels || []).join(' '), (body.objects || []).join(' ')].filter(Boolean).join(' ');
      base.tags = detectLabelsFromText(text);
    }
    // Fill missing address
    if ((!base.address || base.address === 'null') && base.lat && base.lng) {
      base.address = await reverseGeocode(base.lat, base.lng);
    }
    return base;
  }

  // ====== Auto-lead creation from drone events ======
  async function ensureLeadFromEvent(evt: any) {
    // Only create leads when we have damage tags
    if (!evt || !evt.tags || !evt.tags.length) return null;
    const db = readLeads();
    const now = Date.now();
    // Deduplicate near-duplicates: within 25m and 6 hours
    const near = (db.items || []).find((x: any) => haversine(x.lat, x.lng, evt.lat, evt.lng) < 25 && (now - x.createdAt) < 6 * 3600 * 1000);
    if (near) return null;
    const lead = {
      id: `lead:${now}:${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      provider: evt.provider,
      mission: evt.mission || null,
      droneId: evt.droneId || null,
      lat: evt.lat, 
      lng: evt.lng,
      address: evt.address || null,
      tags: evt.tags,
      image: evt.image || null,
      stream: evt.stream || null
    };
    db.items.push(lead); 
    writeLeads(db);
    // Broadcast via SSE
    sseBroadcast({ type: 'lead', lead });
    return lead;
  }

  // --- Webhook receiver ---
  app.post('/api/drone/webhook', express.json({ limit: '5mb' }), async (req, res) => {
    try {
      const secret = process.env.DRONE_WEBHOOK_SECRET;
      if (secret && req.headers['x-drone-secret'] !== secret) return res.status(401).json({ error: 'unauthorized' });
      const evt = await normalizeDroneEventProviderAware(req.body || {});
      if (!evt) return res.status(400).json({ error: 'invalid_payload' });
      const db = readDrone();
      db.events.push(evt); 
      writeDrone(db);
      sseBroadcast({ type: 'drone_event', event: evt });
      // Auto-create lead from drone event
      await ensureLeadFromEvent(evt);
      res.json({ ok: true });
    } catch (e) { 
      res.status(500).json({ error: 'webhook_failed', detail: String(e) }); 
    }
  });

  // Convenience: list recent events
  app.get('/api/drone/recent', (req, res) => { 
    const db = readDrone(); 
    res.json(db.events.slice(-100).reverse()); 
  });


  // ===== Contractors store =====
  const CONTRACTORS_PATH = path.join(DATA_DIR, 'contractors.json');
  if (!fs.existsSync(CONTRACTORS_PATH)) fs.writeFileSync(CONTRACTORS_PATH, JSON.stringify({ items: [
    { id:'ctr:default', name:'Strategic Land Management LLC', email:'strategiclandmgmt@gmail.com', phone:'+18886282229', timezone:'America/New_York', color:'#0ea5e9' }
  ] }, null, 2));
  function readContractors(){ try{ return JSON.parse(fs.readFileSync(CONTRACTORS_PATH,'utf8')); }catch{ return { items: [] }; } }
  function writeContractors(d: any){ try{ fs.writeFileSync(CONTRACTORS_PATH, JSON.stringify(d,null,2)); }catch{} }
  app.get('/api/contractors', (req,res)=>{ try{ res.json(readContractors().items||[]); }catch{ res.json([]); } });
  app.post('/api/contractors/save', express.json(), (req,res)=>{ try{ const c=req.body||{}; if(!c.id) c.id=`ctr:${Date.now()}`; const db=readContractors(); const i=(db.items||[]).findIndex((x: any)=>x.id===c.id); if(i>=0) db.items[i]={...db.items[i],...c}; else db.items.push(c); writeContractors(db); res.json({ ok:true, contractor:c }); }catch(e){ res.status(500).json({ ok:false }); } });

  // ===== Tasks / Schedule store =====
  const TASKS_PATH = path.join(DATA_DIR, 'tasks.json');
  if (!fs.existsSync(TASKS_PATH)) fs.writeFileSync(TASKS_PATH, JSON.stringify({ items: [] }, null, 2));
  function readTasks(){ try{ return JSON.parse(fs.readFileSync(TASKS_PATH,'utf8')); }catch{ return { items: [] }; } }
  function writeTasks(d: any){ try{ fs.writeFileSync(TASKS_PATH, JSON.stringify(d,null,2)); }catch{} }

  function addTask({ contractorId='ctr:default', customerId=null, title, detail='', startTs, endTs=null, type='job', status='open' }: any){
    const db = readTasks();
    const t = { id: `t:${Date.now()}:${Math.random().toString(36).slice(2,6)}`, contractorId, customerId, title, detail, startTs:Number(startTs||Date.now()), endTs:endTs?Number(endTs):null, type, status };
    db.items.push(t); writeTasks(db); return t;
  }

  app.post('/api/schedule/add', express.json(), (req,res)=>{ try{ const t = addTask(req.body||{}); res.json({ ok:true, task:t }); }catch(e){ res.status(500).json({ ok:false }); } });
  app.post('/api/schedule/update', express.json(), (req,res)=>{ try{ const { id, patch } = req.body||{}; const db=readTasks(); const it=(db.items||[]).find((x: any)=>x.id===id); if(!it) return res.status(404).json({}); Object.assign(it, patch||{}); writeTasks(db); res.json({ ok:true, task:it }); }catch(e){ res.status(500).json({ ok:false }); } });

  // ===== Lead Management Store (using existing LEADS_PATH) =====
  app.get('/api/leads', (req,res)=>{ 
    try{ 
      const { contractorId } = req.query;
      const db = readLeads(); 
      const leads = contractorId ? (db.items||[]).filter((l: any) => l.contractorId === contractorId) : (db.items||[]);
      res.json({ leads }); 
    }catch{ 
      res.json({ leads: [] }); 
    } 
  });

  app.post('/api/leads', express.json(), (req,res)=>{ 
    try{ 
      const lead = {
        id: `lead:${Date.now()}:${Math.random().toString(36).slice(2,6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...req.body
      };
      const db = readLeads(); 
      db.items.push(lead); 
      writeLeads(db); 
      res.json({ ok: true, lead }); 
    }catch(e){ 
      console.error('Error creating lead:', e);
      res.status(500).json({ ok: false, error: 'Failed to create lead' }); 
    } 
  });

  // ===== Invoice Management Store =====
  const INVOICES_PATH = path.join(DATA_DIR, 'invoices.json');
  if (!fs.existsSync(INVOICES_PATH)) fs.writeFileSync(INVOICES_PATH, JSON.stringify({ items: [] }, null, 2));
  function readInvoices(){ try{ return JSON.parse(fs.readFileSync(INVOICES_PATH,'utf8')); }catch{ return { items: [] }; } }
  function writeInvoices(d: any){ try{ fs.writeFileSync(INVOICES_PATH, JSON.stringify(d,null,2)); }catch{} }

  app.get('/api/invoices', (req,res)=>{ 
    try{ 
      const { contractorId } = req.query;
      const db = readInvoices(); 
      const invoices = contractorId ? (db.items||[]).filter((i: any) => i.contractorId === contractorId) : (db.items||[]);
      res.json({ invoices }); 
    }catch{ 
      res.json({ invoices: [] }); 
    } 
  });

  app.post('/api/invoices', express.json(), (req,res)=>{ 
    try{ 
      const invoice = {
        id: `inv:${Date.now()}:${Math.random().toString(36).slice(2,6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...req.body
      };
      const db = readInvoices(); 
      db.items.push(invoice); 
      writeInvoices(db); 
      res.json({ ok: true, invoice }); 
    }catch(e){ 
      console.error('Error creating invoice:', e);
      res.status(500).json({ ok: false, error: 'Failed to create invoice' }); 
    } 
  });

  // ===== Photo Management with AI Analysis =====
  const PHOTOS_PATH = path.join(DATA_DIR, 'photos.json');
  if (!fs.existsSync(PHOTOS_PATH)) fs.writeFileSync(PHOTOS_PATH, JSON.stringify({ items: [] }, null, 2));
  function readPhotos(){ try{ return JSON.parse(fs.readFileSync(PHOTOS_PATH,'utf8')); }catch{ return { items: [] }; } }
  function writePhotos(d: any){ try{ fs.writeFileSync(PHOTOS_PATH, JSON.stringify(d,null,2)); }catch{} }

  app.get('/api/photos', (req,res)=>{ 
    try{ 
      const { contractorId } = req.query;
      const db = readPhotos(); 
      const photos = contractorId ? (db.items||[]).filter((p: any) => p.contractorId === contractorId) : (db.items||[]);
      res.json({ photos }); 
    }catch{ 
      res.json({ photos: [] }); 
    } 
  });

  app.post('/api/photos/analyze', express.json(), async (req,res)=>{ 
    try{ 
      const { contractorId, fileName, fileUrl, category } = req.body;
      
      // Simulate AI analysis (would integrate with actual AI service)
      const mockAiAnalysis = {
        aiDescription: `Analysis: ${category} photo showing potential property damage. Visible structural elements and environmental conditions documented.`,
        damageType: ['tree_damage', 'roof_damage', 'structural_damage'][Math.floor(Math.random() * 3)],
        severity: ['minor', 'moderate', 'severe', 'critical'][Math.floor(Math.random() * 4)],
        latitude: (33.7490 + (Math.random() - 0.5) * 0.1).toString(), // Mock GPS around Atlanta
        longitude: (-84.3880 + (Math.random() - 0.5) * 0.1).toString(),
        address: `${Math.floor(Math.random() * 9999)} Sample St, Atlanta, GA 30309`,
        isProcessed: true,
        processedAt: new Date().toISOString()
      };
      
      const photo = {
        id: `photo:${Date.now()}:${Math.random().toString(36).slice(2,6)}`,
        createdAt: new Date().toISOString(),
        contractorId,
        fileName,
        fileUrl,
        category,
        thumbnailUrl: fileUrl, // Would generate thumbnail in real implementation
        ...mockAiAnalysis
      };
      
      const db = readPhotos(); 
      db.items.push(photo); 
      writePhotos(db); 
      res.json({ ok: true, photo }); 
    }catch(e){ 
      console.error('Error analyzing photo:', e);
      res.status(500).json({ ok: false, error: 'Failed to analyze photo' }); 
    } 
  });

  // ===== Insurance Companies Database =====
  const INSURANCE_PATH = path.join(DATA_DIR, 'insurance-companies.json');
  if (!fs.existsSync(INSURANCE_PATH)) {
    const mockInsuranceCompanies = {
      items: [
        {
          id: 'state-farm',
          name: 'State Farm',
          code: 'STFM',
          claimsEmail: 'claims@statefarm.com',
          claimsPhone: '1-800-STATE-FARM',
          disasterClaimsEmail: 'disaster.claims@statefarm.com', 
          disasterClaimsPhone: '1-800-SF-CLAIM',
          claimSubmissionPortal: 'https://www.statefarm.com/claims/report-claim',
          states: ['AL', 'FL', 'GA', 'SC', 'NC', 'TN', 'KY', 'VA', 'WV', 'OH', 'IN', 'IL', 'MI', 'WI', 'MN', 'IA', 'MO', 'AR', 'LA', 'MS', 'TX', 'OK', 'KS', 'NE', 'SD', 'ND', 'MT', 'WY', 'CO', 'NM', 'AZ', 'UT', 'NV', 'ID', 'OR', 'WA', 'CA', 'AK', 'HI'],
          mailingAddress: 'One State Farm Plaza, Bloomington, IL 61710',
          website: 'https://www.statefarm.com',
          avgPayout: '$12,450',
          totalClaims: 2847593,
          successRate: '94.2%',
          payoutTrend: 'stable',
          notes: 'Largest auto insurer in US, generally fast claim processing'
        },
        {
          id: 'allstate',
          name: 'Allstate',
          code: 'ALST',
          claimsEmail: 'claims@allstate.com',
          claimsPhone: '1-800-ALLSTATE',
          disasterClaimsEmail: 'catastrophe@allstate.com',
          disasterClaimsPhone: '1-800-54-STORM',
          claimSubmissionPortal: 'https://www.allstate.com/tools-and-resources/car-insurance/report-claim.aspx',
          states: ['AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
          mailingAddress: '2775 Sanders Road, Northbrook, IL 60062',
          website: 'https://www.allstate.com',
          avgPayout: '$11,850',
          totalClaims: 1923847,
          successRate: '92.8%',
          payoutTrend: 'increasing',
          notes: 'Good hands slogan, solid storm damage coverage'
        },
        {
          id: 'farmers',
          name: 'Farmers Insurance',
          code: 'FARM',
          claimsEmail: 'claims@farmers.com',
          claimsPhone: '1-800-FARMERS',
          disasterClaimsEmail: 'cat.claims@farmers.com',
          disasterClaimsPhone: '1-800-435-7764',
          claimSubmissionPortal: 'https://www.farmers.com/claims/',
          states: ['AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
          mailingAddress: '6301 Owensmouth Ave, Woodland Hills, CA 91367',
          website: 'https://www.farmers.com',
          avgPayout: '$13,200',
          totalClaims: 1456789,
          successRate: '91.5%',
          payoutTrend: 'stable',
          notes: 'Strong in western states, good storm coverage'
        },
        {
          id: 'usaa',
          name: 'USAA',
          code: 'USAA',
          claimsEmail: 'claims@usaa.com',
          claimsPhone: '1-800-531-USAA',
          disasterClaimsEmail: 'catastrophe@usaa.com',
          disasterClaimsPhone: '1-800-531-8722',
          claimSubmissionPortal: 'https://www.usaa.com/inet/wc/insurance-claims-center',
          states: ['All states for military families'],
          mailingAddress: '9800 Fredericksburg Road, San Antonio, TX 78288',
          website: 'https://www.usaa.com',
          avgPayout: '$14,750',
          totalClaims: 987654,
          successRate: '96.8%',
          payoutTrend: 'stable',
          notes: 'Military families only, excellent customer service and payouts'
        },
        {
          id: 'progressive',
          name: 'Progressive',
          code: 'PROG',
          claimsEmail: 'claims@progressive.com',
          claimsPhone: '1-800-PROGRESSIVE',
          disasterClaimsEmail: 'disaster@progressive.com',
          disasterClaimsPhone: '1-800-274-4499',
          claimSubmissionPortal: 'https://www.progressive.com/claims/',
          states: ['All 50 states'],
          mailingAddress: '6300 Wilson Mills Rd, Mayfield Village, OH 44143',
          website: 'https://www.progressive.com',
          avgPayout: '$10,950',
          totalClaims: 2134567,
          successRate: '90.2%',
          payoutTrend: 'stable',
          notes: 'Technology-focused, quick online claims processing'
        },
        {
          id: 'liberty-mutual',
          name: 'Liberty Mutual',
          code: 'LBMU',
          claimsEmail: 'claims@libertymutual.com',
          claimsPhone: '1-800-225-2467',
          disasterClaimsEmail: 'catastrophe@libertymutual.com',
          disasterClaimsPhone: '1-800-LM-CLAIM',
          claimSubmissionPortal: 'https://www.libertymutual.com/property-claim',
          states: ['All 50 states'],
          mailingAddress: '175 Berkeley Street, Boston, MA 02116',
          website: 'https://www.libertymutual.com',
          avgPayout: '$12,100',
          totalClaims: 1678901,
          successRate: '93.1%',
          payoutTrend: 'increasing',
          notes: 'Strong commercial and homeowners coverage'
        }
      ]
    };
    fs.writeFileSync(INSURANCE_PATH, JSON.stringify(mockInsuranceCompanies, null, 2));
  }
  function readInsuranceCompanies(){ try{ return JSON.parse(fs.readFileSync(INSURANCE_PATH,'utf8')); }catch{ return { items: [] }; } }

  app.get('/api/insurance-companies', (req,res)=>{ 
    try{ 
      const db = readInsuranceCompanies(); 
      res.json({ companies: db.items || [] }); 
    }catch{ 
      res.json({ companies: [] }); 
    } 
  });

  // ===== Market Comparables & Xactimate Integration =====
  app.post('/api/market-comparables', express.json(), async (req,res)=>{ 
    try{ 
      const { zipCode, radius = 150, lineItem, contractorPrice } = req.body;
      
      // Mock Xactimate-style data (would integrate with real Xactimate API)
      const mockComparables = [
        {
          id: `comp:${Date.now()}:1`,
          description: 'Tree removal service - Large oak tree (36"+ diameter)',
          zipCode: zipCode,
          xactimatePrice: '$2,450.00',
          contractorPrice: contractorPrice,
          variance: ((parseFloat(contractorPrice.replace('$','').replace(',','')) / 2450) - 1) * 100,
          emergencyMultiplier: '1.5x',
          radius: radius,
          justification: 'Emergency response, OSHA compliance, specialized equipment required',
          lineItem: lineItem,
          createdAt: new Date().toISOString()
        }
      ];
      
      res.json({ ok: true, comparables: mockComparables }); 
    }catch(e){ 
      console.error('Error generating market comparables:', e);
      res.status(500).json({ ok: false, error: 'Failed to generate market comparables' }); 
    } 
  });

  // ===== AI Letter Generation =====
  app.post('/api/ai-letter', express.json(), async (req,res)=>{ 
    try{ 
      const { contractorPrice, xactimatePrice, damageType, emergencyConditions } = req.body;
      
      // Mock AI-generated letter (would integrate with OpenAI/Claude)
      const mockLetter = `
Dear Insurance Adjuster,

RE: Emergency Storm Response Services - Price Justification

This letter provides justification for the pricing variance between our emergency storm response quote and standard Xactimate estimates.

EMERGENCY CONDITIONS:
Our pricing reflects the following emergency conditions:
- Immediate response required for public safety
- ${emergencyConditions || 'Severe weather conditions requiring specialized equipment'}
- OSHA-compliant safety protocols in hazardous conditions

PRICING BREAKDOWN:
- Xactimate Standard Rate: ${xactimatePrice}
- Our Emergency Rate: ${contractorPrice}
- Emergency Multiplier: Applied due to immediate response requirements

LEGAL JUSTIFICATION:
Under the Sherman Antitrust Act, contractors have the right to set competitive pricing based on:
1. Emergency response capabilities
2. OSHA and ANSI compliance requirements  
3. Specialized equipment and training costs
4. Insurance and bonding requirements

Our pricing is justified and competitive within the emergency response market segment.

Thank you for your consideration.

Strategic Land Management LLC
Emergency Storm Response Team
Phone: 888-628-2229
Email: strategiclandmgmt@gmail.com
      `;
      
      res.json({ ok: true, letter: mockLetter.trim() }); 
    }catch(e){ 
      console.error('Error generating AI letter:', e);
      res.status(500).json({ ok: false, error: 'Failed to generate AI letter' }); 
    } 
  });
  app.get('/api/schedule/list', (req,res)=>{ try{ const db=readTasks(); const { contractorId, startTs, endTs } = req.query; let items=db.items||[]; if (contractorId) items=items.filter((x: any)=>x.contractorId===contractorId); if (startTs) items=items.filter((x: any)=>x.startTs>=Number(startTs)); if (endTs) items=items.filter((x: any)=>x.startTs<Number(endTs)); res.json(items.sort((a: any,b: any)=>a.startTs-b.startTs)); }catch(e){ res.status(500).json([]); } });

  // ===== Helper: push follow-up tasks for a customer =====
  function scheduleFollowUpsForCustomer(c: any, contractorId='ctr:default', baseTs=Date.now()){
    // Next‑day call, 30‑day balance check, 45‑day demand review
    addTask({ contractorId, customerId:c.id, title:`Call ${c.name||'customer'}`, detail:`Post‑work follow‑up call for ${c.address||''}`, startTs: baseTs + 24*3600*1000, type:'followup' });
    addTask({ contractorId, customerId:c.id, title:'Balance check (30 days)', detail:`Review balance & send reminder if needed`, startTs: baseTs + 30*24*3600*1000, type:'followup' });
    addTask({ contractorId, customerId:c.id, title:'Demand letter review (45 days)', detail:`If unpaid, send demand & consider lien`, startTs: baseTs + 45*24*3600*1000, type:'followup' });
  }

  // ===== Work Completed endpoint =====
  app.post('/api/customer/work-completed', express.json(), async (req,res)=>{
    try{
      const { customerId, completedAt = Date.now(), contractorId='ctr:default' } = req.body||{};
      const db = readCustomers(); const c = (db.items||[]).find((x: any)=>x.id===customerId); if (!c) return res.status(404).json({ error:'customer_not_found' });
      c.status = 'work_completed';
      c.timeline = c.timeline||[]; c.timeline.push({ ts:Number(completedAt), type:'work_completed', text:'Marked completed' });
      writeCustomers(db);
      // Register SLA 45d lien reminder
      try{ await fetch(`http://localhost:${process.env.PORT||3000}/api/sla/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ customerId:c.id, type:'work_completed', ts:Number(completedAt), address:c.address||'', name:c.name||'' }) }); }catch{}
      // Calendar follow‑ups
      scheduleFollowUpsForCustomer(c, contractorId, Number(completedAt));
      res.json({ ok:true, customer:c });
    }catch(e){ res.status(500).json({ ok:false }); }
  });

  // ===== Claim Package email =====
  app.post('/api/claim/package/send', express.json(), async (req,res)=>{
    try{
      const { customerId, to, cc=[], includeContract=true, includeLatestPhotoReport=true, extraNotes='' } = req.body||{};
      const db = readCustomers(); const c = (db.items||[]).find((x: any)=>x.id===customerId); if (!c) return res.status(404).json({});
      if (!transporter) return res.status(500).json({ error:'Email not configured' });

      // Build summary PDF
      const outPath = path.join(UPLOAD_DIR, `claim_summary_${Date.now()}.pdf`);
      const doc = new PDFDocument({ size:'LETTER', margin:36 }); const ws = fs.createWriteStream(outPath); doc.pipe(ws);
      doc.fontSize(16).text('Claim Package Summary'); doc.moveDown();
      doc.fontSize(11).text(`Insured: ${c.name||''}`); if (c.address) doc.text(`Property: ${c.address}`);
      if (c.claimNumber) doc.text(`Claim #: ${c.claimNumber}`);
      if (c.insurer) doc.text(`Insurer: ${c.insurer}`);
      if (c.invoiceTotal) doc.text(`Invoice Total: $${Number(c.invoiceTotal).toFixed(2)}`);
      if (extraNotes) { doc.moveDown().text(`Notes: ${extraNotes}`); }
      const damageTags = (c.tags||[]).join(', '); if (damageTags) { doc.moveDown().text(`Observed Damage: ${damageTags}`); }
      // Add up to 4 thumbnail photos
      const photos = (c.docs||[]).filter((d: any)=>/\.(jpg|jpeg|png)$/i.test(d.url||d.name));
      for (let i=0;i<Math.min(4, photos.length); i++){
        try{
          const ph = photos[i];
          let buf=null; if (/^https?:/i.test(ph.url)) { const r=await fetch(ph.url); buf = Buffer.from(await r.arrayBuffer()); } else { const fp = ph.url.startsWith('/uploads/')? path.join(UPLOAD_DIR, path.basename(ph.url)):ph.url; buf = fs.readFileSync(fp); }
          doc.moveDown().text(ph.caption||ph.name||'Photo'); doc.image(buf, { fit:[520,360] });
        }catch{}
      }
      doc.end(); await new Promise(r=> ws.on('finish', r));

      // Attachments
      const atts = [{ filename: path.basename(outPath), path: outPath }];
      if (includeContract) {
        const contractPath = path.join(ASSETS_DIR,'contract.pdf');
        if (fs.existsSync(contractPath)) atts.push({ filename:'contract.pdf', path: contractPath });
      }
      if (includeLatestPhotoReport){
        const latest = fs.readdirSync(UPLOAD_DIR).filter(n=> n.startsWith('photo_report_') && n.endsWith('.pdf')).sort().pop();
        if (latest) atts.push({ filename: latest, path: path.join(UPLOAD_DIR, latest) });
      }

      // Send
      const toAddr = to || c.insurerEmail || 'claims@example.com';
      const html = `Attached is the claim package for ${c.name||''} at ${c.address||''}. Claim # ${c.claimNumber||''}.`;
      const info = await transporter.sendMail({ from: process.env.SMTP_FROM||process.env.SMTP_USER, to: toAddr, cc: Array.isArray(cc)? cc.filter(Boolean):[], subject: `Claim package — ${c.address||''} — ${c.claimNumber||''}`, html, attachments: atts });

      // Timeline
      c.timeline = c.timeline||[]; c.timeline.push({ ts: Date.now(), type:'claim_package_sent', text:`Email ${toAddr} msgId=${info.messageId}` });
      writeCustomers(db);

      // Calendar task logged
      addTask({ title:'Follow up with insurer (3 days)', contractorId:'ctr:default', customerId:c.id, startTs: Date.now()+3*24*3600*1000, type:'followup' });

      res.json({ ok:true, messageId: info.messageId });
    }catch(e){ res.status(500).json({ ok:false, detail:String(e) }); }
  });

  // ===== WEATHER API ENDPOINTS =====
  
  // Weather alerts from NOAA/NWS
  app.get('/api/weather/alerts', async (req, res) => {
    try {
      // Mock NOAA weather alerts - in production, this would call actual NWS API
      const mockAlerts = [
        {
          id: "nws-alert-001",
          title: "Tornado Warning",
          description: "A tornado warning has been issued for the following areas until 11:30 PM EST.",
          severity: "Extreme",
          alertType: "Tornado",
          areas: ["Fulton County", "DeKalb County"],
          startTime: new Date(),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          coordinates: { latitude: 33.7490, longitude: -84.3880 }
        },
        {
          id: "nws-alert-002", 
          title: "Severe Thunderstorm Warning",
          description: "Severe thunderstorms with damaging winds and large hail are possible.",
          severity: "Severe",
          alertType: "Severe Thunderstorm",
          areas: ["Gwinnett County", "Cobb County"],
          startTime: new Date(),
          endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
          coordinates: { latitude: 33.9737, longitude: -84.5755 }
        }
      ];
      res.json(mockAlerts);
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      res.status(500).json({ error: 'Failed to fetch weather alerts' });
    }
  });

  // Current weather conditions
  app.get('/api/weather/current', async (req, res) => {
    try {
      const currentWeather = {
        temperature: 78,
        humidity: 65,
        windSpeed: 15,
        windDirection: 'SW',
        pressure: 29.92,
        visibility: 10,
        conditions: 'Partly Cloudy',
        dewPoint: 68,
        uvIndex: 6,
        timestamp: new Date().toISOString()
      };
      res.json(currentWeather);
    } catch (error) {
      console.error('Error fetching current weather:', error);
      res.status(500).json({ error: 'Failed to fetch current weather' });
    }
  });

  // Weather forecast data
  app.get('/api/weather/forecast', async (req, res) => {
    try {
      const forecast = {
        daily: [
          { date: new Date().toISOString(), high: 82, low: 68, conditions: 'Thunderstorms', precipChance: 70 },
          { date: new Date(Date.now() + 86400000).toISOString(), high: 78, low: 65, conditions: 'Partly Cloudy', precipChance: 30 },
          { date: new Date(Date.now() + 172800000).toISOString(), high: 85, low: 72, conditions: 'Sunny', precipChance: 10 }
        ],
        hourly: Array.from({ length: 24 }, (_, i) => ({
          time: new Date(Date.now() + i * 3600000).toISOString(),
          temp: 75 + Math.sin(i / 4) * 10,
          precipChance: Math.max(0, 40 + Math.sin(i / 3) * 30),
          windSpeed: 10 + Math.random() * 15
        }))
      };
      res.json(forecast);
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      res.status(500).json({ error: 'Failed to fetch weather forecast' });
    }
  });

  // Hurricane tracking data
  app.get('/api/weather/hurricanes', async (req, res) => {
    try {
      const hurricanes = [
        {
          id: 'AL012024',
          name: 'Example Storm',
          status: 'Hurricane',
          category: 2,
          maxWinds: 105,
          position: { lat: 25.5, lon: -79.8 },
          movement: { direction: 'NNW', speed: 12 },
          pressure: 965,
          lastUpdate: new Date().toISOString()
        }
      ];
      res.json(hurricanes);
    } catch (error) {
      console.error('Error fetching hurricane data:', error);
      res.status(500).json({ error: 'Failed to fetch hurricane data' });
    }
  });

  // ===== RADAROMEGA-STYLE COMPREHENSIVE WEATHER API ENDPOINTS =====

  // Lightning detection and strike data
  app.get('/api/weather/lightning', async (req, res) => {
    try {
      const { lat, lon, radius } = req.query;
      const latitude = Number(lat) || 33.7490;
      const longitude = Number(lon) || -84.3880;
      const radiusKm = Number(radius) || 100;
      
      const lightningData = await weatherService.getLightningData(latitude, longitude, radiusKm);
      res.json(lightningData);
    } catch (error) {
      console.error('Error fetching lightning data:', error);
      res.status(500).json({ error: 'Failed to fetch lightning data' });
    }
  });

  // High-resolution single-site radar data
  app.get('/api/weather/radar/site/:siteId', async (req, res) => {
    try {
      const { siteId } = req.params;
      const radarData = await weatherService.getSingleSiteRadar(siteId);
      res.json(radarData);
    } catch (error) {
      console.error('Error fetching single-site radar:', error);
      res.status(500).json({ error: 'Failed to fetch single-site radar data' });
    }
  });

  // Enhanced radar with velocity and dual-pol
  app.get('/api/weather/radar/enhanced', async (req, res) => {
    try {
      const { lat, lon, zoom } = req.query;
      const latitude = Number(lat) || 33.7490;
      const longitude = Number(lon) || -84.3880;
      const zoomLevel = Number(zoom) || 6;
      
      const radarData = await weatherService.getRadarData(latitude, longitude, zoomLevel);
      res.json(radarData);
    } catch (error) {
      console.error('Error fetching enhanced radar:', error);
      res.status(500).json({ error: 'Failed to fetch enhanced radar data' });
    }
  });

  // Satellite imagery data
  app.get('/api/weather/satellite', async (req, res) => {
    try {
      const { lat, lon } = req.query;
      const latitude = Number(lat) || 33.7490;
      const longitude = Number(lon) || -84.3880;
      
      const satelliteData = await weatherService.getSatelliteData(latitude, longitude);
      res.json(satelliteData);
    } catch (error) {
      console.error('Error fetching satellite data:', error);
      res.status(500).json({ error: 'Failed to fetch satellite data' });
    }
  });

  // MRMS (Multi-Radar Multi-Sensor) data
  app.get('/api/weather/mrms', async (req, res) => {
    try {
      const { lat, lon } = req.query;
      const latitude = Number(lat) || 33.7490;
      const longitude = Number(lon) || -84.3880;
      
      const mrmsData = await weatherService.getMRMSData(latitude, longitude);
      res.json(mrmsData);
    } catch (error) {
      console.error('Error fetching MRMS data:', error);
      res.status(500).json({ error: 'Failed to fetch MRMS data' });
    }
  });

  // Forecast models (HRRR, NAM, RAP, GFS, ECMWF, HWRF, HMON)
  app.get('/api/weather/models', async (req, res) => {
    try {
      const { lat, lon } = req.query;
      const latitude = Number(lat) || 33.7490;
      const longitude = Number(lon) || -84.3880;
      
      const modelsData = await weatherService.getForecastModels(latitude, longitude);
      res.json(modelsData);
    } catch (error) {
      console.error('Error fetching forecast models:', error);
      res.status(500).json({ error: 'Failed to fetch forecast models' });
    }
  });

  // Storm Prediction Center (SPC) outlooks
  app.get('/api/weather/spc', async (req, res) => {
    try {
      const spcData = await weatherService.getSPCOutlook();
      res.json(spcData);
    } catch (error) {
      console.error('Error fetching SPC data:', error);
      res.status(500).json({ error: 'Failed to fetch SPC data' });
    }
  });

  // National Hurricane Center (NHC) data
  app.get('/api/weather/nhc', async (req, res) => {
    try {
      const nhcData = await weatherService.getNHCData();
      res.json(nhcData);
    } catch (error) {
      console.error('Error fetching NHC data:', error);
      res.status(500).json({ error: 'Failed to fetch NHC data' });
    }
  });

  // Weather Prediction Center (WPC) data
  app.get('/api/weather/wpc', async (req, res) => {
    try {
      const wpcData = await weatherService.getWPCData();
      res.json(wpcData);
    } catch (error) {
      console.error('Error fetching WPC data:', error);
      res.status(500).json({ error: 'Failed to fetch WPC data' });
    }
  });

  // Ocean & Wave Data Routes
  app.get('/api/weather/buoys', async (req, res) => {
    try {
      const data = await weatherService.getNDBC_Buoys();
      res.json(data);
    } catch (error) {
      console.error('Error fetching NDBC buoy data:', error);
      res.status(500).json({ error: 'Failed to fetch NDBC buoy data' });
    }
  });

  app.get('/api/weather/ocean', async (req, res) => {
    try {
      // Enhanced ocean data with Global SST and CoastWatch
      const { lat1, lat2, lon1, lon2 } = req.query;
      
      // Default bounds for East Coast US
      const bounds = {
        lat1: Number(lat1) || 20,
        lat2: Number(lat2) || 50,
        lon1: Number(lon1) || -100,
        lon2: Number(lon2) || -60
      };
      
      const buoys = await weatherService.getNDBC_Buoys();
      const globalSST = await weatherService.getGlobalSST(bounds.lat1, bounds.lat2, bounds.lon1, bounds.lon2);
      const coastWatch = await weatherService.getCoastWatchData();
      
      const oceanData = {
        seaSurfaceTemperature: buoys.map(buoy => ({
          latitude: buoy.latitude,
          longitude: buoy.longitude,
          temperature: buoy.measurements.waterTemperature || 0,
          source: 'buoy' as const,
          timestamp: buoy.timestamp,
          stationId: buoy.stationId
        })).filter(sst => sst.temperature > 0),
        globalSST: globalSST,
        buoys: buoys,
        coastWatch: coastWatch,
        lastUpdated: new Date()
      };
      res.json(oceanData);
    } catch (error) {
      console.error('Error fetching ocean data:', error);
      res.status(500).json({ error: 'Failed to fetch ocean data' });
    }
  });

  app.get('/api/weather/waves', async (req, res) => {
    try {
      const buoys = await weatherService.getNDBC_Buoys();
      const waveData = buoys.map(buoy => ({
        significantHeight: buoy.measurements.significantWaveHeight || 0,
        peakPeriod: buoy.measurements.peakWavePeriod || 0,
        direction: buoy.measurements.meanWaveDirection || 0,
        timestamp: buoy.timestamp,
        location: {
          latitude: buoy.latitude,
          longitude: buoy.longitude
        },
        source: 'buoy' as const,
        stationId: buoy.stationId,
        stationName: buoy.name
      })).filter(wave => wave.significantHeight > 0);
      
      res.json(waveData);
    } catch (error) {
      console.error('Error fetching wave data:', error);
      res.status(500).json({ error: 'Failed to fetch wave data' });
    }
  });

  // Individual NDBC Buoy Station Data
  app.get('/api/weather/buoys/:stationId', async (req, res) => {
    try {
      const { stationId } = req.params;
      const { format } = req.query;
      
      let buoyData;
      const allBuoys = await weatherService.getNDBC_Buoys();
      buoyData = allBuoys.find(b => b.stationId === stationId);
      
      if (!buoyData) {
        res.status(404).json({ error: `NDBC station ${stationId} not found or no data available` });
        return;
      }
      
      res.json(buoyData);
    } catch (error) {
      console.error(`Error fetching NDBC station ${req.params.stationId}:`, error);
      res.status(500).json({ error: `Failed to fetch NDBC station ${req.params.stationId}` });
    }
  });

  // Realtime2 format endpoints (matching NDBC structure)
  app.get('/api/weather/realtime2/:stationId', async (req, res) => {
    try {
      const { stationId } = req.params;
      const { format } = req.query;
      
      let buoyData;
      const allBuoys = await weatherService.getNDBC_Buoys();
      buoyData = allBuoys.find(b => b.stationId === stationId);
      
      if (!buoyData) {
        res.status(404).json({ error: `NDBC station ${stationId} not found` });
        return;
      }
      
      res.json(buoyData);
    } catch (error) {
      console.error(`Error fetching realtime2 station ${req.params.stationId}:`, error);
      res.status(500).json({ error: `Failed to fetch realtime2 station ${req.params.stationId}` });
    }
  });

  // nowCOAST Identify proxy for WW3 services
  app.get('/api/weather/nowcoast/identify', async (req, res) => {
    try {
      const { lon, lat, service } = req.query;
      
      if (!lon || !lat || !service) {
        return res.status(400).json({ error: 'Missing required parameters: lon, lat, service' });
      }
      
      // Whitelist allowed WW3 services only
      const allowedServices = [
        'ww3_global',
        'ww3_atlantic', 
        'ww3_pacific'
      ];
      
      if (!allowedServices.includes(service as string)) {
        return res.status(400).json({ error: 'Invalid service. Allowed: ' + allowedServices.join(', ') });
      }
      
      // Map service names to nowCOAST service URLs
      const serviceMap: Record<string, string> = {
        'ww3_global': 'https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/wavewatch_global/MapServer/identify',
        'ww3_atlantic': 'https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/wavewatch_atlantic/MapServer/identify',
        'ww3_pacific': 'https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/wavewatch_pacific/MapServer/identify'
      };
      
      const serviceUrl = serviceMap[service as string];
      
      // Build ArcGIS Identify request
      const identifyParams = new URLSearchParams({
        'f': 'json',
        'geometry': `${lon},${lat}`,
        'geometryType': 'esriGeometryPoint',
        'sr': '4326',
        'mapExtent': `${Number(lon)-1},${Number(lat)-1},${Number(lon)+1},${Number(lat)+1}`,
        'imageDisplay': '400,400,96',
        'tolerance': '3',
        'layers': 'all'
      });
      
      console.log(`🌊 nowCOAST WW3 identify: ${service} at ${lat},${lon}`);
      
      const response = await fetch(`${serviceUrl}?${identifyParams}`);
      
      if (!response.ok) {
        throw new Error(`nowCOAST service error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add metadata
      const result = {
        service: service,
        location: { lat: Number(lat), lon: Number(lon) },
        timestamp: new Date().toISOString(),
        source: 'NOAA nowCOAST WW3',
        data: data
      };
      
      res.json(result);
      
    } catch (error) {
      console.error('nowCOAST identify error:', error);
      res.status(500).json({ error: 'Failed to query nowCOAST WW3 service' });
    }
  });

  // --- nowCOAST point sampler (Identify) - WW3 + NDFD winds ---
  app.get("/api/nowcoast/sample", async (req, res) => {
    try {
      const { service, lon, lat, layerId = "0", time } = req.query;
      const ALLOWED = new Set([
        "ww3_sigwaveheight_time",
        "ww3_peakwaveperiod_time", 
        "ww3_primarywavedir_time",
        "forecast_meteoceanhydro_sfc_ndfd_time", // NEW: NDFD winds
      ]);
      if (!ALLOWED.has(String(service))) {
        return res.status(400).json({ error: "Invalid service" });
      }
      const x = Number(lon), y = Number(lat);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return res.status(400).json({ error: "Provide lon,lat as numbers" });
      }

      const endpoint = `https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/${service}/MapServer/identify`;
      const params = new URLSearchParams({
        f: "json",
        geometry: JSON.stringify({ x, y, spatialReference: { wkid: 4326 } }),
        geometryType: "esriGeometryPoint",
        sr: "4326",
        layers: `all:${layerId}`,
        tolerance: "1",
        mapExtent: "-180,-90,180,90",
        imageDisplay: "800,600,96",
        returnGeometry: "false",
      });
      
      // Add time parameter if provided (for NDFD forecast times)
      if (time) {
        params.append("time", String(time));
      }

      const r = await fetch(`${endpoint}?${params}`, {
        headers: { "User-Agent": "SLM-StormApp/1.0" },
      });
      if (!r.ok) throw new Error(`nowCOAST identify failed: ${r.status}`);
      const data = await r.json();

      // Pull a numeric "pixel value" from the first result
      let value = null, attrs = {};
      if (Array.isArray(data.results) && data.results.length) {
        attrs = data.results[0].attributes || {};
        // common keys we see on nowCOAST
        const keys = [
          "value",
          "Pixel Value",
          "Pixel_Value",
          "Raster.ServicePixelValue",
          "GRAY_INDEX",
          "Band_1",
        ];
        for (const k of keys) {
          if (k in attrs) {
            const v = Number(String(attrs[k]).replace(/[^0-9.\-]/g, ""));
            if (Number.isFinite(v)) { value = v; break; }
          }
        }
        // Fallback: first numeric-looking attribute
        if (value === null) {
          for (const v of Object.values(attrs)) {
            const num = Number(String(v).replace(/[^0-9.\-]/g, ""));
            if (Number.isFinite(num)) { value = num; break; }
          }
        }
      }

      // Units by service
      const units =
        service === "ww3_sigwaveheight_time" ? "m" :
        service === "ww3_peakwaveperiod_time" ? "s" :
        service === "ww3_primarywavedir_time" ? "deg" :
        service === "forecast_meteoceanhydro_sfc_ndfd_time" ? "varies" : "";

      res.json({ service, lon: x, lat: y, value, units, attributes: attrs });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // nowCOAST layers discovery helper - discover layer IDs for NDFD wind speed & direction (and time metadata)
  app.get("/api/nowcoast/layers", async (req, res) => {
    try {
      const { service } = req.query;
      const ALLOWED = new Set([
        "forecast_meteoceanhydro_sfc_ndfd_time",
        "ww3_sigwaveheight_time",
        "ww3_peakwaveperiod_time",
        "ww3_primarywavedir_time",
      ]);
      if (!ALLOWED.has(String(service))) {
        return res.status(400).json({ error: "Invalid service" });
      }
      const url = `https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/${service}/MapServer?f=pjson`;
      const resp = await fetch(url, { headers: { "User-Agent": "SLM-StormApp/1.0" } });
      if (!resp.ok) throw new Error(`Layer list fetch failed: ${resp.status}`);
      const json = await resp.json();

      const layers = json?.layers || [];
      const byName = (rx: RegExp) => layers.find((l: any) => rx.test(l?.name || ""))?.id;

      // Try several common nowCOAST layer names for NDFD winds
      const speedId =
        byName(/wind\s*speed/i) ??
        byName(/sustained\s*wind/i) ??
        byName(/sfc.*wind.*speed/i);

      const dirId =
        byName(/wind\s*direction/i) ??
        byName(/sfc.*wind.*dir/i);

      // Extract time metadata from the speed layer (fallback to dir layer)
      const layerForTime = layers.find((l: any) => l.id === speedId) || layers.find((l: any) => l.id === dirId);
      let latestTime = null;
      let startTime = null;
      let intervalMs = 3600000; // Default: 1 hour in milliseconds
      
      const ti = layerForTime?.timeInfo;
      if (ti?.timeExtent?.length) {
        // timeExtent is [startMS, endMS]
        startTime = ti.timeExtent[0];
        latestTime = ti.timeExtent[1];
      }
      
      // Extract interval from timeInfo (safe fallbacks)
      if (ti?.timeInterval) {
        intervalMs = ti.timeInterval;
      } else if (ti?.timeIntervalUnits && ti?.defaultTimeInterval) {
        // Convert to milliseconds based on units
        const units = String(ti.timeIntervalUnits).toLowerCase();
        const interval = Number(ti.defaultTimeInterval) || 1;
        if (units.includes('hour')) intervalMs = interval * 3600000;
        else if (units.includes('minute')) intervalMs = interval * 60000;
        else if (units.includes('day')) intervalMs = interval * 86400000;
      }

      res.json({ 
        service, 
        speedId, 
        dirId, 
        latestTime, 
        startTime, 
        intervalMs, 
        rawLayerCount: layers.length 
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Global SST from NOAA CoastWatch ERDDAP
  app.get('/api/weather/sst/global', async (req, res) => {
    try {
      const { lat1, lat2, lon1, lon2 } = req.query;
      
      // Default to East Coast US if no bounds specified
      const bounds = {
        lat1: Number(lat1) || 20,
        lat2: Number(lat2) || 50,
        lon1: Number(lon1) || -100,
        lon2: Number(lon2) || -60
      };
      
      const globalSST = await weatherService.getGlobalSST(bounds.lat1, bounds.lat2, bounds.lon1, bounds.lon2);
      res.json(globalSST);
    } catch (error) {
      console.error('Error fetching Global SST data:', error);
      res.status(500).json({ error: 'Failed to fetch Global SST data' });
    }
  });

  // NOAA CoastWatch satellite data
  app.get('/api/weather/coastwatch', async (req, res) => {
    try {
      const coastWatchData = await weatherService.getCoastWatchData();
      res.json(coastWatchData);
    } catch (error) {
      console.error('Error fetching CoastWatch data:', error);
      res.status(500).json({ error: 'Failed to fetch CoastWatch data' });
    }
  });

  // GHRSST daily composites
  app.get('/api/weather/ghrsst', async (req, res) => {
    try {
      const coastWatch = await weatherService.getCoastWatchData();
      res.json(coastWatch.ghrsst);
    } catch (error) {
      console.error('Error fetching GHRSST data:', error);
      res.status(500).json({ error: 'Failed to fetch GHRSST data' });
    }
  });

  // WAVEWATCH III wave models
  app.get('/api/weather/wavewatch', async (req, res) => {
    try {
      const waveWatch = await weatherService.getWaveWatch();
      res.json(waveWatch);
    } catch (error) {
      console.error('Error fetching WAVEWATCH III data:', error);
      res.status(500).json({ error: 'Failed to fetch WAVEWATCH III data' });
    }
  });

  // WAVEWATCH III global model
  app.get('/api/weather/wavewatch/global', async (req, res) => {
    try {
      const waveWatch = await weatherService.getWaveWatch();
      res.json(waveWatch.global);
    } catch (error) {
      console.error('Error fetching WAVEWATCH III global data:', error);
      res.status(500).json({ error: 'Failed to fetch WAVEWATCH III global data' });
    }
  });

  // WAVEWATCH III regional model
  app.get('/api/weather/wavewatch/regional', async (req, res) => {
    try {
      const waveWatch = await weatherService.getWaveWatch();
      res.json(waveWatch.regional);
    } catch (error) {
      console.error('Error fetching WAVEWATCH III regional data:', error);
      res.status(500).json({ error: 'Failed to fetch WAVEWATCH III regional data' });
    }
  });

  // Comprehensive weather data (all sources combined)
  app.get('/api/weather/comprehensive', async (req, res) => {
    try {
      const { lat, lon } = req.query;
      const latitude = Number(lat) || 33.7490;
      const longitude = Number(lon) || -84.3880;
      
      const comprehensiveData = await weatherService.getComprehensiveWeatherData(latitude, longitude);
      res.json(comprehensiveData);
    } catch (error) {
      console.error('Error fetching comprehensive weather data:', error);
      res.status(500).json({ error: 'Failed to fetch comprehensive weather data' });
    }
  });

  // Live weather streaming endpoints
  app.get('/api/weather/stream/start', async (req, res) => {
    try {
      const { type, lat, lon, radius, zoom, interval } = req.query;
      const params = {
        lat: Number(lat) || 33.7490,
        lon: Number(lon) || -84.3880,
        radius: Number(radius) || 100,
        zoom: Number(zoom) || 6
      };
      const intervalMs = Number(interval) || 30000;
      
      // Start streaming for the requested type
      const streamId = weatherStreamManager.startLiveStream(
        type as string,
        params,
        (data) => {
          // Broadcast to all connected SSE clients
          broadcast({ type: 'weather_update', data, streamType: type, timestamp: new Date().toISOString() });
        },
        intervalMs
      );
      
      res.json({ ok: true, streamId, type, params, interval: intervalMs });
    } catch (error) {
      console.error('Error starting weather stream:', error);
      res.status(500).json({ error: 'Failed to start weather stream' });
    }
  });

  app.get('/api/weather/stream/stop/:streamId', async (req, res) => {
    try {
      const { streamId } = req.params;
      weatherStreamManager.stopLiveStream(streamId);
      res.json({ ok: true, stopped: streamId });
    } catch (error) {
      console.error('Error stopping weather stream:', error);
      res.status(500).json({ error: 'Failed to stop weather stream' });
    }
  });

  // Real-time weather alerts with severity filtering
  app.get('/api/weather/alerts/live', async (req, res) => {
    try {
      const { lat, lon, severity } = req.query;
      const latitude = Number(lat) || 33.7490;
      const longitude = Number(lon) || -84.3880;
      
      let alerts = await weatherService.getWeatherAlerts(latitude, longitude);
      
      if (severity) {
        alerts = alerts.filter(alert => 
          alert.severity.toLowerCase() === (severity as string).toLowerCase()
        );
      }
      
      res.json({
        alerts,
        count: alerts.length,
        location: { latitude, longitude },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching live alerts:', error);
      res.status(500).json({ error: 'Failed to fetch live weather alerts' });
    }
  });

  // Weather streaming SSE endpoint
  app.get('/api/weather/stream', (req, res) => {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    
    // Add this client to weather stream
    const clientId = Date.now().toString();
    res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);
    
    // Handle client disconnect
    req.on('close', () => {
      console.log(`Weather stream client ${clientId} disconnected`);
    });
    
    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
    }, 30000);
    
    req.on('close', () => {
      clearInterval(keepAlive);
    });
  });

  // ===== TRAFFIC CAMERA WATCHER ENDPOINTS =====
  
  // Get all available traffic cameras
  app.get('/api/traffic-cameras', async (req, res) => {
    try {
      const { state, lat, lon, radius } = req.query;
      
      let cameras;
      if (state) {
        cameras = await trafficCameraService.getCamerasByState(state as string);
      } else if (lat && lon) {
        const radiusKm = Number(radius) || 50;
        cameras = await trafficCameraService.getCamerasByLocation(
          Number(lat), 
          Number(lon), 
          radiusKm
        );
      } else {
        cameras = await trafficCameraService.getAllCameras();
      }
      
      res.json({
        cameras,
        count: cameras.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching traffic cameras:', error);
      res.status(500).json({ error: 'Failed to fetch traffic cameras' });
    }
  });

  // Get specific camera details
  app.get('/api/traffic-cameras/:cameraId', async (req, res) => {
    try {
      const { cameraId } = req.params;
      const allCameras = await trafficCameraService.getAllCameras();
      const camera = allCameras.find(c => c.id === cameraId);
      
      if (!camera) {
        return res.status(404).json({ error: 'Camera not found' });
      }
      
      res.json(camera);
    } catch (error) {
      console.error('Error fetching camera details:', error);
      res.status(500).json({ error: 'Failed to fetch camera details' });
    }
  });

  // Get current image from a specific camera
  app.get('/api/traffic-cameras/:cameraId/image', async (req, res) => {
    try {
      const { cameraId } = req.params;
      const imageUrl = await trafficCameraService.getCameraImage(cameraId);
      
      if (!imageUrl) {
        return res.status(404).json({ error: 'Camera image not available' });
      }
      
      res.json({ imageUrl, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error fetching camera image:', error);
      res.status(500).json({ error: 'Failed to fetch camera image' });
    }
  });

  // Get current image bytes from a specific camera for AI analysis
  app.get('/api/traffic-cameras/:cameraId/image-bytes', async (req, res) => {
    try {
      const { cameraId } = req.params;
      console.log(`🤖 Fetching image bytes for AI analysis: ${cameraId}`);
      
      const imageResult = await trafficCameraService.fetchImageBytes(cameraId);
      
      if (!imageResult) {
        return res.status(404).json({ error: 'Camera image bytes not available' });
      }
      
      // Set appropriate headers for image data
      res.set({
        'Content-Type': imageResult.contentType,
        'Content-Length': imageResult.imageData.length.toString(),
        'Cache-Control': 'public, max-age=120', // Cache for 2 minutes
        'X-Image-Timestamp': imageResult.timestamp.toISOString(),
        'X-Camera-Id': cameraId
      });
      
      // Return raw image bytes
      res.send(imageResult.imageData);
    } catch (error) {
      console.error('Error fetching camera image bytes:', error);
      res.status(500).json({ error: 'Failed to fetch camera image bytes' });
    }
  });

  // Subscribe to camera alerts (requires contractor authentication)
  app.post('/api/traffic-cameras/:cameraId/subscribe', express.json(), async (req, res) => {
    try {
      const { cameraId } = req.params;
      const { contractorId, notifyTypes, priority } = req.body;
      
      if (!contractorId) {
        return res.status(400).json({ error: 'Contractor ID required' });
      }
      
      // Check if camera exists
      const allCameras = await trafficCameraService.getAllCameras();
      const camera = allCameras.find(c => c.id === cameraId);
      
      if (!camera) {
        return res.status(404).json({ error: 'Camera not found' });
      }
      
      // Store subscription in database
      const subscription = await trafficCameraService.subscribeToCamera(
        contractorId,
        cameraId,
        notifyTypes || ['structure_damage', 'tree_on_powerline'],
        priority || 'normal'
      );
      
      res.json({
        subscription,
        camera: {
          id: camera.id,
          name: camera.name,
          location: `${camera.city}, ${camera.state}`
        }
      });
    } catch (error) {
      console.error('Error creating camera subscription:', error);
      res.status(500).json({ error: 'Failed to create camera subscription' });
    }
  });

  // Get contractor's camera subscriptions
  app.get('/api/contractors/:contractorId/camera-subscriptions', async (req, res) => {
    try {
      const { contractorId } = req.params;
      
      // Query database for actual subscriptions
      const subscriptions = await trafficCameraService.getContractorSubscriptions(contractorId);
      
      res.json({
        subscriptions,
        contractorId,
        count: subscriptions.length
      });
    } catch (error) {
      console.error('Error fetching camera subscriptions:', error);
      res.status(500).json({ error: 'Failed to fetch camera subscriptions' });
    }
  });

  // Get traffic camera alerts for a contractor
  app.get('/api/contractors/:contractorId/camera-alerts', async (req, res) => {
    try {
      const { contractorId } = req.params;
      const { status, alertType, limit } = req.query;
      
      // TODO: Query database for actual alerts
      // For now, return empty array
      const alerts = [];
      
      res.json({
        alerts,
        contractorId,
        count: alerts.length,
        filters: { status, alertType, limit }
      });
    } catch (error) {
      console.error('Error fetching camera alerts:', error);
      res.status(500).json({ error: 'Failed to fetch camera alerts' });
    }
  });

  // Generate job lead from traffic camera alert
  app.post('/api/traffic-camera-alerts/:alertId/generate-lead', express.json(), async (req, res) => {
    try {
      const { alertId } = req.params;
      const { contractorId } = req.body;
      
      if (!contractorId) {
        return res.status(400).json({ error: 'Contractor ID required' });
      }
      
      // TODO: Query alert from database and generate lead
      // For now, return mock lead
      const lead = {
        id: `lead_${Date.now()}`,
        alertId,
        contractorId,
        alertType: 'structure_damage',
        priority: 'high',
        estimatedValue: 5000,
        status: 'new',
        location: 'Highway 75 @ Exit 245',
        description: 'Tree damage to roadside structure detected by AI',
        createdAt: new Date().toISOString()
      };
      
      res.json({
        lead,
        message: 'Job lead generated successfully'
      });
    } catch (error) {
      console.error('Error generating job lead:', error);
      res.status(500).json({ error: 'Failed to generate job lead' });
    }
  });

  // Get contractor's job leads from traffic cameras
  app.get('/api/contractors/:contractorId/camera-leads', async (req, res) => {
    try {
      const { contractorId } = req.params;
      const { status, priority, limit } = req.query;
      
      // TODO: Query database for actual leads
      // For now, return empty array
      const leads = [];
      
      res.json({
        leads,
        contractorId,
        count: leads.length,
        filters: { status, priority, limit }
      });
    } catch (error) {
      console.error('Error fetching camera leads:', error);
      res.status(500).json({ error: 'Failed to fetch camera leads' });
    }
  });

  // AI-powered damage detection on traffic camera image
  app.post('/api/traffic-cameras/:cameraId/analyze-damage', async (req, res) => {
    try {
      const { cameraId } = req.params;
      
      console.log(`🤖 Starting AI damage analysis for camera ${cameraId}`);
      
      // Get camera details for location context
      const allCameras = await trafficCameraService.getAllCameras();
      const camera = allCameras.find(c => c.id === cameraId);
      
      if (!camera) {
        return res.status(404).json({ error: 'Camera not found' });
      }
      
      // Fetch current image bytes
      const imageBytesResult = await trafficCameraService.fetchImageBytes(cameraId);
      
      if (!imageBytesResult || !imageBytesResult.imageData) {
        return res.status(404).json({ error: 'Camera image not available' });
      }
      
      // Analyze image for damage using AI
      const cameraLocation = `${camera.name} (${camera.city}, ${camera.state})${camera.highway ? ` - ${camera.highway}` : ''}`;
      const analysisResult = await damageDetectionService.analyzeImageForDamage(imageBytesResult.imageData, cameraLocation);
      
      res.json({
        camera: {
          id: camera.id,
          name: camera.name,
          location: cameraLocation
        },
        analysis: analysisResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error analyzing camera for damage:', error);
      res.status(500).json({ error: 'Failed to analyze camera for damage' });
    }
  });

  // Test damage detection with sample data
  app.post('/api/damage-detection/test', async (req, res) => {
    try {
      console.log('🧪 Running damage detection test...');
      
      const testResult = await damageDetectionService.testWithSampleImage();
      
      res.json({
        test: true,
        result: testResult,
        message: 'Damage detection test completed successfully'
      });
    } catch (error) {
      console.error('Error running damage detection test:', error);
      res.status(500).json({ error: 'Failed to run damage detection test' });
    }
  });

  // ===== UNIFIED 511 DIRECTORY ENDPOINTS =====
  
  // Get state directory with camera and incident counts per state
  app.get('/api/511/directory', async (req, res) => {
    try {
      console.log('📋 Fetching unified 511 state directory...');
      
      const directory = await unified511Directory.getStateDirectory();
      
      res.json({
        directory,
        totalStates: directory.length,
        totalCameras: directory.reduce((sum, state) => sum + state.cameraCount, 0),
        totalIncidents: directory.reduce((sum, state) => sum + state.incidentCount, 0),
        contractorOpportunities: directory.reduce((sum, state) => sum + state.contractorOpportunities, 0),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching 511 directory:', error);
      res.status(500).json({ error: 'Failed to fetch 511 directory' });
    }
  });

  // Get cameras by state with optional county filtering
  app.get('/api/511/cameras/:state', async (req, res) => {
    try {
      const { state } = req.params;
      const { county } = req.query;
      
      console.log(`🎥 Fetching 511 cameras for ${state}${county ? ` / ${county}` : ''}...`);
      
      let cameras;
      if (county) {
        cameras = await unified511Directory.getCamerasByCounty(state, county as string);
      } else {
        cameras = await unified511Directory.getCamerasByState(state);
      }
      
      // Group cameras by type and jurisdiction
      const camerasByType = cameras.reduce((acc, camera) => {
        if (!acc[camera.type]) acc[camera.type] = [];
        acc[camera.type].push(camera);
        return acc;
      }, {} as Record<string, typeof cameras>);
      
      const camerasByCounty = cameras.reduce((acc, camera) => {
        const countyName = camera.jurisdiction.county || 'Unknown';
        if (!acc[countyName]) acc[countyName] = [];
        acc[countyName].push(camera);
        return acc;
      }, {} as Record<string, typeof cameras>);
      
      res.json({
        state: state.toUpperCase(),
        county: county || null,
        cameras,
        count: cameras.length,
        breakdown: {
          byType: Object.keys(camerasByType).map(type => ({
            type,
            count: camerasByType[type].length,
            cameras: camerasByType[type]
          })),
          byCounty: Object.keys(camerasByCounty).map(county => ({
            county,
            count: camerasByCounty[county].length
          }))
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching cameras by state:', error);
      res.status(500).json({ error: 'Failed to fetch cameras by state' });
    }
  });

  // Get incidents/events by state (tree down, road blocked, etc.)
  app.get('/api/511/incidents/:state', async (req, res) => {
    try {
      const { state } = req.params;
      const { contractorOnly } = req.query;
      
      console.log(`🚨 Fetching 511 incidents for ${state}...`);
      
      let incidents = await unified511Directory.getIncidentsByState(state);
      
      if (contractorOnly === 'true') {
        incidents = incidents.filter(incident => incident.isContractorOpportunity);
      }
      
      // Group incidents by type and severity
      const incidentsByType = incidents.reduce((acc, incident) => {
        if (!acc[incident.type]) acc[incident.type] = [];
        acc[incident.type].push(incident);
        return acc;
      }, {} as Record<string, typeof incidents>);
      
      const incidentsBySeverity = incidents.reduce((acc, incident) => {
        if (!acc[incident.severity]) acc[incident.severity] = [];
        acc[incident.severity].push(incident);
        return acc;
      }, {} as Record<string, typeof incidents>);
      
      res.json({
        state: state.toUpperCase(),
        incidents,
        count: incidents.length,
        contractorOpportunities: incidents.filter(i => i.isContractorOpportunity).length,
        breakdown: {
          byType: Object.keys(incidentsByType).map(type => ({
            type,
            count: incidentsByType[type].length,
            contractorOpportunities: incidentsByType[type].filter(i => i.isContractorOpportunity).length
          })),
          bySeverity: Object.keys(incidentsBySeverity).map(severity => ({
            severity,
            count: incidentsBySeverity[severity].length
          }))
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching incidents by state:', error);
      res.status(500).json({ error: 'Failed to fetch incidents by state' });
    }
  });

  // Get contractor opportunities across all states or specific state
  app.get('/api/511/contractor-opportunities', async (req, res) => {
    try {
      const { state, severity, type, limit } = req.query;
      
      console.log(`💼 Fetching contractor opportunities${state ? ` for ${state}` : ' (all states)'}...`);
      
      let opportunities = await unified511Directory.getContractorOpportunities(state as string);
      
      // Apply filters
      if (severity) {
        opportunities = opportunities.filter(opp => opp.severity === severity);
      }
      
      if (type) {
        opportunities = opportunities.filter(opp => opp.type === type);
      }
      
      if (limit) {
        opportunities = opportunities.slice(0, Number(limit));
      }
      
      // Calculate estimated revenue potential
      const revenueEstimates = opportunities.map(opp => {
        let estimatedValue = 500; // Base value
        
        switch (opp.type) {
          case 'tree_down':
            estimatedValue = opp.severity === 'critical' ? 3000 : 1500;
            break;
          case 'power_lines_down':
            estimatedValue = 5000; // Emergency work
            break;
          case 'debris':
            estimatedValue = opp.severity === 'severe' ? 2000 : 800;
            break;
          case 'flooding':
            estimatedValue = 2500;
            break;
        }
        
        return { ...opp, estimatedValue };
      });
      
      res.json({
        opportunities: revenueEstimates,
        count: opportunities.length,
        totalEstimatedRevenue: revenueEstimates.reduce((sum, opp) => sum + opp.estimatedValue, 0),
        breakdown: {
          bySeverity: ['critical', 'severe', 'moderate', 'minor'].map(sev => ({
            severity: sev,
            count: opportunities.filter(opp => opp.severity === sev).length
          })),
          byType: ['tree_down', 'power_lines_down', 'debris', 'flooding', 'road_blocked'].map(type => ({
            type,
            count: opportunities.filter(opp => opp.type === type).length
          }))
        },
        filters: { state, severity, type, limit },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching contractor opportunities:', error);
      res.status(500).json({ error: 'Failed to fetch contractor opportunities' });
    }
  });

  // Advanced camera search with multiple filters
  app.get('/api/511/cameras/search', async (req, res) => {
    try {
      const { 
        states, // comma-separated list
        type, 
        lat, 
        lng, 
        radius, // in km
        includeInactive,
        limit 
      } = req.query;
      
      console.log('🔍 Performing advanced camera search...');
      
      const stateList = states ? (states as string).split(',') : ['CA', 'NY', 'TX', 'FL', 'WA'];
      let allCameras: any[] = [];
      
      // Fetch cameras from multiple states
      for (const state of stateList) {
        const stateCameras = await unified511Directory.getCamerasByState(state.trim());
        allCameras.push(...stateCameras);
      }
      
      // Apply filters
      let filteredCameras = allCameras;
      
      if (type) {
        filteredCameras = filteredCameras.filter(camera => camera.type === type);
      }
      
      if (includeInactive !== 'true') {
        filteredCameras = filteredCameras.filter(camera => camera.isActive);
      }
      
      // Geographic filtering
      if (lat && lng && radius) {
        const centerLat = Number(lat);
        const centerLng = Number(lng);
        const radiusKm = Number(radius);
        
        filteredCameras = filteredCameras.filter(camera => {
          const distance = calculateDistance(centerLat, centerLng, camera.lat, camera.lng);
          return distance <= radiusKm;
        });
      }
      
      if (limit) {
        filteredCameras = filteredCameras.slice(0, Number(limit));
      }
      
      res.json({
        cameras: filteredCameras,
        count: filteredCameras.length,
        searchParams: {
          states: stateList,
          type,
          centerPoint: lat && lng ? { lat: Number(lat), lng: Number(lng) } : null,
          radius: radius ? Number(radius) : null,
          includeInactive: includeInactive === 'true',
          limit: limit ? Number(limit) : null
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error performing camera search:', error);
      res.status(500).json({ error: 'Failed to perform camera search' });
    }
  });

  // Helper function for distance calculation
  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // ===== CONTRACTOR WATCHLIST ENDPOINTS =====
  
  // Get contractor's watchlist
  app.get('/api/contractor/watchlist/:contractorId', async (req, res) => {
    try {
      const { contractorId } = req.params;
      
      if (!contractorId) {
        return res.status(400).json({ error: 'Contractor ID is required' });
      }
      
      console.log(`📋 Fetching watchlist for contractor: ${contractorId}`);
      const watchlist = await storage.getContractorWatchlist(contractorId);
      
      res.json({ 
        watchlist, 
        contractorId,
        count: watchlist.length 
      });
    } catch (error) {
      console.error('❌ Error fetching contractor watchlist:', error);
      res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
  });
  
  // Add item to contractor's watchlist  
  app.post('/api/contractor/watchlist', async (req, res) => {
    try {
      // Validate request body with Zod
      const validatedData = insertContractorWatchlistSchema.parse(req.body);
      
      console.log(`✅ Adding to watchlist: ${validatedData.displayName} for contractor ${validatedData.contractorId}`);
      const watchlistItem = await storage.addWatchlistItem(validatedData);
      
      res.status(201).json({ success: true, item: watchlistItem });
    } catch (error) {
      console.error('❌ Error adding to watchlist:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to add to watchlist' });
    }
  });
  
  // Remove item from contractor's watchlist by ID
  app.delete('/api/contractor/watchlist/:watchlistId', async (req, res) => {
    try {
      const { watchlistId } = req.params;
      
      if (!watchlistId) {
        return res.status(400).json({ error: 'Watchlist ID is required' });
      }
      
      console.log(`🗑️ Removing from watchlist: ${watchlistId}`);
      
      // Get the item first to extract contractor, itemType, and itemId
      const watchlistItems = await storage.getContractorWatchlist('*'); // Get all items
      const item = watchlistItems.find(w => w.id === watchlistId);
      
      if (!item) {
        return res.status(404).json({ error: 'Watchlist item not found' });
      }
      
      const removed = await storage.removeWatchlistItem(item.contractorId, item.itemType, item.itemId);
      
      if (removed) {
        res.json({ success: true, message: 'Item removed from watchlist' });
      } else {
        res.status(404).json({ error: 'Watchlist item not found' });
      }
    } catch (error) {
      console.error('❌ Error removing from watchlist:', error);
      res.status(500).json({ error: 'Failed to remove from watchlist' });
    }
  });
  
  // Update watchlist item (toggle alerts, etc.)
  app.patch('/api/contractor/watchlist/:watchlistId', async (req, res) => {
    try {
      const { watchlistId } = req.params;
      const updates = req.body;
      
      if (!watchlistId) {
        return res.status(400).json({ error: 'Watchlist ID is required' });
      }
      
      console.log(`📝 Updating watchlist item ${watchlistId}:`, updates);
      const updatedItem = await storage.updateWatchlistItem(watchlistId, updates);
      
      res.json({ success: true, item: updatedItem });
    } catch (error) {
      console.error('❌ Error updating watchlist:', error);
      if (error.message === 'Watchlist item not found') {
        return res.status(404).json({ error: 'Watchlist item not found' });
      }
      res.status(500).json({ error: 'Failed to update watchlist item' });
    }
  });

  // ===== Daily digest (7:00 ET) =====
  cron.schedule('0 7 * * *', async ()=>{
    try{
      const cons = readContractors().items||[]; const tasks = readTasks().items||[]; const today = new Date(); today.setHours(0,0,0,0); const start = today.getTime(); const end = start + 24*3600*1000;
      for (const ctr of cons){
        const items = tasks.filter((t: any)=> t.contractorId===ctr.id && t.startTs>=start && t.startTs<end).sort((a: any,b: any)=>a.startTs-b.startTs);
        if (!items.length) continue;
        const lines = items.map((t: any)=> `• ${new Date(t.startTs).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})} — ${t.title}${t.detail? ' — '+t.detail:''}`).join('\n');
        const html = `Today\'s tasks for ${ctr.name}:<br/><pre>${lines}</pre>`;
        if (transporter && ctr.email){ try{ await transporter.sendMail({ from: process.env.SMTP_FROM||process.env.SMTP_USER, to: ctr.email, subject:'Daily Tasks', html }); }catch{} }
        // SMS disabled - add Twilio client initialization if needed
      }
    }catch{}
  });

  const httpServer = createServer(app);
  return httpServer;
}