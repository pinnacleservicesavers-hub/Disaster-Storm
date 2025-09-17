# DisasterDirect

## Overview

DisasterDirect is a comprehensive storm operations and claims management platform designed for contractors and property restoration professionals. The application provides real-time weather monitoring, claims management, insurance company tracking, legal compliance tools, drone integration, AI-powered assistance, and field reporting capabilities. Built with a modern React frontend and Express.js backend, the platform integrates with multiple external services to streamline storm response operations and maximize insurance claim success rates.

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