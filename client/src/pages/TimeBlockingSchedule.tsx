import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
  Calendar as CalendarIcon, Plus, Check, Clock, Trash2, X,
  Sparkles, ArrowRight, Play, CheckCircle2, Flame, BarChart2,
  TrendingUp, AlertCircle, ChevronLeft, ChevronRight, LayoutList,
  Columns, Clock3, SplitSquareVertical, Layers, Filter
} from 'lucide-react'
import { useScheduleStore, type ScheduleSlot } from '../store/useScheduleStore'
import { useTimeLogStore, type TimeLogItem } from '../store/useTimeLogStore'
import { useTimerStore } from '../store/useTimerStore'
import { sounds } from '../utils/soundEffects'

type ViewMode = 'timeline' | 'blocks'
type BlockFilter = 'all' | 'plan' | 'timelog' | 'compare'

// Start from 06:00 (6 AM) to 23:00 (11 PM) for high-density daily schedule
const START_HOUR = 6
const END_HOUR = 23
const HOUR_HEIGHT = 64 // pixels per hour block

interface CombinedBlockItem {
  type: 'slot' | 'log'
  id: number
  startTimeStr: string
  endTimeStr: string
  title: string
  notes?: string
  durationMinutes: number
  isDone?: boolean
  timerType?: string
  rawSlot?: ScheduleSlot
  rawLog?: TimeLogItem
}

export const TimeBlockingSchedule: React.FC = () => {
  const { slots, selectedDate, setSelectedDate, fetchSlots, createSlot, toggleSlotDone, deleteSlot } = useScheduleStore()
  const { logs, fetchLogs, createLog, deleteLog } = useTimeLogStore()
  const { startTimer } = useTimerStore()

  // 1. Primary View Mode Switcher: Timeline vs Blocks (No empty hours)
  const [viewMode, setViewMode] = useState<ViewMode>('blocks')

  // 2. Filter Tab for Blocks View
  const [blockFilter, setBlockFilter] = useState<BlockFilter>('all')

  // Create Plan Slot modal state
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [slotTitle, setSlotTitle] = useState('')
  const [slotStart, setSlotStart] = useState('09:00')
  const [slotEnd, setSlotEnd] = useState('10:30')
  const [slotNotes, setSlotNotes] = useState('')

  // Create Manual TimeLog modal state
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [logNotes, setLogNotes] = useState('')
  const [logStart, setLogStart] = useState('09:00')
  const [logEnd, setLogEnd] = useState('10:00')
  const [logType, setLogType] = useState('manual')

  // Current time marker for live Timeline
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })

  const timelineScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSlots(selectedDate)
    fetchLogs(selectedDate)
  }, [selectedDate])

  // Update current time tick every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll timeline to current hour on load
  useEffect(() => {
    if (viewMode === 'timeline' && timelineScrollRef.current) {
      const currentHour = new Date().getHours()
      const scrollOffset = Math.max(0, (currentHour - START_HOUR - 1) * HOUR_HEIGHT)
      timelineScrollRef.current.scrollTo({ top: scrollOffset, behavior: 'smooth' })
    }
  }, [viewMode, selectedDate])

  // 7-day Date Strip: Strictly DAY OF WEEK (MON, TUE, WED...) - NO "TODAY" / "TOMORROW" text
  const datePills = useMemo(() => {
    const dates = []
    const base = new Date()
    const todayIso = base.toISOString().split('T')[0]

    for (let i = -3; i <= 3; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      const iso = d.toISOString().split('T')[0]
      const weekdayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
      const dayNum = d.getDate()
      const isToday = iso === todayIso
      dates.push({ iso, weekdayLabel, dayNum, isToday })
    }
    return dates
  }, [])

  const handlePrevDay = () => {
    sounds.playTap()
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const handleNextDay = () => {
    sounds.playTap()
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const handleToday = () => {
    sounds.playTap()
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  const formatLocalTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch {
      return ''
    }
  }

  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }

  // Combined and sorted list of Blocks (No empty hours)
  const combinedBlocks = useMemo(() => {
    const list: CombinedBlockItem[] = []

    // 1. Add Planned Slots
    slots.forEach(s => {
      const startMins = timeToMinutes(s.start_time)
      const endMins = timeToMinutes(s.end_time)
      const dur = Math.max(0, endMins - startMins)
      list.push({
        type: 'slot',
        id: s.id,
        startTimeStr: s.start_time,
        endTimeStr: s.end_time,
        title: s.title,
        notes: s.notes,
        durationMinutes: dur,
        isDone: s.is_done,
        rawSlot: s
      })
    })

    // 2. Add Focus Time Logs
    logs.forEach(l => {
      const st = formatLocalTime(l.start_time)
      const et = formatLocalTime(l.end_time)
      const dur = Math.round((l.duration_seconds || 0) / 60)
      list.push({
        type: 'log',
        id: l.id,
        startTimeStr: st,
        endTimeStr: et,
        title: l.task_title || l.habit_title || l.notes || 'Focus Session',
        notes: l.notes && l.task_title ? l.notes : undefined,
        durationMinutes: dur,
        timerType: l.timer_type,
        rawLog: l
      })
    })

    // Sort chronologically by start time
    return list.sort((a, b) => a.startTimeStr.localeCompare(b.startTimeStr))
  }, [slots, logs])

  // Filtered blocks based on blockFilter
  const filteredBlocks = useMemo(() => {
    if (blockFilter === 'plan') return combinedBlocks.filter(b => b.type === 'slot')
    if (blockFilter === 'timelog') return combinedBlocks.filter(b => b.type === 'log')
    return combinedBlocks
  }, [combinedBlocks, blockFilter])

  // Total metrics
  const totalLogSeconds = useMemo(() => {
    return logs.reduce((acc, cur) => acc + (cur.duration_seconds || 0), 0)
  }, [logs])

  const totalLogHoursFormatted = useMemo(() => {
    const hours = Math.floor(totalLogSeconds / 3600)
    const mins = Math.floor((totalLogSeconds % 3600) / 60)
    if (hours === 0) return `${mins}m`
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
  }, [totalLogSeconds])

  const totalPlannedMinutes = useMemo(() => {
    return slots.reduce((acc, slot) => {
      try {
        const [sh, sm] = slot.start_time.split(':').map(Number)
        const [eh, em] = slot.end_time.split(':').map(Number)
        const mins = (eh * 60 + em) - (sh * 60 + sm)
        return acc + (mins > 0 ? mins : 0)
      } catch {
        return acc
      }
    }, 0)
  }, [slots])

  const totalPlannedHoursFormatted = useMemo(() => {
    const hours = Math.floor(totalPlannedMinutes / 60)
    const mins = totalPlannedMinutes % 60
    if (hours === 0) return `${mins}m`
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
  }, [totalPlannedMinutes])

  // Handlers
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slotTitle.trim()) return
    sounds.playTap()
    await createSlot({
      date: selectedDate,
      start_time: slotStart,
      end_time: slotEnd,
      title: slotTitle,
      notes: slotNotes.trim() || undefined
    })
    sounds.playSuccess()
    setSlotTitle('')
    setSlotNotes('')
    setPlanModalOpen(false)
  }

  const handleCreateManualLog = async (e: React.FormEvent) => {
    e.preventDefault()
    sounds.playTap()
    const [sh, sm] = logStart.split(':').map(Number)
    const [eh, em] = logEnd.split(':').map(Number)
    let durMins = (eh * 60 + em) - (sh * 60 + sm)
    if (durMins <= 0) durMins = 30

    const startIso = `${selectedDate}T${logStart}:00`
    const endIso = `${selectedDate}T${logEnd}:00`

    await createLog({
      start_time: startIso,
      end_time: endIso,
      duration_seconds: durMins * 60,
      timer_type: logType,
      notes: logNotes.trim() || 'Work Session'
    })
    sounds.playSuccess()
    setLogNotes('')
    setLogModalOpen(false)
  }

  const handleTimelineHourClick = (hour: number) => {
    sounds.playTap()
    const startStr = `${String(hour).padStart(2, '0')}:00`
    const endStr = `${String(Math.min(23, hour + 1)).padStart(2, '0')}:00`
    setSlotStart(startStr)
    setSlotEnd(endStr)
    setPlanModalOpen(true)
  }

  const handleStartSlotFocus = (slot: ScheduleSlot) => {
    sounds.playTap()
    const [sh, sm] = slot.start_time.split(':').map(Number)
    const [eh, em] = slot.end_time.split(':').map(Number)
    const durMins = Math.max(15, (eh * 60 + em) - (sh * 60 + sm))

    startTimer({
      title: `Block: ${slot.title}`,
      durationMinutes: durMins
    })
  }

  const isViewingToday = selectedDate === new Date().toISOString().split('T')[0]

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 pb-4">
      {/* ── 1. Clean Top Header: Date Navigator & Switch View Button ── */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Date Navigator */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={handlePrevDay}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition active:scale-90"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 text-xs font-black text-slate-800 font-mono">
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>

            <button
              onClick={handleNextDay}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition active:scale-90"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isViewingToday && (
            <button
              onClick={handleToday}
              className="px-2.5 py-1 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-bold hover:bg-violet-100 transition active:scale-95 shadow-2xs"
            >
              Today
            </button>
          )}
        </div>

        {/* Primary View Switcher: [ 📦 Blocks ] vs [ ⏱️ Timeline ] */}
        <div className="flex items-center p-0.5 bg-slate-200/80 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
          <button
            onClick={() => { sounds.playTap(); setViewMode('blocks') }}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 ${
              viewMode === 'blocks'
                ? 'bg-white text-violet-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Compact blocks only (No empty hours)"
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Blocks</span>
          </button>

          <button
            onClick={() => { sounds.playTap(); setViewMode('timeline') }}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 ${
              viewMode === 'timeline'
                ? 'bg-white text-violet-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Hourly Timeline with ruler"
          >
            <Clock3 className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
        </div>
      </div>

      {/* ── 2. Date Strip: Days of Week Only (MON, TUE, WED...) ── */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {datePills.map(d => {
          const isSelected = selectedDate === d.iso
          return (
            <button
              key={d.iso}
              onClick={() => { sounds.playTap(); setSelectedDate(d.iso) }}
              className={`shrink-0 flex flex-col items-center justify-center flex-1 min-w-[44px] py-1.5 rounded-2xl border transition active:scale-95 relative ${
                isSelected
                  ? 'bg-violet-600 border-violet-600 text-white shadow-xs scale-[1.02]'
                  : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {/* Day of week (MON, TUE, WED...) */}
              <span className={`text-[9px] font-black uppercase tracking-wider ${isSelected ? 'text-violet-100' : 'text-slate-400'}`}>
                {d.weekdayLabel}
              </span>

              {/* Day Number */}
              <span className={`text-sm font-black font-mono mt-0.5 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                {d.dayNum}
              </span>

              {/* Subtle indicator dot for today */}
              {d.isToday && (
                <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-amber-300' : 'bg-violet-600'}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── 3. Quick Metrics Overview Strip ── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-sky-50/90 border border-sky-200/80 rounded-2xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-sky-600 shrink-0" />
            <div>
              <div className="text-[9px] font-bold uppercase text-sky-700 tracking-wider">Planned</div>
              <div className="text-sm font-black text-sky-950 font-mono">{totalPlannedHoursFormatted}</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-sky-800 bg-white/80 px-2 py-0.5 rounded-lg border border-sky-200">
            {slots.filter(s => s.is_done).length}/{slots.length} done
          </span>
        </div>

        <div className="bg-violet-50/90 border border-violet-200/80 rounded-2xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-600 shrink-0" />
            <div>
              <div className="text-[9px] font-bold uppercase text-violet-700 tracking-wider">Actual Focused</div>
              <div className="text-sm font-black text-violet-950 font-mono">{totalLogHoursFormatted}</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-violet-800 bg-white/80 px-2 py-0.5 rounded-lg border border-violet-200">
            {logs.length} logs
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── VIEW MODE 1: COMPACT BLOCKS (NO EMPTY HOURS SHOWN) ─────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'blocks' && (
        <div className="space-y-3 animate-fade-in">
          {/* Sub-Filter Pills */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: `All Blocks (${combinedBlocks.length})` },
                { id: 'plan', label: `Plan (${slots.length})` },
                { id: 'timelog', label: `Time Logs (${logs.length})` },
                { id: 'compare', label: 'Variance' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { sounds.playTap(); setBlockFilter(tab.id as BlockFilter) }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 whitespace-nowrap border ${
                    blockFilter === tab.id
                      ? 'bg-violet-600 border-violet-600 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => { sounds.playTap(); setPlanModalOpen(true) }}
                className="h-7 px-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition"
                title="Add Plan Block"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Plan</span>
              </button>
              <button
                onClick={() => { sounds.playTap(); setLogModalOpen(true) }}
                className="h-7 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition"
                title="Log Time Entry"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log</span>
              </button>
            </div>
          </div>

          {/* Variance Analysis (When Compare Tab Selected) */}
          {blockFilter === 'compare' && (
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5">
              <div className="flex items-start gap-2.5">
                <TrendingUp className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <strong>Time Auditing:</strong> Planned budget is <strong>{totalPlannedHoursFormatted}</strong> and actual recorded time is <strong>{totalLogHoursFormatted}</strong>.
                  {totalLogSeconds > totalPlannedMinutes * 60 ? (
                    <span className="text-emerald-700 font-semibold block mt-0.5">
                      🎉 You focused +{Math.round((totalLogSeconds - totalPlannedMinutes * 60) / 60)} mins over your plan!
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold block mt-0.5">
                      📌 {Math.max(0, Math.round((totalPlannedMinutes * 60 - totalLogSeconds) / 60))} mins remaining against plan.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chronological Blocks List */}
          {filteredBlocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center shadow-xs mb-3">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-black text-slate-900">No Time Blocks Scheduled</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[260px] leading-relaxed">
                Add planned focus blocks or record time entries to structure your day without empty hour clutter.
              </p>

              <div className="flex items-center gap-2 mt-5">
                <button
                  onClick={() => { sounds.playTap(); setPlanModalOpen(true) }}
                  className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/20 active:scale-95 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add Plan Block</span>
                </button>
                <button
                  onClick={() => { sounds.playTap(); setLogModalOpen(true) }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold active:scale-95 transition flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Log Time</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredBlocks.map(item => {
                if (item.type === 'slot' && item.rawSlot) {
                  const slot = item.rawSlot
                  const isDone = !!slot.is_done
                  return (
                    <div
                      key={`slot-${slot.id}`}
                      className={`bg-white rounded-2xl p-3.5 border transition shadow-2xs ${
                        isDone
                          ? 'opacity-65 bg-emerald-50/20 border-emerald-200'
                          : 'border-slate-200 hover:border-violet-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => { sounds.playTap(); toggleSlotDone(slot.id, !isDone); if (!isDone) sounds.playSuccess() }}
                          className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition active:scale-90 ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                              : 'border-slate-300 hover:border-violet-500 bg-white'
                          }`}
                          title={isDone ? 'Mark Pending' : 'Mark Completed'}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                              {slot.start_time} - {slot.end_time} ({item.durationMinutes}m)
                            </span>
                            <span className="text-[9px] font-bold text-sky-700 bg-sky-100/60 px-1.5 py-0.2 rounded">
                              📅 Plan Block
                            </span>
                          </div>
                          <h4 className={`text-xs font-bold mt-1.5 truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {slot.title}
                          </h4>
                          {slot.notes && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">{slot.notes}</p>
                          )}
                        </div>

                        {/* Actions: Start Focus & Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          {!isDone && (
                            <button
                              onClick={() => handleStartSlotFocus(slot)}
                              className="h-6 px-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition"
                              title="Start Focus Timer"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Focus</span>
                            </button>
                          )}
                          <button
                            onClick={() => { sounds.playTap(); deleteSlot(slot.id) }}
                            className="p-1.5 text-slate-300 hover:text-rose-600 transition active:scale-90"
                            title="Delete Slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                }

                // If Actual Time Log
                if (item.type === 'log' && item.rawLog) {
                  const log = item.rawLog
                  return (
                    <div
                      key={`log-${log.id}`}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200/90 flex items-center justify-between gap-3 hover:border-violet-300 transition shadow-2xs"
                    >
                      <div className="w-2 self-stretch rounded-full bg-violet-500 shrink-0" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-violet-800 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200">
                            {item.startTimeStr} - {item.endTimeStr} ({item.durationMinutes}m)
                          </span>
                          <span className="text-[9px] font-bold uppercase text-violet-700 bg-violet-100/70 px-1.5 py-0.2 rounded">
                            {log.timer_type === 'pomodoro' ? '🔥 Pomodoro' : log.timer_type === 'stopwatch' ? '⏱️ Stopwatch' : '📝 Log'}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 mt-1.5 truncate">
                          {item.title}
                        </h4>

                        {item.notes && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">{item.notes}</p>
                        )}
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => { sounds.playTap(); deleteLog(log.id) }}
                          className="p-1 text-slate-300 hover:text-rose-600 transition active:scale-90"
                          title="Delete Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                }

                return null
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── VIEW MODE 2: HOURLY TIMELINE (24H RULER) ────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'timeline' && (
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden animate-fade-in">
          {/* Timeline Toolbar */}
          <div className="p-2.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-md">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> Planned Slots
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-800 bg-violet-100/80 px-2 py-0.5 rounded-md">
                <span className="w-2 h-2 rounded-full bg-violet-500" /> Focus Logs
              </span>
            </div>

            <button
              onClick={() => { sounds.playTap(); setPlanModalOpen(true) }}
              className="px-2.5 py-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold shadow-2xs active:scale-95 transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Block</span>
            </button>
          </div>

          {/* Hourly Vertical Timeline Scroll Area */}
          <div
            ref={timelineScrollRef}
            className="flex-1 overflow-y-auto min-h-[420px] max-h-[600px] p-3 relative select-none"
          >
            {/* 24-Hour Grid Lines */}
            <div className="relative" style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }}>
              {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, idx) => {
                const hour = START_HOUR + idx
                const topPos = idx * HOUR_HEIGHT

                return (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-slate-100 flex items-start group hover:bg-slate-50/50 transition cursor-pointer"
                    style={{ top: topPos, height: HOUR_HEIGHT }}
                    onClick={() => handleTimelineHourClick(hour)}
                  >
                    {/* Time Label */}
                    <div className="w-12 -mt-2 text-[10px] font-mono font-bold text-slate-400 select-none">
                      {String(hour).padStart(2, '0')}:00
                    </div>
                    {/* Dashed half-hour line */}
                    <div className="flex-1 border-b border-dashed border-slate-50/80 h-1/2" />
                  </div>
                )
              })}

              {/* Current Time Live Indicator (Red/Purple Line) */}
              {isViewingToday && currentTimeMinutes >= START_HOUR * 60 && currentTimeMinutes <= (END_HOUR + 1) * 60 && (
                <div
                  className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                  style={{
                    top: ((currentTimeMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT
                  }}
                >
                  <div className="w-12 text-[9px] font-mono font-black text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-200 shrink-0">
                    NOW
                  </div>
                  <div className="flex-1 h-0.5 bg-rose-500 shadow-xs relative">
                    <span className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white" />
                  </div>
                </div>
              )}

              {/* Render Planned Schedule Slots as Overlaid Time Blocks */}
              {slots.map(slot => {
                const startMins = timeToMinutes(slot.start_time)
                const endMins = timeToMinutes(slot.end_time)
                const durMins = Math.max(15, endMins - startMins)

                const top = Math.max(0, ((startMins - START_HOUR * 60) / 60) * HOUR_HEIGHT)
                const height = Math.max(28, (durMins / 60) * HOUR_HEIGHT)

                return (
                  <div
                    key={`slot-${slot.id}`}
                    className={`absolute left-14 right-2 sm:right-1/2 rounded-xl p-2 border shadow-xs transition z-10 flex items-start justify-between gap-2 overflow-hidden ${
                      slot.is_done
                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 opacity-80'
                        : 'bg-sky-50/95 border-sky-300 text-sky-950 hover:border-sky-500 hover:shadow-md'
                    }`}
                    style={{ top, height: `${height}px` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-white/80 border border-sky-200">
                          {slot.start_time} - {slot.end_time}
                        </span>
                        {slot.is_done && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded">✓ Done</span>
                        )}
                      </div>
                      <h4 className={`text-xs font-bold mt-1 truncate ${slot.is_done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {slot.title}
                      </h4>
                      {slot.notes && (
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 italic">{slot.notes}</p>
                      )}
                    </div>

                    {/* Quick Done Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        sounds.playTap()
                        toggleSlotDone(slot.id, !slot.is_done)
                        if (!slot.is_done) sounds.playSuccess()
                      }}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition active:scale-90 ${
                        slot.is_done ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-sky-300 hover:border-sky-500'
                      }`}
                      title={slot.is_done ? 'Mark pending' : 'Mark completed'}
                    >
                      {slot.is_done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </div>
                )
              })}

              {/* Render Actual Focus Time Logs as Side-by-Side Purple Blocks */}
              {logs.map(log => {
                const startTimeStr = formatLocalTime(log.start_time)
                const endTimeStr = formatLocalTime(log.end_time)
                const startMins = timeToMinutes(startTimeStr)
                const durMins = Math.max(15, Math.round(log.duration_seconds / 60))

                const top = Math.max(0, ((startMins - START_HOUR * 60) / 60) * HOUR_HEIGHT)
                const height = Math.max(26, (durMins / 60) * HOUR_HEIGHT)

                return (
                  <div
                    key={`log-${log.id}`}
                    className="absolute left-1/2 right-2 rounded-xl p-2 bg-violet-50/95 border border-violet-300 text-violet-950 shadow-xs z-10 hidden sm:flex items-start justify-between gap-1.5 overflow-hidden"
                    style={{ top, height: `${height}px` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white border border-violet-200">
                          ⏱️ {startTimeStr} ({durMins}m)
                        </span>
                      </div>
                      <h4 className="text-xs font-bold mt-1 truncate text-slate-900">
                        {log.task_title || log.habit_title || log.notes || 'Focus Session'}
                      </h4>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 1: Add Plan Slot ────── */}
      {planModalOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setPlanModalOpen(false)} />
          <div className="sheet-content max-w-lg mx-auto">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">Plan Time Block</h2>
                <p className="text-[11px] text-slate-500 font-medium">Schedule planned focus hours</p>
              </div>
              <button onClick={() => setPlanModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Activity Name
                </label>
                <input
                  type="text"
                  value={slotTitle}
                  onChange={e => setSlotTitle(e.target.value)}
                  placeholder="e.g. Write report, English study, Team standup..."
                  autoFocus
                  required
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={slotStart}
                    onChange={e => setSlotStart(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={slotEnd}
                    onChange={e => setSlotEnd(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={slotNotes}
                  onChange={e => setSlotNotes(e.target.value)}
                  placeholder="Short note..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold active:scale-[0.98] transition shadow-md shadow-violet-600/20 mt-2"
              >
                Save Plan Slot
              </button>
            </form>
          </div>
        </>
      )}

      {/* ── Modal 2: Add Manual Time Log ── */}
      {logModalOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setLogModalOpen(false)} />
          <div className="sheet-content max-w-lg mx-auto">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">Record Actual Time Log</h2>
                <p className="text-[11px] text-slate-500 font-medium">Log actual time spent on work</p>
              </div>
              <button onClick={() => setLogModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateManualLog} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  What did you work on?
                </label>
                <input
                  type="text"
                  value={logNotes}
                  onChange={e => setLogNotes(e.target.value)}
                  placeholder="e.g. Read 30 mins, Bug fixing, Client meeting..."
                  autoFocus
                  required
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    From
                  </label>
                  <input
                    type="time"
                    value={logStart}
                    onChange={e => setLogStart(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    To
                  </label>
                  <input
                    type="time"
                    value={logEnd}
                    onChange={e => setLogEnd(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold active:scale-[0.98] transition shadow-md shadow-violet-600/20 mt-2"
              >
                Save Time Log
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
