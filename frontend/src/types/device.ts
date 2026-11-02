export type DeviceType =
  | "router"
  | "switch"
  | "firewall"
  | "server"
  | "access_point"
  | "gateway"
  | "workstation";

export type DeviceStatus = "online" | "offline" | "warning" | "unknown";

export type MonitoringProtocol = "icmp" | "snmp" | "both" | "none";

export interface Device {
  id: number;
  hostname: string;
  ip_address: string;
  device_type: DeviceType;
  location: string | null;
  vendor: string | null;
  model: string | null;
  network_segment: string | null;
  monitoring_protocol: MonitoringProtocol;
  monitoring_interval: number;
  status: DeviceStatus;
  last_check_at: string | null;
  last_success_at: string | null;
  avg_response_ms: number | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DeviceListResponse {
  count: number;
  devices: Device[];
}

export interface DeviceCreatePayload {
  hostname: string;
  ip_address: string;
  device_type: DeviceType;
  location?: string | null;
  vendor?: string | null;
  model?: string | null;
  network_segment?: string | null;
  monitoring_protocol?: MonitoringProtocol;
  monitoring_interval?: number;
  status?: DeviceStatus;
  description?: string | null;
}

export type DeviceUpdatePayload = Partial<DeviceCreatePayload>;