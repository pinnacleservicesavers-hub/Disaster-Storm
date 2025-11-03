import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { extractAuthContext, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * GET /api/admin/oidc
 * Get current OIDC configuration (redacted JWKS)
 */
router.get('/api/admin/oidc', extractAuthContext, requireAdmin, async (req: Request, res: Response) => {
  try {
    const settings = await storage.getOIDCSettings();
    
    // Redact JWKS from response, just show count
    const redacted: any = {
      issuer: settings.issuer,
      audience: settings.audience,
      enforce: settings.enforce
    };
    
    if (settings.jwks && settings.jwks.keys) {
      redacted.jwks_keys = settings.jwks.keys.length;
    } else {
      redacted.jwks_keys = 0;
    }
    
    res.json({ oidc: redacted });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/oidc
 * Update OIDC configuration
 */
router.post('/api/admin/oidc', extractAuthContext, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { issuer, audience, enforce } = req.body;
    
    if (!issuer || !audience) {
      return res.status(400).json({ error: 'Issuer and audience are required' });
    }
    
    const settings = {
      issuer: issuer.toString().replace(/\/$/, ''), // Remove trailing slash
      audience: audience.toString(),
      enforce: Boolean(enforce)
    };
    
    await storage.setOIDCSettings(settings);
    
    res.json({ ok: true, oidc: settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/oidc/refresh_jwks
 * Fetch JWKS from issuer's well-known endpoint
 */
router.post('/api/admin/oidc/refresh_jwks', extractAuthContext, requireAdmin, async (req: Request, res: Response) => {
  try {
    const settings = await storage.getOIDCSettings();
    const issuer = settings.issuer;
    
    if (!issuer) {
      return res.status(400).json({ ok: false, error: 'OIDC issuer not set' });
    }
    
    const url = `${issuer.replace(/\/$/, '')}/.well-known/jwks.json`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: HTTP ${response.status}`);
    }
    
    const jwks = await response.json();
    
    // Validate JWKS structure
    if (!jwks.keys || !Array.isArray(jwks.keys)) {
      throw new Error('Invalid JWKS format: missing keys array');
    }
    
    // Update settings with JWKS
    await storage.setOIDCSettings({ jwks });
    
    res.json({ ok: true, keys: jwks.keys.length });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/admin/oidc/jwks
 * Manually upload JWKS
 */
router.post('/api/admin/oidc/jwks', extractAuthContext, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { jwks } = req.body;
    
    if (!jwks || !jwks.keys || !Array.isArray(jwks.keys)) {
      return res.status(400).json({ error: 'Invalid JWKS format: must include keys array' });
    }
    
    await storage.setOIDCSettings({ jwks });
    
    res.json({ ok: true, keys: jwks.keys.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
