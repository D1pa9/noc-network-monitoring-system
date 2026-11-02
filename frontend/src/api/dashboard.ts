const API_BASE = "http://localhost:5000/api";

export interface DashboardStats {
  devices: { total: number; online: number; warning: number; offline: number; unknown: number };
  incidents: { active: number };
  avg_response_ms: number | null;
  availability_pct: number | null;
  sla_pct: number | null;
}

export interface RecentIncident {
  id: number;
  incident_code: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "acknowledged" | "investigating" | "escalated" | "resolved" | "closed";
  detected_at: string | null;
  device_id: number | null;
}

export interface RecentEvent {
  id: number;
  device_id: number;
  hostname: string;
  success: boolean;
  response_ms: number | null;
  error: string | null;
  checked_at: string | null;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json() as Promise<T>;
}

export const getDashboardStats = () => get<DashboardStats>("/dashboard/stats");
export const getRecentIncidents = () => get<{ incidents: RecentIncident[] }>("/dashboard/recent-incidents");
export const getRecentEvents = () => get<{ events: RecentEvent[] }>("/dashboard/events");