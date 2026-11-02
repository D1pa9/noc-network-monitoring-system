from flask import Blueprint, request, jsonify
from models import db, Incident, IncidentNote

incidents_bp = Blueprint("incidents", __name__, url_prefix="/api/incidents")


@incidents_bp.get("")
def list_incidents():
    """List incidents, optionally filter by status or severity."""
    query = Incident.query

    status = request.args.get("status")
    if status:
        query = query.filter(Incident.status == status)

    severity = request.args.get("severity")
    if severity:
        query = query.filter(Incident.severity == severity)

    incidents = query.order_by(Incident.detected_at.desc()).all()

    return jsonify({
        "count": len(incidents),
        "incidents": [i.to_dict() for i in incidents],
    })


@incidents_bp.get("/<int:incident_id>")
def get_incident(incident_id):
    incident = db.session.get(Incident, incident_id)
    if not incident:
        return jsonify({"error": "Incident not found"}), 404

    notes = (
        IncidentNote.query
        .filter_by(incident_id=incident_id)
        .order_by(IncidentNote.created_at.asc())
        .all()
    )

    data = incident.to_dict()
    data["notes"] = [n.to_dict() for n in notes]
    return jsonify(data)


@incidents_bp.patch("/<int:incident_id>/status")
def update_status(incident_id):
    """Change status and record the engineer who did it."""
    incident = db.session.get(Incident, incident_id)
    if not incident:
        return jsonify({"error": "Incident not found"}), 404

    data = request.get_json() or {}
    new_status = data.get("status")
    engineer = data.get("engineer", "Dipa Sharma")

    valid_statuses = [
        "open", "acknowledged", "investigating",
        "escalated", "resolved", "closed",
    ]
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of {valid_statuses}"}), 400

    incident.change_status(new_status, engineer)

    note = IncidentNote(
        incident_id=incident.id,
        author=engineer,
        note=f"Status changed to {new_status.upper()}",
    )
    db.session.add(note)
    db.session.commit()

    return jsonify(incident.to_dict())


@incidents_bp.post("/<int:incident_id>/notes")
def add_note(incident_id):
    """Add an investigation note to the incident."""
    incident = db.session.get(Incident, incident_id)
    if not incident:
        return jsonify({"error": "Incident not found"}), 404

    data = request.get_json() or {}
    if not data.get("note"):
        return jsonify({"error": "Note text is required"}), 400

    note = IncidentNote(
        incident_id=incident.id,
        author=data.get("author", "Dipa sharma"),
        note=data["note"],
    )
    db.session.add(note)
    db.session.commit()

    return jsonify(note.to_dict()), 201