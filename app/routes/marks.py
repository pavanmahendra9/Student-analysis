from flask import Blueprint, request

from app.errors import ApiError, error_response, request_json_object
from app.services.mark_service import create_mark, delete_mark, get_mark, list_marks, update_mark

marks_bp = Blueprint("marks", __name__)


@marks_bp.route("/api/marks", methods=["GET"])
def get_marks_route():
    student_id = request.args.get("student_id", type=int)
    subject_id = request.args.get("subject_id", type=int)
    section = request.args.get("section")
    assessment = request.args.get("assessment")
    return {"items": list_marks(student_id=student_id, subject_id=subject_id, section=section, assessment=assessment)}, 200


@marks_bp.route("/api/marks", methods=["POST"])
def create_mark_route():
    payload = request_json_object()
    try:
        return create_mark(payload), 201
    except ApiError as exc:
        return error_response(exc)


@marks_bp.route("/api/marks/<int:mark_id>", methods=["GET"])
def get_single_mark_route(mark_id):
    try:
        return get_mark(mark_id), 200
    except ApiError as exc:
        return error_response(exc)


@marks_bp.route("/api/marks/<int:mark_id>", methods=["PATCH", "PUT"])
def update_mark_route(mark_id):
    payload = request_json_object()
    try:
        return update_mark(mark_id, payload), 200
    except ApiError as exc:
        return error_response(exc)


@marks_bp.route("/api/marks/<int:mark_id>", methods=["DELETE"])
def delete_mark_route(mark_id):
    try:
        result = delete_mark(mark_id)
        return result, 204
    except ApiError as exc:
        return error_response(exc)
