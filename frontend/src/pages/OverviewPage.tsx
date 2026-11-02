import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  getDashboardStats,
  getRecentIncidents,
  getRecentEvents,
  type DashboardStats,
  type RecentIncident,
  type RecentEvent,
} from "../api/dashboard";

const SEVERITY_COLOR = {
  critical: "text-red-400 bg-red-500/15 border-red-500/40",
  high: "text-orange-400 bg-orange-500/15 border-orange-500/40",
  medium: "text-amber-400 bg-amber-500/15 border-amber-500/40",
  low: "text-sky-400 bg-sky-500/15 border-sky-500/40",
};

const STATUS_COLOR = {
  open: "text-red-400 bg-red-500/15 border-red-500/40",
  acknowledged: "text-amber-400 bg-amber-500/15 border-amber-500/40",
  investigating: "text-sky-400 bg-sky-500/15 border-sky-500/40",
  escalated: "text-orange-400 bg-orange-500/15 border-orange-500/40",
  resolved: "text-emerald-400 bg-emerald-500/15 border-emerald-500/40",
  closed: "text-slate-400 bg-slate-500/15 border-slate-500/40",
};

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [incidents, setIncidents] = useState<RecentIncident[]>([]);
  const [events, setEvents] = useState<RecentEvent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [s, i, e] = await Promise.all([
        getDashboardStats(),
        getRecentIncidents(),
        getRecentEvents(),
      ]);
      setStats(s);
      setIncidents(i.incidents);
      setEvents(e.events);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const donutData = stats
    ? [
        { name: "Online", value: stats.devices.online, color: "#10b981" },
        { name: "Warning", value: stats.devices.warning, color: "#f59e0b" },
        { name: "Offline", value: stats.devices.offline, color: "#ef4444" },
        { name: "Unknown", value: stats.devices.unknown, color: "#475569" },
      ].filter((d) => d.value > 0)
    : [];

  const responseSeries = events
    .filter((e) => e.success && e.response_ms !== null)
    .slice()
    .reverse()
    .map((e) => ({
      time: e.checked_at ? new Date(e.checked_at).toLocaleTimeString("en-GB", { hour12: false }) : "",
      ms: e.response_ms,
    }));

  return (
    <Layout title="Overview" lastUpdated={lastUpdated}>
      {error && (
        <div className="px-4 py-2.5 rounded bg-red-500/15 border border-red-500/40 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <Kpi label="Total Devices" value={stats?.devices.total ?? "—"} />
        <Kpi label="Online" value={stats?.devices.online ?? "—"} color="text-emerald-400" />
        <Kpi label="Warning" value={stats?.devices.warning ?? "—"} color="text-amber-400" />
        <Kpi label="Offline" value={stats?.devices.offline ?? "—"} color="text-red-400" />
        <Kpi label="Active Incidents" value={stats?.incidents.active ?? "—"} color="text-orange-400" />
        <Kpi label="Avg Response" value={stats?.avg_response_ms != null ? `${stats.avg_response_ms}ms` : "—"} />
        <Kpi label="Availability" value={stats?.availability_pct != null ? `${stats.availability_pct}%` : "—"} />
        <Kpi label="SLA" value={stats?.sla_pct != null ? `${stats.sla_pct}%` : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Device Availability">
          <div className="h-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {donutData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
                <span className="text-slate-400">{d.name}</span>
                <span className="text-slate-200 font-mono ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recent Response Times (ms)" className="lg:col-span-2">
          <div className="h-52">
            {responseSeries.length > 0 ? (
              <ResponsiveContainer>
                <LineChart data={responseSeries}>
                  <CartesianGrid stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="ms" stroke="#22d3ee" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No monitoring data yet — run the monitoring engine in a later step.
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Recent Incidents" className="lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="text-slate-500 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="text-left py-1.5 font-medium">Code</th>
                <th className="text-left py-1.5 font-medium">Title</th>
                <th className="text-left py-1.5 font-medium">Severity</th>
                <th className="text-left py-1.5 font-medium">Status</th>
                <th className="text-left py-1.5 font-medium">Detected</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                    No incidents recorded.
                  </td>
                </tr>
              )}
              {incidents.map((i) => (
                <tr key={i.id} className="border-t border-slate-800">
                  <td className="py-2 font-mono text-xs text-cyan-400">{i.incident_code}</td>
                  <td className="py-2 text-slate-200 text-xs">{i.title}</td>
                  <td className="py-2">
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono tracking-wider ${SEVERITY_COLOR[i.severity]}`}>
                      {i.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2">
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono tracking-wider ${STATUS_COLOR[i.status]}`}>
                      {i.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 text-slate-500 font-mono text-[11px]">
                    {i.detected_at ? new Date(i.detected_at).toLocaleString("en-GB", { hour12: false }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Recent Monitoring Events">
          <ul className="space-y-1.5 text-xs max-h-64 overflow-y-auto">
            {events.length === 0 && (
              <li className="text-slate-500 text-center py-6">No events yet.</li>
            )}
            {events.map((e) => (
              <li key={e.id} className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    e.success ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
                <span className="font-mono text-slate-300">{e.hostname}</span>
                <span className="ml-auto font-mono text-[10px] text-slate-500">
                  {e.success ? `${e.response_ms ?? "—"}ms` : "TIMEOUT"}
                </span>
                <span className="font-mono text-[10px] text-slate-600">
                  {e.checked_at
                    ? new Date(e.checked_at).toLocaleTimeString("en-GB", { hour12: false })
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Layout>
  );
}

function Kpi({
  label, value, color = "text-slate-100",
}: { label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-xl font-semibold mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}

function Panel({
  title, children, className = "",
}: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded ${className}`}>
      <div className="px-4 py-2.5 border-b border-slate-800 text-slate-300 text-sm font-medium">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}