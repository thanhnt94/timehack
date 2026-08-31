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
  Target,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Award,
  Calendar,
  AlertCircle
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
  const [quickEisenhower, setQuickEisenhower] = useState<'do_first' | 'schedule' | 'delegate' | 'eliminate'>('do_first')
  const [activeTab, setActiveTab] = useState<'all' | 'priority' | 'habits' | 'schedule'>('all')

  useEffect(() => {
    fetchTasks()
    fetchHabits()
    fetchSlots()
  }, [])

  const todayDateStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length
  const totalTasksCount = tasks.length
  const taskProgressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTaskTitle.trim()) return
    await createTask({ 
      title: quickTaskTitle, 
      priority: quickEisenhower === 'do_first' ? 'high' : 'medium', 
      eisenhower: quickEisenhower 
    })
    setQuickTaskTitle('')
  }

  const handleStartTaskFocus = (taskTitle: string) => {
    startTimer(taskTitle, 'pomodoro')
    navigate('/focus')
  }

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'priority') return task.eisenhower === 'do_first' || task.priority === 'high'
    return true
  })

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300 select-none pb-6">
      {/* 1. COMPACT HERO PRODUCTIVITY GAUGE */}
      <div className="glass-card rounded-3xl p-4 sm:p-6 border border-violet-500/20 bg-gradient-to-br from-violet-900/30 via-slate-900/90 to-cyan-900/20 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-bold">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span className="capitalize">{todayDateStr}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white leading-tight">
              Hôm Nay Chinh Phục Gì?
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
              Hoàn thành các nhiệm vụ cốt lõi & giữ vững chuỗi thói quen.
            </p>
          </div>

          {/* Activity Progress Circular Widget */}
          <div className="relative flex items-center justify-center shrink-0 w-16 h-16 sm:w-20 sm:h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-gradient"
                strokeWidth="3.5"
                strokeDasharray={`${taskProgressPercent}, 100`}
                strokeLinecap="round"
                stroke="url(#progressGrad)"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <defs>
                <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs sm:text-sm font-black text-white">{taskProgressPercent}%</span>
              <span className="text-[8px] font-bold text-slate-400">Tiến độ</span>
            </div>
          </div>
        </div>

        {/* Quick 3 Stat Pills */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/[0.08]">
          <div className="p-2 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-semibold">Nhiệm vụ</div>
            <div className="text-xs sm:text-sm font-black text-white mt-0.5">{completedTasksCount}/{totalTasksCount}</div>
          </div>
          <div className="p-2 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-semibold">Thói quen</div>
            <div className="text-xs sm:text-sm font-black text-emerald-400 mt-0.5">{habits.length} đang theo dõi</div>
          </div>
          <div className="p-2 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-semibold">Lịch trình</div>
            <div className="text-xs sm:text-sm font-black text-cyan-400 mt-0.5">{slots.length} khung giờ</div>
          </div>
        </div>
      </div>

      {/* 2. QUICK ADD TASK ACTION BAR (1-TAP INPUT) */}
      <form onSubmit={handleQuickAddTask} className="glass-card rounded-2xl p-2 border border-white/[0.08] flex items-center gap-2 shadow-lg">
        <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 shrink-0">
          <Plus className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={quickTaskTitle}
          onChange={(e) => setQuickTaskTitle(e.target.value)}
          placeholder="+ Thêm nhanh nhiệm vụ hôm nay..."
          className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setQuickEisenhower(prev => prev === 'do_first' ? 'schedule' : 'do_first')}
            className={`px-2 py-1 rounded-xl text-[10px] font-bold border transition ${
              quickEisenhower === 'do_first' 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {quickEisenhower === 'do_first' ? '🚨 Gấp (Q1)' : '📅 Kế hoạch (Q2)'}
          </button>
          <button
            type="submit"
            disabled={!quickTaskTitle.trim()}
            className="p-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs disabled:opacity-40 active:scale-95 transition"
          >
            Lưu
          </button>
        </div>
      </form>

      {/* 3. TACTILE HABIT STREAK STRIP (HORIZONTAL SWIPEABLE / 1-TAP CHECK-IN) */}
      {habits.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Điểm Danh Thói Quen Hôm Nay</span>
            </h3>
            <button
              onClick={() => navigate('/habits')}
              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
            >
              <span>Xem ma trận</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {habits.slice(0, 5).map((habit) => (
              <button
                key={habit.id}
                onClick={() => checkinHabit(habit.id)}
                className="shrink-0 p-3 rounded-2xl glass-card border border-white/[0.08] hover:border-emerald-500/30 transition-all flex items-center gap-2.5 active:scale-95 text-left min-w-[150px]"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate max-w-[100px]">{habit.title}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Flame className="w-2.5 h-2.5 fill-emerald-400" />
                    <span>Streak</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. SMART SEGMENTED TAB CONTROLS */}
      <div className="flex items-center gap-1.5 p-1 glass-card rounded-2xl border border-white/[0.08]">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'all' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Tất cả ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('priority')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'priority' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🚨 Ưu tiên cao
        </button>
        <button
          onClick={() => navigate('/schedule')}
          className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-cyan-300 transition flex items-center justify-center gap-1"
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Lịch trình</span>
        </button>
      </div>

      {/* 5. TASK ITEM CARDS (1-TAP CHECKBOX + 1-TAP START FOCUS) */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 border border-white/[0.08] text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-300">Chưa có nhiệm vụ nào</div>
            <p className="text-xs text-slate-500">Hãy thêm nhiệm vụ mới ở thanh phía trên để bắt đầu ngày làm việc hiệu quả!</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'completed'
            const isQ1 = task.eisenhower === 'do_first'

            return (
              <div
                key={task.id}
                className={`glass-card rounded-2xl p-3 border transition-all flex items-center justify-between gap-3 ${
                  isDone 
                    ? 'opacity-60 bg-slate-900/40 border-slate-800/50' 
                    : 'border-white/[0.08] hover:border-violet-500/30'
                }`}
              >
                {/* 1-Tap Toggle Checkbox */}
                <button
                  onClick={() => toggleTaskStatus(task.id)}
                  className={`w-6 h-6 rounded-xl border flex items-center justify-center transition-all active:scale-90 shrink-0 ${
                    isDone 
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm shadow-emerald-500/30 animate-pop' 
                      : 'border-slate-600 bg-slate-900/80 hover:border-violet-400'
                  }`}
                >
                  {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                {/* Task Details */}
                <div className="flex-1 min-w-0">
                  <div className={`text-xs sm:text-sm font-bold truncate ${
                    isDone ? 'line-through text-slate-500' : 'text-white'
                  }`}>
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {isQ1 ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        🚨 Q1: Do First
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        📅 Q2: Schedule
                      </span>
                    )}
                    {task.spent_seconds > 0 && (
                      <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5 text-cyan-400" />
                        <span>{Math.round(task.spent_seconds / 60)} phút</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 1-Tap Focus Action Button */}
                {!isDone && (
                  <button
                    onClick={() => handleStartTaskFocus(task.title)}
                    title="Bắt đầu Pomodoro cho task này"
                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600/20 to-pink-600/20 border border-rose-500/30 text-rose-300 hover:from-rose-600 hover:to-pink-600 hover:text-white text-[11px] font-bold flex items-center gap-1 transition active:scale-95 shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span className="hidden sm:inline">Tập trung</span>
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
