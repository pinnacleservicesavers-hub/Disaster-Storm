import { apiRequest } from "./queryClient";

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  alertType: string;
  areas: string[];
  startTime: Date;
  endTime?: Date;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface RadarData {
  timestamp: Date;
  layers: any[];
  coverage: any[];
}

export interface Claim {
  id: string;
  claimNumber: string;
  insuranceCompany: string;
  claimantName: string;
  propertyAddress: string;
  damageType: string;
  status: string;
  estimatedAmount: number;
  approvedAmount?: number;
  paidAmount?: number;
  state: string;
}

export interface InsuranceCompany {
  id: string;
  name: string;
  code: string;
  avgPayout: number;
  totalClaims: number;
  successRate: number;
  payoutTrend: number;
}

export interface LienRule {
  id: string;
  state: string;
  prelimNoticeRequired: boolean;
  prelimNoticeDeadline?: string;
  lienFilingDeadline: string;
  enforcementDeadline: string;
  homesteadNote?: string;
  treeServiceNote?: string;
}

export interface FieldReport {
  id: string;
  crewId: string;
  crewName: string;
  location: string;
  description: string;
  priority: string;
  photoCount: number;
  videoCount: number;
  audioCount: number;
  status: string;
  createdAt: Date;
}

export interface DroneFootage {
  id: string;
  operatorName: string;
  title: string;
  location: string;
  videoUrl: string;
  thumbnailUrl?: string;
  isLive: boolean;
  stormEvent?: string;
}

// Weather API
export const weatherApi = {
  getAlerts: async (lat?: number, lon?: number): Promise<WeatherAlert[]> => {
    const params = new URLSearchParams();
    if (lat) params.set('lat', lat.toString());
    if (lon) params.set('lon', lon.toString());
    
    const response = await apiRequest('GET', `/api/weather/alerts?${params}`);
    return response.json();
  },

  getRadarData: async (lat: number, lon: number, zoom?: number): Promise<RadarData> => {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      ...(zoom && { zoom: zoom.toString() })
    });
    
    const response = await apiRequest('GET', `/api/weather/radar?${params}`);
    return response.json();
  },

  getForecast: async (lat: number, lon: number) => {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString()
    });
    
    const response = await apiRequest('GET', `/api/weather/forecast?${params}`);
    return response.json();
  }
};

// Claims API
export const claimsApi = {
  getClaims: async (): Promise<Claim[]> => {
    const response = await apiRequest('GET', '/api/claims');
    return response.json();
  },

  getClaim: async (id: string): Promise<Claim> => {
    const response = await apiRequest('GET', `/api/claims/${id}`);
    return response.json();
  },

  createClaim: async (claim: Partial<Claim>): Promise<Claim> => {
    const response = await apiRequest('POST', '/api/claims', claim);
    return response.json();
  },

  updateClaim: async (id: string, updates: Partial<Claim>): Promise<Claim> => {
    const response = await apiRequest('PATCH', `/api/claims/${id}`, updates);
    return response.json();
  }
};

// Insurance API
export const insuranceApi = {
  getCompanies: async (): Promise<InsuranceCompany[]> => {
    const response = await apiRequest('GET', '/api/insurance-companies');
    return response.json();
  },

  getCompany: async (id: string): Promise<InsuranceCompany> => {
    const response = await apiRequest('GET', `/api/insurance-companies/${id}`);
    return response.json();
  }
};

// Legal API
export const legalApi = {
  getLienRules: async (): Promise<LienRule[]> => {
    const response = await apiRequest('GET', '/api/legal/lien-rules');
    return response.json();
  },

  getLienRule: async (state: string): Promise<LienRule> => {
    const response = await apiRequest('GET', `/api/legal/lien-rules/${state}`);
    return response.json();
  },

  calculateDeadline: async (state: string, completionDate: string, projectType?: string) => {
    const response = await apiRequest('POST', '/api/legal/calculate-deadline', {
      state,
      completionDate,
      projectType
    });
    return response.json();
  },

  getAttorneys: async (state: string, specialty?: string) => {
    const params = new URLSearchParams({ ...(specialty && { specialty }) });
    const response = await apiRequest('GET', `/api/legal/attorneys/${state}?${params}`);
    return response.json();
  }
};

// Field Reports API
export const fieldReportsApi = {
  getReports: async (crewId?: string): Promise<FieldReport[]> => {
    const params = new URLSearchParams({ ...(crewId && { crewId }) });
    const response = await apiRequest('GET', `/api/field-reports?${params}`);
    return response.json();
  },

  createReport: async (report: Partial<FieldReport>): Promise<FieldReport> => {
    const response = await apiRequest('POST', '/api/field-reports', report);
    return response.json();
  },

  updateReport: async (id: string, updates: Partial<FieldReport>): Promise<FieldReport> => {
    const response = await apiRequest('PATCH', `/api/field-reports/${id}`, updates);
    return response.json();
  }
};

// Drone API
export const droneApi = {
  getFootage: async (live?: boolean): Promise<DroneFootage[]> => {
    const params = new URLSearchParams({ ...(live && { live: 'true' }) });
    const response = await apiRequest('GET', `/api/drone-footage?${params}`);
    return response.json();
  },

  createFootage: async (footage: Partial<DroneFootage>): Promise<DroneFootage> => {
    const response = await apiRequest('POST', '/api/drone-footage', footage);
    return response.json();
  }
};

// AI API
export const aiApi = {
  generateLetter: async (params: any) => {
    const response = await apiRequest('POST', '/api/ai/generate-letter', params);
    return response.json();
  },

  analyzeImage: async (imageBase64: string) => {
    const response = await apiRequest('POST', '/api/ai/analyze-image', { imageBase64 });
    return response.json();
  },

  transcribeAudio: async (audioBuffer: ArrayBuffer) => {
    const response = await apiRequest('POST', '/api/ai/transcribe', { audioBuffer });
    return response.json();
  },

  generateScope: async (params: any) => {
    const response = await apiRequest('POST', '/api/ai/generate-scope', params);
    return response.json();
  }
};

// Translation API
export const translationApi = {
  translateText: async (text: string, targetLanguage: string, context?: string) => {
    const response = await apiRequest('POST', '/api/translate', {
      text,
      targetLanguage,
      context
    });
    return response.json();
  },

  translateClaim: async (content: any, targetLanguage: string) => {
    const response = await apiRequest('POST', '/api/translate/claim', {
      content,
      targetLanguage
    });
    return response.json();
  },

  getPhrases: async (context?: string) => {
    const params = new URLSearchParams({ ...(context && { context }) });
    const response = await apiRequest('GET', `/api/translate/phrases?${params}`);
    return response.json();
  }
};

// Dashboard API
export const dashboardApi = {
  getSummary: async () => {
    const response = await apiRequest('GET', '/api/dashboard/summary');
    return response.json();
  }
};
