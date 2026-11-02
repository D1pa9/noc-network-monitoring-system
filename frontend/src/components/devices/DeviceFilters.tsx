import { Search } from "lucide-react";
import type { DeviceStatus, DeviceType } from "../../types/device";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  type: string;
  onType: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
  onAdd: () => void;
}

const TYPES: (DeviceType | "")[] = [
  "", "router", "switch", "firewall", "server",
  "access_point", "gateway", "workstation",
];

const STATUSES: (DeviceStatus | "")[] = [
  "", "online", "warning", "offline", "unknown",
];

export default function DeviceFilters({
  search, onSearch, type, onType, status, onStatus, onAdd,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-900 border-b border-slate-800">
      <div className="relative flex-1 min-w-[220px]">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search hostname, IP, description…"
          className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      <select
        value={type}
        onChange={(e) => onType(e.target.value)}
        className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
      >
        {TYPES.map((t) => (
          <option key={t} value={t}>
            {t === "" ? "All types" : t}
          </option>
        ))}
      </select>

      <select
        value={status}
        onChange={(e) => onStatus(e.target.value)}
        className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s === "" ? "All statuses" : s}
          </option>
        ))}
      </select>

      <button
        onClick={onAdd}
        className="ml-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold border border-cyan-400 px-3 py-1.5 rounded text-sm"
      >
        + Add Device
      </button>
    </div>
  );
}