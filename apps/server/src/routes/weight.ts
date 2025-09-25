import { Router } from 'express';
import { db } from '../../../../server/db.js';
import { speciesCoeffs } from '../../../../shared/schema.js';
import { eq } from 'drizzle-orm';

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

  try {
    const result = await db.select().from(speciesCoeffs).where(eq(speciesCoeffs.species, species));
    if (!result[0]) return res.status(404).json({ ok:false, error:'unknown species' });
    
    const coeffs = result[0];
    const { densityLbft3, a, b, c, commonName } = coeffs;

    // (A) Cylinder volume * density
    // DBH inches -> radius feet -> cross-section area ft^2
    const radiusFt = (dbhIn / 12) / 2;
    const areaFt2 = Math.PI * radiusFt * radiusFt;
    const volumeFt3 = areaFt2 * Number(lengthFt);
    const massA = volumeFt3 * Number(densityLbft3); // lb

    // (B) Allometric estimate
    const massB = Number(a) * Math.pow(Number(dbhIn), Number(b)) * Math.pow(Number(lengthFt), Number(c));

    return res.json({
      ok: true,
      species,
      commonName,
      inputs: { dbhIn: Number(dbhIn), lengthFt: Number(lengthFt) },
      density_lbft3: Number(densityLbft3),
      methods: {
        cylinder_volume: { volumeFt3, weightLb: massA },
        allometric: { a: Number(a), b: Number(b), c: Number(c), weightLb: massB }
      },
      disclaimer: 'Engineering estimate only. Verify before use.'
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'Database query failed' });
  }
});