# Disaster Direct

## Overview
Disaster Direct is a comprehensive storm operations and claims management platform for contractors and property restoration professionals. It provides real-time weather monitoring, claims management, insurance tracking, legal compliance, drone integration, AI assistance, and field reporting. The platform aims to streamline storm response, maximize insurance claim success, and offers a robust photo/video documentation system for damage assessment.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **UI**: Shadcn/ui (Radix UI + Tailwind CSS).
- **State Management**: TanStack Query.
- **Routing**: Wouter.
- **Real-time**: WebSocket integration.
- **Internationalization**: Context-based system (English, Spanish).
- **AI Integration**: xAI's Grok-2 powers all intelligence features.
- **Disaster Lens Module**: Offline-first design with service workers, IndexedDB, and background sync for media capture and collaboration.

### Backend Architecture
- **Runtime**: Node.js with Express.js (TypeScript, ES modules).
- **Database ORM**: Drizzle ORM with PostgreSQL.
- **API Design**: RESTful API with modular service layer.
- **Real-time**: WebSocket support.
- **File Processing**: Image/video upload, EXIF data extraction.

### Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM.
- **Schema**: Centralized definitions (`/shared/schema.ts`).
- **Key Entities**: Users, Claims, Insurance Companies, Weather Alerts, Field Reports, Drone Footage, Lien Rules, and Disaster Lens entities.

### Authentication & Authorization
- **Session Management**: Express sessions with PostgreSQL session store.
- **Role-based Access**: Contractor, admin, crew member, and 5-tier for Disaster Lens.

### Service Layer Architecture
- **Weather Service**: NWS APIs.
- **AI Services**:
    - **OpenAI**: Claim letter generation, image analysis, market comparables, AI-powered damage hints, and social media ad generation (copy and visuals).
    - **Grok AI**: Educational meteorology analysis, landfall prediction, tripwire monitoring, interactive Q&A, and real-time storm intelligence briefings.
- **Property Service**: Multi-provider property lookup (Smarty, Regrid, ATTOM, Melissa).
- **Legal Service**: State-specific lien deadline calculations, attorney directory.
- **Translation Service**: Bilingual support for construction/insurance terminology.
- **Geo-Fencing**: Law enforcement-grade device tracking for targeted advertising campaigns.
- **Environmental Intelligence**: Ambee integration for real-time air quality, pollen, weather, fire detection, and soil conditions with health impact analysis and safety recommendations.
- **Aerial Imagery**: EagleView integration for high-resolution aerial imagery, automated roof measurements, material estimation, and AI damage assessment.

### Real-time Data Processing
- **Weather Monitoring**: Automated polling of NWS CAP alerts and Storm Prediction Center data.
- **WebSocket Events**: Live updates for storm alerts, field reports, drone footage.
- **Background Workers**: Scheduled tasks for deadline reminders, data synchronization.

### Advanced Features
- **Voice System**: Provider-agnostic architecture (ElevenLabs, OpenAI) with "Rachel" (ElevenLabs) as the default professional female voice for all AI voice interactions and TTS features.
- **QR/AprilTag Calibration**: Automatic scale detection for precise measurements in images.

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL (Neon serverless).
- **Build Tools**: Vite, ESBuild.
- **Package Management**: NPM.

### Weather & Geographic Services
- **National Weather Service**: CAP alerts, radar, forecasts.
- **Storm Prediction Center**: Local storm reports.
- **LocationIQ**: Reverse geocoding.
- **Ambee**: Environmental intelligence (air quality, pollen, weather, fire, soil).
  - **Production-Safe API Routes**:
    - `/api/ambee/latest/by-lat-lng` - Air quality data (AQI, pollutants)
    - `/api/ambee/weather/latest/by-lat-lng` - Weather conditions
    - `/api/ambee/disasters/latest/by-lat-lng` - Disaster/fire detection
    - `/api/ambee/wildfires/latest/by-lat-lng` - Wildfire proximity
    - `/api/impact` - Merged impact score (0-100) with weighted risk calculation (AQI 50%, Wind 30%, Fire 20%)

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