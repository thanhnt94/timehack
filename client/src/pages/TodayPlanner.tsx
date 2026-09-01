import React, { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Sun, Moon, Coffee, Play, Check, Flame, Clock,
  Calendar as CalendarIcon, ArrowRight, Sparkles, Plus
} from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore'
import { useHabitStore } from '../store/useHabitStore'
import { useScheduleStore, type ScheduleSlot } from '../store/useScheduleStore'
import { useTimeLogStore } from '../store/useTimeLogStore'
import { useTimerStore } from '../store/useTimerStore'
import { sounds } from '../utils/soundEffects'

interface Props {
  onOpenFocus: () => void
}

export const TodayPlanner: React.FC<Props> = ({ onOpenFocus }) => {
  const { tasks, fetchTasks, toggleTaskStatus } = useTaskStore()
  const { habits, fetchHabits, checkinHabit } = useHabitStore()
  const { slots, fetchSlots, toggleSlotDone } = useScheduleStore()
  const { logs, fetchLogs } = useTimeLogStore()
  const { startTimer, isRunning, currentPhase } = useTimerStore()

  useEffect(() => {
    fetchTasks()
    fetchHabits()
    fetchSlots()
    fetchLogs()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const GreetIcon = hour < 12 ? Sun : hour < 18 ? Coffee : Moon

  const doneTasks = tasks.filter(t => t.status === 'completed').length
  const totalTasks = tasks.length
  const doneHabits = habits.filter(h => !!h.today_completed).length
  const doneSlots = slots.filter(s => s.is_done).length

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

  const handleStartQuickFocus = () => {
    sounds.playTap()
    startTimer({ title: 'Quick Focus Session' })
    onOpenFocus()
  }

  const handleToggleSlot = (slot: ScheduleSlot) => {
    sounds.playTap()
    toggleSlotDone(slot.id, !slot.is_done)
    if (!slot.is_done) sounds.playSuccess()
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
    <div className="space-y-4 pb-4">
      {/* ── Top: Greeting & Date ───────── */}
      <div>
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider">
          <GreetIcon className="w-4 h-4 text-amber-500" />
          <span>{greeting}</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-0.5">{todayStr}</h1>
      </div>

      {/* ── 4 Stat Overview Pills ───────── */}
      <div className="grid grid-cols-4 gap-2">
        <Link to="/tasks" className="glass rounded-2xl p-2.5 text-center border border-slate-200 hover:border-violet-300 transition active:scale-95">
          <div className="text-base font-black text-slate-900 font-mono">{doneTasks}/{totalTasks}</div>
          <div className="text-[10px] text-slate-500 font-bold mt-0.5">Tasks</div>
        </Link>
        <Link to="/habits" className="glass rounded-2xl p-2.5 text-center border border-slate-200 hover:border-violet-300 transition active:scale-95">
          <div className="text-base font-black text-emerald-700 font-mono">{doneHabits}/{habits.length}</div>
          <div className="text-[10px] text-slate-500 font-bold mt-0.5">Habits</div>
        </Link>
        <Link to="/calendar" className="glass rounded-2xl p-2.5 text-center border border-slate-200 hover:border-violet-300 transition active:scale-95">
          <div className="text-base font-black text-sky-600 font-mono">{doneSlots}/{slots.length}</div>
          <div className="text-[10px] text-slate-500 font-bold mt-0.5">Plan</div>
        </Link>
        <Link to="/calendar" className="glass rounded-2xl p-2.5 text-center border border-slate-200 hover:border-violet-300 transition active:scale-95">
          <div className="text-base font-black text-violet-700 font-mono">{totalLogFormatted}</div>
          <div className="text-[10px] text-slate-500 font-bold mt-0.5">Time Log</div>
        </Link>
      </div>

      {/* ── Hero Focus Launcher ─────────── */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-4 text-white shadow-lg shadow-violet-600/20 flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-200 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRunning ? 'Session Active' : 'Deep Focus'}</span>
          </div>
          <h3 className="text-base font-black truncate">
            {isRunning ? (currentPhase === 'work' ? '🔥 Focus Mode' : '☕ On Break') : 'Ready for Pomodoro?'}
          </h3>
          <p className="text-[11px] text-violet-100/80 mt-0.5 truncate">
            {isRunning ? 'Tap to view timer & ambient soundscapes' : '25 mins uninterrupted deep work'}
          </p>
        </div>

        <button
          onClick={isRunning ? onOpenFocus : handleStartQuickFocus}
          className="w-12 h-12 rounded-2xl bg-white text-violet-700 flex items-center justify-center font-bold shadow-md shrink-0 active:scale-90 transition hover:bg-violet-50"
          title="Start Focus Session"
        >
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </button>
      </div>

      {/* ── Today's Plan ────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Today's Plan</h2>
          </div>
          <Link
            to="/calendar"
            className="text-[11px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-0.5"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {slots.length === 0 ? (
          <div className="glass rounded-2xl p-4 text-center border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">No time blocks scheduled for today.</p>
            <Link
              to="/calendar"
              className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:underline mt-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Plan a time block
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {slots.slice(0, 3).map(slot => {
              const isDone = !!slot.is_done
              return (
                <div
                  key={slot.id}
                  className={`glass rounded-2xl px-3.5 py-2.5 flex items-center gap-3 border border-slate-200 transition ${
                    isDone ? 'opacity-45 bg-slate-50' : 'hover:border-sky-300'
                  }`}
                >
                  <button
                    onClick={() => handleToggleSlot(slot)}
                    className={`w-5 h-5 rounded-xl border flex items-center justify-center shrink-0 transition active:scale-90 ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 hover:border-sky-500 bg-white text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-mono font-bold text-violet-700">
                      {slot.start_time} - {slot.end_time}
                    </span>
                    <div className={`text-xs font-semibold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {slot.title}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Actual Time Log ─────────────── */}
      {logs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-violet-600" />
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Actual Time Log ({totalLogFormatted})
              </h2>
            </div>
            <Link
              to="/calendar"
              className="text-[11px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-0.5"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {logs.slice(0, 2).map(log => {
              const durMinutes = Math.round(log.duration_seconds / 60)
              return (
                <div
                  key={log.id}
                  className="glass rounded-2xl px-3.5 py-2.5 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="w-1.5 h-6 rounded-full bg-violet-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {log.task_title || log.habit_title || log.notes || 'Work Session'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {formatLocalTime(log.start_time)} - {formatLocalTime(log.end_time)}
                    </div>
                  </div>
                  <span className="text-xs font-black font-mono text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-100 shrink-0">
                    {durMinutes}m
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Today's Habits ──────────────── */}
      {habits.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Today's Habits</h2>
            </div>
            <Link
              to="/habits"
              className="text-[11px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-0.5"
            >
              <span>All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {habits.map(h => {
              const checked = !!h.today_completed
              return (
                <button
                  key={h.id}
                  onClick={() => { sounds.playTap(); checkinHabit(h.id); sounds.playSuccess() }}
                  className={`shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition active:scale-95 ${
                    checked
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                    checked
                      ? 'bg-emerald-500 text-white anim-check shadow-xs'
                      : 'bg-slate-100 border border-slate-300 text-slate-600'
                  }`}>
                    {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-xs font-bold truncate max-w-[90px]">{h.title}</div>
                    {h.current_streak > 0 && (
                      <div className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                        <Flame className="w-3 h-3 text-amber-500" /> {h.current_streak}d
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Today's Tasks ───────────────── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-violet-600" />
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tasks</h2>
          </div>
          <Link
            to="/tasks"
            className="text-[11px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-0.5"
          >
            <span>View Tasks</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center border border-slate-200">
            <p className="text-xs font-semibold text-slate-600">No tasks yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tap the center <strong>(+)</strong> button to add a task.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 5).map(task => {
              const isDone = task.status === 'completed'
              return (
                <div
                  key={task.id}
                  className={`glass rounded-2xl px-3.5 py-3 flex items-center gap-3 border border-slate-200 transition ${
                    isDone ? 'opacity-50 bg-slate-50' : 'hover:border-violet-300'
                  }`}
                >
                  <button
                    onClick={() => { sounds.playTap(); toggleTaskStatus(task.id); if (!isDone) sounds.playSuccess() }}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition active:scale-90 ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 hover:border-violet-500 bg-white'
                    }`}
                  >
                    {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </div>
                    {task.eisenhower && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        task.eisenhower === 'do_first' ? 'text-rose-600' :
                        task.eisenhower === 'schedule' ? 'text-violet-600' :
                        task.eisenhower === 'delegate' ? 'text-amber-600' : 'text-slate-400'
                      }`}>
                        {task.eisenhower === 'do_first' ? 'Q1 Urgent' :
                         task.eisenhower === 'schedule' ? 'Q2 Plan' :
                         task.eisenhower === 'delegate' ? 'Q3 Delegate' : 'Q4 Eliminate'}
                      </span>
                    )}
                  </div>

                  {!isDone && (
                    <button
                      onClick={() => handlePlayTask(task)}
                      className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-600 hover:text-white transition active:scale-90 shrink-0 flex items-center justify-center shadow-xs"
                      title="Start Focus"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
