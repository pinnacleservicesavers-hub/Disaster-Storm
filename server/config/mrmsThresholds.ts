export interface MRMSThreshold {
  peril: 'hail' | 'precipitation' | 'wind' | 'lightning';
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  value: number;
  unit: string;
  description: string;
  color: string;
}

export interface MRMSConfig {
  enabled: boolean;
  fetchIntervalMinutes: number;
  retryAttempts: number;
  retryBackoffMs: number;
  thresholds: MRMSThreshold[];
  serviceAreas: ServiceArea[];
}

export interface ServiceArea {
  id: string;
  name: string;
  type: 'county' | 'zip' | 'polygon';
  geometry?: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][];
  };
  counties?: string[]; // FIPS codes
  zipCodes?: string[];
  state: string;
}

export const DEFAULT_MRMS_CONFIG: MRMSConfig = {
  enabled: true,
  fetchIntervalMinutes: 15,
  retryAttempts: 3,
  retryBackoffMs: 5000,
  thresholds: [
    // Hail
    {
      peril: 'hail',
      severity: 'minor',
      value: 0.75,
      unit: 'inches',
      description: 'Pea to marble size hail',
      color: '#ffff00'
    },
    {
      peril: 'hail',
      severity: 'moderate',
      value: 1.0,
      unit: 'inches',
      description: 'Quarter size hail',
      color: '#ffcc00'
    },
    {
      peril: 'hail',
      severity: 'severe',
      value: 1.5,
      unit: 'inches',
      description: 'Ping pong ball size hail',
      color: '#ff6600'
    },
    {
      peril: 'hail',
      severity: 'extreme',
      value: 2.0,
      unit: 'inches',
      description: 'Golf ball+ size hail',
      color: '#ff0000'
    },
    // Precipitation
    {
      peril: 'precipitation',
      severity: 'minor',
      value: 1.0,
      unit: 'inches/hour',
      description: 'Heavy rain',
      color: '#00ccff'
    },
    {
      peril: 'precipitation',
      severity: 'moderate',
      value: 2.0,
      unit: 'inches/hour',
      description: 'Intense rain, flash flood risk',
      color: '#0099ff'
    },
    {
      peril: 'precipitation',
      severity: 'severe',
      value: 3.0,
      unit: 'inches/hour',
      description: 'Extreme rain, high flash flood risk',
      color: '#0066ff'
    },
    {
      peril: 'precipitation',
      severity: 'extreme',
      value: 4.0,
      unit: 'inches/hour',
      description: 'Catastrophic rainfall',
      color: '#0033ff'
    },
    // Wind
    {
      peril: 'wind',
      severity: 'minor',
      value: 40,
      unit: 'mph',
      description: 'Damaging winds',
      color: '#cccccc'
    },
    {
      peril: 'wind',
      severity: 'moderate',
      value: 58,
      unit: 'mph',
      description: 'Destructive winds',
      color: '#999999'
    },
    {
      peril: 'wind',
      severity: 'severe',
      value: 75,
      unit: 'mph',
      description: 'Hurricane-force winds',
      color: '#666666'
    },
    {
      peril: 'wind',
      severity: 'extreme',
      value: 100,
      unit: 'mph',
      description: 'Extreme winds',
      color: '#333333'
    },
    // Lightning
    {
      peril: 'lightning',
      severity: 'minor',
      value: 10,
      unit: 'strikes/km²/hour',
      description: 'Scattered lightning',
      color: '#ffff99'
    },
    {
      peril: 'lightning',
      severity: 'moderate',
      value: 25,
      unit: 'strikes/km²/hour',
      description: 'Frequent lightning',
      color: '#ffcc66'
    },
    {
      peril: 'lightning',
      severity: 'severe',
      value: 50,
      unit: 'strikes/km²/hour',
      description: 'Intense lightning',
      color: '#ff9933'
    },
    {
      peril: 'lightning',
      severity: 'extreme',
      value: 100,
      unit: 'strikes/km²/hour',
      description: 'Extreme lightning activity',
      color: '#ff6600'
    }
  ],
  serviceAreas: [
    {
      id: 'miami-dade',
      name: 'Miami-Dade County',
      type: 'county',
      counties: ['12086'], // FIPS code for Miami-Dade
      state: 'FL'
    },
    {
      id: 'broward',
      name: 'Broward County',
      type: 'county',
      counties: ['12011'],
      state: 'FL'
    },
    {
      id: 'palm-beach',
      name: 'Palm Beach County',
      type: 'county',
      counties: ['12099'],
      state: 'FL'
    },
    {
      id: 'houston-metro',
      name: 'Houston Metro Area',
      type: 'county',
      counties: ['48201', '48157', '48039', '48167', '48339'], // Harris, Fort Bend, Brazoria, Galveston, Montgomery
      state: 'TX'
    }
  ]
};

export function getMRMSConfig(): MRMSConfig {
  return DEFAULT_MRMS_CONFIG;
}

export function updateMRMSConfig(updates: Partial<MRMSConfig>): MRMSConfig {
  Object.assign(DEFAULT_MRMS_CONFIG, updates);
  return DEFAULT_MRMS_CONFIG;
}

export function getThresholdsForPeril(peril: MRMSThreshold['peril']): MRMSThreshold[] {
  return DEFAULT_MRMS_CONFIG.thresholds.filter(t => t.peril === peril);
}

export function getSeverityForValue(peril: MRMSThreshold['peril'], value: number): MRMSThreshold['severity'] {
  const thresholds = getThresholdsForPeril(peril).sort((a, b) => b.value - a.value);
  
  for (const threshold of thresholds) {
    if (value >= threshold.value) {
      return threshold.severity;
    }
  }
  
  return 'minor';
}

export function isInServiceArea(latitude: number, longitude: number, area: ServiceArea): boolean {
  // For polygon-based areas, would need point-in-polygon check
  // For now, simplified county/zip based matching will be handled externally
  return true;
}
