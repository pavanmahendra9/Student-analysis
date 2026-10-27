from __future__ import annotations

from decimal import Decimal, InvalidOperation
import math

GRADE_THRESHOLDS = {"A": 90, "B": 80, "C": 70, "D": 60, "E": 40, "F": 0}


def _ensure_numeric(value, field_name):
    if value is None or value == "":
        raise ValueError(f"{field_name} is required.")
    try:
        numeric = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError(f"{field_name} must be numeric.")
    if numeric.is_nan() or numeric.is_infinite():
        raise ValueError(f"{field_name} must be a finite numeric value.")
    return numeric


def validate_marks(value, max_marks):
    numeric = _ensure_numeric(value, "marks_obtained")
    if numeric < 0:
        raise ValueError("marks_obtained cannot be negative.")
    max_value = Decimal(str(max_marks))
    if numeric > max_value:
        raise ValueError(f"marks_obtained cannot exceed subject maximum {max_value}.")
    return float(numeric)


def validate_required_string(value, field_name, min_length=1, max_length=255):
    if value is None or not isinstance(value, str):
        raise ValueError(f"{field_name} is required and must be a string.")
    cleaned = value.strip()
    if len(cleaned) < min_length:
        raise ValueError(f"{field_name} must not be empty.")
    if len(cleaned) > max_length:
        raise ValueError(f"{field_name} must be at most {max_length} characters.")
    return cleaned


def validate_positive_decimal(value, field_name, allow_zero=False):
    numeric = _ensure_numeric(value, field_name)
    if allow_zero:
        if numeric < 0:
            raise ValueError(f"{field_name} cannot be negative.")
    else:
        if numeric <= 0:
            raise ValueError(f"{field_name} must be greater than 0.")
    return float(numeric)


def validate_positive_integer(value, field_name):
    if isinstance(value, bool):
        raise ValueError(f"{field_name} must be a positive integer.")
    try:
        numeric = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError(f"{field_name} must be a positive integer.")
    if not numeric.is_finite() or numeric <= 0 or numeric != numeric.to_integral_value():
        raise ValueError(f"{field_name} must be a positive integer.")
    return int(numeric)


def compute_grade(percentage):
    numeric = _ensure_numeric(percentage, "percentage")
    if numeric < 0:
        raise ValueError("percentage cannot be negative.")
    for grade, threshold in sorted(GRADE_THRESHOLDS.items(), key=lambda x: x[1], reverse=True):
        if numeric >= threshold:
            return grade
    return "F"


def overall_percentage(total_marks, total_max_marks):
    if total_max_marks == 0:
        raise ZeroDivisionError("total maximum marks cannot be zero.")
    return (Decimal(str(total_marks)) / Decimal(str(total_max_marks))) * Decimal("100")


def qualifies_for_low_performance(percentage, threshold):
    return float(percentage) < float(threshold)


def compute_pass_status(marks_obtained, pass_marks):
    return float(marks_obtained) >= float(pass_marks)


def normalize_threshold(value):
    try:
        threshold = float(value)
    except (TypeError, ValueError):
        raise ValueError("threshold must be numeric.")
    if not math.isfinite(threshold) or threshold < 0 or threshold > 100:
        raise ValueError("threshold must be between 0 and 100.")
    return threshold
