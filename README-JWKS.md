# JWT Verification with JWKS (Production-Ready)

This implementation provides **verified JWT authentication** with support for Auth0, Clerk, Supabase, and other OIDC-compliant identity providers.

## 🎯 Overview

- **Backend**: Verifies JWT signatures using JWKS (JSON Web Key Set)
- **Frontend**: Automatically sends `Authorization: Bearer <token>` headers
- **Enforcement Toggle**: ON = strict verification, OFF = development mode
- **Algorithms**: RS256, RS384, RS512, ES256, ES384, ES512, PS256, PS384, PS512

## 🚀 Quick Start

### 1. Start the Application

```bash
npm run dev
```

The server runs at `http://localhost:5000`

### 2. Configure OIDC Settings

Visit **http://localhost:5000/admin/oidc** and configure:

- **Issuer**: Your identity provider URL (e.g., `https://your-tenant.auth0.com/`)
- **Audience**: Your API identifier (e.g., `https://api.disaster-direct.com`)
- **Enforce**: Toggle ON for production verification

### 3. Refresh JWKS

Click **"Refresh JWKS from Provider"** to fetch signing keys from:
```
{issuer}/.well-known/jwks.json
```

Alternatively, POST JWKS manually to `/api/admin/oidc/jwks`

### 4. Test Authentication

Visit `/auth/login` to create a demo JWT (development only) or integrate with a real OAuth provider.

## 🏗️ Architecture

### Backend Components

#### **JWT Verification Middleware** (`server/middleware/jwtVerification.ts`)

- **`extractAuthContextWithVerification()`**: Main middleware that:
  - Extracts JWT from `Authorization: Bearer <token>` header
  - Fetches OIDC settings (issuer, audience, enforce, JWKS)
  - Verifies signature against JWKS if `enforce = true`
  - Falls back to unverified decoding if `enforce = false`
  - Sets `req.auth = { role, user_id, scopes }`

**Verification Flow**:
1. Parse JWT header to get `kid` (key ID) and `alg` (algorithm)
2. Select matching key from cached JWKS
3. Convert JWK to PEM format
4. Verify signature using `jsonwebtoken` library
5. Validate `iss` (issuer) and `aud` (audience) claims
6. Extract role from `role` or `app_role` claim
7. Extract user ID from `sub` or `user_id` claim

#### **Admin OIDC Routes** (`server/routes/adminOidc.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/oidc` | GET | Get current OIDC configuration |
| `/api/admin/oidc` | POST | Update OIDC settings |
| `/api/admin/oidc/refresh_jwks` | POST | Fetch JWKS from provider |
| `/api/admin/oidc/jwks` | POST | Manually upload JWKS |

#### **OIDC Settings Storage** (`server/storage.ts`)

```typescript
interface OIDCSettings {
  issuer?: string;       // Identity provider URL
  audience?: string;     // API identifier
  enforce?: boolean;     // Strict verification
  jwks?: {              // Cached signing keys
    keys: JWKSKey[];
  };
}
```

### Frontend Components

#### **Admin OIDC Configuration Page** (`/admin/oidc`)

Beautiful admin interface with:
- Issuer URL input
- Audience input
- Enforcement toggle with warnings
- JWKS refresh button
- Real-time key count display
- Development mode notice

#### **Enhanced Auth Adapter** (`client/src/lib/auth.ts`)

- Decodes JWT claims (no verification on client side)
- Extracts `sub`, `role`, `app_role` from token
- Stores token in `localStorage`
- Pluggable provider system (`VITE_AUTH_PROVIDER`)

#### **API Client** (`client/src/lib/api.ts`)

- Automatically attaches `Authorization: Bearer <token>` to all requests
- Includes fallback `X-User-*` headers for backwards compatibility

## 🔐 Verification Behavior

### Enforce Mode: **ON** (Production)

```typescript
enforce = true
```

**Behavior**:
- ✅ JWT signature MUST be valid
- ✅ Issuer MUST match configured issuer
- ✅ Audience MUST match configured audience  
- ❌ Missing or invalid token → `401 Unauthorized`
- ❌ Fallback headers (`X-User-*`) are IGNORED

**Use Case**: Production deployments with real users

### Enforce Mode: **OFF** (Development)

```typescript
enforce = false
```

**Behavior**:
- ⚠️ JWT is decoded WITHOUT signature verification
- ✅ Fallback headers (`X-User-Role`, `X-User-Id`) accepted
- ✅ Missing token allowed (uses defaults)
- ⚠️ Claims extracted but NOT validated

**Use Case**: Local development, testing, demos

## 🔌 Provider Integration Examples

### Auth0

**1. Configure Auth0 Application**:
- Create API in Auth0 Dashboard
- Note the **Issuer** (tenant URL) and **Audience** (API identifier)

**2. Update `.env`**:
```env
VITE_AUTH_PROVIDER=auth0
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://api.disaster-direct.com
```

**3. Configure in Admin Panel**:
- Issuer: `https://your-tenant.auth0.com/`
- Audience: `https://api.disaster-direct.com`
- Click "Refresh JWKS"

**4. Update Frontend Login**:
```typescript
// client/src/lib/auth.ts
login() {
  window.location.href = `https://${AUTH0_DOMAIN}/authorize?...`;
}
```

### Clerk

**1. Install Clerk SDK**:
```bash
npm install @clerk/clerk-react
```

**2. Wrap App with ClerkProvider**:
```typescript
import { ClerkProvider } from '@clerk/clerk-react';

<ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
  <App />
</ClerkProvider>
```

**3. Configure in Admin Panel**:
- Issuer: `https://your-clerk-instance.clerk.accounts.dev/`
- Audience: Your API identifier
- Refresh JWKS

**4. Use Clerk Hooks**:
```typescript
import { useAuth } from '@clerk/clerk-react';
const { getToken } = useAuth();
const token = await getToken();
```

### Supabase

**1. Install Supabase Client**:
```bash
npm install @supabase/supabase-js
```

**2. Initialize Supabase**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**3. Configure in Admin Panel**:
- Issuer: `https://your-project.supabase.co/auth/v1/`
- Audience: Your API identifier
- Refresh JWKS

**4. Get User Token**:
```typescript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

## 🧪 Testing

### Development Mode (Enforce OFF)

```bash
# 1. Visit /admin/oidc
# 2. Set Enforce = OFF
# 3. Visit /auth/login
# 4. Create demo JWT
# 5. All requests work without verification
```

### Production Mode (Enforce ON)

```bash
# 1. Configure real identity provider (Auth0/Clerk/Supabase)
# 2. Set Issuer and Audience in /admin/oidc
# 3. Click "Refresh JWKS"
# 4. Set Enforce = ON
# 5. Test with real OAuth flow
# 6. Invalid/missing tokens return 401
```

### Manual JWKS Test

```bash
# POST custom JWKS
curl -X POST http://localhost:5000/api/admin/oidc/jwks \
  -H "Content-Type: application/json" \
  -H "X-User-Role: admin" \
  -d '{
    "jwks": {
      "keys": [
        {
          "kty": "RSA",
          "use": "sig",
          "kid": "test-key-1",
          "n": "...",
          "e": "AQAB",
          "alg": "RS256"
        }
      ]
    }
  }'
```

## 🔧 Advanced Configuration

### Custom Claims Mapping

Edit `server/middleware/jwtVerification.ts`:

```typescript
// Extract role from custom claim
const role = (claims.role || claims.app_role || claims['https://myapp/role'] || '').toLowerCase();

// Extract user ID from custom claim  
const user_id = claims.sub || claims.user_id || claims.email || '';
```

### Algorithm Whitelist

Supported algorithms can be restricted:

```typescript
const supportedAlgs = ['RS256', 'RS384', 'RS512'];  // RSA only
```

### Token Expiration

The `jsonwebtoken` library automatically validates `exp` claim. No additional configuration needed.

### Custom Scopes

```typescript
// Extract scopes from JWT
const scopes = claims.scope?.split(' ') || [];
req.auth = { role, user_id, scopes };
```

## 🛡️ Security Best Practices

### ✅ DO

1. **Always use HTTPS in production**
2. **Rotate JWKS regularly** (click "Refresh JWKS" monthly)
3. **Enable enforcement** (`enforce = true`) in production
4. **Use short-lived tokens** (15-30 minutes)
5. **Implement refresh token flow** for long sessions
6. **Validate audience** to prevent token reuse across APIs

### ❌ DON'T

1. **Never deploy with `enforce = false`** to production
2. **Never expose JWKS private keys** (only public keys in JWKS)
3. **Never accept tokens without verification** in production
4. **Never hardcode secrets** in code
5. **Never trust client-side JWT decoding** for authorization
6. **Never skip audience validation**

## 📊 Monitoring & Debugging

### Check OIDC Configuration

```bash
curl http://localhost:5000/api/admin/oidc \
  -H "X-User-Role: admin"
```

Response:
```json
{
  "oidc": {
    "issuer": "https://your-tenant.auth0.com/",
    "audience": "https://api.disaster-direct.com",
    "enforce": true,
    "jwks_keys": 2
  }
}
```

### Debug JWT Claims

```typescript
// In browser console
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `401: Token verification failed` | Invalid signature | Refresh JWKS or check issuer/audience |
| `401: Signing key not found` | Missing `kid` in JWKS | Upload correct JWKS or disable `kid` matching |
| `Unsupported algorithm: HS256` | HMAC algorithms not allowed | Use RS/ES/PS algorithms only |
| `OIDC/JWKS not configured` | Missing settings | Configure issuer/audience/JWKS |

## 📁 File Structure

```
server/
├── middleware/
│   ├── auth.ts                    # Legacy + new auth middleware
│   └── jwtVerification.ts         # JWKS verification logic
├── routes/
│   └── adminOidc.ts               # OIDC configuration API
└── storage.ts                      # OIDC settings persistence

client/
├── src/
│   ├── lib/
│   │   ├── auth.ts                # JWT decoding & storage
│   │   └── api.ts                 # Bearer token injection
│   └── pages/
│       ├── auth/
│       │   ├── Login.tsx          # Demo login page
│       │   └── Callback.tsx       # OAuth callback
│       └── admin/
│           └── OIDCSettings.tsx   # OIDC admin panel
```

## 🔄 Migration Path

### From Development to Production

**Step 1**: Configure Identity Provider
- Sign up for Auth0/Clerk/Supabase
- Create API/Application
- Note issuer and audience

**Step 2**: Update Environment
```env
VITE_AUTH_PROVIDER=auth0  # or clerk, supabase
# Add provider-specific vars
```

**Step 3**: Configure OIDC in Admin Panel
- Visit `/admin/oidc`
- Set issuer and audience
- Refresh JWKS
- **Enable enforcement**

**Step 4**: Update Frontend
- Implement real OAuth login flow
- Replace demo JWT generation
- Handle OAuth callback

**Step 5**: Test End-to-End
- Complete OAuth flow
- Verify JWT signature
- Test protected routes
- Confirm 401 on invalid tokens

## 📞 Support & Troubleshooting

For issues related to:
- **Auth0**: https://auth0.com/docs
- **Clerk**: https://clerk.com/docs  
- **Supabase**: https://supabase.com/docs/guides/auth
- **JWKS Spec**: https://datatracker.ietf.org/doc/html/rfc7517

---

**🎉 Your JWT verification system is now production-ready!**

Enable enforcement, configure your identity provider, and deploy with confidence.
