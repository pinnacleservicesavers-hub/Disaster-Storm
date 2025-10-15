import NodeCache from 'node-cache';
import { weatherService } from './weather';
import { femaDisasterService } from './femaDisasterService';
import { noaaStormEventsService } from './noaaStormEventsService';
import { xweatherService } from './xweatherService';
import { ambeeService } from './ambeeService';
import { tomorrowService } from './tomorrowService';

/**
 * Unified Event Schema
 * Normalizes data from all disaster/weather providers
 */
export interface UnifiedEvent {
  id: string;
  source: 'NWS' | 'FEMA' | 'NOAA' | 'XWEATHER' | 'AMBEE' | 'TOMORROW' | 'USGS';
  eventType: string;
  headline: string | null;
  description: string | null;
  severity: 'extreme' | 'severe' | 'moderate' | 'minor' | 'unknown';
  urgency: 'immediate' | 'expected' | 'future' | 'past' | 'unknown';
  certainty: 'observed' | 'likely' | 'possible' | 'unlikely' | 'unknown';
  startTime: Date | null;
  endTime: Date | null;
  location: {
    lat: number;
    lon: number;
  };
  affectedArea: string;
  geometry: any | null;
  impacts: {
    damageEstimate?: number;
    casualties?: number;
    injuries?: number;
  };
  metadata: Record<string, any>;
}

/**
 * Aggregated Response
 */
export interface AggregateResponse {
  queryLat: number;
  queryLon: number;
  radiusKm: number;
  events: UnifiedEvent[];
  riskScore: number;
  riskLevel: 'extreme' | 'high' | 'moderate' | 'low' | 'minimal';
  generatedAt: Date;
  eventsBySource: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  insights: {
    activeAlerts: number;
    historicalEvents: number;
    environmentalThreats: number;
    totalEstimatedDamage: number;
  };
}

/**
 * Provider Interface
 * Each provider implements this to contribute events
 */
interface Provider {
  name: string;
  fetch(lat: number, lon: number, radiusKm: number, since: Date): Promise<UnifiedEvent[]>;
}

/**
 * Disaster Aggregator Service
 * Unified multi-source disaster/weather event aggregator
 * Inspired by Opterrix-style aggregation
 */
export class DisasterAggregatorService {
  private static instance: DisasterAggregatorService;
  private cache: NodeCache;
  private providers: Provider[];

  private constructor() {
    // Cache with 2-minute TTL (same as Python version)
    this.cache = new NodeCache({ stdTTL: 120, checkperiod: 30 });
    
    // Initialize providers
    this.providers = [
      this.createNWSProvider(),
      this.createFEMAProvider(),
      this.createNOAAProvider(),
      this.createXweatherProvider(),
      this.createAmbeeProvider(),
      this.createTomorrowProvider(),
    ];

    console.log('🔄 DisasterAggregatorService initialized - Multi-source event aggregation active');
  }

  static getInstance(): DisasterAggregatorService {
    if (!DisasterAggregatorService.instance) {
      DisasterAggregatorService.instance = new DisasterAggregatorService();
    }
    return DisasterAggregatorService.instance;
  }

  /**
   * Main aggregation endpoint
   * Pulls from all providers, deduplicates, and returns unified events
   */
  async aggregate(
    lat: number,
    lon: number,
    radiusKm: number = 25,
    hoursBack: number = 72
  ): Promise<AggregateResponse> {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // Check cache first
    const cacheKey = `agg:${lat.toFixed(4)}:${lon.toFixed(4)}:${radiusKm}:${hoursBack}`;
    const cached = this.cache.get<AggregateResponse>(cacheKey);
    
    if (cached) {
      console.log(`✅ Cache hit for ${cacheKey}`);
      return cached;
    }

    console.log(`🔍 Aggregating disaster events for ${lat}, ${lon} (${radiusKm}km, ${hoursBack}h back)`);

    // Fan out to all providers in parallel
    const results: UnifiedEvent[] = [];
    const providerResults = await Promise.allSettled(
      this.providers.map(p => p.fetch(lat, lon, radiusKm, since))
    );

    // Collect successful results
    providerResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      } else {
        console.warn(`⚠️ Provider ${this.providers[idx].name} error:`, result.reason?.message || result.reason);
      }
    });

    // Deduplicate by (source, headline, startTime)
    const events = this.deduplicateEvents(results);
    
    // Compute risk score
    const riskScore = this.computeRiskScore(events);
    const riskLevel = this.getRiskLevel(riskScore);

    // Analyze insights
    const insights = this.generateInsights(events, since);
    const eventsBySource = this.countBySource(events);
    const eventsBySeverity = this.countBySeverity(events);

    const response: AggregateResponse = {
      queryLat: lat,
      queryLon: lon,
      radiusKm,
      events,
      riskScore,
      riskLevel,
      generatedAt: new Date(),
      eventsBySource,
      eventsBySeverity,
      insights
    };

    // Cache the result
    this.cache.set(cacheKey, response);

    return response;
  }

  /**
   * Deduplicate events by unique key (provider-agnostic)
   * Merges identical events from different sources
   */
  private deduplicateEvents(events: UnifiedEvent[]): UnifiedEvent[] {
    const seen = new Set<string>();
    const deduped: UnifiedEvent[] = [];

    for (const event of events) {
      // Normalize headline and event type for comparison
      const normalizedHeadline = (event.headline || event.eventType).toLowerCase().trim();
      
      // Normalize time to 15-minute window for fuzzy matching
      const timeWindow = event.startTime 
        ? Math.floor(event.startTime.getTime() / (15 * 60 * 1000)) 
        : 0;
      
      // Normalize location to 2 decimal places (~1km precision)
      const normalizedLat = event.location.lat.toFixed(2);
      const normalizedLon = event.location.lon.toFixed(2);
      
      // Provider-agnostic key using normalized values
      const key = `${normalizedHeadline}:${timeWindow}:${normalizedLat}:${normalizedLon}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(event);
      }
    }

    return deduped;
  }

  /**
   * Compute overall risk score (0-100)
   * Based on event severity, urgency, certainty, and impacts
   */
  private computeRiskScore(events: UnifiedEvent[]): number {
    if (events.length === 0) return 0;

    let totalScore = 0;
    const weights = {
      extreme: 100,
      severe: 75,
      moderate: 50,
      minor: 25,
      unknown: 10
    };

    const urgencyMultiplier = {
      immediate: 1.5,
      expected: 1.2,
      future: 1.0,
      past: 0.5,
      unknown: 0.8
    };

    for (const event of events) {
      let score = weights[event.severity] || 10;
      score *= urgencyMultiplier[event.urgency] || 1.0;
      
      // Boost score if there are impact estimates
      if (event.impacts.damageEstimate && event.impacts.damageEstimate > 0) {
        score *= 1.3;
      }
      if ((event.impacts.casualties || 0) > 0 || (event.impacts.injuries || 0) > 0) {
        score *= 1.5;
      }

      totalScore += score;
    }

    // Normalize to 0-100 scale
    const avgScore = totalScore / events.length;
    return Math.min(Math.round(avgScore), 100);
  }

  /**
   * Get risk level from score
   */
  private getRiskLevel(score: number): 'extreme' | 'high' | 'moderate' | 'low' | 'minimal' {
    if (score >= 80) return 'extreme';
    if (score >= 60) return 'high';
    if (score >= 40) return 'moderate';
    if (score >= 20) return 'low';
    return 'minimal';
  }

  /**
   * Generate insights from events
   */
  private generateInsights(events: UnifiedEvent[], since: Date) {
    const now = new Date();
    
    return {
      activeAlerts: events.filter(e => 
        e.urgency === 'immediate' || e.urgency === 'expected'
      ).length,
      historicalEvents: events.filter(e => 
        e.source === 'NOAA' || (e.startTime && e.startTime < since)
      ).length,
      environmentalThreats: events.filter(e => 
        e.source === 'AMBEE' || e.source === 'XWEATHER'
      ).length,
      totalEstimatedDamage: events.reduce((sum, e) => 
        sum + (e.impacts.damageEstimate || 0), 0
      )
    };
  }

  /**
   * Count events by source
   */
  private countBySource(events: UnifiedEvent[]): Record<string, number> {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      counts[e.source] = (counts[e.source] || 0) + 1;
    });
    return counts;
  }

  /**
   * Count events by severity
   */
  private countBySeverity(events: UnifiedEvent[]): Record<string, number> {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      counts[e.severity] = (counts[e.severity] || 0) + 1;
    });
    return counts;
  }

  // ========== PROVIDER IMPLEMENTATIONS ==========

  /**
   * NWS Weather Alerts Provider
   */
  private createNWSProvider(): Provider {
    return {
      name: 'NWS',
      fetch: async (lat, lon, radiusKm, since) => {
        try {
          const alerts = await weatherService.getWeatherAlerts(lat, lon);
          const events: UnifiedEvent[] = [];

          for (const alert of alerts) {
            events.push({
              id: `nws-${alert.id}`,
              source: 'NWS',
              eventType: alert.alertType,
              headline: alert.title,
              description: alert.description,
              severity: this.mapNWSSeverity(alert.severity),
              urgency: this.mapNWSUrgency(alert.urgency || 'Unknown'),
              certainty: this.mapNWSCertainty(alert.certainty || 'Unknown'),
              startTime: alert.startTime,
              endTime: alert.endTime || null,
              location: { lat, lon },
              affectedArea: alert.areas.join(', ') || 'Unknown area',
              geometry: alert.geometry || null,
              impacts: {},
              metadata: {
                category: alert.category,
                responseType: alert.responseType,
                nwsId: alert.nwsId
              }
            });
          }

          return events;
        } catch (error) {
          console.error('NWS provider error:', error);
          return [];
        }
      }
    };
  }

  /**
   * FEMA Disaster Declarations Provider
   * Note: FEMA data is state/county based, not radius-based
   * Would require reverse geocoding to map lat/lon to state for proper integration
   */
  private createFEMAProvider(): Provider {
    return {
      name: 'FEMA',
      fetch: async (lat, lon, radiusKm, since) => {
        try {
          // TODO: Implement reverse geocoding to get state code from lat/lon
          // Then use: femaDisasterService.getRecentDisastersForState(stateCode)
          // For MVP, FEMA integration requires geocoding enhancement
          return [];
        } catch (error) {
          console.error('FEMA provider error:', error);
          return [];
        }
      }
    };
  }

  /**
   * NOAA Historical Storm Events Provider
   * Note: NOAA data is also state/county based
   * Would require reverse geocoding and historical county lookup
   */
  private createNOAAProvider(): Provider {
    return {
      name: 'NOAA',
      fetch: async (lat, lon, radiusKm, since) => {
        try {
          // TODO: Implement reverse geocoding to get state/county
          // Then use: noaaStormEventsService.processNOAAData() with county filter
          // For MVP, NOAA integration requires geocoding enhancement
          return [];
        } catch (error) {
          console.error('NOAA provider error:', error);
          return [];
        }
      }
    };
  }

  /**
   * Xweather Storm Intelligence Provider
   */
  private createXweatherProvider(): Provider {
    return {
      name: 'XWEATHER',
      fetch: async (lat, lon, radiusKm, since) => {
        try {
          const threats = await xweatherService.getComprehensiveStormData(lat, lon, radiusKm);
          const events: UnifiedEvent[] = [];

          // Lightning threats
          if (threats.lightning.recentStrikes && threats.lightning.recentStrikes.length > 0) {
            events.push({
              id: `xw-lightning-${Date.now()}`,
              source: 'XWEATHER',
              eventType: 'Lightning',
              headline: `${threats.lightning.recentStrikes.length} lightning strikes detected`,
              description: 'Active lightning activity in area',
              severity: 'severe',
              urgency: 'immediate',
              certainty: 'observed',
              startTime: new Date(),
              endTime: null,
              location: { lat, lon },
              affectedArea: `${radiusKm}km radius`,
              geometry: null,
              impacts: {},
              metadata: { strikes: threats.lightning.recentStrikes }
            });
          }

          // Hail threats
          if (threats.hail.threats && threats.hail.threats.length > 0) {
            const maxHail = Math.max(...threats.hail.threats.flatMap(h => 
              h.periods?.map(p => p.hail.sizeIN) || [0]
            ));
            events.push({
              id: `xw-hail-${Date.now()}`,
              source: 'XWEATHER',
              eventType: 'Hail',
              headline: `Hail threat up to ${maxHail.toFixed(1)}" detected`,
              description: 'Hail activity predicted in area',
              severity: maxHail > 2 ? 'extreme' : maxHail > 1 ? 'severe' : 'moderate',
              urgency: 'expected',
              certainty: 'likely',
              startTime: new Date(),
              endTime: null,
              location: { lat, lon },
              affectedArea: `${radiusKm}km radius`,
              geometry: null,
              impacts: {},
              metadata: { threats: threats.hail.threats }
            });
          }

          return events;
        } catch (error) {
          console.error('Xweather provider error:', error);
          return [];
        }
      }
    };
  }

  /**
   * Ambee Environmental Intelligence Provider
   */
  private createAmbeeProvider(): Provider {
    return {
      name: 'AMBEE',
      fetch: async (lat, lon, radiusKm, since) => {
        try {
          const events: UnifiedEvent[] = [];

          // Fetch air quality and fire data in parallel
          const [airQuality, fireData] = await Promise.all([
            ambeeService.getAirQualityByCoordinates(lat, lon).catch(() => null),
            ambeeService.getFireDataByCoordinates(lat, lon).catch(() => null)
          ]);

          // Air quality threats
          if (airQuality && airQuality.AQI > 150) {
            events.push({
              id: `ambee-aqi-${Date.now()}`,
              source: 'AMBEE',
              eventType: 'Air Quality',
              headline: `Poor air quality detected (AQI: ${airQuality.AQI})`,
              description: `Unhealthy air quality conditions - ${airQuality.category || 'Unknown'}`,
              severity: airQuality.AQI > 200 ? 'severe' : 'moderate',
              urgency: 'immediate',
              certainty: 'observed',
              startTime: new Date(),
              endTime: null,
              location: { lat, lon },
              affectedArea: 'Local area',
              geometry: null,
              impacts: {},
              metadata: { aqi: airQuality.AQI, pollutants: airQuality.pollutants }
            });
          }

          // Fire/disaster detection
          if (fireData && fireData.data && fireData.data.length > 0) {
            const fire = fireData.data[0];
            events.push({
              id: `ambee-fire-${Date.now()}`,
              source: 'AMBEE',
              eventType: 'Wildfire',
              headline: `Fire detected ${fire.distance || 'nearby'}`,
              description: 'Active fire detected in area',
              severity: 'extreme',
              urgency: 'immediate',
              certainty: 'observed',
              startTime: new Date(),
              endTime: null,
              location: { lat, lon },
              affectedArea: `${fire.distance || 'unknown distance'}`,
              geometry: null,
              impacts: {},
              metadata: fire
            });
          }

          return events;
        } catch (error) {
          console.error('Ambee provider error:', error);
          return [];
        }
      }
    };
  }

  /**
   * Tomorrow.io Premium Weather Intelligence Provider
   * Hyperlocal hail/wind footprints and severe weather alerts
   */
  private createTomorrowProvider(): Provider {
    return {
      name: 'TOMORROW',
      fetch: async (lat, lon, radiusKm, since) => {
        try {
          const weatherData = await tomorrowService.getWeatherIntelligence(lat, lon, radiusKm);
          const events: UnifiedEvent[] = [];

          // Hail events
          for (const hailEvent of weatherData.hailEvents) {
            events.push({
              id: `tomorrow-hail-${hailEvent.startTime}`,
              source: 'TOMORROW',
              eventType: 'Hail',
              headline: `Hail threat up to ${hailEvent.values.hailSize}" detected`,
              description: `Hail probability: ${hailEvent.values.hailProbability}%, intensity: ${hailEvent.values.hailIntensity}`,
              severity: hailEvent.values.hailSize > 2 ? 'extreme' : hailEvent.values.hailSize > 1 ? 'severe' : 'moderate',
              urgency: 'expected',
              certainty: hailEvent.values.hailProbability > 70 ? 'likely' : 'possible',
              startTime: new Date(hailEvent.startTime),
              endTime: hailEvent.endTime ? new Date(hailEvent.endTime) : null,
              location: { lat, lon },
              affectedArea: `${radiusKm}km radius`,
              geometry: null,
              impacts: {
                damageEstimate: hailEvent.values.hailSize > 1.5 ? 50000 : 10000
              },
              metadata: hailEvent.values
            });
          }

          // Wind events
          for (const windEvent of weatherData.windEvents) {
            events.push({
              id: `tomorrow-wind-${windEvent.startTime}`,
              source: 'TOMORROW',
              eventType: 'High Wind',
              headline: `High winds up to ${windEvent.values.windGust} mph forecasted`,
              description: `Wind speed: ${windEvent.values.windSpeed} mph, gusts: ${windEvent.values.windGust} mph`,
              severity: windEvent.values.windGust > 70 ? 'extreme' : windEvent.values.windGust > 50 ? 'severe' : 'moderate',
              urgency: 'expected',
              certainty: 'likely',
              startTime: new Date(windEvent.startTime),
              endTime: windEvent.endTime ? new Date(windEvent.endTime) : null,
              location: { lat, lon },
              affectedArea: `${radiusKm}km radius`,
              geometry: null,
              impacts: {},
              metadata: windEvent.values
            });
          }

          // Weather alerts
          for (const alert of weatherData.alerts) {
            events.push({
              id: `tomorrow-alert-${alert.startTime}`,
              source: 'TOMORROW',
              eventType: alert.eventType,
              headline: alert.headline,
              description: alert.description,
              severity: alert.severity,
              urgency: alert.urgency,
              certainty: alert.certainty,
              startTime: new Date(alert.startTime),
              endTime: new Date(alert.endTime),
              location: { lat, lon },
              affectedArea: `${radiusKm}km radius`,
              geometry: null,
              impacts: {},
              metadata: alert
            });
          }

          return events;
        } catch (error) {
          console.error('Tomorrow.io provider error:', error);
          return [];
        }
      }
    };
  }

  // ========== MAPPING HELPERS ==========

  private mapNWSSeverity(severity: string): UnifiedEvent['severity'] {
    const map: Record<string, UnifiedEvent['severity']> = {
      'Extreme': 'extreme',
      'Severe': 'severe',
      'Moderate': 'moderate',
      'Minor': 'minor'
    };
    return map[severity] || 'unknown';
  }

  private mapNWSUrgency(urgency: string): UnifiedEvent['urgency'] {
    const map: Record<string, UnifiedEvent['urgency']> = {
      'Immediate': 'immediate',
      'Expected': 'expected',
      'Future': 'future',
      'Past': 'past'
    };
    return map[urgency] || 'unknown';
  }

  private mapNWSCertainty(certainty: string): UnifiedEvent['certainty'] {
    const map: Record<string, UnifiedEvent['certainty']> = {
      'Observed': 'observed',
      'Likely': 'likely',
      'Possible': 'possible',
      'Unlikely': 'unlikely'
    };
    return map[certainty] || 'unknown';
  }
}

// Export singleton instance
export const disasterAggregatorService = DisasterAggregatorService.getInstance();
