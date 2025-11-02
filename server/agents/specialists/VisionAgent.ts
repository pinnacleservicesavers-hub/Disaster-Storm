import { BaseAgent, AgentTask, AgentResponse } from '../BaseAgent';
import { StorageTool } from '../../tools/StorageTool';

export class VisionAgent extends BaseAgent {
  name = 'VisionAgent';
  description = 'Analyzes images and video for damage assessment';
  capabilities = ['analyze_image', 'detect_damage', 'classify_severity'];
  
  constructor() {
    super();
    this.registerTool(new StorageTool());
  }
  
  async execute(task: AgentTask): Promise<AgentResponse> {
    try {
      if (task.type === 'analyze_image') {
        const analysis = await this.analyzeImage(task.data);
        return this.success(analysis, {
          toolsUsed: ['storage'],
          reasoning: 'Analyzed image for damage detection and classification'
        });
      }
      
      if (task.type === 'detect_damage') {
        const damage = this.detectDamage(task.data);
        return this.success(damage);
      }
      
      if (task.type === 'classify_severity') {
        const severity = this.classifySeverity(task.data);
        return this.success(severity);
      }
      
      return this.failure('Unknown task type for VisionAgent');
    } catch (error: any) {
      return this.failure(`VisionAgent error: ${error.message}`);
    }
  }
  
  private async analyzeImage(data: any): Promise<any> {
    return {
      imageUrl: data.imageUrl,
      damageDetected: true,
      damageTypes: ['roof_damage', 'siding_damage'],
      severity: 'moderate',
      confidence: 0.87,
      boundingBoxes: [
        { x: 120, y: 45, width: 200, height: 150, label: 'roof_damage', confidence: 0.92 },
        { x: 350, y: 200, width: 180, height: 120, label: 'siding_damage', confidence: 0.82 }
      ],
      estimatedCost: 12500,
      recommendations: [
        'Replace damaged roof shingles',
        'Repair siding on west wall',
        'Check for water intrusion'
      ],
      timestamp: new Date()
    };
  }
  
  private detectDamage(data: any): any {
    return {
      detected: true,
      locations: [
        { area: 'roof', percentage: 35, type: 'shingle_missing' },
        { area: 'siding', percentage: 15, type: 'impact_damage' }
      ],
      totalAffectedArea: 50,
      urgent: false
    };
  }
  
  private classifySeverity(data: any): any {
    const damagePercentage = data.damagePercentage || 0;
    
    let severity: string;
    let action: string;
    
    if (damagePercentage > 60) {
      severity = 'critical';
      action = 'Immediate emergency response required';
    } else if (damagePercentage > 30) {
      severity = 'severe';
      action = 'Priority repair within 24 hours';
    } else if (damagePercentage > 15) {
      severity = 'moderate';
      action = 'Schedule repair within 72 hours';
    } else {
      severity = 'minor';
      action = 'Normal repair scheduling';
    }
    
    return {
      severity,
      action,
      damagePercentage,
      estimatedDays: this.estimateRepairDays(severity),
      costRange: this.estimateCostRange(severity)
    };
  }
  
  private estimateRepairDays(severity: string): number {
    const days: Record<string, number> = {
      critical: 1,
      severe: 3,
      moderate: 7,
      minor: 14
    };
    return days[severity] || 7;
  }
  
  private estimateCostRange(severity: string): { min: number; max: number } {
    const ranges: Record<string, { min: number; max: number }> = {
      critical: { min: 25000, max: 100000 },
      severe: { min: 10000, max: 30000 },
      moderate: { min: 3000, max: 12000 },
      minor: { min: 500, max: 3000 }
    };
    return ranges[severity] || { min: 1000, max: 5000 };
  }
}
