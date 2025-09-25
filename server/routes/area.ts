import { Router } from 'express';
import sharp from 'sharp';

export const router = Router();

/*
POST /api/area/overlay
Body: {
  imageBase64: string,           // data URL of JPEG/PNG
  points: {x:number,y:number}[], // polygon in image pixel coords
  scalePxPerInch: number,        // calibration from QR
  color?: string,                // CSS color, e.g. 'gold' or '#ffd700'
  label?: string                 // optional custom label text
}
Returns: PNG with polygon overlay. Headers:
  X-Area-SqFt: numeric string (computed)
*/
router.post('/overlay', async (req, res) => {
  try {
    const { imageBase64, points = [], scalePxPerInch, color = '#ffd700', label } = req.body || {};
    if (!imageBase64) return res.status(400).json({ ok:false, error:'imageBase64 required' });
    if (!Array.isArray(points) || points.length < 3) return res.status(400).json({ ok:false, error:'points[] (>=3) required' });
    if (!scalePxPerInch) return res.status(400).json({ ok:false, error:'scalePxPerInch required' });

    const b64 = String(imageBase64).split(',').pop();
    const buf = Buffer.from(b64!, 'base64');

    // Compute area via shoelace in pixel^2 → in^2 → ft^2
    let sum = 0; 
    for (let i=0; i<points.length; i++){ 
      const a=points[i], b=points[(i+1)%points.length]; 
      sum += (a.x*b.y - b.x*a.y); 
    }
    const areaPx2 = Math.abs(sum)/2;
    const inchesPerPx = 1/Number(scalePxPerInch);
    const areaIn2 = areaPx2 * (inchesPerPx*inchesPerPx);
    const areaFt2 = areaIn2 / 144;

    // Build SVG overlay for polygon + label
    const pts = points.map(p=>`${p.x},${p.y}`).join(' ');
    const cx = points.reduce((s,p)=>s+p.x,0)/points.length; 
    const cy = points.reduce((s,p)=>s+p.y,0)/points.length;
    const text = label || `${areaFt2.toFixed(2)} sq ft`;
    const svg = Buffer.from(`<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 4000 4000" preserveAspectRatio="none">
        <polygon points="${pts}" fill="${color}33" stroke="${color}" stroke-width="4" />
        <rect x="${cx-80}" y="${cy-16}" width="160" height="26" rx="6" ry="6" fill="black" fill-opacity="0.6" />
        <text x="${cx}" y="${cy+3}" fill="white" font-size="18" font-family="Arial" text-anchor="middle">${text}</text>
      </svg>`);

    const out = await sharp(buf).composite([{ input: svg, gravity: 'northwest' }]).png().toBuffer();
    res.setHeader('Content-Type','image/png');
    res.setHeader('X-Area-SqFt', areaFt2.toFixed(4));
    res.send(out);
  } catch (e:any) {
    res.status(500).json({ ok:false, error: String(e.message||e) });
  }
});