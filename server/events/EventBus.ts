/**
 * Lightweight in-memory event bus for agent communication
 * Production: Replace with Redis Streams for distributed systems
 */

type EventHandler = (data: any) => void | Promise<void>;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private eventLog: Array<{ event: string; data: any; timestamp: Date }> = [];
  
  subscribe(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }
  
  async publish(event: string, data: any): Promise<void> {
    // Log event
    this.eventLog.push({ event, data, timestamp: new Date() });
    
    // Keep only last 1000 events in memory
    if (this.eventLog.length > 1000) {
      this.eventLog.shift();
    }
    
    const handlers = this.handlers.get(event) || [];
    
    // Execute all handlers in parallel
    await Promise.all(
      handlers.map(handler => 
        Promise.resolve(handler(data)).catch(err => 
          console.error(`Error in ${event} handler:`, err)
        )
      )
    );
  }
  
  getEventLog(): Array<{ event: string; data: any; timestamp: Date }> {
    return [...this.eventLog];
  }
  
  clear(): void {
    this.eventLog = [];
  }
}

// Singleton instance
export const eventBus = new EventBus();
