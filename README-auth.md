# Disaster Direct — JWT Authentication

This implementation provides a **JWT-aware authentication system** with both frontend and backend components.

## Overview

- **Frontend** stores a JWT in `localStorage.token` (demo-only for development)
- **Backend** reads `Authorization: Bearer <jwt>` and extracts claims **without signature verification** (dev only)
- **Pluggable** architecture ready for Auth0, Clerk, or Supabase integration

## Quick Start

1. **Run the application**
   ```bash
   npm run dev
   ```

2. **Visit `/auth/login`**
   - Create a demo JWT token
   - Choose your role (admin/contractor/homeowner)
   - Enter a user ID
   - Click "Continue to Platform"

3. **Use the platform**
   - All API requests automatically include:
     - `Authorization: Bearer <token>` header
     - `X-User-Role` and `X-User-Id` headers (fallback)

## Architecture

### Frontend Components

**Auth Adapter** (`client/src/lib/auth.ts`)
- `auth.getSession()` - Reads JWT from localStorage and decodes claims
- `auth.setSession(session)` - Stores session data and JWT token
- `auth.clear()` - Clears all auth data
- `auth.login()` - Redirects to login page (or OAuth provider)

**API Client** (`client/src/lib/api.ts`)
- Automatically attaches `Authorization: Bearer <token>` to all requests
- Falls back to `X-User-*` headers for backwards compatibility

**Pages**
- `/auth/login` - Demo login with JWT generation
- `/auth/callback` - OAuth callback handler (captures `?token=` or `#id_token=`)
- `/signout` - Clears session and redirects home

**TopNav Component**
- Shows "Login" button when no token present
- Shows role selector, user field, and "Logout" when authenticated

### Backend Middleware

**Auth Middleware** (`server/middleware/auth.ts`)
- `extractAuthContext()` - Extracts role/user from JWT or headers
- `requireAdmin()` - Enforces admin-only access
- `requireContractor()` - Enforces contractor or admin access

**JWT Decoding**
- Base64URL decoding of JWT payload
- Extracts `sub`, `role`, `app_role` claims
- **WARNING**: Does NOT verify signature (dev/demo only)

## Switching to Real OAuth Provider

### Option 1: Auth0

1. **Set environment variable**
   ```env
   VITE_AUTH_PROVIDER=auth0
   VITE_AUTH0_DOMAIN=your-tenant.auth0.com
   VITE_AUTH0_CLIENT_ID=your-client-id
   ```

2. **Update auth.login()**
   ```typescript
   login() {
     window.location.href = `https://${AUTH0_DOMAIN}/authorize?...`;
   }
   ```

3. **Update callback handler** to parse Auth0 response

4. **Backend: Add JWT verification**
   ```typescript
   import jwksClient from 'jwks-rsa';
   import jwt from 'jsonwebtoken';
   
   // Verify signature using Auth0 public keys
   ```

### Option 2: Clerk

1. **Install Clerk SDK**
   ```bash
   npm install @clerk/clerk-react
   ```

2. **Wrap app with ClerkProvider**

3. **Use Clerk's hooks** (`useUser`, `useAuth`)

4. **Backend**: Verify Clerk session tokens

### Option 3: Supabase

1. **Install Supabase client**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Use Supabase Auth**
   ```typescript
   const { data, error } = await supabase.auth.signInWithOAuth({
     provider: 'google'
   });
   ```

3. **Backend**: Verify Supabase JWTs

## Security Considerations

### ⚠️ Development Mode (Current)

- **No signature verification** - JWTs are decoded but not validated
- **Suitable for**: Local development, demos, testing
- **NOT suitable for**: Production, sensitive data, real users

### ✅ Production Requirements

1. **JWT Signature Verification**
   - Fetch JWKS from your IdP
   - Validate `iss`, `aud`, `exp` claims
   - Verify signature using public key

2. **HTTPS Only**
   - Always use HTTPS in production
   - Set `secure` flag on cookies

3. **Token Rotation**
   - Implement refresh token flow
   - Short-lived access tokens (15min)
   - Long-lived refresh tokens (7 days)

4. **CSRF Protection**
   - Use SameSite cookies
   - Implement CSRF tokens for state-changing operations

## Testing the Flow

1. **Without Token (Guest)**
   - Visit homepage → See "Login" button
   - Try accessing protected routes → Redirected or blocked

2. **With Token (Authenticated)**
   - Login at `/auth/login`
   - See role selector and user field
   - Access all portals based on role permissions

3. **Logout**
   - Click "Logout" → Clears token
   - Redirected to sign-out page
   - Back to guest state

## File Structure

```
client/
├── src/
│   ├── lib/
│   │   ├── auth.ts          # Auth adapter with JWT support
│   │   └── api.ts           # API client with Bearer tokens
│   ├── components/
│   │   ├── TopNav.tsx       # Shows Login/Logout based on token
│   │   └── Breadcrumbs.tsx  # Navigation breadcrumbs
│   └── pages/
│       ├── auth/
│       │   ├── Login.tsx    # Demo login page
│       │   └── Callback.tsx # OAuth callback handler
│       └── SignOut.tsx      # Logout confirmation

server/
└── middleware/
    └── auth.ts              # JWT extraction & role enforcement
```

## Next Steps

1. **Add proper JWT verification** in backend middleware
2. **Implement refresh token flow** for long-lived sessions
3. **Add OAuth provider** (Auth0, Clerk, or Supabase)
4. **Secure API endpoints** with role-based middleware
5. **Add CSRF protection** for state-changing operations

## Support

For questions or issues, refer to:
- Auth0 docs: https://auth0.com/docs
- Clerk docs: https://clerk.com/docs
- Supabase docs: https://supabase.com/docs/guides/auth
