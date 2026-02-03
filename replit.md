# Disaster Direct

## Overview
Disaster Direct is a storm operations and claims management platform for contractors and property restoration professionals. It aims to streamline storm response, maximize insurance claim success, and provide robust documentation for damage assessment through real-time weather monitoring, AI assistance, and integrated claims management. The platform seeks to professionalize the storm response industry with an enterprise-grade interface, AI-curated visuals, and efficient operations. A new WorkHub Marketplace extends the platform for everyday, non-emergency contractor and customer interactions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
The platform features an enterprise-grade design system with AI-selected backgrounds, module-specific themes, and comprehensive design tokens. Key components include `ModuleHero`, `ModuleWrapper`, `ModuleAIAssistant` (floating AI chat with text and voice modes), and `StateCitySelector`. The aesthetic emphasizes enhanced typography, glass morphism effects, and enterprise shadows. A universal AI assistant provides module-specific context. Navigation includes a global sticky `TopNav`, auto-generated breadcrumbs, and a pluggable authentication system.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, React Router DOM (v6), Shadcn/ui (Radix UI + Tailwind CSS), TanStack Query, WebSocket integration, and context-based internationalization.
- **Backend**: Node.js with Express.js (TypeScript, ES modules), Drizzle ORM with PostgreSQL, RESTful API, WebSocket support, image/video upload, and EXIF data extraction.
- **Database**: PostgreSQL with Drizzle ORM, supporting a complete Lead→Job→Claim→Payment workflow.
- **Authentication & Authorization**: Express sessions, PostgreSQL session store, role-based access control, protected API endpoints, and a pluggable auth adapter supporting OIDC/JWKS verification.
- **Real-time Data Processing**: Automated polling of NWS CAP alerts and Storm Prediction Center data, WebSocket events, and background workers.
- **Infrastructure**: Batch signing for map tiles, Cloudflare Worker for edge-based signing, GitHub Actions for CI/CD.
- **Disaster Lens Module**: Offline-first design utilizing service workers, IndexedDB, and background sync.
- **AI Model Configuration**: Anthropic Claude 3.5 Sonnet for damage detection, OpenAI GPT-4o-mini for hazard summaries, and xAI Grok-2 for storm intelligence.

### Feature Specifications
- **Multi-Hazard Monitoring**: Integrates 8 real-time data sources for weather intelligence.
- **Live Weather Intelligence Center**: Dashboard with live maps, environmental conditions, and AI features.
- **Storm Prediction & Contractor Deployment**: Predictive analytics and automated contractor alerts.
- **AI Integration**: xAI's Grok-2 orchestrates multi-peril analysis, predictive damage, and contractor deployment with OpenAI and Anthropic models, including AI-generated module backgrounds.
- **Location Watchlist**: Secure API, CSV import/export, and Slack integration.
- **Property Data**: Multi-provider lookup and EagleView integration.
- **Legal Compliance**: State-specific lien deadline calculations and attorney directory.
- **Environmental Intelligence**: Ambee integration for real-time conditions.
- **Advanced Hazard Processing**: Ingestion of NHC GeoJSON, MRMS radar contour processing, AI hazard summaries, and AI staging location recommendations.
- **Lead → Job → Claim → Payment Workflow**: Comprehensive workflow with new database tables for memberships, contractor profiles, properties, jobs, media, contracts, and invoices.
- **Event-Driven Architecture**: Internal system for tracking business events and executing automated actions via an Automation Processor and Cron Scheduler.
- **Quote/Estimate Builder**: Professional quote generation, line item management, smart templates, PDF export, email delivery, and version control.
- **Kanban Pipeline Dashboard**: Visual pipeline boards for Leads, Quotes, Jobs with drag & drop, real-time metrics, and multi-view support.
- **AI Lead Management System**: AI-powered lead pipeline with multi-service tracking, automated outreach, smart contractor routing, and lead re-engagement.
- **Tree Incident Tracker**: Street-level tree-on-structure incident tracking with real-time in-app alerts, CMA (Customer Mitigation Authorization) generation, crew routing, and bulk import from CSV/KML. Features priority-based sorting (immediate/high/medium/low), notification bell with polling, and incident detail views at /tree-tracker and /tree-tracker/:id.
- **Universal Measurement Data Model**: Comprehensive measurement system supporting all contractor trades with a Measurement Core, Trade Modules, Scope Class System, Provenance Tracking, and Price Books.
- **Rachel Voice Guide System**: Centralized voice scripts for each module and trade-specific contractor guidance.
- **AI Before/After Visualization**: Generates visualizations of completed work using OpenAI image editing with material detection and trade-specific prompts.
- **WorkHub Marketplace**: A separate domain for everyday contractor/customer interactions featuring 12 AI-powered modules including ScopeSnap (AI Vision Analysis), PriceWhisperer (Smart Estimate Engine), ContractorMatch (AI Matching), CalendarSync (AI Scheduling), JobFlow (Project Command Center), MediaVault (Protected Documentation), CloseBot (AI Sales Agent), PayStream (Seamless Payments), ReviewRocket (Reputation Automation), FairnessScore (Trust Transparency), QuickFinance (Instant Financing), and ContentForge (Marketing Engine).
- **CrewLink Exchange™**: National workforce and equipment marketplace connecting skilled workers, professional crews, and equipment owners with opportunities. Features include:
  - **Public Marketplace** (/crewlink): Free browsing for all users with state/city filtering and 36+ trade categories
  - **Worker Listings**: Individual worker profiles with skills, certifications, hourly/daily rates, AI scoring (experience, certs, performance)
  - **Crew Listings**: Professional crew profiles with team size, equipment, insurance, travel radius, storm/specialty availability
  - **Equipment Rentals**: Equipment listings with daily/weekly/monthly rates, operator requirements, delivery options
  - **AI Scoring System**: AIScoreBadge displays 0-100 score based on experience, certifications, and performance history
  - **Verification Levels**: unverified, basic, verified, elite - with VerificationBadge component
  - **Pricing Tiers**: Workers $19-29/mo, Crews $49-99/mo, Equipment $29-79/mo, Transaction fee 3-7%
  - **Legal Positioning**: Marketplace connects parties only (not an employer), contractors are independent entities
  - **Rachel Voice Guide**: ElevenLabs TTS introduction with stability 0.70, style 0.35
- **Multi-Trade Pricing Engines**: Professional-grade pricing engines for contractor trades providing ChatGPT-competitive accuracy:
  - **Tree Removal Pricing Engine**: Size-based pricing (small/medium/large/giant), hazard detection (power lines, structures, slope), equipment costs (bucket truck/crane), crew estimation, stump grinding, debris haul-off.
  - **Roofing Pricing Engine**: Square-footage based pricing (1 roofing square = 100 sq ft), 7 material options (3-tab asphalt $150-220/sq, architectural shingles $250-400/sq, metal $450-850/sq, clay tile $800-1500/sq, concrete tile $500-900/sq, slate $1000-2000/sq, wood shake $600-1000/sq), pitch multipliers (low 1.0x, medium 1.15x, steep 1.35x, very steep 1.6x), story height multipliers, complexity factors (valleys, skylights, dormers, chimneys, multi-level, hip roof), tear-off costs, additional work (deck repair, ventilation, gutters, fascia/soffit), permit costs, and crew/day estimation.
  - **Auto Repair Pricing Engine**: VIN decoder using NHTSA API, 20+ common parts database (fan motor, alternator, starter, brakes, water pump, etc.), symptom-to-parts matching, multi-retailer price comparison (AutoZone, O'Reilly, Advance Auto, RockAuto, NAPA), vehicle-specific price adjustments (luxury brand multipliers), labor hour estimates, affiliate link integration for commission revenue.
  - **Flooring Pricing Engine**: Square footage based pricing, 11 material options (solid hardwood, engineered hardwood, laminate, LVP, tile, carpet), retailer price comparison (Home Depot, Lowe's, Floor & Decor, LL Flooring), installation costs, condition-based adjustments (subfloor damage, removal, moisture), waste percentage calculation, affiliate link integration.
- **FEMA Audit Export Module** ($299/mo): Enterprise-grade FEMA compliance system designed to enhance monitor efficiency (not replace). Features include:
  - **AI Digital Field Verification**: Photo validation, GPS tracking, timestamp verification
  - **Geofenced Work Zones**: Span-based logging with pole/circuit tracking
  - **Load Ticket Chain of Custody**: GPS-tracked debris transport with pickup/dropoff verification
  - **Rate Validation Engine**: Compare actual rates vs contract rates, flag overages
  - **Fraud Detection AI**: Duplicate crew detection, worker conflict detection, rate variance analysis
  - **T&M 70-Hour Cap Monitoring**: Track Time & Materials against contract limits
  - **Immutable Audit Logs**: Hash-chained audit events with server-side timestamps
  - **One-Click Export**: Generate FEMA-compliant audit packets (XLSX, PDF)
  - **Database Tables**: 13 tables (fema_disasters, fema_contracts, fema_project_worksheets, fema_geo_zones, fema_work_logs, fema_load_tickets, fema_equipment_logs, fema_audit_logs, fema_ai_findings, fema_audit_risk_scores, fema_exports, fema_monitor_sessions, fema_expenses, fema_revenue_snapshots)
  - **API Routes**: /api/fema-audit/* with parameterized SQL queries for security
  - **Dashboard**: Risk score visualization, tabbed interface (Dashboard, Work Logs, Load Tickets, AI Findings, Exports)
  - **Strategic Positioning**: "Digital support tool to enhance monitor efficiency" rather than monitor replacement

### Strategic Business Direction
- **Xactimate-Ready Estimating Strategy**: The platform collects measurements, photos, and scope documentation to produce pre-estimate worksheets. It focuses on feeding complete scope information to human estimators for input into Xactimate, not replacing it. Key deliverables include normalized scope bundles, photo logs, measurement tables, and AI-generated line-item suggestions.
- **Industry Benchmark Pricing Language**: All UI, voice narration, reports, and marketing materials must use neutral terminology like "Industry-standard pricing ranges" or "Insurance-aligned benchmarks" to describe pricing, avoiding trademarked software names.

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL (Neon serverless).
- **Build Tools**: Vite, ESBuild.
- **Package Management**: NPM.

### Weather & Geographic Services
- **National Weather Service (NWS)**: CAP alerts, radar, forecasts.
- **Storm Prediction Center**: Local storm reports.
- **OpenStreetMap Nominatim**: Geocoding.
- **LocationIQ**: Reverse geocoding.
- **Ambee**: Environmental intelligence.
- **Xweather**: Global lightning and storm intelligence.
- **Tomorrow.io**: Hyperlocal weather intelligence.
- **National Hurricane Center (NHC)**: Real-time hurricane tracking.
- **USGS**: Earthquake monitoring, River Gauges.
- **NASA FIRMS**: Wildfire detection.
- **NOAA**: MRMS Radar/Precipitation, CO-OPS Coastal Surge, HMS Wildfire Smoke.
- **GFS/HRRR**: Wind Models.

### Payment & Legal Integration
- **Stripe**: Payment processing.
- **Dropbox Sign**: Electronic signatures.
- **Legal APIs**: Multi-state lien deadline tracking.

### Property Data Services
- **Smarty**: Address validation.
- **Regrid**: Property boundary data.
- **ATTOM Data**: Property details.
- **Melissa**: Address verification.
- **EagleView**: Aerial imagery, roof measurements, damage assessment.

### AI & Communication Services
- **xAI Grok**: Primary AI intelligence engine.
- **OpenAI**: GPT-5-mini, GPT-4 for various AI tasks.
- **Twilio**: SMS alerts, voice calls.
- **ElevenLabs**: Voice cloning and TTS.
- **Slack**: Team collaboration.
- **SendGrid**: Email delivery.

### File Storage & Media
- **Supabase Storage**: File uploads.
- **Replit Object Storage**: Disaster Lens media.
- **jsQR Library**: QR code detection.
- **Jimp / Sharp**: Image processing.