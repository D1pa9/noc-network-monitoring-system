import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import {
  listIncidents,
  getIncident,
  updateIncidentStatus,
  addIncidentNote,
  type Incident,
  type IncidentStatus,
} from "../api/incidents";
import { Server, AlertTriangle, X } from "lucide-react";

const SEV_COLOR = {
  critical: "text-red-400 bg-red-500/15 border-red-500/40",
  high: "text-orange-400 bg-orange-500/15 border-orange-500/40",
  medium: "text-amber-400 bg-amber-500/15 border-amber-500/40",
  low: "text-sky-400 bg-sky-500/15 border-sky-500/40",
};
const STAT_COLOR = {
  open: "text-red-400 bg-red-500/15 border-red-500/40",
  acknowledged: "text-amber-400 bg-amber-500/15 border-amber-500/40",
  investigating: "text-sky-400 bg-sky-500/15 border-sky-500/40",
  escalated: "text-orange-400 bg-orange-500/15 border-orange-500/40",
  resolved: "text-emerald-400 bg-emerald-500/15 border-emerald-500/40",
  closed: "text-slate-400 bg-slate-500/15 border-slate-500/40",
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Incident | null>(null);
  const [noteText, setNoteText] = useState("");
  const [updating, setUpdating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await listIncidents(statusFilter, severityFilter);
      setIncidents(data.incidents);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [statusFilter, severityFilter]);

  async function openDetail(id: number) {
    setSelectedId(id);
    try {
      const data = await getIncident(id);
      setDetail(data);
    } catch (e) { alert("Failed to load incident"); }
  }

  async function handleStatusChange(newStatus: IncidentStatus) {
    if (!detail) return;
    setUpdating(true);
    try {
      const updated = await updateIncidentStatus(detail.id, newStatus);
      setDetail({ ...detail, ...updated });
      await load();
    } catch (e) { alert("Failed to update"); } 
    finally { setUpdating(false); }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!detail || !noteText.trim()) return;
    setUpdating(true);
    try {
      const newNote = await addIncidentNote(detail.id, noteText);
      setDetail({ ...detail, notes: [...(detail.notes || []), newNote] });
      setNoteText("");
    } catch (e) { alert("Failed to add note"); } 
    finally { setUpdating(false); }
  }

  return (
    <Layout title="Incidents" lastUpdated={lastUpdated}>
      <div className="flex gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-950 text-slate-500 uppercase text-[11px] tracking-wider">
            <tr>
              <th className="px-4 py-2.5 font-medium">Code</th>
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Severity</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Assigned To</th>
              <th className="px-4 py-2.5 font-medium">Detected</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="p-10 text-center text-slate-500">Loading...</td></tr>}
            {!loading && incidents.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-500">No incidents found.</td></tr>}
            
            {incidents.map(i => (
              <tr 
                key={i.id} 
                onClick={() => openDetail(i.id)}
                className={`border-t border-slate-800 cursor-pointer hover:bg-slate-800/50 ${selectedId === i.id ? "bg-slate-800/50" : ""}`}
              >
                <td className="px-4 py-2 font-mono text-xs text-cyan-400">{i.incident_code}</td>
                <td className="px-4 py-2 text-slate-200">{i.title}</td>
                <td className="px-4 py-2">
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono ${SEV_COLOR[i.severity]}`}>{i.severity.toUpperCase()}</span>
                </td>
                <td className="px-4 py-2">
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono ${STAT_COLOR[i.status]}`}>{i.status.toUpperCase()}</span>
                </td>
                <td className="px-4 py-2 text-slate-400 text-xs">{i.assigned_to || "—"}</td>
                <td className="px-4 py-2 text-slate-500 font-mono text-[11px]">{i.detected_at ? new Date(i.detected_at).toLocaleString("en-GB") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide-over Detail Panel */}
      {detail && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col z-50">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
            <div>
              <div className="text-cyan-400 font-mono text-xs">{detail.incident_code}</div>
              <h2 className="text-lg font-semibold text-slate-100">{detail.title}</h2>
            </div>
            <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Status & Assign Controls */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3 rounded border border-slate-800">
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-1 block">Status</label>
                <select
                  value={detail.status}
                  onChange={(e) => handleStatusChange(e.target.value as IncidentStatus)}
                  disabled={updating}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm"
                >
                  <option value="open">Open</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="investigating">Investigating</option>
                  <option value="escalated">Escalated</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase text-slate-500 mb-1 block">Assigned Engineer</label>
                <div className="text-sm text-slate-200 py-1.5">{detail.assigned_to || "Unassigned"}</div>
              </div>
            </div>

            {/* Incident Details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <AlertTriangle size={14} /> Description
              </h3>
              <p className="text-sm text-slate-400">{detail.description}</p>
            </div>

            {/* Audit Notes / Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Server size={14} /> Investigation Log
              </h3>
              <div className="space-y-3">
                {detail.notes?.map(n => (
                  <div key={n.id} className="bg-slate-950 border border-slate-800 rounded p-2 text-sm">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>{n.author}</span>
                      <span>{new Date(n.created_at).toLocaleString("en-GB")}</span>
                    </div>
                    <div className="text-slate-300">{n.note}</div>
                  </div>
                ))}
                
                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add investigation note..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm"
                  />
                  <button type="submit" disabled={updating || !noteText.trim()} className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50">
                    Add
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}