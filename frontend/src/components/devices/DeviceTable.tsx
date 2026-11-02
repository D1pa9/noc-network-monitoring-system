import type { Device } from "../../types/device";
import StatusBadge from "../ui/StatusBadge";

interface Props {
  devices: Device[];
  onRowClick: (d: Device) => void;
  loading: boolean;
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { hour12: false });
}

export default function DeviceTable({ devices, onRowClick, loading }: Props) {
  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500 text-sm">Loading devices…</div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="p-10 text-center text-slate-500 text-sm">
        No devices match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-950 text-slate-500 uppercase text-[11px] tracking-wider">
          <tr>
            <th className="text-left px-4 py-2.5 font-medium">Hostname</th>
            <th className="text-left px-4 py-2.5 font-medium">IP Address</th>
            <th className="text-left px-4 py-2.5 font-medium">Type</th>
            <th className="text-left px-4 py-2.5 font-medium">Location</th>
            <th className="text-left px-4 py-2.5 font-medium">Vendor / Model</th>
            <th className="text-left px-4 py-2.5 font-medium">Protocol</th>
            <th className="text-left px-4 py-2.5 font-medium">Status</th>
            <th className="text-left px-4 py-2.5 font-medium">Last Check</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr
              key={d.id}
              onClick={() => onRowClick(d)}
              className="border-t border-slate-800 hover:bg-slate-800/60 cursor-pointer"
            >
              <td className="px-4 py-2 text-slate-100 font-mono text-xs">
                {d.hostname}
              </td>
              <td className="px-4 py-2 text-slate-300 font-mono text-xs">
                {d.ip_address}
              </td>
              <td className="px-4 py-2 text-slate-400 capitalize text-xs">
                {d.device_type.replace("_", " ")}
              </td>
              <td className="px-4 py-2 text-slate-400 text-xs">
                {d.location || "—"}
              </td>
              <td className="px-4 py-2 text-slate-400 text-xs">
                {d.vendor ? `${d.vendor} ${d.model ?? ""}`.trim() : "—"}
              </td>
              <td className="px-4 py-2 text-slate-400 font-mono text-xs uppercase">
                {d.monitoring_protocol}
              </td>
              <td className="px-4 py-2">
                <StatusBadge status={d.status} />
              </td>
              <td className="px-4 py-2 text-slate-500 font-mono text-[11px]">
                {fmt(d.last_check_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}