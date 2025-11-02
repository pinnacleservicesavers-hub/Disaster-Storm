import { BaseTool, ToolResult } from '../tools/BaseTool';
import { eventBus } from '../events/EventBus';

export interface AgentTask {
  id: string;
  type: string;
  data: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  success: boolean;
  result?: any;
  error?: string;
  toolsUsed?: string[];
  reasoning?: string;
  metadata?: Record<string, any>;
}

export abstract class BaseAgent {
  abstract name: string;
  abstract description: string;
  abstract capabilities: string[];
  
  protected tools: Map<string, BaseTool> = new Map();
  
  registerTool(tool: BaseTool): void {
    this.tools.set(tool.name, tool);
  }
  
  async useTool(toolName: string, params: any): Promise<ToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        success: false,
        error: `Tool '${toolName}' not found`
      };
    }
    
    const result = await tool.execute(params);
    
    // Publish tool usage event
    await eventBus.publish('tool.used', {
      agent: this.name,
      tool: toolName,
      success: result.success,
      timestamp: new Date()
    });
    
    return result;
  }
  
  canHandle(task: AgentTask): boolean {
    return this.capabilities.includes(task.type);
  }
  
  abstract execute(task: AgentTask): Promise<AgentResponse>;
  
  protected success(result: any, metadata?: Record<string, any>): AgentResponse {
    return { success: true, result, metadata };
  }
  
  protected failure(error: string, metadata?: Record<string, any>): AgentResponse {
    return { success: false, error, metadata };
  }
}
