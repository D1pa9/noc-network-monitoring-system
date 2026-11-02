const API_BASE = "http://localhost:5000/api";

export type Severity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "acknowledged" | "investigating" | "escalated" | "resolved" | "closed";

export interface IncidentNote {
  id: number;
  author: string;
  note: string;
  created_at: string;
}

export interface Incident {
  id: number;
  incident_code: string;
  device_id: number | null;
  title: string;
  description: string | null;
  severity: Severity;
  status: IncidentStatus;
  detected_at: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  assigned_to: string | null;
  root_cause: string | null;
  resolution_notes: string | null;
  notes?: IncidentNote[];
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function listIncidents(status?: string, severity?: string) {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (severity) params.append("severity", severity);
  const qs = params.toString();
  return handle<{ count: number; incidents: Incident[] }>(await fetch(`${API_BASE}/incidents${qs ? `?${qs}` : ""}`));
}

export async function getIncident(id: number) {
  return handle<Incident>(await fetch(`${API_BASE}/incidents/${id}`));
}

export async function updateIncidentStatus(id: number, status: IncidentStatus, engineer?: string) {
  return handle<Incident>(await fetch(`${API_BASE}/incidents/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, engineer })
  }));
}

export async function addIncidentNote(id: number, note: string, author?: string) {
  return handle<IncidentNote>(await fetch(`${API_BASE}/incidents/${id}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note, author })
  }));
}