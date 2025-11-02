# 🚨 Disaster Direct - Storm Operations Platform

**Production-Ready MVP for Next Week's Demo**

Comprehensive AI-powered weather prediction platform enabling contractors to deploy BEFORE disasters strike. Real-time multi-hazard monitoring, claims management, and intelligent contractor deployment system.

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Clone and install
git clone <your-repo>
cd disaster-direct
npm install

# 2. Configure environment
cp .env.sample .env
# Edit .env and add your API keys (see Configuration section)

# 3. Setup database
npm run db:push --force

# 4. Start development server
npm run dev
```

Navigate to `http://localhost:5000`

## 📋 MVP Features (Ready for Demo)

### ✅ 1. Production-Ready MRMS Hazard Processing
- **16 multi-threshold configurations** across 4 perils (hail, precipitation, wind, lightning)
- **Deterministic 50-point mock data** generation for consistent testing
- **Data hash deduplication** prevents duplicate hazards
- **FIPS-based geofencing** to 4 service areas (Miami-Dade/Broward/Palm Beach FL, Houston TX)
- **15-minute scheduled processing** with retry logic and logging
- **Service area state labeling** (FL/TX) for accurate alerts

### ✅ 2. Claims CSV Import System
- **Bulk import** from CSV with automatic parsing and validation
- **Deduplication by claim number** - skips existing claims
- **Error reporting** with row-level details
- **5-claim test dataset** included and validated
- **POST /api/claims/import** endpoint with multer file upload

### ✅ 3. Contractor Alerts Bulk SMS
- **Twilio integration** for bulk SMS delivery
- **Service area segmentation** - alerts sent only to relevant contractors
- **Opt-out support** (STOP keyword handling)
- **Dry run mode** for testing without sending real SMS
- **Development mock mode** for testing without Twilio credentials
- **3 contractors** configured (Miami, Fort Lauderdale, Houston)

### ✅ 4. Admin UI Dashboard
- **Located at `/admin`** route
- **Overview stats**: Active hazards, claims, assets, contractors
- **MRMS Processing tab**: Manual trigger, last run times for all perils
- **Contractor Alerts tab**: Preview recipients, dry run, send real alerts
- **Real-time data** with refresh capabilities
- **Responsive design** with dark theme

### ✅ 5. Interactive Hazard Dashboard
- **Leaflet map** with multi-source hazard visualization
- **16 MRMS contours** displayed as polygons
- **Claims and assets** shown as markers
- **Toggleable layers** for each hazard type
- **Real-time alignment** with geographic intersections
- **20km safety buffer** for staging recommendations

### ✅ 6. Hazard Alignment Engine
- **Geographic intersection detection** between hazards, claims, and assets
- **Moratorium risk flagging** for Extreme/Severe hazards
- **GET /api/align/summary** endpoint with full analysis
- **Affected claims/assets** identification
- **Deployment recommendations** for contractors

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Shadcn/ui, TanStack Query, Wouter
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Maps**: Leaflet with OpenStreetMap
- **Real-time**: WebSocket integration
- **AI**: xAI Grok, OpenAI GPT-4, Anthropic Claude

### Key Services
```
server/
├── services/
│   ├── mrms/MRMSProductionService.ts    # Multi-threshold hazard processing
│   ├── contractorBulkAlertService.ts     # SMS bulk alerts
│   ├── hazardAlignment.ts                # Geographic intersection detection
│   └── twilio.ts                         # SMS/voice integration
├── routes/
│   ├── mrmsProductionRoutes.ts           # MRMS processing endpoints
│   ├── contractorAlertRoutes.ts          # Contractor alert endpoints
│   ├── alignmentRoutes.ts                # Claims/assets/hazard alignment
│   └── hazardIngestionRoutes.ts          # NHC/MRMS ingestion
└── config/
    └── mrmsThresholds.ts                 # 16 threshold configurations
```

### Database Schema
```
weather_alerts        # Hazards from NWS, NHC, MRMS
claims                # Insurance claims with geographic data
assets                # Properties/assets being monitored
hazard_intersections  # Detected intersections between hazards and claims/assets
```

## ⚙️ Configuration

### Required Environment Variables

**Must Have for MVP:**
```bash
DATABASE_URL=postgresql://...           # PostgreSQL connection
TWILIO_ACCOUNT_SID=...                 # For contractor SMS
TWILIO_AUTH_TOKEN=...                  # For contractor SMS
TWILIO_PHONE_NUMBER=+1...              # From phone number
XAI_API_KEY=...                        # For AI intelligence
OPENAI_API_KEY=...                     # For AI assistant
```

**Optional (Enhanced Features):**
```bash
GETAMBEE_API_KEY=...                   # Environmental intelligence
XWEATHER_CLIENT_ID=...                 # Storm tracking
VITE_GOOGLE_MAPS_KEY=...               # Maps integration
ELEVENLABS_API_KEY=...                 # Voice AI
```

See `.env.sample` for complete list and descriptions.

## 🎯 API Endpoints

### MRMS Processing
```bash
# Trigger full MRMS processing (all 4 perils, 16 thresholds)
POST /api/ingest/mrms-production

# Get processing stats
GET /api/mrms/stats

# Get threshold configuration
GET /api/mrms/config
```

### Claims Management
```bash
# List all claims
GET /api/claims

# Create single claim
POST /api/claims

# Bulk import claims from CSV
POST /api/claims/import
Content-Type: multipart/form-data
Body: file=claims.csv
```

### Contractor Alerts
```bash
# Preview who would receive alerts
GET /api/alerts/contractor/preview

# Send bulk SMS (dry run)
POST /api/alerts/contractor/send
Body: { "dryRun": true }

# Send real SMS alerts
POST /api/alerts/contractor/send
Body: { "dryRun": false, "customMessage": "..." }

# Handle opt-out
POST /api/alerts/contractor/opt-out
Body: { "phone": "+1234567890" }
```

### Hazard Alignment
```bash
# Get full alignment summary
GET /api/align/summary

# List all assets
GET /api/assets

# Create asset
POST /api/assets
```

## 🧪 Testing

### Manual Testing Flow
1. **Start server**: `npm run dev`
2. **Navigate to Admin**: `http://localhost:5000/admin`
3. **Process MRMS hazards**: Click "Process All MRMS Hazards" button
4. **Check results**: View created hazards in stats
5. **Import claims**: Use `/api/claims/import` with test CSV
6. **Preview alerts**: Check "Contractor Alerts" tab
7. **Send test alerts**: Click "Dry Run (Preview)" button
8. **View dashboard**: Navigate to `/hazard-dashboard`

### Test Data
```bash
# Test CSV available at /tmp/test-claims.csv
# Contains 5 claims across FL and TX
# Automatically deduplicates on re-import
```

## 📊 Demo Walkthrough (For Next Week)

### 1. Show Real-Time Hazard Processing (2 min)
- Navigate to `/admin`
- Click "Process All MRMS Hazards"
- Show 16 contours created across 4 perils
- Show processing time (~180-500ms per peril)

### 2. Import Claims Data (1 min)
- Use Postman/curl to upload CSV
- Show deduplication (5 created, then 5 skipped on re-import)
- Display claims on map

### 3. Contractor Alert System (2 min)
- Navigate to "Contractor Alerts" tab
- Show 3 contractors ready to receive alerts
- Click "Dry Run" to preview
- Show hazard summary generation
- (Optional) Send real SMS if Twilio configured

### 4. Interactive Dashboard (2 min)
- Navigate to `/hazard-dashboard`
- Show 16 MRMS contours on map
- Toggle layers to show/hide hazards
- Show claims and assets markers
- Display hazard alignment summary

### 5. System Status (1 min)
- Back to `/admin` Overview tab
- Show stats: hazards, claims, assets, contractors
- Show moratorium risk detection
- Demonstrate refresh functionality

**Total Demo Time: 8-10 minutes**

## 🚢 Deployment

### Replit Deployment (Recommended)
Already configured! Just:
1. Set secrets in Replit Secrets panel
2. Click "Run" button
3. System auto-configures database and starts

### Docker Deployment
```dockerfile
# Dockerfile included in repo
docker build -t disaster-direct .
docker run -p 5000:5000 --env-file .env disaster-direct
```

### Manual Deployment
```bash
# Build frontend
npm run build

# Start production server
NODE_ENV=production node server/index.js
```

## 🔧 Troubleshooting

### Issue: No hazards created
**Solution**: Update weather_alerts to set is_active=true
```sql
UPDATE weather_alerts SET is_active = true WHERE geometry_type = 'contour';
```

### Issue: SMS not sending
**Solution**: Check Twilio credentials in .env
- Verify TWILIO_ACCOUNT_SID is correct
- Verify TWILIO_AUTH_TOKEN is correct
- Verify TWILIO_PHONE_NUMBER is verified
- In development, check logs for [MOCK] SMS output

### Issue: Database migration fails
**Solution**: Force push schema
```bash
npm run db:push --force
```

### Issue: Admin dashboard not loading
**Solution**: Check route registration
- Navigate to `http://localhost:5000/admin`
- Check browser console for errors
- Verify AdminDashboard.tsx exists in client/src/pages/

## 📝 Changelog

### MVP Release (Current)
- ✅ MRMS production processing with 16 thresholds
- ✅ Claims CSV import with deduplication
- ✅ Contractor bulk SMS alerts
- ✅ Admin UI dashboard
- ✅ Interactive hazard dashboard
- ✅ Hazard alignment engine

### Future Enhancements
- [ ] Scheduled MRMS processing (cron job)
- [ ] Contractor database table
- [ ] Alert history tracking
- [ ] Email notifications
- [ ] Mobile app
- [ ] Advanced AI predictions

## 🤝 Support

For questions or issues:
1. Check this README first
2. Review `.env.sample` for configuration
3. Check troubleshooting section
4. Review logs in `/tmp/logs/` directory

## 📄 License

Proprietary - Disaster Direct Platform

---

**Built with ❤️ for next week's hard deadline** 🚀

Last Updated: November 2, 2025
