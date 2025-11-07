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
- **SendGrid**: Email delivery.

### File Storage & Media
- **Supabase Storage**: File uploads.
- **Replit Object Storage**: Disaster Lens media.
- **jsQR Library**: QR code detection.
- **Jimp / Sharp**: Image processing.