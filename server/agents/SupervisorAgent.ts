import { BaseAgent, AgentTask, AgentResponse } from './BaseAgent';
import { eventBus } from '../events/EventBus';

export class SupervisorAgent extends BaseAgent {
  name = 'Supervisor';
  description = 'Routes tasks to specialist agents and enforces guardrails';
  capabilities = ['route', 'coordinate', 'validate'];
  
  private specialists: Map<string, BaseAgent> = new Map();
  private guardrails: Map<string, (task: AgentTask) => boolean> = new Map();
  
  registerSpecialist(agent: BaseAgent): void {
    this.specialists.set(agent.name, agent);
    console.log(`✅ Registered specialist: ${agent.name}`);
  }
  
  registerGuardrail(name: string, check: (task: AgentTask) => boolean): void {
    this.guardrails.set(name, check);
  }
  
  async execute(task: AgentTask): Promise<AgentResponse> {
    try {
      // Validate against guardrails
      for (const [name, check] of this.guardrails.entries()) {
        if (!check(task)) {
          await eventBus.publish('task.blocked', {
            task: task.id,
            guardrail: name,
            timestamp: new Date()
          });
          return this.failure(`Task blocked by guardrail: ${name}`);
        }
      }
      
      // Find capable specialist
      const specialist = this.findSpecialist(task);
      
      if (!specialist) {
        return this.failure(`No specialist found for task type: ${task.type}`);
      }
      
      // Publish routing event
      await eventBus.publish('task.routed', {
        task: task.id,
        specialist: specialist.name,
        timestamp: new Date()
      });
      
      // Execute via specialist
      const result = await specialist.execute(task);
      
      // Publish completion event
      await eventBus.publish('task.completed', {
        task: task.id,
        specialist: specialist.name,
        success: result.success,
        timestamp: new Date()
      });
      
      return {
        ...result,
        metadata: {
          ...result.metadata,
          handledBy: specialist.name,
          supervisor: this.name
        }
      };
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      return this.failure(`Supervisor error: ${message}`);
    }
  }
  
  private findSpecialist(task: AgentTask): BaseAgent | null {
    for (const specialist of this.specialists.values()) {
      if (specialist.canHandle(task)) {
        return specialist;
      }
    }
    return null;
  }
  
  getSpecialists(): string[] {
    return Array.from(this.specialists.keys());
  }
}
