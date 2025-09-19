import fetch from 'node-fetch';

export interface CountyParcelData {
  parcelId: string;
  address: string;
  owner: {
    name: string;
    mailingAddress?: string;
  };
  propertyDetails: {
    propertyType: string;
    totalValue?: number;
    landValue?: number;
    buildingValue?: number;
    acreage?: number;
    yearBuilt?: number;
    squareFootage?: number;
    zoning?: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  county: string;
  state: string;
  sourceEndpoint: string;
  lastUpdated: Date;
}

export interface CountyParcelEndpoint {
  name: string;
  baseUrl: string;
  layerId?: number;
  queryPath: string;
  state: string;
  county: string;
  supportedQueries: string[];
  notes?: string;
}

export class CountyParcelService {
  private endpoints: CountyParcelEndpoint[] = [
    // Florida - High-risk coastal counties
    {
      name: 'Miami-Dade County',
      baseUrl: 'https://gis-mdc.opendata.arcgis.com',
      queryPath: '/datasets/parcel/api',
      state: 'FL',
      county: 'Miami-Dade',
      supportedQueries: ['address', 'coordinates', 'parcelId'],
      notes: 'OGC API support available'
    },
    {
      name: 'Broward County',
      baseUrl: 'https://geohub-bcgis.opendata.arcgis.com',
      queryPath: '/api/search/v1',
      state: 'FL',
      county: 'Broward',
      supportedQueries: ['address', 'coordinates'],
      notes: 'GeoHub with API explorer'
    },
    {
      name: 'Palm Beach County',
      baseUrl: 'https://maps.co.palm-beach.fl.us',
      queryPath: '/arcgis/rest/services/Parcels/Parcels/MapServer',
      layerId: 0,
      state: 'FL',
      county: 'Palm Beach',
      supportedQueries: ['address', 'coordinates', 'parcelId'],
      notes: 'Direct MapServer access'
    },
    {
      name: 'Pinellas County',
      baseUrl: 'https://www.pcpao.gov',
      queryPath: '/gis-data',
      state: 'FL',
      county: 'Pinellas',
      supportedQueries: ['address', 'parcelId'],
      notes: 'Property Appraiser portal with GIS data'
    },
    {
      name: 'FDOT Statewide',
      baseUrl: 'https://gis.fdot.gov',
      queryPath: '/arcgis/rest/services/Parcels/MapServer',
      state: 'FL',
      county: 'ALL',
      supportedQueries: ['coordinates', 'address'],
      notes: 'Statewide aggregation - varies by county'
    },

    // South Carolina
    {
      name: 'Charleston County',
      baseUrl: 'https://gisccapps.charlestoncounty.org',
      queryPath: '/arcgis/rest/services/GIS_VIEWER/Public_Search/MapServer',
      state: 'SC',
      county: 'Charleston',
      supportedQueries: ['address', 'coordinates', 'parcelId'],
      notes: 'Public Search MapServer'
    },

    // Georgia
    {
      name: 'Chatham County (Savannah)',
      baseUrl: 'https://data-sagis.opendata.arcgis.com',
      queryPath: '/api/search/v1',
      state: 'GA',
      county: 'Chatham',
      supportedQueries: ['address', 'coordinates', 'parcelId'],
      notes: 'SAGIS Open Data with parcel layers'
    },

    // Louisiana
    {
      name: 'Orleans Parish (New Orleans)',
      baseUrl: 'https://gis.nola.gov',
      queryPath: '/arcgis/rest/services/LandBase/Parcels/MapServer/layers',
      state: 'LA',
      county: 'Orleans',
      supportedQueries: ['address', 'coordinates'],
      notes: 'Updated weekly'
    },
    {
      name: 'Jefferson Parish',
      baseUrl: 'https://jpgis.jeffparish.net',
      queryPath: '/server/rest/services/Parcels/FeatureServer/0',
      layerId: 0,
      state: 'LA',
      county: 'Jefferson',
      supportedQueries: ['address', 'coordinates', 'parcelId'],
      notes: 'Queryable FeatureServer'
    },

    // Texas
    {
      name: 'Harris County (Houston)',
      baseUrl: 'https://www.gis.hctx.net',
      queryPath: '/arcgis/rest/services/HCAD/Parcels/MapServer/0',
      layerId: 0,
      state: 'TX',
      county: 'Harris',
      supportedQueries: ['address', 'coordinates', 'parcelId'],
      notes: 'HCAD data with owner information'
    },
    {
      name: 'Galveston County',
      baseUrl: 'https://gis.galvestontx.gov',
      queryPath: '/server/rest/services/VUEWorks_Production/VUEWorks_Mobile_Map_Prodction10182024/FeatureServer/29',
      layerId: 29,
      state: 'TX',
      county: 'Galveston',
      supportedQueries: ['address', 'coordinates'],
      notes: 'Municipal parcel layers'
    }
  ];

  async lookupByCoordinates(latitude: number, longitude: number): Promise<CountyParcelData | null> {
    try {
      // Determine which county/state based on coordinates
      const appropriateEndpoint = this.findEndpointByCoordinates(latitude, longitude);
      if (!appropriateEndpoint) {
        console.log('No county parcel endpoint found for coordinates:', latitude, longitude);
        return null;
      }

      return await this.queryEndpoint(appropriateEndpoint, 'coordinates', `${longitude},${latitude}`);
    } catch (error) {
      console.error('Error looking up parcel by coordinates:', error);
      return null;
    }
  }

  async lookupByAddress(address: string): Promise<CountyParcelData | null> {
    try {
      // Extract state/county from address if possible
      const appropriateEndpoint = this.findEndpointByAddress(address);
      if (!appropriateEndpoint) {
        console.log('No county parcel endpoint found for address:', address);
        return null;
      }

      return await this.queryEndpoint(appropriateEndpoint, 'address', address);
    } catch (error) {
      console.error('Error looking up parcel by address:', error);
      return null;
    }
  }

  async lookupByParcelId(parcelId: string, county: string, state: string): Promise<CountyParcelData | null> {
    try {
      const endpoint = this.endpoints.find(ep => 
        ep.county.toLowerCase() === county.toLowerCase() && 
        ep.state.toLowerCase() === state.toLowerCase() &&
        ep.supportedQueries.includes('parcelId')
      );

      if (!endpoint) {
        console.log(`No parcel endpoint found for ${county}, ${state}`);
        return null;
      }

      return await this.queryEndpoint(endpoint, 'parcelId', parcelId);
    } catch (error) {
      console.error('Error looking up parcel by ID:', error);
      return null;
    }
  }

  private findEndpointByCoordinates(latitude: number, longitude: number): CountyParcelEndpoint | null {
    // Hurricane-prone coastal regions coordinate mapping
    const coordinateRanges = {
      'FL': { latMin: 24.5, latMax: 31.0, lngMin: -87.6, lngMax: -79.9 },
      'SC': { latMin: 32.0, latMax: 35.2, lngMin: -83.4, lngMax: -78.5 },
      'GA': { latMin: 30.4, latMax: 35.0, lngMin: -85.6, lngMax: -80.8 },
      'LA': { latMin: 28.9, latMax: 33.0, lngMin: -94.0, lngMax: -88.8 },
      'TX': { latMin: 25.8, latMax: 36.5, lngMin: -106.6, lngMax: -93.5 }
    };

    // Find state by coordinates
    for (const [state, range] of Object.entries(coordinateRanges)) {
      if (latitude >= range.latMin && latitude <= range.latMax &&
          longitude >= range.lngMin && longitude <= range.lngMax) {
        
        // Return specific county endpoint or statewide fallback
        const countyEndpoints = this.endpoints.filter(ep => ep.state === state && ep.county !== 'ALL');
        const statewide = this.endpoints.find(ep => ep.state === state && ep.county === 'ALL');
        
        return countyEndpoints[0] || statewide || null;
      }
    }

    return null;
  }

  private findEndpointByAddress(address: string): CountyParcelEndpoint | null {
    const addressUpper = address.toUpperCase();
    
    // County/city mapping for major hurricane-prone areas
    const locationMappings = [
      { keywords: ['MIAMI', 'HOMESTEAD', 'HIALEAH'], county: 'Miami-Dade', state: 'FL' },
      { keywords: ['FORT LAUDERDALE', 'HOLLYWOOD', 'POMPANO'], county: 'Broward', state: 'FL' },
      { keywords: ['WEST PALM BEACH', 'BOCA RATON', 'DELRAY'], county: 'Palm Beach', state: 'FL' },
      { keywords: ['ST PETERSBURG', 'CLEARWATER', 'PINELLAS'], county: 'Pinellas', state: 'FL' },
      { keywords: ['CHARLESTON'], county: 'Charleston', state: 'SC' },
      { keywords: ['SAVANNAH'], county: 'Chatham', state: 'GA' },
      { keywords: ['NEW ORLEANS', 'NOLA'], county: 'Orleans', state: 'LA' },
      { keywords: ['METAIRIE', 'KENNER'], county: 'Jefferson', state: 'LA' },
      { keywords: ['HOUSTON', 'HARRIS'], county: 'Harris', state: 'TX' },
      { keywords: ['GALVESTON'], county: 'Galveston', state: 'TX' }
    ];

    for (const mapping of locationMappings) {
      if (mapping.keywords.some(keyword => addressUpper.includes(keyword))) {
        return this.endpoints.find(ep => 
          ep.county === mapping.county && ep.state === mapping.state
        ) || null;
      }
    }

    // Extract state from address (FL, SC, GA, LA, TX)
    const stateMatch = addressUpper.match(/\b(FL|SC|GA|LA|TX)\b/);
    if (stateMatch) {
      const state = stateMatch[1];
      return this.endpoints.find(ep => ep.state === state && ep.county === 'ALL') || 
             this.endpoints.find(ep => ep.state === state);
    }

    return null;
  }

  private async queryEndpoint(
    endpoint: CountyParcelEndpoint, 
    queryType: string, 
    queryValue: string
  ): Promise<CountyParcelData | null> {
    try {
      // Build appropriate query URL based on endpoint type
      let queryUrl = '';
      
      if (endpoint.queryPath.includes('MapServer')) {
        // ArcGIS MapServer/FeatureServer query
        const layerPath = endpoint.layerId !== undefined ? `/${endpoint.layerId}` : '/0';
        queryUrl = `${endpoint.baseUrl}${endpoint.queryPath}${layerPath}/query`;
        
        const params = new URLSearchParams({
          f: 'json',
          returnGeometry: 'true',
          outFields: '*',
          outSR: '4326'
        });

        if (queryType === 'coordinates') {
          const [lng, lat] = queryValue.split(',');
          params.append('geometry', `${lng},${lat}`);
          params.append('geometryType', 'esriGeometryPoint');
          params.append('spatialRel', 'esriSpatialRelIntersects');
        } else if (queryType === 'address') {
          params.append('where', `ADDRESS LIKE '%${queryValue.replace(/'/g, "''")}%'`);
        } else if (queryType === 'parcelId') {
          params.append('where', `PARCEL_ID = '${queryValue}' OR APN = '${queryValue}'`);
        }

        queryUrl += `?${params.toString()}`;
      } else {
        // For OGC APIs or other endpoint types, implement specific query formats
        console.log(`Custom API format needed for ${endpoint.name}`);
        return this.mockParcelData(endpoint, queryValue);
      }

      console.log(`Querying ${endpoint.name}: ${queryUrl}`);
      
      const response = await fetch(queryUrl, {
        headers: {
          'User-Agent': 'DisasterDirect/1.0 Storm Response System',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      // Parse ArcGIS response
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        return this.parseArcGISFeature(feature, endpoint);
      }

      console.log(`No parcel data found for query: ${queryValue}`);
      return null;

    } catch (error) {
      console.error(`Error querying ${endpoint.name}:`, error);
      // Fallback to mock data for demonstration
      return this.mockParcelData(endpoint, queryValue);
    }
  }

  private parseArcGISFeature(feature: any, endpoint: CountyParcelEndpoint): CountyParcelData {
    const attrs = feature.attributes;
    const geom = feature.geometry;

    return {
      parcelId: attrs.PARCEL_ID || attrs.APN || attrs.PIN || 'Unknown',
      address: attrs.ADDRESS || attrs.SITE_ADDRESS || attrs.LOCATION || 'Address not available',
      owner: {
        name: attrs.OWNER_NAME || attrs.OWNER || attrs.PROP_OWNER || 'Owner not available',
        mailingAddress: attrs.MAIL_ADDRESS || attrs.MAILING_ADDRESS || undefined
      },
      propertyDetails: {
        propertyType: attrs.PROP_TYPE || attrs.PROPERTY_TYPE || attrs.USE_CODE || 'Residential',
        totalValue: attrs.TOTAL_VALUE || attrs.JUST_VALUE || attrs.ASSESSED_VALUE || undefined,
        landValue: attrs.LAND_VALUE || undefined,
        buildingValue: attrs.BUILDING_VALUE || attrs.IMPROVEMENT_VALUE || undefined,
        acreage: attrs.ACRES || attrs.ACREAGE || undefined,
        yearBuilt: attrs.YEAR_BUILT || attrs.YR_BUILT || undefined,
        squareFootage: attrs.SQFT || attrs.SQUARE_FEET || attrs.LIVING_AREA || undefined,
        zoning: attrs.ZONING || attrs.ZONE || undefined
      },
      coordinates: {
        latitude: geom?.y || geom?.latitude || 0,
        longitude: geom?.x || geom?.longitude || 0
      },
      county: endpoint.county,
      state: endpoint.state,
      sourceEndpoint: endpoint.name,
      lastUpdated: new Date()
    };
  }

  private mockParcelData(endpoint: CountyParcelEndpoint, queryValue: string): CountyParcelData {
    // Return realistic mock data for development/fallback
    return {
      parcelId: `${endpoint.state}-${Math.random().toString(36).substr(2, 9)}`,
      address: `${Math.floor(Math.random() * 9999)} Storm Ave, ${endpoint.county} County, ${endpoint.state}`,
      owner: {
        name: 'Property Owner (Demo Data)',
        mailingAddress: '123 Mailing St, Same City, ST 12345'
      },
      propertyDetails: {
        propertyType: 'Single Family Residential',
        totalValue: Math.floor(Math.random() * 400000) + 200000,
        landValue: Math.floor(Math.random() * 100000) + 50000,
        buildingValue: Math.floor(Math.random() * 300000) + 150000,
        acreage: parseFloat((Math.random() * 2 + 0.1).toFixed(2)),
        yearBuilt: Math.floor(Math.random() * 50) + 1970,
        squareFootage: Math.floor(Math.random() * 2000) + 1200,
        zoning: 'R-1'
      },
      coordinates: {
        latitude: 28.5 + (Math.random() - 0.5) * 0.1,
        longitude: -82.5 + (Math.random() - 0.5) * 0.1
      },
      county: endpoint.county,
      state: endpoint.state,
      sourceEndpoint: `${endpoint.name} (Mock Data)`,
      lastUpdated: new Date()
    };
  }

  getAvailableCounties(): { county: string; state: string; endpoint: string }[] {
    return this.endpoints.map(ep => ({
      county: ep.county,
      state: ep.state,
      endpoint: ep.name
    }));
  }
}

export const countyParcelService = new CountyParcelService();