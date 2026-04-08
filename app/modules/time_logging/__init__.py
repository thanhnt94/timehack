from flask import Blueprint

time_logging_bp = Blueprint('time_logging', __name__, url_prefix='/tracker')

from . import routes  # noqa: E402, F401
