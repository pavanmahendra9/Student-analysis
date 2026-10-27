from __future__ import annotations

from app.db import execute, fetch_all, fetch_one
from app.errors import ApiError
from app.validators import validate_marks, validate_positive_integer, validate_required_string


def list_marks(student_id=None, subject_id=None, section=None, assessment=None):
    where = []
    params = []
    if student_id is not None:
        where.append("m.student_id = %s")
        params.append(student_id)
    if subject_id is not None:
        where.append("m.subject_id = %s")
        params.append(subject_id)
    if section:
        where.append("s.section = %s")
        params.append(section)
    if assessment:
        where.append("m.assessment = %s")
        params.append(assessment)

    sql = """
        SELECT m.*, st.roll_no, st.name, st.section, sub.subject_name, sub.max_marks, sub.pass_marks
        FROM marks m
        JOIN students st ON st.student_id = m.student_id
        JOIN subjects sub ON sub.subject_id = m.subject_id
    """
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY m.mark_id"
    return fetch_all(sql, tuple(params))


def create_mark(payload):
    student_id = validate_positive_integer(payload.get("student_id"), "student_id")
    subject_id = validate_positive_integer(payload.get("subject_id"), "subject_id")
    assessment = validate_required_string(payload.get("assessment"), "assessment", max_length=100)

    if not fetch_one("SELECT * FROM students WHERE student_id = %s", (student_id,)):
        raise ApiError("NOT_FOUND", "Student not found.", 404, {"student_id": student_id})
    subject = fetch_one("SELECT * FROM subjects WHERE subject_id = %s", (subject_id,))
    if not subject:
        raise ApiError("NOT_FOUND", "Subject not found.", 404, {"subject_id": subject_id})

    marks_obtained = validate_marks(payload.get("marks_obtained"), subject["max_marks"])
    try:
        mark_id = execute(
            "INSERT INTO marks (student_id, subject_id, assessment, marks_obtained) VALUES (%s, %s, %s, %s)",
            (student_id, subject_id, assessment, marks_obtained),
        )
    except Exception as exc:
        raise ApiError("DUPLICATE_RECORD", "A mark record already exists for this student, subject, and assessment.", 409, {"student_id": student_id, "subject_id": subject_id, "assessment": assessment}) from exc
    return get_mark(mark_id)


def get_mark(mark_id):
    mark = fetch_one(
        """
        SELECT m.*, st.roll_no, st.name, st.section, sub.subject_name, sub.max_marks, sub.pass_marks
        FROM marks m
        JOIN students st ON st.student_id = m.student_id
        JOIN subjects sub ON sub.subject_id = m.subject_id
        WHERE m.mark_id = %s
        """,
        (mark_id,),
    )
    if not mark:
        raise ApiError("NOT_FOUND", "Mark record not found.", 404, {"mark_id": mark_id})
    return mark


def update_mark(mark_id, payload):
    existing = get_mark(mark_id)
    student_id = validate_positive_integer(payload.get("student_id", existing["student_id"]), "student_id")
    subject_id = validate_positive_integer(payload.get("subject_id", existing["subject_id"]), "subject_id")
    assessment = validate_required_string(payload.get("assessment", existing["assessment"]), "assessment", max_length=100)
    subject = fetch_one("SELECT * FROM subjects WHERE subject_id = %s", (subject_id,))
    if not subject:
        raise ApiError("NOT_FOUND", "Subject not found.", 404, {"subject_id": subject_id})
    if not fetch_one("SELECT * FROM students WHERE student_id = %s", (student_id,)):
        raise ApiError("NOT_FOUND", "Student not found.", 404, {"student_id": student_id})
    marks_obtained = validate_marks(payload.get("marks_obtained", existing["marks_obtained"]), subject["max_marks"])

    try:
        execute(
            "UPDATE marks SET student_id = %s, subject_id = %s, assessment = %s, marks_obtained = %s, updated_at = CURRENT_TIMESTAMP WHERE mark_id = %s",
            (student_id, subject_id, assessment, marks_obtained, mark_id),
        )
    except Exception as exc:
        raise ApiError("DUPLICATE_RECORD", "A mark record already exists for this student, subject, and assessment.", 409, {"student_id": student_id, "subject_id": subject_id, "assessment": assessment}) from exc
    return get_mark(mark_id)


def delete_mark(mark_id):
    get_mark(mark_id)
    execute("DELETE FROM marks WHERE mark_id = %s", (mark_id,))
    return {"deleted": True, "mark_id": mark_id}
