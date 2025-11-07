# Disaster Direct

## Overview
Disaster Direct is a comprehensive storm operations and claims management platform designed for contractors and property restoration professionals. Its primary purpose is to streamline storm response, maximize insurance claim success, and provide robust documentation for damage assessment through real-time weather monitoring, AI assistance, and integrated claims management. The platform aims to professionalize the storm response industry with an enterprise-grade interface, AI-curated visuals, and efficient operations, targeting significant market potential.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Implementations (November 7, 2025)
- **✅ Event-Driven Architecture System** (replaces n8n/Zapier - SAVES $20-50/month)
  - **Database Schema**: 3 new tables (`system_events`, `automation_rules`, `automation_executions`)
  - **Event Emitter Service**: Tracks all business events (LeadCreated, QuoteSent, JobBooked, PaymentCaptured, TicketOpened)
  - **Automation Processor**: Executes actions automatically (send email, send SMS, update records, create tasks, webhooks)
  - **Cron Scheduler**: Runs automation processor every minute
  - **Automation Builder**: Create custom workflows without external services
  - **Monthly Savings**: $20-50 (n8n/Zapier eliminated)
  
- **✅ Quote/Estimate Builder System** (replaces QuickBooks/FreshBooks - SAVES $15-50/month)
  - **Database Schema**: 4 new tables (`quotes`, `quote_line_items`, `quote_templates`, `quote_versions`)
  - **Professional Quote Generation**: Auto-numbered quotes (Q-2025-001), customer info, damage type tracking
  - **Line Items Management**: Labor, materials, equipment, permits, disposal with quantity × unit price calculations
  - **Smart Templates**: Pre-built templates for storm damage (roof, tree, fence, flood) with reusable line items
  - **PDF Export**: Professional PDF generation with PDFKit (insurance-ready format, company branding)
  - **Email Delivery**: SendGrid integration with beautiful HTML emails and auto-tracking (viewed/accepted)
  - **Version Control**: Complete history snapshots, change tracking, who changed what & when
  - **AI Integration**: AI-suggested line items, confidence scoring, photo references, Xactimate compatibility
  - **Event-Driven**: QuoteCreated, QuoteSent, QuoteAccepted events integrate with automation engine
  - **API Endpoints**: 13 RESTful endpoints for CRUD, PDF export, email delivery, template management
  - **Monthly Savings**: $15-50 (QuickBooks/FreshBooks eliminated)

**Total Monthly Savings So Far: $35-100 (Event Automation + Quote Builder)**

## Recent Implementations (November 5, 2025)
- **✅ AI Lead Management System**: Complete AI-powered lead pipeline with multi-service tracking and automated outreach
  - **Database Schema**: 5 new tables (`ai_leads`, `ai_lead_services`, `ai_contractors`, `ai_assignments`, `ai_outreach_log`)
  - **AI Lead Expansion**: OpenAI GPT-4 analyzes damage photos/descriptions and expands into 10+ service categories (tree, roof, fence, pool, windows, siding, gutters, HVAC, electrical, plumbing)
  - **Smart Contractor Routing**: Tier 1 (premium) → Tier 2 (backup) assignment logic with performance scoring (0-100)
  - **Automated Outreach**: Twilio SMS/voice with local area codes + SendGrid email integration (mocked for dev)
  - **Lead Re-engagement**: Cron job runs every 6 hours to follow up on stale leads (48+ hours, <5 attempts)
  - **Analytics Dashboard**: Lead conversion metrics, contractor performance, service popularity
  - **Frontend UI**: Lead list with filters, service grid with checkboxes, contractor assignment interface
  - **API Routes**: 25+ endpoints for CRUD, service management, contractor assignment, analytics

## Recent Implementations (November 3, 2025)
- **✅ Production JWT Verification with JWKS**: Complete OIDC/JWKS verification system supporting Auth0, Clerk, and Supabase
  - JWKS caching and refresh from identity provider
  - Signature verification with RS/ES/PS algorithm support
  - Enforcement toggle (ON = strict verification, OFF = dev mode)
  - Admin configuration panel at `/admin/oidc`
  - Automatic Bearer token injection in API client
- **✅ Enhanced Auth System**: JWT-aware authentication with development and production modes
- **✅ Admin OIDC Configuration**: Beautiful UI for managing issuer, audience, and JWKS
- **✅ Security Middleware**: Request context extraction from verified JWT claims
- **✅ Health/Auth Diagnostics Endpoint** (`GET /api/health/auth`):
  - Shows OIDC configuration status (issuer, audience, enforce mode)
  - Reports JWKS cache status (key count, last fetch, metadata)
  - Token verification testing via `?token=` or `Authorization: Bearer` header
  - Displays unverified claims for inspection
  - Reports verification success/failure with detailed errors
- **✅ Background JWKS Auto-Refresh Service**:
  - Automatic JWKS refresh from identity provider on boot
  - Smart caching with ETag and Cache-Control support
  - Refresh interval: 30 minutes to 6 hours (based on provider hints)
  - Tracks metadata: last_fetch, last_status, etag, max_age
  - Handles 304 Not Modified efficiently
  - Detailed console logging for monitoring

## System Architecture

### UI/UX
- **Enterprise-Grade Design System**: Features AI-selected backgrounds, module-specific themes, and a comprehensive set of design tokens.
- **Module Theming**: Each module has a unique visual identity with curated backgrounds relevant to its function (e.g., hurricane satellite views for Weather Intelligence).
- **Reusable Components**: Includes `ModuleHero` (with parallax and dynamic backgrounds), `ModuleWrapper`, `ModuleAIAssistant` (floating AI chat with text and voice modes), and `StateCitySelector`.
- **Aesthetics**: Enhanced typography, glass morphism effects, and enterprise shadows.
- **Universal AI Assistant**: Provides module-specific context, text chat, and voice interaction using Web Speech API and ElevenLabs.
- **Navigation & Auth**: Global sticky `TopNav` with role selection and quick links, auto-generated breadcrumb navigation, and a pluggable authentication system (`client/src/lib/auth.ts`) supporting localStorage for demo mode with token support and a dedicated sign-out flow.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, React Router DOM (v6), Shadcn/ui (Radix UI + Tailwind CSS), TanStack Query, WebSocket integration, and context-based internationalization (English, Spanish).
- **Backend**: Node.js with Express.js (TypeScript, ES modules), Drizzle ORM with PostgreSQL, RESTful API, WebSocket support, image/video upload, and EXIF data extraction.
- **Database**: PostgreSQL with Drizzle ORM, storing key entities such as Users, Claims, Insurance Companies, Weather Alerts, and a complete Lead→Job→Claim→Payment workflow.
- **Authentication & Authorization**: Express sessions, PostgreSQL session store, role-based access control, protected API endpoints, and a pluggable auth adapter.
- **Real-time Data Processing**: Automated polling of NWS CAP alerts and Storm Prediction Center data, WebSocket events for live updates, and background workers for scheduled tasks.
- **Infrastructure**: Batch signing for map tiles, Cloudflare Worker for edge-based signing, GitHub Actions for CI/CD, and HMAC signing.
- **Disaster Lens Module**: Offline-first design utilizing service workers, IndexedDB, and background sync.
- **AI Model Configuration**: Anthropic Claude 3.5 Sonnet for damage detection, OpenAI GPT-4o-mini for hazard summaries, and xAI Grok-2 for storm intelligence.

### Feature Specifications
- **Multi-Hazard Monitoring**: Integration of 8 real-time data sources including NHC, USGS Earthquakes, NASA FIRMS Wildfire, and NOAA MRMS Radar.
- **Live Weather Intelligence Center**: Comprehensive dashboard with 7 feeds, live weather maps, environmental conditions, and AI Intelligence feature cards.
- **Storm Prediction & Contractor Deployment**: Predictive analytics for 12-72h forecasts, interactive Leaflet maps, and automated contractor alerts.
- **AI-Generated Module Backgrounds**: Unique, watermarked backgrounds for all 17 modules created using OpenAI DALL-E.
- **Real-Time Monitoring**: NWS severe weather alerts and Florida DOT DIVAS integration.
- **AI Integration**: xAI's Grok-2 orchestrates multi-peril analysis, predictive damage, and contractor deployment with OpenAI and Anthropic models.
- **Location Watchlist**: Secure API, CSV import/export, and Slack integration.
- **Property Data**: Multi-provider lookup (Smarty, Regrid, ATTOM, Melissa) and EagleView integration.
- **Legal Compliance**: State-specific lien deadline calculations and attorney directory.
- **Environmental Intelligence**: Ambee integration for real-time air quality, pollen, weather, fire, and soil conditions.
- **Advanced Hazard Processing**: Ingestion of NHC hurricane cone/track GeoJSON, MRMS radar contour processing, AI hazard summary generation, and AI staging location recommendations.
- **Lead → Job → Claim → Payment Workflow**: Comprehensive workflow supported by 7 new database tables, including Memberships, Contractor Profiles, Properties, Jobs, Media Assets, Contracts (with AOB support), and Job Invoices (with AI comparables and negotiation features).
- **Workflow API**: Over 25 functional endpoints for the lead-to-payment workflow, including Auth, Memberships, Contractor Profiles, Contracts, Properties, Jobs, Media, Invoices, and Contract Signing.

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
- **ElevenLabs**: Voice cloning and TTS (Rachel voice).
- **Slack**: Team collaboration.

### File Storage & Media
- **Supabase Storage**: File uploads.
- **Replit Object Storage**: Disaster Lens media.
- **jsQR Library**: QR code detection.
- **Jimp / Sharp**: Image processing.