import React, { useEffect, useState, useMemo, useRef } from 'react'
import axios from 'axios'
import {
  Calendar as CalendarIcon, Plus, Check, Clock, Trash2, X,
  Sparkles, ArrowRight, Play, CheckCircle2, Flame, BarChart2,
  TrendingUp, AlertCircle, ChevronLeft, ChevronRight, LayoutList,
  Clock3, Search, Tag, Edit3, RotateCcw, Zap, Target, BookOpen,
  Activity, Smile, Coffee, Droplets
} from 'lucide-react'
import { useScheduleStore, type ScheduleSlot } from '../store/useScheduleStore'
import { useTimeLogStore } from '../store/useTimeLogStore'
import { useTimerStore } from '../store/useTimerStore'
import { useTaskStore, type Task } from '../store/useTaskStore'
import { useHabitStore, type Habit } from '../store/useHabitStore'
import { sounds } from '../utils/soundEffects'

type ViewMode = 'timeline' | 'blocks'
type BlockFilter = 'all' | 'plan' | 'habit' | 'deadline'

// Start from 06:00 (6 AM) to 23:00 (11 PM) for high-density daily schedule
const START_HOUR = 6
const END_HOUR = 23
const HOUR_HEIGHT = 64 // pixels per hour block

interface CombinedBlockItem {
  type: 'slot' | 'habit' | 'deadline'
  id: number
  startTimeStr: string
  endTimeStr: string
  title: string
  notes?: string
  durationMinutes: number
  isDone?: boolean
  category_id?: number
  category?: { id: number; name: string; color: string; category_type?: string }
  rawSlot?: ScheduleSlot
  rawHabit?: Habit
  rawTask?: Task
}

interface DraggingState {
  type: 'move' | 'resize'
  slotId: number
  initialY: number
  initialStartMins: number
  initialEndMins: number
  currentStartMins: number
  currentEndMins: number
}

export const TimeBlockingSchedule: React.FC = () => {
  const { slots, selectedDate, setSelectedDate, fetchSlots, createSlot, updateSlot, toggleSlotDone, deleteSlot } = useScheduleStore()
  const { createLog } = useTimeLogStore()
  const { startTimer } = useTimerStore()
  const { categories, tasks, fetchTasks, fetchCategories, toggleTaskStatus } = useTaskStore()
  const { habits, fetchHabits, checkinHabit } = useHabitStore()

  // 1. Primary View Mode Switcher: Timeline vs Blocks
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')

  // 2. Filter Tab for Blocks View
  const [blockFilter, setBlockFilter] = useState<BlockFilter>('all')

  // 3. Search & Category Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [selectedCategoryType, setSelectedCategoryType] = useState<string>('all')

  // 4. Drag and Drop & Resize State for Timeline Slots
  const [draggingSlot, setDraggingSlot] = useState<DraggingState | null>(null)

  // 5. Seeding state for Reset Sample Data
  const [isSeeding, setIsSeeding] = useState(false)

  // 6. Create Plan Slot modal state
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [slotTitle, setSlotTitle] = useState('')
  const [slotStart, setSlotStart] = useState('09:00')
  const [slotEnd, setSlotEnd] = useState('10:30')
  const [slotNotes, setSlotNotes] = useState('')
  const [slotCategoryId, setSlotCategoryId] = useState<number | null>(null)

  // 7. Edit Plan Slot modal state
  const [editPlanModalOpen, setEditPlanModalOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null)
  const [editSlotTitle, setEditSlotTitle] = useState('')
  const [editSlotStart, setEditSlotStart] = useState('09:00')
  const [editSlotEnd, setEditSlotEnd] = useState('10:30')
  const [editSlotNotes, setEditSlotNotes] = useState('')
  const [editSlotCategoryId, setEditSlotCategoryId] = useState<number | null>(null)

  // Current time marker for live Timeline
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })

  const timelineScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSlots(selectedDate)
    fetchTasks()
    fetchCategories()
    fetchHabits()
  }, [selectedDate])

  // Tasks with deadline on the selected date
  const deadlineTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!t.due_date) return false
      return t.due_date.startsWith(selectedDate)
    })
  }, [tasks, selectedDate])

  // Habits active today (daily or matching day of week)
  const todayHabits = useMemo(() => {
    const d = new Date(selectedDate)
    const dayOfWeek = (d.getDay() + 6) % 7 // 0 = Mon, 6 = Sun
    return habits.filter(h => {
      if (h.archived) return false
      if (h.frequency_type === 'daily' || !h.weekly_days || h.weekly_days.length === 0) return true
      return h.weekly_days.includes(dayOfWeek)
    })
  }, [habits, selectedDate])

  // Habits with a reminder time for the timeline
  const habitReminders = useMemo(() => {
    return todayHabits.filter(h => !!h.reminder_time)
  }, [todayHabits])

  // Filtered items for Timeline View based on blockFilter, searchQuery, and selectedCategoryType
  const visibleSlots = useMemo(() => {
    if (blockFilter !== 'all' && blockFilter !== 'plan') return []
    return slots.filter(s => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchTitle = s.title?.toLowerCase().includes(q)
        const matchNotes = s.notes?.toLowerCase().includes(q)
        if (!matchTitle && !matchNotes) return false
      }
      if (selectedCategoryType !== 'all') {
        if (!s.category?.category_type || s.category.category_type !== selectedCategoryType) return false
      }
      return true
    })
  }, [slots, blockFilter, searchQuery, selectedCategoryType])

  const visibleHabits = useMemo(() => {
    if (blockFilter !== 'all' && blockFilter !== 'habit') return []
    return habitReminders.filter(h => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!h.title?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [habitReminders, blockFilter, searchQuery])

  const visibleDeadlines = useMemo(() => {
    if (blockFilter !== 'all' && blockFilter !== 'deadline') return []
    return deadlineTasks.filter(t => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchTitle = t.title?.toLowerCase().includes(q)
        const matchDesc = t.description?.toLowerCase().includes(q)
        if (!matchTitle && !matchDesc) return false
      }
      if (selectedCategoryType !== 'all') {
        if (!t.category?.category_type || t.category.category_type !== selectedCategoryType) return false
      }
      return true
    })
  }, [deadlineTasks, blockFilter, searchQuery, selectedCategoryType])

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

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0
    const [h, m] = timeStr.split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }

  const minutesToTimeStr = (totalMins: number) => {
    const clamped = Math.max(0, Math.min(24 * 60, totalMins))
    const h = Math.floor(clamped / 60)
    const m = clamped % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  // Combined and sorted list of Blocks for Blocks View
  const combinedBlocks = useMemo(() => {
    const list: CombinedBlockItem[] = []

    // 1. Add Planned Slots
    slots.forEach(s => {
      const startMins = timeToMinutes(s.start_time)
      let endMins = timeToMinutes(s.end_time)
      if (endMins <= startMins) {
        endMins = s.end_time === '00:00' ? 24 * 60 : startMins + 30
      }
      const dur = Math.max(15, endMins - startMins)
      const displayEndTime = s.end_time === '00:00' ? '23:59' : s.end_time
      list.push({
        type: 'slot',
        id: s.id,
        startTimeStr: s.start_time,
        endTimeStr: displayEndTime,
        title: s.title,
        notes: s.notes,
        durationMinutes: dur,
        isDone: s.is_done,
        category_id: s.category_id,
        category: s.category,
        rawSlot: s
      })
    })

    // 2. Add Habits with reminder times
    todayHabits.forEach(h => {
      const timeStr = h.reminder_time || '08:00'
      list.push({
        type: 'habit',
        id: h.id,
        startTimeStr: timeStr,
        endTimeStr: timeStr,
        title: h.title,
        notes: h.description,
        durationMinutes: 0,
        isDone: h.today_completed,
        category_id: h.category_id,
        category: h.category,
        rawHabit: h
      })
    })

    // 3. Add Deadlines for this date
    deadlineTasks.forEach(task => {
      let dueTime = '23:59'
      if (task.due_date && task.due_date.includes(' ')) {
        const timePart = task.due_date.split(' ')[1]?.slice(0, 5)
        if (timePart) dueTime = timePart
      } else if (task.due_date && task.due_date.includes('T')) {
        const timePart = task.due_date.split('T')[1]?.slice(0, 5)
        if (timePart) dueTime = timePart
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
  }, [slots, todayHabits, deadlineTasks])

  // Filtered blocks based on blockFilter, searchQuery and selectedCategoryType
  const filteredBlocks = useMemo(() => {
    return combinedBlocks.filter(b => {
      // 1. Type Filter (All / Plan / Habit / Deadline)
      if (blockFilter === 'plan' && b.type !== 'slot') return false
      if (blockFilter === 'habit' && b.type !== 'habit') return false
      if (blockFilter === 'deadline' && b.type !== 'deadline') return false

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

  // Summary Metrics calculations
  const totalPlannedMinutes = useMemo(() => {
    return slots.reduce((acc, s) => {
      const startMins = timeToMinutes(s.start_time)
      let endMins = timeToMinutes(s.end_time)
      if (endMins <= startMins) {
        endMins = s.end_time === '00:00' ? 24 * 60 : startMins + 30
      }
      return acc + Math.max(15, endMins - startMins)
    }, 0)
  }, [slots])

  const totalPlannedHoursFormatted = useMemo(() => {
    const h = Math.floor(totalPlannedMinutes / 60)
    const m = totalPlannedMinutes % 60
    return `${h}h ${m > 0 ? `${m}m` : '00m'}`
  }, [totalPlannedMinutes])

  const completedHabitsCount = useMemo(() => {
    return todayHabits.filter(h => h.today_completed).length
  }, [todayHabits])

  const completedDeadlinesCount = useMemo(() => {
    return deadlineTasks.filter(t => t.status === 'completed').length
  }, [deadlineTasks])

  // Reset & Seed Sample Data
  const handleResetSampleData = async () => {
    if (!window.confirm('Khôi phục và nạp bộ dữ liệu mẫu chuẩn (Kế hoạch, Thói quen, Nhiệm vụ) cho tài khoản này?')) return
    sounds.playTap()
    setIsSeeding(true)
    try {
      await axios.post('/api/v1/user/settings/reset-sample-data')
      await Promise.all([
        fetchSlots(selectedDate),
        fetchTasks(),
        fetchCategories(),
        fetchHabits()
      ])
      sounds.playSuccess()
    } catch (e) {
      console.error('Failed to reset sample data', e)
    } finally {
      setIsSeeding(false)
    }
  }

  // Pointer event handlers for Drag & Move / Resize
  const handleStartMove = (e: React.PointerEvent, slot: ScheduleSlot) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.group\\/resize')) {
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    const startMins = timeToMinutes(slot.start_time)
    let endMins = timeToMinutes(slot.end_time)
    if (endMins <= startMins) {
      endMins = slot.end_time === '00:00' ? 24 * 60 : startMins + 30
    }

    setDraggingSlot({
      type: 'move',
      slotId: slot.id,
      initialY: e.clientY,
      initialStartMins: startMins,
      initialEndMins: endMins,
      currentStartMins: startMins,
      currentEndMins: endMins
    })
  }

  const handleStartResize = (e: React.PointerEvent, slot: ScheduleSlot) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const startMins = timeToMinutes(slot.start_time)
    let endMins = timeToMinutes(slot.end_time)
    if (endMins <= startMins) {
      endMins = slot.end_time === '00:00' ? 24 * 60 : startMins + 30
    }

    setDraggingSlot({
      type: 'resize',
      slotId: slot.id,
      initialY: e.clientY,
      initialStartMins: startMins,
      initialEndMins: endMins,
      currentStartMins: startMins,
      currentEndMins: endMins
    })
  }

  // Global Pointer Events for Drag & Drop / Resize
  useEffect(() => {
    if (!draggingSlot) return

    const handlePointerMove = (e: PointerEvent) => {
      const deltaY = e.clientY - draggingSlot.initialY
      const deltaMins = Math.round((deltaY / HOUR_HEIGHT) * 60)
      const snapInterval = 15

      if (draggingSlot.type === 'move') {
        const dur = draggingSlot.initialEndMins - draggingSlot.initialStartMins
        let newStart = draggingSlot.initialStartMins + deltaMins
        newStart = Math.round(newStart / snapInterval) * snapInterval
        newStart = Math.max(START_HOUR * 60, Math.min(23 * 60 + 45, newStart))
        const newEnd = Math.min(24 * 60, newStart + dur)

        setDraggingSlot(prev => prev ? {
          ...prev,
          currentStartMins: newStart,
          currentEndMins: newEnd
        } : null)
      } else if (draggingSlot.type === 'resize') {
        let newEnd = draggingSlot.initialEndMins + deltaMins
        newEnd = Math.round(newEnd / snapInterval) * snapInterval
        newEnd = Math.max(draggingSlot.currentStartMins + 15, Math.min(24 * 60, newEnd))

        setDraggingSlot(prev => prev ? {
          ...prev,
          currentEndMins: newEnd
        } : null)
      }
    }

    const handlePointerUp = async () => {
      if (!draggingSlot) return
      const { slotId, currentStartMins, currentEndMins, initialStartMins, initialEndMins } = draggingSlot

      if (currentStartMins !== initialStartMins || currentEndMins !== initialEndMins) {
        const startStr = minutesToTimeStr(currentStartMins)
        const endStr = currentEndMins === 24 * 60 ? '23:59' : minutesToTimeStr(currentEndMins)
        sounds.playSuccess()
        await updateSlot(slotId, {
          start_time: startStr,
          end_time: endStr
        })
      }
      setDraggingSlot(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [draggingSlot])

  // Handlers
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slotTitle.trim()) return
    sounds.playTap()

    const [sh, sm] = slotStart.split(':').map(Number)
    const [eh, em] = slotEnd.split(':').map(Number)
    let endStr = slotEnd
    if (eh * 60 + em <= sh * 60 + sm) {
      if (slotEnd === '00:00') {
        endStr = '23:59'
      } else {
        const newEndMin = Math.min(24 * 60, sh * 60 + sm + 30)
        endStr = minutesToTimeStr(newEndMin)
      }
    }

    await createSlot({
      date: selectedDate,
      start_time: slotStart,
      end_time: endStr,
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

  // Open Edit Plan Slot Modal
  const handleOpenEditSlot = (slot: ScheduleSlot) => {
    sounds.playTap()
    setEditingSlot(slot)
    setEditSlotTitle(slot.title)
    setEditSlotStart(slot.start_time)
    setEditSlotEnd(slot.end_time === '00:00' ? '23:59' : slot.end_time)
    setEditSlotNotes(slot.notes || '')
    setEditSlotCategoryId(slot.category_id || null)
    setEditPlanModalOpen(true)
  }

  const handleSaveEditSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSlot || !editSlotTitle.trim()) return
    sounds.playTap()

    const [sh, sm] = editSlotStart.split(':').map(Number)
    const [eh, em] = editSlotEnd.split(':').map(Number)
    let endStr = editSlotEnd
    if (eh * 60 + em <= sh * 60 + sm) {
      if (editSlotEnd === '00:00') {
        endStr = '23:59'
      } else {
        const newEndMin = Math.min(24 * 60, sh * 60 + sm + 30)
        endStr = minutesToTimeStr(newEndMin)
      }
    }

    await updateSlot(editingSlot.id, {
      title: editSlotTitle.trim(),
      start_time: editSlotStart,
      end_time: endStr,
      category_id: editSlotCategoryId || undefined,
      notes: editSlotNotes.trim() || undefined
    })
    sounds.playSuccess()
    setEditPlanModalOpen(false)
    setEditingSlot(null)
  }

  // Convert Plan Slot to Actual Log
  const handleConvertSlotToActual = async (slot: ScheduleSlot) => {
    sounds.playTap()
    if (slot.is_done) {
      await toggleSlotDone(slot.id, false)
      return
    }

    const startMins = timeToMinutes(slot.start_time)
    let endMins = timeToMinutes(slot.end_time)
    if (endMins <= startMins) {
      endMins = slot.end_time === '00:00' ? 24 * 60 : startMins + 30
    }
    const durMins = Math.max(15, endMins - startMins)

    const startIso = `${selectedDate}T${slot.start_time}:00`
    const endIso = `${selectedDate}T${slot.end_time === '00:00' ? '23:59' : slot.end_time}:00`

    // 1. Create Actual Time Log
    await createLog({
      task_id: slot.task_id || undefined,
      habit_id: slot.habit_id || undefined,
      category_id: slot.category_id || undefined,
      start_time: startIso,
      end_time: endIso,
      duration_seconds: durMins * 60,
      timer_type: 'manual',
      notes: slot.title
    })

    // 2. Mark slot as actualized/done
    await toggleSlotDone(slot.id, true)

    // 3. If slot has linked task, mark task completed
    if (slot.task_id) {
      toggleTaskStatus(slot.task_id)
    }

    sounds.playSuccess()
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
    const startMins = timeToMinutes(slot.start_time)
    let endMins = timeToMinutes(slot.end_time)
    if (endMins <= startMins) {
      endMins = slot.end_time === '00:00' ? 24 * 60 : startMins + 30
    }
    const durMins = Math.max(15, endMins - startMins)

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
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden space-y-1.5 pb-1">
      {/* ── 1. COMPACT MASTER HEADER SECTION (Minimal Height, Maximum Timeline Space) ── */}
      <div className="shrink-0 space-y-1.5">
        {/* Row 1: Date Navigator + View Mode Switcher + Action Controls */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          {/* Left: Date Navigator */}
          <div className="flex items-center gap-1 min-w-0">
            <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-slate-200/90 shadow-2xs">
              <button
                onClick={handlePrevDay}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition active:scale-90"
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-1.5 text-xs font-black text-slate-800 font-mono tracking-tight truncate">
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>

              <button
                onClick={handleNextDay}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition active:scale-90"
                title="Next Day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {!isViewingToday && (
              <button
                onClick={handleToday}
                className="px-2 py-1 rounded-xl bg-violet-600 text-white text-[10px] font-black hover:bg-violet-700 transition active:scale-95 shadow-xs shrink-0"
              >
                Today
              </button>
            )}

            {/* Quick Reset Sample Data Button */}
            <button
              onClick={handleResetSampleData}
              disabled={isSeeding}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold transition active:scale-90 shadow-2xs shrink-0"
              title="Reset Sample Data"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin text-violet-600' : ''}`} />
            </button>
          </div>

          {/* Right: View Switcher [ Timeline | Blocks ] & Search Toggle */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center p-0.5 bg-slate-200/80 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
              <button
                onClick={() => { sounds.playTap(); setViewMode('timeline') }}
                className={`px-2 py-1 rounded-lg transition flex items-center gap-1 text-[11px] ${
                  viewMode === 'timeline'
                    ? 'bg-white text-violet-700 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Hourly Timeline View"
              >
                <Clock3 className="w-3 h-3" />
                <span>Timeline</span>
              </button>

              <button
                onClick={() => { sounds.playTap(); setViewMode('blocks') }}
                className={`px-2 py-1 rounded-lg transition flex items-center gap-1 text-[11px] ${
                  viewMode === 'blocks'
                    ? 'bg-white text-violet-700 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Block Cards View"
              >
                <LayoutList className="w-3 h-3" />
                <span>Blocks</span>
              </button>
            </div>

            {/* Search Toggle Icon */}
            <button
              onClick={() => { sounds.playTap(); setIsSearchOpen(prev => !prev) }}
              className={`p-1.5 rounded-xl border transition active:scale-95 ${
                isSearchOpen || searchQuery || selectedCategoryType !== 'all'
                  ? 'bg-violet-50 text-violet-700 border-violet-300 shadow-xs'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
              title="Search & Filters"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Compact 7-Day Strip */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {datePills.map(d => {
            const isSelected = selectedDate === d.iso
            return (
              <button
                key={d.iso}
                onClick={() => { sounds.playTap(); setSelectedDate(d.iso) }}
                className={`shrink-0 flex flex-col items-center justify-center flex-1 min-w-[42px] py-1 rounded-xl border transition active:scale-95 relative ${
                  isSelected
                    ? 'bg-gradient-to-b from-violet-600 to-indigo-600 border-violet-600 text-white shadow-xs scale-[1.02]'
                    : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`text-[8px] font-black uppercase tracking-wider ${isSelected ? 'text-violet-100' : 'text-slate-400'}`}>
                  {d.weekdayLabel}
                </span>
                <span className={`text-xs font-black font-mono mt-0.5 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                  {d.dayNum}
                </span>
                {d.isToday && (
                  <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-amber-300 ring-1 ring-white/50' : 'bg-violet-600'}`} />
                )}
              </button>
            )
          })}
        </div>

        {/* Row 3: Interactive Filter Pill Strip (Tap to Filter Timeline & Blocks) */}
        <div className="grid grid-cols-3 gap-1.5">
          {/* Stat 1: Filter Plan Schedule */}
          <button
            onClick={() => { sounds.playTap(); setBlockFilter(prev => prev === 'plan' ? 'all' : 'plan') }}
            className={`rounded-xl px-2.5 py-1 flex items-center justify-between transition-all active:scale-95 text-left border ${
              blockFilter === 'plan'
                ? 'bg-sky-600 border-sky-600 text-white shadow-sm shadow-sky-600/25 ring-2 ring-sky-300 scale-[1.02]'
                : blockFilter === 'all'
                ? 'bg-sky-50/90 border-sky-200/80 text-sky-950 hover:bg-sky-100/80 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
            title={blockFilter === 'plan' ? 'Showing Plan only. Tap to show all' : 'Filter Plan slots'}
          >
            <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider min-w-0 ${blockFilter === 'plan' ? 'text-white' : 'text-sky-700'}`}>
              <CalendarIcon className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">Plan</span>
            </div>
            <div className={`flex items-center gap-1 font-mono text-[10px] font-black ${blockFilter === 'plan' ? 'text-white' : 'text-sky-950'}`}>
              <span>{totalPlannedHoursFormatted}</span>
              <span className={`text-[9px] ${blockFilter === 'plan' ? 'text-sky-200' : 'text-sky-600'}`}>({slots.filter(s => s.is_done).length}/{slots.length})</span>
            </div>
          </button>

          {/* Stat 2: Filter Daily Habits */}
          <button
            onClick={() => { sounds.playTap(); setBlockFilter(prev => prev === 'habit' ? 'all' : 'habit') }}
            className={`rounded-xl px-2.5 py-1 flex items-center justify-between transition-all active:scale-95 text-left border ${
              blockFilter === 'habit'
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/25 ring-2 ring-emerald-300 scale-[1.02]'
                : blockFilter === 'all'
                ? 'bg-emerald-50/90 border-emerald-200/80 text-emerald-950 hover:bg-emerald-100/80 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
            title={blockFilter === 'habit' ? 'Showing Habits only. Tap to show all' : 'Filter Habits'}
          >
            <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider min-w-0 ${blockFilter === 'habit' ? 'text-white' : 'text-emerald-700'}`}>
              <Zap className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">Habits</span>
            </div>
            <div className={`flex items-center gap-1 font-mono text-[10px] font-black ${blockFilter === 'habit' ? 'text-white' : 'text-emerald-950'}`}>
              <span>{completedHabitsCount}/{todayHabits.length}</span>
              {completedHabitsCount === todayHabits.length && todayHabits.length > 0 && (
                <span className={`text-[9px] font-sans ${blockFilter === 'habit' ? 'text-emerald-200' : 'text-emerald-600'}`}>✓</span>
              )}
            </div>
          </button>

          {/* Stat 3: Filter Deadlines */}
          <button
            onClick={() => { sounds.playTap(); setBlockFilter(prev => prev === 'deadline' ? 'all' : 'deadline') }}
            className={`rounded-xl px-2.5 py-1 flex items-center justify-between transition-all active:scale-95 text-left border ${
              blockFilter === 'deadline'
                ? 'bg-rose-600 border-rose-600 text-white shadow-sm shadow-rose-600/25 ring-2 ring-rose-300 scale-[1.02]'
                : blockFilter === 'all'
                ? 'bg-rose-50/90 border-rose-200/80 text-rose-950 hover:bg-rose-100/80 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
            title={blockFilter === 'deadline' ? 'Showing Deadlines only. Tap to show all' : 'Filter Deadlines'}
          >
            <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider min-w-0 ${blockFilter === 'deadline' ? 'text-white' : 'text-rose-700'}`}>
              <Target className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">Deadlines</span>
            </div>
            <div className={`flex items-center gap-1 font-mono text-[10px] font-black ${blockFilter === 'deadline' ? 'text-white' : 'text-rose-950'}`}>
              <span>{completedDeadlinesCount}/{deadlineTasks.length}</span>
            </div>
          </button>
        </div>

        {/* Collapsible Search & Category Filters */}
        {(isSearchOpen || searchQuery || selectedCategoryType !== 'all') && (
          <div className="space-y-1.5 bg-slate-50 p-2 rounded-2xl border border-slate-200 anim-fade-in">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search schedule, habits, deadlines..."
                className="w-full pl-8 pr-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-violet-500 transition placeholder:text-slate-400 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Value Category Pills Filter */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All' },
                { id: 'productive', label: '🟢 Productive' },
                { id: 'neutral', label: '🔵 Neutral' },
                { id: 'wasted', label: '🔴 Wasted' },
              ].map(pill => (
                <button
                  key={pill.id}
                  onClick={() => { sounds.playTap(); setSelectedCategoryType(pill.id) }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 transition active:scale-95 border ${
                    selectedCategoryType === pill.id
                      ? 'bg-violet-600 text-white border-violet-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 2. BLOCKS VIEW (Compact Flow of Today's Plan, Habits & Deadlines) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'blocks' && (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2 pb-16">
          {/* Blocks List */}
          {filteredBlocks.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {searchQuery ? 'Không tìm thấy mục phù hợp' : 'Chưa có kế hoạch cho ngày này'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto">
                  {searchQuery ? 'Thử tìm kiếm với từ khóa khác.' : 'Lên lịch các khối thời gian hoặc điểm danh thói quen hôm nay.'}
                </p>
              </div>
              <button
                onClick={() => { sounds.playTap(); setPlanModalOpen(true) }}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition active:scale-95 shadow-2xs"
              >
                + Thêm khối kế hoạch
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBlocks.map(item => {
                // 1. Deadline Task Block
                if (item.type === 'deadline' && item.rawTask) {
                  const task = item.rawTask
                  const isDone = task.status === 'completed'
                  return (
                    <div
                      key={`deadline-card-${task.id}`}
                      className={`rounded-2xl p-3 border transition shadow-2xs ${
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
                          title={isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
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
                          <h4 className={`text-xs font-bold mt-1 truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
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
                              title="Bắt đầu tập trung làm nhiệm vụ này"
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

                // 2. Habit Routine Block
                if (item.type === 'habit' && item.rawHabit) {
                  const habit = item.rawHabit
                  const isDone = !!habit.today_completed
                  return (
                    <div
                      key={`habit-card-${habit.id}`}
                      className={`bg-white rounded-2xl p-3 border transition shadow-2xs ${
                        isDone
                          ? 'opacity-75 bg-emerald-50/40 border-emerald-200'
                          : 'border-fuchsia-200 hover:border-fuchsia-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <button
                          onClick={() => {
                            sounds.playTap()
                            checkinHabit(habit.id, { logged_date: selectedDate, completed: !isDone })
                            if (!isDone) sounds.playSuccess()
                          }}
                          className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition active:scale-90 ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                              : 'border-fuchsia-300 hover:border-fuchsia-500 bg-white'
                          }`}
                          title={isDone ? 'Đã điểm danh' : 'Điểm danh thói quen'}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-fuchsia-800 bg-fuchsia-50 px-2 py-0.5 rounded-md border border-fuchsia-200">
                              ⚡ {habit.reminder_time || 'Thói quen'}
                            </span>
                            {habit.target_count && (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                {habit.target_count} {habit.unit}
                              </span>
                            )}
                            {habit.category && (
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white flex items-center gap-1 shadow-2xs"
                                style={{ backgroundColor: habit.category.color }}
                              >
                                {habit.category.name}
                              </span>
                            )}
                          </div>
                          <h4 className={`text-xs font-bold mt-1 truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {habit.title}
                          </h4>
                          {habit.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">{habit.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-lg">
                            🔥 {habit.current_streak || 0}d
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }

                // 3. Planned Slot Block
                if (item.type === 'slot' && item.rawSlot) {
                  const slot = item.rawSlot
                  const isDone = !!slot.is_done
                  return (
                    <div
                      key={`slot-${slot.id}`}
                      className={`bg-white rounded-2xl p-3 border transition shadow-2xs ${
                        isDone
                          ? 'opacity-65 bg-emerald-50/20 border-emerald-200'
                          : 'border-slate-200 hover:border-violet-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Checkbox: Convert to Actual */}
                        <button
                          onClick={() => handleConvertSlotToActual(slot)}
                          className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition active:scale-90 ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                              : 'border-slate-300 hover:border-violet-500 bg-white'
                          }`}
                          title={isDone ? '✓ Đã hoàn thành' : 'Chuyển thành Actual'}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        {/* Content (Click to Edit) */}
                        <div
                          onClick={() => handleOpenEditSlot(slot)}
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                              {slot.start_time} - {item.endTimeStr} ({item.durationMinutes}m)
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
                          <h4 className={`text-xs font-bold mt-1 truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {slot.title}
                          </h4>
                          {slot.notes && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">{slot.notes}</p>
                          )}
                        </div>

                        {/* Actions: Start Focus, Edit & Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          {!isDone && (
                            <button
                              onClick={() => handleStartSlotFocus(slot)}
                              className="h-7 px-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition"
                              title="Bắt đầu tính giờ tập trung"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Focus</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditSlot(slot)}
                            className="p-1.5 text-slate-400 hover:text-violet-600 transition active:scale-90"
                            title="Sửa kế hoạch"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { sounds.playTap(); deleteSlot(slot.id) }}
                            className="p-1.5 text-slate-300 hover:text-rose-600 transition active:scale-90"
                            title="Xóa kế hoạch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
      {/* ── 3. TIMELINE VIEW (Clean Daily Schedule with Habit Reminders & Deadlines) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'timeline' && (
        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Timeline Scroll Container */}
          <div ref={timelineScrollRef} className="flex-1 min-h-0 overflow-y-auto relative">
            <div className="relative" style={{ height: `${(END_HOUR - START_HOUR + 1) * HOUR_HEIGHT}px` }}>
              {/* Hour Grid Lines & Labels */}
              {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
                const hour = START_HOUR + i
                const top = i * HOUR_HEIGHT
                const hourStr = `${String(hour).padStart(2, '0')}:00`

                return (
                  <div
                    key={`hour-${hour}`}
                    onClick={() => handleTimelineHourClick(hour)}
                    className="absolute left-0 right-0 border-t border-slate-100 flex items-start group hover:bg-violet-50/30 cursor-pointer transition"
                    style={{ top: `${top}px`, height: `${HOUR_HEIGHT}px` }}
                  >
                    <div className="w-12 text-right pr-2 pt-0.5 text-[10px] font-mono font-bold text-slate-400 group-hover:text-violet-600 transition select-none">
                      {hourStr}
                    </div>
                  </div>
                )
              })}

              {/* Live Current Time Indicator */}
              {isViewingToday && currentTimeMinutes >= START_HOUR * 60 && currentTimeMinutes <= END_HOUR * 60 + 59 && (
                <div
                  className="absolute left-0 right-0 z-25 pointer-events-none flex items-center"
                  style={{ top: `${((currentTimeMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT}px` }}
                >
                  <div className="w-12 text-right pr-1">
                    <span className="text-[9px] font-mono font-black text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">
                      {minutesToTimeStr(currentTimeMinutes)}
                    </span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-rose-500 shadow-xs ring-2 ring-white shrink-0" />
                  <div className="flex-1 border-t-2 border-rose-500 border-dashed" />
                </div>
              )}

              {/* ── Render Habit Reminders directly on the Timeline ── */}
              {visibleHabits.map(habit => {
                const reminderMins = timeToMinutes(habit.reminder_time || '08:00')
                const top = Math.max(0, ((reminderMins - START_HOUR * 60) / 60) * HOUR_HEIGHT)
                const isDone = !!habit.today_completed

                return (
                  <div
                    key={`habit-rem-${habit.id}`}
                    className={`absolute left-14 right-2 sm:right-3 rounded-xl px-2.5 py-1.5 border flex items-center justify-between gap-2 shadow-2xs transition z-20 backdrop-blur-xs ${
                      isDone
                        ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 opacity-80'
                        : 'bg-fuchsia-50/95 border-fuchsia-300 text-fuchsia-950 hover:border-fuchsia-500'
                    }`}
                    style={{ top: `${top}px`, height: '36px' }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-white border border-fuchsia-200 shrink-0 text-fuchsia-700">
                        ⚡ {habit.reminder_time}
                      </span>
                      <span className={`text-xs font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {habit.title}
                      </span>
                      {habit.target_count && (
                        <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                          ({habit.target_count} {habit.unit})
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        sounds.playTap()
                        checkinHabit(habit.id, { logged_date: selectedDate, completed: !isDone })
                        if (!isDone) sounds.playSuccess()
                      }}
                      className={`h-6 px-2 rounded-lg border text-[10px] font-bold flex items-center gap-1 shrink-0 transition active:scale-90 ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-2xs'
                          : 'bg-white border-fuchsia-300 text-fuchsia-700 hover:bg-fuchsia-100'
                      }`}
                      title={isDone ? 'Habit checked-in' : 'Check-in habit'}
                    >
                      {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : 'Check-in'}
                    </button>
                  </div>
                )
              })}

              {/* ── Render Deadline Tasks on the Timeline ── */}
              {visibleDeadlines.map(task => {
                let dueTime = '23:59'
                if (task.due_date && task.due_date.includes(' ')) {
                  const timePart = task.due_date.split(' ')[1]?.slice(0, 5)
                  if (timePart) dueTime = timePart
                } else if (task.due_date && task.due_date.includes('T')) {
                  const timePart = task.due_date.split('T')[1]?.slice(0, 5)
                  if (timePart) dueTime = timePart
                }
                const dueMins = timeToMinutes(dueTime)
                const top = Math.max(0, ((dueMins - START_HOUR * 60) / 60) * HOUR_HEIGHT)
                const isDone = task.status === 'completed'

                return (
                  <div
                    key={`deadline-line-${task.id}`}
                    className={`absolute left-14 right-2 sm:right-3 rounded-xl px-2.5 py-1.5 border flex items-center justify-between gap-2 shadow-2xs transition z-20 ${
                      isDone
                        ? 'bg-slate-50/90 border-slate-300 opacity-60'
                        : 'bg-rose-50/95 border-rose-300 text-rose-950 hover:border-rose-500'
                    }`}
                    style={{ top: `${top}px`, height: '36px' }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-white border border-rose-200 text-rose-700 shrink-0">
                        🚩 {dueTime !== '23:59' ? dueTime : 'EOD'}
                      </span>
                      <span className={`text-xs font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isDone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStartTaskFocus(task)
                          }}
                          className="h-6 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs active:scale-90 transition"
                          title="Start focus timer"
                        >
                          <Play className="w-2 h-2 fill-current" />
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
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition active:scale-90 ${
                          isDone ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-rose-300 hover:border-rose-500'
                        }`}
                        title={isDone ? 'Mark uncompleted' : 'Mark completed'}
                      >
                        {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* ── Render Planned Slots (Full-Width Canvas with Drag & Resize) ── */}
              {visibleSlots.map(slot => {
                const isBeingDragged = draggingSlot?.slotId === slot.id

                const startMins = timeToMinutes(slot.start_time)
                let endMins = timeToMinutes(slot.end_time)
                if (endMins <= startMins) {
                  endMins = slot.end_time === '00:00' ? 24 * 60 : startMins + 30
                }
                const durMins = Math.max(15, endMins - startMins)

                const activeStart = isBeingDragged ? draggingSlot.currentStartMins : startMins
                const activeEnd = isBeingDragged ? draggingSlot.currentEndMins : endMins
                const activeDur = Math.max(15, activeEnd - activeStart)

                const top = Math.max(0, ((activeStart - START_HOUR * 60) / 60) * HOUR_HEIGHT)
                const height = Math.max(36, (activeDur / 60) * HOUR_HEIGHT)

                const displayStartTime = isBeingDragged ? minutesToTimeStr(activeStart) : slot.start_time
                const displayEndTime = isBeingDragged
                  ? (activeEnd === 24 * 60 ? '23:59' : minutesToTimeStr(activeEnd))
                  : (slot.end_time === '00:00' ? '23:59' : slot.end_time)

                const isCompact = height < 50

                return (
                  <div
                    key={`slot-${slot.id}`}
                    onPointerDown={(e) => handleStartMove(e, slot)}
                    className={`absolute left-14 right-2 sm:right-3 rounded-2xl p-2.5 border transition select-none touch-none cursor-grab active:cursor-grabbing flex flex-col justify-between overflow-hidden ${
                      isBeingDragged
                        ? 'ring-2 ring-violet-500 shadow-2xl z-30 scale-[1.01] bg-sky-100/95 border-sky-400 text-sky-950'
                        : slot.is_done
                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 opacity-80 z-10'
                        : 'bg-sky-50/95 border-sky-300 text-sky-950 hover:border-sky-500 hover:shadow-md z-10'
                    }`}
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    {/* Dynamic Content layout depending on height */}
                    {isCompact ? (
                      <div className="flex items-center justify-between gap-2 w-full h-full min-w-0 pr-0.5">
                        <div
                          onClick={(e) => {
                            if (!isBeingDragged) {
                              e.stopPropagation()
                              handleOpenEditSlot(slot)
                            }
                          }}
                          className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                        >
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-white/90 border border-sky-200 shrink-0 shadow-2xs">
                            {displayStartTime} - {displayEndTime}
                          </span>
                          <span className={`text-xs font-bold truncate ${slot.is_done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {slot.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!slot.is_done && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStartSlotFocus(slot)
                              }}
                              className="w-6 h-6 rounded-lg bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shrink-0 shadow-2xs active:scale-90 transition"
                              title="Bắt đầu bấm giờ"
                            >
                              <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEditSlot(slot)
                            }}
                            className="w-6 h-6 rounded-lg bg-white/80 border border-sky-200 hover:bg-white text-slate-600 flex items-center justify-center shrink-0 shadow-2xs active:scale-90 transition"
                            title="Sửa kế hoạch"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleConvertSlotToActual(slot)
                            }}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition active:scale-90 ${
                              slot.is_done ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-sky-300 hover:border-sky-500'
                            }`}
                            title={slot.is_done ? '✓ Đã hoàn thành' : 'Chuyển thành Actual'}
                          >
                            {slot.is_done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0 flex-1 flex items-start justify-between gap-2">
                          <div
                            onClick={(e) => {
                              if (!isBeingDragged) {
                                e.stopPropagation()
                                handleOpenEditSlot(slot)
                              }
                            }}
                            className="min-w-0 flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-white/90 border border-sky-200 shadow-2xs">
                                {displayStartTime} - {displayEndTime}
                              </span>
                              {slot.is_done && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded">✓ Done</span>
                              )}
                              {isBeingDragged && (
                                <span className="text-[9px] font-bold text-violet-700 bg-violet-100 px-1.5 rounded animate-pulse">
                                  {draggingSlot?.type === 'resize' ? 'Resizing...' : 'Moving...'}
                                </span>
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

                          {/* Quick Actions: Play Focus, Edit & Done Checkbox */}
                          <div className="flex items-center gap-1 shrink-0">
                            {!slot.is_done && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStartSlotFocus(slot)
                                }}
                                className="w-6 h-6 rounded-lg bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shrink-0 shadow-2xs active:scale-90 transition"
                                title="Bắt đầu bấm giờ"
                              >
                                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenEditSlot(slot)
                              }}
                              className="w-6 h-6 rounded-lg bg-white/90 border border-sky-200 hover:bg-white text-slate-600 flex items-center justify-center shrink-0 shadow-2xs active:scale-90 transition"
                              title="Sửa kế hoạch"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleConvertSlotToActual(slot)
                              }}
                              className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition active:scale-90 ${
                                slot.is_done ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-sky-300 hover:border-sky-500'
                              }`}
                              title={slot.is_done ? '✓ Đã hoàn thành' : 'Chuyển thành Actual'}
                            >
                              {slot.is_done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Resize Bottom Handle */}
                    <div
                      onPointerDown={(e) => handleStartResize(e, slot)}
                      className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-center justify-center hover:bg-sky-400/20 group/resize transition rounded-b-2xl z-20"
                      title="Kéo cạnh dưới để thay đổi thời lượng"
                    >
                      <div className="w-8 h-1 rounded-full bg-sky-300 group-hover/resize:bg-sky-600 transition" />
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
                <h2 className="text-sm font-black text-slate-900">Lên lịch Kế hoạch</h2>
                <p className="text-[11px] text-slate-500 font-medium">Khung giờ tập trung cho ngày hôm nay</p>
              </div>
              <button onClick={() => setPlanModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Nội dung kế hoạch *
                </label>
                <input
                  type="text"
                  value={slotTitle}
                  onChange={e => setSlotTitle(e.target.value)}
                  placeholder="Ví dụ: Deep Work Coding, Học tiếng Anh, Họp tuần..."
                  autoFocus
                  required
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              {/* Category Hierarchy Picker */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Danh mục
                </label>
                <select
                  value={slotCategoryId || ''}
                  onChange={e => setSlotCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 focus:bg-white transition"
                >
                  <option value="">-- Chọn danh mục --</option>
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
                    Bắt đầu
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
                    Kết thúc
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
                  Ghi chú (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={slotNotes}
                  onChange={e => setSlotNotes(e.target.value)}
                  placeholder="Mục tiêu cụ thể hoặc tài liệu tham khảo..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold active:scale-[0.98] transition shadow-md shadow-violet-600/20 mt-2"
              >
                Lưu Khối Kế Hoạch
              </button>
            </form>
          </div>
        </>
      )}

      {/* ── Modal 2: Edit Plan Slot ────── */}
      {editPlanModalOpen && editingSlot && (
        <>
          <div className="sheet-backdrop" onClick={() => setEditPlanModalOpen(false)} />
          <div className="sheet-content max-w-lg mx-auto">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">Chỉnh sửa Kế hoạch</h2>
                <p className="text-[11px] text-slate-500 font-medium">Cập nhật hoặc chuyển đổi thành Actual Log</p>
              </div>
              <button onClick={() => setEditPlanModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditSlot} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Nội dung kế hoạch *
                </label>
                <input
                  type="text"
                  value={editSlotTitle}
                  onChange={e => setEditSlotTitle(e.target.value)}
                  placeholder="Ví dụ: Deep Work Coding, Học tiếng Anh..."
                  autoFocus
                  required
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              {/* Category Hierarchy Picker */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Danh mục
                </label>
                <select
                  value={editSlotCategoryId || ''}
                  onChange={e => setEditSlotCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 focus:bg-white transition"
                >
                  <option value="">-- Chọn danh mục --</option>
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
                    Bắt đầu
                  </label>
                  <input
                    type="time"
                    value={editSlotStart}
                    onChange={e => setEditSlotStart(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Kết thúc
                  </label>
                  <input
                    type="time"
                    value={editSlotEnd}
                    onChange={e => setEditSlotEnd(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Ghi chú (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={editSlotNotes}
                  onChange={e => setEditSlotNotes(e.target.value)}
                  placeholder="Ghi chú chi tiết..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              {/* Action Buttons: Convert to Actual, Delete & Save */}
              <div className="pt-2 space-y-2">
                {!editingSlot.is_done && (
                  <button
                    type="button"
                    onClick={() => {
                      handleConvertSlotToActual(editingSlot)
                      setEditPlanModalOpen(false)
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 active:scale-98 transition shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✓ Chuyển thành Actual Time Log</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap()
                      deleteSlot(editingSlot.id)
                      setEditPlanModalOpen(false)
                    }}
                    className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold active:scale-95 transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black active:scale-[0.98] transition shadow-md shadow-violet-600/20"
                  >
                    Lưu Thay Đổi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
