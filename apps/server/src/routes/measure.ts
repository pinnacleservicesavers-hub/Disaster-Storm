import { Router } from 'express';
export const router = Router();


router.post('/calibrate', (req, res) => {
const { mediaId, x1, y1, x2, y2, realInches } = req.body || {};
const px = Math.hypot((x2-x1),(y2-y1));
const scalePxPerInch = px / (realInches || 1);
res.json({ ok: true, scalePxPerInch });
});


router.post('/diameter', (req, res) => {
const { x1, y1, x2, y2, scalePxPerInch } = req.body || {};
const px = Math.hypot((x2-x1),(y2-y1));
const inches = scalePxPerInch ? (px / scalePxPerInch) : null;
res.json({ ok: true, inches, uncertaintyPct: 8 });
});