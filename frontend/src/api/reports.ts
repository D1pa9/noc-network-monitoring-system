const API_BASE = "http://localhost:5000/api";

export interface SlaSummary {
  period: { from: string; to: string };
  incidents: { total: number; resolved: number; acknowledged: number };
  mtta_minutes: number | null;
  mttr_minutes: number | null;
  sla_pct: number | null;
  availability_pct: number | null;
  checks: { total: number; successful: number };
}

export async function getSlaSummary(from?: string, to?: string): Promise<SlaSummary> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/reports/sla${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to load SLA");
  return res.json();
}

export function downloadCsv(report: "devices" | "incidents" | "monitoring", from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  window.open(`${API_BASE}/reports/export/${report}.csv${qs ? `?${qs}` : ""}`, "_blank");
}