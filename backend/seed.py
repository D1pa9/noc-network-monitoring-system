"""
Seed demo data for the NEXUS NOC project.
Run: python seed.py
"""
from datetime import datetime, timezone, timedelta
from app import create_app
from models import db, Device, User, Incident, MonitoringCheck


DEVICES = [
    # Core
    dict(hostname="core-rtr-01", ip_address="127.0.0.1", device_type="router",
         location="Dhaka HQ", vendor="Cisco", model="ISR 4331",
         network_segment="VLAN 10 - Management", monitoring_protocol="icmp",
         monitoring_interval=30, status="online", description="Core WAN router"),
    dict(hostname="core-rtr-02", ip_address="10.10.0.2", device_type="router",
         location="Dhaka HQ", vendor="Cisco", model="ISR 4331",
         network_segment="VLAN 10 - Management", monitoring_protocol="icmp",
         monitoring_interval=30, status="offline",
         description="Standby WAN router - under investigation"),
    dict(hostname="core-fw-01", ip_address="8.8.8.8", device_type="firewall",
         location="Dhaka HQ", vendor="Fortinet", model="FortiGate 100F",
         network_segment="VLAN 10 - Management", monitoring_protocol="snmp",
         monitoring_interval=60, status="online", description="Perimeter firewall"),
    dict(hostname="core-sw-01", ip_address="1.1.1.1", device_type="switch",
         location="Dhaka HQ", vendor="Cisco", model="Catalyst 9200",
         network_segment="VLAN 10 - Management", monitoring_protocol="snmp",
         monitoring_interval=60, status="online", description="Core switch"),
    dict(hostname="core-sw-02", ip_address="8.8.4.4", device_type="switch",
         location="Dhaka HQ", vendor="Cisco", model="Catalyst 9200",
         network_segment="VLAN 20 - Users", monitoring_protocol="snmp",
         monitoring_interval=60, status="warning",
         description="Access switch - high interface utilization"),

    # Branch offices - simulate real outage
    dict(hostname="br1-rtr-01", ip_address="10.20.0.1", device_type="router",
         location="Branch Office 1 - Savar", vendor="MikroTik", model="CCR1009",
         network_segment="VLAN 30 - Branch", monitoring_protocol="icmp",
         monitoring_interval=60, status="offline",
         description="Branch office gateway"),
    dict(hostname="br1-ap-01", ip_address="10.20.0.10", device_type="access_point",
         location="Branch Office 1 - Savar", vendor="Ubiquiti", model="UniFi 6",
         network_segment="VLAN 40 - Wireless", monitoring_protocol="icmp",
         monitoring_interval=120, status="offline",
         description="Branch wireless AP"),

    # Server farm
    dict(hostname="erp-srv-01", ip_address="9.9.9.9", device_type="server",
         location="Dhaka HQ - Server Farm", vendor="Dell", model="PowerEdge R740",
         network_segment="VLAN 50 - Servers", monitoring_protocol="icmp",
         monitoring_interval=60, status="online",
         description="ERP application server"),
    dict(hostname="nms-srv-01", ip_address="208.67.222.222", device_type="server",
         location="Dhaka HQ - Server Farm", vendor="HP", model="ProLiant DL380",
         network_segment="VLAN 50 - Servers", monitoring_protocol="icmp",
         monitoring_interval=60, status="online",
         description="NMS / monitoring server"),
    dict(hostname="dns-srv-01", ip_address="208.67.220.220", device_type="server",
         location="Dhaka HQ - Server Farm", vendor="Linux", model="Ubuntu 22.04",
         network_segment="VLAN 50 - Servers", monitoring_protocol="icmp",
         monitoring_interval=120, status="online",
         description="DNS resolver"),

    # Workstations
    dict(hostname="noc-wks-01", ip_address="1.0.0.1", device_type="workstation",
         location="Dhaka HQ - NOC Room", vendor="Dell", model="OptiPlex 7090",
         network_segment="VLAN 20 - Users", monitoring_protocol="icmp",
         monitoring_interval=300, status="online",
         description="NOC monitoring workstation"),
    dict(hostname="edge-gw-01", ip_address="4.2.2.1", device_type="gateway",
         location="Dhaka HQ", vendor="Cisco", model="ASA 5516",
         network_segment="VLAN 10 - Management", monitoring_protocol="icmp",
         monitoring_interval=30, status="online", description="Default gateway"),
]


def run():
    app = create_app()
    with app.app_context():
        db.create_all()

        # 1. Seed Users
        if User.query.count() == 0:
            db.session.add(User(
                username="dipa",
                full_name="Dipa Sharma",
                email="dipa@nexus-noc.local",
                role="admin",
            ))
            print("Inserted demo user 'dipa'")

        # 2. Seed Devices
        if Device.query.count() == 0:
            for d in DEVICES:
                db.session.add(Device(**d))
            print(f"Inserted {len(DEVICES)} demo devices")
        else:
            print(f"Devices table already has {Device.query.count()} rows — skipping seed")

        db.session.commit() # Commit devices first so they have IDs

        # 3. Seed Incidents (Dashboard data)
        now = datetime.now(timezone.utc)
        if Incident.query.count() == 0:
            demo_incidents = [
                dict(
                    incident_code="INC-2026-0001",
                    device_id=2,
                    title="Core WAN router unreachable",
                    description="3 consecutive ICMP timeouts on 10.10.0.2",
                    severity="critical",
                    status="investigating",
                    detected_at=now - timedelta(minutes=45),
                    acknowledged_at=now - timedelta(minutes=42),
                    assigned_to="Dipa Sharma",
                ),
                dict(
                    incident_code="INC-2026-0002",
                    device_id=10,
                    title="High DNS response time",
                    description="Response time spiked to 250ms on dns-srv-01",
                    severity="medium",
                    status="open",
                    detected_at=now - timedelta(hours=3),
                    assigned_to=None,
                ),
                dict(
                    incident_code="INC-2026-0003",
                    device_id=5,
                    title="Switch interface utilization above threshold",
                    description="Port Gi0/24 sustained above 85% for 10 min",
                    severity="high",
                    status="acknowledged",
                    detected_at=now - timedelta(hours=6),
                    acknowledged_at=now - timedelta(hours=5, minutes=55),
                    assigned_to="Dipa Sharma",
                ),
                dict(
                    incident_code="INC-2026-0004",
                    device_id=1,
                    title="Core router interface flap",
                    description="Interface Gi0/1 flapped 4 times in 5 minutes",
                    severity="low",
                    status="resolved",
                    detected_at=now - timedelta(hours=30),
                    acknowledged_at=now - timedelta(hours=29, minutes=55),
                    resolved_at=now - timedelta(hours=28),
                    assigned_to="Dipa Sharma",
                    root_cause="Damaged patch cable in core rack",
                    resolution_notes="Replaced patch cable, link stable for 2 hours.",
                ),
            ]
            for i in demo_incidents:
                db.session.add(Incident(**i))
            print(f"Inserted {len(demo_incidents)} demo incidents")
        else:
             print(f"Incidents table already has {Incident.query.count()} rows — skipping seed")

        # 4. Seed Monitoring Checks (Response time data)
        if MonitoringCheck.query.count() == 0:
            device_ids = [d.id for d in Device.query.all()]
            # Only seed checks for the first 5 devices to keep it light
            for minutes_ago in range(1, 60, 2):
                for dev_id in device_ids[:5]:
                    db.session.add(MonitoringCheck(
                        device_id=dev_id,
                        checked_at=now - timedelta(minutes=minutes_ago),
                        success=True,
                        response_ms=8 + (dev_id * 3) + (minutes_ago % 7),
                    ))
            print("Inserted 150 demo monitoring checks")
        else:
             print(f"MonitoringChecks table already has {MonitoringCheck.query.count()} rows — skipping seed")

        db.session.commit()
        print("Seed complete.")


if __name__ == "__main__":
    run()