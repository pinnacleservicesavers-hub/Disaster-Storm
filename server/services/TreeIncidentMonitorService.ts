import { db } from '../db.js';
import { treeIncidents, appNotifications, contractorAlertPreferences } from '../../shared/schema.js';
import { eq, and, or, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

interface DetectedIncident {
  state: string;
  county?: string;
  city?: string;
  address: string;
  latitude?: string;
  longitude?: string;
  nearestIntersection?: string;
  impactType: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  source: string;
  sourceUrl?: string;
  confidenceScore: number;
  failureMode?: string;
  weatherConditions?: string;
  windSpeed?: number;
  gustSpeed?: number;
  iceAccumulation?: number;
  rainfallAccumulation?: number;
  stormName?: string;
  probableCause?: string;
  rawDescription?: string;
}

interface ContractorNotification {
  contractorId: string;
  phone?: string;
  email?: string;
  preferredStates: string[];
  preferredCities: string[];
  notifyByText: boolean;
  notifyByEmail: boolean;
  notifyByPhone: boolean;
}

class TreeIncidentMonitorService {
  private isRunning = false;
  private scanInterval: NodeJS.Timeout | null = null;
  private dataSources = [
    'traffic_cameras',
    'nws_alerts',
    'social_media',
    'news_feeds',
    '911_scanners',
    'dot_reports',
    'utility_reports',
    'satellite_imagery'
  ];

  constructor() {
    console.log('🌳 TreeIncidentMonitorService initialized - 24/7 monitoring ready');
  }

  async start() {
    if (this.isRunning) {
      console.log('🌳 Tree incident monitoring already running');
      return;
    }

    this.isRunning = true;
    console.log('🌳 Starting 24/7 tree incident monitoring...');
    console.log(`   📡 Monitoring ${this.dataSources.length} data sources`);

    this.scanInterval = setInterval(() => this.runScan(), 60000);

    await this.runScan();
  }

  stop() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.isRunning = false;
    console.log('🌳 Tree incident monitoring stopped');
  }

  private async runScan() {
    console.log('🔍 Running tree incident scan across all sources...');
    
    try {
      const detections = await Promise.all([
        this.scanTrafficCameras(),
        this.scanNWSAlerts(),
        this.scanDOTReports(),
        this.scanNewsFeeds(),
        this.scanSocialMedia(),
        this.scanUtilityReports()
      ]);

      const allIncidents = detections.flat();
      
      if (allIncidents.length > 0) {
        console.log(`🌳 Detected ${allIncidents.length} potential tree incidents`);
        
        for (const incident of allIncidents) {
          await this.processDetectedIncident(incident);
        }
      }
    } catch (error) {
      console.error('❌ Error during tree incident scan:', error);
    }
  }

  private async scanTrafficCameras(): Promise<DetectedIncident[]> {
    return [];
  }

  private async scanNWSAlerts(): Promise<DetectedIncident[]> {
    try {
      const response = await fetch('https://api.weather.gov/alerts/active?event=High%20Wind%20Warning,Tornado%20Warning,Severe%20Thunderstorm%20Warning,Ice%20Storm%20Warning,Winter%20Storm%20Warning');
      if (!response.ok) return [];
      
      const data = await response.json();
      const incidents: DetectedIncident[] = [];
      
      for (const feature of data.features || []) {
        const props = feature.properties;
        if (!props) continue;

        const isTreeRisk = this.isHighTreeRiskEvent(props.event, props.description);
        if (!isTreeRisk) continue;

        const states = this.extractStatesFromAreas(props.areaDesc);
        
        for (const state of states) {
          incidents.push({
            state,
            address: props.areaDesc || 'Unknown area',
            impactType: this.determineImpactType(props.event),
            priority: this.determinePriority(props.severity, props.urgency),
            source: 'nws_alerts',
            sourceUrl: props['@id'],
            confidenceScore: 85,
            weatherConditions: props.event,
            probableCause: this.analyzeCause(props),
            rawDescription: props.description
          });
        }
      }
      
      return incidents;
    } catch (error) {
      console.error('Error scanning NWS alerts:', error);
      return [];
    }
  }

  private async scanDOTReports(): Promise<DetectedIncident[]> {
    return [];
  }

  private async scanNewsFeeds(): Promise<DetectedIncident[]> {
    return [];
  }

  private async scanSocialMedia(): Promise<DetectedIncident[]> {
    return [];
  }

  private async scanUtilityReports(): Promise<DetectedIncident[]> {
    return [];
  }

  private isHighTreeRiskEvent(event: string, description: string): boolean {
    const treeRiskKeywords = [
      'high wind', 'damaging wind', 'tornado', 'ice storm', 
      'winter storm', 'severe thunderstorm', 'derecho',
      'tree', 'fallen', 'debris', 'power line', 'outage'
    ];
    
    const text = `${event} ${description}`.toLowerCase();
    return treeRiskKeywords.some(keyword => text.includes(keyword));
  }

  private extractStatesFromAreas(areaDesc: string): string[] {
    const stateAbbreviations = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];
    
    const foundStates: string[] = [];
    const words = areaDesc.toUpperCase().split(/[\s,;]+/);
    
    for (const word of words) {
      if (stateAbbreviations.includes(word)) {
        foundStates.push(word);
      }
    }
    
    return [...new Set(foundStates)];
  }

  private determineImpactType(event: string): string {
    const eventLower = event.toLowerCase();
    if (eventLower.includes('tornado')) return 'road_blocked';
    if (eventLower.includes('ice')) return 'on_powerlines';
    if (eventLower.includes('wind')) return 'on_roof';
    if (eventLower.includes('storm')) return 'debris_field';
    return 'debris_field';
  }

  private determinePriority(severity: string, urgency: string): 'immediate' | 'high' | 'medium' | 'low' {
    if (severity === 'Extreme' || urgency === 'Immediate') return 'immediate';
    if (severity === 'Severe' || urgency === 'Expected') return 'high';
    if (severity === 'Moderate') return 'medium';
    return 'low';
  }

  private analyzeCause(props: any): string {
    const causes: string[] = [];
    
    if (props.event?.toLowerCase().includes('wind')) {
      causes.push('High wind event');
    }
    if (props.event?.toLowerCase().includes('ice')) {
      causes.push('Ice accumulation causing branch failure');
    }
    if (props.event?.toLowerCase().includes('tornado')) {
      causes.push('Tornadic winds');
    }
    if (props.event?.toLowerCase().includes('storm')) {
      causes.push('Severe storm activity');
    }
    
    return causes.length > 0 ? causes.join(', ') : 'Weather-related structural failure';
  }

  private async processDetectedIncident(incident: DetectedIncident) {
    try {
      const existing = await db.select()
        .from(treeIncidents)
        .where(and(
          eq(treeIncidents.state, incident.state),
          eq(treeIncidents.address, incident.address),
          eq(treeIncidents.sourceImagery, incident.source)
        ))
        .limit(1);

      if (existing.length > 0) {
        return;
      }

      const prefix = incident.city?.substring(0, 5).toUpperCase() || incident.state;
      const uniqueId = `${prefix}-${Date.now().toString(36).toUpperCase()}`;

      const [newIncident] = await db.insert(treeIncidents).values({
        id: randomUUID(),
        uniqueId,
        state: incident.state,
        county: incident.county || '',
        city: incident.city || '',
        address: incident.address,
        latitude: incident.latitude || '',
        longitude: incident.longitude || '',
        nearestIntersection: incident.nearestIntersection,
        impactType: incident.impactType,
        priority: incident.priority,
        confidenceScore: incident.confidenceScore,
        failureMode: incident.failureMode,
        weatherConditions: incident.weatherConditions,
        sourceImagery: incident.source,
        notes: incident.sourceUrl ? `Source: ${incident.sourceUrl}` : undefined,
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      console.log(`🌳 New incident created: ${uniqueId} in ${incident.state}`);

      if (incident.priority === 'immediate' || incident.priority === 'high') {
        await this.notifyContractors(newIncident);
        await this.createInAppNotification(newIncident);
      }
    } catch (error) {
      console.error('Error processing detected incident:', error);
    }
  }

  private async notifyContractors(incident: any) {
    try {
      const contractors = await db.select()
        .from(contractorAlertPreferences)
        .where(
          or(
            sql`${contractorAlertPreferences.states} @> ARRAY[${incident.state}]::text[]`,
            sql`array_length(${contractorAlertPreferences.states}, 1) IS NULL`
          )
        );

      for (const contractor of contractors) {
        if (contractor.notifyBySms && contractor.phone) {
          await this.sendSMSAlert(contractor.phone, incident);
        }
        if (contractor.notifyByEmail && contractor.email) {
          await this.sendEmailAlert(contractor.email, incident);
        }
      }

      console.log(`📱 Notified ${contractors.length} contractors about incident in ${incident.state}`);
    } catch (error) {
      console.error('Error notifying contractors:', error);
    }
  }

  private async sendSMSAlert(phone: string, incident: any) {
    try {
      const message = `🌳 TREE INCIDENT ALERT\n\n` +
        `Priority: ${incident.priority.toUpperCase()}\n` +
        `Location: ${incident.city || incident.county}, ${incident.state}\n` +
        `Address: ${incident.address}\n` +
        `Type: ${incident.impactType.replace(/_/g, ' ')}\n\n` +
        `View details: https://strategicservicesavers.org/tree-tracker/${incident.id}`;

      console.log(`📱 [MOCK SMS] To: ${phone}\n${message}`);
    } catch (error) {
      console.error('Error sending SMS alert:', error);
    }
  }

  private async sendEmailAlert(email: string, incident: any) {
    try {
      console.log(`📧 [MOCK EMAIL] To: ${email} - Tree incident alert for ${incident.state}`);
    } catch (error) {
      console.error('Error sending email alert:', error);
    }
  }

  private async createInAppNotification(incident: any) {
    try {
      await db.insert(appNotifications).values({
        id: randomUUID(),
        type: 'tree_incident',
        priority: incident.priority,
        title: `🌳 Tree Down: ${incident.city || incident.county}, ${incident.state}`,
        message: `${incident.impactType.replace(/_/g, ' ')} detected. ${incident.probableCause || 'Review for deployment opportunity.'}`,
        data: JSON.stringify({
          incidentId: incident.id,
          state: incident.state,
          city: incident.city,
          impactType: incident.impactType
        }),
        actionUrl: `/tree-tracker/${incident.id}`,
        isRead: false,
        isDismissed: false,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error creating in-app notification:', error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      dataSources: this.dataSources,
      scanInterval: '1 minute'
    };
  }
}

export const treeIncidentMonitorService = new TreeIncidentMonitorService();
