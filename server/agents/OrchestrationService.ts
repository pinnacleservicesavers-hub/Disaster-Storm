import { SupervisorAgent } from './SupervisorAgent';
import { WeatherAgent } from './specialists/WeatherAgent';
import { DispatchAgent } from './specialists/DispatchAgent';
import { ClaimAgent } from './specialists/ClaimAgent';
import { NegotiatorAgent } from './specialists/NegotiatorAgent';
import { LegalAgent } from './specialists/LegalAgent';
import { VisionAgent } from './specialists/VisionAgent';
import { FinanceAgent } from './specialists/FinanceAgent';
import { AgentTask } from './BaseAgent';
import { eventBus } from '../events/EventBus';

export class OrchestrationService {
  private supervisor: SupervisorAgent;
  private initialized = false;
  
  constructor() {
    this.supervisor = new SupervisorAgent();
    this.initializeAgents();
  }
  
  private initializeAgents(): void {
    this.supervisor.registerSpecialist(new WeatherAgent());
    this.supervisor.registerSpecialist(new DispatchAgent());
    this.supervisor.registerSpecialist(new ClaimAgent());
    this.supervisor.registerSpecialist(new NegotiatorAgent());
    this.supervisor.registerSpecialist(new LegalAgent());
    this.supervisor.registerSpecialist(new VisionAgent());
    this.supervisor.registerSpecialist(new FinanceAgent());
    
    this.registerGuardrails();
    this.setupEventListeners();
    
    this.initialized = true;
    console.log('🤖 Orchestration Service initialized with 7 specialist agents');
  }
  
  private registerGuardrails(): void {
    this.supervisor.registerGuardrail('max_amount', (task: AgentTask) => {
      if (task.type === 'process_payment') {
        const maxAmount = 1000000;
        return (task.data.amount || 0) <= maxAmount;
      }
      return true;
    });
    
    this.supervisor.registerGuardrail('valid_state', (task: AgentTask) => {
      if (task.type === 'validate_contract' || task.type === 'check_lien_deadline') {
        const validStates = ['FL', 'TX', 'CA', 'GA', 'AL', 'SC', 'NC', 'LA', 'MS'];
        return validStates.includes(task.data.state);
      }
      return true;
    });
    
    this.supervisor.registerGuardrail('priority_validation', (task: AgentTask) => {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (task.priority) {
        return validPriorities.includes(task.priority);
      }
      return true;
    });
  }
  
  private setupEventListeners(): void {
    eventBus.subscribe('task.routed', (data) => {
      console.log(`📨 Task ${data.task} routed to ${data.specialist}`);
    });
    
    eventBus.subscribe('task.completed', (data) => {
      console.log(`✅ Task ${data.task} completed by ${data.specialist} (success: ${data.success})`);
    });
    
    eventBus.subscribe('task.blocked', (data) => {
      console.log(`🚫 Task ${data.task} blocked by guardrail: ${data.guardrail}`);
    });
    
    eventBus.subscribe('tool.used', (data) => {
      console.log(`🔧 ${data.agent} used tool: ${data.tool} (success: ${data.success})`);
    });
  }
  
  async executeTask(task: AgentTask) {
    if (!this.initialized) {
      throw new Error('Orchestration service not initialized');
    }
    
    return await this.supervisor.execute(task);
  }
  
  getSpecialists(): string[] {
    return this.supervisor.getSpecialists();
  }
  
  getEventLog() {
    return eventBus.getEventLog();
  }
  
  clearEventLog(): void {
    eventBus.clear();
  }
}

export const orchestrationService = new OrchestrationService();
