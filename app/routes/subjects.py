from flask import Blueprint, request

from app.errors import ApiError, error_response, request_json_object
from app.services.subject_service import create_subject, delete_subject, get_subject, list_subjects, update_subject

subjects_bp = Blueprint("subjects", __name__)


@subjects_bp.route("/api/subjects", methods=["GET"])
def get_subjects_route():
    return {"items": list_subjects()}, 200


@subjects_bp.route("/api/subjects", methods=["POST"])
def create_subject_route():
    payload = request_json_object()
    try:
        return create_subject(payload), 201
    except ApiError as exc:
        return error_response(exc)


@subjects_bp.route("/api/subjects/<int:subject_id>", methods=["GET"])
def get_single_subject_route(subject_id):
    try:
        return get_subject(subject_id), 200
    except ApiError as exc:
        return error_response(exc)


@subjects_bp.route("/api/subjects/<int:subject_id>", methods=["PATCH", "PUT"])
def update_subject_route(subject_id):
    payload = request_json_object()
    try:
        return update_subject(subject_id, payload), 200
    except ApiError as exc:
        return error_response(exc)


@subjects_bp.route("/api/subjects/<int:subject_id>", methods=["DELETE"])
def delete_subject_route(subject_id):
    try:
        result = delete_subject(subject_id)
        return result, 204
    except ApiError as exc:
        return error_response(exc)
