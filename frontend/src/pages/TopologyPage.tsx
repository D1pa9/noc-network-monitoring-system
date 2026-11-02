import Layout from "../components/layout/Layout";
import { Network } from "lucide-react";

export default function TopologyPage() {
  return (
    <Layout title="Network Topology" lastUpdated={new Date()}>
      <div className="bg-slate-900 border border-slate-800 rounded p-6">
        <h3 className="text-slate-200 font-medium mb-4 flex items-center gap-2">
          <Network size={18} /> Simulated Enterprise Network (BRAC Reference Lab)
        </h3>
        <div className="bg-slate-950 border border-slate-800 rounded p-6 overflow-x-auto">
          <svg viewBox="0 0 900 500" className="w-full h-auto" style={{ minHeight: 400 }}>
            {/* Internet cloud */}
            <ellipse cx="450" cy="40" rx="80" ry="30" fill="#1e293b" stroke="#475569" />
            <text x="450" y="45" textAnchor="middle" fill="#94a3b8" fontSize="12">Internet / WAN</text>

            {/* Edge gateway */}
            <rect x="390" y="100" width="120" height="50" rx="4" fill="#0f172a" stroke="#06b6d4" />
            <text x="450" y="120" textAnchor="middle" fill="#67e8f9" fontSize="11" fontWeight="bold">edge-gw-01</text>
            <text x="450" y="135" textAnchor="middle" fill="#64748b" fontSize="9">Cisco ASA 5516</text>
            <line x1="450" y1="70" x2="450" y2="100" stroke="#475569" strokeDasharray="3,3" />

            {/* Firewall */}
            <rect x="390" y="180" width="120" height="50" rx="4" fill="#0f172a" stroke="#ef4444" />
            <text x="450" y="200" textAnchor="middle" fill="#fca5a5" fontSize="11" fontWeight="bold">core-fw-01</text>
            <text x="450" y="215" textAnchor="middle" fill="#64748b" fontSize="9">FortiGate 100F</text>
            <line x1="450" y1="150" x2="450" y2="180" stroke="#475569" />

            {/* Core router */}
            <rect x="390" y="260" width="120" height="50" rx="4" fill="#0f172a" stroke="#06b6d4" />
            <text x="450" y="280" textAnchor="middle" fill="#67e8f9" fontSize="11" fontWeight="bold">core-rtr-01</text>
            <text x="450" y="295" textAnchor="middle" fill="#64748b" fontSize="9">Cisco ISR 4331</text>
            <line x1="450" y1="230" x2="450" y2="260" stroke="#475569" />

            {/* Switches */}
            <rect x="150" y="350" width="120" height="50" rx="4" fill="#0f172a" stroke="#10b981" />
            <text x="210" y="370" textAnchor="middle" fill="#6ee7b7" fontSize="11" fontWeight="bold">core-sw-01</text>
            <text x="210" y="385" textAnchor="middle" fill="#64748b" fontSize="9">VLAN 10 - Mgmt</text>
            <line x1="450" y1="310" x2="210" y2="350" stroke="#475569" />

            <rect x="630" y="350" width="120" height="50" rx="4" fill="#0f172a" stroke="#10b981" />
            <text x="690" y="370" textAnchor="middle" fill="#6ee7b7" fontSize="11" fontWeight="bold">core-sw-02</text>
            <text x="690" y="385" textAnchor="middle" fill="#64748b" fontSize="9">VLAN 20 - Users</text>
            <line x1="450" y1="310" x2="690" y2="350" stroke="#475569" />

            {/* Servers and workstations */}
            <rect x="30" y="440" width="110" height="40" rx="4" fill="#0f172a" stroke="#334155" />
            <text x="85" y="455" textAnchor="middle" fill="#cbd5e1" fontSize="10">nms-srv-01</text>
            <text x="85" y="470" textAnchor="middle" fill="#64748b" fontSize="8">HP DL380</text>
            <line x1="210" y1="400" x2="85" y2="440" stroke="#334155" />

            <rect x="165" y="440" width="110" height="40" rx="4" fill="#0f172a" stroke="#334155" />
            <text x="220" y="455" textAnchor="middle" fill="#cbd5e1" fontSize="10">erp-srv-01</text>
            <text x="220" y="470" textAnchor="middle" fill="#64748b" fontSize="8">Dell R740</text>
            <line x1="220" y1="400" x2="220" y2="440" stroke="#334155" />

            <rect x="600" y="440" width="110" height="40" rx="4" fill="#0f172a" stroke="#334155" />
            <text x="655" y="455" textAnchor="middle" fill="#cbd5e1" fontSize="10">noc-wks-01</text>
            <text x="655" y="470" textAnchor="middle" fill="#64748b" fontSize="8">OptiPlex 7090</text>
            <line x1="690" y1="400" x2="655" y2="440" stroke="#334155" />

            <rect x="735" y="440" width="110" height="40" rx="4" fill="#0f172a" stroke="#334155" />
            <text x="790" y="455" textAnchor="middle" fill="#cbd5e1" fontSize="10">dns-srv-01</text>
            <text x="790" y="470" textAnchor="middle" fill="#64748b" fontSize="8">Ubuntu 22.04</text>
            <line x1="690" y1="400" x2="790" y2="440" stroke="#334155" />
          </svg>
        </div>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          This diagram represents the simulated enterprise network documented in the README.
          Additional branches (BRAC Branch - Savar) connect through the WAN interface of core-rtr-01.
          Full Packet Tracer lab file is available in <code className="text-cyan-400">docs/topology/</code>.
        </p>
      </div>
    </Layout>
  );
}