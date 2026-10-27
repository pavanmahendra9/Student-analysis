import pytest

from app import create_app
from app.analytics.reports import build_section_summary
from app.validators import (
    compute_grade,
    normalize_threshold,
    overall_percentage,
    qualifies_for_low_performance,
    validate_positive_integer,
)


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    return app.test_client()


def test_compute_grade_thresholds():
    assert compute_grade(95.0) == "A"
    assert compute_grade(85.0) == "B"
    assert compute_grade(75.0) == "C"
    assert compute_grade(65.0) == "D"
    assert compute_grade(45.0) == "E"
    assert compute_grade(39.9) == "F"


def test_overall_percentage_and_low_performance_threshold():
    assert overall_percentage(450, 500) == 90.0
    assert qualifies_for_low_performance(35, 40) is True
    assert qualifies_for_low_performance(40, 40) is False


def test_invalid_grade_thresholds_are_rejected():
    with pytest.raises(ValueError):
        compute_grade(-1)


@pytest.mark.parametrize("value", [None, 0, -1, 1.5, True, "not-an-id"])
def test_positive_integer_rejects_invalid_values(value):
    with pytest.raises(ValueError):
        validate_positive_integer(value, "student_id")


def test_positive_integer_accepts_integer_values():
    assert validate_positive_integer("12", "student_id") == 12


@pytest.mark.parametrize("value", ["nan", "inf", "-inf"])
def test_threshold_rejects_non_finite_values(value):
    with pytest.raises(ValueError):
        normalize_threshold(value)


def test_invalid_student_payload_returns_validation_error(client):
    response = client.post("/api/students", json={"roll_no": "", "name": "Student", "section": "A"})

    assert response.status_code == 422
    assert response.json["error"]["code"] == "VALIDATION_ERROR"


def test_non_object_json_payload_returns_validation_error(client):
    response = client.post("/api/students", json=["not", "an", "object"])

    assert response.status_code == 400
    assert response.json["error"]["code"] == "VALIDATION_ERROR"


def test_invalid_mark_id_returns_validation_error_without_database(client):
    response = client.post(
        "/api/marks",
        json={"student_id": 1.5, "subject_id": 1, "assessment": "Midterm", "marks_obtained": 80},
    )

    assert response.status_code == 422
    assert response.json["error"]["code"] == "VALIDATION_ERROR"


def test_homepage_serves_local_dashboard_without_database(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.mimetype == "text/html"
    assert b"Student Performance" in response.data
    assert b"Students" in response.data
    assert b"Saved in this browser" in response.data


def test_dashboard_assets_are_served(client):
    css_response = client.get("/static/style.css")
    js_response = client.get("/static/app.js")

    assert css_response.status_code == 200
    assert b".app-shell" in css_response.data
    assert js_response.status_code == 200
    assert b"classroom.performance.v1" in js_response.data


def test_section_summary_aggregates_student_metrics():
    import pandas as pd

    summary = build_section_summary(
        pd.DataFrame(
            [
                {"student_id": 1, "section": "A", "overall_percentage": 80.0, "overall_pass": 1},
                {"student_id": 2, "section": "A", "overall_percentage": 60.0, "overall_pass": 0},
                {"student_id": 3, "section": "B", "overall_percentage": 100.0, "overall_pass": 1},
            ]
        )
    ).set_index("section")

    assert summary.loc["A", "student_count"] == 2
    assert summary.loc["A", "avg_overall_percentage"] == 70.0
    assert summary.loc["A", "pass_rate"] == 50.0


def test_section_summary_endpoint_returns_aggregated_metrics(client, monkeypatch):
    import app.routes.reports as reports_routes

    monkeypatch.setattr(
        reports_routes,
        "fetch_all",
        lambda query, params=(): [
            {"student_id": 1, "section": "A", "overall_percentage": 80.0, "overall_pass": 1},
            {"student_id": 2, "section": "A", "overall_percentage": 60.0, "overall_pass": 0},
        ],
    )

    response = client.get("/api/reports/section-summary")

    assert response.status_code == 200
    assert response.json["items"] == [
        {
            "section": "A",
            "student_count": 2,
            "avg_overall_percentage": 70.0,
            "pass_rate": 50.0,
        }
    ]


def test_chart_endpoint_builds_windows_safe_image_url(client, monkeypatch):
    import app.routes.reports as reports_routes

    monkeypatch.setattr(reports_routes, "fetch_all", lambda query, params=(): [])
    monkeypatch.setattr(
        reports_routes,
        "subject_average_chart",
        lambda dataframe: r"C:\reports\subject_average.png",
    )

    response = client.get("/api/reports/subject-average-chart")

    assert response.status_code == 200
    assert response.json["image_url"] == "/reports/generated/subject_average.png"
