from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(128), unique=True, nullable=False)
    role = db.Column(db.String(32), nullable=False, default="engineer")
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
        }


class Device(db.Model):
    __tablename__ = "devices"

    id = db.Column(db.Integer, primary_key=True)
    hostname = db.Column(db.String(64), unique=True, nullable=False, index=True)
    ip_address = db.Column(db.String(45), unique=True, nullable=False, index=True)
    device_type = db.Column(db.String(32), nullable=False, index=True)
    location = db.Column(db.String(128), nullable=True, index=True)
    vendor = db.Column(db.String(64), nullable=True)
    model = db.Column(db.String(64), nullable=True)
    network_segment = db.Column(db.String(64), nullable=True)
    monitoring_protocol = db.Column(db.String(16), nullable=False, default="icmp")
    monitoring_interval = db.Column(db.Integer, nullable=False, default=60)
    status = db.Column(db.String(16), nullable=False, default="unknown", index=True)
    last_check_at = db.Column(db.DateTime(timezone=True), nullable=True)
    last_success_at = db.Column(db.DateTime(timezone=True), nullable=True)
    avg_response_ms = db.Column(db.Float, nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    def to_dict(self):
        return {
            "id": self.id,
            "hostname": self.hostname,
            "ip_address": self.ip_address,
            "device_type": self.device_type,
            "location": self.location,
            "vendor": self.vendor,
            "model": self.model,
            "network_segment": self.network_segment,
            "monitoring_protocol": self.monitoring_protocol,
            "monitoring_interval": self.monitoring_interval,
            "status": self.status,
            "last_check_at": self.last_check_at.isoformat() if self.last_check_at else None,
            "last_success_at": self.last_success_at.isoformat() if self.last_success_at else None,
            "avg_response_ms": self.avg_response_ms,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class MonitoringCheck(db.Model):
    __tablename__ = "monitoring_checks"

    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, db.ForeignKey("devices.id", ondelete="CASCADE"),
                          nullable=False, index=True)
    checked_at = db.Column(db.DateTime(timezone=True), default=utcnow,
                           nullable=False, index=True)
    success = db.Column(db.Boolean, nullable=False)
    response_ms = db.Column(db.Float, nullable=True)
    error = db.Column(db.String(256), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "device_id": self.device_id,
            "checked_at": self.checked_at.isoformat() if self.checked_at else None,
            "success": self.success,
            "response_ms": self.response_ms,
            "error": self.error,
        }


class Incident(db.Model):
    __tablename__ = "incidents"

    id = db.Column(db.Integer, primary_key=True)
    incident_code = db.Column(db.String(32), unique=True, nullable=False, index=True)
    device_id = db.Column(db.Integer, db.ForeignKey("devices.id", ondelete="SET NULL"),
                          nullable=True, index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    severity = db.Column(db.String(16), nullable=False, default="medium", index=True)
    status = db.Column(db.String(16), nullable=False, default="open", index=True)
    detected_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    acknowledged_at = db.Column(db.DateTime(timezone=True), nullable=True)
    resolved_at = db.Column(db.DateTime(timezone=True), nullable=True)
    assigned_to = db.Column(db.String(64), nullable=True)
    root_cause = db.Column(db.Text, nullable=True)
    resolution_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    def change_status(self, new_status: str, engineer: str | None = None):
        """Helper to handle timestamps when status changes."""
        self.status = new_status
        if engineer and not self.assigned_to:
            self.assigned_to = engineer

        if new_status == "acknowledged" and not self.acknowledged_at:
            self.acknowledged_at = utcnow()

        if new_status == "resolved" and not self.resolved_at:
            self.resolved_at = utcnow()
            if engineer:
                self.resolution_notes = f"Resolved by {engineer}."

    def to_dict(self):
        return {
            "id": self.id,
            "incident_code": self.incident_code,
            "device_id": self.device_id,
            "title": self.title,
            "description": self.description,
            "severity": self.severity,
            "status": self.status,
            "detected_at": self.detected_at.isoformat() if self.detected_at else None,
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "assigned_to": self.assigned_to,
            "root_cause": self.root_cause,
            "resolution_notes": self.resolution_notes,
        }


class IncidentNote(db.Model):
    __tablename__ = "incident_notes"

    id = db.Column(db.Integer, primary_key=True)
    incident_id = db.Column(db.Integer, db.ForeignKey("incidents.id", ondelete="CASCADE"),
                            nullable=False, index=True)
    author = db.Column(db.String(64), nullable=False)
    note = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "incident_id": self.incident_id,
            "author": self.author,
            "note": self.note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }