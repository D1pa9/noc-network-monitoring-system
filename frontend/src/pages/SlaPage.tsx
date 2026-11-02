import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { getSlaSummary, downloadCsv, type SlaSummary } from "../api/reports";
import { Download, Clock, AlertTriangle, Activity } from "lucide-react";

export default function SlaPage() {
  const [data, setData] = useState<SlaSummary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const d = await getSlaSummary(from || undefined, to || undefined);
      setData(d);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load SLA");
    }
  }

  useEffect(() => {
    load();
  }, [from, to]);

  return (
    <Layout title="SLA & Availability" lastUpdated={lastUpdated}>
      {error && (
        <div className="px-4 py-2.5 rounded bg-red-500/15 border border-red-500/40 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 bg-slate-900 border border-slate-800 rounded px-4 py-3">
        <div>
          <label className="block text-[10px] uppercase text-slate-500 mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-slate-500 mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200"
          />
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => downloadCsv("devices", from || undefined, to || undefined)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1.5 rounded text-sm text-slate-100 flex items-center gap-1.5"
          >
            <Download size={14} /> Devices CSV
          </button>
          <button
            onClick={() => downloadCsv("incidents", from || undefined, to || undefined)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1.5 rounded text-sm text-slate-100 flex items-center gap-1.5"
          >
            <Download size={14} /> Incidents CSV
          </button>
          <button
            onClick={() => downloadCsv("monitoring", from || undefined, to || undefined)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1.5 rounded text-sm text-slate-100 flex items-center gap-1.5"
          >
            <Download size={14} /> Monitoring CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric
          icon={<Clock size={16} />}
          label="MTTA"
          value={data?.mtta_minutes != null ? `${data.mtta_minutes} min` : "—"}
          hint="Mean time to acknowledge"
        />
        <Metric
          icon={<Clock size={16} />}
          label="MTTR"
          value={data?.mttr_minutes != null ? `${data.mttr_minutes} min` : "—"}
          hint="Mean time to resolve"
        />
        <Metric
          icon={<Activity size={16} />}
          label="Availability"
          value={data?.availability_pct != null ? `${data.availability_pct}%` : "—"}
          hint={`${data?.checks.successful ?? 0} / ${data?.checks.total ?? 0} checks`}
          color="text-emerald-400"
        />
        <Metric
          icon={<AlertTriangle size={16} />}
          label="SLA Compliance"
          value={data?.sla_pct != null ? `${data.sla_pct}%` : "—"}
          hint={`${data?.incidents.resolved ?? 0} resolved incidents`}
          color="text-cyan-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Panel title="Incidents in period">
          <Row label="Total detected" value={data?.incidents.total ?? "—"} />
          <Row label="Acknowledged" value={data?.incidents.acknowledged ?? "—"} />
          <Row label="Resolved" value={data?.incidents.resolved ?? "—"} />
        </Panel>
        <Panel title="Monitoring checks">
          <Row label="Total checks" value={data?.checks.total ?? "—"} />
          <Row label="Successful" value={data?.checks.successful ?? "—"} />
          <Row
            label="Failed"
            value={data ? Math.max(0, data.checks.total - data.checks.successful) : "—"}
          />
        </Panel>
        <Panel title="Definitions (documented)">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300">MTTA:</strong> Mean time from detection to first acknowledgement.
            <br />
            <strong className="text-slate-300">MTTR:</strong> Mean time from detection to resolution.
            <br />
            <strong className="text-slate-300">SLA:</strong> % of resolved incidents acknowledged within 15 min and resolved within 4 h.
            <br />
            <strong className="text-slate-300">Availability:</strong> Successful monitoring checks ÷ total checks.
          </p>
        </Panel>
      </div>
    </Layout>
  );
}

function Metric({
  icon, label, value, hint, color = "text-slate-100",
}: { icon: React.ReactNode; label: string; value: string; hint: string; color?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded px-4 py-3">
      <div className="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wider">
        {icon} {label}
      </div>
      <div className={`text-2xl font-semibold mt-1 ${color}`}>{value}</div>
      <div className="text-[11px] text-slate-500 mt-1">{hint}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded">
      <div className="px-4 py-2.5 border-b border-slate-800 text-slate-300 text-sm font-medium">{title}</div>
      <div className="p-4 space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-100 font-mono">{value}</span>
    </div>
  );
}