import React, { useEffect, useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon, Plus, Check, Clock, Trash2, X,
  Sparkles, ArrowRight, Play, CheckCircle2, Flame, BarChart2,
  TrendingUp, AlertCircle
} from 'lucide-react'
import { useScheduleStore, type ScheduleSlot } from '../store/useScheduleStore'
import { useTimeLogStore, type TimeLogItem } from '../store/useTimeLogStore'
import { useTimerStore } from '../store/useTimerStore'
import { sounds } from '../utils/soundEffects'

type CalendarTab = 'plan' | 'timelog' | 'compare'

export const TimeBlockingSchedule: React.FC = () => {
  const { slots, selectedDate, setSelectedDate, fetchSlots, createSlot, toggleSlotDone, deleteSlot } = useScheduleStore()
  const { logs, fetchLogs, createLog, deleteLog } = useTimeLogStore()
  const { startTimer } = useTimerStore()

  const [activeTab, setActiveTab] = useState<CalendarTab>('plan')

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

  useEffect(() => {
    fetchSlots(selectedDate)
    fetchLogs(selectedDate)
  }, [selectedDate])

  const datePills = useMemo(() => {
    const dates = []
    const base = new Date()
    for (let i = -2; i < 5; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      const iso = d.toISOString().split('T')[0]
      const label =
        i === 0
          ? 'Today'
          : i === 1
          ? 'Tomorrow'
          : i === -1
          ? 'Yesterday'
          : d.toLocaleDateString('en-US', { weekday: 'short' })
      const dayNum = d.getDate()
      dates.push({ iso, label, dayNum })
    }
    return dates
  }, [])

  // Calculations
  const sortedSlots = useMemo(() => {
    return [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [slots])

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }, [logs])

  const totalLogSeconds = useMemo(() => {
    return logs.reduce((acc, cur) => acc + (cur.duration_seconds || 0), 0)
  }, [logs])

  const totalLogHoursFormatted = useMemo(() => {
    const hours = Math.floor(totalLogSeconds / 3600)
    const mins = Math.floor((totalLogSeconds % 3600) / 60)
    if (hours === 0) return `${mins} mins`
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
  }, [totalLogSeconds])

  // Total Planned Minutes
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
    if (hours === 0) return `${mins} mins`
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
      {/* ── Ergonomic Large Header ─────── */}
      <div className="pt-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Time Budgeting & Auditing</span>
            <h1 className="text-2xl font-black text-slate-900 mt-0.5">Calendar</h1>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 font-mono">
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Date Carousel ───────────── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {datePills.map(d => {
          const isSelected = selectedDate === d.iso
          return (
            <button
              key={d.iso}
              onClick={() => { sounds.playTap(); setSelectedDate(d.iso) }}
              className={`shrink-0 flex flex-col items-center justify-center w-13 py-2 rounded-2xl border transition active:scale-95 ${
                isSelected
                  ? 'bg-violet-600 border-violet-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-[10px] font-bold uppercase">{d.label}</span>
              <span className={`text-base font-black font-mono mt-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                {d.dayNum}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── 3 Main Sub-tabs ─────────── */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-2xl text-xs font-bold">
        <button
          onClick={() => { sounds.playTap(); setActiveTab('plan') }}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'plan'
              ? 'bg-white text-violet-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Plan ({slots.length})</span>
        </button>

        <button
          onClick={() => { sounds.playTap(); setActiveTab('timelog') }}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'timelog'
              ? 'bg-white text-violet-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Time Log ({logs.length})</span>
        </button>

        <button
          onClick={() => { sounds.playTap(); setActiveTab('compare') }}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'compare'
              ? 'bg-white text-violet-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Compare</span>
        </button>
      </div>

      {/* ── TAB 1: PLAN ─────────────── */}
      {activeTab === 'plan' && (
        <div className="space-y-3 animate-fade-in">
          {/* Quick Summary Pill */}
          <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-sky-900 font-semibold">
              <CalendarIcon className="w-4 h-4 text-sky-600" />
              <span>Planned: <strong>{totalPlannedHoursFormatted}</strong></span>
            </div>
            <span className="text-[11px] font-bold text-sky-700">
              Completed {slots.filter(s => s.is_done).length}/{slots.length}
            </span>
          </div>

          {sortedSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shadow-xs mb-3">
                <CalendarIcon className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900">No Plan Scheduled</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[260px] leading-relaxed">
                Block planned focus hours in advance to structure your day intentionally.
              </p>

              <button
                onClick={() => { sounds.playTap(); setPlanModalOpen(true) }}
                className="mt-6 px-6 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-lg shadow-violet-600/25 active:scale-95 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Plan First Time Block</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedSlots.map((slot) => {
                const isDone = !!slot.is_done
                return (
                  <div
                    key={slot.id}
                    className={`glass rounded-2xl p-3.5 border transition ${
                      isDone ? 'opacity-50 bg-slate-50 border-slate-200' : 'border-slate-200 hover:border-violet-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => { sounds.playTap(); toggleSlotDone(slot.id, !isDone); if (!isDone) sounds.playSuccess() }}
                        className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition active:scale-90 ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 hover:border-violet-500 bg-white'
                        }`}
                        aria-label="Toggle slot complete"
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                          {slot.start_time} - {slot.end_time}
                        </span>
                        <h4 className={`text-sm font-bold mt-1 truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {slot.title}
                        </h4>
                        {slot.notes && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{slot.notes}</p>
                        )}
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => { sounds.playTap(); deleteSlot(slot.id) }}
                        className="p-1.5 text-slate-300 hover:text-rose-600 transition active:scale-90 shrink-0"
                        title="Delete slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Bottom Thumb CTA */}
              <div className="pt-2">
                <button
                  onClick={() => { sounds.playTap(); setPlanModalOpen(true) }}
                  className="w-full py-3 rounded-2xl bg-white border border-dashed border-slate-300 hover:border-violet-400 text-slate-600 hover:text-violet-700 text-xs font-bold transition active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Plan Slot</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: TIME LOG ─────────── */}
      {activeTab === 'timelog' && (
        <div className="space-y-3 animate-fade-in">
          {/* Summary Box */}
          <div className="bg-violet-50 border border-violet-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-violet-700 tracking-wider">Total Real Time Spent</div>
                <div className="text-base font-black text-slate-900">{totalLogHoursFormatted}</div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-violet-800 bg-white border border-violet-200 px-2.5 py-1 rounded-xl shadow-xs">
              {logs.length} sessions
            </span>
          </div>

          {sortedLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center shadow-xs mb-3">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900">No Time Logs Today</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[260px] leading-relaxed">
                Run Pomodoro focus sessions or log manually to track where your actual hours went.
              </p>

              <button
                onClick={() => { sounds.playTap(); setLogModalOpen(true) }}
                className="mt-6 px-6 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-lg shadow-violet-600/25 active:scale-95 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Log First Time Entry</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedLogs.map((log) => {
                const durMinutes = Math.round(log.duration_seconds / 60)
                const startTimeStr = formatLocalTime(log.start_time)
                const endTimeStr = formatLocalTime(log.end_time)

                return (
                  <div
                    key={log.id}
                    className="glass rounded-2xl p-3.5 border border-slate-200 flex items-center justify-between gap-3 hover:border-violet-300 transition"
                  >
                    <div className="w-2 self-stretch rounded-full bg-violet-500 shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {startTimeStr} - {endTimeStr}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">
                          {log.timer_type === 'pomodoro' ? '🔥 Pomodoro' : log.timer_type === 'stopwatch' ? '⏱️ Stopwatch' : '📝 Manual'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                        {log.task_title || log.habit_title || log.notes || 'Work Session'}
                      </h4>

                      {log.notes && log.task_title && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{log.notes}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div className="text-xs font-black font-mono text-violet-700 bg-violet-50 px-2 py-1 rounded-xl border border-violet-100">
                        {durMinutes}m
                      </div>
                      <button
                        onClick={() => { sounds.playTap(); deleteLog(log.id) }}
                        className="p-1 text-slate-300 hover:text-rose-600 transition active:scale-90"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Bottom Thumb CTA */}
              <div className="pt-2">
                <button
                  onClick={() => { sounds.playTap(); setLogModalOpen(true) }}
                  className="w-full py-3 rounded-2xl bg-white border border-dashed border-slate-300 hover:border-violet-400 text-slate-600 hover:text-violet-700 text-xs font-bold transition active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Time Entry Manually</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: COMPARE ──────────── */}
      {activeTab === 'compare' && (
        <div className="space-y-3 animate-fade-in">
          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold uppercase text-sky-700 tracking-wider">Planned (Budget)</div>
              <div className="text-lg font-black text-sky-950 font-mono mt-0.5">{totalPlannedHoursFormatted}</div>
              <div className="text-[10px] text-sky-600 mt-0.5">{slots.length} time slots</div>
            </div>

            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold uppercase text-violet-700 tracking-wider">Actual (Time Log)</div>
              <div className="text-lg font-black text-violet-950 font-mono mt-0.5">{totalLogHoursFormatted}</div>
              <div className="text-[10px] text-violet-600 mt-0.5">{logs.length} logged entries</div>
            </div>
          </div>

          {/* Variance Insight */}
          <div className="glass rounded-2xl p-3.5 border border-slate-200 flex items-start gap-2.5">
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

          {/* Side by side list */}
          <div className="space-y-2 pt-1">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Schedule Breakdown</h3>
            {slots.map(s => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-bold font-mono text-sky-700">{s.start_time} - {s.end_time}</span>
                  <div className="font-bold text-slate-900 truncate">{s.title}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  s.is_done ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {s.is_done ? 'Done' : 'Pending'}
                </span>
              </div>
            ))}
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
