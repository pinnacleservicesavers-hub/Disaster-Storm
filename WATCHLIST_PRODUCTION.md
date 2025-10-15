# Location Watchlist - Production Features Setup Guide

## Overview
The Location Watchlist now includes three enterprise-grade production features:

1. **Bearer Token Authentication** - Secure API access control
2. **CSV Import/Export** - Bulk location management  
3. **Slack Integration** - Real-time alerts via `/dd` slash commands

---

## 1. Bearer Authentication Setup

### Purpose
Protects write operations (POST/PUT/DELETE) while keeping read operations public.

### Protected Endpoints
- `POST /api/locations` - Create location
- `PUT /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location
- `POST /api/locations/import` - CSV import

### Public Endpoints
- `GET /api/locations` - List all locations
- `GET /api/locations/export` - CSV export

### Usage
```bash
# Set your bearer token (generate a secure random string)
export BEARER_TOKEN="your-secure-token-here"

# Make authenticated requests
curl -X POST https://your-app.replit.app/api/locations \
  -H "Authorization: Bearer your-secure-token-here" \
  -H "Content-Type: application/json" \
  -d '{"name":"Miami Office","lat":25.7617,"lng":-80.1918,"alertEnabled":true,"threshold":60}'
```

### Environment Variable
```bash
# Add to Replit Secrets
BEARER_TOKEN=your-secure-random-token-here
```

**Security Best Practice**: Generate a strong random token:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 2. CSV Import/Export

### Export Locations
Download all saved locations as CSV:

```bash
curl https://your-app.replit.app/api/locations/export -o locations.csv
```

### CSV Format
```csv
id,name,lat,lng,alert,threshold
miami-hq,Miami HQ,25.7617,-80.1918,true,60
tampa-site,Tampa Site,27.9506,-82.4572,false,70
orlando-proj,Orlando Project,28.5383,-81.3792,true,50
```

**Columns:**
- `id` - Unique location identifier (kebab-case recommended)
- `name` - Display name
- `lat` - Latitude (-90 to 90)
- `lng` - Longitude (-180 to 180)
- `alert` - Alert enabled (true/false)
- `threshold` - Impact threshold (0-100)

### Import Locations
Upload CSV to bulk-create locations (requires Bearer token):

```bash
curl -X POST https://your-app.replit.app/api/locations/import \
  -H "Authorization: Bearer your-secure-token-here" \
  -F "file=@locations.csv"
```

**Response:**
```json
{
  "success": true,
  "imported": 15,
  "errors": []
}
```

### Import Validation
The import endpoint validates:
- ✅ Required columns (id, name, lat, lng)
- ✅ Coordinate ranges
- ✅ Duplicate IDs
- ✅ Data types

**Example Error Response:**
```json
{
  "success": false,
  "imported": 0,
  "errors": [
    "Row 3: Invalid latitude (must be -90 to 90)",
    "Row 5: Duplicate location ID 'miami-hq'"
  ]
}
```

---

## 3. Slack Integration Setup

### Step 1: Create Slack App
1. Go to https://api.slack.com/apps
2. Click **"Create New App"** → **"From scratch"**
3. Name it **"Disaster Direct"**
4. Select your workspace

### Step 2: Configure Slash Command
1. In your Slack app, go to **Slash Commands**
2. Click **"Create New Command"**
3. Configure:
   - **Command**: `/dd`
   - **Request URL**: `https://your-app.replit.app/api/slack/command`
   - **Short Description**: `Disaster Direct location monitoring`
   - **Usage Hint**: `list | impact <id> | impact <lat,lng>`
4. Click **Save**

### Step 3: Get Signing Secret
1. Go to **Basic Information** → **App Credentials**
2. Copy the **Signing Secret**
3. Add to Replit Secrets:
   ```bash
   SLACK_SIGNING_SECRET=your-signing-secret-here
   ```

### Step 4: Install App to Workspace
1. Go to **Install App** in left sidebar
2. Click **Install to Workspace**
3. Authorize the app

### Slash Command Usage

#### List All Locations with Impact Scores
```
/dd list
```
**Response:**
```
• Miami HQ (miami-hq) – 85 (HIGH)
• Tampa Site (tampa-site) – 42 (ELEV)
• Orlando Project (orlando-proj) – 15 (LOW)
```

#### Get Impact for Specific Location
```
/dd impact miami-hq
```
**Response:**
```
Impact at Miami HQ (miami-hq): *85* (HIGH)
```

#### Get Impact for Coordinates
```
/dd impact 25.7617,-80.1918
```
**Response:**
```
Impact at 25.762,-80.192: *85* (HIGH)
```

#### Show Help
```
/dd help
```
**Response:**
```
Disaster Direct commands:
• /dd list – list saved locations with Impact
• /dd impact <id> – Impact for a saved location
• /dd impact <lat,lng> – Impact for any coordinates
```

### Impact Score Interpretation
- **70-100**: HIGH - Severe conditions, immediate action recommended
- **40-69**: ELEV - Elevated conditions, monitoring required
- **0-39**: LOW - Normal conditions

### Security
The Slack integration uses **request signature verification** to ensure commands are genuinely from Slack:
- Validates timestamp (rejects requests >5 minutes old)
- Verifies HMAC-SHA256 signature using signing secret
- Uses constant-time comparison to prevent timing attacks

---

## Production Deployment Checklist

### Environment Variables
```bash
# Required for Bearer Auth
BEARER_TOKEN=<generate-secure-random-token>

# Required for Slack Integration  
SLACK_SIGNING_SECRET=<from-slack-app-credentials>

# Optional for custom base URL
PUBLIC_BASE_URL=https://your-custom-domain.com
```

### API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/locations` | GET | None | List all locations |
| `/api/locations` | POST | Bearer | Create location |
| `/api/locations/:id` | PUT | Bearer | Update location |
| `/api/locations/:id` | DELETE | Bearer | Delete location |
| `/api/locations/export` | GET | None | Export CSV |
| `/api/locations/import` | POST | Bearer | Import CSV |
| `/api/slack/command` | POST | Slack Sig | Slash command handler |

### Testing Checklist
- [ ] Generate and set `BEARER_TOKEN`
- [ ] Test authenticated POST/PUT/DELETE requests
- [ ] Export locations CSV
- [ ] Import locations CSV
- [ ] Create Slack app and configure `/dd` command
- [ ] Set `SLACK_SIGNING_SECRET`
- [ ] Test `/dd list` in Slack
- [ ] Test `/dd impact <id>` in Slack
- [ ] Test `/dd impact <lat,lng>` in Slack

---

## Troubleshooting

### Bearer Auth Issues
**Error: 401 Unauthorized**
- Verify `BEARER_TOKEN` is set in Replit Secrets
- Check `Authorization: Bearer <token>` header format
- Restart workflow after adding secret

### CSV Import Issues
**Error: Missing required columns**
- Ensure CSV has: id, name, lat, lng
- Use header row: `id,name,lat,lng,alert,threshold`

**Error: Invalid coordinates**
- Latitude must be -90 to 90
- Longitude must be -180 to 180

### Slack Integration Issues
**Error: invalid signature**
- Verify `SLACK_SIGNING_SECRET` matches Slack app credentials
- Check Request URL is correct: `https://your-app.replit.app/api/slack/command`
- Ensure app is installed to workspace

**Error: Unknown location id**
- Use `/dd list` to see available location IDs
- Location IDs are case-insensitive

---

## Example Workflows

### Workflow 1: Bulk Site Setup
```bash
# 1. Create CSV with 50 construction sites
cat > sites.csv << EOF
id,name,lat,lng,alert,threshold
site-001,Downtown Miami,25.7617,-80.1918,true,60
site-002,Brickell Tower,25.7617,-80.1948,true,65
site-003,Wynwood Loft,25.8014,-80.1994,true,55
...
EOF

# 2. Import sites (requires Bearer token)
curl -X POST https://your-app.replit.app/api/locations/import \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -F "file=@sites.csv"

# 3. Monitor via Slack
/dd list
```

### Workflow 2: Real-time Monitoring
```bash
# 1. Check impact for high-priority site
/dd impact site-001

# 2. Check impact for storm-affected coordinates  
/dd impact 26.1224,-80.1373

# 3. Export current data for analysis
curl https://your-app.replit.app/api/locations/export -o report.csv
```

### Workflow 3: Alert Automation
Use Slack webhooks to trigger alerts when impact exceeds threshold:

```javascript
// In your monitoring script
async function checkAndAlert() {
  const locations = await fetch('https://your-app.replit.app/api/locations');
  const data = await locations.json();
  
  for (const loc of data) {
    if (loc.alertEnabled && loc.impactScore >= loc.threshold) {
      // Send Slack notification
      await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        body: JSON.stringify({
          text: `🚨 Alert: ${loc.name} impact score ${loc.impactScore} exceeds threshold ${loc.threshold}`
        })
      });
    }
  }
}
```

---

## API Response Examples

### GET /api/locations
```json
[
  {
    "id": "miami-hq",
    "name": "Miami HQ",
    "lat": 25.7617,
    "lng": -80.1918,
    "alertEnabled": true,
    "threshold": 60,
    "impactScore": 85,
    "lastUpdated": "2025-10-15T18:56:00.000Z"
  }
]
```

### POST /api/locations (with Bearer token)
```json
{
  "id": "tampa-site",
  "name": "Tampa Construction Site",
  "lat": 27.9506,
  "lng": -82.4572,
  "alertEnabled": true,
  "threshold": 70
}
```

### POST /api/locations/import (with Bearer token)
```json
{
  "success": true,
  "imported": 25,
  "errors": []
}
```

---

## Support

For issues or questions:
- Check logs: `refresh_all_logs` tool
- Verify environment variables are set
- Test endpoints with curl/Postman first
- Check Slack app configuration matches exactly

**Created**: October 15, 2025  
**Version**: 1.0.0
