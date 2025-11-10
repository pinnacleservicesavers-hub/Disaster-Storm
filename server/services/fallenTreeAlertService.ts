import { sendSms } from './twilio.js';
import type { DamageDetection } from './damageDetection.js';
import type { SnapshotCheckResult } from '../detectors/snapshot-check.js';

const TEST_CONTACTS = [
  { name: 'John Culpepper', phone: '+17066044820' },
  { name: 'Shannon Wise', phone: '+17068408949' }
];

export interface TreeAlertNotification {
  id: string;
  timestamp: Date;
  alertType: string;
  description: string;
  location: string;
  cameraName: string;
  state: string;
  coordinates: { lat: number; lng: number };
  confidence: number;
  severity: string;
  estimatedCost?: { min: number; max: number };
  sentTo: string[];
  imageUrl?: string;
}

export class FallenTreeAlertService {
  private recentAlerts: Map<string, TreeAlertNotification> = new Map();
  private alertHistory: TreeAlertNotification[] = [];
  
  constructor() {
    console.log('🌳 FallenTreeAlertService initialized - monitoring for fallen tree detections');
    console.log(`📱 Alert contacts: John Culpepper (+1 706-604-4820), Shannon Wise (+1 706-840-8949)`);
  }

  async processDetection(result: SnapshotCheckResult): Promise<TreeAlertNotification[]> {
    const notifications: TreeAlertNotification[] = [];
    
    if (!result.analysisResult.hasDetection) {
      return notifications;
    }

    const treeDetections = result.analysisResult.detections.filter(detection => 
      this.isTreeRelatedAlert(detection.alertType)
    );

    for (const detection of treeDetections) {
      const notification = await this.sendTreeAlert(result, detection);
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  private isTreeRelatedAlert(alertType: string): boolean {
    return [
      'tree_down',
      'tree_on_powerline',
      'tree_blocking_road',
      'tree_on_vehicle'
    ].includes(alertType);
  }

  async sendTreeAlert(
    result: SnapshotCheckResult,
    detection: DamageDetection
  ): Promise<TreeAlertNotification | null> {
    try {
      const alertKey = `${result.cameraId}-${detection.alertType}-${Math.floor(Date.now() / 60000)}`;
      
      if (this.recentAlerts.has(alertKey)) {
        console.log(`⏭️ Skipping duplicate alert for ${alertKey}`);
        return null;
      }

      const message = this.formatAlertMessage(result, detection);
      const sentTo: string[] = [];

      console.log(`🚨 FALLEN TREE DETECTED - Sending alerts to contractors`);

      for (const contact of TEST_CONTACTS) {
        try {
          await sendSms({
            to: contact.phone,
            message: message
          });
          sentTo.push(contact.name);
          console.log(`✅ SMS sent to ${contact.name} (${contact.phone})`);
        } catch (error) {
          console.error(`❌ Failed to send SMS to ${contact.name}:`, error);
        }
      }

      const notification: TreeAlertNotification = {
        id: alertKey,
        timestamp: new Date(),
        alertType: detection.alertType,
        description: detection.description,
        location: result.cameraInfo.name,
        cameraName: result.cameraInfo.name,
        state: result.cameraInfo.state,
        coordinates: {
          lat: result.cameraInfo.lat,
          lng: result.cameraInfo.lng
        },
        confidence: detection.confidence,
        severity: detection.severity,
        estimatedCost: detection.estimatedCost,
        sentTo
      };

      this.recentAlerts.set(alertKey, notification);
      this.alertHistory.push(notification);

      if (this.recentAlerts.size > 100) {
        const oldestKey = this.recentAlerts.keys().next().value;
        this.recentAlerts.delete(oldestKey);
      }

      if (this.alertHistory.length > 500) {
        this.alertHistory = this.alertHistory.slice(-250);
      }

      return notification;
    } catch (error) {
      console.error('❌ Error sending tree alert:', error);
      return null;
    }
  }

  private formatAlertMessage(
    result: SnapshotCheckResult,
    detection: DamageDetection
  ): string {
    const alertTypeLabel = this.getAlertTypeLabel(detection.alertType);
    const urgencyEmoji = detection.urgencyLevel === 'emergency' ? '🚨' : '⚠️';
    
    let message = `${urgencyEmoji} DISASTER DIRECT ALERT\n\n`;
    message += `${alertTypeLabel}\n`;
    message += `Location: ${result.cameraInfo.name}, ${result.cameraInfo.state}\n`;
    message += `Confidence: ${detection.confidence}%\n`;
    message += `Severity: ${detection.severity.toUpperCase()}\n`;
    
    if (detection.estimatedCost) {
      message += `Est. Job Value: $${detection.estimatedCost.min.toLocaleString()}-$${detection.estimatedCost.max.toLocaleString()}\n`;
    }
    
    message += `\n${detection.description}\n`;
    
    if (detection.safetyHazards && detection.safetyHazards.length > 0) {
      message += `\nHazards: ${detection.safetyHazards.join(', ')}`;
    }

    message += `\n\nView details at: https://disaster-direct.com`;
    
    return message;
  }

  private getAlertTypeLabel(alertType: string): string {
    const labels: Record<string, string> = {
      'tree_down': '🌳 FALLEN TREE DETECTED',
      'tree_on_powerline': '⚡ TREE ON POWER LINE',
      'tree_blocking_road': '🚧 TREE BLOCKING ROAD',
      'tree_on_vehicle': '🚗 TREE ON VEHICLE'
    };
    return labels[alertType] || '🌳 TREE DAMAGE DETECTED';
  }

  getRecentAlerts(limit: number = 50): TreeAlertNotification[] {
    return this.alertHistory.slice(-limit).reverse();
  }

  getAllAlerts(): TreeAlertNotification[] {
    return this.alertHistory.slice().reverse();
  }

  clearAlerts(): void {
    this.recentAlerts.clear();
    this.alertHistory = [];
    console.log('🧹 All tree alerts cleared');
  }
}

export const fallenTreeAlertService = new FallenTreeAlertService();
