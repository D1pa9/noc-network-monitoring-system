import Layout from "../components/layout/Layout";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <Layout title="System Settings" lastUpdated={new Date()}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Application">
          <Row label="Version" value="1.0.0 (Portfolio Build)" />
          <Row label="Environment" value="SIMULATION" />
          <Row label="Backend" value="Flask 3.x + SQLAlchemy" />
          <Row label="Database" value="SQLite (development fallback)" />
          <Row label="Monitoring" value="ICMP via OS ping (Python subprocess)" />
        </Panel>

        <Panel title="Monitoring Configuration">
          <Row label="Interval" value="45 seconds per cycle" />
          <Row label="Protocol" value="ICMP only (SNMP module planned)" />
          <Row label="Concurrency" value="Background thread with retry on DB lock" />
          <Row label="Auto-incident threshold" value="1 failed check → Open incident" />
          <Row label="Auto-resolve" value="On next successful check" />
        </Panel>

        <Panel title="SLA Definitions">
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-300">MTTA</strong>: Mean time to acknowledge.
            <br />
            <strong className="text-slate-300">MTTR</strong>: Mean time to resolve.
            <br />
            <strong className="text-slate-300">SLA Compliance</strong>: % of resolved incidents acknowledged within 15 min and resolved within 4 h.
          </p>
        </Panel>

        <Panel title="Known Limitations">
          <ul className="text-xs text-slate-400 leading-relaxed space-y-1.5 list-disc list-inside">
            <li>Uses <strong className="text-slate-300">simulated device IPs</strong> — not real BRAC infrastructure.</li>
            <li>ICMP may be blocked by firewalls — a failed ping is not definitive proof of outage.</li>
            <li>SNMP monitoring is <em>planned</em> but not implemented.</li>
            <li>No authentication / RBAC yet — designed for local single-user use.</li>
            <li>SQLite is used instead of PostgreSQL for zero-setup deployment.</li>
          </ul>
        </Panel>
      </div>
    </Layout>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded">
      <div className="px-4 py-2.5 border-b border-slate-800 text-slate-300 text-sm font-medium flex items-center gap-2">
        <SettingsIcon size={14} /> {title}
      </div>
      <div className="p-4 space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-100 font-mono text-xs">{value}</span>
    </div>
  );
}