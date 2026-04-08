import math

def get_exp_for_level(level):
    """
    Tính tổng số EXP tích lũy cần thiết để ĐẠT ĐƯỢC level đó.
    Công thức: Mỗi level tăng thêm độ khó.
    Level 1: 0 EXP
    Level 2: 60 EXP (1h)
    Level 3: 180 EXP (+120m)
    """
    if level <= 1:
        return 0
    # Công thức: Base 60m * hệ số tăng dần
    return int(60 * (level - 1) * (1 + (level - 2) * 0.5))

def calculate_level_info(total_exp):
    """
    Dựa vào tổng EXP, tính Level hiện tại và tiến trình tới Level tiếp theo.
    """
    level = 1
    while True:
        if total_exp < get_exp_for_level(level + 1):
            break
        level += 1
    
    current_level_base = get_exp_for_level(level)
    next_level_base = get_exp_for_level(level + 1)
    
    exp_in_level = total_exp - current_level_base
    exp_needed_for_next = next_level_base - current_level_base
    
    progress = 0
    if exp_needed_for_next > 0:
        progress = min(100, int((exp_in_level / exp_needed_for_next) * 100))
        
    return {
        'level': level,
        'current_exp_in_level': exp_in_level,
        'exp_needed_for_next': exp_needed_for_next,
        'progress_percent': progress
    }
