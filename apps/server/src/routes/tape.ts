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

    // Build SVG overlay (line + ticks + label)
    // Basic tick spacing ~ every inch (scaled to px)
    const tickPx = Math.max(10, k); // at least 10px between ticks
    const len = px;
    const dx = (x2 - x1) / len;
    const dy = (y2 - y1) / len;

    const ticks: string[] = [];
    for (let s = 0; s <= len; s += tickPx) {
      const tx = x1 + dx * s;
      const ty = y1 + dy * s;
      const nx = -dy; const ny = dx; // normal
      const tlen = (s % (tickPx*12) === 0) ? 10 : 6; // foot-ish accent if k ~ px/in
      ticks.push(`<line x1="${tx - nx*tlen}" y1="${ty - ny*tlen}" x2="${tx + nx*tlen}" y2="${ty + ny*tlen}" stroke="${color}" stroke-width="2" />`);
    }

    const midx = (x1+x2)/2; const midy = (y1+y2)/2;
    const textLabel = label || `${inches.toFixed(1)} in`;

    const svg = Buffer.from(`<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 4000 4000" preserveAspectRatio="none">
        <g>
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="4" />
          ${ticks.join('\n')}
          <rect x="${midx-80}" y="${midy-26}" width="160" height="24" rx="6" ry="6" fill="black" fill-opacity="0.6" />
          <text x="${midx}" y="${midy-8}" fill="white" font-size="18" font-family="Arial" text-anchor="middle">${textLabel}</text>
        </g>
      </svg>`);

    const img = sharp(input);
    const meta = await img.metadata();

    // Composite with svg; use image size as canvas to avoid scaling issues
    const out = await img
      .composite([{ input: svg, gravity: 'northwest' }])
      .png()
      .toBuffer();

    res.setHeader('Content-Type','image/png');
    res.setHeader('X-Measurement-Inches', inches.toFixed(2));
    res.send(out);
  } catch (e:any) {
    res.status(500).json({ ok:false, error: String(e.message||e) });
  }
});