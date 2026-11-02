import type {
  Device,
  DeviceCreatePayload,
  DeviceListResponse,
  DeviceUpdatePayload,
} from "../types/device";

const API_BASE = "http://localhost:5000/api";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export interface DeviceQuery {
  type?: string;
  status?: string;
  location?: string;
  q?: string;
}

export async function listDevices(query: DeviceQuery = {}): Promise<DeviceListResponse> {
  const params = new URLSearchParams();
  if (query.type) params.set("type", query.type);
  if (query.status) params.set("status", query.status);
  if (query.location) params.set("location", query.location);
  if (query.q) params.set("q", query.q);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/devices${qs ? `?${qs}` : ""}`);
  return handle<DeviceListResponse>(res);
}

export async function getDevice(id: number): Promise<Device> {
  const res = await fetch(`${API_BASE}/devices/${id}`);
  return handle<Device>(res);
}

export async function createDevice(payload: DeviceCreatePayload): Promise<Device> {
  const res = await fetch(`${API_BASE}/devices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle<Device>(res);
}

export async function updateDevice(
  id: number,
  payload: DeviceUpdatePayload
): Promise<Device> {
  const res = await fetch(`${API_BASE}/devices/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle<Device>(res);
}

export async function deleteDevice(id: number): Promise<{ deleted: number }> {
  const res = await fetch(`${API_BASE}/devices/${id}`, { method: "DELETE" });
  return handle<{ deleted: number }>(res);
}