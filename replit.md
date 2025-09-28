# Disaster Direct

## Overview

Disaster Direct is a comprehensive storm operations and claims management platform designed for contractors and property restoration professionals. The application provides real-time weather monitoring, claims management, insurance company tracking, legal compliance tools, drone integration, AI-powered assistance, and field reporting capabilities. Built with a modern React frontend and Express.js backend, the platform integrates with multiple external services to streamline storm response operations and maximize insurance claim success rates.

## User Preferences

Preferred communication style: Simple, everyday language.

## Production Weather API Best Practices

### Critical Requirements for api.weather.gov:
- **REQUIRED**: Proper User-Agent header with contact info for rate limiting compliance
- **REQUIRED**: Respect caching headers to avoid hot-loop requests
- **Format**: Accept application/geo+json for optimal data structure

### File Format Considerations:
- **MRMS Data**: GRIB2/NetCDF formats require server-side decoding (not browser-friendly)
- **Level II Radar**: Needs server-side processing before frontend consumption
- **Reference**: Project Pythia has example notebooks for MRMS on AWS

### Discovery Resources:
- **NWS GIS Page**: Lists WMS/WCS endpoints for quick tile integration
- **OpenGeo Geoserver**: Alternative to custom decoding for visualization
- **Registry of Open Data**: Monitor for AWS bucket migrations (NEXRAD archive moving)

### Current Implementation:
- ✅ NWS Alerts: Proper User-Agent and Accept headers implemented
- ✅ NHC KML: Production-ready headers with contact info
- ✅ Live streaming with rate limiting and error handling

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management with built-in caching and synchronization
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live updates on weather alerts and field reports
- **Internationalization**: Built-in context-based translation system supporting English and Spanish

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **API Design**: RESTful API structure with modular service layer architecture
- **Real-time Features**: WebSocket support for live data streaming
- **File Processing**: Support for image/video upload and processing with EXIF data extraction

### Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Centralized schema definitions in `/shared/schema.ts` with automated migrations
- **Key Entities**: Users, Claims, Insurance Companies, Weather Alerts, Field Reports, Drone Footage, Lien Rules
- **Relationships**: Comprehensive foreign key relationships between claims, users, and associated data

### Authentication & Authorization
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Role-based Access**: Support for contractor, admin, and crew member roles
- **Security**: Password hashing and secure session handling

### Service Layer Architecture
- **Weather Service**: Integration with National Weather Service (NWS) APIs for real-time alerts and radar data
- **AI Service**: OpenAI integration for claim letter generation, image analysis, and market comparables
- **Property Service**: Multi-provider property lookup using Smarty, Regrid, ATTOM, and Melissa APIs
- **Legal Service**: State-specific lien deadline calculations and attorney directory
- **Translation Service**: Bilingual support with industry-specific terminology for construction/insurance

### Real-time Data Processing
- **Weather Monitoring**: Automated polling of NWS CAP alerts and Storm Prediction Center data
- **WebSocket Events**: Live updates for storm alerts, field reports, and drone footage
- **Background Workers**: Scheduled tasks for deadline reminders and data synchronization

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL (configured for Neon serverless)
- **Build Tools**: Vite for frontend bundling, ESBuild for backend compilation
- **Package Management**: NPM with lockfile version 3

### Weather & Geographic Services
- **National Weather Service**: CAP alerts, radar data, and forecast information
- **Storm Prediction Center**: Local storm reports and damage tracking
- **LocationIQ**: Reverse geocoding for address resolution

### Payment & Legal Integration
- **Stripe**: Payment processing and checkout functionality
- **Dropbox Sign**: Electronic signature services for contracts
- **Legal APIs**: Multi-state lien deadline tracking and attorney directories

### Property Data Services
- **Smarty**: Address validation and standardization
- **Regrid**: Property boundary and parcel data
- **ATTOM Data**: Property details and ownership information
- **Melissa**: Address verification and data quality

### AI & Communication Services
- **OpenAI**: GPT-4 for claim letters, image analysis, and market insights
- **Twilio**: SMS alerts, voice calls, and call recording
- **Multilingual Support**: Built-in translation system for English/Spanish

### File Storage & Media
- **Supabase Storage**: File uploads with support for photos, videos, and documents
- **EXIF Processing**: Automatic GPS coordinate extraction from uploaded media
- **Media Organization**: Location-based clustering and annotation tools

### Development & Monitoring
- **Replit Integration**: Development environment optimization with error overlays
- **WebSocket Management**: Custom WebSocket manager for real-time features
- **Type Safety**: Full TypeScript coverage with strict type checking

## Disaster Lens Module

### Overview
The Disaster Lens module is a comprehensive photo/video documentation system with professional-grade functionality for damage assessment and insurance documentation. Built as a complete rival to industry platforms with advanced features while avoiding specific brand references.

### Architecture & Implementation Status
✅ **Database Schema**: Complete with 10 tables including organizations, projects, media, annotations, comments, tasks, reports, shares, and audit logs  
✅ **Role-based Permissions**: 5-tier hierarchy (owner/admin/manager/tech/sub/viewer) with organization multi-tenancy  
✅ **Offline-first Infrastructure**: Service workers, IndexedDB storage, background sync queues, and conflict resolution  
✅ **Object Storage Integration**: Pre-signed URL workflow with Replit's built-in storage (bucket: repl-objstore-b0af358a-2e6d-4e4d-bf6f-40078ac6dde2)  
✅ **Complete API Endpoints**: All REST patterns implemented with proper authentication and authorization  
✅ **Frontend Interface**: Professional camera interface with auto-stamping, project management, and collaboration tools  

### API Endpoints (Production Ready)

#### Projects
- `POST /api/projects` - Create new project with organization validation
- `GET /api/projects?orgId=...&status=...&search=...` - List/search projects with filters  
- `GET /api/projects/:id` - Get project details with complete timeline (media, tasks, comments, reports)

#### Media Management  
- `POST /api/media/upload-url` - Generate pre-signed URL for direct object storage upload
- `POST /api/media` - Finalize upload with metadata (SHA256, EXIF, GPS coordinates)
- `GET /api/media/:id` - Retrieve media with permission validation

#### Annotations & Collaboration
- `POST /api/annotations` - Add damage highlights, measurements, drawings with coordinates
- `DELETE /api/annotations/:id` - Remove annotations with ownership validation
- `POST /api/comments` - Add project or media-specific comments

#### Task Management
- `POST /api/tasks` - Create assignments with due dates and priority levels
- `PATCH /api/tasks/:id` - Update task status with automatic completion timestamps

#### Report Generation  
- `POST /api/reports` - Build custom reports with selected media and templates
- `POST /api/reports/:id/render` - Generate PDF using Puppeteer with professional formatting
- `GET /api/reports/:id/download` - Stream generated PDF reports

#### Sharing & Collaboration
- `POST /api/shares` - Create time-limited share links with permission controls
- `GET /s/:token` - Public access to shared projects (read-only with expiration validation)

### Advanced Features Implemented

#### Camera & Media Capture
- **Auto-stamping**: GPS coordinates, timestamps, project names, device info overlay
- **Professional metadata**: EXIF data extraction, GPS coordinates, chain-of-custody hashing
- **Multiple formats**: Photos (JPEG) and videos (WebM) with quality controls
- **Offline capability**: IndexedDB storage with background sync when connectivity returns

#### Collaboration & Workflow  
- **Real-time collaboration**: WebSocket integration for live updates
- **Role-based access**: Granular permissions per organization with inheritance
- **Audit logging**: Complete activity tracking for compliance and accountability
- **Task assignment**: Workflow management with priority levels and due dates

#### Insurance & Compliance
- **Professional reports**: Branded PDF generation with drag-reorder sections
- **Chain of custody**: SHA256 hashing for legal authenticity
- **Annotation system**: Damage highlights, measurements, notes with coordinate tracking
- **Secure sharing**: Token-based access with expiration controls

### Security & Performance
- **Organization isolation**: Multi-tenant architecture with strict data separation
- **Permission middleware**: Role validation at API and UI levels
- **Offline-first design**: Service worker with background sync and conflict resolution
- **Object storage**: Pre-signed URLs for direct upload, bypassing server processing

### Sample Data Initialized
- Demo Construction Company (organization)
- Hurricane Alexandra damage assessment project  
- Sample media with GPS coordinates and EXIF data
- Damage annotations and professional reports
- Task assignments and collaboration examples

### QR/AprilTag Calibration & Damage Hints System

#### QR/Marker Calibration System
✅ **Automatic Scale Detection**: QR code detection with automatic pixels-per-inch calculation using jsQR library  
✅ **Known Size Calibration**: Support for custom QR/marker sizes (default 25mm for standard QR codes)  
✅ **Pixel-Perfect Measurements**: Calculates precise scale factors for accurate distance and area measurements  
✅ **Corner Detection**: Identifies QR code corners with bounding box coordinates for precise positioning  

#### AprilTag Support  
✅ **Framework Ready**: API structure prepared for AprilTag WASM module integration  
✅ **Stub Implementation**: Fallback system with guidance to use QR calibration  
✅ **Future-Ready**: Extensible architecture for multiple marker types  

#### AI-Powered Damage Hints  
✅ **Automated Detection**: Fast heuristic-based damage area identification  
✅ **Multi-Category Analysis**: Root plate upheaval, broken lines/fences, roof damage, structural issues  
✅ **Confidence Scoring**: Adjustable sensitivity levels (0.1-1.0) with confidence thresholds  
✅ **Visual Feedback**: Bounding box coordinates for highlighting potential damage areas  
✅ **Professional Suggestions**: Contextual inspection recommendations for each damage type  

#### API Endpoints (Production Ready)

##### Calibration
- `POST /api/calibrate/qr` - QR code detection and pixels-per-inch calculation
- `POST /api/calibrate/apriltag` - AprilTag detection (framework ready)

##### Damage Analysis  
- `POST /api/damage/hints` - AI-powered damage area suggestions
- `POST /api/damage/confirm` - User feedback for algorithm improvement

#### Technical Implementation
- **jsQR Library**: Fast QR code detection with corner identification
- **Jimp Integration**: Image processing and format conversion for browser compatibility  
- **Sharp Analytics**: Image statistics and feature analysis for damage detection  
- **Error Handling**: Graceful fallbacks for corrupted or unsupported image formats  
- **Professional Output**: Structured JSON with bounding boxes, confidence scores, and inspection guidance  

### Integration Status
- ✅ **Object Storage**: Replit App Storage configured and ready
- ✅ **Permissions System**: Complete role-based access control
- ✅ **Database**: PostgreSQL with comprehensive schema
- ✅ **API Security**: Authentication headers and organization validation
- ✅ **Frontend**: Complete camera interface and project management UI
- ✅ **QR/AprilTag Calibration**: Automatic scale detection for precise measurements
- ✅ **AI Damage Detection**: Professional damage hints with visual feedback