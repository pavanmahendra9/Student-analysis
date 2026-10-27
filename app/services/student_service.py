from __future__ import annotations

from app.db import fetch_all, fetch_one, execute
from app.errors import ApiError
from app.validators import validate_required_string


def list_students(page=1, per_page=20, search=None, section=None):
    page = max(1, int(page))
    per_page = max(1, min(int(per_page), 100))
    offset = (page - 1) * per_page
    conditions = []
    params = []

    if search:
        conditions.append("(name LIKE %s OR roll_no LIKE %s)")
        search_value = f"%{search}%"
        params.extend([search_value, search_value])
    if section:
        conditions.append("section = %s")
        params.append(section)

    where_sql = " AND ".join(conditions)
    if where_sql:
        where_sql = f" WHERE {where_sql}"

    total = fetch_one(
        f"SELECT COUNT(*) AS total FROM students{where_sql}",
        tuple(params),
    )
    students = fetch_all(
        f"SELECT * FROM students{where_sql} ORDER BY student_id LIMIT %s OFFSET %s",
        tuple(params + [per_page, offset]),
    )
    return {
        "items": students,
        "page": page,
        "per_page": per_page,
        "total": total["total"] if total else 0,
        "pages": max(1, (total["total"] + per_page - 1) // per_page) if total else 1,
    }


def create_student(payload):
    roll_no = validate_required_string(payload.get("roll_no"), "roll_no", max_length=50)
    name = validate_required_string(payload.get("name"), "name", max_length=150)
    section = validate_required_string(payload.get("section"), "section", max_length=50)

    try:
        student_id = execute(
            "INSERT INTO students (roll_no, name, section) VALUES (%s, %s, %s)",
            (roll_no, name, section),
        )
        return get_student(student_id)
    except Exception as exc:
        raise ApiError("DUPLICATE_RECORD", "A student with the same roll number already exists.", 409, {"field": "roll_no"}) from exc


def get_student(student_id):
    student = fetch_one("SELECT * FROM students WHERE student_id = %s", (student_id,))
    if not student:
        raise ApiError("NOT_FOUND", "Student not found.", 404, {"student_id": student_id})
    return student


def update_student(student_id, payload):
    existing = get_student(student_id)
    data = {
        "roll_no": payload.get("roll_no", existing["roll_no"]),
        "name": payload.get("name", existing["name"]),
        "section": payload.get("section", existing["section"]),
    }

    roll_no = validate_required_string(data["roll_no"], "roll_no", max_length=50)
    name = validate_required_string(data["name"], "name", max_length=150)
    section = validate_required_string(data["section"], "section", max_length=50)

    try:
        execute(
            "UPDATE students SET roll_no = %s, name = %s, section = %s, updated_at = CURRENT_TIMESTAMP WHERE student_id = %s",
            (roll_no, name, section, student_id),
        )
    except Exception as exc:
        raise ApiError("DUPLICATE_RECORD", "A student with the same roll number already exists.", 409, {"field": "roll_no"}) from exc
    return get_student(student_id)


def delete_student(student_id):
    student = get_student(student_id)
    execute("DELETE FROM students WHERE student_id = %s", (student_id,))
    return {"deleted": True, "student_id": student_id, "name": student["name"]}
