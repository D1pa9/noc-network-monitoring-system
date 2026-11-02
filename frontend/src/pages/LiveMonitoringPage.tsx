import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { listDevices } from "../api/devices";
import { getRecentEvents, type RecentEvent } from "../api/dashboard";
import type { Device } from "../types/device";
import StatusBadge from "../components/ui/StatusBadge";
import { Activity } from "lucide-react";

export default function LiveMonitoringPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [events, setEvents] = useState<RecentEvent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load() {
    try {
      const [d, e] = await Promise.all([listDevices(), getRecentEvents()]);
      setDevices(d.devices);
      setEvents(e.events);
      setLastUpdated(new Date());
    } catch {}
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout title="Live Monitoring" lastUpdated={lastUpdated}>
      <div className="flex items-center gap-2 px-4 py-2.5 rounded bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-sm">
        <Activity size={14} />
        <span className="font-mono tracking-wider">MONITORING ENGINE ACTIVE</span>
        <span className="text-slate-400 text-xs ml-2">Refreshing every 10s</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-800 text-slate-300 text-sm font-medium">
            Device Status (live)
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-slate-500 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Hostname</th>
                <th className="text-left px-4 py-2 font-medium">IP</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Avg Response</th>
                <th className="text-left px-4 py-2 font-medium">Last Check</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id} className="border-t border-slate-800">
                  <td className="px-4 py-2 font-mono text-xs text-slate-200">{d.hostname}</td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-400">{d.ip_address}</td>
                  <td className="px-4 py-2"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-300">
                    {d.avg_response_ms != null ? `${d.avg_response_ms.toFixed(1)} ms` : "—"}
                  </td>
                  <td className="px-4 py-2 font-mono text-[11px] text-slate-500">
                    {d.last_check_at ? new Date(d.last_check_at).toLocaleTimeString("en-GB", { hour12: false }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-800 text-slate-300 text-sm font-medium">
            Live Event Stream
          </div>
          <ul className="p-4 space-y-1.5 text-xs">
            {events.map((e) => (
              <li key={e.id} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${e.success ? "bg-emerald-400" : "bg-red-400"}`} />
                <span className="font-mono text-slate-300">{e.hostname}</span>
                <span className="ml-auto font-mono text-[10px] text-slate-500">
                  {e.success ? `${e.response_ms ?? "—"}ms` : "TIMEOUT"}
                </span>
                <span className="font-mono text-[10px] text-slate-600">
                  {e.checked_at ? new Date(e.checked_at).toLocaleTimeString("en-GB", { hour12: false }) : ""}
                </span>
              </li>
            ))}
            {events.length === 0 && <li className="text-slate-500 text-center py-6">No events yet.</li>}
          </ul>
        </div>
      </div>
    </Layout>
  );
}