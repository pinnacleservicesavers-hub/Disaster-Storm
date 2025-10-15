import { Express } from 'express';
import { withSignedParams } from '../helpers/signing.js';
import { requireRole } from '../middleware/bearerAuth.js';

const DEFAULT_TILE_TEMPLATE = '/api/impact/tiles/{z}/{x}/{y}.png';

export function mountSigner(app: Express) {
  // Single tile signer
  app.get('/api/sign/tile', requireRole('SIGNER'), (req, res) => {
  const { z, x, y, fmt = 'png', pollen = '1', grid = '6', scheme = 'viridis', ttl = '180' } = req.query || {};
  
  if (![z, x, y].every(Boolean)) {
    return res.status(400).json({ error: 'z, x, y required' });
  }

  const path = DEFAULT_TILE_TEMPLATE
    .replace('{z}', String(z))
    .replace('{x}', String(x))
    .replace('{y}', String(y))
    .replace('.png', `.${fmt}`);
  
  const params = new URLSearchParams({
    pollen: String(pollen),
    grid: String(grid),
    scheme: String(scheme),
    ttl: String(ttl)
  });
  
  const url = withSignedParams(path, params);
  res.json({ url });
});

  // Single legend signer
  app.get('/api/sign/legend', requireRole('SIGNER'), (req, res) => {
  const { scheme = 'viridis', width = '256', height = '48', bg = 'solid', fmt = 'png' } = req.query || {};
  
  const path = `/api/legend.${fmt}`;
  const params = new URLSearchParams({
    scheme: String(scheme),
    width: String(width),
    height: String(height),
    bg: String(bg)
  });
  
  const url = withSignedParams(path, params);
  res.json({ url });
});

  // Batch tile signer
  app.post('/api/sign/batch/tiles', requireRole('SIGNER'), (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [];
  
  if (!items.length) {
    return res.status(400).json({ error: 'Body must be a non-empty array' });
  }

  const out = items.map((it: any = {}) => {
    const { z, x, y, fmt = 'png', pollen = '1', grid = '6', scheme = 'viridis', ttl = '180' } = it;
    
    if (![z, x, y].every(v => Number.isFinite(Number(v)))) {
      return { error: 'z, x, y required' };
    }

    const path = DEFAULT_TILE_TEMPLATE
      .replace('{z}', String(z))
      .replace('{x}', String(x))
      .replace('{y}', String(y))
      .replace('.png', `.${fmt}`);
    
    const params = new URLSearchParams({
      pollen: String(pollen),
      grid: String(grid),
      scheme: String(scheme),
      ttl: String(ttl)
    });
    
    return {
      z: Number(z),
      x: Number(x),
      y: Number(y),
      url: withSignedParams(path, params)
    };
  });

  res.json({ items: out });
});

  // Batch legend signer
  app.post('/api/sign/batch/legend', requireRole('SIGNER'), (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [];
  
  if (!items.length) {
    return res.status(400).json({ error: 'Body must be a non-empty array' });
  }

  const out = items.map((it: any = {}) => {
    const { scheme = 'viridis', width = 256, height = 48, bg = 'solid', fmt = 'png', ttl = '180' } = it;
    
    const path = `/api/legend.${fmt}`;
    const params = new URLSearchParams({
      scheme: String(scheme),
      width: String(width),
      height: String(height),
      bg: String(bg),
      ttl: String(ttl)
    });
    
    return {
      scheme,
      width,
      height,
      url: withSignedParams(path, params)
    };
  });

  res.json({ items: out });
  });
}
