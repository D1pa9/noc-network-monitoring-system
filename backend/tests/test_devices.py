import pytest
from app import create_app
from models import db, Device
from validators import validate_ip, validate_device_payload


@pytest.fixture
def client():
    app = create_app({
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "TESTING": True,
    })
    with app.app_context():
        yield app.test_client()
        db.session.remove()
        db.drop_all()


# ... rest of your tests stay exactly the same

def test_validate_ip():
    assert validate_ip("10.0.0.1") is True
    assert validate_ip("192.168.1.1") is True
    assert validate_ip("999.999.999.999") is False
    assert validate_ip("not-an-ip") is False
    assert validate_ip("") is False


def test_payload_requires_fields():
    ok, msg = validate_device_payload({"hostname": "x"}, partial=False)
    assert ok is False
    assert "ip_address" in msg or "hostname" in msg


def test_payload_rejects_bad_type():
    ok, msg = validate_device_payload(
        {"hostname": "sw1", "ip_address": "10.0.0.1", "device_type": "toaster"},
        partial=False,
    )
    assert ok is False
    assert "device_type" in msg


def test_create_device(client):
    r = client.post("/api/devices", json={
        "hostname": "sw-test", "ip_address": "10.1.1.1",
        "device_type": "switch", "location": "Test",
    })
    assert r.status_code == 201
    body = r.get_json()
    assert body["hostname"] == "sw-test"
    assert body["status"] == "unknown"


def test_duplicate_ip_rejected(client):
    client.post("/api/devices", json={
        "hostname": "sw-a", "ip_address": "10.1.1.1", "device_type": "switch"
    })
    r = client.post("/api/devices", json={
        "hostname": "sw-b", "ip_address": "10.1.1.1", "device_type": "switch"
    })
    assert r.status_code == 409


def test_list_filter_by_type(client):
    client.post("/api/devices", json={
        "hostname": "r1", "ip_address": "10.1.1.1", "device_type": "router"
    })
    client.post("/api/devices", json={
        "hostname": "s1", "ip_address": "10.1.1.2", "device_type": "switch"
    })
    r = client.get("/api/devices?type=router")
    body = r.get_json()
    assert body["count"] == 1
    assert body["devices"][0]["hostname"] == "r1"


def test_update_and_delete(client):
    r = client.post("/api/devices", json={
        "hostname": "sw-a", "ip_address": "10.1.1.1", "device_type": "switch"
    })
    device_id = r.get_json()["id"]

    r = client.patch(f"/api/devices/{device_id}", json={"status": "online"})
    assert r.status_code == 200
    assert r.get_json()["status"] == "online"

    r = client.delete(f"/api/devices/{device_id}")
    assert r.status_code == 200

    r = client.get(f"/api/devices/{device_id}")
    assert r.status_code == 404