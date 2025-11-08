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
  format?: 'json' | 'geojson';
  fieldMappings?: {
    parcelId?: string[];
    address?: string[];
    ownerName?: string[];
    mailingAddress?: string[];
    propertyType?: string[];
    totalValue?: string[];
    landValue?: string[];
    buildingValue?: string[];
    acreage?: string[];
    yearBuilt?: string[];
    squareFootage?: string[];
    zoning?: string[];
  };
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
      name: 'FDOT Statewide Parcels',
      baseUrl: 'https://gis.fdot.gov',
      queryPath: '/arcgis/rest/services/Parcels/FeatureServer/0',
      layerId: 0,
      state: 'FL',
      county: 'ALL',
      supportedQueries: ['coordinates', 'address', 'parcelId', 'ownerName'],
      format: 'geojson',
      fieldMappings: {
        parcelId: ['PARCEL_ID'],
        address: ['SITE_ADDR'],
        ownerName: ['OWNER']
      },
      notes: 'FDOT Statewide FeatureServer covering all 67 Florida counties - Production API'
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
      notes: 'HCAD data with owner information',
      format: 'geojson',
      fieldMappings: {
        parcelId: ['acct', 'geo_id'],
        address: ['prop_addr'],
        ownerName: ['owner_name_1'],
        totalValue: ['total_val', 'appraised_val'],
        landValue: ['land_val'],
        buildingValue: ['imprv_val'],
        acreage: ['acreage'],
        yearBuilt: ['year_built'],
        squareFootage: ['total_sqft'],
        zoning: ['zoning']
      }
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
    },

    // Orange County Florida - Storm response critical
    {
      name: 'Orange County Property Appraiser',
      baseUrl: 'https://vgispublic.ocpafl.org',
      queryPath: '/server/rest/services/OCPA/Base/MapServer/0',
      layerId: 0,
      state: 'FL',
      county: 'Orange',
      supportedQueries: ['address', 'coordinates', 'parcelId', 'ownerName', 'polygon'],
      format: 'json',
      fieldMappings: {
        parcelId: ['PARCELNO'],
        address: ['SITUSADDR'],
        ownerName: ['OWNER'],
        mailingAddress: ['MAILADDR'],
        // Additional mappings for Orange County specific fields
        propertyType: ['DESCRIPT', 'PROPERTY_TYPE'],
        totalValue: ['JUST_VAL', 'TOTAL_VALUE'],
        landValue: ['LAND_VAL'],
        buildingValue: ['BLDG_VAL'],
        acreage: ['ACREAGE'],
        yearBuilt: ['YR_BLT'],
        squareFootage: ['LIV_SQFT', 'SQFT']
      },
      notes: 'Orange County Property Appraiser - Critical for storm response operations with spatial polygon query support'
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

  async lookupByOwnerName(ownerName: string, county?: string, state?: string): Promise<CountyParcelData[]> {
    try {
      let endpointsToSearch: CountyParcelEndpoint[];

      if (county && state) {
        // Search specific county
        const endpoint = this.endpoints.find(ep => 
          ep.county.toLowerCase() === county.toLowerCase() && 
          ep.state.toLowerCase() === state.toLowerCase() &&
          ep.supportedQueries.includes('address') // Most endpoints that support address also support owner search
        );
        endpointsToSearch = endpoint ? [endpoint] : [];
      } else {
        // Search all endpoints that have owner name field mappings or are likely to support it
        endpointsToSearch = this.endpoints.filter(ep => 
          ep.fieldMappings?.ownerName || 
          ep.supportedQueries.includes('address') // Fallback to endpoints that support address queries
        );
      }

      if (endpointsToSearch.length === 0) {
        console.log(`No suitable parcel endpoints found for owner search: ${ownerName}`);
        return [];
      }

      const results: CountyParcelData[] = [];

      // Search each applicable endpoint
      for (const endpoint of endpointsToSearch) {
        try {
          const result = await this.queryEndpoint(endpoint, 'ownerName', ownerName);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error searching ${endpoint.name} for owner ${ownerName}:`, errorMessage);
          
          // For owner searches, we don't include mock data in results
          // as it would be misleading to show fake owner matches
          continue;
        }
      }

      return results;
    } catch (error) {
      console.error('Error looking up parcels by owner name:', error);
      return [];
    }
  }

  async lookupByPolygon(
    polygon: any, 
    county?: string, 
    state?: string,
    inputSpatialReference: number = 102100,  // Web Mercator default
    outputSpatialReference: number = 4326    // WGS84 default
  ): Promise<CountyParcelData[]> {
    try {
      let endpointsToSearch: CountyParcelEndpoint[];

      if (county && state) {
        // Search specific county
        const endpoint = this.endpoints.find(ep => 
          ep.county.toLowerCase() === county.toLowerCase() && 
          ep.state.toLowerCase() === state.toLowerCase() &&
          ep.supportedQueries.includes('polygon')
        );
        endpointsToSearch = endpoint ? [endpoint] : [];
      } else {
        // Search all endpoints that support polygon queries
        endpointsToSearch = this.endpoints.filter(ep => 
          ep.supportedQueries.includes('polygon')
        );
      }

      if (endpointsToSearch.length === 0) {
        console.log(`No suitable parcel endpoints found for polygon search`);
        return [];
      }

      const results: CountyParcelData[] = [];

      // Search each applicable endpoint
      for (const endpoint of endpointsToSearch) {
        try {
          const endpointResults = await this.queryPolygonEndpoint(
            endpoint, 
            polygon,
            inputSpatialReference,
            outputSpatialReference
          );
          results.push(...endpointResults);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error searching ${endpoint.name} with polygon:`, errorMessage);
          continue;
        }
      }

      return results;
    } catch (error) {
      console.error('Error looking up parcels by polygon:', error);
      return [];
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

    // State matching - handle both abbreviations and full state names
    const stateMapping: { [key: string]: string } = {
      'FLORIDA': 'FL',
      'FL': 'FL',
      'SOUTH CAROLINA': 'SC', 
      'SC': 'SC',
      'GEORGIA': 'GA',
      'GA': 'GA', 
      'LOUISIANA': 'LA',
      'LA': 'LA',
      'TEXAS': 'TX',
      'TX': 'TX'
    };

    // Find state in address - check for both full names and abbreviations
    let detectedState: string | null = null;
    for (const [stateName, stateCode] of Object.entries(stateMapping)) {
      if (addressUpper.includes(stateName)) {
        detectedState = stateCode;
        break;
      }
    }

    // Also try regex for state abbreviations as fallback
    if (!detectedState) {
      const stateMatch = addressUpper.match(/\b(FL|SC|GA|LA|TX)\b/);
      if (stateMatch) {
        detectedState = stateMatch[1];
      }
    }

    if (detectedState) {
      // Prioritize statewide endpoints (county='ALL') for comprehensive coverage
      const statewideEndpoint = this.endpoints.find(ep => 
        ep.state === detectedState && ep.county === 'ALL'
      );
      
      if (statewideEndpoint) {
        console.log(`Using statewide endpoint for ${detectedState}: ${statewideEndpoint.name}`);
        return statewideEndpoint;
      }
      
      // Fallback to any endpoint in the state
      return this.endpoints.find(ep => ep.state === detectedState) || null;
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
      
      if (endpoint.queryPath.includes('MapServer') || endpoint.queryPath.includes('FeatureServer')) {
        // ArcGIS MapServer/FeatureServer query
        // Check if queryPath already includes layer ID (ends with /{number})
        const layerAlreadyInPath = /\/\d+$/.test(endpoint.queryPath);
        let queryUrl_base = `${endpoint.baseUrl}${endpoint.queryPath}`;
        
        if (!layerAlreadyInPath) {
          const layerPath = endpoint.layerId !== undefined ? `/${endpoint.layerId}` : '/0';
          queryUrl_base += layerPath;
        }
        
        queryUrl = `${queryUrl_base}/query`;
        
        // Use endpoint-specific format or default to JSON
        const format = endpoint.format || 'json';
        const acceptHeader = format === 'geojson' ? 'application/geo+json,application/json' : 'application/json';
        
        const params = new URLSearchParams({
          f: format,
          returnGeometry: 'true',
          outSR: '4326'
        });

        // Use county-specific field names for queries if available
        const fieldMappings = endpoint.fieldMappings;

        if (queryType === 'coordinates') {
          const [lng, lat] = queryValue.split(',');
          params.append('geometry', `${lng},${lat}`);
          params.append('geometryType', 'esriGeometryPoint');
          params.append('spatialRel', 'esriSpatialRelIntersects');
          
          // For coordinate queries, get specific fields if mapped
          if (fieldMappings) {
            const outFields = this.buildOutFields(fieldMappings);
            params.append('outFields', outFields);
          } else {
            params.append('outFields', '*');
          }
        } else if (queryType === 'address') {
          // Build address query using county-specific field names
          let whereClause = '';
          if (fieldMappings?.address) {
            const addressFields = fieldMappings.address;
            const addressConditions = addressFields.map(field => 
              `UPPER(${field}) LIKE '%${queryValue.toUpperCase().replace(/'/g, "''").replace(/"/g, '""')}%'`
            );
            whereClause = addressConditions.join(' OR ');
          } else {
            // Fallback to generic field names
            whereClause = `UPPER(ADDRESS) LIKE '%${queryValue.toUpperCase().replace(/'/g, "''").replace(/"/g, '""')}%' OR UPPER(SITE_ADDRESS) LIKE '%${queryValue.toUpperCase().replace(/'/g, "''").replace(/"/g, '""')}%'`;
          }
          params.append('where', whereClause);
          
          if (fieldMappings) {
            const outFields = this.buildOutFields(fieldMappings);
            params.append('outFields', outFields);
          } else {
            params.append('outFields', '*');
          }
        } else if (queryType === 'parcelId') {
          // Build parcel ID query using county-specific field names
          let whereClause = '';
          if (fieldMappings?.parcelId) {
            const parcelFields = fieldMappings.parcelId;
            const parcelConditions = parcelFields.map(field => 
              `${field} = '${queryValue.replace(/'/g, "''").replace(/"/g, '""')}'`
            );
            whereClause = parcelConditions.join(' OR ');
          } else {
            // Fallback to generic field names
            whereClause = `PARCEL_ID = '${queryValue.replace(/'/g, "''").replace(/"/g, '""')}' OR APN = '${queryValue.replace(/'/g, "''").replace(/"/g, '""')}' OR PIN = '${queryValue.replace(/'/g, "''").replace(/"/g, '""')}'`;
          }
          params.append('where', whereClause);
          
          if (fieldMappings) {
            const outFields = this.buildOutFields(fieldMappings);
            params.append('outFields', outFields);
          } else {
            params.append('outFields', '*');
          }
        } else if (queryType === 'ownerName') {
          // Build owner name query using county-specific field names
          let whereClause = '';
          if (fieldMappings?.ownerName) {
            const ownerFields = fieldMappings.ownerName;
            const ownerConditions = ownerFields.map(field => 
              `UPPER(${field}) LIKE '%${queryValue.toUpperCase().replace(/'/g, "''").replace(/"/g, '""')}%'`
            );
            whereClause = ownerConditions.join(' OR ');
          } else {
            // Fallback to generic field names
            whereClause = `UPPER(OWNER_NAME) LIKE '%${queryValue.toUpperCase().replace(/'/g, "''").replace(/"/g, '""')}%' OR UPPER(OWNER) LIKE '%${queryValue.toUpperCase().replace(/'/g, "''").replace(/"/g, '""')}%'`;
          }
          params.append('where', whereClause);
          
          if (fieldMappings) {
            const outFields = this.buildOutFields(fieldMappings);
            params.append('outFields', outFields);
          } else {
            params.append('outFields', '*');
          }
        }

        queryUrl += `?${params.toString()}`;
        
        console.log(`Querying ${endpoint.name}: ${queryUrl}`);
        
        const response = await fetch(queryUrl, {
          headers: {
            'User-Agent': 'Disaster Direct/1.0 Storm Response System',
            'Accept': acceptHeader
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as any;
        
        // Parse response based on format
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          return this.parseArcGISFeature(feature, endpoint, format);
        }

        console.log(`No parcel data found for query: ${queryValue}`);
        return null;
        
      } else {
        console.log(`Custom API format needed for ${endpoint.name} - not yet implemented`);
        return null;
      }

    } catch (error) {
      console.error(`Error querying ${endpoint.name}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      const isNetworkError = errorMessage.includes('ECONNREFUSED') || 
                            errorMessage.includes('ENOTFOUND') || 
                            errorMessage.includes('timeout') ||
                            errorMessage.includes('ECONNRESET');
      
      const isHTTPError = errorMessage.includes('HTTP 4') || errorMessage.includes('HTTP 5');
      
      if (isNetworkError) {
        console.warn(`Network error for ${endpoint.name}, parcel data unavailable`);
      } else if (isHTTPError) {
        console.warn(`HTTP error for ${endpoint.name}, API temporarily unavailable`);
      } else {
        console.error(`Unexpected error for ${endpoint.name}:`, errorMessage);
      }
      
      return null;
    }
  }

  private async queryPolygonEndpoint(
    endpoint: CountyParcelEndpoint,
    polygon: any,
    inputSpatialReference: number = 102100,
    outputSpatialReference: number = 4326
  ): Promise<CountyParcelData[]> {
    try {
      // Build ArcGIS MapServer/FeatureServer polygon query URL
      const layerAlreadyInPath = /\/\d+$/.test(endpoint.queryPath);
      let queryUrl_base = `${endpoint.baseUrl}${endpoint.queryPath}`;
      
      if (!layerAlreadyInPath) {
        const layerPath = endpoint.layerId !== undefined ? `/${endpoint.layerId}` : '/0';
        queryUrl_base += layerPath;
      }
      
      const queryUrl = `${queryUrl_base}/query`;
      
      // Use endpoint-specific format or default to JSON
      const format = endpoint.format || 'json';
      const acceptHeader = format === 'geojson' ? 'application/geo+json,application/json' : 'application/json';
      
      const params = new URLSearchParams({
        f: format,
        returnGeometry: 'true',
        outSR: outputSpatialReference.toString(),
        inSR: inputSpatialReference.toString(),
        spatialRel: 'esriSpatialRelIntersects',
        geometryType: 'esriGeometryPolygon'
      });

      // Convert polygon to ArcGIS format
      let geometryParam: string;
      if (typeof polygon === 'string') {
        // If polygon is already a string (e.g., from client), use as-is
        geometryParam = polygon;
      } else if (polygon.type === 'Polygon' && polygon.coordinates) {
        // GeoJSON Polygon format
        const rings = polygon.coordinates.map((ring: number[][]) => 
          ring.map(coord => coord.join(',')).join(' ')
        ).join(';');
        geometryParam = `{"rings":[${polygon.coordinates.map((ring: number[][]) => 
          '[' + ring.map(coord => `[${coord[0]},${coord[1]}]`).join(',') + ']'
        ).join(',')}],"spatialReference":{"wkid":${inputSpatialReference}}}`;
      } else if (Array.isArray(polygon) && polygon.length > 0) {
        // Simple coordinate array format: [[lng,lat], [lng,lat], ...]
        geometryParam = `{"rings":[[${polygon.map(coord => `[${coord[0]},${coord[1]}]`).join(',')}]],"spatialReference":{"wkid":${inputSpatialReference}}}`;
      } else {
        throw new Error('Invalid polygon format. Expected GeoJSON Polygon or coordinate array.');
      }

      params.append('geometry', geometryParam);

      // Use county-specific field names if available
      const fieldMappings = endpoint.fieldMappings;
      if (fieldMappings) {
        const outFields = this.buildOutFields(fieldMappings);
        params.append('outFields', outFields);
      } else {
        // Use Orange County specific fields if no mapping provided
        params.append('outFields', 'OWNER,MAILADDR,SITUSADDR,PARCELNO,*');
      }

      const fullUrl = `${queryUrl}?${params.toString()}`;
      
      console.log(`Polygon query to ${endpoint.name}: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        headers: {
          'User-Agent': 'Disaster Direct/1.0 Storm Response System',
          'Accept': acceptHeader
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      // Parse response and return array of parcels
      const results: CountyParcelData[] = [];
      
      if (data.features && Array.isArray(data.features)) {
        for (const feature of data.features) {
          try {
            const parcelData = this.parseArcGISFeature(feature, endpoint, format);
            results.push(parcelData);
          } catch (parseError) {
            console.warn(`Failed to parse feature from ${endpoint.name}:`, parseError);
            continue;
          }
        }
      }

      console.log(`Found ${results.length} parcels in polygon for ${endpoint.name}`);
      return results;

    } catch (error) {
      console.error(`Error querying polygon for ${endpoint.name}:`, error);
      
      // For polygon queries, we don't return mock data as it would be misleading
      // to show fake parcels in a storm area - this could affect real disaster response
      throw error;
    }
  }

  private buildOutFields(fieldMappings: NonNullable<CountyParcelEndpoint['fieldMappings']>): string {
    const fields = new Set<string>();
    
    // Add all mapped fields
    Object.values(fieldMappings).forEach(fieldArray => {
      if (fieldArray) {
        fieldArray.forEach(field => fields.add(field));
      }
    });
    
    // Add geometry-related fields
    fields.add('OBJECTID');
    fields.add('Shape');
    fields.add('SHAPE');
    
    return fields.size > 0 ? Array.from(fields).join(',') : '*';
  }

  private parseArcGISFeature(feature: any, endpoint: CountyParcelEndpoint, format: string = 'json'): CountyParcelData {
    const attrs = format === 'geojson' ? feature.properties : feature.attributes;
    const geom = feature.geometry;
    const fieldMappings = endpoint.fieldMappings;

    // Helper function to get field value using county-specific mappings
    const getFieldValue = (mappingKey: keyof NonNullable<CountyParcelEndpoint['fieldMappings']>, fallbackFields: string[] = []): any => {
      if (fieldMappings && fieldMappings[mappingKey]) {
        // Try county-specific mapped fields first
        for (const field of fieldMappings[mappingKey]!) {
          if (attrs[field] !== undefined && attrs[field] !== null && attrs[field] !== '') {
            return attrs[field];
          }
        }
      }
      
      // Try fallback fields
      for (const field of fallbackFields) {
        if (attrs[field] !== undefined && attrs[field] !== null && attrs[field] !== '') {
          return attrs[field];
        }
      }
      
      return undefined;
    };

    // Extract coordinates based on format
    let coordinates = { latitude: 0, longitude: 0 };
    if (format === 'geojson') {
      // GeoJSON format
      if (geom && geom.type === 'Point' && geom.coordinates) {
        coordinates = {
          longitude: geom.coordinates[0],
          latitude: geom.coordinates[1]
        };
      } else if (geom && geom.type === 'Polygon' && geom.coordinates && geom.coordinates[0]) {
        // For polygons, use centroid or first coordinate
        const ring = geom.coordinates[0];
        if (ring.length > 0) {
          coordinates = {
            longitude: ring[0][0],
            latitude: ring[0][1]
          };
        }
      }
    } else {
      // Standard ArcGIS JSON format
      coordinates = {
        latitude: geom?.y || geom?.latitude || 0,
        longitude: geom?.x || geom?.longitude || 0
      };
    }

    return {
      parcelId: getFieldValue('parcelId', ['PARCEL_ID', 'APN', 'PIN']) || 'Unknown',
      address: getFieldValue('address', ['ADDRESS', 'SITE_ADDRESS', 'LOCATION', 'PROP_ADDRESS']) || 'Address not available',
      owner: {
        name: getFieldValue('ownerName', ['OWNER_NAME', 'OWNER', 'PROP_OWNER', 'OWNER1']) || 'Owner not available',
        mailingAddress: getFieldValue('mailingAddress', ['MAIL_ADDRESS', 'MAILING_ADDRESS', 'MAIL_ADDR']) || undefined
      },
      propertyDetails: {
        propertyType: getFieldValue('propertyType', ['PROP_TYPE', 'PROPERTY_TYPE', 'USE_CODE', 'LAND_USE']) || 'Residential',
        totalValue: this.parseNumericValue(getFieldValue('totalValue', ['TOTAL_VALUE', 'JUST_VALUE', 'ASSESSED_VALUE', 'APPRAISED_VAL'])),
        landValue: this.parseNumericValue(getFieldValue('landValue', ['LAND_VALUE', 'LAND_VAL'])),
        buildingValue: this.parseNumericValue(getFieldValue('buildingValue', ['BUILDING_VALUE', 'IMPROVEMENT_VALUE', 'IMPRV_VAL'])),
        acreage: this.parseNumericValue(getFieldValue('acreage', ['ACRES', 'ACREAGE'])),
        yearBuilt: this.parseNumericValue(getFieldValue('yearBuilt', ['YEAR_BUILT', 'YR_BUILT'])),
        squareFootage: this.parseNumericValue(getFieldValue('squareFootage', ['SQFT', 'SQUARE_FEET', 'LIVING_AREA', 'TOTAL_SQFT'])),
        zoning: getFieldValue('zoning', ['ZONING', 'ZONE']) || undefined
      },
      coordinates,
      county: endpoint.county,
      state: endpoint.state,
      sourceEndpoint: endpoint.name,
      lastUpdated: new Date()
    };
  }

  private parseNumericValue(value: any): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    
    const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? undefined : parsed;
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