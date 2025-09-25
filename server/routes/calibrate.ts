import { Router } from 'express';
import jsQR from 'jsqr';
import { Jimp } from 'jimp';

export const router = Router();

/*
POST /api/calibrate/qr
Body: {
  imageBase64: "data:image/jpeg;base64,...",
  knownSizeMm?: number  // default 25mm for standard QR codes
}
Returns: {
  ok: true,
  qrFound: boolean,
  pixelsPerInch?: number,
  qrData?: string,
  corners?: [{x,y}, {x,y}, {x,y}, {x,y}],
  message: string
}
*/
router.post('/qr', async (req, res) => {
  try {
    const { imageBase64, knownSizeMm = 25 } = req.body || {};
    if (!imageBase64) return res.status(400).json({ ok: false, error: 'imageBase64 required' });

    const base64 = String(imageBase64).split(',').pop();
    const input = Buffer.from(base64!, 'base64');

    // Use Jimp to decode image and convert to ImageData format for jsQR
    const image = await Jimp.read(input);
    const { width, height } = image.bitmap;
    
    // Convert RGBA to Uint8ClampedArray for jsQR
    const imageData = {
      data: new Uint8ClampedArray(image.bitmap.data),
      width,
      height
    };

    // Detect QR code
    const code = jsQR(imageData.data, width, height);
    
    if (!code) {
      return res.json({
        ok: true,
        qrFound: false,
        message: 'No QR code detected. Ensure the QR code is clearly visible and well-lit.'
      });
    }

    // Calculate QR code physical size in pixels
    const topLeft = code.location.topLeftCorner;
    const topRight = code.location.topRightCorner;
    const bottomLeft = code.location.bottomLeftCorner;
    
    // Calculate average side length in pixels
    const topSidePx = Math.hypot(topRight.x - topLeft.x, topRight.y - topLeft.y);
    const leftSidePx = Math.hypot(bottomLeft.x - topLeft.x, bottomLeft.y - topLeft.y);
    const avgSidePx = (topSidePx + leftSidePx) / 2;

    // Convert known size from mm to inches (25.4mm = 1 inch)
    const knownSizeInches = knownSizeMm / 25.4;
    const pixelsPerInch = avgSidePx / knownSizeInches;

    return res.json({
      ok: true,
      qrFound: true,
      pixelsPerInch: Math.round(pixelsPerInch * 100) / 100, // Round to 2 decimal places
      qrData: code.data,
      corners: [
        { x: topLeft.x, y: topLeft.y },
        { x: topRight.x, y: topRight.y },
        { x: code.location.bottomRightCorner.x, y: code.location.bottomRightCorner.y },
        { x: bottomLeft.x, y: bottomLeft.y }
      ],
      knownSizeMm,
      calculatedSizePx: Math.round(avgSidePx * 100) / 100,
      message: `QR code detected! Calculated ${Math.round(pixelsPerInch)} pixels per inch.`
    });

  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

/*
POST /api/calibrate/apriltag
Body: {
  imageBase64: "data:image/jpeg;base64,...",
  knownSizeMm?: number,
  tagFamily?: string  // "tag16h5", "tag25h9", etc.
}
Returns: Similar to QR endpoint
Note: AprilTag detection is a stub for now - would need WASM module
*/
router.post('/apriltag', async (req, res) => {
  try {
    const { imageBase64, knownSizeMm = 25, tagFamily = 'tag16h5' } = req.body || {};
    if (!imageBase64) return res.status(400).json({ ok: false, error: 'imageBase64 required' });

    // AprilTag detection stub - in production would use apriltag WASM module
    return res.json({
      ok: true,
      tagFound: false,
      message: 'AprilTag detection not yet implemented. Use QR calibration for now.',
      suggestion: 'Generate a QR code with known dimensions for accurate calibration.'
    });

  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});