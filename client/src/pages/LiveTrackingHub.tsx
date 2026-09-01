import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock, Play, Pause, Square, Plus, Check, RotateCcw,
  Sparkles, Maximize2, Trash2, Calendar as CalendarIcon,
  Flame, CheckCircle2, ChevronRight, BarChart3, AlertCircle,
  Tag, Layers, ArrowRight, Zap, Target
} from 'lucide-react'
import { useTimerStore } from '../store/useTimerStore'
import { useTimeLogStore } from '../store/useTimeLogStore'
import { useTaskStore, type Task } from '../store/useTaskStore'
import { useScheduleStore, type ScheduleSlot } from '../store/useScheduleStore'
import { sounds } from '../utils/soundEffects'

interface Props {
  onOpenFullscreenFocus: () => void
}

export const LiveTrackingHub: React.FC<Props> = ({ onOpenFullscreenFocus }) => {
  const {
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    switchMode,
    isRunning,
    isPaused,
    mode,
    currentPhase,
    secondsRemaining,
    elapsedSeconds,
    activeTitle,
    activeTaskId,
    activeCategoryName,
    activeCategoryColor,
    activeCategoryType
  } = useTimerStore()

  const { logs, fetchLogs, createLog, deleteLog } = useTimeLogStore()
  const { tasks, categories, fetchTasks, fetchCategories } = useTaskStore()
  const { slots, fetchSlots, toggleSlotDone } = useScheduleStore()

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Manual Log Form State
  const [logActivityTitle, setLogActivityTitle] = useState('')
  const [logCategoryId, setLogCategoryId] = useState<number | null>(null)
  const [logStartTime, setLogStartTime] = useState(() => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    return `${String(oneHourAgo.getHours()).padStart(2, '0')}:${String(oneHourAgo.getMinutes()).padStart(2, '0')}`
  })
  const [logEndTime, setLogEndTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [logNotes, setLogNotes] = useState('')
  const [isSubmittingLog, setIsSubmittingLog] = useState(false)

  // Launcher Custom State
  const [launcherDuration, setLauncherDuration] = useState<number>(25)
  const [launcherCategoryId, setLauncherCategoryId] = useState<number | null>(null)
  const [launcherTitle, setLauncherTitle] = useState('')

  useEffect(() => {
    fetchLogs(todayIso)
    fetchTasks()
    fetchCategories()
    fetchSlots(todayIso)
  }, [])

  // Formatted timer strings
  const formatSeconds = (totalSec: number) => {
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const formatLocalTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch {
      return ''
    }
  }

  // Today's total logged time
  const totalLoggedSeconds = useMemo(() => {
    return logs.reduce((acc, cur) => acc + (cur.duration_seconds || 0), 0)
  }, [logs])

  const totalLoggedFormatted = useMemo(() => {
    const hours = Math.floor(totalLoggedSeconds / 3600)
    const mins = Math.floor((totalLoggedSeconds % 3600) / 60)
    if (hours === 0 && mins === 0) return '0m'
    if (hours === 0) return `${mins}m`
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
  }, [totalLoggedSeconds])

  // Category breakdown for today
  const categoryStats = useMemo(() => {
    const map: Record<string, { name: string; color: string; seconds: number; type?: string }> = {}
    logs.forEach(l => {
      const catName = l.category_name || 'Uncategorized'
      const catColor = l.category_color || '#94A3B8'
      if (!map[catName]) {
        map[catName] = { name: catName, color: catColor, seconds: 0 }
      }
      map[catName].seconds += l.duration_seconds || 0
    })
    return Object.values(map)
  }, [logs])

  // Start Quick Focus from Launcher
  const handleStartQuickLauncher = () => {
    sounds.playTap()
    const chosenCat = categories.find(c => c.id === launcherCategoryId)
    startTimer({
      title: launcherTitle.trim() || 'Deep Work Session',
      categoryId: chosenCat?.id,
      categoryName: chosenCat?.name,
      categoryColor: chosenCat?.color,
      categoryType: chosenCat?.category_type,
      durationMinutes: launcherDuration
    })
  }

  // Start tracking from Plan Slot
  const handleTrackPlanSlot = (slot: ScheduleSlot) => {
    sounds.playTap()
    const [sh, sm] = slot.start_time.split(':').map(Number)
    const [eh, em] = slot.end_time.split(':').map(Number)
    const durMins = Math.max(15, (eh * 60 + em) - (sh * 60 + sm))

    startTimer({
      title: slot.title,
      categoryId: slot.category_id || undefined,
      categoryName: slot.category?.name,
      categoryColor: slot.category?.color,
      durationMinutes: durMins
    })
  }

  // Start tracking from Task
  const handleTrackTask = (task: Task) => {
    sounds.playTap()
    startTimer({
      taskId: task.id,
      title: task.title,
      categoryId: task.category?.id,
      categoryName: task.category?.name,
      categoryColor: task.category?.color,
      durationMinutes: 25
    })
  }

  // Handle Manual Log Submission
  const handleSaveManualLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logActivityTitle.trim() || isSubmittingLog) return

    const [sh, sm] = logStartTime.split(':').map(Number)
    const [eh, em] = logEndTime.split(':').map(Number)
    let durMins = (eh * 60 + em) - (sh * 60 + sm)
    if (durMins <= 0) durMins = 30

    try {
      setIsSubmittingLog(true)
      sounds.playTap()

      const startIso = `${todayIso}T${logStartTime}:00`
      const endIso = `${todayIso}T${logEndTime}:00`

      await createLog({
        start_time: startIso,
        end_time: endIso,
        duration_seconds: durMins * 60,
        timer_type: 'manual',
        category_id: logCategoryId || undefined,
        notes: `${logActivityTitle.trim()}${logNotes.trim() ? ` - ${logNotes.trim()}` : ''}`
      })

      sounds.playSuccess()
      setLogActivityTitle('')
      setLogNotes('')
      setLogCategoryId(null)
    } catch (err) {
      console.error('Failed to log actual time', err)
    } finally {
      setIsSubmittingLog(false)
    }
  }

  const handleDeleteLog = async (id: number) => {
    sounds.playTap()
    await deleteLog(id)
    sounds.playSuccess()
  }

  const activePlanSlots = slots.filter(s => !s.is_done)
  const activeTasks = tasks.filter(t => t.status !== 'completed')

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6 bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto space-y-4 pb-24">
        {/* ── 1. Page Header & Quick Overview ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-violet-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Live Tracking & Time Logging
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Tracking & Actual Logs
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Monitor active focus clocks, track ongoing work, and record actual time spent.
            </p>
          </div>

          {/* Today's Total Focused Time Pill */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <div className="bg-white rounded-2xl px-4 py-2 border border-slate-200 shadow-2xs text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Today's Actual Time
              </span>
              <span className="text-base font-black text-violet-700 font-mono">
                {totalLoggedFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. LIVE ACTIVE TRACKING CLOCK / WATCH HUB ── */}
        {isRunning ? (
          <div className="bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950 rounded-3xl p-5 md:p-6 text-white shadow-xl shadow-violet-950/20 border border-violet-800/40 space-y-4 anim-fade-in relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header: Live Pulse Indicator & Mode */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-black tracking-wider uppercase text-emerald-400 font-mono">
                  {isPaused ? '⏸️ Paused' : '⚡ Tracking in Progress'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-white/10 border border-white/15 text-violet-200">
                  {mode === 'pomodoro' ? '🔥 Pomodoro Focus' : '⏱️ Stopwatch'}
                </span>
                <span className="px-2.5 py-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 border border-violet-400/30 text-violet-300">
                  {currentPhase === 'work' ? 'Deep Work' : 'Break Time'}
                </span>
              </div>
            </div>

            {/* Main Clock Face & Task Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10 py-1">
              <div className="space-y-1.5 min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300/80">
                  Current Activity
                </span>
                <h2 className="text-xl md:text-2xl font-black text-white truncate">
                  {activeTitle || 'Deep Work Focus Session'}
                </h2>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {activeCategoryName ? (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg text-white shadow-xs"
                      style={{ backgroundColor: activeCategoryColor || '#8B5CF6' }}
                    >
                      📁 {activeCategoryName} ({activeCategoryType === 'wasted' ? '🔴 Wasted' : activeCategoryType === 'neutral' ? '🔵 Neutral' : '🟢 Productive'})
                    </span>
                  ) : (
                    <span className="text-xs text-violet-300/70 italic">No category assigned</span>
                  )}
                  {activeTaskId && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white font-mono">
                      Task #{activeTaskId}
                    </span>
                  )}
                </div>
              </div>

              {/* Big Digital Watch Display */}
              <div className="flex items-center gap-3 self-center md:self-auto bg-black/30 px-6 py-3.5 rounded-3xl border border-white/10 backdrop-blur-xs">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-black font-mono tracking-tight text-white tabular-nums drop-shadow-md">
                    {mode === 'pomodoro' ? formatSeconds(secondsRemaining) : formatSeconds(elapsedSeconds)}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-violet-300 font-mono mt-0.5">
                    {mode === 'pomodoro' ? 'Time Remaining' : 'Elapsed Time'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Watch Controls */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10 relative z-10 flex-wrap">
              <button
                onClick={() => { sounds.playTap(); onOpenFullscreenFocus() }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white text-violet-950 text-xs font-black hover:bg-violet-50 transition active:scale-95 shadow-md"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Fullscreen Focus</span>
              </button>

              <button
                onClick={() => { sounds.playTap(); isPaused ? resumeTimer() : pauseTimer() }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition active:scale-95 border border-white/15"
              >
                {isPaused ? <Play className="w-4 h-4 fill-current text-emerald-400" /> : <Pause className="w-4 h-4 fill-current text-amber-400" />}
                <span>{isPaused ? 'Resume Clock' : 'Pause Clock'}</span>
              </button>

              <button
                onClick={async () => {
                  sounds.playTap()
                  await stopTimer()
                  sounds.playSuccess()
                  fetchLogs(todayIso)
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition active:scale-95 shadow-md"
                title="Stop watch and save actual focus log"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Finish & Save Log</span>
              </button>

              <button
                onClick={() => { sounds.playTap(); resetTimer() }}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition active:scale-90"
                title="Reset Clock"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* QUICK FOCUS LAUNCHER WATCH */
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Launch Focus Timer</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Start real-time tracking for any activity</p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200">
                <button
                  onClick={() => { sounds.playTap(); switchMode('pomodoro') }}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    mode === 'pomodoro' ? 'bg-white text-violet-700 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Pomodoro
                </button>
                <button
                  onClick={() => { sounds.playTap(); switchMode('stopwatch') }}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    mode === 'stopwatch' ? 'bg-white text-violet-700 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Stopwatch
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <input
                type="text"
                value={launcherTitle}
                onChange={e => setLauncherTitle(e.target.value)}
                placeholder="What are you working on right now?"
                className="sm:col-span-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-violet-500 transition"
              />

              <select
                value={launcherCategoryId || ''}
                onChange={e => setLauncherCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-violet-500 transition"
              >
                <option value="">📁 Select Category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
              {/* Duration Chips (For Pomodoro Mode) */}
              {mode === 'pomodoro' ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Duration:</span>
                  {[15, 25, 45, 60, 90].map(mins => (
                    <button
                      key={mins}
                      onClick={() => { sounds.playTap(); setLauncherDuration(mins) }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition ${
                        launcherDuration === mins
                          ? 'bg-violet-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium">Counts upwards until you hit stop</span>
              )}

              <button
                onClick={handleStartQuickLauncher}
                className="px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-violet-600/20 active:scale-95 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Tracking Now</span>
              </button>
            </div>
          </div>
        )}

        {/* ── 3. TWO-COLUMN WORKSPACE: MANUAL ACTUAL ENTRY & QUEUE TO TRACK ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ── LEFT: MANUAL ACTUAL TIME ENTRY FORM ── */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Record Actual Time</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Log completed work or past activity</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveManualLog} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  value={logActivityTitle}
                  onChange={e => setLogActivityTitle(e.target.value)}
                  placeholder="e.g. Completed API refactor, Client sync..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={logCategoryId || ''}
                  onChange={e => setLogCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white outline-none focus:border-violet-500"
                >
                  <option value="">-- No Category (General) --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      📁 {c.name} {c.category_type ? `(${c.category_type})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={logStartTime}
                    onChange={e => setLogStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={logEndTime}
                    onChange={e => setLogEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={logNotes}
                  onChange={e => setLogNotes(e.target.value)}
                  placeholder="Additional context or outcome..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-violet-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingLog}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmittingLog ? 'Recording...' : 'Save Actual Time Log'}</span>
              </button>
            </form>
          </div>

          {/* ── RIGHT: QUEUE OF TODAY'S PLANNED BLOCKS & TASKS READY TO TRACK ── */}
          <div className="space-y-4">
            {/* Planned Blocks Ready to Track */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-sky-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Planned Blocks ({activePlanSlots.length})
                  </h3>
                </div>
                <Link to="/calendar" className="text-[11px] font-bold text-violet-600 hover:underline">
                  View Calendar →
                </Link>
              </div>

              {activePlanSlots.length === 0 ? (
                <div className="py-5 text-center text-slate-400 text-xs font-medium">
                  No pending plan blocks for today.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                  {activePlanSlots.slice(0, 4).map(slot => (
                    <div
                      key={slot.id}
                      className="p-2.5 rounded-2xl bg-sky-50/60 border border-sky-200/70 flex items-center justify-between gap-2 hover:border-sky-300 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-mono font-bold text-sky-800 bg-white px-1.5 py-0.2 rounded border border-sky-200">
                          {slot.start_time} - {slot.end_time}
                        </span>
                        <div className="text-xs font-bold text-slate-900 mt-1 truncate">
                          {slot.title}
                        </div>
                      </div>

                      <button
                        onClick={() => handleTrackPlanSlot(slot)}
                        className="px-2.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs active:scale-90 transition shrink-0"
                        title="Start Tracking this Plan"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Track</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Tasks Ready to Track */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Pending Tasks ({activeTasks.length})
                  </h3>
                </div>
                <Link to="/tasks" className="text-[11px] font-bold text-violet-600 hover:underline">
                  View Tasks →
                </Link>
              </div>

              {activeTasks.length === 0 ? (
                <div className="py-5 text-center text-slate-400 text-xs font-medium">
                  All tasks completed for today!
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                  {activeTasks.slice(0, 4).map(task => (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 hover:border-violet-300 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {task.title}
                        </div>
                        {task.category && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white shadow-2xs inline-block mt-0.5"
                            style={{ backgroundColor: task.category.color }}
                          >
                            {task.category.name}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleTrackTask(task)}
                        className="px-2.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs active:scale-90 transition shrink-0"
                        title="Focus on this Task"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Focus</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 4. TODAY'S ACTUAL TIME LOG STREAM ── */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-black text-slate-900">
                Today's Logged Sessions ({logs.length})
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono">
              Total: {totalLoggedFormatted}
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <Clock className="w-8 h-8 mx-auto opacity-30 text-violet-600" />
              <p className="text-xs font-bold text-slate-700">No time logs recorded yet today</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Start a live tracking session above or enter an actual time log manually.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {logs.map(log => {
                const durMins = Math.round((log.duration_seconds || 0) / 60)
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 hover:border-violet-300 transition"
                  >
                    <div className="w-2 self-stretch rounded-full bg-violet-500 shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-violet-800 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200">
                          {formatLocalTime(log.start_time)} - {formatLocalTime(log.end_time)} ({durMins}m)
                        </span>
                        <span className="text-[9px] font-bold uppercase text-slate-600 bg-slate-200/70 px-1.5 py-0.2 rounded">
                          {log.timer_type === 'pomodoro' ? '🔥 Pomodoro' : log.timer_type === 'stopwatch' ? '⏱️ Stopwatch' : '📝 Manual'}
                        </span>
                        {log.category_name && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white shadow-2xs"
                            style={{ backgroundColor: log.category_color || '#8B5CF6' }}
                          >
                            {log.category_name}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                        {log.task_title || log.habit_title || log.notes || 'Focus Session'}
                      </h4>
                    </div>

                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 transition active:scale-90"
                      title="Delete Time Log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
