from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify
from models import db, Device, Incident, MonitoringCheck

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.get("/stats")
def stats():
    """
    Aggregate overview for the dashboard. All values are computed from the DB.
    """
    total = Device.query.count()
    online = Device.query.filter_by(status="online").count()
    warning = Device.query.filter_by(status="warning").count()
    offline = Device.query.filter_by(status="offline").count()
    unknown = Device.query.filter_by(status="unknown").count()

    active_incidents = Incident.query.filter(
        Incident.status.in_(["open", "acknowledged", "investigating", "escalated"])
    ).count()

    # Average response time from the last 24h of successful monitoring checks
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_successes = (
        MonitoringCheck.query
        .filter(MonitoringCheck.success.is_(True))
        .filter(MonitoringCheck.checked_at >= since)
        .filter(MonitoringCheck.response_ms.isnot(None))
        .all()
    )
    if recent_successes:
        avg_response = sum(c.response_ms for c in recent_successes) / len(recent_successes)
    else:
        avg_response = None

    # Availability % = (online + warning) / (online + warning + offline)
    # Unknown is excluded — no evidence either way
    monitored = online + warning + offline
    availability = round(((online + warning) / monitored) * 100, 2) if monitored else None

    # Simple SLA definition: % of active incidents that were acknowledged
    # within 15 min and resolved within 4 h (transparent, documented).
    resolved = Incident.query.filter(
        Incident.resolved_at.isnot(None),
        Incident.acknowledged_at.isnot(None),
    ).all()

    within_sla = 0
    for inc in resolved:
        ack_seconds = (inc.acknowledged_at - inc.detected_at).total_seconds()
        res_seconds = (inc.resolved_at - inc.detected_at).total_seconds()
        if ack_seconds <= 900 and res_seconds <= 14400:
            within_sla += 1
    sla = round((within_sla / len(resolved)) * 100, 2) if resolved else None

    return jsonify({
        "devices": {
            "total": total, "online": online, "warning": warning,
            "offline": offline, "unknown": unknown,
        },
        "incidents": {"active": active_incidents},
        "avg_response_ms": round(avg_response, 1) if avg_response is not None else None,
        "availability_pct": availability,
        "sla_pct": sla,
    })


@dashboard_bp.get("/recent-incidents")
def recent_incidents():
    """Last 8 incidents, most recent first."""
    rows = (
        Incident.query
        .order_by(Incident.detected_at.desc())
        .limit(8)
        .all()
    )
    return jsonify({
        "incidents": [
            {
                "id": i.id,
                "incident_code": i.incident_code,
                "title": i.title,
                "severity": i.severity,
                "status": i.status,
                "detected_at": i.detected_at.isoformat() if i.detected_at else None,
                "device_id": i.device_id,
            }
            for i in rows
        ]
    })


@dashboard_bp.get("/events")
def recent_events():
    """Last 10 monitoring events (checks that changed a device state)."""
    rows = (
        MonitoringCheck.query
        .order_by(MonitoringCheck.checked_at.desc())
        .limit(10)
        .all()
    )
    devices_by_id = {
        d.id: d.hostname for d in Device.query.all()
    }
    return jsonify({
        "events": [
            {
                "id": c.id,
                "device_id": c.device_id,
                "hostname": devices_by_id.get(c.device_id, "—"),
                "success": c.success,
                "response_ms": c.response_ms,
                "error": c.error,
                "checked_at": c.checked_at.isoformat() if c.checked_at else None,
            }
            for c in rows
        ]
    })