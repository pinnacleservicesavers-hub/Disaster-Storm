# Disaster Direct - Security Setup Guide

## Overview

Disaster Direct now includes enterprise-grade security with role-based authentication, protected endpoints, and an admin interface.

---

## Role-Based Authentication

### Three Security Roles

1. **ADMIN** - Full write access (locations, alerts, warm, imports, checks)
2. **SIGNER** - Can mint signed tile URLs (`/api/sign/*`)
3. **VIEWER** - Optional read-only access for JSON APIs

### Token Hierarchy

- `ADMIN` tokens can do everything
- `SIGNER` tokens can sign + view (if SIGNER is set, ADMIN also works)
- `VIEWER` tokens can only view (if VIEWER is set, ADMIN also works)

---

## Environment Variables

### Required for Production

```bash
# Admin API Token (primary authentication)
ADMIN_API_TOKEN=your-secure-random-token-here

# Legacy compatibility (if ADMIN_API_TOKEN not set, this acts as ADMIN)
BEARER_TOKEN=your-secure-random-token-here
```

### Optional Tokens

```bash
# Allow specific systems to mint signed tile URLs without full admin
SIGNER_API_TOKEN=your-signer-token-here

# Gate read-only JSON GETs (impact/nws/xweather) - optional
VIEWER_API_TOKEN=your-viewer-token-here

# Legacy compatibility
READONLY_TOKEN=your-readonly-token-here
```

### External Services

```bash
# Slack integration
SLACK_SIGNING_SECRET=your-slack-signing-secret

# Tile security (production)
TILE_SIGN_SECRET=your-tile-signing-secret
ENFORCE_SIGNED_TILES=1

# Base URL for callbacks
PUBLIC_BASE_URL=https://your-app.replit.app
```

### Alert Automation (Optional)

```bash
# Auto-check alerts every N seconds (0 = disabled)
ALERT_POLL_SEC=300
```

---

## Generating Secure Tokens

Use these commands to generate cryptographically secure tokens:

```bash
# For ADMIN_API_TOKEN
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# For SIGNER_API_TOKEN
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"

# For VIEWER_API_TOKEN
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

---

## Protected Endpoints

### ADMIN Token Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/locations` | POST | Create location |
| `/api/locations/:id` | PUT | Update location |
| `/api/locations/:id` | DELETE | Delete location |
| `/api/locations/import` | POST | CSV import |
| `/api/alerts/config` | PUT | Update alerts config |
| `/api/alerts/toggle/:id` | PUT | Toggle location alerts |
| `/api/alerts/check` | POST | Run alert check now |
| `/api/warm` | ALL | Cache warming |

### SIGNER Token Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/sign/tile` | GET | Generate signed tile URL (single) |
| `/api/sign/legend` | GET | Generate signed legend URL (single) |
| `/api/sign/batch/tiles` | POST | Generate signed tile URLs (batch) |
| `/api/sign/batch/legend` | POST | Generate signed legend URLs (batch) |

### VIEWER Token (Optional Gating)

If `VIEWER_API_TOKEN` is set, these require authentication:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/impact` | GET | Impact data |
| `/api/nws` | GET | NWS forecasts |
| `/api/xweather` | GET | Xweather data |

### Public Endpoints (No Auth)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/locations` | GET | List locations |
| `/api/locations/export` | GET | Export CSV |
| `/api/alerts/config` | GET | Get alerts config |
| `/admin` | GET | Admin interface |
| `/health` | GET | Health check |

---

## Admin Interface

### Accessing the Admin Panel

1. Navigate to `https://your-app.replit.app/admin`
2. Paste your base URL (defaults to current origin)
3. Paste your `ADMIN_API_TOKEN` or `BEARER_TOKEN`
4. Click "Save"

### Features

- **Locations Management**: Add, edit, delete, toggle alerts
- **CSV Import/Export**: Bulk operations
- **Alerts Configuration**: Set webhook URL and default threshold
- **Manual Checks**: Trigger alert checks on demand

### Security Notes

- Credentials stored in browser localStorage only
- Never transmitted except in Authorization headers
- Admin panel is public, but all write operations require ADMIN token

---

## Slack Integration

### Setup

1. Create Slack app at https://api.slack.com/apps
2. Add slash command `/dd` pointing to `https://your-app.replit.app/api/slack/command`
3. Copy signing secret to `SLACK_SIGNING_SECRET`
4. Install app to workspace

### Commands

```
/dd list                    # List locations with impact scores
/dd impact miami-hq         # Get impact for location ID
/dd impact 25.7617,-80.1918 # Get impact for coordinates
/dd help                    # Show help
```

### Security

- Request signature verification prevents unauthorized commands
- Uses constant-time comparison to prevent timing attacks
- Rejects requests >5 minutes old

---

## Docker Deployment

### Build Image

```bash
docker build -t disaster-direct .
```

### Run Container

```bash
docker run -d \
  -p 5000:5000 \
  -e ADMIN_API_TOKEN=your-admin-token \
  -e AMBEE_API_KEY=your-ambee-key \
  -e XWEATHER_CLIENT_ID=your-xweather-id \
  -e XWEATHER_CLIENT_SECRET=your-xweather-secret \
  -e PUBLIC_BASE_URL=https://your-domain.com \
  -e TILE_SIGN_SECRET=your-tile-secret \
  -e ENFORCE_SIGNED_TILES=1 \
  --name disaster-direct \
  disaster-direct
```

### Deploy on Render

1. New → Web Service → "Use Docker"
2. Root directory: `.` (project root)
3. Environment: Docker
4. Add environment variables (see above)
5. Health check path: `/health`

### Deploy on Railway

1. New Project → Deploy from Repo
2. Railway auto-detects Dockerfile
3. Add environment variables
4. Open generated URL

---

## Frontend Integration

### Using ADMIN Token

```javascript
const response = await fetch('/api/locations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ADMIN_API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'miami-hq',
    name: 'Miami HQ',
    lat: 25.7617,
    lng: -80.1918,
    alert: true,
    threshold: 60
  })
});
```

### Using VIEWER Token (if enabled)

```javascript
const response = await fetch('/api/impact?lat=25.7617&lng=-80.1918', {
  headers: {
    'Authorization': `Bearer ${VIEWER_API_TOKEN}`
  }
});
```

### Using SIGNER Token

```javascript
// Server-side: mint signed tile URL
const response = await fetch('/api/sign/tile?template=/api/impact/tiles/{z}/{x}/{y}.png', {
  headers: {
    'Authorization': `Bearer ${SIGNER_API_TOKEN}`
  }
});
const { signedUrl } = await response.json();

// Client-side: use signed URL
map.addLayer({
  type: 'raster',
  source: {
    type: 'raster',
    tiles: [signedUrl]
  }
});
```

---

## Security Best Practices

### Token Management

1. **Never commit tokens** to version control
2. **Rotate tokens** quarterly or after team changes
3. **Use different tokens** for dev/staging/production
4. **Monitor usage** via logs for suspicious activity

### Access Control

1. **Principle of least privilege**: Use VIEWER for read-only dashboards
2. **Separate concerns**: Use SIGNER for tile services, not full ADMIN
3. **Audit regularly**: Review who has ADMIN access

### Network Security

1. **Always use HTTPS** in production
2. **Enable CORS** only for trusted domains
3. **Set PUBLIC_BASE_URL** to your actual domain
4. **Enable signed tiles** with `ENFORCE_SIGNED_TILES=1`

---

## Troubleshooting

### 401 Unauthorized Errors

**Problem**: Write operations return 401

**Solutions**:
- Verify `ADMIN_API_TOKEN` or `BEARER_TOKEN` is set
- Check Authorization header format: `Bearer <token>`
- Ensure token matches exactly (no extra spaces)
- Restart server after adding env vars

### Admin Panel Not Working

**Problem**: Admin panel shows errors

**Solutions**:
- Check console for fetch errors
- Verify API Base URL is correct
- Ensure ADMIN token is pasted correctly
- Check CORS if accessing from different domain

### Slack Commands Failing

**Problem**: `/dd` commands show "invalid signature"

**Solutions**:
- Verify `SLACK_SIGNING_SECRET` matches Slack app
- Check webhook URL points to correct domain
- Ensure app is installed to workspace
- Check server logs for timing errors

### CSV Import Fails

**Problem**: Import returns validation errors

**Solutions**:
- Verify CSV has required columns: id, name, lat, lng
- Check coordinate ranges (lat: -90 to 90, lng: -180 to 180)
- Ensure no duplicate IDs in CSV
- Use ADMIN token, not VIEWER

---

## Migration from Previous Setup

### Update Env Vars

Old:
```bash
API_AUTH_TOKEN=token
```

New (recommended):
```bash
ADMIN_API_TOKEN=token
```

### Update Code

Old:
```javascript
import { requireBearer } from './middleware/bearerAuth.js';
app.post('/api/locations', requireBearer, handler);
```

New:
```javascript
import { requireRole } from './middleware/bearerAuth.js';
app.post('/api/locations', requireRole('ADMIN'), handler);
```

### Backward Compatibility

- `BEARER_TOKEN` still works as ADMIN
- `requireBearer()` still works (alias for `requireRole('ADMIN')`)
- Existing tokens don't need to change

---

## Batch Signing

### Overview

Batch signing allows you to mint multiple signed URLs in a single request, dramatically improving performance when loading map tiles.

### POST /api/sign/batch/tiles

Sign multiple tile URLs at once.

**Request:**
```bash
curl -X POST "https://your-app.com/api/sign/batch/tiles" \
  -H "Authorization: Bearer $SIGNER_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {"z":10,"x":271,"y":392,"pollen":"1","grid":"6","ttl":"300"},
    {"z":10,"x":272,"y":392,"scheme":"plasma"},
    {"z":9,"x":135,"y":196}
  ]'
```

**Response:**
```json
{
  "items": [
    {
      "z": 10,
      "x": 271,
      "y": 392,
      "url": "/api/impact/tiles/10/271/392.png?pollen=1&grid=6&scheme=viridis&ttl=300&sig=abc...&exp=1234567890"
    },
    {
      "z": 10,
      "x": 272,
      "y": 392,
      "url": "/api/impact/tiles/10/272/392.png?pollen=1&grid=6&scheme=plasma&ttl=180&sig=def...&exp=1234567890"
    }
  ]
}
```

### POST /api/sign/batch/legend

Sign multiple legend URLs at once.

**Request:**
```bash
curl -X POST "https://your-app.com/api/sign/batch/legend" \
  -H "Authorization: Bearer $SIGNER_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {"scheme":"viridis","width":"512","height":"64"},
    {"scheme":"plasma","width":"256","height":"48"}
  ]'
```

**JavaScript Example:**
```javascript
// Sign tiles for current map viewport
async function signVisibleTiles(bounds, zoom) {
  const tiles = [];
  for (let x = bounds.minX; x <= bounds.maxX; x++) {
    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      tiles.push({ z: zoom, x, y, ttl: 600 });
    }
  }

  const response = await fetch('/api/sign/batch/tiles', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SIGNER_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tiles)
  });

  const { items } = await response.json();
  return items.map(item => item.url);
}
```

---

## Cloudflare Worker Signer (Edge)

### Overview

Deploy a Cloudflare Worker for ultra-fast edge-based signing without hitting your backend. Perfect for public-facing maps that need signed URLs.

### Features

- **5-10ms latency** globally (vs 50-200ms to origin)
- **Auto-scaling** to millions of requests
- **No auth required** for public use
- **Same HMAC security** as backend

### Setup

1. **Install Wrangler:**
```bash
npm install -g wrangler
wrangler login
```

2. **Deploy Worker:**
```bash
cd cloudflare-worker
wrangler secret put TILE_SIGN_SECRET  # Use same value as backend
wrangler deploy
```

3. **Get Worker URL:**
```
✅ https://dd-signer.<your-subdomain>.workers.dev
```

### Usage

**Sign Tile:**
```bash
curl "https://dd-signer.your-worker.workers.dev/sign/tile?z=10&x=271&y=392&ttl=600"
```

**Sign Legend:**
```bash
curl "https://dd-signer.your-worker.workers.dev/sign/legend?scheme=plasma&width=512"
```

**Frontend Integration:**
```javascript
const workerUrl = 'https://dd-signer.your-worker.workers.dev';
const backendUrl = 'https://your-backend.com';

async function getSignedTile(z, x, y) {
  const res = await fetch(`${workerUrl}/sign/tile?z=${z}&x=${x}&y=${y}`);
  const { url } = await res.json();
  return `${backendUrl}${url}`;
}
```

### Configuration

Edit `cloudflare-worker/wrangler.toml`:
```toml
name = "dd-signer"
main = "worker.js"
compatibility_date = "2024-10-01"

[vars]
TILE_SIGN_TTL_SEC = "300"
```

### Cost

- **Free Tier**: 100,000 requests/day
- **Paid**: $0.50 per million additional requests

For typical storm response usage, costs are negligible or free.

### When to Use

| Use Case | Recommended Solution |
|----------|---------------------|
| Public maps | Cloudflare Worker (fastest) |
| Authenticated dashboards | Backend `/api/sign/*` (secure) |
| Batch operations | Backend batch endpoints (efficient) |

---

## GitHub Actions CI/CD

### Overview

Automatically build and push Docker images to GitHub Container Registry on every tagged release.

### Setup

1. **Enable GHCR:**
   - Go to your repo → Settings → Actions → General
   - Enable "Read and write permissions" for GITHUB_TOKEN

2. **Create Tag:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

3. **Workflow Triggers:**
   - Builds on tags matching `v*.*.*` (e.g., v1.2.3)
   - Pushes to `ghcr.io/<owner>/<repo>-backend:latest`
   - Pushes to `ghcr.io/<owner>/<repo>-backend:v1.2.3`

### Deploy to Render/Railway

**Render:**
1. New Web Service → "Deploy from Docker image"
2. Image URL: `ghcr.io/<owner>/<repo>-backend:latest`
3. Add environment variables
4. Health check: `/health`

**Railway:**
1. New Project → Deploy from Repo
2. Auto-detects Dockerfile
3. Add environment variables
4. Deploys automatically

### Workflow File

See `.github/workflows/docker-build.yml` for the complete configuration.

---

## Support

For issues or questions:
- Check server logs: `refresh_all_logs` tool
- Review this documentation
- Test with curl/Postman first
- Verify all env vars are set

**Created**: October 15, 2025  
**Version**: 2.0.0
