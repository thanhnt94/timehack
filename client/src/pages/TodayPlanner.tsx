import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sun, Moon, Coffee, Play, Check, Flame, Clock,
  Calendar as CalendarIcon, ArrowRight, Sparkles, Plus,
  CheckCircle2, Target, Zap, Layers, ChevronRight, TrendingUp
} from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore'
import { useHabitStore, type Habit } from '../store/useHabitStore'
import { useScheduleStore, type ScheduleSlot } from '../store/useScheduleStore'
import { useTimeLogStore } from '../store/useTimeLogStore'
import { useTimerStore } from '../store/useTimerStore'
import { sounds } from '../utils/soundEffects'

interface Props {
  onOpenFocus: () => void
}

type HomeActionTab = 'tasks' | 'plan' | 'logs'

export const TodayPlanner: React.FC<Props> = ({ onOpenFocus }) => {
  const navigate = useNavigate()
  const { tasks, fetchTasks, toggleTaskStatus } = useTaskStore()
  const { habits, fetchHabits, checkinHabit } = useHabitStore()
  const { slots, fetchSlots, toggleSlotDone } = useScheduleStore()
  const { logs, fetchLogs } = useTimeLogStore()
  const { startTimer, isRunning, currentPhase } = useTimerStore()

  const [activeTab, setActiveTab] = useState<HomeActionTab>('tasks')
  const [selectedFocusMins, setSelectedFocusMins] = useState<number>(25)

  useEffect(() => {
    fetchTasks()
    fetchHabits()
    fetchSlots()
    fetchLogs()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const GreetIcon = hour < 12 ? Sun : hour < 18 ? Coffee : Moon

  const activeTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const doneTasksCount = completedTasks.length
  const totalTasksCount = tasks.length

  const doneHabitsCount = habits.filter(h => !!h.today_completed).length
  const totalHabitsCount = habits.length

  const doneSlotsCount = slots.filter(s => s.is_done).length
  const totalSlotsCount = slots.length

  // Overall Daily Completion Rate
  const totalItems = totalTasksCount + totalHabitsCount + totalSlotsCount
  const doneItems = doneTasksCount + doneHabitsCount + doneSlotsCount
  const completionPercent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  // Total Real Time Spent Today
  const totalLogSeconds = useMemo(() => {
    return logs.reduce((acc, cur) => acc + (cur.duration_seconds || 0), 0)
  }, [logs])

  const totalLogFormatted = useMemo(() => {
    const hours = Math.floor(totalLogSeconds / 3600)
    const mins = Math.floor((totalLogSeconds % 3600) / 60)
    if (hours === 0 && mins === 0) return '0m'
    if (hours === 0) return `${mins}m`
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`
  }, [totalLogSeconds])

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const handlePlayTask = (task: any) => {
    sounds.playTap()
    startTimer({ taskId: task.id, title: task.title })
    onOpenFocus()
  }

  const handleStartQuickFocus = (mins: number) => {
    sounds.playTap()
    startTimer({
      title: 'Deep Focus Session',
      durationMinutes: mins
    })
    onOpenFocus()
  }

  const handleToggleSlot = (slot: ScheduleSlot) => {
    sounds.playTap()
    toggleSlotDone(slot.id, !slot.is_done)
    if (!slot.is_done) sounds.playSuccess()
  }

  const handleHabitCheck = (e: React.MouseEvent, h: Habit) => {
    e.stopPropagation()
    sounds.playTap()
    checkinHabit(h.id)
    if (!h.today_completed) sounds.playSuccess()
  }

  const formatLocalTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch {
      return ''
    }
  }

  return (
    <div className="space-y-3.5 pb-6 animate-fade-in">
      {/* ── 1. Clean Executive Header & Overall Progress ── */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <GreetIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{greeting}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight truncate">
              {todayStr}
            </h1>
          </div>

          {/* Daily Progress Score Ring */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-2xl shrink-0">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Score</div>
              <div className="text-sm font-black text-slate-900 font-mono">{completionPercent}%</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs">
              <Target className="w-4 h-4 text-violet-600" />
            </div>
          </div>
        </div>

        {/* Unified 3-Pill Metric Ribbon */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
          <Link
            to="/tasks"
            onClick={() => sounds.playTap()}
            className="bg-slate-50/80 hover:bg-violet-50/60 p-2 rounded-xl text-center border border-slate-200/70 transition group"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tasks</span>
            <span className="text-xs font-black text-slate-800 group-hover:text-violet-700 font-mono">
              {doneTasksCount}/{totalTasksCount} done
            </span>
          </Link>

          <Link
            to="/habits"
            onClick={() => sounds.playTap()}
            className="bg-slate-50/80 hover:bg-emerald-50/60 p-2 rounded-xl text-center border border-slate-200/70 transition group"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Habits</span>
            <span className="text-xs font-black text-slate-800 group-hover:text-emerald-700 font-mono">
              {doneHabitsCount}/{totalHabitsCount} done
            </span>
          </Link>

          <Link
            to="/calendar"
            onClick={() => sounds.playTap()}
            className="bg-slate-50/80 hover:bg-violet-50/60 p-2 rounded-xl text-center border border-slate-200/70 transition group"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Focus Time</span>
            <span className="text-xs font-black text-violet-700 font-mono">
              {totalLogFormatted}
            </span>
          </Link>
        </div>
      </div>

      {/* ── 2. Streamlined Deep Focus Launcher (Compact & Elegant) ── */}
      <div className="bg-gradient-to-r from-violet-700 via-violet-600 to-indigo-700 rounded-3xl p-3.5 text-white shadow-md shadow-violet-600/15 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-violet-200 mb-0.5">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{isRunning ? 'Session in Progress' : 'Deep Focus'}</span>
          </div>
          <h3 className="text-sm font-black truncate">
            {isRunning ? (currentPhase === 'work' ? '🔥 Focus Mode' : '☕ Break Time') : 'Ready to dive in?'}
          </h3>

          {/* Quick preset duration chips */}
          {!isRunning && (
            <div className="flex items-center gap-1.5 mt-2">
              {[15, 25, 45].map(mins => (
                <button
                  key={mins}
                  onClick={() => setSelectedFocusMins(mins)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition ${
                    selectedFocusMins === mins
                      ? 'bg-white text-violet-800 shadow-2xs font-black'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 1-Tap Play Button */}
        <button
          onClick={isRunning ? onOpenFocus : () => handleStartQuickFocus(selectedFocusMins)}
          className="w-11 h-11 rounded-2xl bg-white text-violet-700 hover:bg-violet-50 flex items-center justify-center font-bold shadow-md shrink-0 active:scale-90 transition"
          title={isRunning ? 'Open active timer' : `Start ${selectedFocusMins}m focus session`}
        >
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </button>
      </div>

      {/* ── 3. Today's Habits Carousel (Horizontal Sleek Cards) ── */}
      {habits.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Today's Habits</h2>
            </div>
            <Link
              to="/habits"
              onClick={() => sounds.playTap()}
              className="text-[11px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-0.5"
            >
              <span>View All ({habits.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {habits.map(h => {
              const checked = !!h.today_completed
              const streakStr = h.streak_unit === 'weeks' ? 'w' : h.streak_unit === 'months' ? 'm' : 'd'
              const unitClean = h.unit === 'lần' ? 'times' : h.unit === 'phút' ? 'mins' : h.unit

              return (
                <div
                  key={h.id}
                  onClick={() => { sounds.playTap(); navigate(`/habits/${h.id}`) }}
                  className={`shrink-0 flex items-center gap-2.5 p-2.5 rounded-2xl border transition active:scale-95 cursor-pointer shadow-2xs min-w-[170px] max-w-[210px] ${
                    checked
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : 'bg-white border-slate-200 hover:border-violet-300'
                  }`}
                >
                  {/* Checkbox Icon */}
                  <button
                    type="button"
                    onClick={(e) => handleHabitCheck(e, h)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition active:scale-90 shadow-2xs ${
                      checked
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 border border-slate-200 text-slate-700 hover:border-violet-400'
                    }`}
                    style={!checked ? { backgroundColor: `${h.color || '#7C3AED'}15` } : {}}
                  >
                    {checked ? (
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    ) : (
                      <span className="text-sm">{h.icon || '⚡'}</span>
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-bold truncate ${checked ? 'line-through text-emerald-950 opacity-70' : 'text-slate-900'}`}>
                      {h.title}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5 font-medium">
                      <span>{h.target_count} {unitClean}</span>
                      {h.current_streak > 0 && (
                        <span className="text-amber-700 font-bold flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                          {h.current_streak}{streakStr}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 4. Unified Action Hub (Segmented Tabs: Tasks | Schedule Plan | Focus Logs) ── */}
      <div className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-2xs space-y-3">
        {/* Segmented Tab Bar */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/90 rounded-2xl text-xs font-bold">
          <button
            onClick={() => { sounds.playTap(); setActiveTab('tasks') }}
            className={`py-1.5 rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'tasks'
                ? 'bg-white text-violet-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tasks ({activeTasks.length})</span>
          </button>

          <button
            onClick={() => { sounds.playTap(); setActiveTab('plan') }}
            className={`py-1.5 rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'plan'
                ? 'bg-white text-violet-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Plan ({slots.length})</span>
          </button>

          <button
            onClick={() => { sounds.playTap(); setActiveTab('logs') }}
            className={`py-1.5 rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'logs'
                ? 'bg-white text-violet-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Logs ({logs.length})</span>
          </button>
        </div>

        {/* ── Sub-view 1: Actionable Tasks List ── */}
        {activeTab === 'tasks' && (
          <div className="space-y-2">
            {activeTasks.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-1.5 opacity-40 text-emerald-500" />
                <p className="text-xs font-bold text-slate-700">All tasks completed!</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Great job staying focused and productive today.</p>
                <Link
                  to="/tasks"
                  className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:underline mt-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Create new task
                </Link>
              </div>
            ) : (
              activeTasks.slice(0, 5).map(task => {
                const isDone = task.status === 'completed'
                const subtasks = task.subtasks || []
                const doneSubtasks = subtasks.filter(s => s.is_completed).length

                return (
                  <div
                    key={task.id}
                    className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 hover:border-violet-300 transition group"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => { sounds.playTap(); toggleTaskStatus(task.id); if (!isDone) sounds.playSuccess() }}
                      className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-violet-500 bg-white flex items-center justify-center shrink-0 transition active:scale-90"
                    >
                      {isDone && <Check className="w-3 h-3 stroke-[3] text-white" />}
                    </button>

                    {/* Task Details */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate group-hover:text-violet-700">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {task.eisenhower && (
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            task.eisenhower === 'do_first' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            task.eisenhower === 'schedule' ? 'bg-violet-50 text-violet-700 border border-violet-200' :
                            task.eisenhower === 'delegate' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {task.eisenhower === 'do_first' ? '🔥 Urgent' :
                             task.eisenhower === 'schedule' ? '⭐ Important' :
                             task.eisenhower === 'delegate' ? '👥 Delegate' : '📥 Backlog'}
                          </span>
                        )}
                        {subtasks.length > 0 && (
                          <span className="text-[9px] font-bold text-slate-400 font-mono">
                            {doneSubtasks}/{subtasks.length} subtasks
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 1-Tap Focus Button */}
                    <button
                      onClick={() => handlePlayTask(task)}
                      className="h-7 px-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-600 hover:text-white transition active:scale-90 shrink-0 flex items-center gap-1 text-[11px] font-bold"
                      title="Focus on this task"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Focus</span>
                    </button>
                  </div>
                )
              })
            )}

            {/* Footer View Tasks Link */}
            {activeTasks.length > 5 && (
              <Link
                to="/tasks"
                className="block text-center py-2 text-xs font-bold text-violet-600 hover:underline"
              >
                View all {activeTasks.length} active tasks →
              </Link>
            )}
          </div>
        )}

        {/* ── Sub-view 2: Today's Plan Time Slots ── */}
        {activeTab === 'plan' && (
          <div className="space-y-2">
            {slots.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CalendarIcon className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
                <p className="text-xs font-bold text-slate-700">No time blocks scheduled today</p>
                <Link
                  to="/calendar"
                  className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:underline mt-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Plan a time block
                </Link>
              </div>
            ) : (
              slots.map(slot => {
                const isDone = !!slot.is_done
                return (
                  <div
                    key={slot.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                      isDone ? 'opacity-50 bg-slate-50 border-slate-200' : 'bg-slate-50/80 border-slate-200/80 hover:border-sky-300'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleSlot(slot)}
                      className={`w-5 h-5 rounded-xl border flex items-center justify-center shrink-0 transition active:scale-90 ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 hover:border-sky-500 bg-white'
                      }`}
                    >
                      {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                        {slot.start_time} - {slot.end_time}
                      </span>
                      <div className={`text-xs font-bold mt-1 truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {slot.title}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── Sub-view 3: Today's Real Focus Logs ── */}
        {activeTab === 'logs' && (
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
                <p className="text-xs font-bold text-slate-700">No focus sessions recorded yet</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Start a Pomodoro session above to log your deep work!</p>
              </div>
            ) : (
              logs.map(log => {
                const durMinutes = Math.round(log.duration_seconds / 60)
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3"
                  >
                    <div className="w-1.5 h-6 rounded-full bg-violet-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {log.task_title || log.habit_title || log.notes || 'Focus Session'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {formatLocalTime(log.start_time)} - {formatLocalTime(log.end_time)}
                      </div>
                    </div>
                    <span className="text-xs font-black font-mono text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-200 shrink-0">
                      {durMinutes}m
                    </span>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
