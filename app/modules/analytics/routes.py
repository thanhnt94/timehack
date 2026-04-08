from datetime import datetime, timedelta, timezone
from flask import render_template, request, jsonify
from flask_login import login_required, current_user

from . import analytics_bp
from .services import AnalyticsService
from app.utils.time_helpers import format_duration


@analytics_bp.route('/')
@login_required
def overview():
    """Analytics overview page — daily pie + weekly bar chart."""
    date_str = request.args.get('date')
    date_obj = None
    if date_str:
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            pass

    daily = AnalyticsService.get_daily_summary(current_user.id, date_obj)
    weekly = AnalyticsService.get_weekly_summary(current_user.id,
                                                  date_obj or datetime.now(timezone(timedelta(hours=7))).date())

    return render_template('analytics/overview.html',
                           daily=daily,
                           weekly=weekly,
                           format_duration=format_duration)


@analytics_bp.route('/api/daily', methods=['GET'])
@login_required
def api_daily():
    """JSON API for daily summary."""
    date_str = request.args.get('date')
    date_obj = None
    if date_str:
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            pass
    data = AnalyticsService.get_daily_summary(current_user.id, date_obj)
    return jsonify(data), 200


@analytics_bp.route('/api/weekly', methods=['GET'])
@login_required
def api_weekly():
    """JSON API for weekly summary."""
    date_str = request.args.get('end_date')
    date_obj = None
    if date_str:
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            pass
    data = AnalyticsService.get_weekly_summary(current_user.id, date_obj)
    return jsonify(data), 200
