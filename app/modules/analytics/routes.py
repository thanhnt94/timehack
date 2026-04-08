from datetime import datetime, timedelta, timezone
from flask import render_template, request, jsonify
from flask_login import login_required, current_user
from itertools import groupby

from . import analytics_bp
from .services import AnalyticsService
from app.utils.time_helpers import format_duration, format_duration_short

@analytics_bp.route('/')
@login_required
def overview():
    user_tz = current_user.timezone or 'Asia/Ho_Chi_Minh'
    from app.utils.time_helpers import tz_offset_from_name
    tz_offset = tz_offset_from_name(user_tz)
    
    date_str = request.args.get('date')
    date_obj = None
    if date_str:
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            pass

    daily = AnalyticsService.get_daily_summary(current_user.id, date_obj)
    heatmap = AnalyticsService.get_heatmap_data(current_user.id)
    weekly = AnalyticsService.get_weekly_summary(current_user.id,
                                                  date_obj or datetime.now(timezone(timedelta(hours=tz_offset))).date())

    return render_template('analytics/overview.html',
                           daily=daily,
                           weekly=weekly,
                           heatmap=heatmap,
                           format_duration=format_duration)

@analytics_bp.route('/history')
@login_required
def history():
    from app.models.time_entry import TimeEntry
    from app.models.category import Category
    from app.utils.time_helpers import to_user_tz
    
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    query = TimeEntry.query.filter_by(user_id=current_user.id, is_running=False)
    if start_date_str:
        query = query.filter(TimeEntry.start_time >= datetime.strptime(start_date_str, '%Y-%m-%d'))
    if end_date_str:
        query = query.filter(TimeEntry.start_time <= datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59))
        
    entries = query.order_by(TimeEntry.start_time.desc()).all()
    
    # Lấy danh sách category để sửa
    categories = Category.query.filter_by(user_id=current_user.id).all()
    categories.sort(key=lambda c: c.get_full_path())

    grouped_entries = []
    user_tz = current_user.timezone or 'Asia/Ho_Chi_Minh'
    
    def get_date(e):
        return to_user_tz(e.start_time, user_tz).date()

    for date, group in groupby(entries, key=get_date):
        day_entries = list(group)
        day_entries.reverse() # Sắp xếp từ sáng đến tối để tính khoảng trống
        
        # Logic tính khoảng trống (Gaps)
        processed_day = []
        last_end = None
        
        for e in day_entries:
            start_local = to_user_tz(e.start_time, user_tz)
            end_local = to_user_tz(e.end_time, user_tz) if e.end_time else start_local
            
            # Nếu có khoảng trống giữa bản ghi trước và bản ghi này > 1 phút
            if last_end and (start_local - last_end).total_seconds() > 60:
                gap_mins = int((start_local - last_end).total_seconds() / 60)
                processed_day.append({
                    'is_gap': True,
                    'start': last_end,
                    'end': start_local,
                    'duration': gap_mins,
                    'duration_str': format_duration_short(gap_mins)
                })
            
            processed_day.append({
                'is_gap': False,
                'data': e,
                'start': start_local,
                'end': end_local
            })
            last_end = end_local
        
        processed_day.reverse() # Đưa về mới nhất lên đầu để hiển thị
        total_mins = sum(e.duration or 0 for e in day_entries)
        
        grouped_entries.append({
            'date': date,
            'total_duration': format_duration(total_mins),
            'day_items': processed_day
        })
        
    return render_template('analytics/history.html', 
                           grouped_entries=grouped_entries, 
                           categories=categories,
                           start_date=start_date_str, 
                           end_date=end_date_str)

@analytics_bp.route('/export')
@login_required
def export_data():
    import csv
    from io import StringIO
    from flask import Response
    from app.models.time_entry import TimeEntry
    entries = TimeEntry.query.filter_by(user_id=current_user.id).order_by(TimeEntry.start_time.desc()).all()
    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['ID', 'Category', 'Todo', 'Start Time', 'End Time', 'Duration (min)', 'Note', 'Deep Work'])
    for e in entries:
        cw.writerow([e.id, e.category.name if e.category else '', e.todo.content if e.todo else '', e.start_time.isoformat(), e.end_time.isoformat() if e.end_time else '', e.duration, e.note or '', 'Yes' if e.is_pomodoro else 'No'])
    output = Response(si.getvalue(), mimetype='text/csv')
    output.headers["Content-Disposition"] = f"attachment; filename=timehack_export_{datetime.now().strftime('%Y%m%d')}.csv"
    return output

@analytics_bp.route('/api/daily', methods=['GET'])
@login_required
def api_daily():
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
    date_str = request.args.get('date')
    date_obj = None
    if date_str:
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            pass
    data = AnalyticsService.get_weekly_summary(current_user.id, date_obj)
    return jsonify(data), 200
