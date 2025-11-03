# Health Endpoint & JWKS Auto-Refresh

This document explains the health diagnostics endpoint and automatic JWKS refresh system.

## 🏥 Health/Auth Diagnostics Endpoint

### GET /api/health/auth

Returns detailed information about OIDC/JWKS configuration and optionally verifies JWT tokens.

#### Basic Usage (No Token)

```bash
curl http://localhost:5000/api/health/auth
```

**Response:**
```json
{
  "oidc": {
    "configured": true,
    "issuer": "https://your-tenant.auth0.com/",
    "audience": "https://api.disaster-direct.com",
    "enforce": false
  },
  "jwks": {
    "cached": true,
    "key_count": 2,
    "last_fetch": "2025-11-03T18:00:00.000Z",
    "last_status": 200,
    "etag": "W/\"abc123\"",
    "max_age": 21600,
    "next_refresh": "2025-11-03T23:00:00.000Z"
  },
  "token": {
    "provided": false,
    "hint": "Provide token via ?token= or Authorization: Bearer header"
  }
}
```

#### Verify Token (Query Parameter)

```bash
curl 'http://localhost:5000/api/health/auth?token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
```

#### Verify Token (Authorization Header)

```bash
curl http://localhost:5000/api/health/auth \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (with token):**
```json
{
  "oidc": { ... },
  "jwks": { ... },
  "token": {
    "provided": true,
    "unverified_claims": {
      "iss": "https://your-tenant.auth0.com/",
      "sub": "auth0|12345",
      "aud": "https://api.disaster-direct.com",
      "exp": 1699024800,
      "iat": 1699021200,
      "role": "admin"
    },
    "verification": {
      "verified": true,
      "error": null
    },
    "verified_claims": {
      "iss": "https://your-tenant.auth0.com/",
      "sub": "auth0|12345",
      "aud": "https://api.disaster-direct.com",
      "exp": 1699024800,
      "iat": 1699021200,
      "role": "admin"
    }
  }
}
```

### Use Cases

#### 1. Check OIDC Configuration Status

```bash
# Quick health check
curl http://localhost:5000/api/health/auth | jq '.oidc'
```

#### 2. Verify JWKS Cache Status

```bash
# Check if JWKS is cached and when it was last refreshed
curl http://localhost:5000/api/health/auth | jq '.jwks'
```

#### 3. Debug Token Issues

```bash
# Test if a token can be decoded and verified
curl 'http://localhost:5000/api/health/auth?token=YOUR_TOKEN' | jq '.'
```

#### 4. Monitor Auto-Refresh

```bash
# Check when the next JWKS refresh will occur
curl http://localhost:5000/api/health/auth | jq '.jwks.next_refresh'
```

### Response Fields

#### OIDC Section
- **configured**: `true` if issuer and audience are set
- **issuer**: Identity provider URL
- **audience**: API identifier
- **enforce**: Whether strict JWT verification is enabled

#### JWKS Section
- **cached**: `true` if JWKS is loaded in memory
- **key_count**: Number of signing keys in JWKS
- **last_fetch**: ISO timestamp of last successful fetch
- **last_status**: HTTP status code of last fetch (200 = success, 304 = not modified)
- **etag**: ETag from last successful fetch (used for conditional requests)
- **max_age**: Cache duration in seconds from Cache-Control header
- **next_refresh**: ISO timestamp when next refresh is scheduled

#### Token Section (when token provided)
- **provided**: `true` if token was provided
- **unverified_claims**: Claims decoded without signature verification
- **verification.verified**: `true` if signature verification succeeded
- **verification.error**: Error message if verification failed
- **verified_claims**: Claims from verified token (only if verification succeeded)

## 🔄 Background JWKS Auto-Refresh

The system automatically refreshes JWKS from your identity provider to ensure signing keys stay up-to-date.

### How It Works

1. **Starts on Boot**: JWKS refresher starts automatically when the server starts
2. **Initial Fetch**: Fetches JWKS immediately on first run
3. **Smart Caching**: Uses ETag and Cache-Control headers for efficient refreshes
4. **Scheduled Refreshes**: Automatically schedules next refresh based on provider hints

### Refresh Cadence

The system respects cache hints from your identity provider:

#### Default Intervals
- **Minimum**: 30 minutes
- **Maximum**: 6 hours
- **Default**: 6 hours (if no Cache-Control provided)

#### Cache-Control Respect

If your identity provider sends `Cache-Control: max-age=21600` (6 hours):
```
Next refresh: 6 hours
```

If provider sends `Cache-Control: max-age=3600` (1 hour):
```
Next refresh: 1 hour (within bounds)
```

If provider sends `Cache-Control: max-age=1800` (30 minutes):
```
Next refresh: 30 minutes (minimum bound)
```

### ETag Support

The refresher uses ETags for conditional requests:

1. **First Request**: No ETag
   ```
   GET /.well-known/jwks.json
   Response: 200 OK
   ETag: "abc123"
   ```

2. **Subsequent Requests**: Include ETag
   ```
   GET /.well-known/jwks.json
   If-None-Match: "abc123"
   Response: 304 Not Modified (JWKS unchanged)
   ```

This saves bandwidth and reduces load on your identity provider.

### JWKS Metadata

The system tracks metadata for each refresh:

```json
{
  "last_fetch": "2025-11-03T18:00:00.000Z",
  "last_status": 200,
  "etag": "W/\"abc123\"",
  "max_age": 21600,
  "key_count": 2
}
```

### Logs

The JWKS refresher provides detailed console logs:

```
🔄 Starting JWKS background refresher...
🔄 Fetching JWKS from https://your-tenant.auth0.com/.well-known/jwks.json...
✅ JWKS refreshed successfully: 2 keys
   ETag: W/"abc123"
   Cache-Control: max-age=21600s
⏰ Next JWKS refresh scheduled for 2025-11-03T23:00:00.000Z (in 360 minutes)
```

Subsequent refreshes:
```
🔄 Fetching JWKS from https://your-tenant.auth0.com/.well-known/jwks.json...
✅ JWKS unchanged (304 Not Modified)
⏰ Next JWKS refresh scheduled for 2025-11-04T05:00:00.000Z (in 360 minutes)
```

Errors:
```
❌ JWKS refresh failed: Failed to fetch JWKS: HTTP 500
⏰ Next JWKS refresh scheduled for 2025-11-03T18:30:00.000Z (in 30 minutes)
```

## 🛠️ Manual Refresh

You can manually trigger a JWKS refresh via the admin panel:

1. Visit `/admin/oidc`
2. Click **"Refresh JWKS from Provider"**

Or via API:

```bash
curl -X POST http://localhost:5000/api/admin/oidc/refresh_jwks \
  -H "X-User-Role: admin"
```

## 🧪 Testing

### Verify Auto-Refresh is Running

```bash
# Check server logs on startup
# Should see: 🔄 Starting JWKS background refresher...
```

### Check Last Refresh

```bash
curl http://localhost:5000/api/health/auth | jq '.jwks.last_fetch'
# Returns: "2025-11-03T18:00:00.000Z"
```

### Check Next Refresh

```bash
curl http://localhost:5000/api/health/auth | jq '.jwks.next_refresh'
# Returns: "2025-11-03T23:00:00.000Z"
```

### Verify ETag Usage

Check server logs during a refresh:
```
🔄 Fetching JWKS from https://your-tenant.auth0.com/.well-known/jwks.json...
   (with If-None-Match: W/"abc123")
✅ JWKS unchanged (304 Not Modified)
```

## 📊 Monitoring

### Production Monitoring

Monitor these metrics in production:

1. **Last Fetch Timestamp**: Should update regularly
2. **Last Status**: Should be 200 or 304
3. **Key Count**: Should match your identity provider
4. **Next Refresh**: Should be within expected bounds

### Alert on Failures

Set up alerts if:
- `last_status` is not 200 or 304
- `last_fetch` is older than 24 hours
- `key_count` is 0
- `last_error` field exists

Example health check:
```bash
#!/bin/bash
STATUS=$(curl -s http://localhost:5000/api/health/auth | jq -r '.jwks.last_status')
if [ "$STATUS" != "200" ] && [ "$STATUS" != "304" ]; then
  echo "ALERT: JWKS refresh failing (status: $STATUS)"
  exit 1
fi
```

## 🔧 Troubleshooting

### JWKS Not Refreshing

**Symptom**: `last_fetch` timestamp not updating

**Check**:
1. Server logs for refresh errors
2. Network connectivity to identity provider
3. Issuer URL is correct

**Solution**:
```bash
# Manually trigger refresh
curl -X POST http://localhost:5000/api/admin/oidc/refresh_jwks \
  -H "X-User-Role: admin"
```

### 304 Not Modified Always

**Symptom**: `last_status` always 304, JWKS never updates

**This is normal!** 304 means your JWKS hasn't changed. Your identity provider is correctly using ETags.

**When to worry**: Only if you expect new keys (e.g., key rotation) but don't see them.

### High Refresh Frequency

**Symptom**: JWKS refreshes every 30 minutes

**Cause**: Provider sends `Cache-Control: max-age=1800` or lower

**Expected**: System enforces 30-minute minimum to protect provider

### Low Refresh Frequency

**Symptom**: JWKS only refreshes every 6 hours

**Cause**: Provider doesn't send Cache-Control header

**Expected**: System defaults to 6-hour maximum for safety

## 📚 Integration Examples

### Auth0

Auth0 typically returns:
```
Cache-Control: max-age=86400  (24 hours)
ETag: W/"abc123"
```

Your refresh interval: **6 hours** (clamped to maximum)

### Clerk

Clerk typically returns:
```
Cache-Control: max-age=3600  (1 hour)
```

Your refresh interval: **1 hour**

### Supabase

Supabase typically returns:
```
Cache-Control: max-age=21600  (6 hours)
ETag: "xyz789"
```

Your refresh interval: **6 hours**

## 🎯 Best Practices

1. **Monitor health endpoint regularly** in production
2. **Set up alerts** for refresh failures
3. **Respect 304 responses** - they save bandwidth
4. **Don't force refresh too often** - providers may rate limit
5. **Check logs** for ETag and Cache-Control headers
6. **Use the health endpoint** to debug token issues

---

**🚀 Your JWKS auto-refresh system ensures your authentication stays secure and up-to-date without manual intervention!**
