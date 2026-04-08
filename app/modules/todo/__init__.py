from flask import Blueprint

todo_bp = Blueprint('todo', __name__, url_prefix='/todo')

from . import routes
