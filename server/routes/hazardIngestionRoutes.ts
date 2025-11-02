import express from 'express';
import type { Express, Request, Response } from 'express';
import { pool } from '../db';
import { NHCConeService } from '../services/nhc/nhcConeService';
import { MRMSContourService } from '../services/mrms/mrmsContourService';

export function registerHazardIngestionRoutes(app: Express) {
  /**
   * POST /api/ingest/nhc-cones
   * Manually trigger NHC cone/track ingestion
   */
  app.post('/api/ingest/nhc-cones', async (req: Request, res: Response) => {
    try {
      console.log('🌀 Manual NHC cone/track ingestion triggered');
      const nhcService = new NHCConeService(pool);
      
      await nhcService.ingestNHCCones();
      
      res.json({
        success: true,
        message: 'NHC cone/track ingestion completed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ NHC ingestion error:', error);
      res.status(500).json({
        error: 'Failed to ingest NHC cones/tracks',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/ingest/mrms-contours
   * Manually trigger MRMS contour processing
   * Body: { product: string, threshold: number, severity: string }
   */
  app.post('/api/ingest/mrms-contours', async (req: Request, res: Response) => {
    try {
      const { product, threshold, severity } = req.body;
      
      if (!product || threshold === undefined || !severity) {
        return res.status(400).json({
          error: 'Product, threshold, and severity are required',
          example: {
            product: 'MESHMax',
            threshold: 25.4,
            severity: 'Severe'
          }
        });
      }
      
      console.log(`📡 Manual MRMS ${product} ingestion triggered`);
      const mrmsService = new MRMSContourService(pool);
      
      await mrmsService.ingestMRMSContours(product, threshold, severity);
      
      res.json({
        success: true,
        message: `MRMS ${product} processing completed (stub mode)`,
        product,
        threshold,
        severity,
        note: 'Production implementation requires Python raster processing service',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ MRMS ingestion error:', error);
      res.status(500).json({
        error: 'Failed to ingest MRMS contours',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/ingest/run-all
   * Run all hazard ingestion tasks
   */
  app.post('/api/ingest/run-all', async (req: Request, res: Response) => {
    try {
      console.log('🚀 Running all hazard ingestion tasks');
      
      const results = {
        nhc: { success: false, message: '' },
        mrms: { success: false, message: '' }
      };
      
      // Run NHC ingestion
      try {
        const nhcService = new NHCConeService(pool);
        await nhcService.ingestNHCCones();
        results.nhc = { success: true, message: 'NHC cones/tracks ingested' };
      } catch (error) {
        results.nhc = { 
          success: false, 
          message: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
      
      // Run MRMS ingestion (hail - MESH product)
      try {
        const mrmsService = new MRMSContourService(pool);
        await mrmsService.ingestMRMSContours('MESHMax', 25.4, 'Severe'); // 1 inch hail
        results.mrms = { success: true, message: 'MRMS contours processed (stub mode)' };
      } catch (error) {
        results.mrms = { 
          success: false, 
          message: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
      
      res.json({
        success: true,
        message: 'All hazard ingestion tasks completed',
        results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Run-all ingestion error:', error);
      res.status(500).json({
        error: 'Failed to run all ingestion tasks',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log('🌀 Hazard ingestion routes registered - /api/ingest/nhc-cones, /api/ingest/mrms-contours, /api/ingest/run-all');
}
