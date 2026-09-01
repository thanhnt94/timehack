import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
  Calendar as CalendarIcon, Plus, Check, Clock, Trash2, X,
  Sparkles, ArrowRight, Play, CheckCircle2, Flame, BarChart2,
  TrendingUp, AlertCircle, ChevronLeft, ChevronRight, LayoutList,
  Columns, Clock3, SplitSquareVertical, Layers, Filter, Search, Tag
} from 'lucide-react'
import { useScheduleStore, type ScheduleSlot } from '../store/useScheduleStore'
import { useTimeLogStore, type TimeLogItem } from '../store/useTimeLogStore'
import { useTimerStore } from '../store/useTimerStore'
import { useTaskStore, type Task } from '../store/useTaskStore'
import { sounds } from '../utils/soundEffects'

type ViewMode = 'timeline' | 'blocks'
type BlockFilter = 'all' | 'plan' | 'timelog' | 'compare'

// Start from 06:00 (6 AM) to 23:00 (11 PM) for high-density daily schedule
const START_HOUR = 6
const END_HOUR = 23
const HOUR_HEIGHT = 64 // pixels per hour block

interface CombinedBlockItem {
  type: 'slot' | 'log' | 'deadline'
  id: number
  startTimeStr: string
  endTimeStr: string
  title: string
  notes?: string
  durationMinutes: number
  isDone?: boolean
  timerType?: string
  category_id?: number
  category?: { id: number; name: string; color: string; category_type?: string }
  rawSlot?: ScheduleSlot
  rawLog?: TimeLogItem
  rawTask?: Task
}

export const TimeBlockingSchedule: React.FC = () => {
  const { slots, selectedDate, setSelectedDate, fetchSlots, createSlot, toggleSlotDone, deleteSlot } = useScheduleStore()
  const { logs, fetchLogs, createLog, deleteLog } = useTimeLogStore()
  const { startTimer } = useTimerStore()
  const { categories, tasks, fetchTasks, fetchCategories, toggleTaskStatus } = useTaskStore()

  // 1. Primary View Mode Switcher: Timeline vs Blocks (No empty hours)
  const [viewMode, setViewMode] = useState<ViewMode>('blocks')

  // 2. Filter Tab for Blocks View
  const [blockFilter, setBlockFilter] = useState<BlockFilter>('all')

  // 3. Search & Category Filter State (Identical to Tasks page)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryType, setSelectedCategoryType] = useState<string>('all')

  // Create Plan Slot modal state
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [slotTitle, setSlotTitle] = useState('')
  const [slotStart, setSlotStart] = useState('09:00')
  const [slotEnd, setSlotEnd] = useState('10:30')
  const [slotNotes, setSlotNotes] = useState('')
  const [slotCategoryId, setSlotCategoryId] = useState<number | null>(null)

  // Create Manual TimeLog modal state
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [logNotes, setLogNotes] = useState('')
  const [logStart, setLogStart] = useState('09:00')
  const [logEnd, setLogEnd] = useState('10:00')
  const [logType, setLogType] = useState('manual')
  const [logCategoryId, setLogCategoryId] = useState<number | null>(null)

  // Current time marker for live Timeline
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })

  const timelineScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSlots(selectedDate)
    fetchLogs(selectedDate)
    fetchTasks()
    fetchCategories()
  }, [selectedDate])

  // Tasks with deadline on the selected date
  const deadlineTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!t.due_date) return false
      return t.due_date.startsWith(selectedDate)
    })
  }, [tasks, selectedDate])

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

  // 7-day Date Strip: Strictly DAY OF WEEK (MON, TUE, WED...)
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
        category_id: s.category_id,
        category: s.category,
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
        category_id: l.category_id || undefined,
        category: l.category_name ? { id: l.category_id || 0, name: l.category_name, color: l.category_color || '#8B5CF6' } : undefined,
        rawLog: l
      })
    })

    // 3. Add Deadlines for this date
    deadlineTasks.forEach(task => {
      let dueTime = '23:59'
      if (task.due_date && task.due_date.includes('T')) {
        const timePart = task.due_date.split('T')[1]?.slice(0, 5)
        if (timePart && timePart !== '23:59') {
          dueTime = timePart
        }
      }
      list.push({
        type: 'deadline',
        id: task.id,
        startTimeStr: dueTime,
        endTimeStr: dueTime,
        title: task.title,
        notes: task.description,
        durationMinutes: 0,
        isDone: task.status === 'completed',
        category_id: task.category?.id,
        category: task.category,
        rawTask: task
      })
    })

    // Sort chronologically by start time
    return list.sort((a, b) => a.startTimeStr.localeCompare(b.startTimeStr))
  }, [slots, logs, deadlineTasks])

  // Filtered blocks based on blockFilter, searchQuery and selectedCategoryType
  const filteredBlocks = useMemo(() => {
    return combinedBlocks.filter(b => {
      // 1. Type Filter (All / Plan / TimeLog)
      if (blockFilter === 'plan' && b.type !== 'slot') return false
      if (blockFilter === 'timelog' && b.type !== 'log') return false

      // 2. Category Type Filter
      if (selectedCategoryType !== 'all') {
        const catType = b.category?.category_type || 'productive'
        if (catType !== selectedCategoryType) return false
      }

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = b.title.toLowerCase().includes(q)
        const matchNotes = b.notes?.toLowerCase().includes(q)
        const matchCat = b.category?.name.toLowerCase().includes(q)
        if (!matchTitle && !matchNotes && !matchCat) return false
      }

      return true
    })
  }, [combinedBlocks, blockFilter, selectedCategoryType, searchQuery])

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
      category_id: slotCategoryId || undefined,
      notes: slotNotes.trim() || undefined
    })
    sounds.playSuccess()
    setSlotTitle('')
    setSlotNotes('')
    setSlotCategoryId(null)
    setPlanModalOpen(false)
  }

  const handleCreateManualLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logNotes.trim()) return
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
      category_id: logCategoryId || undefined,
      notes: logNotes.trim()
    })
    sounds.playSuccess()
    setLogNotes('')
    setLogCategoryId(null)
    setLogModalOpen(false)
  }

  const handleTimelineHourClick = (hour: number) => {
    sounds.playTap()
    const startStr = `${String(hour).padStart(2, '0')}:00`
    const endStr = `${String(Math.min(23, hour + 1)).padStart(2, '0')}:00`
    setSlotStart(startStr)
    setSlotEnd(endStr)
    setSlotCategoryId(null)
    setPlanModalOpen(true)
  }

  const handleStartSlotFocus = (slot: ScheduleSlot) => {
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

  const handleStartTaskFocus = (task: Task) => {
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

  const isViewingToday = selectedDate === new Date().toISOString().split('T')[0]

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 pb-24">
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
            title="Compact blocks view"
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
              <span className={`text-[9px] font-black uppercase tracking-wider ${isSelected ? 'text-violet-100' : 'text-slate-400'}`}>
                {d.weekdayLabel}
              </span>
              <span className={`text-sm font-black font-mono mt-0.5 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                {d.dayNum}
              </span>
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

      {/* ── 4. Search Bar & Category Filter Bar (Identical to Tasks Page) ── */}
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search blocks, notes, or categories..."
            className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-violet-500 shadow-2xs transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Value Group Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {[
            { key: 'all', label: 'All Values' },
            { key: 'productive', label: '🟢 Productive' },
            { key: 'neutral', label: '🔵 Neutral' },
            { key: 'wasted', label: '🔴 Wasted' },
          ].map(grp => (
            <button
              key={grp.key}
              onClick={() => { sounds.playTap(); setSelectedCategoryType(grp.key) }}
              className={`shrink-0 px-3 py-1 rounded-xl text-[11px] font-bold transition active:scale-95 border ${
                selectedCategoryType === grp.key
                  ? 'bg-violet-600 border-violet-600 text-white shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {grp.label}
            </button>
          ))}
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
                { id: 'all', label: `All (${combinedBlocks.length})` },
                { id: 'plan', label: `Plan (${slots.length})` },
                { id: 'timelog', label: `Time Logs (${logs.length})` },
                { id: 'compare', label: 'Variance' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { sounds.playTap(); setBlockFilter(tab.id as BlockFilter) }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 whitespace-nowrap border ${
                    blockFilter === tab.id
                      ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search notice */}
          {searchQuery && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200 text-xs font-bold text-violet-800">
              <div className="flex items-center gap-1.5 truncate">
                <Search className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                <span className="truncate">"{searchQuery}" ({filteredBlocks.length} results)</span>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="p-0.5 hover:text-violet-950 transition shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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

          {/* Blocks List */}
          {filteredBlocks.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {searchQuery ? 'No matching time blocks found' : 'No time blocks for this date'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto">
                  {searchQuery ? 'Try searching with different keywords.' : 'Plan your time blocks or record actual focus time below.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredBlocks.map(item => {
                // 1. Deadline Task Block
                if (item.type === 'deadline' && item.rawTask) {
                  const task = item.rawTask
                  const isDone = task.status === 'completed'
                  return (
                    <div
                      key={`deadline-card-${task.id}`}
                      className={`rounded-2xl p-3.5 border transition shadow-2xs ${
                        isDone
                          ? 'opacity-65 bg-slate-50 border-slate-200'
                          : 'bg-gradient-to-r from-rose-50/90 to-amber-50/50 border-rose-300 hover:border-rose-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <button
                          onClick={() => { sounds.playTap(); toggleTaskStatus(task.id); if (!isDone) sounds.playSuccess() }}
                          className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition active:scale-90 ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-rose-400 hover:border-rose-600 bg-white'
                          }`}
                          title={isDone ? 'Mark Pending' : 'Mark Completed'}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100/90 px-2 py-0.5 rounded-md border border-rose-200">
                              🚩 Deadline {item.startTimeStr !== '23:59' ? `(${item.startTimeStr})` : ''}
                            </span>
                            {task.category && (
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white shadow-2xs"
                                style={{ backgroundColor: task.category.color }}
                              >
                                {task.category.name}
                              </span>
                            )}
                          </div>
                          <h4 className={`text-xs font-bold mt-1.5 truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">{task.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!isDone && (
                            <button
                              onClick={() => handleStartTaskFocus(task)}
                              className="h-7 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition"
                              title="Focus on Deadline Task"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Focus</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }

                // 2. Planned Slot Block
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
                              📅 Plan
                            </span>
                            {slot.category && (
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white flex items-center gap-1 shadow-2xs"
                                style={{ backgroundColor: slot.category.color }}
                              >
                                {slot.category.name}
                              </span>
                            )}
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
                              className="h-7 px-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition"
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

                // 3. Actual Time Log
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
                          {log.category_name && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white flex items-center gap-1 shadow-2xs"
                              style={{ backgroundColor: log.category_color || '#8B5CF6' }}
                            >
                              {log.category_name}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 mt-1.5 truncate">
                          {item.title}
                        </h4>

                        {item.notes && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">{item.notes}</p>
                        )}
                      </div>

                      <button
                        onClick={() => { sounds.playTap(); deleteLog(log.id) }}
                        className="p-1.5 text-slate-300 hover:text-rose-600 transition active:scale-90"
                        title="Delete Time Log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
      {/* ── VIEW MODE 2: HOURLY TIMELINE WITH RULER ─────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col flex-1 min-h-[500px]">
          {/* Header Legend */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sky-700">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>Plan</span>
              </span>
              <span className="flex items-center gap-1.5 text-violet-700">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                <span>Actual</span>
              </span>
              {deadlineTasks.length > 0 && (
                <span className="flex items-center gap-1.5 text-rose-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>{deadlineTasks.length} Deadline{deadlineTasks.length > 1 ? 's' : ''}</span>
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">Click any hour to plan</span>
          </div>

          {/* Timeline Scroll Area */}
          <div ref={timelineScrollRef} className="flex-1 overflow-y-auto relative p-3 min-h-[400px]">
            <div
              className="relative"
              style={{ height: `${(END_HOUR - START_HOUR + 1) * HOUR_HEIGHT}px` }}
            >
              {/* Hour Grid Lines */}
              {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, idx) => {
                const hour = START_HOUR + idx
                const top = idx * HOUR_HEIGHT
                return (
                  <div
                    key={`hour-${hour}`}
                    onClick={() => handleTimelineHourClick(hour)}
                    className="absolute left-0 right-0 border-t border-slate-100 hover:bg-slate-50/70 transition cursor-pointer flex items-start group"
                    style={{ top: `${top}px`, height: `${HOUR_HEIGHT}px` }}
                  >
                    <span className="text-[11px] font-mono font-bold text-slate-400 -mt-2.5 w-12 shrink-0 group-hover:text-violet-600 transition">
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  </div>
                )
              })}

              {/* Red marker for current time */}
              {isViewingToday && currentTimeMinutes >= START_HOUR * 60 && currentTimeMinutes <= (END_HOUR + 1) * 60 && (
                <div
                  className="absolute left-10 right-0 border-t-2 border-rose-500 z-20 pointer-events-none flex items-center"
                  style={{ top: `${((currentTimeMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT}px` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5" />
                  <span className="text-[9px] font-bold font-mono text-white bg-rose-500 px-1 rounded ml-1">Now</span>
                </div>
              )}

              {/* Render Deadline Strip Markers across the Timeline */}
              {deadlineTasks.map(task => {
                let dueHour = 17 // default standard 5 PM deadline if not specified
                let dueMins = 0
                let dueTime = '17:00'
                if (task.due_date && task.due_date.includes('T')) {
                  const timePart = task.due_date.split('T')[1]?.slice(0, 5)
                  if (timePart && timePart !== '23:59') {
                    const [h, m] = timePart.split(':').map(Number)
                    dueHour = h
                    dueMins = m
                    dueTime = timePart
                  }
                }
                const totalMinutes = dueHour * 60 + dueMins
                const top = Math.max(0, ((totalMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT)
                const isDone = task.status === 'completed'

                return (
                  <div
                    key={`dl-marker-${task.id}`}
                    className="absolute left-12 right-2 z-25 pointer-events-auto flex items-center transition"
                    style={{ top: `${top}px` }}
                  >
                    <div className={`w-full flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl border shadow-xs ${
                      isDone
                        ? 'bg-slate-50/90 border-slate-300 opacity-60'
                        : 'bg-rose-50/95 border-rose-400 text-rose-950 ring-1 ring-rose-400/30'
                    }`}>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                          🚩 Due {dueTime}:
                        </span>
                        <span className={`text-xs font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </span>
                        {task.category && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white shrink-0 hidden sm:inline"
                            style={{ backgroundColor: task.category.color }}
                          >
                            {task.category.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!isDone && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartTaskFocus(task)
                            }}
                            className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center gap-0.5 shadow-2xs active:scale-95 transition"
                            title="Focus on Deadline"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>Focus</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            sounds.playTap()
                            toggleTaskStatus(task.id)
                            if (!isDone) sounds.playSuccess()
                          }}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition active:scale-90 ${
                            isDone ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-rose-300 hover:border-rose-500'
                          }`}
                          title={isDone ? 'Mark task pending' : 'Mark task completed'}
                        >
                          {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Render Planned Slots as Sky Blue Blocks */}
              {slots.map(slot => {
                const startMins = timeToMinutes(slot.start_time)
                const endMins = timeToMinutes(slot.end_time)
                const durMins = Math.max(15, endMins - startMins)

                const top = Math.max(0, ((startMins - START_HOUR * 60) / 60) * HOUR_HEIGHT)
                const height = Math.max(26, (durMins / 60) * HOUR_HEIGHT)

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
                      {slot.category && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: slot.category.color }}
                          />
                          <span className="text-[10px] text-slate-500 font-bold truncate">
                            {slot.category.name}
                          </span>
                        </div>
                      )}
                      {slot.notes && (
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 italic">{slot.notes}</p>
                      )}
                    </div>

                    {/* Quick Actions: Play Focus & Done Checkbox */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!slot.is_done && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStartSlotFocus(slot)
                          }}
                          className="w-6 h-6 rounded-lg bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shrink-0 shadow-2xs active:scale-90 transition"
                          title="Start Focus Timer"
                        >
                          <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          sounds.playTap()
                          toggleSlotDone(slot.id, !slot.is_done)
                          if (!slot.is_done) sounds.playSuccess()
                        }}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition active:scale-90 ${
                          slot.is_done ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-sky-300 hover:border-sky-500'
                        }`}
                        title={slot.is_done ? 'Mark pending' : 'Mark completed'}
                      >
                        {slot.is_done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    </div>
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
                        {log.category_name && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white truncate"
                            style={{ backgroundColor: log.category_color || '#8B5CF6' }}
                          >
                            {log.category_name}
                          </span>
                        )}
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

      {/* ── Fixed Bottom Action Bar for Calendar (Plan vs Actual) ── */}
      <div className="fixed bottom-[calc(60px+var(--safe-bottom))] left-3 right-3 md:left-64 md:right-8 z-20 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-xl shadow-slate-300/40 flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playTap()
              setSlotCategoryId(null)
              setSlotTitle('')
              setSlotNotes('')
              setPlanModalOpen(true)
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black shadow-md shadow-violet-600/20 active:scale-95 transition"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>+ Plan Slot</span>
          </button>
          <button
            onClick={() => {
              sounds.playTap()
              setLogCategoryId(null)
              setLogNotes('')
              setLogModalOpen(true)
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md shadow-slate-900/20 active:scale-95 transition"
          >
            <Clock className="w-4 h-4" />
            <span>+ Log Actual</span>
          </button>
        </div>
      </div>

      {/* ── Modal 1: Add Plan Slot ────── */}
      {planModalOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setPlanModalOpen(false)} />
          <div className="sheet-content max-w-lg mx-auto">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">Plan Time Block</h2>
                <p className="text-[11px] text-slate-500 font-medium">Schedule planned focus hours for today</p>
              </div>
              <button onClick={() => setPlanModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Activity Title *
                </label>
                <input
                  type="text"
                  value={slotTitle}
                  onChange={e => setSlotTitle(e.target.value)}
                  placeholder="e.g. Feature Coding, English Study, Team Sync..."
                  autoFocus
                  required
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              {/* Category Hierarchy Picker */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Category
                </label>
                <select
                  value={slotCategoryId || ''}
                  onChange={e => setSlotCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 focus:bg-white transition"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(c => (
                    <React.Fragment key={c.id}>
                      <option value={c.id}>
                        📁 {c.name} ({c.category_type === 'wasted' ? '🔴 Wasted' : c.category_type === 'neutral' ? '🔵 Neutral' : '🟢 Productive'})
                      </option>
                      {c.subcategories && c.subcategories.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          &nbsp;&nbsp;&nbsp;&nbsp;↳ {sub.name}
                        </option>
                      ))}
                    </React.Fragment>
                  ))}
                </select>
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
                  placeholder="Additional details or deliverables..."
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
                  What did you work on? *
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

              {/* Category Hierarchy Picker */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Category
                </label>
                <select
                  value={logCategoryId || ''}
                  onChange={e => setLogCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 focus:bg-white transition"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(c => (
                    <React.Fragment key={c.id}>
                      <option value={c.id}>
                        📁 {c.name} ({c.category_type === 'wasted' ? '🔴 Wasted' : c.category_type === 'neutral' ? '🔵 Neutral' : '🟢 Productive'})
                      </option>
                      {c.subcategories && c.subcategories.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          &nbsp;&nbsp;&nbsp;&nbsp;↳ {sub.name}
                        </option>
                      ))}
                    </React.Fragment>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Start Time
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
                    End Time
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
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold active:scale-[0.98] transition shadow-md shadow-slate-900/20 mt-2"
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
