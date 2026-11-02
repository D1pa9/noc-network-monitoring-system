import csv
import io
from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify, request, Response
from models import db, Device, Incident, MonitoringCheck

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


def _date_range_from_request():
    now = datetime.now(timezone.utc)
    from_str = request.args.get("from")
    to_str = request.args.get("to")

    try:
        date_from = datetime.fromisoformat(from_str).replace(tzinfo=timezone.utc) if from_str else now - timedelta(days=30)
    except (ValueError, TypeError):
        date_from = now - timedelta(days=30)

    try:
        date_to = datetime.fromisoformat(to_str).replace(tzinfo=timezone.utc) if to_str else now
    except (ValueError, TypeError):
        date_to = now

    return date_from, date_to


@reports_bp.get("/sla")
def sla_summary():
    date_from, date_to = _date_range_from_request()

    incidents = Incident.query.filter(
        Incident.detected_at >= date_from,
        Incident.detected_at <= date_to,
    ).all()

    total = len(incidents)
    resolved = [i for i in incidents if i.resolved_at and i.detected_at]
    acked = [i for i in incidents if i.acknowledged_at and i.detected_at]

    if acked:
        mtta_seconds = sum(
            (i.acknowledged_at - i.detected_at).total_seconds() for i in acked
        ) / len(acked)
        mtta_minutes = round(mtta_seconds / 60, 1)
    else:
        mtta_minutes = None

    if resolved:
        mttr_seconds = sum(
            (i.resolved_at - i.detected_at).total_seconds() for i in resolved
        ) / len(resolved)
        mttr_minutes = round(mttr_seconds / 60, 1)
    else:
        mttr_minutes = None

    within_sla = 0
    for inc in resolved:
        ack_ok = inc.acknowledged_at and (inc.acknowledged_at - inc.detected_at).total_seconds() <= 900
        res_ok = (inc.resolved_at - inc.detected_at).total_seconds() <= 14400
        if ack_ok and res_ok:
            within_sla += 1
    sla_pct = round((within_sla / len(resolved)) * 100, 1) if resolved else None

    checks = MonitoringCheck.query.filter(
        MonitoringCheck.checked_at >= date_from,
        MonitoringCheck.checked_at <= date_to,
    ).all()
    total_checks = len(checks)
    successful_checks = len([c for c in checks if c.success])
    availability_pct = round((successful_checks / total_checks) * 100, 2) if total_checks else None

    return jsonify({
        "period": {
            "from": date_from.isoformat(),
            "to": date_to.isoformat(),
        },
        "incidents": {
            "total": total,
            "resolved": len(resolved),
            "acknowledged": len(acked),
        },
        "mtta_minutes": mtta_minutes,
        "mttr_minutes": mttr_minutes,
        "sla_pct": sla_pct,
        "availability_pct": availability_pct,
        "checks": {
            "total": total_checks,
            "successful": successful_checks,
        },
    })


@reports_bp.get("/export/devices.csv")
def export_devices_csv():
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "id", "hostname", "ip_address", "device_type", "location",
        "vendor", "model", "network_segment", "monitoring_protocol",
        "monitoring_interval", "status", "last_check_at", "last_success_at",
    ])
    for d in Device.query.order_by(Device.hostname).all():
        writer.writerow([
            d.id, d.hostname, d.ip_address, d.device_type, d.location or "",
            d.vendor or "", d.model or "", d.network_segment or "",
            d.monitoring_protocol, d.monitoring_interval, d.status,
            d.last_check_at.isoformat() if d.last_check_at else "",
            d.last_success_at.isoformat() if d.last_success_at else "",
        ])
    return Response(
        buf.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=devices.csv"},
    )


@reports_bp.get("/export/incidents.csv")
def export_incidents_csv():
    date_from, date_to = _date_range_from_request()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "incident_code", "device_id", "title", "severity", "status",
        "detected_at", "acknowledged_at", "resolved_at",
        "assigned_to", "root_cause", "resolution_notes",
    ])
    incidents = (
        Incident.query
        .filter(Incident.detected_at >= date_from, Incident.detected_at <= date_to)
        .order_by(Incident.detected_at.desc())
        .all()
    )
    for i in incidents:
        writer.writerow([
            i.incident_code, i.device_id or "", i.title, i.severity, i.status,
            i.detected_at.isoformat() if i.detected_at else "",
            i.acknowledged_at.isoformat() if i.acknowledged_at else "",
            i.resolved_at.isoformat() if i.resolved_at else "",
            i.assigned_to or "", i.root_cause or "", i.resolution_notes or "",
        ])
    return Response(
        buf.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=incidents.csv"},
    )


@reports_bp.get("/export/monitoring.csv")
def export_monitoring_csv():
    date_from, date_to = _date_range_from_request()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "device_id", "checked_at", "success", "response_ms", "error"])
    checks = (
        MonitoringCheck.query
        .filter(MonitoringCheck.checked_at >= date_from, MonitoringCheck.checked_at <= date_to)
        .order_by(MonitoringCheck.checked_at.desc())
        .limit(5000)
        .all()
    )
    for c in checks:
        writer.writerow([
            c.id, c.device_id,
            c.checked_at.isoformat() if c.checked_at else "",
            c.success, c.response_ms or "", c.error or "",
        ])
    return Response(
        buf.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=monitoring.csv"},
    )