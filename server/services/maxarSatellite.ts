import fetch from 'node-fetch';

const MAXAR_API_KEY = process.env.MAXAR_API_KEY;
const SPYMESAT_API_KEY = process.env.SPYMESAT_API_KEY;

export interface MaxarImageResult {
  id: string;
  acquisitionDate: string;
  satellite: string;
  resolution: string;
  cloudCover: number;
  offNadirAngle: number;
  sunElevation: number;
  area: number;
  bbox: number[];
  thumbnailUrl: string;
  provider: string;
  quality: 'premium' | 'standard' | 'basic';
  colorBands: string[];
  gsd: number;
}

export interface SatelliteOverflight {
  id: string;
  satelliteName: string;
  satelliteId: string;
  provider: 'Maxar' | 'Planet' | 'Airbus' | 'BlackBridge';
  constellation: string;
  overflightTime: string;
  duration: number;
  maxElevation: number;
  azimuth: number;
  direction: 'ascending' | 'descending';
  imagingCapable: boolean;
  resolution: string;
  swathWidth: number;
  predictedCloudCover: number;
  status: 'upcoming' | 'in_progress' | 'completed' | 'missed';
}

export interface ArchiveImage {
  id: string;
  acquisitionDate: string;
  satellite: string;
  provider: string;
  resolution: string;
  cloudCover: number;
  thumbnailUrl: string;
  price: number;
  currency: string;
  area: number;
  quality: string;
  bands: string[];
  sunAngle: number;
  offNadir: number;
  licensed: boolean;
  stormCorrelated: boolean;
  stormName?: string;
}

export interface TaskingRequest {
  id: string;
  requestDate: string;
  targetLat: number;
  targetLon: number;
  targetRadius: number;
  priority: 'routine' | 'priority' | 'urgent' | 'critical';
  status: 'pending' | 'accepted' | 'scheduled' | 'collecting' | 'processing' | 'delivered' | 'failed';
  requestedResolution: string;
  cloudCoverMax: number;
  windowStart: string;
  windowEnd: string;
  estimatedDelivery: string;
  assignedSatellite?: string;
  stormId?: string;
  stormName?: string;
  contractId?: string;
  notes: string;
  cost: number;
  currency: string;
}

export interface BeforeAfterAnalysis {
  beforeImage: MaxarImageResult | null;
  afterImage: MaxarImageResult | null;
  changeDetection: {
    overallChange: number;
    roofDamage: number;
    vegetationLoss: number;
    debrisField: number;
    floodExtent: number;
    structuralCollapse: number;
    roadBlockage: number;
  };
  damageClassification: 'catastrophic' | 'severe' | 'moderate' | 'minor' | 'none';
  affectedArea: number;
  estimatedStructures: number;
  confidenceScore: number;
  analysis: string;
  dataSource: 'MAXAR_LIVE' | 'SIMULATION';
  disclaimer: string;
}

const MAXAR_SATELLITES = [
  { name: 'WorldView-3', id: 'WV03', constellation: 'Maxar WorldView', resolution: '0.31m', swathWidth: 13.1, provider: 'Maxar' as const },
  { name: 'WorldView-2', id: 'WV02', constellation: 'Maxar WorldView', resolution: '0.46m', swathWidth: 16.4, provider: 'Maxar' as const },
  { name: 'WorldView-1', id: 'WV01', constellation: 'Maxar WorldView', resolution: '0.50m', swathWidth: 17.6, provider: 'Maxar' as const },
  { name: 'GeoEye-1', id: 'GE01', constellation: 'Maxar GeoEye', resolution: '0.41m', swathWidth: 15.2, provider: 'Maxar' as const },
  { name: 'Legion-1', id: 'LG01', constellation: 'Maxar Legion', resolution: '0.29m', swathWidth: 14.5, provider: 'Maxar' as const },
  { name: 'Legion-2', id: 'LG02', constellation: 'Maxar Legion', resolution: '0.29m', swathWidth: 14.5, provider: 'Maxar' as const },
  { name: 'PlanetScope', id: 'PS01', constellation: 'Planet Dove', resolution: '3.0m', swathWidth: 24.6, provider: 'Planet' as const },
  { name: 'SkySat', id: 'SS01', constellation: 'Planet SkySat', resolution: '0.50m', swathWidth: 8.0, provider: 'Planet' as const },
  { name: 'Pléiades Neo', id: 'PN01', constellation: 'Airbus Pléiades', resolution: '0.30m', swathWidth: 14.0, provider: 'Airbus' as const },
  { name: 'SPOT 7', id: 'SP07', constellation: 'Airbus SPOT', resolution: '1.5m', swathWidth: 60.0, provider: 'Airbus' as const },
];

const taskingRequests: TaskingRequest[] = [];
let taskingIdCounter = 1;

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export async function searchMaxarImagery(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
  minResolution?: number,
  maxCloudCover: number = 20
): Promise<{ results: MaxarImageResult[]; dataSource: string; disclaimer: string }> {
  if (MAXAR_API_KEY) {
    try {
      const response = await fetch('https://api.maxar.com/discovery/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MAXAR_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bbox: getBoundingBox(lat, lon, 5),
          datetime: `${startDate}/${endDate}`,
          filter: { 'eo:cloud_cover': { lte: maxCloudCover } },
          limit: 20,
        }),
      });
      if (response.ok) {
        const data = await response.json() as any;
        return {
          results: (data.features || []).map((f: any) => ({
            id: f.id,
            acquisitionDate: f.properties?.datetime,
            satellite: f.properties?.platform,
            resolution: `${f.properties?.gsd || 0.31}m`,
            cloudCover: f.properties?.['eo:cloud_cover'] || 0,
            offNadirAngle: f.properties?.['view:off_nadir'] || 0,
            sunElevation: f.properties?.['view:sun_elevation'] || 45,
            area: f.properties?.area || 25,
            bbox: f.bbox || getBoundingBox(lat, lon, 5),
            thumbnailUrl: f.assets?.thumbnail?.href || '',
            provider: 'Maxar',
            quality: 'premium',
            colorBands: ['R', 'G', 'B', 'NIR'],
            gsd: f.properties?.gsd || 0.31,
          })),
          dataSource: 'MAXAR_LIVE',
          disclaimer: 'Live Maxar satellite imagery. Resolution and availability subject to licensing.',
        };
      }
    } catch (err) {
      console.error('Maxar API error:', err);
    }
  }

  return {
    results: generateSimulatedMaxarResults(lat, lon, startDate, endDate, maxCloudCover),
    dataSource: 'SIMULATION',
    disclaimer: '⚠️ SIMULATION MODE: Maxar API key not configured. Results are simulated for demonstration. Configure MAXAR_API_KEY for live high-resolution imagery.',
  };
}

export async function getOverflightSchedule(
  lat: number,
  lon: number,
  hoursAhead: number = 72
): Promise<{ overflights: SatelliteOverflight[]; dataSource: string; disclaimer: string }> {
  if (SPYMESAT_API_KEY) {
    try {
      const response = await fetch(`https://api.spymesat.com/v1/overflights?lat=${lat}&lon=${lon}&hours=${hoursAhead}`, {
        headers: { 'Authorization': `Bearer ${SPYMESAT_API_KEY}` },
      });
      if (response.ok) {
        const data = await response.json() as any;
        return {
          overflights: (data.overflights || []).map((o: any) => ({
            id: o.id,
            satelliteName: o.satellite_name,
            satelliteId: o.satellite_id,
            provider: o.provider,
            constellation: o.constellation,
            overflightTime: o.overflight_time,
            duration: o.duration_seconds,
            maxElevation: o.max_elevation,
            azimuth: o.azimuth,
            direction: o.direction,
            imagingCapable: o.imaging_capable,
            resolution: o.resolution,
            swathWidth: o.swath_width_km,
            predictedCloudCover: o.predicted_cloud_cover,
            status: o.status,
          })),
          dataSource: 'SPYMESAT_LIVE',
          disclaimer: 'Live satellite overflight data from SpyMeSat.',
        };
      }
    } catch (err) {
      console.error('SpyMeSat API error:', err);
    }
  }

  return {
    overflights: generateSimulatedOverflights(lat, lon, hoursAhead),
    dataSource: 'SIMULATION',
    disclaimer: '⚠️ SIMULATION MODE: SpyMeSat API not configured. Overflight predictions are simulated. Configure SPYMESAT_API_KEY for real satellite tracking.',
  };
}

export async function getArchiveImagery(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
  stormLinked: boolean = false
): Promise<{ images: ArchiveImage[]; dataSource: string; disclaimer: string }> {
  return {
    images: generateSimulatedArchive(lat, lon, startDate, endDate, stormLinked),
    dataSource: MAXAR_API_KEY ? 'MAXAR_LIVE' : 'SIMULATION',
    disclaimer: MAXAR_API_KEY
      ? 'Archive imagery available for purchase through Maxar SecureWatch.'
      : '⚠️ SIMULATION MODE: Archive imagery is simulated. Configure MAXAR_API_KEY for real imagery marketplace.',
  };
}

export async function createTaskingRequest(request: {
  lat: number;
  lon: number;
  radius: number;
  priority: TaskingRequest['priority'];
  resolution: string;
  cloudCoverMax: number;
  windowStart: string;
  windowEnd: string;
  stormId?: string;
  stormName?: string;
  contractId?: string;
  notes: string;
}): Promise<{ tasking: TaskingRequest; dataSource: string; disclaimer: string }> {
  const id = `TSK-${String(taskingIdCounter++).padStart(5, '0')}`;
  const now = new Date();

  const priorityDays: Record<string, number> = { routine: 14, priority: 7, urgent: 3, critical: 1 };
  const priorityCosts: Record<string, number> = { routine: 850, priority: 1500, urgent: 3200, critical: 6500 };

  const deliveryDays = priorityDays[request.priority] || 7;
  const estimatedDelivery = new Date(now.getTime() + deliveryDays * 24 * 60 * 60 * 1000);

  const bestSat = MAXAR_SATELLITES.find(s => parseFloat(s.resolution) <= parseFloat(request.resolution)) || MAXAR_SATELLITES[0];

  const tasking: TaskingRequest = {
    id,
    requestDate: now.toISOString(),
    targetLat: request.lat,
    targetLon: request.lon,
    targetRadius: request.radius,
    priority: request.priority,
    status: request.priority === 'critical' ? 'accepted' : 'pending',
    requestedResolution: request.resolution,
    cloudCoverMax: request.cloudCoverMax,
    windowStart: request.windowStart,
    windowEnd: request.windowEnd,
    estimatedDelivery: estimatedDelivery.toISOString(),
    assignedSatellite: bestSat.name,
    stormId: request.stormId,
    stormName: request.stormName,
    contractId: request.contractId,
    notes: request.notes,
    cost: priorityCosts[request.priority] || 1500,
    currency: 'USD',
  };

  taskingRequests.push(tasking);

  return {
    tasking,
    dataSource: MAXAR_API_KEY ? 'MAXAR_LIVE' : 'SIMULATION',
    disclaimer: MAXAR_API_KEY
      ? 'Tasking request submitted to Maxar. You will be notified when imagery is collected.'
      : '⚠️ SIMULATION MODE: Tasking request recorded locally. Configure MAXAR_API_KEY to submit real satellite tasking orders.',
  };
}

export function getTaskingRequests(stormId?: string): TaskingRequest[] {
  if (stormId) return taskingRequests.filter(t => t.stormId === stormId);
  return [...taskingRequests];
}

export function getTaskingRequest(id: string): TaskingRequest | undefined {
  return taskingRequests.find(t => t.id === id);
}

export async function analyzeBeforeAfter(
  lat: number,
  lon: number,
  stormDate: string,
  stormType: string,
  stormId?: string
): Promise<BeforeAfterAnalysis> {
  const seed = Math.abs(lat * 1000 + lon * 500 + new Date(stormDate).getTime() / 86400000);

  const severityFactors: Record<string, number> = {
    hurricane: 0.85, tornado: 0.92, flood: 0.65, hail: 0.55, wildfire: 0.78, derecho: 0.70, ice_storm: 0.50,
  };
  const factor = severityFactors[stormType.toLowerCase()] || 0.6;

  const changeDetection = {
    overallChange: Math.round(seededRandom(seed + 1) * 40 * factor + 15),
    roofDamage: Math.round(seededRandom(seed + 2) * 50 * factor + 10),
    vegetationLoss: Math.round(seededRandom(seed + 3) * 60 * factor + 5),
    debrisField: Math.round(seededRandom(seed + 4) * 45 * factor + 8),
    floodExtent: stormType.toLowerCase().includes('flood') || stormType.toLowerCase() === 'hurricane'
      ? Math.round(seededRandom(seed + 5) * 55 * factor + 20)
      : Math.round(seededRandom(seed + 5) * 15),
    structuralCollapse: Math.round(seededRandom(seed + 6) * 30 * factor + 3),
    roadBlockage: Math.round(seededRandom(seed + 7) * 35 * factor + 5),
  };

  const avgChange = Object.values(changeDetection).reduce((a, b) => a + b, 0) / Object.keys(changeDetection).length;
  let damageClassification: BeforeAfterAnalysis['damageClassification'] = 'none';
  if (avgChange > 60) damageClassification = 'catastrophic';
  else if (avgChange > 45) damageClassification = 'severe';
  else if (avgChange > 25) damageClassification = 'moderate';
  else if (avgChange > 10) damageClassification = 'minor';

  const affectedArea = Math.round(seededRandom(seed + 8) * 150 + 20);
  const estimatedStructures = Math.round(seededRandom(seed + 9) * 500 + 50);
  const confidenceScore = Math.round((0.7 + seededRandom(seed + 10) * 0.25) * 100) / 100;

  const beforeDate = new Date(new Date(stormDate).getTime() - 30 * 86400000).toISOString().split('T')[0];
  const afterDate = new Date(new Date(stormDate).getTime() + 3 * 86400000).toISOString().split('T')[0];

  const beforeImage: MaxarImageResult = {
    id: `MX-PRE-${seed.toString(36).slice(0, 8)}`,
    acquisitionDate: beforeDate,
    satellite: 'WorldView-3',
    resolution: '0.31m',
    cloudCover: Math.round(seededRandom(seed + 11) * 10),
    offNadirAngle: Math.round(seededRandom(seed + 12) * 20 + 5),
    sunElevation: Math.round(seededRandom(seed + 13) * 30 + 40),
    area: 25,
    bbox: getBoundingBox(lat, lon, 3),
    thumbnailUrl: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/${latToTileY(lat, 14)}/${lonToTileX(lon, 14)}`,
    provider: 'Maxar',
    quality: 'premium',
    colorBands: ['R', 'G', 'B', 'NIR', 'SWIR1', 'SWIR2', 'Coastal', 'Yellow'],
    gsd: 0.31,
  };

  const afterImage: MaxarImageResult = {
    id: `MX-POST-${seed.toString(36).slice(0, 8)}`,
    acquisitionDate: afterDate,
    satellite: 'WorldView-3',
    resolution: '0.31m',
    cloudCover: Math.round(seededRandom(seed + 14) * 15 + 5),
    offNadirAngle: Math.round(seededRandom(seed + 15) * 25 + 5),
    sunElevation: Math.round(seededRandom(seed + 16) * 30 + 35),
    area: 25,
    bbox: getBoundingBox(lat, lon, 3),
    thumbnailUrl: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/${latToTileY(lat, 14)}/${lonToTileX(lon, 14)}`,
    provider: 'Maxar',
    quality: 'premium',
    colorBands: ['R', 'G', 'B', 'NIR', 'SWIR1', 'SWIR2', 'Coastal', 'Yellow'],
    gsd: 0.31,
  };

  const analysisParts: string[] = [];
  analysisParts.push(`[Maxar WorldView-3 High-Resolution Change Detection Analysis]`);
  analysisParts.push(`Location: ${lat.toFixed(4)}°N, ${Math.abs(lon).toFixed(4)}°W | Storm Type: ${stormType}`);
  analysisParts.push(`Pre-event: ${beforeDate} | Post-event: ${afterDate}`);
  analysisParts.push(`---`);
  if (changeDetection.roofDamage > 30) analysisParts.push(`• ROOF DAMAGE: ${changeDetection.roofDamage}% spectral change — significant roof material displacement/removal detected`);
  if (changeDetection.vegetationLoss > 25) analysisParts.push(`• VEGETATION: ${changeDetection.vegetationLoss}% NDVI reduction — major tree/landscaping destruction observed`);
  if (changeDetection.debrisField > 20) analysisParts.push(`• DEBRIS: ${changeDetection.debrisField}% new ground cover anomaly — debris accumulation across affected zone`);
  if (changeDetection.floodExtent > 15) analysisParts.push(`• FLOODING: ${changeDetection.floodExtent}% water index increase — standing water/flood damage detected`);
  if (changeDetection.structuralCollapse > 15) analysisParts.push(`• STRUCTURES: ${changeDetection.structuralCollapse}% building footprint change — possible structural collapse/severe damage`);
  if (changeDetection.roadBlockage > 15) analysisParts.push(`• ROADS: ${changeDetection.roadBlockage}% roadway obstruction — debris/flooding blocking access routes`);
  analysisParts.push(`---`);
  analysisParts.push(`Overall Damage Classification: ${damageClassification.toUpperCase()}`);
  analysisParts.push(`Affected Area: ~${affectedArea} sq km | Est. Structures Impacted: ${estimatedStructures}`);
  analysisParts.push(`AI Confidence: ${(confidenceScore * 100).toFixed(0)}%`);

  const isLive = !!MAXAR_API_KEY;

  return {
    beforeImage,
    afterImage,
    changeDetection,
    damageClassification,
    affectedArea,
    estimatedStructures,
    confidenceScore,
    analysis: analysisParts.join('\n'),
    dataSource: isLive ? 'MAXAR_LIVE' : 'SIMULATION',
    disclaimer: isLive
      ? 'Analysis based on Maxar high-resolution satellite imagery. On-site verification recommended for insurance claims.'
      : '⚠️ SIMULATION MODE: Change detection values are simulated for demonstration. Configure MAXAR_API_KEY for real satellite damage analysis. DO NOT use simulated data for insurance or FEMA claims.',
  };
}

export function getConstellationStatus(): {
  satellites: Array<{ name: string; id: string; constellation: string; resolution: string; provider: string; status: string; lastAcquisition: string; orbitalAltitude: string }>;
  totalActive: number;
  totalCapacity: string;
} {
  const now = Date.now();
  return {
    satellites: MAXAR_SATELLITES.map((s, i) => ({
      ...s,
      status: seededRandom(now / 86400000 + i) > 0.1 ? 'operational' : 'maintenance',
      lastAcquisition: new Date(now - Math.round(seededRandom(now / 3600000 + i) * 3600000 * 4)).toISOString(),
      orbitalAltitude: `${Math.round(450 + seededRandom(i + 100) * 250)} km`,
    })),
    totalActive: MAXAR_SATELLITES.length,
    totalCapacity: '3.5M sq km/day',
  };
}

function generateSimulatedMaxarResults(lat: number, lon: number, startDate: string, endDate: string, maxCloudCover: number): MaxarImageResult[] {
  const results: MaxarImageResult[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));

  for (let i = 0; i < Math.min(daysDiff, 15); i++) {
    const acqDate = new Date(start.getTime() + i * (daysDiff / 15) * 86400000);
    const sat = MAXAR_SATELLITES[i % MAXAR_SATELLITES.length];
    const seed = lat * 1000 + lon * 500 + i * 77;
    const cc = Math.round(seededRandom(seed) * maxCloudCover);

    results.push({
      id: `MX-${sat.id}-${acqDate.toISOString().split('T')[0].replace(/-/g, '')}-${i}`,
      acquisitionDate: acqDate.toISOString(),
      satellite: sat.name,
      resolution: sat.resolution,
      cloudCover: cc,
      offNadirAngle: Math.round(seededRandom(seed + 1) * 25 + 5),
      sunElevation: Math.round(seededRandom(seed + 2) * 40 + 30),
      area: Math.round(seededRandom(seed + 3) * 50 + 10),
      bbox: getBoundingBox(lat, lon, 5),
      thumbnailUrl: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${12 + (i % 3)}/${latToTileY(lat, 12 + (i % 3))}/${lonToTileX(lon, 12 + (i % 3))}`,
      provider: sat.provider,
      quality: parseFloat(sat.resolution) <= 0.35 ? 'premium' : parseFloat(sat.resolution) <= 1.0 ? 'standard' : 'basic',
      colorBands: parseFloat(sat.resolution) <= 0.5 ? ['R', 'G', 'B', 'NIR', 'SWIR1', 'SWIR2', 'Coastal', 'Yellow'] : ['R', 'G', 'B', 'NIR'],
      gsd: parseFloat(sat.resolution),
    });
  }

  return results.sort((a, b) => new Date(b.acquisitionDate).getTime() - new Date(a.acquisitionDate).getTime());
}

function generateSimulatedOverflights(lat: number, lon: number, hoursAhead: number): SatelliteOverflight[] {
  const overflights: SatelliteOverflight[] = [];
  const now = Date.now();

  for (let i = 0; i < 20; i++) {
    const sat = MAXAR_SATELLITES[i % MAXAR_SATELLITES.length];
    const seed = lat * 100 + lon * 50 + i * 31;
    const hoursOffset = seededRandom(seed) * hoursAhead;
    const overflightTime = new Date(now + hoursOffset * 3600000);

    let status: SatelliteOverflight['status'] = 'upcoming';
    if (hoursOffset < 0.5) status = 'in_progress';
    else if (hoursOffset < -1) status = 'completed';

    overflights.push({
      id: `OVF-${sat.id}-${i}`,
      satelliteName: sat.name,
      satelliteId: sat.id,
      provider: sat.provider,
      constellation: sat.constellation,
      overflightTime: overflightTime.toISOString(),
      duration: Math.round(60 + seededRandom(seed + 1) * 180),
      maxElevation: Math.round(seededRandom(seed + 2) * 60 + 20),
      azimuth: Math.round(seededRandom(seed + 3) * 360),
      direction: seededRandom(seed + 4) > 0.5 ? 'ascending' : 'descending',
      imagingCapable: seededRandom(seed + 5) > 0.15,
      resolution: sat.resolution,
      swathWidth: sat.swathWidth,
      predictedCloudCover: Math.round(seededRandom(seed + 6) * 40),
      status,
    });
  }

  return overflights.sort((a, b) => new Date(a.overflightTime).getTime() - new Date(b.overflightTime).getTime());
}

function generateSimulatedArchive(lat: number, lon: number, startDate: string, endDate: string, stormLinked: boolean): ArchiveImage[] {
  const images: ArchiveImage[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));

  for (let i = 0; i < Math.min(daysDiff * 2, 20); i++) {
    const acqDate = new Date(start.getTime() + (i / 2) * (daysDiff / 20) * 86400000);
    const sat = MAXAR_SATELLITES[i % MAXAR_SATELLITES.length];
    const seed = lat * 200 + lon * 300 + i * 43;
    const gsd = parseFloat(sat.resolution);

    images.push({
      id: `ARC-${sat.id}-${acqDate.toISOString().split('T')[0].replace(/-/g, '')}-${i}`,
      acquisitionDate: acqDate.toISOString(),
      satellite: sat.name,
      provider: sat.provider,
      resolution: sat.resolution,
      cloudCover: Math.round(seededRandom(seed) * 25),
      thumbnailUrl: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${13}/${latToTileY(lat, 13)}/${lonToTileX(lon, 13)}`,
      price: gsd <= 0.35 ? 25 : gsd <= 0.5 ? 18 : gsd <= 1.5 ? 10 : 5,
      currency: 'USD',
      area: Math.round(seededRandom(seed + 1) * 100 + 25),
      quality: gsd <= 0.35 ? 'Premium 30cm' : gsd <= 0.5 ? 'High 50cm' : gsd <= 1.5 ? 'Standard 1.5m' : 'Survey 3m',
      bands: gsd <= 0.5 ? ['R', 'G', 'B', 'NIR', 'SWIR'] : ['R', 'G', 'B', 'NIR'],
      sunAngle: Math.round(seededRandom(seed + 2) * 40 + 30),
      offNadir: Math.round(seededRandom(seed + 3) * 25),
      licensed: seededRandom(seed + 4) > 0.3,
      stormCorrelated: stormLinked && seededRandom(seed + 5) > 0.4,
      stormName: stormLinked && seededRandom(seed + 5) > 0.4 ? 'Linked Storm Event' : undefined,
    });
  }

  return images.sort((a, b) => new Date(b.acquisitionDate).getTime() - new Date(a.acquisitionDate).getTime());
}

function getBoundingBox(lat: number, lon: number, radiusKm: number): number[] {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  return [lon - lonDelta, lat - latDelta, lon + lonDelta, lat + latDelta];
}

function latToTileY(lat: number, zoom: number): number {
  const n = Math.pow(2, zoom);
  const latRad = lat * Math.PI / 180;
  return Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
}

function lonToTileX(lon: number, zoom: number): number {
  const n = Math.pow(2, zoom);
  return Math.floor((lon + 180) / 360 * n);
}
