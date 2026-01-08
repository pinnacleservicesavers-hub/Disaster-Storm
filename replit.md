# Disaster Direct

## Overview
Disaster Direct is a comprehensive storm operations and claims management platform for contractors and property restoration professionals. It aims to streamline storm response, maximize insurance claim success, and provide robust documentation for damage assessment through real-time weather monitoring, AI assistance, and integrated claims management. The platform seeks to professionalize the storm response industry with an enterprise-grade interface, AI-curated visuals, and efficient operations, targeting significant market potential.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
The platform features an enterprise-grade design system with AI-selected backgrounds, module-specific themes, and comprehensive design tokens. Key components include `ModuleHero` with parallax and dynamic backgrounds, `ModuleWrapper`, `ModuleAIAssistant` (floating AI chat with text and voice modes), and `StateCitySelector`. The aesthetic emphasizes enhanced typography, glass morphism effects, and enterprise shadows. A universal AI assistant provides module-specific context via text and voice. Navigation includes a global sticky `TopNav` with role selection and quick links, auto-generated breadcrumbs, and a pluggable authentication system supporting localStorage for demo mode and dedicated sign-out.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, React Router DOM (v6), Shadcn/ui (Radix UI + Tailwind CSS), TanStack Query, WebSocket integration, and context-based internationalization (English, Spanish).
- **Backend**: Node.js with Express.js (TypeScript, ES modules), Drizzle ORM with PostgreSQL, RESTful API, WebSocket support, image/video upload, and EXIF data extraction.
- **Database**: PostgreSQL with Drizzle ORM, storing key entities like Users, Claims, Insurance Companies, Weather Alerts, and a complete Lead→Job→Claim→Payment workflow.
- **Authentication & Authorization**: Express sessions, PostgreSQL session store, role-based access control, protected API endpoints, and a pluggable auth adapter supporting OIDC/JWKS verification with Auth0, Clerk, and Supabase.
- **Real-time Data Processing**: Automated polling of NWS CAP alerts and Storm Prediction Center data, WebSocket events for live updates, and background workers for scheduled tasks.
- **Infrastructure**: Batch signing for map tiles, Cloudflare Worker for edge-based signing, GitHub Actions for CI/CD, and HMAC signing.
- **Disaster Lens Module**: Offline-first design utilizing service workers, IndexedDB, and background sync.
- **AI Model Configuration**: Anthropic Claude 3.5 Sonnet for damage detection, OpenAI GPT-4o-mini for hazard summaries, and xAI Grok-2 for storm intelligence.

### Feature Specifications
- **Multi-Hazard Monitoring**: Integrates 8 real-time data sources (NHC, USGS Earthquakes, NASA FIRMS Wildfire, NOAA MRMS Radar).
- **Live Weather Intelligence Center**: Dashboard with 7 feeds, live maps, environmental conditions, and AI Intelligence feature cards.
- **Storm Prediction & Contractor Deployment**: Predictive analytics for 12-72h forecasts, interactive Leaflet maps, and automated contractor alerts.
- **AI-Generated Module Backgrounds**: Unique, watermarked backgrounds for all 17 modules using OpenAI DALL-E.
- **AI Integration**: xAI's Grok-2 orchestrates multi-peril analysis, predictive damage, and contractor deployment with OpenAI and Anthropic models.
- **Location Watchlist**: Secure API, CSV import/export, and Slack integration.
- **Property Data**: Multi-provider lookup (Smarty, Regrid, ATTOM, Melissa) and EagleView integration.
- **Legal Compliance**: State-specific lien deadline calculations and attorney directory.
- **Environmental Intelligence**: Ambee integration for real-time air quality, pollen, weather, fire, and soil conditions.
- **Advanced Hazard Processing**: Ingestion of NHC GeoJSON, MRMS radar contour processing, AI hazard summaries, and AI staging location recommendations.
- **Lead → Job → Claim → Payment Workflow**: Comprehensive workflow supported by 7 new database tables, including Memberships, Contractor Profiles, Properties, Jobs, Media Assets, Contracts (with AOB support), and Job Invoices (with AI comparables and negotiation features).
- **Event-Driven Architecture**: Internal system for tracking business events (e.g., LeadCreated, QuoteSent) and executing automated actions (send email, SMS, update records) via an Automation Processor and Cron Scheduler.
- **Quote/Estimate Builder**: Professional quote generation, line item management, smart templates, PDF export, email delivery (SendGrid), and version control.
- **Kanban Pipeline Dashboard**: Visual pipeline boards for Leads, Quotes, Jobs with drag & drop updates, real-time metrics, and multi-view support.
- **AI Lead Management System**: AI-powered lead pipeline with multi-service tracking, automated outreach (Twilio, SendGrid), smart contractor routing, and lead re-engagement.
- **Universal Measurement Data Model**: Comprehensive measurement system supporting all contractor trades with:
  - **Measurement Core**: Universal primitives (areas, lengths, counts, volumes, heights, angles) extracted from photos/video/LiDAR
  - **Trade Modules**: Roofing, Tree Removal, Drywall/Paint, Flooring, Debris - each with specialized capture flows and scope outputs
  - **Scope Class System**: Normalized job classification for apples-to-apples comparables across regions and complexity levels
  - **Provenance Tracking**: Full audit trail with AI model, methodology, confidence scores, and human review flags
  - **Price Books**: Contractor unit price templates for job cost breakdown and invoice generation
- **Evelyn Voice Guide System**: Centralized voice scripts for each module and trade-specific contractor guidance:
  - **Module Guides**: Dashboard, Weather Intelligence, Disaster Lens, Claims Management, Lead Pipeline, Scope Builder, Contract Center
  - **Trade Guides**: Roofing, Tree Removal, Drywall/Paint, Flooring with capture steps, scope questions, and safety reminders
  - **Voice API**: `/api/voice-guide/*` endpoints serving intro scripts, capture prompts, and scope question scripts

### WorkHub Marketplace (NEW - December 2024)
**Domain**: strategicservicesavers.org
**Purpose**: Everyday contractor/customer marketplace for non-emergency work, accessible nationwide. Separate from Disaster Direct (emergency storm work).

#### 12 AI-Powered Modules with Creative Names:
1. **ScopeSnap** (`/workhub/scopesnap`) - AI Vision Analysis: Upload photos/videos, get instant job analysis, issue detection, and trade recommendations
2. **PriceWhisperer** (`/workhub/pricewhisperer`) - Smart Estimate Engine: AI-powered pricing ranges, market comparisons, "Second Opinion Mode" for customers
3. **ContractorMatch** (`/workhub/contractormatch`) - Perfect Pairing: AI matches customers with verified contractors by trade, location, ratings, availability
4. **CalendarSync** (`/workhub/calendarsync`) - AI Scheduling: Auto-scheduling, smart reminders, customer direct booking, conflict prevention
5. **JobFlow** (`/workhub/jobflow`) - Project Command Center: Track jobs from estimate to completion with milestones and progress updates
6. **MediaVault** (`/workhub/mediavault`) - Protected Documentation: Before/During/After photo organization, dispute protection, social media ready
7. **CloseBot** (`/workhub/closebot`) - AI Sales Agent: Human-sounding voice calls to follow up on estimates, handle objections, close deals automatically
8. **PayStream** (`/workhub/paystream`) - Seamless Payments: Invoice creation, payment tracking, withdrawals, one-click customer checkout
9. **ReviewRocket** (`/workhub/reviewrocket`) - Reputation Automation: Auto-collect reviews, distribute to Google/Facebook, AI-powered responses
10. **FairnessScore** (`/workhub/fairnessscore`) - Trust Transparency: Scoring based on pricing accuracy, on-time arrival, completion speed, satisfaction
11. **QuickFinance** (`/workhub/quickfinance`) - Instant Financing: Pay-in-4, 6/12-month financing, partner lenders, contractors paid upfront
12. **ContentForge** (`/workhub/contentforge`) - Marketing Engine: Auto-create social posts, website galleries, and ads from job photos

#### Key Features:
- **Evelyn Voice Guidance**: All 12 modules include natural female voice (Samantha/Zira/Jenny preferred) with pitch 1.1, rate 1.05
- **Customer Portal** (`/workhub/customer`): 5-step project submission with AI photo analysis
- **Contractor Dashboard** (`/workhub/contractor`): Lead management, job tracking, calendar, payments, reviews
- **Separate Lead Management**: WorkHub leads are everyday (non-emergency) jobs vs Disaster Direct storm leads
- **TopNav Integration**: Gradient-styled "WorkHub" button in main navigation

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
- **xAI Grok**: Primary AI intelligence engine (Grok-2-1212, Grok-2-vision-1212).
- **OpenAI**: GPT-5-mini, GPT-4 for various AI tasks.
- **Twilio**: SMS alerts, voice calls.
- **ElevenLabs**: Voice cloning and TTS (Evelyn voice).
- **Slack**: Team collaboration.
- **SendGrid**: Email delivery.

### File Storage & Media
- **Supabase Storage**: File uploads.
- **Replit Object Storage**: Disaster Lens media.
- **jsQR Library**: QR code detection.
- **Jimp / Sharp**: Image processing.

## Strategic Business Direction

### Xactimate-Ready Estimating Strategy
**Core Principle:** Don't replace Xactimate — feed it.

**Compliance Model:**
1. Platform collects: measurements, photos, scope documentation
2. Output: Pre-estimate worksheets with complete scope
3. Human estimator inputs into Xactimate
4. Xactimate produces carrier-approved estimates

**Key Messaging:**
- ❌ Don't promise "Xactimate integration"
- ✅ Promise "Xactimate-ready estimates"
- ✅ Generate line-item suggestions, not prices
- ✅ Focus on scope completeness (where money is lost)

**Deliverables:**
- Normalized scope bundles (room/area breakdown, trade categorization, damage metadata)
- Photo logs with location/device metadata and annotations
- Measurement tables with dimensions
- AI-generated line-item suggestions with confidence scores
- Export formats: PDF, CSV, Xactimate-friendly templates
- Compliance notes (jurisdictional liens, permits)

**AI Damage Detection Role:**
- Propose scope items from analyzed imagery
- Flag uncertainty and attach annotated photos
- Log model provenance for estimator verification
- Prioritize completeness and documentation over pricing

**Quote Builder Adjustments:**
- Reframe as "Scope Builder" experience
- Disable automated pricing totals by default
- Add workflow states for estimator review
- Include Xactimate field mappings
- Surface scope completeness scorecards and checklists

**Business Rationale:**
Insurance companies pay scope — not software. Focus on capturing complete, well-documented scope to maximize claim success.

### Industry Benchmark Pricing Language
**Legal Compliance:** Use neutral benchmark terminology, never trademarked software names.

**Approved Language:**
- ✅ "Industry-standard pricing ranges"
- ✅ "Insurance-aligned benchmarks"
- ✅ "Regional market averages"
- ✅ "Carrier-typical reimbursement ranges"

**Prohibited Terms:**
- ❌ Xactimate
- ❌ Verisk
- ❌ Carrier pricing engine
- ❌ Any trademarked estimating software names

**Application:** All UI labels, voice narration, reports, exports, and marketing materials must use approved neutral terminology when referencing pricing benchmarks or industry standards.