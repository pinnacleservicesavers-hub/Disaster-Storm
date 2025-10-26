# Disaster Direct

## Overview
Disaster Direct is a comprehensive storm operations and claims management platform for contractors and property restoration professionals. It offers real-time weather monitoring, claims management, insurance tracking, legal compliance, drone integration, AI assistance, and field reporting. The platform aims to streamline storm response, maximize insurance claim success, and provide robust photo/video documentation for damage assessment. The project has a business vision to transform storm response into an enterprise-grade, professional interface, "blowing people away" with AI-curated visual theming and efficient operations, thus capturing significant market potential in the property restoration industry.

## Recent Changes

### October 26, 2025 - AI-Generated Module Backgrounds
- **Implemented AI Image Generation System**: Created complete AI background generation pipeline using OpenAI DALL-E via Replit AI Integrations
- **Generated All Module Backgrounds**: Successfully generated 17 unique, professional AI images with embedded watermarks for each module
  - Each image features the module title and description watermarked at the bottom with professional typography
  - Images stored in `/attached_assets/module_backgrounds/` (total ~38MB for all 17 images)
  - Professional enterprise aesthetic matching each module's theme (hurricanes, AI networks, construction sites, etc.)
- **Updated Components**: Modified ModuleHero to display AI-generated backgrounds cleanly without overlaying duplicate text
- **Service Infrastructure**: Built `aiImageGenerator.ts` service with watermarking capability using Sharp for SVG text overlay
- **API Routes**: Added `/api/ai-images/*` endpoints for on-demand image generation and management
- **Cost**: All images generated using Replit AI Integrations (billed to Replit credits, ~4,170 tokens per image)

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
- **Enterprise-Grade Design System**: Comprehensive design system with AI-selected backgrounds, module-specific themes, color schemes, and design tokens for over 17 modules.
- **Module Theming**: Unique visual identity for each module with curated backgrounds (e.g., hurricane satellite views for Weather Intelligence, neural networks for Live Intelligence AI).
- **Components**: Reusable `ModuleHero` (parallax, gradients, dynamic backgrounds) and `ModuleWrapper` (applies professional design to any module).
- **Aesthetics**: Enhanced typography, glass morphism effects, enterprise shadows, and text shadows for readability.
- **Location Selection**: State and city dropdowns for environmental intelligence with dynamic updates and state abbreviation conversion.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, Shadcn/ui (Radix UI + Tailwind CSS), TanStack Query for state, Wouter for routing, WebSocket integration, context-based internationalization (English, Spanish).
- **Backend**: Node.js with Express.js (TypeScript, ES modules), Drizzle ORM with PostgreSQL, RESTful API, WebSocket support, image/video upload, EXIF data extraction.
- **Database**: PostgreSQL with Drizzle ORM; key entities include Users, Claims, Insurance Companies, Weather Alerts, Field Reports, Drone Footage, Lien Rules, and Disaster Lens entities.
- **Authentication & Authorization**: Express sessions, PostgreSQL session store, role-based access (ADMIN, SIGNER, VIEWER for platform; Contractor, Admin, Crew for Disaster Lens), protected API endpoints.
- **Real-time Data Processing**: Automated polling of NWS CAP alerts, Storm Prediction Center data; WebSocket events for live updates; background workers for scheduled tasks.
- **Infrastructure**: Batch signing for map tiles, Cloudflare Worker for edge-based signing, GitHub Actions for CI/CD to GHCR, HMAC signing infrastructure.
- **Disaster Lens Module**: Offline-first design using service workers, IndexedDB, and background sync.

### Feature Specifications
- **Real-Time Monitoring**: NWS severe weather alerts (2-minute polling), Florida DOT DIVAS integration for traffic cameras and incidents, contractor opportunity detection (e.g., tree_down, flooding).
- **AI Integration**: xAI's Grok-2 as primary engine; orchestrator coordinates Grok, OpenAI, Anthropic for multi-peril analysis, predictive damage, contractor deployment. Grok fetches real-time storm data for queries.
- **Voice System**: Provider-agnostic (ElevenLabs, OpenAI) with "Rachel" (ElevenLabs) as default voice. Includes educational voice guides for modules like Weather Intelligence Center, Environmental Reports, and Location Watchlist.
- **Location Watchlist**: Secure API with bearer token auth, CSV import/export, Slack integration with `/dd` commands for real-time monitoring.
- **Property Data**: Multi-provider property lookup (Smarty, Regrid, ATTOM, Melissa), EagleView integration for aerial imagery and damage assessment.
- **Legal Compliance**: State-specific lien deadline calculations, attorney directory.
- **Environmental Intelligence**: Ambee integration for real-time air quality, pollen, weather, fire, soil conditions.
- **SDK**: Standalone npm package (`@disaster-direct/sdk`) providing API client, impact score helper, map utilities, and error handling.
- **Advanced Features**: QR/AprilTag calibration for precise measurements in images.

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
- **Slack**: Team collaboration.

### File Storage & Media
- **Supabase Storage**: File uploads.
- **Replit Object Storage**: Disaster Lens media.
- **jsQR Library**: QR code detection.
- **Jimp / Sharp**: Image processing.