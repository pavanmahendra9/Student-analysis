from flask import Flask
from dotenv import load_dotenv

from app.config import get_config
from app.db import close_db
from app.errors import handle_validation_error
from app.routes import register_routes


def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config.from_object(get_config())
    app.config["JSON_SORT_KEYS"] = False

    register_routes(app)
    app.register_error_handler(ValueError, handle_validation_error)
    app.teardown_appcontext(close_db)
    return app
