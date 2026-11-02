import { useEffect, useMemo, useState } from "react";
import Layout from "../components/layout/Layout";
import DeviceFilters from "../components/devices/DeviceFilters";
import DeviceTable from "../components/devices/DeviceTable";
import DeviceFormModal from "../components/devices/DeviceFormModal";
import {
  createDevice,
  deleteDevice,
  listDevices,
  updateDevice,
} from "../api/devices";
import type { Device, DeviceCreatePayload } from "../types/device";

export default function InventoryPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);

  const debouncedSearch = useDebounced(search, 300);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listDevices({
        q: debouncedSearch || undefined,
        type: type || undefined,
        status: status || undefined,
      });
      setDevices(data.devices);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, type, status]);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(d: Device) {
    setEditing(d);
    setModalOpen(true);
  }
  async function handleSubmit(payload: DeviceCreatePayload) {
    if (editing) await updateDevice(editing.id, payload);
    else await createDevice(payload);
    await refresh();
  }
  async function handleDelete(id: number) {
    await deleteDevice(id);
    await refresh();
  }

  const summary = useMemo(() => {
    return {
      total: devices.length,
      online: devices.filter((d) => d.status === "online").length,
      warning: devices.filter((d) => d.status === "warning").length,
      offline: devices.filter((d) => d.status === "offline").length,
    };
  }, [devices]);

  return (
    <Layout title="Network Inventory" lastUpdated={lastUpdated}>
      <SummaryRow {...summary} />

      {error && (
        <div className="px-4 py-2.5 rounded bg-red-500/15 border border-red-500/40 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
        <DeviceFilters
          search={search}
          onSearch={setSearch}
          type={type}
          onType={setType}
          status={status}
          onStatus={setStatus}
          onAdd={openAdd}
        />
        <DeviceTable devices={devices} onRowClick={openEdit} loading={loading} />
        <div className="px-4 py-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
          Showing {devices.length} devices
        </div>
      </div>

      <DeviceFormModal
        open={modalOpen}
        device={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </Layout>
  );
}

function SummaryRow({
  total,
  online,
  warning,
  offline,
}: {
  total: number;
  online: number;
  warning: number;
  offline: number;
}) {
  const cards = [
    { label: "Total Devices", value: total, color: "text-slate-100" },
    { label: "Online", value: online, color: "text-emerald-400" },
    { label: "Warning", value: warning, color: "text-amber-400" },
    { label: "Offline", value: offline, color: "text-red-400" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-slate-900 border border-slate-800 rounded px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">{c.label}</div>
          <div className={`text-2xl font-semibold mt-1 ${c.color}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}