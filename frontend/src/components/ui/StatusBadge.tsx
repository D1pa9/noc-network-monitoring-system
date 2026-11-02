import type { DeviceStatus } from "../../types/device";

const STYLES: Record<DeviceStatus, string> = {
  online: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  offline: "bg-red-500/15 text-red-400 border-red-500/40",
  unknown: "bg-slate-500/15 text-slate-400 border-slate-500/40",
};

const LABELS: Record<DeviceStatus, string> = {
  online: "ONLINE",
  warning: "WARNING",
  offline: "OFFLINE",
  unknown: "UNKNOWN",
};

export default function StatusBadge({ status }: { status: DeviceStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-mono tracking-wider ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}