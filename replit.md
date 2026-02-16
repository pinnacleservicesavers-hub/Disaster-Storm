# Disaster Direct

## Overview
Disaster Direct is a storm operations and claims management platform for contractors and property restoration professionals. It aims to streamline storm response, maximize insurance claim success, and provide robust documentation for damage assessment through real-time weather monitoring, AI assistance, and integrated claims management. The platform seeks to professionalize the storm response industry with an enterprise-grade interface, AI-curated visuals, and efficient operations. The WorkHub Marketplace extends the platform for everyday contractor and customer interactions.

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
- **Tree Incident Tracker**: Street-level tree-on-structure incident tracking with real-time in-app alerts, CMA generation, crew routing, and bulk import. Features priority-based sorting and incident detail views.
- **Universal Measurement Data Model**: Comprehensive measurement system supporting all contractor trades with a Measurement Core, Trade Modules, Scope Class System, Provenance Tracking, and Price Books.
- **Rachel Voice Guide System**: Centralized voice scripts for each module and trade-specific contractor guidance.
- **AI Before/After Visualization**: Generates visualizations of completed work using OpenAI image editing with material detection and trade-specific prompts.
- **WorkHub Marketplace**: A separate domain for everyday contractor/customer interactions featuring 12 AI-powered modules including ScopeSnap (AI Vision Analysis), PriceWhisperer (Smart Estimate Engine), ContractorMatch (AI Matching), CalendarSync (AI Scheduling), JobFlow (Project Command Center), MediaVault (Protected Documentation), CloseBot (AI Sales Agent), PayStream (Seamless Payments), ReviewRocket (Reputation Automation), FairnessScore (Trust Transparency), QuickFinance (Instant Financing), and ContentForge (Marketing Engine).
- **CrewLink Exchange™**: National workforce and equipment marketplace connecting skilled workers, professional crews, and equipment owners with opportunities. Features public marketplace, worker listings, crew listings, equipment rentals, AI scoring, and verification levels.
- **Multi-Trade Pricing Engines**: Professional-grade pricing engines for contractor trades providing ChatGPT-competitive accuracy, including Tree Removal, Roofing, Auto Repair, and Flooring.
- **AI BidIntel Pro**: Advanced procurement intelligence module with Rachel AI agent for contractor bid guidance. Features include USACE Outreach Center, Utility Contractor Readiness Center, Procurement Portal Finder, DOT Vendor Registration, Portal Assistant, and Bid Tracking.
- **Autonomous AI Agent System**: 17 AI agents running 24/7 non-stop for every module. Each agent performs module-specific tasks continuously (ScopeSnap Vision, PriceWhisperer Market, ContractorMatch AI, CalendarSync Scheduler, JobFlow Operations, MediaVault Protection, CloseBot Sales, PayStream Finance, ReviewRocket Reputation, FairnessScore Trust, QuickFinance Lending, ContentForge Marketing, BidIntel Procurement, Storm Intelligence, CrewLink Workforce, FEMA Compliance, Lead Pipeline). Backend service at `server/services/autonomousAgentService.ts`, status API at `/api/ai-agents/status`, per-module API at `/api/ai-agents/module/:moduleName`. Frontend shows `AutonomousAgentBadge` on each module page and `AutonomousAgentDashboard` on WorkHub main page.
- **MediaVault Creative Studio**: Enhanced MediaVault with 5 tabs: Media Vault (secure photo storage), AI Video (text-to-video concept generation with storyboards), Flyers & Ads (AI-generated promotional materials with images), Brochures (full campaign generation), and Created Gallery. Uses `/api/ai-ads/freeform-create` backend. No creative guardrails.
- **FEMA Audit Export Module**: Enterprise-grade FEMA compliance system for enhancing monitor efficiency. Features include AI digital field verification, **Layered Location Intelligence** (multi-signal verification with GPS, EXIF, time, weather, crew sign-in, load tickets, device fingerprint, photo — replacing old geofencing), immutable hash-chained audit logs (SHA-256), AI confidence scoring per field event, real-time compliance tracking per job/crew/project, load ticket chain of custody, rate validation engine, fraud detection AI, T&M 70-hour cap monitoring, and one-click export for FEMA-compliant audit packets. Includes **Storm Tracking & Compliance Link** (links active storms from hazard intelligence to FEMA contracts, cross-verifies weather signals, provides storm-correlated audit data), **Contract Document Vault** (secure upload/storage of MSAs, Rate Sheets, NTPs, Change Orders, Amendments, Supplemental Agreements, procurement docs — timestamped, user-stamped, contract-linked) and **Project Communications** (in-app messaging with threads, replies, role-based sender identification, priority levels, and a combined audit trail of all documents and messages for legal defensibility).
  - **Database tables**: fema_verification_events, fema_verification_signals, fema_verification_scores, fema_audit_chain, fema_compliance_status, fema_storm_event_links
  - **Storm-Audit Integration**: Storm Predictions module shows FEMA compliance widget; FEMA dashboard has Storm Tracking tab to link/unlink storms; Location Intelligence shows storm correlation in sidebar; weather signals cross-reference linked storm data.
- **Xactimate-Ready Estimating Strategy**: The platform collects measurements, photos, and scope documentation to produce pre-estimate worksheets, focusing on feeding complete scope information to human estimators for input into Xactimate.
- **Industry Benchmark Pricing Language**: Uses neutral terminology like "Industry-standard pricing ranges" or "Insurance-aligned benchmarks" for pricing.

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