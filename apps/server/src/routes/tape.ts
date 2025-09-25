import { Router } from 'express';
import sharp from 'sharp';

export const router = Router();

/*
POST /api/tape/overlay
Body: {
  imageBase64: "data:image/jpeg;base64,...",
  x1: number, y1: number,
  x2: number, y2: number,
  // Either provide a known scale OR provide realInches for calibration
  scalePxPerInch?: number,
  realInches?: number,
  label?: string,                // optional custom label
  color?: string                 // 'yellow', '#00ffcc', etc.
}
Returns: PNG with overlay + measurement numbers.
*/
router.post('/overlay', async (req, res) => {
  try {
    const { imageBase64, x1, y1, x2, y2, scalePxPerInch, realInches, color = 'yellow', label } = req.body || {};
    if (!imageBase64) return res.status(400).json({ ok:false, error:'imageBase64 required' });
    if ([x1,y1,x2,y2].some(v => typeof v !== 'number')) return res.status(400).json({ ok:false, error:'x1,y1,x2,y2 required' });

    const base64 = String(imageBase64).split(',').pop();
    const input = Buffer.from(base64!, 'base64');

    const px = Math.hypot(Number(x2)-Number(x1), Number(y2)-Number(y1));
    const k = scalePxPerInch ? Number(scalePxPerInch) : (realInches ? px / Number(realInches) : undefined);
    if (!k) return res.status(400).json({ ok:false, error:'Provide scalePxPerInch or realInches for calibration' });
    const inches = px / k;

    const img = sharp(input);
    const meta = await img.metadata();
    const imgWidth = meta.width || 1000;
    const imgHeight = meta.height || 1000;

    // Build simple SVG overlay (just line + label)
    const midx = (x1+x2)/2; const midy = (y1+y2)/2;
    const textLabel = label || `${inches.toFixed(1)} in`;

    // Create SVG overlay
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${imgWidth}" height="${imgHeight}">
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="4" />
        <rect x="${Math.max(0, midx-40)}" y="${Math.max(0, midy-12)}" width="80" height="24" rx="4" ry="4" fill="black" fill-opacity="0.7" />
        <text x="${midx}" y="${midy+4}" fill="white" font-size="14" font-family="Arial, sans-serif" text-anchor="middle">${textLabel}</text>
      </svg>`);

    // Convert SVG to PNG first, then composite
    const svgImg = await sharp(svg).png().toBuffer();
    
    // Composite with svg overlay
    const out = await img
      .composite([{ input: svgImg, top: 0, left: 0 }])
      .png()
      .toBuffer();

    res.setHeader('Content-Type','image/png');
    res.setHeader('X-Measurement-Inches', inches.toFixed(2));
    res.send(out);
  } catch (e:any) {
    res.status(500).json({ ok:false, error: String(e.message||e) });
  }
});