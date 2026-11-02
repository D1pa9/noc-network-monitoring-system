import { useState } from "react";
import Layout from "../components/layout/Layout";
import { listDevices } from "../api/devices";
import type { Device } from "../types/device";
import { Wrench, CheckCircle, XCircle, ChevronRight } from "lucide-react";

const WORKFLOWS = {
  unreachable: {
    title: "Device Unreachable",
    steps: [
      { label: "Verify device IP address is correct", auto: true },
      { label: "Check local network connectivity (cable/WiFi)", auto: false },
      { label: "Ping the default gateway", auto: true },
      { label: "Check DNS resolution (nslookup)", auto: false },
      { label: "Review routing table (traceroute)", auto: true },
      { label: "Check device availability in monitoring history", auto: true },
      { label: "Escalate to L2 if unreachable after 15 min", auto: false },
    ],
  },
  highResponse: {
    title: "High Response Time",
    steps: [
      { label: "Compare recent response times against baseline", auto: true },
      { label: "Review packet loss (ping -c 10)", auto: true },
      { label: "Traceroute to identify slow hop", auto: true },
      { label: "Check interface utilization (SNMP if configured)", auto: false },
      { label: "Check for broadcast storms on VLAN", auto: false },
      { label: "Record probable cause in ticket notes", auto: false },
    ],
  },
  dns: {
    title: "DNS Resolution Issue",
    steps: [
      { label: "Test name resolution with nslookup", auto: true },
      { label: "Check configured DNS server (ipconfig /all)", auto: false },
      { label: "Ping DNS server by IP", auto: true },
      { label: "Flush DNS cache (ipconfig /flushdns)", auto: false },
      { label: "Record lookup results in ticket", auto: false },
    ],
  },
  dhcp: {
    title: "DHCP Address Issue",
    steps: [
      { label: "Check current IP (ipconfig)", auto: false },
      { label: "Check if address is from correct subnet", auto: false },
      { label: "Verify DHCP server availability", auto: true },
      { label: "Renew lease (ipconfig /release && renew)", auto: false },
      { label: "Check gateway is reachable", auto: true },
    ],
  },
  internet: {
    title: "Internet Connectivity",
    steps: [
      { label: "Ping default gateway", auto: true },
      { label: "Ping upstream ISP DNS (8.8.8.8)", auto: true },
      { label: "Test DNS resolution for external domain", auto: true },
      { label: "Check WAN link status on gateway", auto: false },
      { label: "Record outcome in ticket", auto: false },
    ],
  },
};

type WorkflowKey = keyof typeof WORKFLOWS;

export default function TroubleshootingPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowKey>("unreachable");
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [lastUpdated] = useState(new Date());

  useState(() => {
    listDevices().then((d) => setDevices(d.devices));
  });

  function toggleStep(idx: number) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  const steps = WORKFLOWS[activeWorkflow].steps;
  const device = devices.find((d) => d.id === selectedDevice);

  return (
    <Layout title="Troubleshooting Workspace" lastUpdated={lastUpdated}>
      <div className="bg-slate-900 border border-slate-800 rounded p-4">
        <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">
          Select Device
        </label>
        <select
          value={selectedDevice ?? ""}
          onChange={(e) => {
            setSelectedDevice(Number(e.target.value));
            setCompleted(new Set());
          }}
          className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 w-full max-w-md"
        >
          <option value="">— Choose a device —</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.hostname} ({d.ip_address}) — {d.status}
            </option>
          ))}
        </select>
        {device && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="text-slate-500">Status: <span className="text-slate-200 font-mono">{device.status}</span></div>
            <div className="text-slate-500">Type: <span className="text-slate-200">{device.device_type}</span></div>
            <div className="text-slate-500">Vendor: <span className="text-slate-200">{device.vendor ?? "—"}</span></div>
            <div className="text-slate-500">Location: <span className="text-slate-200">{device.location ?? "—"}</span></div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-800 text-slate-300 text-sm font-medium flex items-center gap-2">
            <Wrench size={14} /> Workflows
          </div>
          {(Object.keys(WORKFLOWS) as WorkflowKey[]).map((key) => (
            <button
              key={key}
              onClick={() => {
                setActiveWorkflow(key);
                setCompleted(new Set());
              }}
              className={`w-full text-left px-4 py-2 text-sm border-l-2 ${
                activeWorkflow === key
                  ? "bg-cyan-500/10 text-cyan-300 border-cyan-400"
                  : "text-slate-400 hover:bg-slate-800 border-transparent"
              }`}
            >
              {WORKFLOWS[key].title}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded">
          <div className="px-4 py-2.5 border-b border-slate-800 text-slate-300 text-sm font-medium flex items-center justify-between">
            <span>{WORKFLOWS[activeWorkflow].title}</span>
            <span className="text-xs text-slate-500">
              {completed.size} / {steps.length} steps done
            </span>
          </div>
          <ul className="p-4 space-y-2">
            {steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <button
                  onClick={() => toggleStep(idx)}
                  className={`mt-0.5 shrink-0 ${
                    completed.has(idx) ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {completed.has(idx) ? <CheckCircle size={18} /> : <XCircle size={18} />}
                </button>
                <div className="flex-1">
                  <div className={`text-sm ${completed.has(idx) ? "text-slate-400 line-through" : "text-slate-200"}`}>
                    {step.label}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {step.auto ? "Automatic check available" : "Manual verification"}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500 flex items-center gap-2">
            <ChevronRight size={14} />
            Findings should be recorded as incident notes for audit trail.
          </div>
        </div>
      </div>
    </Layout>
  );
}