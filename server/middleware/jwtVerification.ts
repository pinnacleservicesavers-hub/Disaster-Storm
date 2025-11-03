import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';

/**
 * JWT Claims structure
 */
interface JWTClaims {
  role?: string;
  app_role?: string;
  sub?: string;
  user_id?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  [key: string]: any;
}

/**
 * JWKS Key structure
 */
interface JWKSKey {
  kty: string;
  use?: string;
  alg?: string;
  kid?: string;
  n?: string;
  e?: string;
  x?: string;
  y?: string;
  crv?: string;
  [key: string]: any;
}

/**
 * Convert JWK to PEM format for RSA keys
 */
function jwkToPem(jwk: JWKSKey): string {
  if (jwk.kty === 'RSA') {
    if (!jwk.n || !jwk.e) {
      throw new Error('Invalid RSA JWK: missing n or e');
    }
    
    // For RSA keys, we need to use a library or convert manually
    // For simplicity, we'll use the jsonwebtoken library's built-in support
    // by returning the JWK itself and letting the library handle it
    return JSON.stringify(jwk);
  }
  
  if (jwk.kty === 'EC') {
    // For EC keys, return JWK format
    return JSON.stringify(jwk);
  }
  
  throw new Error(`Unsupported key type: ${jwk.kty}`);
}

/**
 * Select appropriate key from JWKS based on kid
 */
function selectKey(jwks: { keys: JWKSKey[] }, kid?: string): JWKSKey | null {
  if (!jwks || !jwks.keys || jwks.keys.length === 0) {
    return null;
  }
  
  // If kid is provided, find matching key
  if (kid) {
    const key = jwks.keys.find(k => k.kid === kid);
    if (key) return key;
  }
  
  // Fallback to first key
  return jwks.keys[0];
}

/**
 * Parse JWT without verification (for development mode)
 */
function parseUnverified(token: string): JWTClaims {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      return {};
    }
    return decoded.payload as JWTClaims;
  } catch {
    return {};
  }
}

/**
 * Verify JWT with JWKS
 */
async function verifyWithJWKS(token: string, settings: any): Promise<JWTClaims> {
  const { issuer, audience, jwks } = settings;
  
  if (!issuer || !audience || !jwks) {
    throw new Error('OIDC/JWKS not configured');
  }
  
  // Decode header to get kid
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === 'string') {
    throw new Error('Invalid token format');
  }
  
  const header = decoded.header;
  const kid = header.kid;
  const alg = header.alg || 'RS256';
  
  // Validate algorithm
  const supportedAlgs = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'PS256', 'PS384', 'PS512'];
  if (!supportedAlgs.includes(alg)) {
    throw new Error(`Unsupported algorithm: ${alg}`);
  }
  
  // Select key
  const key = selectKey(jwks, kid);
  if (!key) {
    throw new Error('Signing key not found');
  }
  
  // Convert JWK to PEM or use directly
  const secret = jwkToPem(key);
  
  // Verify token
  try {
    const verified = jwt.verify(token, secret, {
      algorithms: [alg as jwt.Algorithm],
      audience,
      issuer,
      complete: false
    }) as JWTClaims;
    
    return verified;
  } catch (error: any) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

/**
 * Extract authentication context from request
 * Supports both JWT verification and legacy headers
 */
export async function extractAuthContextWithVerification(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authz = req.headers.authorization || '';
  let token = '';
  
  if (authz.toLowerCase().startsWith('bearer ')) {
    token = authz.split(' ', 2)[1]?.trim();
  }
  
  // Get OIDC settings
  const settings = await storage.getOIDCSettings();
  const enforce = Boolean(settings.enforce);
  
  let role = 'contractor';
  let user_id = 'demo-contractor';
  const scopes: string[] = [];
  
  // Process token if present
  if (token) {
    try {
      const claims = enforce 
        ? await verifyWithJWKS(token, settings)
        : parseUnverified(token);
      
      if (claims.role || claims.app_role) {
        role = (claims.role || claims.app_role || '').toLowerCase();
      }
      if (claims.sub || claims.user_id) {
        user_id = claims.sub || claims.user_id || '';
      }
    } catch (error: any) {
      if (enforce) {
        return res.status(401).json({ error: `Token verification failed: ${error.message}` });
      }
      // In non-enforce mode, continue without verified claims
    }
  }
  
  // Fallback to legacy headers if not enforcing or no token
  if (!token || !enforce) {
    const roleHeader = (req.headers['x-user-role'] as string || '').toLowerCase();
    const userHeader = (req.headers['x-user-id'] as string || '');
    const scopesHeader = (req.headers['x-scopes'] as string || '');
    
    if (roleHeader) role = roleHeader;
    if (userHeader) user_id = userHeader;
    if (scopesHeader) {
      scopes.push(...scopesHeader.split(',').map(s => s.trim()).filter(Boolean));
    }
  }
  
  // Set auth context on request
  (req as any).auth = { role, user_id, scopes };
  
  next();
}
