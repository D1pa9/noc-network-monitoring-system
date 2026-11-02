from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

from models import db
from routes.devices import devices_bp
from routes.dashboard import dashboard_bp
from routes.incidents import incidents_bp
from routes.reports import reports_bp
from monitor import start_monitor

load_dotenv()


def create_app(config_override: dict | None = None):
    app = Flask(__name__)

    # SQLite tuning for concurrent access (monitor thread + Flask)
    db_url = os.getenv("DATABASE_URL", "sqlite:///nexus.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "connect_args": {"timeout": 15},
        "pool_pre_ping": True,
    }

    if config_override:
        app.config.update(config_override)

    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

    db.init_app(app)

    app.register_blueprint(devices_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(incidents_bp)
    app.register_blueprint(reports_bp)

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "nexus-noc-backend"})

    with app.app_context():
        db.create_all()
        # Enable WAL mode for better concurrency
        if "sqlite" in db_url:
            try:
                db.session.execute(db.text("PRAGMA journal_mode=WAL;"))
                db.session.execute(db.text("PRAGMA synchronous=NORMAL;"))
                db.session.commit()
            except Exception:
                db.session.rollback()

    return app


app = create_app()

if __name__ == "__main__":
    start_monitor(app)
    app.run(host="127.0.0.1", port=5000, debug=True)