import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { getSlaSummary, downloadCsv, type SlaSummary } from "../api/reports";
import { FileText, Download } from "lucide-react";

export default function ReportsPage() {
  const [data, setData] = useState<SlaSummary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    getSlaSummary(from || undefined, to || undefined)
      .then((d) => {
        setData(d);
        setLastUpdated(new Date());
      })
      .catch(() => {});
  }, [from, to]);

  return (
    <Layout title="Reports" lastUpdated={lastUpdated}>
      <div className="flex flex-wrap items-end gap-3 bg-slate-900 border border-slate-800 rounded px-4 py-3">
        <div>
          <label className="block text-[10px] uppercase text-slate-500 mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200" />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-slate-500 mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ReportCard
          icon={<FileText size={18} />}
          title="Device Inventory Report"
          description="Full list of all monitored devices with status, IP, vendor, model, and last check timestamp."
          onDownload={() => downloadCsv("devices", from || undefined, to || undefined)}
        />
        <ReportCard
          icon={<FileText size={18} />}
          title="Incident History Report"
          description="All incidents in the selected period, including severity, status, detection, acknowledgement, and resolution times."
          onDownload={() => downloadCsv("incidents", from || undefined, to || undefined)}
        />
        <ReportCard
          icon={<FileText size={18} />}
          title="Monitoring History Report"
          description="Raw ICMP monitoring checks (up to 5000) with response times and error states."
          onDownload={() => downloadCsv("monitoring", from || undefined, to || undefined)}
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Summary for selected period</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total Incidents" value={data?.incidents.total ?? "—"} />
          <Stat label="Resolved" value={data?.incidents.resolved ?? "—"} />
          <Stat label="Availability" value={data?.availability_pct != null ? `${data.availability_pct}%` : "—"} />
          <Stat label="SLA Compliance" value={data?.sla_pct != null ? `${data.sla_pct}%` : "—"} />
        </div>
      </div>
    </Layout>
  );
}

function ReportCard({
  icon, title, description, onDownload,
}: { icon: React.ReactNode; title: string; description: string; onDownload: () => void }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4 flex flex-col">
      <div className="flex items-center gap-2 text-cyan-400 mb-2">
        {icon}
        <span className="text-slate-200 font-medium">{title}</span>
      </div>
      <p className="text-xs text-slate-400 flex-1">{description}</p>
      <button
        onClick={onDownload}
        className="mt-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1.5 rounded text-sm text-slate-100 flex items-center justify-center gap-1.5"
      >
        <Download size={14} /> Download CSV
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-xl font-semibold text-slate-100 mt-0.5">{value}</div>
    </div>
  );
}