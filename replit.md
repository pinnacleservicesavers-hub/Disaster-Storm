# Disaster Direct

## Overview
Disaster Direct is a comprehensive storm operations and claims management platform for contractors and property restoration professionals. It offers real-time weather monitoring, claims management, insurance tracking, legal compliance, drone integration, AI assistance, and field reporting. The platform aims to streamline storm response, maximize insurance claim success, and provide robust photo/video documentation for damage assessment. The project has a business vision to transform storm response into an enterprise-grade, professional interface, "blowing people away" with AI-curated visual theming and efficient operations, thus capturing significant market potential in the property restoration industry.

## Recent Changes

### November 2, 2025 - Universal AI Assistant Implementation
- **ModuleAIAssistant Component**: Created floating AI assistant available in ALL 17 modules and pages
  - Cyan/blue neon gradient floating button in bottom-right corner of every module
  - Two modes: Text Chat (textarea input) and Voice (Web Speech API for speech-to-text)
  - Voice output via ElevenLabs Rachel voice for spoken responses
  - Module-specific context in AI prompts for relevant, contextual assistance
  - Clean, minimal UI matching platform's enterprise neon design system
- **Backend AI Chat API**: New `/api/ai/chat` route using OpenAI gpt-5-mini
  - Replit AI Integrations (no API key required, billed to Replit credits)
  - 2048 max tokens for comprehensive, detailed responses
  - Module-aware system prompts for Weather Center, Storm Predictions, Claims, etc.
  - Robust error handling and diagnostic logging
- **Integration Coverage**: AI assistant integrated into:
  - All 6 core module files (WeatherCenter, StormPredictions, Claims, Insurance, Contractor, DroneOps)
  - All 13 page files (Dashboard, Environmental, Watchlist, Property Lookup, etc.)
  - Consistent user experience across entire platform
- **Testing**: End-to-end Playwright tests confirm successful text/voice workflows
- **Cost**: OpenAI gpt-5-mini via Replit AI Integrations (~2000 tokens per conversation)

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
- **Components**: 
  - Reusable `ModuleHero` (parallax, gradients, dynamic backgrounds) and `ModuleWrapper` (applies professional design to any module)
  - `ModuleAIAssistant` (floating AI chat assistant with text and voice modes, available in every module)
  - `StateCitySelector` (state and city dropdowns with Florida/Miami defaults)
- **Aesthetics**: Enhanced typography, glass morphism effects, enterprise shadows, and text shadows for readability.
- **AI Assistance**: Universal AI assistant in all modules with module-specific context, text chat, and voice interaction (Web Speech API + ElevenLabs Rachel voice).

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
- **AI Integration**: 
  - xAI's Grok-2 as primary engine; orchestrator coordinates Grok, OpenAI, Anthropic for multi-peril analysis, predictive damage, contractor deployment
  - Universal AI Assistant (OpenAI gpt-5-mini) in all modules with text and voice chat for contextual help, weather queries, operational guidance
  - Module-specific prompts ensure relevant, actionable responses for each feature area
- **Voice System**: Provider-agnostic (ElevenLabs, OpenAI) with "Rachel" (ElevenLabs) as default voice. Includes educational voice guides for modules like Weather Intelligence Center, Environmental Reports, and Location Watchlist, plus voice-enabled AI assistant.
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
- **OpenAI**: GPT-5-mini for universal AI assistant (via Replit AI Integrations), GPT-4 for various AI tasks.
- **Twilio**: SMS alerts, voice calls.
- **ElevenLabs**: Voice cloning and TTS (Rachel voice for AI assistant and educational guides).
- **Slack**: Team collaboration.

### File Storage & Media
- **Supabase Storage**: File uploads.
- **Replit Object Storage**: Disaster Lens media.
- **jsQR Library**: QR code detection.
- **Jimp / Sharp**: Image processing.