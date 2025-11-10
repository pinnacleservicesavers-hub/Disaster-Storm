import { sendSms } from './twilio.js';

interface DeploymentAlert {
  location: string;
  counties: string[];
  severity: string;
  hazardType: string;
  deploymentStatus: 'DEPLOY_NOW' | 'GET_READY' | 'MONITOR';
  estimatedDamage: {
    description: string;
    potentialJobs: number;
    revenueMin: number;
    revenueMax: number;
  };
  timeframe: string;
  actionItems: string[];
}

export class ContractorDeploymentAlertService {
  async sendDeploymentAlert(alert: DeploymentAlert, phoneNumbers: string[]): Promise<void> {
    const message = this.formatDeploymentMessage(alert);
    
    console.log('🚨 SENDING CONTRACTOR DEPLOYMENT ALERT');
    console.log(`📍 Location: ${alert.location}`);
    console.log(`💰 Revenue Potential: $${alert.estimatedDamage.revenueMin.toLocaleString()}-$${alert.estimatedDamage.revenueMax.toLocaleString()}`);
    
    for (const phoneNumber of phoneNumbers) {
      try {
        await sendSms({
          to: phoneNumber,
          message: message
        });
        console.log(`✅ Alert sent to ${phoneNumber}`);
      } catch (error) {
        console.error(`❌ Failed to send to ${phoneNumber}:`, error);
      }
    }
  }

  private formatDeploymentMessage(alert: DeploymentAlert): string {
    const statusEmoji = {
      'DEPLOY_NOW': '🚨',
      'GET_READY': '⚠️',
      'MONITOR': '👀'
    };

    const emoji = statusEmoji[alert.deploymentStatus] || '⚠️';
    
    let message = `${emoji} DISASTER DIRECT CONTRACTOR ALERT\n\n`;
    
    message += `STATUS: ${alert.deploymentStatus.replace('_', ' ')}\n`;
    message += `LOCATION: ${alert.location}\n`;
    message += `HAZARD: ${alert.hazardType}\n`;
    message += `SEVERITY: ${alert.severity}\n\n`;
    
    message += `💰 REVENUE POTENTIAL:\n`;
    message += `Expected Jobs: ${alert.estimatedDamage.potentialJobs}\n`;
    message += `Revenue Range: $${alert.estimatedDamage.revenueMin.toLocaleString()}-$${alert.estimatedDamage.revenueMax.toLocaleString()}\n`;
    message += `${alert.estimatedDamage.description}\n\n`;
    
    message += `⏰ TIMEFRAME: ${alert.timeframe}\n\n`;
    
    if (alert.actionItems.length > 0) {
      message += `📋 ACTION ITEMS:\n`;
      alert.actionItems.forEach((item, i) => {
        message += `${i + 1}. ${item}\n`;
      });
    }
    
    message += `\nDisaster Direct Intelligence`;
    
    return message;
  }
}

export const contractorDeploymentAlertService = new ContractorDeploymentAlertService();
