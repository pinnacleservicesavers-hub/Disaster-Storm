import { BaseAgent, AgentTask, AgentResponse } from '../BaseAgent';
import { PropertyDataTool } from '../../tools/PropertyTool';

export class ClaimAgent extends BaseAgent {
  name = 'ClaimAgent';
  description = 'Processes insurance claims and generates documentation';
  capabilities = ['create_claim', 'analyze_damage', 'generate_report'];
  
  constructor() {
    super();
    this.registerTool(new PropertyDataTool());
  }
  
  async execute(task: AgentTask): Promise<AgentResponse> {
    try {
      if (task.type === 'create_claim') {
        const propertyData = await this.useTool('property_data', {
          action: 'lookup',
          address: task.data.address
        });
        
        const valuation = await this.useTool('property_data', {
          action: 'valuation',
          address: task.data.address
        });
        
        const claimData = {
          claimId: `CLM-${Date.now()}`,
          property: propertyData.data,
          valuation: valuation.data,
          damageType: task.data.damageType,
          estimatedCost: task.data.estimatedCost,
          status: 'draft',
          createdAt: new Date()
        };
        
        return this.success(claimData, {
          toolsUsed: ['property_data'],
          reasoning: 'Created claim with property data and valuation'
        });
      }
      
      if (task.type === 'analyze_damage') {
        return this.success({
          severity: this.assessSeverity(task.data),
          repairCost: this.estimateCost(task.data),
          urgency: this.determineUrgency(task.data),
          recommendations: this.generateRecommendations(task.data)
        });
      }
      
      return this.failure('Unknown task type for ClaimAgent');
    } catch (error: any) {
      return this.failure(`ClaimAgent error: ${error.message}`);
    }
  }
  
  private assessSeverity(data: any): string {
    return data.damageType === 'structural' ? 'severe' : 'moderate';
  }
  
  private estimateCost(data: any): number {
    const baseCost = 5000;
    return baseCost * (data.severity === 'severe' ? 3 : 1.5);
  }
  
  private determineUrgency(data: any): string {
    return data.damageType === 'structural' ? 'urgent' : 'normal';
  }
  
  private generateRecommendations(data: any): string[] {
    return [
      'Document all damage with photos',
      'Secure property to prevent further damage',
      'Contact insurance company within 24 hours'
    ];
  }
}
