import time
import threading
import subprocess
import platform
from datetime import datetime, timezone
from models import db, Device, MonitoringCheck, Incident

_monitor_running = False


def ping(ip: str) -> tuple[bool, float | None, str | None]:
    param = "-n" if platform.system().lower() == "windows" else "-c"
    timeout_param = "-w" if platform.system().lower() == "windows" else "-W"
    timeout_val = "1000" if platform.system().lower() == "windows" else "1"
    command = ["ping", param, "1", timeout_param, timeout_val, ip]

    try:
        start_time = time.time()
        result = subprocess.run(
            command, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, timeout=2,
        )
        end_time = time.time()

        if result.returncode == 0:
            response_ms = round((end_time - start_time) * 1000, 2)
            return True, response_ms, None
        else:
            return False, None, "Timeout/Unreachable"
    except subprocess.TimeoutExpired:
        return False, None, "Ping process timed out"
    except Exception as e:
        return False, None, str(e)


def run_check_cycle(app):
    with app.app_context():
        devices = Device.query.all()
        now = datetime.now(timezone.utc)

        for dev in devices:
            success, ms, error = ping(dev.ip_address)

            check = MonitoringCheck(
                device_id=dev.id,
                checked_at=now,
                success=success,
                response_ms=ms,
                error=error,
            )
            db.session.add(check)

            dev.last_check_at = now
            if success:
                dev.status = "online" if (ms and ms < 150) else "warning"
                dev.last_success_at = now
                dev.avg_response_ms = ms
            else:
                dev.status = "offline"
                dev.avg_response_ms = None

            active_inc = Incident.query.filter(
                Incident.device_id == dev.id,
                Incident.status.in_(["open", "acknowledged", "investigating"]),
            ).first()

            if dev.status == "offline":
                if not active_inc:
                    inc_code = f"INC-{now.year}-{str(Incident.query.count() + 1).zfill(4)}"
                    new_inc = Incident(
                        incident_code=inc_code,
                        device_id=dev.id,
                        title=f"Device Unreachable: {dev.hostname}",
                        description=f"ICMP monitoring failed for {dev.ip_address}.",
                        severity="critical",
                        status="open",
                        detected_at=now,
                    )
                    db.session.add(new_inc)
                    print(f"[MONITOR] ALERT: Generated incident {inc_code} for {dev.hostname}")
            else:
                if active_inc:
                    active_inc.change_status("resolved", "System Monitor")
                    active_inc.resolution_notes = "Auto-resolved: device came back online."
                    print(f"[MONITOR] RECOVERY: Auto-resolved incident {active_inc.incident_code} for {dev.hostname}")

        # Commit with retry on "database is locked"
        for attempt in range(3):
            try:
                db.session.commit()
                break
            except Exception as e:
                db.session.rollback()
                if "locked" in str(e).lower() and attempt < 2:
                    print(f"[MONITOR] DB locked, retrying ({attempt + 1}/3)...")
                    time.sleep(1)
                    continue
                print(f"[MONITOR] DB Error after {attempt + 1} attempts: {e}")
                break


def _monitor_loop(app):
    global _monitor_running
    print("[MONITOR] Background engine started.")
    while _monitor_running:
        run_check_cycle(app)
        time.sleep(45)


def start_monitor(app):
    global _monitor_running
    if _monitor_running:
        return
    _monitor_running = True
    thread = threading.Thread(target=_monitor_loop, args=(app,), daemon=True)
    thread.start()