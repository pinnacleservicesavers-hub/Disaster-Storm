import { Router } from 'express';
import { pool } from '../../../../server/db.js';

export const router = Router();

/*
POST /api/weight/estimate
Body: { species: 'southern_live_oak', dbhIn: 28, lengthFt: 12 }
Returns both methods:
- volume*density (cylindrical)
- species allometric a*DBH^b*L^c
*/
router.post('/estimate', async (req, res) => {
  const { species, dbhIn, lengthFt } = req.body || {};
  if (!species || !dbhIn || !lengthFt) return res.status(400).json({ ok:false, error:'species, dbhIn, lengthFt required' });

  const r = await pool.query('select * from species_coeffs where species=$1', [species]);
  if (!r.rows[0]) return res.status(404).json({ ok:false, error:'unknown species' });
  const { density_lbft3, a, b, c, common_name } = r.rows[0];

  // (A) Cylinder volume * density
  // DBH inches -> radius feet -> cross-section area ft^2
  const radiusFt = (dbhIn / 12) / 2;
  const areaFt2 = Math.PI * radiusFt * radiusFt;
  const volumeFt3 = areaFt2 * Number(lengthFt);
  const massA = volumeFt3 * Number(density_lbft3); // lb

  // (B) Allometric estimate
  const massB = Number(a) * Math.pow(Number(dbhIn), Number(b)) * Math.pow(Number(lengthFt), Number(c));

  return res.json({
    ok: true,
    species,
    commonName: common_name,
    inputs: { dbhIn: Number(dbhIn), lengthFt: Number(lengthFt) },
    density_lbft3: Number(density_lbft3),
    methods: {
      cylinder_volume: { volumeFt3, weightLb: massA },
      allometric: { a: Number(a), b: Number(b), c: Number(c), weightLb: massB }
    },
    disclaimer: 'Engineering estimate only. Verify before use.'
  });
});