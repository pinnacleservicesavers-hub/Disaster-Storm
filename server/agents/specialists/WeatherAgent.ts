import { BaseAgent, AgentTask, AgentResponse } from '../BaseAgent';
import { WeatherDataTool } from '../../tools/WeatherTool';

export class WeatherAgent extends BaseAgent {
  name = 'WeatherAgent';
  description = 'Analyzes weather conditions and hazards for contractor deployment';
  capabilities = ['weather_analysis', 'hazard_detection', 'forecast'];
  
  constructor() {
    super();
    this.registerTool(new WeatherDataTool());
  }
  
  async execute(task: AgentTask): Promise<AgentResponse> {
    try {
      if (task.type === 'weather_analysis') {
        const alerts = await this.useTool('weather_data', {
          action: 'get_alerts',
          state: task.data.state
        });
        
        if (!alerts.success) {
          return this.failure(`Weather alerts lookup failed: ${alerts.error || 'Unknown error'}`);
        }
        
        const hazards = await this.useTool('weather_data', {
          action: 'get_hazards'
        });
        
        if (!hazards.success) {
          return this.failure(`Hazards lookup failed: ${hazards.error || 'Unknown error'}`);
        }
        
        return this.success({
          alerts: alerts.data?.alerts || [],
          hazards: hazards.data?.hazards || [],
          recommendation: this.generateRecommendation(alerts.data, hazards.data),
          timestamp: new Date()
        }, {
          toolsUsed: ['weather_data'],
          reasoning: 'Analyzed current weather conditions and active hazards'
        });
      }
      
      return this.failure('Unknown task type for WeatherAgent');
    } catch (error: any) {
      return this.failure(`WeatherAgent error: ${error.message}`);
    }
  }
  
  private generateRecommendation(alerts: any, hazards: any): string {
    const alertCount = alerts?.alerts?.length || 0;
    const hazardCount = hazards?.hazards?.length || 0;
    
    if (alertCount > 5 || hazardCount > 3) {
      return 'HIGH ALERT: Multiple active hazards. Deploy contractors immediately.';
    } else if (alertCount > 0) {
      return 'MODERATE: Active weather alerts. Monitor conditions closely.';
    }
    return 'NORMAL: No significant hazards detected.';
  }
}
