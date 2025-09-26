export type ModulePhase = "Awareness" | "Operations" | "Coordination" | "Recovery";

export interface ModuleDef {
  id: string;
  name: string;
  originalLabel?: string;
  phase: ModulePhase;
  order: number; // lower = earlier in workflow
  routes: string[];
  publishes: string[]; // event names this module emits
  subscribes: string[]; // event names this module listens for
  description?: string;
}

export interface AppEvent<T = unknown> {
  type: string; // e.g. "JOB.NEW"
  payload?: T;
  meta?: { source?: string; ts?: number };
}