
# Storm Disaster — Auth + API Headers

This drop wires a token-aware flow **end-to-end**:

- **Frontend** stores a JWT in `localStorage.token` (demo-only).
- **Backend** reads `Authorization: Bearer <jwt>` and extracts claims **without verifying** to set `role` and `user_id` in the request context. (Replace with proper verification in prod.)

## Quickstart

1. Run the backend (FastAPI) and frontend (Next.js). Set `NEXT_PUBLIC_API_BASE` in the frontend env to your backend URL (e.g., `http://localhost:8000`).  
2. Visit `/auth/login` and click **Continue** to create a demo token.  
3. Use the portals (Admin, Contractor, Homeowner). Requests will include both:
   - `Authorization: Bearer <token>`
   - `X-User-Role` / `X-User-Id` as a fallback.

## Swapping to a real provider

- Set `NEXT_PUBLIC_AUTH_PROVIDER` to `auth0`/`clerk`/`supabase` and implement the redirect in `auth.login()` + token capture in `/auth/callback`.  
- On the **backend**, replace the decoder in `app/utils/security.py` with a **verified** JWT check using your IdP's public keys (JWKS).

## Security note

This build intentionally **does not verify** JWT signatures — it's for local testing only. Do not deploy without proper verification and session handling.
