import { Router, Request, Response } from 'express';
import { deploymentIntelligence } from '../services/deploymentIntelligence.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/deployment/analyze-image
 * Analyze uploaded image for damage and create deployment opportunity
 */
router.post('/analyze-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const source = (req.body.source as 'traffic_cam' | 'satellite' | 'aerial' | 'manual_upload') || 'manual_upload';
    
    console.log(`📸 Analyzing image for deployment (${source}), size: ${req.file.size} bytes`);
    
    const opportunity = await deploymentIntelligence.analyzeImageForDeployment(
      req.file.buffer,
      source
    );
    
    if (!opportunity) {
      return res.json({
        success: false,
        message: 'No damage detected or unable to identify location'
      });
    }
    
    res.json({
      success: true,
      opportunity
    });
    
  } catch (error) {
    console.error('❌ Error analyzing image:', error);
    res.status(500).json({
      error: 'Failed to analyze image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/deployment/property-intel
 * Get comprehensive property intelligence for an address
 */
router.get('/property-intel', async (req: Request, res: Response) => {
  try {
    const { address } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Address parameter is required' });
    }
    
    console.log(`🏠 Getting property intelligence for: ${address}`);
    
    const intel = await deploymentIntelligence.getPropertyIntelligence(address);
    
    res.json({
      success: true,
      address,
      ...intel
    });
    
  } catch (error) {
    console.error('❌ Error getting property intelligence:', error);
    res.status(500).json({
      error: 'Failed to get property intelligence',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/deployment/scan-area
 * Scan geographic area for damage opportunities using satellite data
 */
router.post('/scan-area', async (req: Request, res: Response) => {
  try {
    const { state, city, bounds } = req.body;
    
    if (!state) {
      return res.status(400).json({ error: 'State parameter is required' });
    }
    
    console.log(`🛰️ Scanning area for damage: ${city ? city + ', ' : ''}${state}`);
    
    const opportunities = await deploymentIntelligence.scanAreaForDamage(state, city, bounds);
    
    // Group by deployment zones
    const zones = deploymentIntelligence.groupByDeploymentZones(opportunities);
    
    res.json({
      success: true,
      totalOpportunities: opportunities.length,
      zones,
      opportunities
    });
    
  } catch (error) {
    console.error('❌ Error scanning area:', error);
    res.status(500).json({
      error: 'Failed to scan area',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/deployment/opportunities
 * Get all current deployment opportunities (mock data for demo)
 */
router.get('/opportunities', async (req: Request, res: Response) => {
  try {
    const { state, city, zip } = req.query;
    
    console.log('📊 Fetching deployment opportunities...');
    
    // Mock data for demonstration
    const mockOpportunities = [
      {
        id: 'deploy-001',
        timestamp: new Date(),
        location: {
          state: 'Florida',
          city: 'Miami',
          zip: '33101',
          street: '123 Biscayne Blvd',
          fullAddress: '123 Biscayne Blvd, Miami, FL 33101',
          coordinates: { lat: 25.7617, lng: -80.1918 }
        },
        damage: {
          type: ['roof_damage', 'siding_damage'],
          severity: 'moderate' as const,
          confidence: 87,
          estimatedCost: { min: 8500, max: 15000 },
          description: 'Wind damage to roof shingles and siding, likely from recent storm',
          affectedAreas: ['Roof (northwest corner)', 'East-facing siding']
        },
        propertyOwner: {
          name: 'John Smith',
          phone: '(305) 555-0123',
          email: 'john.smith@email.com',
          insuranceCompany: 'State Farm',
          claimNumber: 'SF-2024-12345'
        },
        contractorIntel: {
          profitabilityScore: 8.5,
          urgency: 'high' as const,
          contractorTypesNeeded: ['Roofing', 'Siding'],
          estimatedResponseTime: '2-6 hours',
          competitionLevel: 'medium' as const,
          leadPriority: 'high' as const
        },
        sources: {
          imagery: 'satellite' as const,
          damageDetection: 'ai_vision' as const,
          propertyData: 'database' as const
        }
      },
      {
        id: 'deploy-002',
        timestamp: new Date(),
        location: {
          state: 'Florida',
          city: 'Miami',
          zip: '33125',
          street: '456 SW 8th Street',
          fullAddress: '456 SW 8th Street, Miami, FL 33125',
          coordinates: { lat: 25.7657, lng: -80.2089 }
        },
        damage: {
          type: ['tree_on_vehicle', 'driveway_damage'],
          severity: 'severe' as const,
          confidence: 92,
          estimatedCost: { min: 12000, max: 25000 },
          description: 'Large oak tree fallen on parked vehicle, driveway blocked with debris',
          affectedAreas: ['Vehicle (totaled)', 'Driveway (cracked concrete)', 'Front yard landscaping']
        },
        propertyOwner: {
          name: 'Maria Garcia',
          phone: '(305) 555-0456',
          email: 'maria.garcia@email.com',
          insuranceCompany: 'Allstate',
          claimNumber: 'AL-2024-67890'
        },
        contractorIntel: {
          profitabilityScore: 9.2,
          urgency: 'emergency' as const,
          contractorTypesNeeded: ['Tree Service', 'Concrete/Paving', 'Debris Removal'],
          estimatedResponseTime: '< 2 hours',
          competitionLevel: 'low' as const,
          leadPriority: 'critical' as const
        },
        sources: {
          imagery: 'traffic_cam' as const,
          damageDetection: 'ai_vision' as const,
          propertyData: 'database' as const
        }
      },
      {
        id: 'deploy-003',
        timestamp: new Date(),
        location: {
          state: 'Alabama',
          city: 'Birmingham',
          zip: '35203',
          street: '789 20th Street N',
          fullAddress: '789 20th Street N, Birmingham, AL 35203',
          coordinates: { lat: 33.5186, lng: -86.8104 }
        },
        damage: {
          type: ['window_damage', 'structure_damage'],
          severity: 'moderate' as const,
          confidence: 81,
          estimatedCost: { min: 6500, max: 12000 },
          description: 'Multiple broken windows from hail, minor structural damage to porch',
          affectedAreas: ['Windows (6 broken)', 'Front porch overhang']
        },
        propertyOwner: {
          name: 'Robert Johnson',
          phone: '(205) 555-0789',
          email: 'rob.johnson@email.com',
          insuranceCompany: 'Farmers Insurance'
        },
        contractorIntel: {
          profitabilityScore: 7.3,
          urgency: 'high' as const,
          contractorTypesNeeded: ['Window Installation', 'Carpentry'],
          estimatedResponseTime: '2-6 hours',
          competitionLevel: 'medium' as const,
          leadPriority: 'medium' as const
        },
        sources: {
          imagery: 'satellite' as const,
          damageDetection: 'ai_vision' as const,
          propertyData: 'database' as const
        }
      }
    ];
    
    // Filter by query parameters
    let filtered = mockOpportunities;
    if (state) {
      filtered = filtered.filter(o => o.location.state.toLowerCase() === (state as string).toLowerCase());
    }
    if (city) {
      filtered = filtered.filter(o => o.location.city.toLowerCase() === (city as string).toLowerCase());
    }
    if (zip) {
      filtered = filtered.filter(o => o.location.zip === zip);
    }
    
    const zones = deploymentIntelligence.groupByDeploymentZones(filtered);
    
    res.json({
      success: true,
      totalOpportunities: filtered.length,
      zones,
      opportunities: filtered
    });
    
  } catch (error) {
    console.error('❌ Error fetching opportunities:', error);
    res.status(500).json({
      error: 'Failed to fetch opportunities',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
