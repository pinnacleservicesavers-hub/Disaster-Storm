# Disaster Direct

## Overview
Disaster Direct is a comprehensive storm operations and claims management platform for contractors and property restoration professionals. It offers real-time weather monitoring, claims management, insurance tracking, legal compliance, drone integration, AI assistance, and field reporting. The platform aims to streamline storm response, maximize insurance claim success, and provides robust photo/video documentation for damage assessment.

## Recent Changes

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
- **Voice Guidance System**: Educational voice guides for Weather Intelligence Center and Environmental Reports, explaining conditions and safety in contractor-focused language.
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