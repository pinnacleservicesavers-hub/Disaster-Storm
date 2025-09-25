import { Router } from 'express';
import crypto from 'crypto';
export const router = Router();


router.post('/circle', (req, res) => {
const { mediaId, x, y, r, label } = req.body || {};
// TODO: persist annotation; return id
res.status(201).json({ ok: true, annotationId: crypto.randomUUID(), mediaId, x, y, r, label });
});