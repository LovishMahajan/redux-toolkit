// src/observability/sink.ts
export interface AnalyticsEvent { name: string; props: Record<string, unknown>; ts: string }
export interface AuditEntry { action: string; userId: string | null; ts: string }
export interface LatencySample { action: string; ms: number }

export const sink = {
  analytics: [] as AnalyticsEvent[],
  audit: [] as AuditEntry[],
  latency: [] as LatencySample[],
  reset() { this.analytics = []; this.audit = []; this.latency = []; },
};