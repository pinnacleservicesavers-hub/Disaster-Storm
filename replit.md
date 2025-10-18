# Disaster Direct

## Overview
Disaster Direct is a comprehensive storm operations and claims management platform for contractors and property restoration professionals. It offers real-time weather monitoring, claims management, insurance tracking, legal compliance, drone integration, AI assistance, and field reporting. The platform aims to streamline storm response, maximize insurance claim success, and provides robust photo/video documentation for damage assessment.

## Recent Changes

### October 18, 2025 - Real-Time Traffic Monitoring & Severe Weather Alerts
- **Database Schema**: Added `roadIncidents` table for 511/DOT incident tracking, `contractorNotifications` table for notification audit, enhanced `weatherAlerts` with NWS-specific fields (event, state, headline, polygon, effective, expires), enhanced `users` with geo-matching fields (latitude, longitude, notifyRadiusMiles, pushEndpoint)
- **NWS Severe Weather Alerts**: Implemented US-wide poller for severe weather events (tornado warnings, high winds, hurricanes, floods) with 2-minute polling cycle integrated into DamageMonitoringScheduler
- **Florida Provider**: FDOT DIVAS ArcGIS FeatureServer integration for real-time cameras and incidents
  - Cameras: `https://gis.fdot.gov/arcgis/rest/services/DIVAS_Cameras/FeatureServer/0`
  - Incidents: `https://gis.fdot.gov/arcgis/rest/services/DIVAS_GetEvent/FeatureServer/0`
  - Severity mapping (minor/moderate/severe/critical)
  - Contractor opportunity detection (tree_down, debris, flooding, power_lines_down, road_blocked)
  - WGS84 coordinate normalization with outSR=4326 for accurate Florida placement (24-31°N, 80-87°W)
- **Alert Service**: NWS CAP API integration with repeated event parameters, polygon geometry extraction, state code detection from UGC codes
- **Provider Registry**: Florida registered alongside GA, CA, TX with 4 active state providers
- **Architect Review**: All implementations production-ready (NWS alerts, Florida provider with correct coordinate handling)
- **Impact**: Foundation for real-time traffic monitoring system with multi-source incident aggregation, severe weather alerting, and contractor geo-matching

### October 15, 2025 - Production Infrastructure Upgrades
- **Batch Signing**: Added `/api/sign/batch/tiles` and `/api/sign/batch/legend` endpoints for minting multiple signed URLs in single requests (massive performance boost for map tile loading)
- **Cloudflare Worker**: Edge-based signer deployable to Cloudflare Workers for 5-10ms global latency (vs 50-200ms to origin), with complete setup guide in `cloudflare-worker/README.md`
- **GitHub Actions CI/CD**: Automated Docker image builds to GHCR on version tags, enabling one-click deployment to Render/Railway
- **HMAC Signing Infrastructure**: Created signing helper module with signature generation, verification, and constant-time comparison for timing attack prevention
- **Documentation**: Updated `SECURITY_SETUP.md` with batch signing examples, Worker deployment guide, and CI/CD setup instructions
- **Impact**: Production-ready infrastructure with edge performance, automated deployments, and efficient tile signing

### October 15, 2025 - Enterprise Security & Admin Interface
- **Role-Based Authentication**: Implemented three-tier security (ADMIN/SIGNER/VIEWER) with hierarchical access control
- **Admin Interface**: Added `/admin` HTML dashboard for managing locations, alerts, CSV operations, and manual checks
- **Protected Endpoints**: All sensitive operations (locations write, alerts config, warm, CSV import) require ADMIN role
- **Signature Minting**: `/api/sign/*` endpoints protected with SIGNER role for controlled tile URL generation
- **Optional Viewer Gating**: JSON APIs (impact/nws/xweather) can be gated with VIEWER_API_TOKEN for read-only access
- **Docker Deployment**: Added Dockerfile and .dockerignore for containerized deployment on Render/Railway
- **Documentation**: Comprehensive security setup guide in `SECURITY_SETUP.md` with token management, deployment, and troubleshooting
- **Environment Variables**: `ADMIN_API_TOKEN`, `SIGNER_API_TOKEN`, `VIEWER_API_TOKEN` for granular access control
- **Backward Compatibility**: Legacy `BEARER_TOKEN` and `requireBearer()` still supported
- **Impact**: Production-ready security with role separation, audit trails, and enterprise-grade access control

### October 15, 2025 - Location Watchlist Production Features
- **Added**: Three enterprise-grade production features for Location Watchlist
- **Bearer Authentication**: Write endpoints (POST/PUT/DELETE) now protected with bearer token auth; read endpoints remain public
- **CSV Import/Export**: Bulk location management with `/api/locations/export` (public) and `/api/locations/import` (authenticated) endpoints
- **Slack Integration**: `/dd` slash commands for real-time monitoring (`/dd list`, `/dd impact <id>`, `/dd impact <lat,lng>`)
- **Security**: Request signature verification for Slack, constant-time comparison to prevent timing attacks
- **Documentation**: Complete setup guide in `WATCHLIST_PRODUCTION.md` with API endpoints, examples, and troubleshooting
- **Environment Variables**: `BEARER_TOKEN` for API auth, `SLACK_SIGNING_SECRET` for Slack webhook verification
- **Impact**: Production-ready watchlist with secure API access, bulk operations, and team collaboration via Slack

### October 15, 2025 - Voice Guide Enhancement for Location Watchlist
- **Added**: Voice guide integration for Location Watchlist feature in both VoiceGuide.tsx and PortalVoiceGuide.tsx
- **Enhancement**: Added comprehensive voice explanations covering multi-site monitoring, impact scoring, alert configuration, webhook integration, and manual refresh
- **Detail**: Six detailed voice sections guide contractors through location management, understanding impact scores (0-100 scale), configuring per-site alert thresholds, Slack webhook integration, and manual impact refreshing
- **Tour Update**: Location Watchlist now included in full guided tour sequence (after X-RAY REALITY portal)
- **Impact**: Contractors can now use Rachel voice guidance to learn Location Watchlist features and best practices for monitoring multiple sites

### October 15, 2025 - Live Intelligence AI Data Integration
- **Fixed**: Grok AI now fetches real-time storm data before answering queries
- **Enhancement**: `answerComprehensiveQuery()` now queries NWS alerts, tornado warnings, storm hot zones, predictions, and damage forecasts
- **Fix**: Resolved frontend/backend mismatch - server now returns both `incidents` and `relatedIncidents` for compatibility
- **Impact**: Live Intelligence AI can now answer "Where is the latest storm damage?" with actual real-time data instead of generic responses
- **Performance Note**: Each query fetches fresh data; consider caching for high-volume scenarios

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **UI**: Shadcn/ui (Radix UI + Tailwind CSS).
- **State Management**: TanStack Query.
- **Routing**: Wouter.
- **Real-time**: WebSocket integration.
- **Internationalization**: Context-based system (English, Spanish).
- **AI Integration**: xAI's Grok-2 powers all intelligence features.
- **Disaster Lens Module**: Offline-first design with service workers, IndexedDB, and background sync for media capture and collaboration.

### Backend
- **Runtime**: Node.js with Express.js (TypeScript, ES modules).
- **Database ORM**: Drizzle ORM with PostgreSQL.
- **API Design**: RESTful API with modular service layer.
- **Real-time**: WebSocket support.
- **File Processing**: Image/video upload, EXIF data extraction.

### Database
- **Primary Database**: PostgreSQL with Drizzle ORM.
- **Key Entities**: Users, Claims, Insurance Companies, Weather Alerts, Field Reports, Drone Footage, Lien Rules, and Disaster Lens entities.

### Authentication & Authorization
- **Session Management**: Express sessions with PostgreSQL session store.
- **Role-based Access**: Contractor, admin, crew member, and 5-tier for Disaster Lens.

### Service Layer Architecture
- **Weather Service**: Integrates NWS APIs.
- **Disaster Aggregator Service**: Unifies and normalizes disaster/weather data from multiple providers (NWS, FEMA, NOAA, Xweather, Ambee) into a single feed with risk scoring and intelligent deduplication.
- **AI Services**:
    - **AI Intelligence Orchestrator**: Coordinates Grok, OpenAI, and Anthropic models for multi-peril analysis, storm-to-property matching, predictive damage assessment, and contractor deployment strategies.
    - **OpenAI**: Claim letter generation, image analysis, market comparables, AI-powered damage hints, social media ad generation, and satellite imagery vision analysis.
    - **Grok AI**: Educational meteorology analysis, landfall prediction, tripwire monitoring, interactive Q&A, and real-time storm intelligence briefings.
    - **Anthropic Claude**: Advanced damage assessment and analysis.
- **Property Service**: Multi-provider property lookup (Smarty, Regrid, ATTOM, Melissa).
- **Legal Service**: State-specific lien deadline calculations, attorney directory.
- **Translation Service**: Bilingual support for construction/insurance terminology.
- **Geo-Fencing**: Law enforcement-grade device tracking for targeted advertising.
- **Environmental Intelligence**: Ambee integration for real-time air quality, pollen, weather, fire detection, and soil conditions with health impact analysis.
- **Aerial Imagery**: EagleView integration for high-resolution aerial imagery, automated roof measurements, and AI damage assessment.

### Real-time Data Processing
- **Weather Monitoring**: Automated polling of NWS CAP alerts and Storm Prediction Center data.
- **WebSocket Events**: Live updates for storm alerts, field reports, drone footage.
- **Background Workers**: Scheduled tasks for deadline reminders, data synchronization.

### Advanced Features
- **Voice System**: Provider-agnostic architecture (ElevenLabs, OpenAI) with "Rachel" (ElevenLabs) as the default professional female voice for AI voice interactions.
- **Voice Guidance System**: Educational voice guides for Weather Intelligence Center, Environmental Reports, and Location Watchlist, explaining conditions, features, and best practices in contractor-focused language. Full guided tour includes all 11 portals from welcome through watchlist.
- **QR/AprilTag Calibration**: Automatic scale detection for precise measurements in images.

### SDK Package
- **Disaster Direct SDK**: A standalone npm package (`@disaster-direct/sdk`) providing an API client, impact score helper, map utilities, and error handling for external integrations.

### Demo Applications
- **Leaflet Demo**: React + Vite + Leaflet reference implementation showcasing SDK.
- **Mapbox GL Demo**: React + Vite + Mapbox GL demo with dual independent toggles for basemap and HMAC signing.
- **MapLibre GL Demo**: React + Vite + MapLibre GL demo with OSM basemap toggle.

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL (Neon serverless).
- **Build Tools**: Vite, ESBuild.
- **Package Management**: NPM.

### Weather & Geographic Services
- **National Weather Service**: CAP alerts, radar, forecasts.
- **Storm Prediction Center**: Local storm reports.
- **Geocoding Service**: OpenStreetMap Nominatim-based forward/reverse geocoding with autocomplete.
- **LocationIQ**: Reverse geocoding.
- **Ambee**: Environmental intelligence (air quality, pollen, weather, fire, soil).
- **Xweather**: Global lightning and storm intelligence network.
- **Tomorrow.io**: Premium hyperlocal weather intelligence (hail/wind footprints, severe weather alerts).

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
- **OpenAI**: GPT-4 for various AI tasks.
- **Twilio**: SMS alerts, voice calls.
- **ElevenLabs**: Voice cloning and TTS.

### File Storage & Media
- **Supabase Storage**: File uploads (photos, videos, documents).
- **Replit Object Storage**: For Disaster Lens media.
- **EXIF Processing**: GPS coordinate extraction.

### Development & Monitoring
- **Replit Integration**: Development environment.
- **jsQR Library**: For QR code detection.
- **Jimp / Sharp**: Image processing.