from flask import Blueprint, request

from app.db import fetch_all
from app.errors import ApiError, error_response, request_json_object
from app.services.student_service import create_student, delete_student, get_student, list_students, update_student

students_bp = Blueprint("students", __name__)


@students_bp.route("/api/students", methods=["GET"])
def get_students():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    search = request.args.get("search")
    section = request.args.get("section")
    return list_students(page=page, per_page=per_page, search=search, section=section)


@students_bp.route("/api/students", methods=["POST"])
def create_students_route():
    payload = request_json_object()
    try:
        student = create_student(payload)
        return student, 201
    except ApiError as exc:
        return error_response(exc)


@students_bp.route("/api/students/<int:student_id>", methods=["GET"])
def get_student_route(student_id):
    try:
        student = get_student(student_id)
        results = fetch_all(
            """
            SELECT m.mark_id, m.subject_id, sub.subject_name, m.assessment, m.marks_obtained, sub.pass_marks
            FROM marks m
            JOIN subjects sub ON sub.subject_id = m.subject_id
            WHERE m.student_id = %s
            ORDER BY sub.subject_id, m.assessment
            """,
            (student_id,),
        )
        return {"student": student, "results": results}, 200
    except ApiError as exc:
        return error_response(exc)


@students_bp.route("/api/students/<int:student_id>", methods=["PUT", "PATCH"])
def update_student_route(student_id):
    payload = request_json_object()
    try:
        return update_student(student_id, payload), 200
    except ApiError as exc:
        return error_response(exc)


@students_bp.route("/api/students/<int:student_id>", methods=["DELETE"])
def delete_student_route(student_id):
    try:
        result = delete_student(student_id)
        return result, 204
    except ApiError as exc:
        return error_response(exc)


@students_bp.route("/api/students/<int:student_id>/results", methods=["GET"])
def student_results_route(student_id):
    from app.services.analytics_service import student_result_summary
    try:
        return student_result_summary(student_id), 200
    except ApiError as exc:
        return error_response(exc)


@students_bp.app_errorhandler(ApiError)
def handle_api_error(error):
    return error_response(error)
