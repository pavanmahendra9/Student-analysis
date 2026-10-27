import os
from dotenv import load_dotenv


load_dotenv()


class Config:
    DEBUG = os.getenv("DEBUG", "False").lower() in {"1", "true", "yes", "on"}
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_NAME = os.getenv("DB_NAME", "student_performance_db")
    DB_USER = os.getenv("DB_USER", "student_app_user")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    LOW_PERFORMANCE_THRESHOLD = float(os.getenv("LOW_PERFORMANCE_THRESHOLD", "40"))
    GRADE_THRESHOLDS = {"A": 90, "B": 80, "C": 70, "D": 60, "E": 40, "F": 0}


def get_config():
    return Config
