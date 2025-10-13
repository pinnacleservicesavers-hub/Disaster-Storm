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
- **Grok AI Integration**: xAI's Grok-2 powers all intelligence features across every module with real-time predictions, educational insights, and interactive Q&A.
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
- **Rachel AI Voice**: Natural female voice using ElevenLabs "Rachel" (ID: 21m00Tcm4TlvDq8ikWAM) as default for all AI voice interactions, including Portal Voice Guide, Voice AI Assistant, Claims Agent, Weather Center Nationwide AI, and all TTS features. Provides professional, warm, and natural-sounding female voice throughout the entire application. Falls back to OpenAI's "nova" female voice when ElevenLabs is unavailable. Voice generation takes approximately 2 seconds for high-quality audio.
- **Fixed October 13, 2025**: Weather Center's "Nationwide AI" feature now uses Rachel voice (ElevenLabs) instead of browser's robotic text-to-speech for natural-sounding responses.
- **QR/AprilTag Calibration**: Automatic scale detection for precise measurements in images using jsQR, with AprilTag support framework.

## Recent Updates (October 13, 2025)

### Grok AI Integration - Primary Intelligence Engine
Integrated xAI's Grok-2 as the main AI across the entire platform:
- **Educational System**: Explains meteorology concepts (tripwires, lightning bursts, outflow tails, eddies, eye walls) in simple contractor-friendly language
- **US Landfall Prediction**: Real-time predictions based on satellite data, sea surface temps, wind shear, and steering currents with confidence scores
- **Interactive Q&A**: Ask Grok any storm-related question and get expert educational answers
- **Storm Intelligence Briefings**: Real-time situational awareness with GO/CAUTION/PREPARE/HOLD action recommendations
- **Tripwire Monitoring**: AI analysis of all 7 critical hurricane indicators with insider professional knowledge
- **Image Analysis**: Grok-2-Vision for damage assessment and storm imagery analysis
- **Module Enhancement**: Grok provides deeper real-time insights across Weather Center, Prediction Dashboard, and all intelligence modules
- **Voice Consistency**: Rachel (ElevenLabs) maintained as the natural-sounding female voice for all text-to-speech features

### Key Grok Features Implemented
1. **Educational Panel in Weather Center**: 
   - Concept explanations for all meteorology terms
   - Real-world examples from past storms
   - Insider tips that meteorologists use
   - Interactive Q&A with suggested questions

2. **Grok Landfall Predictor in Storm Prediction Dashboard**:
   - Predicts if storm will hit US (Yes/No with confidence %)
   - Specific landfall location, state, and GPS coordinates
   - Timing estimates
   - Detailed satellite data analysis
   - Key atmospheric factors
   - Wildcard scenarios that could change predictions
   - Real-time intelligence briefings

3. **Available Grok API Endpoints**:
   - `/api/grok/explain-concept` - Educational meteorology explanations
   - `/api/grok/predict-us-landfall` - US landfall predictions
   - `/api/grok/ask-question` - Interactive Q&A
   - `/api/grok/analyze-image` - Vision-based image analysis
   - `/api/grok/analyze-tripwire` - Hurricane tripwire analysis
   - `/api/grok/intelligence-briefing` - Real-time storm briefings
   - `/api/grok/enhance-module` - Module enhancement recommendations

### EagleView Aerial Imagery Integration
Integrated professional-grade aerial imagery and roof measurement capabilities:
- **High-Resolution Imagery**: Orthogonal and oblique (N/S/E/W) aerial views at 3-6 inch resolution
- **Automated Roof Measurements**: AI-powered calculations for square footage, pitch, facets, ridge/valley/eave/rake/hip lengths
- **Material Estimation**: Automatic calculations for shingles (in squares), underlayment (rolls), and ridge cap (linear feet)
- **Damage Assessment**: AI-based property damage detection with severity analysis (minor/moderate/severe/catastrophic)
- **Before/After Comparison**: Historical imagery analysis to detect storm damage
- **Comprehensive Reports**: Combined imagery + measurements + damage assessment in single API call
- **Mock Mode**: Realistic demo data when API key not configured for development/testing

Available EagleView Endpoints:
- `/api/eagleview/imagery` - Get aerial imagery (orthogonal + 4 oblique views)
- `/api/eagleview/measurements` - Get automated roof measurements
- `/api/eagleview/damage-assessment` - AI damage detection and severity analysis
- `/api/eagleview/report` - Comprehensive property report (imagery + measurements + damage)

Integration Points:
- **Disaster Lens**: Enhances photo documentation with aerial context
- **Claims Module**: Provides professional roof measurements for insurance claims
- **Field Reports**: Adds aerial perspective to ground-level damage assessments
- **Lead Generation**: Identifies damaged properties for contractor outreach

### Geo-Fencing & Device Audience Tracking (Ad Module)
Law enforcement-grade device tracking for targeted advertising:
- **Geographic Fence Management**: Create and manage circular geo-fences with radius-based boundaries
- **Privacy-Safe Device Tracking**: Hashed device IDs (not personally identifiable)
- **Platform Detection**: iOS, Android, Web device identification
- **Entry/Exit Timestamps**: Track when devices enter/leave geo-fenced areas
- **Campaign Association**: Link devices to specific ad campaigns for retargeting
- **Real-time Analytics**: Track impressions, clicks, conversions, spend, and device capture rates
- **Multi-Platform Support**: Facebook/Meta, Google, Instagram, YouTube campaign integration

Available Geo-Fencing Endpoints:
- `/api/ad-campaigns/geo-fences` - CRUD operations for geo-fences
- `/api/ad-campaigns/device-audience` - Track device entry into geo-fence
- `/api/ad-campaigns/:id/analytics` - Campaign performance with device metrics
- `/api/ad-campaigns/analytics/overview` - Platform-wide analytics dashboard

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
- **xAI Grok**: Primary AI intelligence engine (Grok-2-1212 text, Grok-2-vision-1212 image analysis)
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