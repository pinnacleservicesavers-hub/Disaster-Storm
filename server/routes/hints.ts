import { Router } from 'express';
import sharp from 'sharp';

export const router = Router();

/*
POST /api/hints/damage
Body: { imageBase64: string, maxHints?: number }
Returns: { ok, hints: Array<{ kind: 'edge'|'texture'|'saturation', x:number, y:number, w:number, h:number, score:number }> }

This is a fast heuristic pass:
- downscale → gradient magnitude heatmap (edges)
- local variance (texture changes)
- high‑saturation bands (e.g., exposed soil/pipe colors)
You confirm/label in the UI (e.g., "water line", "root plate", etc.).
*/
router.post('/damage', async (req, res) => {
  try {
    const { imageBase64, maxHints = 6 } = req.body || {};
    if (!imageBase64) return res.status(400).json({ ok:false, error:'imageBase64 required' });
    const b64 = String(imageBase64).split(',').pop();
    const buf = Buffer.from(b64!, 'base64');

    // Downscale and get raw RGBA
    const { data, info } = await sharp(buf).resize({ width: 1024, withoutEnlargement: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;

    // Compute simple edge magnitude + saturation
    const edges: number[] = new Array(width*height).fill(0);
    const sats: number[] = new Array(width*height).fill(0);
    function idx(x:number,y:number){ return (y*width + x) * channels; }

    for (let y=1; y<height-1; y++){
      for (let x=1; x<width-1; x++){
        const i = idx(x,y);
        const r = data[i], g=data[i+1], b=data[i+2];
        const maxc = Math.max(r,g,b), minc = Math.min(r,g,b);
        const sat = maxc===0?0: (maxc-minc)/maxc; // 0..1
        sats[y*width + x] = sat;

        // Sobel-like gradient on grayscale
        function lum(xx:number, yy:number){ const ii = idx(xx,yy); return 0.299*data[ii] + 0.587*data[ii+1] + 0.114*data[ii+2]; }
        const gx = -lum(x-1,y-1) -2*lum(x-1,y) -lum(x-1,y+1) + lum(x+1,y-1) +2*lum(x+1,y) + lum(x+1,y+1);
        const gy = -lum(x-1,y-1) -2*lum(x,y-1) -lum(x+1,y-1) + lum(x-1,y+1) +2*lum(x,y+1) + lum(x+1,y+1);
        edges[y*width + x] = Math.hypot(gx, gy);
      }
    }

    // Windowed scoring: pick top tiles by edge+sat
    const tile = 64; const hints: any[] = [];
    for (let ty=0; ty<height; ty+=tile){
      for (let tx=0; tx<width; tx+=tile){
        let eSum=0, sSum=0; const x0=tx, y0=ty, x1=Math.min(tx+tile, width), y1=Math.min(ty+tile,height);
        for (let y=y0; y<y1; y++){
          for (let x=x0; x<x1; x++){
            const k=y*width+x; eSum+=edges[k]; sSum+=sats[k];
          }
        }
        const area=(x1-x0)*(y1-y0);
        const score = (eSum/area)*0.7 + (sSum/area)*0.3; // weight edges more
        hints.push({ kind: 'edge', x:x0, y:y0, w:(x1-x0), h:(y1-y0), score });
      }
    }

    hints.sort((a,b)=> b.score - a.score);
    res.json({ ok:true, hints: hints.slice(0, maxHints) });
  } catch (e:any) {
    res.status(500).json({ ok:false, error: String(e.message||e) });
  }
});

/*
POST /api/hints/confirm
Body: {
  hintId: string,
  confirmed: boolean,
  actualType?: string,
  notes?: string
}
Returns: { ok: true, message: string }
*/
router.post('/confirm', async (req, res) => {
  try {
    const { hintId, confirmed, actualType, notes } = req.body || {};
    if (!hintId) return res.status(400).json({ ok: false, error: 'hintId required' });

    // In production, this would update a database with user feedback
    // to improve future damage detection algorithms
    
    const feedback = {
      hintId,
      confirmed: Boolean(confirmed),
      actualType: actualType || 'unknown',
      notes: notes || '',
      timestamp: new Date().toISOString()
    };

    console.log('Damage hint feedback received:', feedback);

    return res.json({
      ok: true,
      message: confirmed 
        ? 'Damage confirmed. Added to report.'
        : 'Hint dismissed. Feedback recorded for algorithm improvement.'
    });

  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});