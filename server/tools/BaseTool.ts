/**
 * Base Tool interface for agent capabilities
 */

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export abstract class BaseTool {
  abstract name: string;
  abstract description: string;
  
  abstract execute(params: any): Promise<ToolResult>;
  
  protected success(data: any, metadata?: Record<string, any>): ToolResult {
    return { success: true, data, metadata };
  }
  
  protected failure(error: string, metadata?: Record<string, any>): ToolResult {
    return { success: false, error, metadata };
  }
}
