import { Router } from 'express';
import { mrmsProductionService } from '../services/mrms/MRMSProductionService.js';
import { getMRMSConfig, updateMRMSConfig, getThresholdsForPeril, type MRMSConfig } from '../config/mrmsThresholds.js';

const router = Router();

router.post('/ingest/mrms-production', async (req, res) => {
  try {
    console.log('[MRMS API] Starting production MRMS ingestion...');
    const results = await mrmsProductionService.processAllPerils();
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalContours: results.reduce((sum, r) => sum + r.contoursCreated, 0),
      totalSkipped: results.reduce((sum, r) => sum + r.contoursSkipped, 0),
      results,
      success: results.every(r => r.success)
    };
    
    res.json(summary);
  } catch (error) {
    console.error('[MRMS API] Ingestion failed:', error);
    res.status(500).json({ 
      error: 'MRMS ingestion failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/mrms/config', (req, res) => {
  try {
    const config = getMRMSConfig();
    res.json(config);
  } catch (error) {
    console.error('[MRMS API] Failed to get config:', error);
    res.status(500).json({ error: 'Failed to get MRMS configuration' });
  }
});

router.patch('/mrms/config', (req, res) => {
  try {
    const updates: Partial<MRMSConfig> = req.body;
    
    // Validate updates
    if (updates.fetchIntervalMinutes !== undefined && updates.fetchIntervalMinutes < 1) {
      return res.status(400).json({ error: 'Fetch interval must be at least 1 minute' });
    }
    
    if (updates.retryAttempts !== undefined && updates.retryAttempts < 1) {
      return res.status(400).json({ error: 'Retry attempts must be at least 1' });
    }
    
    const newConfig = updateMRMSConfig(updates);
    console.log('[MRMS API] Configuration updated:', updates);
    
    res.json({
      success: true,
      config: newConfig,
      message: 'MRMS configuration updated successfully'
    });
  } catch (error) {
    console.error('[MRMS API] Failed to update config:', error);
    res.status(500).json({ error: 'Failed to update MRMS configuration' });
  }
});

router.get('/mrms/thresholds/:peril', (req, res) => {
  try {
    const { peril } = req.params;
    
    if (!['hail', 'precipitation', 'wind', 'lightning'].includes(peril)) {
      return res.status(400).json({ error: 'Invalid peril. Must be: hail, precipitation, wind, or lightning' });
    }
    
    const thresholds = getThresholdsForPeril(peril as any);
    res.json(thresholds);
  } catch (error) {
    console.error('[MRMS API] Failed to get thresholds:', error);
    res.status(500).json({ error: 'Failed to get thresholds' });
  }
});

router.get('/mrms/stats', async (req, res) => {
  try {
    const stats = await mrmsProductionService.getProcessingStats();
    res.json(stats);
  } catch (error) {
    console.error('[MRMS API] Failed to get stats:', error);
    res.status(500).json({ error: 'Failed to get processing stats' });
  }
});

router.post('/mrms/trigger/:peril', async (req, res) => {
  try {
    const { peril } = req.params;
    
    if (!['hail', 'precipitation', 'wind', 'lightning'].includes(peril)) {
      return res.status(400).json({ error: 'Invalid peril. Must be: hail, precipitation, wind, or lightning' });
    }
    
    console.log(`[MRMS API] Manual trigger for ${peril}...`);
    const result = await mrmsProductionService.processAllPerils();
    const perilResult = result.find(r => r.peril === peril);
    
    res.json({
      success: perilResult?.success || false,
      result: perilResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[MRMS API] Failed to process ${req.params.peril}:`, error);
    res.status(500).json({ error: 'Failed to process peril' });
  }
});

export default router;
