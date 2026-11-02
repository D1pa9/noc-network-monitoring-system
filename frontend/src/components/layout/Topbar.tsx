import { Bell, Circle } from "lucide-react";

interface Props {
  title: string;
  lastUpdated: Date | null;
}

export default function TopBar({ title, lastUpdated }: Props) {
  const time = lastUpdated
    ? lastUpdated.toLocaleTimeString("en-GB", { hour12: false })
    : "—";

  return (
    <header className="h-14 shrink-0 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <span className="text-slate-200 font-semibold">{title}</span>
        <span className="text-slate-500 text-xs">|</span>
        <span className="text-slate-500 text-xs font-mono">Last updated: {time}</span>
      </div>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <Circle size={8} className="fill-emerald-400" />
          <span className="font-mono tracking-wider">MONITORING ACTIVE</span>
        </div>
        <button className="text-slate-400 hover:text-slate-100 relative">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs font-semibold">
            DS
          </div>
          <div className="text-xs">
            <div className="text-slate-200 leading-tight">Dipa Sharma</div>
            <div className="text-slate-500 leading-tight">NOC Engineer</div>
          </div>
        </div>
      </div>
    </header>
  );
}