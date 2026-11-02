import ipaddress

VALID_DEVICE_TYPES = {
    "router", "switch", "firewall", "server",
    "access_point", "gateway", "workstation"
}

VALID_STATUSES = {"online", "offline", "warning", "unknown"}

VALID_PROTOCOLS = {"icmp", "snmp", "both", "none"}


def validate_ip(ip: str) -> bool:
    """Return True if ip is a valid IPv4 or IPv6 address."""
    try:
        ipaddress.ip_address(ip)
        return True
    except (ValueError, TypeError):
        return False


def validate_device_payload(data: dict, partial: bool = False) -> tuple[bool, str]:
    """
    Validate device create/update payload.
    Returns (True, "") if valid, or (False, "error message") if invalid.
    """
    required = ["hostname", "ip_address", "device_type"]
    if not partial:
        for field in required:
            if not data.get(field):
                return False, f"Missing required field: {field}"

    if "hostname" in data:
        hostname = str(data["hostname"]).strip()
        if len(hostname) < 2 or len(hostname) > 64:
            return False, "Hostname must be 2-64 characters"
        if not all(c.isalnum() or c in "-_." for c in hostname):
            return False, "Hostname may contain only letters, digits, '-', '_', '.'"

    if "ip_address" in data:
        if not validate_ip(data["ip_address"]):
            return False, f"Invalid IP address: {data['ip_address']}"

    if "device_type" in data:
        if data["device_type"] not in VALID_DEVICE_TYPES:
            return False, f"Invalid device_type. Allowed: {sorted(VALID_DEVICE_TYPES)}"

    if "status" in data and data["status"] not in VALID_STATUSES:
        return False, f"Invalid status. Allowed: {sorted(VALID_STATUSES)}"

    if "monitoring_protocol" in data and data["monitoring_protocol"] not in VALID_PROTOCOLS:
        return False, f"Invalid monitoring_protocol. Allowed: {sorted(VALID_PROTOCOLS)}"

    if "monitoring_interval" in data:
        try:
            interval = int(data["monitoring_interval"])
            if interval < 10 or interval > 3600:
                return False, "monitoring_interval must be between 10 and 3600 seconds"
        except (ValueError, TypeError):
            return False, "monitoring_interval must be an integer"

    return True, ""