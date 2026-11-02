import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import type {
  Device,
  DeviceCreatePayload,
  DeviceType,
  DeviceStatus,
  MonitoringProtocol,
} from "../../types/device";

interface Props {
  open: boolean;
  device: Device | null;           // null = create, Device = edit
  onClose: () => void;
  onSubmit: (payload: DeviceCreatePayload) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

const TYPES: DeviceType[] = [
  "router", "switch", "firewall", "server",
  "access_point", "gateway", "workstation",
];

const STATUSES: DeviceStatus[] = ["online", "warning", "offline", "unknown"];

const PROTOCOLS: MonitoringProtocol[] = ["icmp", "snmp", "both", "none"];

const EMPTY: DeviceCreatePayload = {
  hostname: "",
  ip_address: "",
  device_type: "switch",
  location: "",
  vendor: "",
  model: "",
  network_segment: "",
  monitoring_protocol: "icmp",
  monitoring_interval: 60,
  status: "unknown",
  description: "",
};

export default function DeviceFormModal({
  open, device, onClose, onSubmit, onDelete,
}: Props) {
  const [form, setForm] = useState<DeviceCreatePayload>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = device !== null;

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (device) {
      setForm({
        hostname: device.hostname,
        ip_address: device.ip_address,
        device_type: device.device_type,
        location: device.location ?? "",
        vendor: device.vendor ?? "",
        model: device.model ?? "",
        network_segment: device.network_segment ?? "",
        monitoring_protocol: device.monitoring_protocol,
        monitoring_interval: device.monitoring_interval,
        status: device.status,
        description: device.description ?? "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, device]);

  function update<K extends keyof DeviceCreatePayload>(
    key: K,
    value: DeviceCreatePayload[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!device || !onDelete) return;
    if (!confirm(`Delete ${device.hostname}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await onDelete(device.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit Device — ${device?.hostname}` : "Add New Device"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="px-3 py-2 rounded bg-red-500/15 border border-red-500/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Hostname *">
            <input
              required
              value={form.hostname}
              onChange={(e) => update("hostname", e.target.value)}
              className={input}
              placeholder="core-sw-03"
            />
          </Field>
          <Field label="IP Address *">
            <input
              required
              value={form.ip_address}
              onChange={(e) => update("ip_address", e.target.value)}
              className={`${input} font-mono`}
              placeholder="10.10.10.4"
            />
          </Field>

          <Field label="Device Type *">
            <select
              value={form.device_type}
              onChange={(e) => update("device_type", e.target.value as DeviceType)}
              className={input}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value as DeviceStatus)}
              className={input}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Location">
            <input
              value={form.location ?? ""}
              onChange={(e) => update("location", e.target.value)}
              className={input}
              placeholder="Dhaka HQ"
            />
          </Field>
          <Field label="Network Segment">
            <input
              value={form.network_segment ?? ""}
              onChange={(e) => update("network_segment", e.target.value)}
              className={input}
              placeholder="VLAN 10 - Management"
            />
          </Field>

          <Field label="Vendor">
            <input
              value={form.vendor ?? ""}
              onChange={(e) => update("vendor", e.target.value)}
              className={input}
              placeholder="Cisco"
            />
          </Field>
          <Field label="Model">
            <input
              value={form.model ?? ""}
              onChange={(e) => update("model", e.target.value)}
              className={input}
              placeholder="Catalyst 9200"
            />
          </Field>

          <Field label="Monitoring Protocol">
            <select
              value={form.monitoring_protocol}
              onChange={(e) =>
                update("monitoring_protocol", e.target.value as MonitoringProtocol)
              }
              className={input}
            >
              {PROTOCOLS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Monitoring Interval (s)">
            <input
              type="number"
              min={10}
              max={3600}
              value={form.monitoring_interval ?? 60}
              onChange={(e) =>
                update("monitoring_interval", Number(e.target.value))
              }
              className={input}
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            value={form.description ?? ""}
            onChange={(e) => update("description", e.target.value)}
            className={`${input} h-20 resize-none`}
            placeholder="Optional notes…"
          />
        </Field>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div>
            {isEdit && onDelete && (
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={busy}
              >
                Delete Device
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Saving…" : isEdit ? "Save Changes" : "Create Device"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

const input =
  "w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}