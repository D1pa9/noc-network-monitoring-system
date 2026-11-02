import {
  LayoutDashboard,
  Server,
  Activity,
  Network,
  AlertTriangle,
  Wrench,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";

export type PageKey =
  | "overview"
  | "inventory"
  | "monitoring"
  | "topology"
  | "incidents"
  | "troubleshooting"
  | "sla"
  | "reports"
  | "settings";

const NAV: { label: string; icon: typeof Server; key: PageKey }[] = [
  { label: "Overview", icon: LayoutDashboard, key: "overview" },
  { label: "Network Inventory", icon: Server, key: "inventory" },
  { label: "Live Monitoring", icon: Activity, key: "monitoring" },
  { label: "Network Topology", icon: Network, key: "topology" },
  { label: "Incidents", icon: AlertTriangle, key: "incidents" },
  { label: "Troubleshooting", icon: Wrench, key: "troubleshooting" },
  { label: "SLA & Availability", icon: BarChart3, key: "sla" },
  { label: "Reports", icon: FileText, key: "reports" },
  { label: "System Settings", icon: Settings, key: "settings" },
];

interface Props {
  active: PageKey;
  onNavigate: (key: PageKey) => void;
}

export default function Sidebar({ active, onNavigate }: Props) {
  return (
    <aside className="w-64 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col h-full">
      {/* Fixed Header */}
      <div className="px-5 py-4 border-b border-slate-800 shrink-0">
        <div className="text-cyan-400 font-mono text-xs tracking-widest">NEXUS</div>
        <div className="text-slate-100 font-bold text-lg leading-tight">NOC</div>
        <div className="text-slate-500 text-[10px] mt-1 leading-tight">
          Network Experience, Uptime
          <br />
          &amp; Service Operations
        </div>
      </div>

      {/* Scrollable Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map(({ label, icon: Icon, key }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={`w-full flex items-center gap-3 px-5 py-2 text-sm text-left cursor-pointer ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-300 border-l-2 border-cyan-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-l-2 border-transparent"
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Fixed Footer (Badge) */}
      <div className="px-5 py-3 border-t border-slate-800 text-xs shrink-0 bg-slate-950">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Environment</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono text-[10px]">
            SIMULATION
          </span>
        </div>
      </div>
    </aside>
  );
}