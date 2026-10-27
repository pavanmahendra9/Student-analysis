from flask import jsonify, request


class ApiError(Exception):
    def __init__(self, code, message, status_code=400, details=None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}


def error_response(error):
    payload = {
        "error": {
            "code": error.code,
            "message": error.message,
            "details": error.details,
        }
    }
    return jsonify(payload), error.status_code


def handle_validation_error(error):
    return error_response(ApiError("VALIDATION_ERROR", str(error), 422))


def request_json_object():
    payload = request.get_json(silent=True)
    if payload is None:
        return {}
    if not isinstance(payload, dict):
        raise ApiError("VALIDATION_ERROR", "The JSON request body must be an object.", 400)
    return payload
