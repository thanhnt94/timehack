import React, { useEffect, useState } from 'react'
import { 
  CheckSquare, 
  Zap, 
  Clock, 
  Sparkles, 
  Play, 
  Flame, 
  Check, 
  ChevronRight,
  Target
} from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore'
import { useHabitStore } from '../store/useHabitStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { useTimerStore } from '../store/useTimerStore'
import { useNavigate } from 'react-router-dom'

export const TodayPlanner: React.FC = () => {
  const { tasks, fetchTasks, toggleTaskStatus, createTask } = useTaskStore()
  const { habits, fetchHabits, checkinHabit } = useHabitStore()
  const { slots, fetchSlots } = useScheduleStore()
  const { startTimer } = useTimerStore()
  const navigate = useNavigate()

  const [quickTaskTitle, setQuickTaskTitle] = useState('')

  useEffect(() => {
    fetchTasks()
    fetchHabits()
    fetchSlots()
  }, [])

  const todayDateStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length
  const totalTasksCount = tasks.length
  const taskProgressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTaskTitle.trim()) return
    await createTask({ title: quickTaskTitle, priority: 'medium', eisenhower: 'schedule' })
    setQuickTaskTitle('')
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-5 md:p-8 glass-card rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-900/30 via-slate-900/80 to-cyan-900/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-br from-violet-600/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{todayDateStr}</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">Hôm Nay Bạn Muốn Chinh Phục Gì?</h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
              Tối ưu hóa thời gian, xây dựng thói quen tốt và đạt hiệu suất cao nhất trong ngày.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-full md:w-auto p-3.5 md:p-4 glass-card rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-bold">Tiến độ Task</div>
                <div className="text-base md:text-lg font-black text-white">{completedTasksCount} / {totalTasksCount} ({taskProgressPercent}%)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Today Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-violet-400" />
              <span>Công Việc Cần Làm</span>
            </h2>
            <button 
              onClick={() => navigate('/tasks')}
              className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick add task input */}
          <form onSubmit={handleQuickAddTask} className="flex gap-2">
            <input
              type="text"
              placeholder="+ Thêm nhanh công việc mới..."
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              className="w-full bg-[#151D2A] border border-slate-800 focus:border-violet-500/50 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
            />
          </form>

          {/* Tasks List */}
          <div className="space-y-2.5">
            {tasks.filter(t => t.status !== 'completed').slice(0, 6).map((t) => (
              <div 
                key={t.id} 
                className="p-3.5 glass-card glass-card-hover rounded-2xl flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 truncate">
                  <button
                    onClick={() => toggleTaskStatus(t.id)}
                    className="w-5 h-5 rounded-lg border border-slate-700 hover:border-violet-500 flex items-center justify-center text-transparent hover:text-violet-400 transition-colors shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-semibold text-slate-200 truncate">{t.title}</span>
                </div>

                <button
                  onClick={() => startTimer({ taskId: t.id, title: t.title })}
                  className="p-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 border border-violet-500/30 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 shrink-0"
                  title="Bắt đầu đếm giờ"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            ))}

            {tasks.filter(t => t.status !== 'completed').length === 0 && (
              <div className="p-6 text-center glass-card rounded-2xl">
                <p className="text-xs text-slate-400">Tuyệt vời! Tuyệt đối không còn task dở dang.</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Today Habits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Thói Quen Mỗi Ngày</span>
            </h2>
            <button 
              onClick={() => navigate('/habits')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>Xem ma trận</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {habits.map((h) => (
              <div 
                key={h.id}
                className="p-3.5 glass-card glass-card-hover rounded-2xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 truncate">
                  <button
                    onClick={() => checkinHabit(h.id)}
                    className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all ${
                      h.today_completed 
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30' 
                        : 'border border-slate-700 text-transparent hover:border-emerald-400'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <div>
                    <div className={`text-xs font-bold ${h.today_completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {h.title}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                      <span>Streak: {h.current_streak} ngày</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => startTimer({ habitId: h.id, title: `Thói quen: ${h.title}` })}
                  className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 transition-all shrink-0"
                  title="Tập trung thói quen"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            ))}

            {habits.length === 0 && (
              <div className="p-6 text-center glass-card rounded-2xl">
                <p className="text-xs text-slate-400">Chưa có thói quen nào. Tạo thói quen ngay!</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Today Time-Blocking Schedule */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Thời Gian Biểu Hàng Ngày</span>
            </h2>
            <button 
              onClick={() => navigate('/schedule')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>Xem lịch</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {slots.map((s) => (
              <div key={s.id} className="p-3.5 glass-card rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono font-bold text-amber-400">{s.start_time} - {s.end_time}</div>
                  <div className="text-xs font-bold text-slate-200">{s.title}</div>
                </div>
              </div>
            ))}

            {slots.length === 0 && (
              <div className="p-6 text-center glass-card rounded-2xl">
                <p className="text-xs text-slate-400">Chưa xếp lịch time-blocking hôm nay.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
