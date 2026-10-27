from pathlib import Path

import pandas as pd
from flask import Blueprint, request

from app.analytics.reports import build_section_summary, build_subject_summary, pass_percentage_chart, subject_average_chart
from app.db import fetch_all
from app.errors import ApiError, error_response
from app.services.analytics_service import low_performance_report, numpy_statistics_report, toppers_report
from app.validators import normalize_threshold

reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/api/reports/subject-summary", methods=["GET"])
def subject_summary_route():
    rows = fetch_all(
        """
        SELECT m.subject_id, sub.subject_name, sub.max_marks, sub.pass_marks, m.marks_obtained
        FROM marks m
        JOIN subjects sub ON sub.subject_id = m.subject_id
        """
    )
    df = build_subject_summary(pd.DataFrame(rows))
    return {"items": df.to_dict("records")}, 200


@reports_bp.route("/api/reports/section-summary", methods=["GET"])
def section_summary_route():
    rows = fetch_all(
        """
        SELECT s.student_id, s.section,
               SUM(m.marks_obtained) * 100.0 / NULLIF(SUM(sub.max_marks), 0) AS overall_percentage,
               MIN(CASE WHEN m.marks_obtained >= sub.pass_marks THEN 1 ELSE 0 END) AS overall_pass
        FROM students s
        JOIN marks m ON m.student_id = s.student_id
        JOIN subjects sub ON sub.subject_id = m.subject_id
        GROUP BY s.student_id, s.section
        """
    )
    df = build_section_summary(pd.DataFrame(rows))
    return {"items": df.to_dict("records")}, 200


@reports_bp.route("/api/reports/toppers", methods=["GET"])
def toppers_route():
    return {"items": toppers_report()}, 200


@reports_bp.route("/api/reports/low-performance", methods=["GET"])
def low_performance_route():
    threshold = request.args.get("threshold", default=40, type=float)
    try:
        validated = normalize_threshold(threshold)
        return {"threshold": validated, "items": low_performance_report(validated)}, 200
    except ValueError as exc:
        return error_response(ApiError("VALIDATION_ERROR", str(exc), 400))


@reports_bp.route("/api/reports/statistics", methods=["GET"])
def statistics_route():
    return {"statistics": numpy_statistics_report()}, 200


@reports_bp.route("/api/reports/subject-average-chart", methods=["GET"])
def subject_average_chart_route():
    rows = fetch_all(
        """
        SELECT sub.subject_name, AVG(m.marks_obtained) AS avg_marks
        FROM marks m
        JOIN subjects sub ON sub.subject_id = m.subject_id
        GROUP BY sub.subject_name
        """
    )
    df = pd.DataFrame(rows)
    chart_path = subject_average_chart(df)
    return {"chart_path": chart_path, "image_url": f"/reports/generated/{Path(chart_path).name}"}, 200


@reports_bp.route("/api/reports/pass-percentage-chart", methods=["GET"])
def pass_percentage_chart_route():
    rows = fetch_all(
        """
        SELECT sub.subject_name, AVG(CASE WHEN m.marks_obtained >= sub.pass_marks THEN 1 ELSE 0 END) * 100 AS pass_percentage
        FROM marks m
        JOIN subjects sub ON sub.subject_id = m.subject_id
        GROUP BY sub.subject_name
        """
    )
    df = pd.DataFrame(rows)
    chart_path = pass_percentage_chart(df)
    return {"chart_path": chart_path, "image_url": f"/reports/generated/{Path(chart_path).name}"}, 200


@reports_bp.route("/api/reports/student-performance", methods=["GET"])
def student_performance_route():
    return {"items": fetch_all("SELECT * FROM students")}, 200


@reports_bp.route("/reports/generated/<path:filename>", methods=["GET"])
def serve_chart(filename):
    from flask import send_from_directory
    from pathlib import Path
    safe_dir = Path(__file__).resolve().parent.parent.parent / "reports"
    return send_from_directory(str(safe_dir), filename)
