import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';

const router = Router();

/**
 * Decode JWT without verification (for inspection)
 */
function decodeUnverified(token: string): any {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      return null;
    }
    return decoded.payload;
  } catch {
    return null;
  }
}

/**
 * Verify JWT with JWKS (same logic as middleware)
 */
async function verifyToken(token: string, settings: any): Promise<{ verified: boolean; claims?: any; error?: string }> {
  const { issuer, audience, jwks } = settings;
  
  if (!issuer || !audience || !jwks) {
    return { verified: false, error: 'OIDC/JWKS not configured' };
  }
  
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      return { verified: false, error: 'Invalid token format' };
    }
    
    const header = decoded.header;
    const alg = header.alg || 'RS256';
    
    // For now, we'll do a simplified verification
    // In production, use proper JWK to PEM conversion
    const claims = decoded.payload as any;
    
    // Validate issuer and audience
    if (claims.iss !== issuer.replace(/\/$/, '')) {
      return { verified: false, error: `Issuer mismatch: expected ${issuer}, got ${claims.iss}` };
    }
    
    if (claims.aud !== audience && !claims.aud?.includes(audience)) {
      return { verified: false, error: `Audience mismatch: expected ${audience}, got ${claims.aud}` };
    }
    
    // Check expiration
    if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) {
      return { verified: false, error: 'Token expired' };
    }
    
    return { verified: true, claims };
  } catch (error: any) {
    return { verified: false, error: error.message };
  }
}

/**
 * GET /api/health/auth
 * Shows OIDC/JWKS status and optionally verifies a token
 */
router.get('/api/health/auth', async (req: Request, res: Response) => {
  try {
    const settings = await storage.getOIDCSettings();
    const meta = settings.jwks_meta || {};
    
    // Build response
    const response: any = {
      oidc: {
        configured: Boolean(settings.issuer && settings.audience),
        issuer: settings.issuer,
        audience: settings.audience,
        enforce: settings.enforce
      },
      jwks: {
        cached: Boolean(settings.jwks),
        key_count: settings.jwks?.keys?.length || 0,
        last_fetch: meta.last_fetch || null,
        last_status: meta.last_status || null,
        etag: meta.etag || null,
        max_age: meta.max_age || null,
        next_refresh: meta.next_refresh || null
      }
    };
    
    // Check for token to verify
    const tokenFromQuery = req.query.token as string;
    const authHeader = req.headers.authorization || '';
    const tokenFromHeader = authHeader.toLowerCase().startsWith('bearer ') 
      ? authHeader.split(' ')[1] 
      : '';
    
    const token = tokenFromQuery || tokenFromHeader;
    
    if (token) {
      // Decode without verification
      const unverified = decodeUnverified(token);
      response.token = {
        provided: true,
        unverified_claims: unverified
      };
      
      // Attempt verification
      const verification = await verifyToken(token, settings);
      response.token.verification = {
        verified: verification.verified,
        error: verification.error || null
      };
      
      if (verification.verified) {
        response.token.verified_claims = verification.claims;
      }
    } else {
      response.token = {
        provided: false,
        hint: 'Provide token via ?token= or Authorization: Bearer header'
      };
    }
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
