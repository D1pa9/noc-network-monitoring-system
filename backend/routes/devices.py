from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError

from models import db, Device
from validators import validate_device_payload

devices_bp = Blueprint("devices", __name__, url_prefix="/api/devices")


@devices_bp.get("")
def list_devices():
    """List devices with optional filters: type, location, status, q (search)."""
    query = Device.query

    dtype = request.args.get("type")
    if dtype:
        query = query.filter(Device.device_type == dtype)

    location = request.args.get("location")
    if location:
        query = query.filter(Device.location.ilike(f"%{location}%"))

    status = request.args.get("status")
    if status:
        query = query.filter(Device.status == status)

    q = request.args.get("q")
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Device.hostname.ilike(like))
            | (Device.ip_address.ilike(like))
            | (Device.description.ilike(like))
        )

    devices = query.order_by(Device.hostname.asc()).all()
    return jsonify({"count": len(devices), "devices": [d.to_dict() for d in devices]})


@devices_bp.get("/<int:device_id>")
def get_device(device_id: int):
    device = db.session.get(Device, device_id)
    if not device:
        return jsonify({"error": "Device not found"}), 404
    return jsonify(device.to_dict())


@devices_bp.post("")
def create_device():
    data = request.get_json(silent=True) or {}
    ok, err = validate_device_payload(data, partial=False)
    if not ok:
        return jsonify({"error": err}), 400

    if Device.query.filter_by(hostname=data["hostname"]).first():
        return jsonify({"error": f"Hostname '{data['hostname']}' already exists"}), 409
    if Device.query.filter_by(ip_address=data["ip_address"]).first():
        return jsonify({"error": f"IP '{data['ip_address']}' already exists"}), 409

    device = Device(
        hostname=data["hostname"].strip(),
        ip_address=data["ip_address"].strip(),
        device_type=data["device_type"],
        location=data.get("location"),
        vendor=data.get("vendor"),
        model=data.get("model"),
        network_segment=data.get("network_segment"),
        monitoring_protocol=data.get("monitoring_protocol", "icmp"),
        monitoring_interval=int(data.get("monitoring_interval", 60)),
        status=data.get("status", "unknown"),
        description=data.get("description"),
    )
    db.session.add(device)
    try:
        db.session.commit()
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({"error": f"Database constraint: {str(e.orig)}"}), 409

    return jsonify(device.to_dict()), 201


@devices_bp.put("/<int:device_id>")
@devices_bp.patch("/<int:device_id>")
def update_device(device_id: int):
    device = db.session.get(Device, device_id)
    if not device:
        return jsonify({"error": "Device not found"}), 404

    data = request.get_json(silent=True) or {}
    ok, err = validate_device_payload(data, partial=True)
    if not ok:
        return jsonify({"error": err}), 400

    if "hostname" in data:
        clash = Device.query.filter(
            Device.hostname == data["hostname"], Device.id != device_id
        ).first()
        if clash:
            return jsonify({"error": "Hostname already used by another device"}), 409
        device.hostname = data["hostname"].strip()

    if "ip_address" in data:
        clash = Device.query.filter(
            Device.ip_address == data["ip_address"], Device.id != device_id
        ).first()
        if clash:
            return jsonify({"error": "IP already used by another device"}), 409
        device.ip_address = data["ip_address"].strip()

    for field in (
        "device_type", "location", "vendor", "model", "network_segment",
        "monitoring_protocol", "status", "description",
    ):
        if field in data:
            setattr(device, field, data[field])

    if "monitoring_interval" in data:
        device.monitoring_interval = int(data["monitoring_interval"])

    try:
        db.session.commit()
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({"error": f"Database constraint: {str(e.orig)}"}), 409

    return jsonify(device.to_dict())


@devices_bp.delete("/<int:device_id>")
def delete_device(device_id: int):
    device = db.session.get(Device, device_id)
    if not device:
        return jsonify({"error": "Device not found"}), 404
    db.session.delete(device)
    db.session.commit()
    return jsonify({"deleted": device_id}), 200