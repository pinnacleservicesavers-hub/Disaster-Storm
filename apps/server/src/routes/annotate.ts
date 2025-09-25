import { Router } from 'express';
import { createHash } from 'crypto';

const router = Router();

// Add circle annotation
router.post('/circle', async (req, res) => {
  try {
    const { mediaId, x, y, r, label } = req.body;
    
    const annotation = {
      id: createHash('sha256').update(`${mediaId}_${x}_${y}_${r}_${Date.now()}`).digest('hex').substring(0, 16),
      mediaId,
      type: 'circle',
      x,
      y,
      r,
      label,
      timestamp: new Date().toISOString()
    };
    
    res.json({ success: true, annotation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create circle annotation' });
  }
});

// Add arrow annotation
router.post('/arrow', async (req, res) => {
  try {
    const { mediaId, x1, y1, x2, y2, label } = req.body;
    
    const annotation = {
      id: createHash('sha256').update(`${mediaId}_${x1}_${y1}_${x2}_${y2}_${Date.now()}`).digest('hex').substring(0, 16),
      mediaId,
      type: 'arrow',
      x1,
      y1,
      x2,
      y2,
      label,
      timestamp: new Date().toISOString()
    };
    
    res.json({ success: true, annotation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create arrow annotation' });
  }
});

// Add text annotation
router.post('/text', async (req, res) => {
  try {
    const { mediaId, x, y, text } = req.body;
    
    const annotation = {
      id: createHash('sha256').update(`${mediaId}_${x}_${y}_${text}_${Date.now()}`).digest('hex').substring(0, 16),
      mediaId,
      type: 'text',
      x,
      y,
      text,
      timestamp: new Date().toISOString()
    };
    
    res.json({ success: true, annotation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create text annotation' });
  }
});

// Add blur annotation
router.post('/blur', async (req, res) => {
  try {
    const { mediaId, x, y, w, h } = req.body;
    
    const annotation = {
      id: createHash('sha256').update(`${mediaId}_${x}_${y}_${w}_${h}_${Date.now()}`).digest('hex').substring(0, 16),
      mediaId,
      type: 'blur',
      x,
      y,
      w,
      h,
      timestamp: new Date().toISOString()
    };
    
    res.json({ success: true, annotation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create blur annotation' });
  }
});

export default router;