# Disaster Direct

## Overview
Disaster Direct is a comprehensive storm operations and claims management platform for contractors and property restoration professionals. It provides real-time weather monitoring, claims management, insurance tracking, legal compliance, drone integration, AI assistance, and field reporting. The platform aims to streamline storm response, maximize insurance claim success, and offers a robust photo/video documentation system for damage assessment, rivaling industry-specific tools.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **UI**: Shadcn/ui (Radix UI + Tailwind CSS).
- **State Management**: TanStack Query for server state.
- **Routing**: Wouter.
- **Real-time**: WebSocket integration.
- **Internationalization**: Context-based system (English, Spanish).
- **Disaster Lens Module**: Offline-first design with service workers, IndexedDB, and background sync for media capture and collaboration. Professional camera interface with auto-stamping and project management.

### Backend Architecture
- **Runtime**: Node.js with Express.js (TypeScript, ES modules).
- **Database ORM**: Drizzle ORM with PostgreSQL.
- **API Design**: RESTful API with modular service layer.
- **Real-time**: WebSocket support.
- **File Processing**: Image/video upload, EXIF data extraction.

### Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM.
- **Schema**: Centralized definitions (`/shared/schema.ts`) with automated migrations.
- **Key Entities**: Users, Claims, Insurance Companies, Weather Alerts, Field Reports, Drone Footage, Lien Rules, and Disaster Lens entities (organizations, projects, media, annotations, comments, tasks, reports, shares, audit logs).

### Authentication & Authorization
- **Session Management**: Express sessions with PostgreSQL session store.
- **Role-based Access**: Contractor, admin, crew member, and 5-tier for Disaster Lens module.
- **Security**: Password hashing, secure session handling.

### Service Layer Architecture
- **Weather Service**: NWS APIs for real-time alerts and radar.
- **AI Service**: OpenAI for claim letter generation, image analysis, market comparables, and AI-powered damage hints (with confidence scoring and visual feedback).
- **AI Storm Expert**: Advanced educational meteorology analysis with GPT-4:
  - **GLM Lightning Burst Analysis**: Monitors GOES GLM lightning data inside eye-core, explains rapid intensification indicators, reveals insider forecasting secrets
  - **7 Tripwire Monitoring System**: Tracks critical storm indicators (eye structure, sea-surface anomalies, wind shear, track variance, rainfall, dry air) with real-time status and educational explanations
  - **AI Landfall Prediction**: Makes specific predictions based on real data (SST, wind shear, steering currents, model consensus) with detailed reasoning and wildcard scenarios
  - **Continuous Educational Insights**: Progressively deeper insider knowledge about what professionals watch, hidden indicators, and advanced forecasting techniques
  - **Contractor-Friendly Explanations**: Translates complex meteorology into actionable intelligence with GO/CAUTION/PREPARE/HOLD recommendations
- **AI Ads Assistant**: OpenAI GPT-4 and DALL-E integration for Social Media Ads:
  - **Automatic Ad Copy Generation**: Creates compelling, attention-grabbing storm restoration ad copy
  - **Creative Generation**: DALL-E image generation for ad visuals
  - **Interactive Chat Assistant**: Real-time help with Facebook/Meta advertising setup and strategy
  - **Campaign Optimization**: Strategic recommendations for targeting, budgets, and performance
- **Property Service**: Multi-provider property lookup (Smarty, Regrid, ATTOM, Melissa).
- **Legal Service**: State-specific lien deadline calculations, attorney directory.
- **Translation Service**: Bilingual support for construction/insurance terminology.

### Real-time Data Processing
- **Weather Monitoring**: Automated polling of NWS CAP alerts and Storm Prediction Center data.
- **WebSocket Events**: Live updates for storm alerts, field reports, drone footage.
- **Background Workers**: Scheduled tasks for deadline reminders, data synchronization.

### Advanced Features
- **Voice System**: Provider-agnostic architecture (ElevenLabs, OpenAI), smart fallback.
- **Rachel AI Voice**: Natural female voice using ElevenLabs "Rachel" (ID: 21m00Tcm4TlvDq8ikWAM) as default for all AI voice interactions, including Portal Voice Guide, Voice AI Assistant, Claims Agent, and all TTS features. Provides professional, warm, and natural-sounding female voice throughout the entire application. Falls back to OpenAI's "nova" female voice when ElevenLabs is unavailable. Voice generation takes approximately 2 seconds for high-quality audio.
- **QR/AprilTag Calibration**: Automatic scale detection for precise measurements in images using jsQR, with AprilTag support framework.

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL (Neon serverless).
- **Build Tools**: Vite, ESBuild.
- **Package Management**: NPM.

### Weather & Geographic Services
- **National Weather Service**: CAP alerts, radar, forecasts.
- **Storm Prediction Center**: Local storm reports.
- **LocationIQ**: Reverse geocoding.

### Payment & Legal Integration
- **Stripe**: Payment processing.
- **Dropbox Sign**: Electronic signatures.
- **Legal APIs**: Multi-state lien deadline tracking.

### Property Data Services
- **Smarty**: Address validation.
- **Regrid**: Property boundary data.
- **ATTOM Data**: Property details.
- **Melissa**: Address verification.

### AI & Communication Services
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