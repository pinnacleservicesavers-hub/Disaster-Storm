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
| `/api/sign/tile` | GET | Generate signed tile URLs |
| `/api/sign/legend` | GET | Generate signed legend URLs |

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

## Support

For issues or questions:
- Check server logs: `refresh_all_logs` tool
- Review this documentation
- Test with curl/Postman first
- Verify all env vars are set

**Created**: October 15, 2025  
**Version**: 2.0.0
