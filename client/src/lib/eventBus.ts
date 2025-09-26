import { AppEvent } from "../types/modules";

type Handler = (evt: AppEvent) => void;

class EventBus {
  private map = new Map<string, Set<Handler>>();

  on(type: string, handler: Handler) {
    if (!this.map.has(type)) this.map.set(type, new Set());
    this.map.get(type)!.add(handler);
    return () => this.off(type, handler);
  }

  off(type: string, handler: Handler) {
    this.map.get(type)?.delete(handler);
  }

  emit(evt: AppEvent) {
    const set = this.map.get(evt.type);
    set?.forEach((h) => h(evt));
  }
}

export const bus = new EventBus();

// Example helpers
export const publish = (type: string, payload?: unknown, source?: string) =>
  bus.emit({ type, payload, meta: { source, ts: Date.now() } });