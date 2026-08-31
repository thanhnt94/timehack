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
  Plus,
  Calendar,
  Layers,
  ArrowRight,
  Sun,
  Moon,
  Coffee,
  CheckCircle2,
  Compass
} from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore'
import { useHabitStore } from '../store/useHabitStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { useTimerStore } from '../store/useTimerStore'
import { useNavigate } from 'react-router-dom'
import { sounds } from '../utils/soundEffects'

interface TodayPlannerProps {
  onOpenCreate?: () => void
}

export const TodayPlanner: React.FC<TodayPlannerProps> = ({ onOpenCreate }) => {
  const { tasks, fetchTasks, toggleTaskStatus } = useTaskStore()
  const { habits, fetchHabits, checkinHabit } = useHabitStore()
  const { slots, fetchSlots } = useScheduleStore()
  const { startTimer } = useTimerStore()
  const navigate = useNavigate()

  const [selectedDayOffset, setSelectedDayOffset] = useState(0)

  useEffect(() => {
    fetchTasks()
    fetchHabits()
    fetchSlots()
  }, [])

  // Greeting based on time of day
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Chào Buổi Sáng' : hour < 18 ? 'Chào Buổi Chiều' : 'Chào Buổi Tối'
  const GreetingIcon = hour < 12 ? Sun : hour < 18 ? Coffee : Moon

  // 7-day week calendar dates around today
  const today = new Date()
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(today.getDate() - 3 + i)
    const dayName = d.toLocaleDateString('vi-VN', { weekday: 'short' })
    const dayNumber = d.getDate()
    const isToday = i === 3
    return { offset: i - 3, dayName, dayNumber, isToday }
  })

  const completedTasksCount = tasks.filter(t => t.status === 'completed').length
  const totalTasksCount = tasks.length
  const taskProgressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0

  const handleTaskToggle = (taskId: number) => {
    sounds.playTap()
    toggleTaskStatus(taskId)
    sounds.playSuccess()
  }

  const handleHabitCheckin = (habitId: number) => {
    sounds.playTap()
    checkinHabit(habitId)
    sounds.playSuccess()
  }

  const handleStartTaskFocus = (taskTitle: string) => {
    sounds.playTap()
    startTimer(taskTitle, 'pomodoro')
    navigate('/focus')
  }

  return (
    <div className="space-y-4 select-none pb-8 animate-in fade-in duration-200">
      {/* 1. HORIZONTAL WEEK DATE SCRUBBER */}
      <div className="flex items-center justify-between gap-1 p-1.5 rounded-3xl bg-[#090D1A] border border-white/[0.06] shadow-lg">
        {weekDays.map((day) => {
          const isSelected = selectedDayOffset === day.offset

          return (
            <button
              key={day.offset}
              onClick={() => { sounds.playTap(); setSelectedDayOffset(day.offset); }}
              className={`flex-1 py-2.5 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-violet-600/30 font-black'
                  : day.isToday
                  ? 'bg-slate-900 text-cyan-400 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-semibold'
              }`}
            >
              <span className="text-[9px] uppercase tracking-wider">{day.dayName}</span>
              <span className="text-xs sm:text-sm font-black font-mono mt-0.5">{day.dayNumber}</span>
              {day.isToday && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5" />
              )}
            </button>
          )
        })}
      </div>

      {/* 2. DYNAMIC GREETING & ACTIVITY ENERGY CARD */}
      <div className="glass-card rounded-[32px] p-5 border border-white/[0.08] bg-gradient-to-br from-violet-950/40 via-[#0C1222] to-cyan-950/30 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-black uppercase tracking-wider">
              <GreetingIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>{greeting}</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {totalTasksCount === 0 
                ? 'Ngày Làm Việc Mới' 
                : `${completedTasksCount}/${totalTasksCount} Nhiệm Vụ Hoàn Tất`}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {totalTasksCount === 0 
                ? 'Hãy lập kế hoạch và bắt đầu các phiên tập trung sâu.' 
                : `Đã hoàn thành ${taskProgressPercent}% mục tiêu trong ngày.`}
            </p>
          </div>

          {/* Quick Focus Launch CTA */}
          <button
            onClick={() => {
              sounds.playTap()
              startTimer('Phiên làm việc sâu', 'pomodoro')
              navigate('/focus')
            }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 text-white shadow-xl shadow-rose-600/40 flex flex-col items-center justify-center active:scale-90 transition-transform shrink-0"
            title="Bắt đầu Focus 25m"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
            <span className="text-[8px] font-black uppercase mt-0.5 tracking-wider">Focus</span>
          </button>
        </div>

        {/* Triple Stat Badges */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-white/[0.06]">
          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
            <div className="text-[9px] text-slate-400 font-bold uppercase">Nhiệm Vụ</div>
            <div className="text-sm font-black text-white font-mono mt-0.5">
              {completedTasksCount}/{totalTasksCount}
            </div>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
            <div className="text-[9px] text-slate-400 font-bold uppercase">Thói Quen</div>
            <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">
              {habits.length} thói quen
            </div>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
            <div className="text-[9px] text-slate-400 font-bold uppercase">Khung Giờ</div>
            <div className="text-sm font-black text-cyan-400 font-mono mt-0.5">
              {slots.length} block
            </div>
          </div>
        </div>
      </div>

      {/* 3. TACTILE HABIT STREAK BAR */}
      {habits.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Thói Quen Hôm Nay</span>
            </span>
            <button
              onClick={() => navigate('/habits')}
              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
            >
              <span>Ma trận</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {habits.map((habit) => (
              <button
                key={habit.id}
                onClick={() => handleHabitCheckin(habit.id)}
                className="shrink-0 p-3 rounded-2xl glass-card border border-white/[0.08] hover:border-emerald-500/40 flex items-center gap-2.5 active:scale-95 transition-all min-w-[145px] text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-black shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate max-w-[90px]">{habit.title}</div>
                  <div className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5 mt-0.5">
                    <Flame className="w-2.5 h-2.5 fill-emerald-400" />
                    <span>Streak</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. CHRONOLOGICAL TIMELINE / TASK FLOW */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-violet-400" />
            <span>Dòng Nhiệm Vụ (Daily Flow)</span>
          </span>
          <span className="text-[10px] font-bold text-slate-500 font-mono">
            {tasks.length} mục tiêu
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="glass-card rounded-[32px] p-8 border border-white/[0.08] text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 mx-auto flex items-center justify-center text-violet-400 shadow-lg shadow-violet-500/10">
              <Compass className="w-7 h-7 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-base font-black text-white">Chưa Có Nhiệm Vụ Nào</div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                Bắt đầu một ngày trọn vẹn bằng cách chạm nút <strong>(+)</strong> bên dưới.
              </p>
            </div>
            <button
              onClick={() => { sounds.playTap(); onOpenCreate?.(); }}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 text-white font-black text-xs shadow-xl shadow-violet-600/30 inline-flex items-center gap-2 active:scale-95 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tạo Nhiệm Vụ Mới</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const isDone = task.status === 'completed'
              const isQ1 = task.eisenhower === 'do_first'

              return (
                <div
                  key={task.id}
                  className={`glass-card rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 ${
                    isDone 
                      ? 'opacity-50 bg-slate-950/40 border-slate-800' 
                      : 'border-white/[0.08] hover:border-violet-500/40 shadow-md'
                  }`}
                >
                  {/* 1-Tap Circular Checkbox */}
                  <button
                    onClick={() => handleTaskToggle(task.id)}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all active:scale-90 shrink-0 ${
                      isDone 
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-md' 
                        : 'border-slate-600 bg-slate-900/90 hover:border-violet-400'
                    }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs sm:text-sm font-bold truncate ${
                      isDone ? 'line-through text-slate-500' : 'text-white'
                    }`}>
                      {task.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
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
                        <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 text-cyan-400" />
                          <span>{Math.round(task.spent_seconds / 60)}p</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1-Tap Play Pomodoro */}
                  {!isDone && (
                    <button
                      onClick={() => handleStartTaskFocus(task.title)}
                      title="Bắt đầu Pomodoro"
                      className="p-2 rounded-xl bg-gradient-to-r from-rose-600/20 to-pink-600/20 border border-rose-500/30 text-rose-300 hover:from-rose-600 hover:to-pink-600 hover:text-white transition active:scale-95 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
