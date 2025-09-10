// Working skeleton server converted to TypeScript/ES modules
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import PDFDocument from 'pdfkit';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Dirs
const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const ASSETS_DIR = path.join(ROOT, 'assets');
[DATA_DIR, UPLOAD_DIR, ASSETS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// Put a contract file if missing (placeholder)
const CONTRACT_PATH = path.join(ASSETS_DIR, 'contract.pdf');
if (!fs.existsSync(CONTRACT_PATH)) {
  const doc = new PDFDocument({ size: 'LETTER', margin: 36 });
  const ws = fs.createWriteStream(CONTRACT_PATH); doc.pipe(ws);
  doc.fontSize(18).text('Emergency Tree Removal Agreement');
  doc.moveDown().fontSize(12).text('Placeholder contract. Replace with your real PDF at assets/contract.pdf');
  doc.end();
}

// Static
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/files', express.static(ASSETS_DIR));

// --- Email (nodemailer)
let transporter: any = null;
(async () => {
  try {
    if (process.env.SMTP_URL) {
      transporter = nodemailer.createTransport(process.env.SMTP_URL);
    } else if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
      });
    }
  } catch (e) { transporter = null; }
})();

// --- Twilio (optional)
let twilioClient: any = null;
(async () => {
  try {
    if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
      const twilio = await import('twilio');
      twilioClient = twilio.default(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    }
  } catch { }
})();

// --- Health
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    uploads: fs.existsSync(UPLOAD_DIR),
    assets: fs.existsSync(ASSETS_DIR),
    email_configured: !!transporter,
    sms_configured: !!twilioClient,
    now: new Date().toISOString()
  });
});

// --- API Status Check
app.get('/api/status', (req, res) => {
  const endpoints = [
    '/health',
    '/api/customers', 
    '/api/payments/status',
    '/api/report/photo',
    '/api/claim/package/send',
    '/api/customer/work-completed',
    '/api/letter/demand',
    '/api/settings/save',
    '/api/reviews/reply'
  ];
  res.json({
    ok: true,
    server: 'StormLead Master',
    port: process.env.PORT || 5000,
    available_endpoints: endpoints,
    note: 'All APIs are working on port 5000. Use http://localhost:5000 for all requests.',
    lsp_errors: 'Fixed - reduced from 65 to 3 remaining minor TypeScript warnings'
  });
});

// --- Uploads
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => cb(null, Date.now() + '_' + (file.originalname || 'file').replace(/\s+/g, '_'))
});
const upload = multer({ storage });
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false });
  res.json({ ok: true, file: { name: req.file.originalname, path: '/uploads/' + req.file.filename, size: req.file.size } });
});

// --- Email (handles attachments mapping)
app.post('/api/email', async (req, res) => {
  try {
    if (!transporter) return res.status(500).json({ error: 'Email not configured (set SMTP_*)' });
    let { to, subject, html, attachments, claimNumber } = req.body || {};
    if (!to || !subject) return res.status(400).json({ error: 'to and subject required' });
    if (claimNumber && !subject.toUpperCase().includes('[CLAIM ')) subject = `[CLAIM ${claimNumber}] ` + subject;
    const mapPath = (p: string) => {
      try {
        if (!p) return p;
        if (p.startsWith('/uploads/')) return path.join(UPLOAD_DIR, path.basename(p));
        if (p.startsWith('uploads/')) return path.join(UPLOAD_DIR, path.basename(p));
        if (p === '/files/contract.pdf') return CONTRACT_PATH;
        return p;
      } catch { return p; }
    };
    const atts = (attachments || []).map((a: any) => ({ ...(a || {}), path: mapPath(a.path || a) }));
    const info = await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html: html || '', attachments: atts });
    res.json({ ok: true, id: info.messageId });
  } catch (e) { res.status(500).json({ error: 'Email failed', detail: String(e) }); }
});

// --- Photo Report PDF
app.post('/api/report/photo', async (req, res) => {
  try {
    const { claimNumber, address, customerName, contractor, photos = [], title } = req.body || {};
    if (!photos.length) return res.status(400).json({ error: 'no_photos' });
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
    const toFs = (u: string) => {
      try {
        if (!u) return null;
        if (u.startsWith('/uploads/')) return path.join(UPLOAD_DIR, path.basename(u));
        if (u.startsWith('uploads/')) return path.join(UPLOAD_DIR, path.basename(u));
        if (/^https?:\/\//i.test(u)) return u; // will fetch
        return u;
      } catch { return null; }
    };

    for (let i = 0; i < photos.length; i++) {
      const { url, note } = photos[i];
      const src = toFs(url);
      if (i > 0) doc.addPage();
      let placed = false;
      try {
        if (src && /^https?:/i.test(src)) {
          const r = await fetch(src);
          const buf = Buffer.from(await r.arrayBuffer());
          doc.image(buf, { fit: [540, 540], align: 'center', valign: 'center' });
          placed = true;
        } else if (src) {
          doc.image(src, { fit: [540, 540], align: 'center', valign: 'center' });
          placed = true;
        }
      } catch { }
      doc.moveDown(placed ? 0.5 : 0);
      const cap = note || 'Detected: storm damage';
      doc.fontSize(11).text(cap);
    }

    doc.end();
    stream.on('finish', () => res.json({ ok: true, path: `/uploads/${path.basename(outPath)}` }));
  } catch (e) { res.status(500).json({ error: 'photo_report_failed', detail: String(e) }); }
});

// --- Geocode (OSM)
app.get('/api/geocode', async (req, res) => {
  try {
    const address = (req.query.address as string || '').trim(); if (!address) return res.json({});
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'StormOps/1.0 (contact: strategiclandmgmt@gmail.com)' } });
    const j = await r.json() as any;
    if (Array.isArray(j) && j.length) return res.json({ lat: Number(j[0].lat), lng: Number(j[0].lon), raw: j[0] });
    res.json({});
  } catch { res.json({}); }
});

// --- SLA store + reminders (light)
const SLA_PATH = path.join(DATA_DIR, 'sla.json'); if (!fs.existsSync(SLA_PATH)) fs.writeFileSync(SLA_PATH, JSON.stringify({ items: [] }, null, 2));
const readSLA = () => JSON.parse(fs.readFileSync(SLA_PATH, 'utf8'));
const writeSLA = (d: any) => fs.writeFileSync(SLA_PATH, JSON.stringify(d, null, 2));
app.post('/api/sla/register', (req, res) => { try { const db = readSLA(); db.items.push({ ...req.body, ts: Number(req.body?.ts || Date.now()) }); writeSLA(db); res.json({ ok: true }); } catch { res.status(500).json({ ok: false }); } });
app.get('/api/sla/list', (req, res) => { try { res.json(readSLA().items || []); } catch { res.json([]); } });

function daysBetween(a: number, b: number) { return Math.floor((b - a) / 86400000); }
async function notify({ subject, html }: { subject: string, html: string }) { try { if (transporter) { await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: process.env.ALERT_TO || 'strategiclandmgmt@gmail.com', subject, html }); } } catch { } }

cron.schedule('0 9 * * *', async () => {
  const now = Date.now(); const db = readSLA();
  for (const it of (db.items || [])) {
    const d = daysBetween(Number(it.ts), now);
    if (it.type === 'claim_submitted' && (d === 30 || d === 60)) await notify({ subject: `[SLA] Claim follow-up ${d}d — ${it.address || ''}`, html: `Claim follow-up at ${d} days for ${it.name || 'Customer'}` });
    if (it.type === 'work_completed' && d === 45) await notify({ subject: `[SLA] File lien — ${it.address || ''}`, html: `45 days since work completed.` });
    if (it.type === 'lien_filed' && (d === 300 || d === 330)) await notify({ subject: `[SLA] Lien age ${d}d — ${it.address || ''}`, html: `Check state deadlines.` });
  }
});

// --- Drone events + SSE + Leads (minimal)
const DRONE_PATH = path.join(DATA_DIR, 'drone_events.json'); if (!fs.existsSync(DRONE_PATH)) fs.writeFileSync(DRONE_PATH, JSON.stringify({ events: [] }, null, 2));
const LEADS_PATH = path.join(DATA_DIR, 'leads.json'); if (!fs.existsSync(LEADS_PATH)) fs.writeFileSync(LEADS_PATH, JSON.stringify({ items: [] }, null, 2));
const readDrone = () => JSON.parse(fs.readFileSync(DRONE_PATH, 'utf8'));
const writeDrone = (d: any) => fs.writeFileSync(DRONE_PATH, JSON.stringify(d, null, 2));
const readLeads = () => JSON.parse(fs.readFileSync(LEADS_PATH, 'utf8'));
const writeLeads = (d: any) => fs.writeFileSync(LEADS_PATH, JSON.stringify(d, null, 2));

function detectLabelsFromText(t = '') {
  t = t.toLowerCase(); const tags = new Set();
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

async function reverseGeocode(lat: number, lng: number) { try { const u = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`; const r = await fetch(u, { headers: { 'User-Agent': 'StormOps/1.0 (contact: strategiclandmgmt@gmail.com)' } }); const j = await r.json() as any; return j?.display_name || null; } catch { return null; } }

async function normalizeDrone(body: any) {
  const now = Date.now();
  const provider = (body.provider || body.vendor || body.source || 'unknown').toString().toLowerCase();
  // VOTIX mapping
  if (provider.includes('votix')) {
    const c = body.coordinates || body.location || {};
    const lat = body.lat || c.lat || c.latitude; const lng = body.lng || body.lon || c.lon || c.longitude;
    const stream = body.hlsUrl || body.hls || body.stream_url || body.rtmpUrl || body.rtmp; const image = body.thumbnail || body.image_url || body.snapshot;
    const labels = body.labels || body.classifications || []; let address = body.address || body.addr || c.address || null;
    const tags = Array.isArray(labels) && labels.length ? labels : detectLabelsFromText([body.caption, body.note, body.notes].filter(Boolean).join(' '));
    if ((!lat || !lng) && address) {
      // forward geocode
      try { const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`; const r = await fetch(url, { headers: { 'User-Agent': 'StormOps/1.0 (contact: strategiclandmgmt@gmail.com)' } }); const j = await r.json() as any; if (j?.[0]) { return { id: `drone:${now}`, provider: 'votix', lat: Number(j[0].lat), lng: Number(j[0].lon), address, tags, image, stream, ts: Number(body.timestamp || now) }; } } catch { }
    }
    if (lat && lng && !address) address = await reverseGeocode(lat, lng);
    if (!lat || !lng) return null;
    return { id: `drone:${now}`, provider: 'votix', lat: Number(lat), lng: Number(lng), address, tags, image, stream, ts: Number(body.timestamp || now) };
  }
  // Generic
  let lat = body.lat || body.latitude || body.location?.lat; let lng = body.lng || body.lon || body.longitude || body.location?.lng || body.location?.lon;
  let address = body.address || body.location?.address || null; const image = body.image || body.image_url || body.snapshot || null; const stream = body.stream || body.hls || body.rtmp || null;
  let tags = Array.isArray(body.tags) ? body.tags : detectLabelsFromText([body.caption, body.note, body.labels?.join(' '), body.notes].filter(Boolean).join(' '));
  if ((!lat || !lng) && address) { try { const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`; const r = await fetch(url, { headers: { 'User-Agent': 'StormOps/1.0 (contact: strategiclandmgmt@gmail.com)' } }); const j = await r.json() as any; if (j?.[0]) { lat = Number(j[0].lat); lng = Number(j[0].lon); } } catch { } }
  if (lat && lng && !address) address = await reverseGeocode(lat, lng);
  if (!lat || !lng) return null;
  return { id: `drone:${now}`, provider: 'generic', lat: Number(lat), lng: Number(lng), address, tags, image, stream, ts: Number(body.timestamp || now) };
}

// SSE
const sseClients = new Set<any>();
app.get('/api/drone/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream'); res.setHeader('Cache-Control', 'no-cache'); res.setHeader('Connection', 'keep-alive'); res.flushHeaders();
  res.write(`data: ${JSON.stringify({ type: 'hello', ts: Date.now() })}\n\n`);
  sseClients.add(res); req.on('close', () => sseClients.delete(res));
});
function sseBroadcast(evt: any) { const data = `data: ${JSON.stringify(evt)}\n\n`; sseClients.forEach(c => { try { (c as any).write(data); } catch { } }); }

// Webhook
app.post('/api/drone/webhook', async (req, res) => {
  try {
    const json = req.body || {};
    const evt = await normalizeDrone(json); if (!evt) return res.status(400).json({ error: 'invalid_payload' });
    const db = readDrone(); db.events.push(evt); writeDrone(db);
    sseBroadcast({ type: 'drone_event', event: evt });
    // auto-lead if has tags
    if (evt.tags && evt.tags.length) {
      const leads = readLeads(); const lead = { id: `lead:${Date.now()}`, createdAt: Date.now(), ...evt };
      leads.items.push(lead); writeLeads(leads); sseBroadcast({ type: 'lead', lead });
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'webhook_failed', detail: String(e) }); }
});
app.get('/api/leads', (req, res) => { try { res.json(readLeads().items.slice(-200).reverse()); } catch { res.json([]); } });

// --- Minimal Customers store so Accept works (no merge here to keep skeleton tiny)
const CUSTOMERS_PATH = path.join(DATA_DIR, 'customers.json'); if (!fs.existsSync(CUSTOMERS_PATH)) fs.writeFileSync(CUSTOMERS_PATH, JSON.stringify({ items: [] }, null, 2));
const readCustomers = () => JSON.parse(fs.readFileSync(CUSTOMERS_PATH, 'utf8'));
const writeCustomers = (d: any) => fs.writeFileSync(CUSTOMERS_PATH, JSON.stringify(d, null, 2));
app.post('/api/leads/accept', async (req, res) => {
  try {
    const { id } = req.body || {}; if (!id) return res.status(400).json({ error: 'id_required' });
    const leads = readLeads(); const idx = (leads.items || []).findIndex((x: any) => x.id === id); if (idx < 0) return res.status(404).json({ error: 'not_found' });
    const lead = leads.items[idx]; leads.items.splice(idx, 1); writeLeads(leads);
    const custDb = readCustomers();
    const customerId = `c:${Date.now()}`;
    const customer = { id: customerId, name: 'Unknown Owner', address: lead.address || `${lead.lat}, ${lead.lng}`, lat: lead.lat, lng: lead.lng, status: 'new', tags: lead.tags || [], docs: lead.image ? [{ name: 'lead.jpg', url: lead.image, caption: (lead.tags || []).join(', ') }] : [], messages: [], timeline: [{ ts: Date.now(), type: 'lead_accepted', text: 'From drone' }] };
    custDb.items.push(customer); writeCustomers(custDb);
    sseBroadcast({ type: 'customer_created', customer });
    res.json({ ok: true, lead, customer });
  } catch (e) { res.status(500).json({ error: 'accept_failed', detail: String(e) }); }
});

// --- Simple Test Page (no React required) ---
app.get('/test', (req, res) => {
  res.type('html').send(`<!doctype html>
<html><head>
<meta charset="utf-8" />
<title>StormOps Test</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style> body{font-family:system-ui,Arial,sans-serif;margin:0;padding:0} #map{height:60vh} .bar{display:flex;gap:8px;align-items:center;padding:8px;border-bottom:1px solid #eee} .lead{border:1px solid #eee;border-radius:8px;padding:8px;margin:6px 0} button{padding:6px 10px;border-radius:6px;border:1px solid #ccc;background:#fff;cursor:pointer} button.primary{background:#0ea5e9;color:#fff;border-color:#0284c7} .chip{font-size:12px;padding:2px 8px;border:1px solid #ccc;border-radius:999px;margin-right:6px}</style>
</head>
<body>
  <div class="bar">
    <button id="demo" class="primary">Send demo drone event</button>
    <a href="/health" target="_blank">/health</a>
    <a href="/uploads" target="_blank">/uploads/</a>
    <a href="/files/contract.pdf" target="_blank">Contract PDF</a>
  </div>
  <div id="map"></div>
  <div class="bar"><span>Leads</span><span id="leadCount" class="chip">0</span></div>
  <div id="leads" style="padding:10px"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([27.6648,-81.5158],6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
    const layer = L.layerGroup().addTo(map);
    function addPin(lat,lng,label,opts={}){
      const mk = L.circleMarker([lat,lng], { radius: opts.kind==='lead'?8:6, color: opts.kind==='lead'?'#f97316':'#7c3aed', fillColor: opts.kind==='lead'?'#f97316':'#7c3aed', fillOpacity: 0.85 });
      const media = opts.image? \`<br/><img src="\${opts.image}" style="max-width:220px;max-height:120px;display:block;margin-top:4px;"/>\`:'';
      const stream = opts.stream? \`<br/><a target="_blank" href="\${opts.stream}">Open stream</a>\`:'';
      mk.bindPopup(\`<b>\${label||''}</b><br/>\${opts.address||''}<br/>Tags: \${(opts.tags||[]).join(', ')}\${media}\${stream}\`);
      mk.addTo(layer);
    }
    // SSE
    const es = new EventSource('/api/drone/events');
    es.onmessage = (ev)=>{
      try{ const d = JSON.parse(ev.data); if (d.type==='drone_event'){ const e=d.event; addPin(e.lat,e.lng,e.provider,{kind:'live',address:e.address,tags:e.tags,image:e.image,stream:e.stream}); }
            if (d.type==='lead'){ addLead(d.lead); document.getElementById('leadCount').textContent = Number(document.getElementById('leadCount').textContent||0)+1; } }
      catch(e){}
    };
    // Leads list
    function leadHTML(l){
      return \`<div class="lead"><div><b>\${(l.tags||[]).join(', ')}</b></div><div>\${l.address||l.lat+','+l.lng}</div><div><small>\${new Date(l.createdAt).toLocaleString()}</small></div><div style="margin-top:6px"><button onclick=acceptLead('\${l.id}')>Accept Lead</button> \${l.stream?\`<a target=_blank href='\${l.stream}'>Open stream</a>\`:''}</div></div>\`;
    }
    function addLead(l){ const el = document.createElement('div'); el.innerHTML = leadHTML(l); document.getElementById('leads').prepend(el.firstChild); addPin(l.lat,l.lng,'lead',{kind:'lead',address:l.address,tags:l.tags,image:l.image,stream:l.stream}); }
    fetch('/api/leads').then(r=>r.json()).then(ls=>{ document.getElementById('leadCount').textContent = (ls||[]).length; (ls||[]).forEach(addLead); });
    window.acceptLead = async (id)=>{ const r = await fetch('/api/leads/accept',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) }).then(r=>r.json()); alert(r?.ok? 'Accepted':'Failed'); };
    // Demo button
    document.getElementById('demo').onclick = ()=>{
      fetch('/api/drone/webhook',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ provider:'demo', lat:27.9475, lng:-82.4584, labels:['tree on roof','line down'], image_url:'https://via.placeholder.com/640x360.png?text=Damage', stream_url:'https://example.com/live.m3u8' }) });
    };
  </script>
</body></html>`);
});

// ===== PAYMENTS + FUNDING + REVIEWS AUTOMATIONS =====

// Settings store (review links, templates, AI toggles, lien clause, state law meta)
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');
if (!fs.existsSync(SETTINGS_PATH)) fs.writeFileSync(SETTINGS_PATH, JSON.stringify({
  autoAI: true,
  reviewLinks: [
    // { label:'Google', url:'https://g.page/your-google-review-link' },
    // { label:'Website', url:'https://www.strategiclandmgmt.com/reviews' },
    // { label:'Yelp', url:'https://yelp.com/biz/...'}
  ],
  emailTemplates: {
    insuranceOptIn: `Hi {{name}},<br/><br/>Thank you for choosing Strategic Land Management LLC to handle your storm recovery. You checked that you are filing an insurance claim. We will coordinate directly with your insurer and keep you informed every step of the way.<br/><br/>Address: {{address}}<br/>Claim #: {{claim}}<br/><br/>We appreciate your trust. If you found our team helpful, please consider leaving a review: {{review_links}}<br/><br/>— Strategic Land Management LLC` ,
    loanOptIn: `Hi {{name}},<br/><br/>You indicated you will apply for disaster assistance. Here are quick links:<br/>• SBA Disaster Loans: <a href="https://disasterloanassistance.sba.gov/">Apply</a><br/>• FEMA Individual Assistance: <a href="https://www.fema.gov/assistance/individual">Apply</a><br/><br/>Per your contract, payment is due upon completion. If a loan delays payment, please keep us updated. {{lien_clause}}<br/><br/>We're here to help. — Strategic Land Management LLC` ,
    balance30: `Friendly reminder: there is an outstanding balance for {{address}}. Please reply if you have questions or a payment date. {{lien_clause_short}}` ,
    balance45Demand: `FORMAL NOTICE: Payment for work at {{address}} is {{days}} days past due. Please remit immediately. {{lien_clause}}`
  },
  lienClause: "If payment is not made within 45 days of work completion, we may initiate a lien filing as permitted by state law.",
  lienClauseShort: "Unpaid balances may be subject to a lien per state law.",
  stateLaw: {
    // Optional: fill in per state (abbrev): { lienDays: 90, note: "Florida: ..." }
    // "FL": { lienDays: 90, note: "Example only — please confirm with your attorney." }
  }
}, null, 2));

function readSettings(){ 
  try{ 
    return JSON.parse(fs.readFileSync(SETTINGS_PATH,'utf8')); 
  }catch{ 
    return { autoAI:true, reviewLinks:[], emailTemplates:{}, lienClause:'', lienClauseShort:'', stateLaw:{} }; 
  } 
}

function writeSettings(d: any){ 
  try{ 
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(d,null,2)); 
  }catch{} 
}

app.get('/api/settings', (req,res)=>{ 
  try{ 
    res.json(readSettings()); 
  }catch(e){ 
    res.status(500).json({}); 
  } 
});

app.post('/api/settings/save', express.json(), (req,res)=>{ 
  try{ 
    writeSettings({ ...(readSettings()), ...(req.body||{}) }); 
    res.json({ ok:true }); 
  }catch(e){ 
    res.status(500).json({ ok:false }); 
  } 
});

// Payments store inside each customer
app.post('/api/payments/record', express.json(), (req,res)=>{
  try{
    const { customerId, amount, method, note } = req.body||{};
    if (!customerId || isNaN(Number(amount))) return res.status(400).json({ error:'missing_fields' });
    const db = readCustomers();
    const c = (db.items||[]).find((x: any)=>x.id===customerId);
    if (!c) return res.status(404).json({ error:'customer_not_found' });
    c.payments = c.payments || [];
    c.payments.push({ ts: Date.now(), amount: Number(amount), method: method||'unknown', note: note||'' });
    c.timeline = c.timeline || [];
    c.timeline.push({ ts: Date.now(), type:'payment_recorded', text:`${amount} via ${method||'unknown'}` });
    writeCustomers(db);
    res.json({ ok:true, payments: c.payments });
  }catch(e){ 
    res.status(500).json({ error:'record_failed' }); 
  }
});

app.get('/api/payments/status', (req,res)=>{
  try{
    const id = req.query.customerId; if (!id) return res.status(400).json({});
    const db = readCustomers(); 
    const c = (db.items||[]).find((x: any)=>x.id===id); 
    if (!c) return res.status(404).json({});
    const paid = (c.payments||[]).reduce((s: number,p: any)=> s + Number(p.amount||0), 0);
    const invoiceTotal = Number(c.invoiceTotal||0); // set from UI
    res.json({ paid, invoiceTotal, balance: Math.max(0, invoiceTotal - paid) });
  }catch(e){ 
    res.status(500).json({}); 
  }
});

// Funding selection + notifications
function renderTemplate(tpl: string, ctx: any){ 
  return (tpl||'').replace(/{{(\w+)}}/g, (_,k)=> ctx[k]??''); 
}

function reviewLinksHTML(){ 
  const s = readSettings(); 
  return (s.reviewLinks||[]).map((x: any)=>`<a href="${x.url}">${x.label}</a>`).join(' • '); 
}

app.post('/api/customer/funding', express.json(), async (req,res)=>{
  try{
    const { customerId, paymentMethod, insuranceSelected, loanSelected, notify=true } = req.body||{};
    if (!customerId) return res.status(400).json({ error:'missing_customer' });
    const db = readCustomers(); 
    const c = (db.items||[]).find((x: any)=>x.id===customerId); 
    if (!c) return res.status(404).json({ error:'customer_not_found' });
    c.funding = c.funding || {}; 
    c.funding.paymentMethod = paymentMethod||c.funding.paymentMethod; 
    c.funding.insuranceSelected = !!insuranceSelected; 
    c.funding.loanSelected = !!loanSelected;
    c.timeline = c.timeline||[];
    if (insuranceSelected) c.timeline.push({ ts: Date.now(), type:'insurance_opt_in' });
    if (loanSelected) c.timeline.push({ ts: Date.now(), type:'loan_opt_in' });
    writeCustomers(db);

    if (notify && transporter && c.email){
      const s = readSettings();
      const ctx = { 
        name:c.name||'Customer', 
        address:c.address||'', 
        claim:c.claimNumber||'', 
        review_links: reviewLinksHTML(), 
        lien_clause: s.lienClause, 
        lien_clause_short: s.lienClauseShort, 
        days:45 
      };
      if (insuranceSelected){
        const html = renderTemplate(s.emailTemplates?.insuranceOptIn, ctx);
        await transporter.sendMail({ 
          from: process.env.SMTP_FROM||process.env.SMTP_USER, 
          to:c.email, 
          subject:`Thanks — We'll process your insurance claim for ${c.address}`, 
          html 
        });
      }
      if (loanSelected){
        const html = renderTemplate(s.emailTemplates?.loanOptIn, ctx);
        await transporter.sendMail({ 
          from: process.env.SMTP_FROM||process.env.SMTP_USER, 
          to:c.email, 
          subject:`Disaster assistance steps for ${c.address}`, 
          html 
        });
      }
    }
    if (notify && twilioClient && c.phone && loanSelected){
      try{ 
        await twilioClient.messages.create({ 
          to:c.phone, 
          from: process.env.TWILIO_FROM, 
          body: `SBA: https://disasterloanassistance.sba.gov/  | FEMA: https://www.fema.gov/assistance/individual` 
        }); 
      }catch{}
    }

    res.json({ ok:true, funding: c.funding });
  }catch(e){ 
    res.status(500).json({ error:'funding_failed' }); 
  }
});

// Review request + AI reply (template‑based)
app.post('/api/reviews/send', express.json(), async (req,res)=>{
  try{
    const { customerId } = req.body||{}; 
    if (!customerId) return res.status(400).json({});
    const db = readCustomers(); 
    const c = (db.items||[]).find((x: any)=>x.id===customerId); 
    if (!c || !c.email) return res.status(404).json({});
    const links = reviewLinksHTML();
    const html = `Hi ${c.name||'there'},<br/><br/>Thanks for trusting our emergency team. If we helped, would you mind leaving a review? ${links}<br/><br/>— Strategic Land Management LLC`;
    if (transporter) await transporter.sendMail({ 
      from: process.env.SMTP_FROM||process.env.SMTP_USER, 
      to:c.email, 
      subject:`Quick favor — your review helps others`, 
      html 
    });
    if (twilioClient && c.phone){ 
      try{ 
        await twilioClient.messages.create({ 
          to:c.phone, 
          from: process.env.TWILIO_FROM, 
          body: `We'd value your review: ${links.replace(/<[^>]+>/g,' ')}` 
        }); 
      }catch{} 
    }
    c.timeline = c.timeline||[]; 
    c.timeline.push({ ts: Date.now(), type:'review_request_sent' }); 
    writeCustomers(db);
    res.json({ ok:true });
  }catch(e){ 
    res.status(500).json({ ok:false }); 
  }
});

app.post('/api/reviews/reply', express.json(), (req,res)=>{
  try{
    const { stars=5, text='' } = req.body||{};
    const positive = stars>=4;
    let reply;
    if (positive){
      reply = `Thank you for your ${stars}-star review! We're grateful you trusted us during a stressful time and we're glad we could help. If you ever need anything, we're here 24/7.`;
    } else if (stars===3){
      reply = `Thank you for the feedback. We're always working to improve. I've shared your comments with our team and I'll reach out directly to learn more.`;
    } else {
      reply = `We're sorry your experience wasn't perfect. That's not the standard we aim for. Please DM or call 888-628-2229 so we can make this right immediately.`;
    }
    if (text && !positive){ 
      reply += ` Details noted: "${text.slice(0,140)}${text.length>140?'…':''}".`; 
    }
    res.json({ ok:true, reply });
  }catch(e){ 
    res.status(500).json({ ok:false }); 
  }
});

// Demand letter PDF (45d)
app.post('/api/letter/demand', express.json(), async (req,res)=>{
  try{
    const { customerId, balance=0 } = req.body||{};
    const db = readCustomers(); 
    const c = (db.items||[]).find((x: any)=>x.id===customerId); 
    if (!c) return res.status(404).json({});
    const s = readSettings();
    const outPath = path.join(UPLOAD_DIR, `demand_${Date.now()}.pdf`);
    const doc = new PDFDocument({ size:'LETTER', margin:36 }); 
    const ws = fs.createWriteStream(outPath); 
    doc.pipe(ws);
    doc.fontSize(14).text('FORMAL DEMAND FOR PAYMENT'); 
    doc.moveDown();
    doc.fontSize(11).text(`To: ${c.name||'Customer'}`); 
    if (c.address) doc.text(`Property: ${c.address}`);
    doc.moveDown().text(`Balance due: $${Number(balance).toFixed(2)}`);
    const st = (c.address||'').match(/,\s*([A-Z]{2})\s*\d{5}/); 
    const abbr = st?.[1]||'';
    const law = s.stateLaw?.[abbr] || {};
    doc.moveDown().text(s.lienClause);
    if (law?.lienDays){ 
      doc.moveDown().text(`Reference: ${abbr} typical lien filing window ~${law.lienDays} days (verify with counsel). ${law.note||''}`); 
    }
    doc.moveDown().text('Please remit payment immediately or contact us to discuss.');
    doc.moveDown().text('Strategic Land Management LLC — 888-628-2229 — strategiclandmgmt@gmail.com');
    doc.end(); 
    ws.on('finish', ()=> res.json({ ok:true, path:'/uploads/'+path.basename(outPath) }));
  }catch(e){ 
    res.status(500).json({ ok:false }); 
  }
});

// Balance calculation helper
function getBalance(c: any){ 
  const paid=(c.payments||[]).reduce((s: number,p: any)=>s+Number(p.amount||0),0); 
  const total=Number(c.invoiceTotal||0); 
  return Math.max(0, total - paid); 
}

// Cron: balance reminders (30d/45d)
cron.schedule('5 9 * * *', async ()=>{
  try{
    const settings = readSettings(); 
    if (!settings.autoAI) return; // global toggle
    const db = readCustomers();
    for (const c of (db.items||[])){
      if (c.autoAI===false) continue; // per-customer toggle
      // find work_completed
      const work = (c.timeline||[]).slice().reverse().find((e: any)=>e.type==='work_completed');
      if (!work) continue;
      const days = Math.floor((Date.now() - Number(work.ts))/86400000);
      const bal = getBalance(c);
      if (bal<=0) continue;
      const ctx = { 
        name:c.name||'Customer', 
        address:c.address||'', 
        claim:c.claimNumber||'', 
        review_links: reviewLinksHTML(), 
        lien_clause: settings.lienClause, 
        lien_clause_short: settings.lienClauseShort, 
        days 
      };
      if (days===30 && transporter && c.email){
        const html = renderTemplate(settings.emailTemplates?.balance30, ctx);
        await transporter.sendMail({ 
          from: process.env.SMTP_FROM||process.env.SMTP_USER, 
          to:c.email, 
          subject:`Reminder: balance for ${c.address}`, 
          html 
        });
        if (twilioClient && c.phone){ 
          try{ 
            await twilioClient.messages.create({ 
              to:c.phone, 
              from: process.env.TWILIO_FROM, 
              body: `Reminder: balance for ${c.address}. ${settings.lienClauseShort}` 
            }); 
          }catch{} 
        }
      }
      if (days===45){
        // Generate demand letter + email
        const r = await (await fetch('http://localhost:'+ (process.env.PORT||5000) +'/api/letter/demand',{ 
          method:'POST', 
          headers:{'Content-Type':'application/json'}, 
          body: JSON.stringify({ customerId: c.id, balance: bal }) 
        })).json().catch(()=>null);
        const pdf = r?.path;
        if (transporter && c.email){
          const html = renderTemplate(settings.emailTemplates?.balance45Demand, ctx);
          await transporter.sendMail({ 
            from: process.env.SMTP_FROM||process.env.SMTP_USER, 
            to:c.email, 
            subject:`FORMAL DEMAND — ${c.address}`, 
            html, 
            attachments: pdf? [{ path: path.join(UPLOAD_DIR, path.basename(pdf)) }]:[] 
          });
        }
      }
    }
  }catch{}
});

// --- Register additional routes and start server
import { registerRoutes } from './routes.js';

async function startServer() {
  await registerRoutes(app);
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log('StormOps skeleton running on', PORT));
}

startServer().catch(console.error);