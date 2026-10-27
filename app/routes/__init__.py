from flask import render_template

from app.routes.students import students_bp
from app.routes.subjects import subjects_bp
from app.routes.marks import marks_bp
from app.routes.reports import reports_bp


def register_routes(app):
    @app.route('/')
    def home():
        return render_template("index.html")

    app.register_blueprint(students_bp)
    app.register_blueprint(subjects_bp)
    app.register_blueprint(marks_bp)
    app.register_blueprint(reports_bp)

    @app.route('/health')
    def health_check():
        from app.db import get_db
        try:
            conn = get_db()
            conn.ping(reconnect=True)
            return {"status": "ok", "database": "connected"}, 200
        except Exception:
            return {"status": "degraded", "database": "unavailable"}, 500
