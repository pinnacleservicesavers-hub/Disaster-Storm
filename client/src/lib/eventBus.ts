// Lightweight Event Bus (pub/sub) for Storm Ops module communication
// Enables modules to pass data without tight coupling

type EventCallback = (data?: any) => void;

interface EventBusInterface {
  // Subscribe to events
  on(event: string, callback: EventCallback): () => void;
  
  // Publish events
  emit(event: string, data?: any): void;
  
  // Remove all listeners for an event
  off(event: string): void;
  
  // Remove all listeners
  clear(): void;
  
  // Get current listeners count for debugging
  getListenerCount(event?: string): number;
}

class EventBus implements EventBusInterface {
  private listeners: { [event: string]: EventCallback[] } = {};

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners[event]?.indexOf(callback);
      if (index !== undefined && index > -1) {
        this.listeners[event].splice(index, 1);
      }
    };
  }

  emit(event: string, data?: any): void {
    const callbacks = this.listeners[event];
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  off(event: string): void {
    delete this.listeners[event];
  }

  clear(): void {
    this.listeners = {};
  }

  getListenerCount(event?: string): number {
    if (event) {
      return this.listeners[event]?.length || 0;
    }
    return Object.values(this.listeners).reduce((total, listeners) => total + listeners.length, 0);
  }
}

// Global event bus instance
export const stormOpsEventBus = new EventBus();

// Predefined event types as mentioned in the document
export const STORM_OPS_EVENTS = {
  // Weather Center & Storm Predictions
  WEATHER: {
    FORECAST: 'WEATHER.FORECAST',
    ALERT: 'WEATHER.ALERT',
    CONDITIONS_UPDATE: 'WEATHER.CONDITIONS_UPDATE'
  },
  
  // Storm Predictions
  STORM: {
    RISKMAP: 'STORM.RISKMAP',
    PREDICTION_UPDATE: 'STORM.PREDICTION_UPDATE',
    LANDFALL_ALERT: 'STORM.LANDFALL_ALERT'
  },
  
  // Eyes in the Sky & Drone Operation
  DRONE: {
    MEDIA_NEW: 'DRONE.MEDIA.NEW',
    STATUS_UPDATE: 'DRONE.STATUS_UPDATE',
    MISSION_START: 'DRONE.MISSION_START',
    MISSION_COMPLETE: 'DRONE.MISSION_COMPLETE',
    FEED_UPDATE: 'DRONE.FEED_UPDATE'
  },
  
  // Traffic Cam Watcher
  TRAFFIC: {
    CAM_ALERT: 'TRAFFIC.CAM_ALERT',
    ROUTE_UPDATE: 'TRAFFIC.ROUTE_UPDATE',
    CONGESTION_ALERT: 'TRAFFIC.CONGESTION_ALERT',
    EVACUATION_ROUTE: 'TRAFFIC.EVACUATION_ROUTE'
  },
  
  // AI Damage Detection
  DAMAGE: {
    FINDINGS: 'DAMAGE.FINDINGS',
    DETECTION_COMPLETE: 'DAMAGE.DETECTION_COMPLETE',
    MEASUREMENT_UPDATE: 'DAMAGE.MEASUREMENT_UPDATE',
    AREA_ANALYSIS: 'DAMAGE.AREA_ANALYSIS'
  },
  
  // Disaster Lens
  LENS: {
    PHOTO_CAPTURED: 'LENS.PHOTO_CAPTURED',
    MEASUREMENT_TAKEN: 'LENS.MEASUREMENT_TAKEN',
    ANNOTATION_ADDED: 'LENS.ANNOTATION_ADDED',
    PROJECT_UPDATE: 'LENS.PROJECT_UPDATE'
  },
  
  // Claims Central
  CLAIM: {
    STATUS_UPDATE: 'CLAIM.STATUS.UPDATE',
    REPORT_GENERATED: 'CLAIM.REPORT_GENERATED',
    ADJUSTER_NOTIFICATION: 'CLAIM.ADJUSTER_NOTIFICATION',
    DOCUMENTATION_COMPLETE: 'CLAIM.DOCUMENTATION_COMPLETE'
  },
  
  // Lead Management
  LEAD: {
    NEW: 'JOB.NEW',
    ASSIGNED: 'LEAD.ASSIGNED',
    STATUS_UPDATE: 'LEAD.STATUS_UPDATE',
    ESTIMATE_COMPLETE: 'LEAD.ESTIMATE_COMPLETE'
  },
  
  // Victim Portal & Customer Hub
  CUSTOMER: {
    PHOTO_SUBMITTED: 'CUSTOMER.PHOTO_SUBMITTED',
    STATUS_REQUEST: 'CUSTOMER.STATUS_REQUEST',
    COMMUNICATION_UPDATE: 'CUSTOMER.COMMUNICATION_UPDATE',
    FEEDBACK_RECEIVED: 'CUSTOMER.FEEDBACK_RECEIVED'
  },
  
  // Contractor Portal & Command
  CONTRACTOR: {
    JOB_ACCEPTED: 'CONTRACTOR.JOB_ACCEPTED',
    COMPLIANCE_UPDATE: 'CONTRACTOR.COMPLIANCE_UPDATE',
    STATUS_UPDATE: 'CONTRACTOR.STATUS_UPDATE',
    SCHEDULE_UPDATE: 'CONTRACTOR.SCHEDULE_UPDATE'
  },
  
  // Storm Share
  SHARE: {
    CONTENT_POSTED: 'SHARE.CONTENT_POSTED',
    MAP_UPDATE: 'SHARE.MAP_UPDATE',
    COMMUNITY_ALERT: 'SHARE.COMMUNITY_ALERT',
    COLLABORATION_REQUEST: 'SHARE.COLLABORATION_REQUEST'
  },
  
  // Disaster Essentials Marketplace
  MARKETPLACE: {
    ORDER_PLACED: 'MARKETPLACE.ORDER_PLACED',
    INVENTORY_UPDATE: 'MARKETPLACE.INVENTORY_UPDATE',
    DELIVERY_STATUS: 'MARKETPLACE.DELIVERY_STATUS',
    SUPPLY_ALERT: 'MARKETPLACE.SUPPLY_ALERT'
  }
} as const;

// Type-safe event emitters for common patterns
export const weatherEventEmitter = {
  publishForecast: (forecast: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.WEATHER.FORECAST, forecast),
  publishAlert: (alert: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.WEATHER.ALERT, alert),
  publishConditionsUpdate: (conditions: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.WEATHER.CONDITIONS_UPDATE, conditions)
};

export const stormEventEmitter = {
  publishRiskMap: (riskMap: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.STORM.RISKMAP, riskMap),
  publishPredictionUpdate: (prediction: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.STORM.PREDICTION_UPDATE, prediction),
  publishLandfallAlert: (alert: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.STORM.LANDFALL_ALERT, alert)
};

export const droneEventEmitter = {
  publishNewMedia: (media: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.DRONE.MEDIA_NEW, media),
  publishStatusUpdate: (status: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.DRONE.STATUS_UPDATE, status),
  publishMissionStart: (mission: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.DRONE.MISSION_START, mission),
  publishMissionComplete: (mission: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.DRONE.MISSION_COMPLETE, mission)
};

export const damageEventEmitter = {
  publishFindings: (findings: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.DAMAGE.FINDINGS, findings),
  publishDetectionComplete: (detection: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.DAMAGE.DETECTION_COMPLETE, detection),
  publishMeasurementUpdate: (measurement: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.DAMAGE.MEASUREMENT_UPDATE, measurement)
};

export const claimEventEmitter = {
  publishStatusUpdate: (claim: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.CLAIM.STATUS_UPDATE, claim),
  publishReportGenerated: (report: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.CLAIM.REPORT_GENERATED, report),
  publishAdjusterNotification: (notification: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.CLAIM.ADJUSTER_NOTIFICATION, notification)
};

export const leadEventEmitter = {
  publishNewJob: (job: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.LEAD.NEW, job),
  publishJobAssigned: (assignment: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.LEAD.ASSIGNED, assignment),
  publishStatusUpdate: (status: any) => stormOpsEventBus.emit(STORM_OPS_EVENTS.LEAD.STATUS_UPDATE, status)
};

// Hook for React components to easily subscribe to events
import { useEffect } from 'react';

export const useStormOpsEvent = (event: string, callback: EventCallback) => {
  useEffect(() => {
    const unsubscribe = stormOpsEventBus.on(event, callback);
    return unsubscribe;
  }, [event, callback]);
};

// Development helper to log all events
export const enableEventLogging = (enabled: boolean = true) => {
  if (enabled && typeof window !== 'undefined') {
    Object.values(STORM_OPS_EVENTS).forEach(category => {
      Object.values(category).forEach(event => {
        stormOpsEventBus.on(event, (data) => {
          console.log(`[StormOps Event] ${event}:`, data);
        });
      });
    });
  }
};

export default stormOpsEventBus;