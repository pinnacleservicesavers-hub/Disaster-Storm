# Disaster Direct - Cloudflare Worker Signer

Edge-based tile and legend URL signer for Disaster Direct. Deploys to Cloudflare Workers for ultra-fast HMAC signature generation without hitting your backend.

## Features

- **Edge Performance**: Sign URLs at Cloudflare's edge (sub-10ms globally)
- **Same Security**: Uses identical HMAC SHA-256 signing as backend
- **No Admin Token**: Frontend can get signed URLs without ADMIN/SIGNER access
- **Auto-scaling**: Handles millions of requests with zero config

## Endpoints

### GET /sign/tile
Sign a single impact tile URL

**Query Params:**
- `z`, `x`, `y` (required) - Tile coordinates
- `fmt` (optional, default: "png") - Image format
- `pollen` (optional, default: "1") - Include pollen layer
- `grid` (optional, default: "6") - Grid size
- `scheme` (optional, default: "viridis") - Color scheme
- `ttl` (optional, default: 300) - Signature validity in seconds

**Example:**
```bash
curl "https://dd-signer.your-worker.workers.dev/sign/tile?z=10&x=271&y=392&ttl=600"
```

**Response:**
```json
{
  "url": "/api/impact/tiles/10/271/392.png?pollen=1&grid=6&scheme=viridis&ttl=600&sig=abc123...&exp=1234567890"
}
```

### GET /sign/legend
Sign a legend URL

**Query Params:**
- `scheme` (optional, default: "viridis") - Color scheme
- `width` (optional, default: "256") - Legend width
- `height` (optional, default: "48") - Legend height
- `bg` (optional, default: "solid") - Background style
- `fmt` (optional, default: "png") - Image format
- `ttl` (optional, default: 300) - Signature validity in seconds

**Example:**
```bash
curl "https://dd-signer.your-worker.workers.dev/sign/legend?scheme=plasma&width=512"
```

### GET /health
Health check endpoint

## Deployment

### Prerequisites
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Setup

1. **Install Wrangler** (if not already installed):
```bash
npm install -g wrangler
```

2. **Login to Cloudflare**:
```bash
wrangler login
```

3. **Set the signing secret** (must match your backend):
```bash
cd cloudflare-worker
wrangler secret put TILE_SIGN_SECRET
# Paste the same value as your backend's TILE_SIGN_SECRET
```

4. **Deploy the worker**:
```bash
wrangler deploy
```

5. **Get your worker URL**:
```
✅ Successfully deployed Worker
   https://dd-signer.<your-subdomain>.workers.dev
```

### Configuration

Edit `wrangler.toml` to customize:

```toml
name = "dd-signer"              # Worker name
main = "worker.js"               # Entry point
compatibility_date = "2024-10-01"

[vars]
TILE_SIGN_TTL_SEC = "300"       # Default TTL in seconds
```

### Environment Variables

Set these with `wrangler secret put <KEY>`:

| Variable | Required | Description |
|----------|----------|-------------|
| `TILE_SIGN_SECRET` | Yes | HMAC secret (must match backend) |

Set these in `wrangler.toml` under `[vars]`:

| Variable | Default | Description |
|----------|---------|-------------|
| `TILE_SIGN_TTL_SEC` | 300 | Default signature TTL in seconds |

## Usage in Frontend

### JavaScript/TypeScript

```javascript
// Sign a tile URL via Worker
async function getSignedTileUrl(z, x, y) {
  const workerUrl = 'https://dd-signer.your-worker.workers.dev';
  const response = await fetch(
    `${workerUrl}/sign/tile?z=${z}&x=${x}&y=${y}&ttl=600`
  );
  const { url } = await response.json();
  
  // Use signed URL with your backend
  const backendUrl = 'https://your-backend.com';
  return `${backendUrl}${url}`;
}

// Use in map
const tileUrl = await getSignedTileUrl(10, 271, 392);
map.addLayer({
  type: 'raster',
  source: {
    type: 'raster',
    tiles: [tileUrl]
  }
});
```

### Batch Signing (Client-side)

```javascript
async function signTileBatch(tiles) {
  const workerUrl = 'https://dd-signer.your-worker.workers.dev';
  const backendUrl = 'https://your-backend.com';
  
  const signedTiles = await Promise.all(
    tiles.map(async ({ z, x, y }) => {
      const res = await fetch(
        `${workerUrl}/sign/tile?z=${z}&x=${x}&y=${y}`
      );
      const { url } = await res.json();
      return `${backendUrl}${url}`;
    })
  );
  
  return signedTiles;
}
```

## Security

- **No ADMIN token exposure**: Frontend never sees your ADMIN/SIGNER tokens
- **Constant-time HMAC**: Prevents timing attacks
- **Expiry enforcement**: Backend validates `exp` timestamp
- **Same secret**: Worker uses identical `TILE_SIGN_SECRET` as backend

## Monitoring

View worker logs and metrics:
```bash
wrangler tail
```

Or use the [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages → dd-signer

## Cost

Cloudflare Workers Free Tier:
- **100,000 requests/day** (free)
- **10ms CPU time per request** (free)
- **Additional requests**: $0.50 per million

For Disaster Direct's typical usage (map tiles during storms), costs are negligible or free.

## Troubleshooting

### Invalid Signature Errors

**Problem**: Backend rejects signed URLs with "Invalid signature"

**Solutions**:
- Verify `TILE_SIGN_SECRET` matches exactly between Worker and backend
- Check that both use SHA-256 HMAC
- Ensure expiry (`exp`) is in future (clock sync)

### Worker Not Found

**Problem**: 404 when calling worker URL

**Solutions**:
- Verify deployment: `wrangler deploy`
- Check worker name in `wrangler.toml`
- Wait 1-2 minutes for global propagation

### CORS Errors

**Problem**: Browser blocks Worker requests

**Solutions**:
Add CORS headers to Worker responses:
```javascript
const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*"
};
return new Response(JSON.stringify({ url }), { headers });
```

## Development

Test locally before deploying:
```bash
wrangler dev
```

Worker runs at `http://localhost:8787`

## Comparison: Worker vs Backend Signer

| Feature | Worker | Backend (`/api/sign/*`) |
|---------|--------|-------------------------|
| Speed | ~5ms (edge) | ~50-200ms (origin) |
| Auth | None (public) | Requires SIGNER token |
| Scaling | Auto (unlimited) | Manual (server-based) |
| Cost | $0.50/million | Server costs |
| Use Case | Public maps | Admin/API clients |

**Recommendation**: Use Worker for public-facing maps, Backend for authenticated API clients.

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)

---

**Version**: 1.0.0  
**Updated**: October 15, 2025
