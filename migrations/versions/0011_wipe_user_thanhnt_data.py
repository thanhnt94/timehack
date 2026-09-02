"""wipe_user_thanhnt_data

Revision ID: 0011_wipe_user_thanhnt_data
Revises: 0010_add_reminders_to_tasks_habits_slots
Create Date: 2026-09-03 01:06:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0011_wipe_user_thanhnt_data'
down_revision: Union[str, None] = '0010_add_reminders_to_tasks_habits_slots'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    
    # 1. Find user_id(s) for thanhnt across username, email, full_name
    result = conn.execute(sa.text(
        "SELECT id, username FROM users WHERE username LIKE '%thanhnt%' OR email LIKE '%thanhnt%' OR full_name LIKE '%thanhnt%'"
    ))
    user_rows = result.fetchall()
    
    print(f"[ALEMBIC 0011] Found matching users: {user_rows}")
    
    for row in user_rows:
        uid = row[0]
        print(f"[ALEMBIC 0011] Wiping all data for user_id={uid} ({row[1]})...")
        
        # Delete active_tracks
        try:
            conn.execute(sa.text("DELETE FROM active_tracks WHERE user_id = :uid"), {"uid": uid})
        except Exception as e:
            print(f"[ALEMBIC 0011] Note active_tracks: {e}")
            
        # Delete time_logs
        conn.execute(sa.text("DELETE FROM time_logs WHERE user_id = :uid"), {"uid": uid})
        
        # Delete schedule_slots
        conn.execute(sa.text("DELETE FROM schedule_slots WHERE user_id = :uid"), {"uid": uid})
        
        # Delete habit_logs
        conn.execute(sa.text("DELETE FROM habit_logs WHERE user_id = :uid"), {"uid": uid})
        
        # Delete habits
        conn.execute(sa.text("DELETE FROM habits WHERE user_id = :uid"), {"uid": uid})
        
        # Delete subtasks
        conn.execute(sa.text("DELETE FROM subtasks WHERE task_id IN (SELECT id FROM tasks WHERE user_id = :uid)"), {"uid": uid})
        
        # Delete tasks
        conn.execute(sa.text("DELETE FROM tasks WHERE user_id = :uid"), {"uid": uid})
        
        # Delete user_notifications
        conn.execute(sa.text("DELETE FROM user_notifications WHERE user_id = :uid"), {"uid": uid})
        
        # Delete categories
        conn.execute(sa.text("DELETE FROM categories WHERE user_id = :uid"), {"uid": uid})
        
        # Insert 4 clean pristine default categories
        conn.execute(sa.text("""
            INSERT INTO categories (user_id, name, color, icon, category_type, is_default)
            VALUES 
                (:uid, 'Công việc', '#3B82F6', 'briefcase', 'productive', 1),
                (:uid, 'Học tập', '#10B981', 'book', 'productive', 1),
                (:uid, 'Sức khỏe', '#F59E0B', 'activity', 'productive', 1),
                (:uid, 'Đời sống', '#EC4899', 'smile', 'productive', 1)
        """), {"uid": uid})
        
        print(f"[ALEMBIC 0011] Finished wiping data for user_id={uid}!")

def downgrade() -> None:
    pass
