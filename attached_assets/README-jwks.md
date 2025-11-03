
# JWT Verification with JWKS (Auth0/Clerk/Supabase-ready)

This adds **verified** JWT support using JWKS and PyJWT.

## Backend setup

1. Install deps:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. Start FastAPI (example):
   ```bash
   uvicorn backend.app.main:app --reload --port 8000
   ```

3. In the Admin UI go to **/admin/oidc** and set:
   - **Issuer**: your identity provider domain (e.g., `https://YOUR_TENANT.us.auth0.com/`)
   - **Audience**: your API identifier
   - **Enforce**: ON to require valid tokens

4. Click **Refresh JWKS** to cache signing keys.

> Alternatively, POST your JWKS to `/admin/oidc/jwks`.

## Verification behavior

- If **enforce** = ON:
  - Incoming requests must include `Authorization: Bearer <jwt>`.
  - The token is verified (signature + `iss` + `aud`) against cached JWKS.
  - Role and user id are taken from claims (`role`/`app_role`, `sub`).

- If **enforce** = OFF:
  - Token is parsed **without** verification.
  - Headers (`X-User-Role` / `X-User-Id`) can still override for dev/demo.

## Frontend

- API calls send `Authorization: Bearer <token>` automatically if a token is present.
- Use `/auth/login` (demo) to create a local token. Replace with real provider flows later.
