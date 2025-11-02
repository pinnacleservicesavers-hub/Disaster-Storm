# Disaster Direct

## Overview
Disaster Direct is a comprehensive storm operations and claims management platform for contractors and property restoration professionals. It offers real-time weather monitoring, claims management, insurance tracking, legal compliance, drone integration, AI assistance, and field reporting. The platform aims to streamline storm response, maximize insurance claim success, and provide robust photo/video documentation for damage assessment. The business vision is to transform storm response into an enterprise-grade, professional interface, leveraging AI-curated visual theming and efficient operations to capture significant market potential in the property restoration industry.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
- **Enterprise-Grade Design System**: Comprehensive design system with AI-selected backgrounds, module-specific themes, color schemes, and design tokens for over 17 modules.
- **Module Theming**: Unique visual identity for each module with curated backgrounds (e.g., hurricane satellite views for Weather Intelligence, neural networks for Live Intelligence AI).
- **Components**: Reusable `ModuleHero` (parallax, gradients, dynamic backgrounds), `ModuleWrapper`, `ModuleAIAssistant` (floating AI chat assistant with text and voice modes, available in every module), and `StateCitySelector`.
- **Aesthetics**: Enhanced typography, glass morphism effects, enterprise shadows, and text shadows for readability.
- **AI Assistance**: Universal AI assistant in all modules with module-specific context, text chat, and voice interaction (Web Speech API + ElevenLabs Rachel voice).

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, Shadcn/ui (Radix UI + Tailwind CSS), TanStack Query for state, Wouter for routing, WebSocket integration, context-based internationalization (English, Spanish).
- **Backend**: Node.js with Express.js (TypeScript, ES modules), Drizzle ORM with PostgreSQL, RESTful API, WebSocket support, image/video upload, EXIF data extraction.
- **Database**: PostgreSQL with Drizzle ORM; key entities include Users, Claims, Insurance Companies, Weather Alerts, Field Reports, Drone Footage, Lien Rules, and Disaster Lens entities.
- **Authentication & Authorization**: Express sessions, PostgreSQL session store, role-based access, protected API endpoints.
- **Real-time Data Processing**: Automated polling of NWS CAP alerts, Storm Prediction Center data; WebSocket events for live updates; background workers for scheduled tasks.
- **Infrastructure**: Batch signing for map tiles, Cloudflare Worker for edge-based signing, GitHub Actions for CI/CD to GHCR, HMAC signing infrastructure.
- **Disaster Lens Module**: Offline-first design using service workers, IndexedDB, and background sync.

### Feature Specifications
- **Multi-Hazard Monitoring**: Integration of 8 real-time data sources including NHC, USGS Earthquakes, NASA FIRMS Wildfire, NOAA MRMS Radar, GFS/HRRR Wind Models, NOAA CO-OPS Coastal Surge, USGS River Gauges, and NOAA HMS Wildfire Smoke.
- **Live Weather Intelligence Center**: Enhanced monitoring station with a dashboard displaying 7 feeds (NOAA, NWS, GOES Satellites, NDBC Buoys, WAVEWATCH III, Ambee Environmental, ML Models), live weather maps, environmental conditions, and AI Intelligence feature cards.
- **Storm Prediction & Contractor Deployment**: Live predictive analytics for 12-72h storm forecasts, interactive Leaflet map for visualizing storms and contractor opportunities, and an automated contractor alert system for timely notifications.
- **Universal AI Assistant**: Floating AI assistant available in all modules, offering text and voice chat (via OpenAI gpt-5-mini and ElevenLabs Rachel voice) with module-specific context.
- **AI-Generated Module Backgrounds**: Implementation of an AI image generation system using OpenAI DALL-E to create unique, watermarked backgrounds for all 17 modules, enhancing the enterprise aesthetic.
- **Real-Time Monitoring**: NWS severe weather alerts (2-minute polling), Florida DOT DIVAS integration, contractor opportunity detection.
- **AI Integration**: xAI's Grok-2 as primary engine; orchestrator coordinates Grok, OpenAI, Anthropic for multi-peril analysis, predictive damage, and contractor deployment.
- **Location Watchlist**: Secure API, CSV import/export, Slack integration.
- **Property Data**: Multi-provider property lookup (Smarty, Regrid, ATTOM, Melissa), EagleView integration.
- **Legal Compliance**: State-specific lien deadline calculations, attorney directory.
- **Environmental Intelligence**: Ambee integration for real-time air quality, pollen, weather, fire, soil conditions.
- **SDK**: Standalone npm package (`@disaster-direct/sdk`).
- **Advanced Features**: QR/AprilTag calibration for precise measurements.

### Advanced Hazard Processing Features (November 2025)
- **NHC Hurricane Cone/Track Ingestion**: Real-time ingestion of National Hurricane Center forecast cone and track GeoJSON polygons. Uses official NHC product naming (5day_pgncone_latest, 5day_5knt_track_latest). Stores hurricane geometry data in weather_alerts table with metadata (storm name, classification, wind speed, pressure). Auto-triggers every 10 minutes via hazard monitoring scheduler.
- **MRMS Radar Contour Processing**: Service for processing NOAA MRMS radar data into hazard contours (hail, heavy precipitation). Currently in stub mode with placeholder contours - production implementation requires Python raster processing microservice for GRIB2 data conversion. Supports configurable thresholds and severity levels.
- **AI Hazard Summary Endpoint** (`/api/ai-intelligence/summary`): Generates plain-English hazard briefings using OpenAI GPT-4o-mini. Provides immediate impact analysis, operational posture recommendations, contractor deployment guidance, and staging/mobilization advice based on current active hazards across all data sources.
- **AI Staging Location Recommendations** (`/api/ai-intelligence/staging`): Calculates safe contractor staging zones outside hazard polygons using Haversine distance calculations (20km+ safety buffer). Returns georeferenced staging locations with distance metrics and nearest hazard identification for pre-deployment planning.
- **Hazard Polygon Database**: Extended weather_alerts table with geometry_type (cone/track/contour) and hazard_metadata (JSONB) fields for storing GeoJSON geometries from NHC, MRMS, and future polygon-based hazard sources.

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
- **Ambee**: Environmental intelligence (air quality, pollen, weather, fire, soil).
- **Xweather**: Global lightning and storm intelligence.
- **Tomorrow.io**: Premium hyperlocal weather intelligence.
- **National Hurricane Center (NHC)**: Real-time hurricane tracking.
- **USGS Earthquake Monitoring**: Live seismic detection.
- **NASA FIRMS Wildfire Detection**: Thermal hotspot tracking.
- **NOAA MRMS Radar/Precipitation**: Real-time severe weather detection.
- **GFS/HRRR Wind Models**: High-resolution wind forecasts.
- **NOAA CO-OPS Coastal Surge**: Storm surge and tidal monitoring.
- **USGS River Gauges**: Inland flood detection.
- **NOAA HMS Wildfire Smoke**: Air quality and visibility monitoring.

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
- **OpenAI**: GPT-5-mini for universal AI assistant (via Replit AI Integrations), GPT-4 for various AI tasks.
- **Twilio**: SMS alerts, voice calls.
- **ElevenLabs**: Voice cloning and TTS (Rachel voice).
- **Slack**: Team collaboration.

### File Storage & Media
- **Supabase Storage**: File uploads.
- **Replit Object Storage**: Disaster Lens media.
- **jsQR Library**: QR code detection.
- **Jimp / Sharp**: Image processing.