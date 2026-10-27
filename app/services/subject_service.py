from __future__ import annotations

from app.db import execute, fetch_all, fetch_one
from app.errors import ApiError
from app.validators import validate_positive_decimal, validate_required_string


def list_subjects():
    return fetch_all("SELECT * FROM subjects ORDER BY subject_id")


def create_subject(payload):
    subject_name = validate_required_string(payload.get("subject_name"), "subject_name", max_length=150)
    max_marks = validate_positive_decimal(payload.get("max_marks"), "max_marks")
    pass_marks = validate_positive_decimal(payload.get("pass_marks"), "pass_marks", allow_zero=True)
    if pass_marks > max_marks:
        raise ApiError("VALIDATION_ERROR", "pass_marks cannot be greater than max_marks.", 422)
    try:
        subject_id = execute(
            "INSERT INTO subjects (subject_name, max_marks, pass_marks) VALUES (%s, %s, %s)",
            (subject_name, max_marks, pass_marks),
        )
    except Exception as exc:
        raise ApiError("DUPLICATE_RECORD", "A subject with the same name already exists.", 409, {"field": "subject_name"}) from exc
    return get_subject(subject_id)


def get_subject(subject_id):
    subject = fetch_one("SELECT * FROM subjects WHERE subject_id = %s", (subject_id,))
    if not subject:
        raise ApiError("NOT_FOUND", "Subject not found.", 404, {"subject_id": subject_id})
    return subject


def update_subject(subject_id, payload):
    subject = get_subject(subject_id)
    data = {
        "subject_name": payload.get("subject_name", subject["subject_name"]),
        "max_marks": payload.get("max_marks", subject["max_marks"]),
        "pass_marks": payload.get("pass_marks", subject["pass_marks"]),
    }
    subject_name = validate_required_string(data["subject_name"], "subject_name", max_length=150)
    max_marks = validate_positive_decimal(data["max_marks"], "max_marks")
    pass_marks = validate_positive_decimal(data["pass_marks"], "pass_marks", allow_zero=True)
    if pass_marks > max_marks:
        raise ApiError("VALIDATION_ERROR", "pass_marks cannot be greater than max_marks.", 422)

    try:
        execute(
            "UPDATE subjects SET subject_name = %s, max_marks = %s, pass_marks = %s, updated_at = CURRENT_TIMESTAMP WHERE subject_id = %s",
            (subject_name, max_marks, pass_marks, subject_id),
        )
    except Exception as exc:
        raise ApiError("DUPLICATE_RECORD", "A subject with the same name already exists.", 409, {"field": "subject_name"}) from exc
    return get_subject(subject_id)


def delete_subject(subject_id):
    get_subject(subject_id)
    execute("DELETE FROM subjects WHERE subject_id = %s", (subject_id,))
    return {"deleted": True, "subject_id": subject_id}
