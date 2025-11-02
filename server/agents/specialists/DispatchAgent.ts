import { BaseAgent, AgentTask, AgentResponse } from '../BaseAgent';
import { TwilioSMSTool } from '../../tools/TwilioTool';

export class DispatchAgent extends BaseAgent {
  name = 'DispatchAgent';
  description = 'Coordinates contractor deployment to job sites';
  capabilities = ['dispatch_contractor', 'notify_homeowner', 'schedule_job'];
  
  constructor() {
    super();
    this.registerTool(new TwilioSMSTool());
  }
  
  async execute(task: AgentTask): Promise<AgentResponse> {
    try {
      if (task.type === 'dispatch_contractor') {
        const smsResult = await this.useTool('twilio_sms', {
          to: task.data.contractorPhone,
          message: `New job assignment: ${task.data.jobDescription}. Location: ${task.data.address}. Priority: ${task.data.priority || 'normal'}`
        });
        
        if (!smsResult.success) {
          return this.failure(`Failed to notify contractor: ${smsResult.error}`);
        }
        
        return this.success({
          dispatched: true,
          contractorId: task.data.contractorId,
          jobId: task.data.jobId,
          notified: smsResult.data,
          estimatedArrival: this.calculateETA(task.data)
        }, {
          toolsUsed: ['twilio_sms'],
          reasoning: 'Dispatched contractor and sent SMS notification'
        });
      }
      
      if (task.type === 'notify_homeowner') {
        const smsResult = await this.useTool('twilio_sms', {
          to: task.data.homeownerPhone,
          message: `Update on your job: ${task.data.message}`
        });
        
        return this.success({
          notified: true,
          homeownerId: task.data.homeownerId,
          messageId: smsResult.data?.messageId
        });
      }
      
      return this.failure('Unknown task type for DispatchAgent');
    } catch (error: any) {
      return this.failure(`DispatchAgent error: ${error.message}`);
    }
  }
  
  private calculateETA(data: any): string {
    const baseTime = 30; // minutes
    const priorityMultiplier = data.priority === 'urgent' ? 0.5 : 1;
    return `${Math.floor(baseTime * priorityMultiplier)} minutes`;
  }
}
