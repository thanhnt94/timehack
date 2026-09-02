import React, { useEffect, useLayoutEffect, useState, useMemo, useRef } from 'react'
import axios from 'axios'
import {
  Calendar as CalendarIcon, Plus, Check, Clock, Trash2, X,
  Sparkles, ArrowRight, Play, CheckCircle2, Flame, BarChart2,
  TrendingUp, AlertCircle, ChevronLeft, ChevronRight, LayoutList,
  Clock3, Search, Tag, Edit3, RotateCcw, Zap, Target, BookOpen,
  Activity, Smile, Coffee, Droplets, Bell
} from 'lucide-react'
import { useScheduleStore, type ScheduleSlot } from '../store/useScheduleStore'
import { useTimeLogStore } from '../store/useTimeLogStore'
import { useTimerStore } from '../store/useTimerStore'
import { useTaskStore, type Task } from '../store/useTaskStore'
import { useHabitStore, type Habit } from '../store/useHabitStore'
import { sounds } from '../utils/soundEffects'

type ViewMode = 'timeline' | 'blocks'
type BlockFilter = 'all' | 'plan' | 'habit' | 'deadline'

// Full 24-hour daily schedule from 00:00 (12 AM) to 23:00 (11 PM)
const START_HOUR = 0
const END_HOUR = 23
const HOUR_HEIGHT = 64 // pixels per hour block
const TIMELINE_HOURS = END_HOUR - START_HOUR + 1

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
  itemType: 'slot' | 'habit' | 'deadline'
  type: 'move' | 'resize'
  itemId: number
  initialY: number
  initialStartMins: number
  initialEndMins: number
  currentStartMins: number
  currentEndMins: number
}

interface TimelineItemPopoverProps {
  type: 'habit' | 'deadline' | 'slot'
  title: string
  timeStr: string
  category?: { name: string; color: string }
  notes?: string
  isDone?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onEdit: () => void
  onPlay: () => void
  onToggleDone: () => void
  onDelete: () => void
}

const TimelineItemPopover: React.FC<TimelineItemPopoverProps> = ({
  type,
  title,
  timeStr,
  category,
  notes,
  isDone,
  onMouseEnter,
  onMouseLeave,
  onEdit,
  onPlay,
  onToggleDone,
  onDelete
}) => {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [placeBelow, setPlaceBelow] = useState(false)
  const [alignRight, setAlignRight] = useState(false)

  useLayoutEffect(() => {
    if (!popoverRef.current) return
    const parent = popoverRef.current.parentElement
    const container = popoverRef.current.closest('.overflow-y-auto')
    if (parent && container) {
      const parentRect = parent.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      // If space above inside the scroll container is less than 135px, flip to place below the card
      if (parentRect.top - containerRect.top < 135) {
        setPlaceBelow(true)
      } else {
        setPlaceBelow(false)
      }
      // If card is placed on the right half of the container, align right to prevent horizontal overflow
      if (parentRect.left - containerRect.left > containerRect.width / 2) {
        setAlignRight(true)
      } else {
        setAlignRight(false)
      }
    }
  }, [])

  return (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`absolute z-50 min-w-[170px] max-w-[240px] bg-white/98 dark:bg-slate-900/98 text-slate-900 dark:text-slate-100 rounded-xl shadow-xl shadow-slate-300/40 dark:shadow-slate-950/70 p-2 border border-slate-200/90 dark:border-slate-700/90 backdrop-blur-md pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-150 text-left cursor-default select-text ${
        placeBelow
          ? 'top-[calc(100%+6px)] before:content-[\'\'] before:absolute before:bottom-full before:left-0 before:right-0 before:h-3 before:bg-transparent'
          : 'bottom-[calc(100%+6px)] after:content-[\'\'] after:absolute after:top-full after:left-0 after:right-0 after:h-3 after:bg-transparent'
      } ${
        alignRight
          ? 'right-0 sm:right-1/2 sm:translate-x-1/2'
          : 'left-0 sm:left-1/2 sm:-translate-x-1/2'
      }`}
    >
      {/* Arrow pointing to card */}
      {placeBelow ? (
        <div
          className={`absolute bottom-full -mb-1 border-4 border-transparent border-b-white dark:border-b-slate-900 pointer-events-none drop-shadow-xs ${
            alignRight ? 'right-6 sm:right-1/2 sm:translate-x-1/2' : 'left-6 sm:left-1/2 sm:-translate-x-1/2'
          }`}
        />
      ) : (
        <div
          className={`absolute top-full -mt-1 border-4 border-transparent border-t-white dark:border-t-slate-900 pointer-events-none drop-shadow-xs ${
            alignRight ? 'right-6 sm:right-1/2 sm:translate-x-1/2' : 'left-6 sm:left-1/2 sm:-translate-x-1/2'
          }`}
        />
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1 flex-wrap">
          <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded ${
            type === 'habit' ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-300/80 dark:bg-emerald-500/20 dark:text-emerald-300' :
            type === 'deadline' ? 'bg-rose-100/90 text-rose-800 border border-rose-300/80 dark:bg-rose-500/20 dark:text-rose-300' :
            'bg-sky-100/90 text-sky-800 border border-sky-300/80 dark:bg-sky-500/20 dark:text-sky-300'
          }`}>
            {type === 'habit' ? '⚡ Habit' : type === 'deadline' ? '🎯 Deadline' : '📅 Plan'}
          </span>
          <span className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400">
            {timeStr}
          </span>
        </div>

        {category && (
          <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-[75px]">
            {category.name}
          </span>
        )}
      </div>

      {/* Full Title */}
      <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight break-words mb-1">
        {title}
      </div>

      {/* Notes / Description */}
      {notes && (
        <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium mb-1 leading-tight break-words line-clamp-2">
          {notes}
        </div>
      )}

      {/* Streamlined Icon-Only Action Buttons Toolbar */}
      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1">
          {/* Edit Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 transition active:scale-90 cursor-pointer shadow-2xs"
            title="Edit"
          >
            <Edit3 className="w-3 h-3 text-violet-600 dark:text-violet-400" />
          </button>

          {/* Play / Focus Timer */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onPlay()
            }}
            className={`w-6 h-6 rounded-lg ${
              type === 'habit' ? 'bg-emerald-600 hover:bg-emerald-700' :
              type === 'deadline' ? 'bg-rose-600 hover:bg-rose-700' :
              'bg-violet-600 hover:bg-violet-700'
            } text-white flex items-center justify-center transition active:scale-90 cursor-pointer shadow-2xs`}
            title="Start focus timer"
          >
            <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
          </button>

          {/* Check / Done */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleDone()
            }}
            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition active:scale-90 cursor-pointer shadow-2xs ${
              isDone
                ? 'bg-emerald-500 border-emerald-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 border-slate-300 hover:border-emerald-500 text-slate-400 hover:text-emerald-600'
            }`}
            title={isDone ? 'Mark incomplete' : 'Mark done'}
          >
            {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <div className="w-2 h-2 rounded-xs border border-slate-400" />}
          </button>
        </div>

        {/* Delete Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="w-6 h-6 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition active:scale-90 cursor-pointer"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

export const TimeBlockingSchedule: React.FC = () => {
  const { slots, selectedDate, setSelectedDate, fetchSlots, createSlot, updateSlot, toggleSlotDone, deleteSlot } = useScheduleStore()
  const { createLog } = useTimeLogStore()
  const { startTimer } = useTimerStore()
  const { categories, tasks, fetchTasks, fetchCategories, toggleTaskStatus, updateTask, deleteTask } = useTaskStore()
  const { habits, fetchHabits, checkinHabit, updateHabit, deleteHabit } = useHabitStore()

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
  const [slotReminderEnabled, setSlotReminderEnabled] = useState(false)
  const [slotRemindBeforeMins, setSlotRemindBeforeMins] = useState(30)

  // 7. Edit Plan Slot modal state
  const [editPlanModalOpen, setEditPlanModalOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null)
  const [editSlotTitle, setEditSlotTitle] = useState('')
  const [editSlotStart, setEditSlotStart] = useState('09:00')
  const [editSlotEnd, setEditSlotEnd] = useState('10:30')
  const [editSlotNotes, setEditSlotNotes] = useState('')
  const [editSlotCategoryId, setEditSlotCategoryId] = useState<number | null>(null)
  const [editSlotReminderEnabled, setEditSlotReminderEnabled] = useState(false)
  const [editSlotRemindBeforeMins, setEditSlotRemindBeforeMins] = useState(30)

  // 8. Hover & Pinned Popover State for Timeline Cards
  const [hoveredPopoverId, setHoveredPopoverId] = useState<string | null>(null)
  const [pinnedPopoverId, setPinnedPopoverId] = useState<string | null>(null)
  const activePopoverId = pinnedPopoverId || hoveredPopoverId
  const popoverLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePopoverMouseEnter = (id: string) => {
    if (draggingSlot) return
    if (popoverLeaveTimerRef.current) {
      clearTimeout(popoverLeaveTimerRef.current)
      popoverLeaveTimerRef.current = null
    }
    setHoveredPopoverId(id)
  }

  const handlePopoverMouseLeave = () => {
    if (draggingSlot) return
    if (popoverLeaveTimerRef.current) {
      clearTimeout(popoverLeaveTimerRef.current)
    }
    popoverLeaveTimerRef.current = setTimeout(() => {
      setHoveredPopoverId(null)
    }, 250)
  }

  // 9. Edit Task / Deadline modal state
  const [editTaskModalOpen, setEditTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskDueDate, setEditTaskDueDate] = useState('')
  const [editTaskDueTime, setEditTaskDueTime] = useState('18:00')
  const [editTaskCategoryId, setEditTaskCategoryId] = useState<number | null>(null)
  const [editTaskPriority, setEditTaskPriority] = useState<string>('medium')
  const [editTaskDescription, setEditTaskDescription] = useState('')

  // 10. Edit Habit modal state
  const [editHabitModalOpen, setEditHabitModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [editHabitTitle, setEditHabitTitle] = useState('')
  const [editHabitReminderTime, setEditHabitReminderTime] = useState('08:00')
  const [editHabitTargetCount, setEditHabitTargetCount] = useState(1)
  const [editHabitUnit, setEditHabitUnit] = useState('times')
  const [editHabitCategoryId, setEditHabitCategoryId] = useState<number | null>(null)

  // Current time marker for live Timeline
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })

  const timelineScrollRef = useRef<HTMLDivElement>(null)

  // Close pinned popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.timeline-card-container')) {
        setPinnedPopoverId(null)
      }
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

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

  // Scroll timeline to start of day (00:00) on load or date switch
  useEffect(() => {
    if (viewMode === 'timeline' && timelineScrollRef.current) {
      timelineScrollRef.current.scrollTo({ top: 0, behavior: 'instant' })
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

  const extractTaskDueTime = (dueDate?: string) => {
    if (!dueDate) return '18:00'
    if (dueDate.includes('T')) {
      const timePart = dueDate.split('T')[1]?.slice(0, 5)
      if (timePart) return timePart
    }
    if (dueDate.includes(' ')) {
      const timePart = dueDate.split(' ')[1]?.slice(0, 5)
      if (timePart) return timePart
    }
    return '18:00'
  }

  // ── Smart Overlap Layout Engine (Google Calendar / Outlook Multi-Column Clustering) ──
  const timelineLayoutMap = useMemo(() => {
    interface RawTimelineItem {
      id: string
      startMins: number
      endMins: number
    }

    const items: RawTimelineItem[] = []

    // 1. Planned Slots
    visibleSlots.forEach(slot => {
      const isBeingDragged = draggingSlot?.itemType === 'slot' && draggingSlot?.itemId === slot.id
      const startMins = isBeingDragged ? draggingSlot.currentStartMins : timeToMinutes(slot.start_time)
      let endMins = isBeingDragged ? draggingSlot.currentEndMins : timeToMinutes(slot.end_time)
      if (endMins <= startMins) {
        endMins = slot.end_time === '00:00' ? 24 * 60 : startMins + 30
      }
      items.push({
        id: `slot-${slot.id}`,
        startMins,
        endMins: Math.max(startMins + 20, endMins)
      })
    })

    // 2. Habits (rendered height ~36px corresponds to ~35 minutes)
    visibleHabits.forEach(habit => {
      const isBeingDragged = draggingSlot?.itemType === 'habit' && draggingSlot?.itemId === habit.id
      const reminderMins = timeToMinutes(habit.reminder_time || '08:00')
      const startMins = isBeingDragged ? draggingSlot.currentStartMins : reminderMins
      items.push({
        id: `habit-${habit.id}`,
        startMins,
        endMins: startMins + 35
      })
    })

    // 3. Deadlines (rendered height ~36px corresponds to ~35 minutes)
    visibleDeadlines.forEach(task => {
      const isBeingDragged = draggingSlot?.itemType === 'deadline' && draggingSlot?.itemId === task.id
      const dueTime = extractTaskDueTime(task.due_date)
      const dueMins = timeToMinutes(dueTime)
      const startMins = isBeingDragged ? draggingSlot.currentStartMins : dueMins
      items.push({
        id: `deadline-${task.id}`,
        startMins,
        endMins: startMins + 35
      })
    })

    // Sort items by startMins ASC, then duration DESC
    items.sort((a, b) => {
      if (a.startMins !== b.startMins) return a.startMins - b.startMins
      return (b.endMins - b.startMins) - (a.endMins - a.startMins)
    })

    // Group items into clusters of overlapping time intervals
    const clusters: RawTimelineItem[][] = []
    let currentCluster: RawTimelineItem[] = []
    let clusterMaxEnd = -1

    for (const item of items) {
      if (currentCluster.length === 0) {
        currentCluster.push(item)
        clusterMaxEnd = item.endMins
      } else if (item.startMins < clusterMaxEnd) {
        currentCluster.push(item)
        clusterMaxEnd = Math.max(clusterMaxEnd, item.endMins)
      } else {
        clusters.push(currentCluster)
        currentCluster = [item]
        clusterMaxEnd = item.endMins
      }
    }
    if (currentCluster.length > 0) {
      clusters.push(currentCluster)
    }

    // Assign greedy column slots inside each cluster
    const layoutMap = new Map<string, { colIndex: number; totalCols: number }>()

    for (const cluster of clusters) {
      const columns: number[] = []
      const assignments: { id: string; colIndex: number }[] = []

      for (const item of cluster) {
        let placedCol = -1
        for (let c = 0; c < columns.length; c++) {
          if (columns[c] <= item.startMins) {
            placedCol = c
            columns[c] = item.endMins
            break
          }
        }
        if (placedCol === -1) {
          placedCol = columns.length
          columns.push(item.endMins)
        }
        assignments.push({ id: item.id, colIndex: placedCol })
      }

      const totalCols = Math.max(1, columns.length)
      for (const assign of assignments) {
        layoutMap.set(assign.id, {
          colIndex: assign.colIndex,
          totalCols
        })
      }
    }

    return layoutMap
  }, [visibleSlots, visibleHabits, visibleDeadlines, draggingSlot])

  const getItemHorizontalStyle = (itemId: string, isBeingDragged: boolean) => {
    const layout = timelineLayoutMap.get(itemId) || { colIndex: 0, totalCols: 1 }
    const { colIndex, totalCols } = layout

    if (totalCols <= 1 || isBeingDragged) {
      return {
        left: '3.5rem',
        right: '0.75rem',
        width: 'auto'
      }
    }

    const gap = 6 // px gap between side-by-side columns
    return {
      left: `calc(3.5rem + (${colIndex} * (100% - 4.25rem) / ${totalCols}) + ${colIndex * gap}px)`,
      width: `calc(((100% - 4.25rem) / ${totalCols}) - ${gap}px)`,
      right: 'auto'
    }
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
      const dueTime = extractTaskDueTime(task.due_date)
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
    if (!window.confirm('Restore and load preset sample data (Schedule, Habits, Tasks) for this account?')) return
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

  // Pointer event handlers for Drag & Move / Resize for Slots, Habits, and Deadlines
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
      itemType: 'slot',
      type: 'move',
      itemId: slot.id,
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
      itemType: 'slot',
      type: 'resize',
      itemId: slot.id,
      initialY: e.clientY,
      initialStartMins: startMins,
      initialEndMins: endMins,
      currentStartMins: startMins,
      currentEndMins: endMins
    })
  }

  const handleStartHabitMove = (e: React.PointerEvent, habit: Habit) => {
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    const reminderMins = timeToMinutes(habit.reminder_time || '08:00')

    setDraggingSlot({
      itemType: 'habit',
      type: 'move',
      itemId: habit.id,
      initialY: e.clientY,
      initialStartMins: reminderMins,
      initialEndMins: reminderMins + 30,
      currentStartMins: reminderMins,
      currentEndMins: reminderMins + 30
    })
  }

  const handleStartDeadlineMove = (e: React.PointerEvent, task: Task) => {
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    const dueTime = extractTaskDueTime(task.due_date)
    const dueMins = timeToMinutes(dueTime)

    setDraggingSlot({
      itemType: 'deadline',
      type: 'move',
      itemId: task.id,
      initialY: e.clientY,
      initialStartMins: dueMins,
      initialEndMins: dueMins + 30,
      currentStartMins: dueMins,
      currentEndMins: dueMins + 30
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
      const { itemType, itemId, currentStartMins, currentEndMins, initialStartMins, initialEndMins } = draggingSlot

      if (currentStartMins !== initialStartMins || currentEndMins !== initialEndMins) {
        const startStr = minutesToTimeStr(currentStartMins)
        const endStr = currentEndMins === 24 * 60 ? '23:59' : minutesToTimeStr(currentEndMins)
        sounds.playSuccess()

        if (itemType === 'slot') {
          await updateSlot(itemId, {
            start_time: startStr,
            end_time: endStr
          })
        } else if (itemType === 'habit') {
          await updateHabit(itemId, {
            reminder_time: startStr
          })
        } else if (itemType === 'deadline') {
          await updateTask(itemId, {
            due_date: `${selectedDate}T${startStr}:00`
          })
        }
      }
      setDraggingSlot(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [draggingSlot, selectedDate])

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
      reminder_enabled: slotReminderEnabled,
      remind_before_mins: slotReminderEnabled ? slotRemindBeforeMins : undefined,
      notes: slotNotes.trim() || undefined
    })
    sounds.playSuccess()
    setSlotTitle('')
    setSlotNotes('')
    setSlotCategoryId(null)
    setSlotReminderEnabled(false)
    setSlotRemindBeforeMins(30)
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
    setEditSlotReminderEnabled(!!slot.reminder_enabled)
    setEditSlotRemindBeforeMins(slot.remind_before_mins || 30)
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
      reminder_enabled: editSlotReminderEnabled,
      remind_before_mins: editSlotReminderEnabled ? editSlotRemindBeforeMins : undefined,
      notes: editSlotNotes.trim() || undefined
    })
    sounds.playSuccess()
    setEditPlanModalOpen(false)
    setEditingSlot(null)
  }

  // Open Edit Task / Deadline Modal
  const handleOpenEditTask = (task: Task) => {
    sounds.playTap()
    setEditingTask(task)
    setEditTaskTitle(task.title)
    setEditTaskDescription(task.description || '')
    setEditTaskCategoryId(task.category_id || null)
    setEditTaskPriority(task.priority || 'medium')
    if (task.due_date) {
      if (task.due_date.includes('T')) {
        const [d, t] = task.due_date.split('T')
        setEditTaskDueDate(d)
        setEditTaskDueTime(t ? t.slice(0, 5) : '18:00')
      } else if (task.due_date.includes(' ')) {
        const [d, t] = task.due_date.split(' ')
        setEditTaskDueDate(d)
        setEditTaskDueTime(t ? t.slice(0, 5) : '18:00')
      } else {
        setEditTaskDueDate(task.due_date)
        setEditTaskDueTime('18:00')
      }
    } else {
      setEditTaskDueDate(selectedDate)
      setEditTaskDueTime('18:00')
    }
    setEditTaskModalOpen(true)
  }

  const handleSaveEditTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTask || !editTaskTitle.trim()) return
    sounds.playSuccess()
    const finalDueDate = editTaskDueDate ? `${editTaskDueDate}T${editTaskDueTime || '18:00'}:00` : undefined
    await updateTask(editingTask.id, {
      title: editTaskTitle.trim(),
      description: editTaskDescription.trim(),
      category_id: editTaskCategoryId || undefined,
      priority: editTaskPriority as any,
      due_date: finalDueDate
    })
    setEditTaskModalOpen(false)
    setEditingTask(null)
  }

  // Open Edit Habit Modal
  const handleOpenEditHabit = (habit: Habit) => {
    sounds.playTap()
    setEditingHabit(habit)
    setEditHabitTitle(habit.title)
    setEditHabitReminderTime(habit.reminder_time || '08:00')
    setEditHabitTargetCount(habit.target_count || 1)
    setEditHabitUnit(habit.unit || 'times')
    setEditHabitCategoryId(habit.category_id || null)
    setEditHabitModalOpen(true)
  }

  const handleSaveEditHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingHabit || !editHabitTitle.trim()) return
    sounds.playSuccess()
    await updateHabit(editingHabit.id, {
      title: editHabitTitle.trim(),
      reminder_time: editHabitReminderTime,
      target_count: editHabitTargetCount,
      unit: editHabitUnit,
      category_id: editHabitCategoryId || undefined
    })
    setEditHabitModalOpen(false)
    setEditingHabit(null)
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

  const handleStartHabitFocus = (habit: Habit) => {
    sounds.playTap()
    startTimer({
      habitId: habit.id,
      title: habit.title,
      categoryId: habit.category?.id,
      categoryName: habit.category?.name,
      categoryColor: habit.category?.color || habit.color,
      durationMinutes: 15
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
                  {searchQuery ? 'No matching items found' : 'No schedule for this day'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto">
                  {searchQuery ? 'Try searching with another keyword.' : 'Schedule time blocks or check in your daily habits.'}
                </p>
              </div>
              <button
                onClick={() => { sounds.playTap(); setPlanModalOpen(true) }}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition active:scale-95 shadow-2xs cursor-pointer"
              >
                + Add Plan Block
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
                          className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition active:scale-90 cursor-pointer ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-rose-400 hover:border-rose-600 bg-white'
                          }`}
                          title={isDone ? 'Mark incomplete' : 'Mark completed'}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100/90 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                              <Target className="w-3 h-3 text-rose-600" />
                              <span>Deadline {item.startTimeStr !== '23:59' ? `(${item.startTimeStr})` : ''}</span>
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
                          <h4 className={`text-xs font-bold mt-1 truncate ${isDone ? 'opacity-75 text-slate-800' : 'text-slate-900'}`}>
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
                              className="h-7 w-7 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shrink-0 shadow-2xs active:scale-95 transition cursor-pointer"
                              title="Start focus timer"
                            >
                              <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
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
                          : 'border-emerald-200/90 hover:border-emerald-400 bg-emerald-50/15'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <button
                          onClick={() => {
                            sounds.playTap()
                            checkinHabit(habit.id, { logged_date: selectedDate, completed: !isDone })
                            if (!isDone) sounds.playSuccess()
                          }}
                          className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition active:scale-90 cursor-pointer ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                              : 'border-emerald-300 hover:border-emerald-500 bg-white'
                          }`}
                          title={isDone ? 'Habit checked-in' : 'Check-in habit'}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              ⚡ {habit.reminder_time || 'Habit'}
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
                          <h4 className={`text-xs font-bold mt-1 truncate ${isDone ? 'opacity-75 text-slate-800' : 'text-slate-900'}`}>
                            {habit.title}
                          </h4>
                          {habit.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">{habit.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleStartHabitFocus(habit)}
                            className="h-7 w-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs active:scale-95 transition cursor-pointer"
                            title="Start timer for this habit"
                          >
                            <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                          </button>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-lg border border-emerald-200/60 font-mono">
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
                          ? 'opacity-75 bg-sky-50/50 border-sky-200'
                          : 'border-slate-200 hover:border-violet-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Checkbox: Convert to Actual */}
                        <button
                          onClick={() => handleConvertSlotToActual(slot)}
                          className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition active:scale-90 cursor-pointer ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                              : 'border-slate-300 hover:border-violet-500 bg-white'
                          }`}
                          title={isDone ? '✓ Completed' : 'Convert to Actual'}
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
                          <h4 className={`text-xs font-bold mt-1 truncate ${isDone ? 'opacity-75 text-slate-800' : 'text-slate-900'}`}>
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
                              className="h-7 w-7 rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shrink-0 shadow-2xs active:scale-95 transition cursor-pointer"
                              title="Start focus timer"
                            >
                              <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditSlot(slot)}
                            className="p-1.5 text-slate-400 hover:text-violet-600 transition active:scale-90 cursor-pointer"
                            title="Edit plan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { sounds.playTap(); deleteSlot(slot.id) }}
                            className="p-1.5 text-slate-300 hover:text-rose-600 transition active:scale-90 cursor-pointer"
                            title="Delete plan"
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
        <div className="card-soft overflow-hidden">
          <div
            ref={timelineScrollRef}
            className="overflow-y-auto max-h-[calc(100vh-210px)] relative scroll-smooth select-none"
          >
            {/* Timeline Canvas Container */}
            <div
              className="relative relative-timeline-container"
              style={{ height: `${TIMELINE_HOURS * HOUR_HEIGHT}px` }}
            >
              {/* Hour Grid Lines & Labels */}
              {Array.from({ length: TIMELINE_HOURS }).map((_, idx) => {
                const hour = START_HOUR + idx
                const timeLabel = `${String(hour).padStart(2, '0')}:00`
                const topPos = idx * HOUR_HEIGHT

                return (
                  <div
                    key={`grid-${hour}`}
                    className="absolute left-0 right-0 flex items-start border-t border-slate-100 group/line"
                    style={{ top: `${topPos}px`, height: `${HOUR_HEIGHT}px` }}
                  >
                    <div className="w-12 text-right pr-2 -mt-2.5 select-none">
                      <span className="text-[10px] font-mono font-bold text-slate-400 group-hover/line:text-violet-600 transition">
                        {timeLabel}
                      </span>
                    </div>
                    <div className="flex-1 h-full border-l border-slate-100/80 relative">
                      {/* Half-hour dashed divider */}
                      <div
                        className="absolute left-0 right-0 border-t border-dashed border-slate-100/60 pointer-events-none"
                        style={{ top: `${HOUR_HEIGHT / 2}px` }}
                      />
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

              {/* ── Render Habit Reminders directly on the Timeline (Draggable to change time) ── */}
              {visibleHabits.map(habit => {
                const isBeingDragged = draggingSlot?.itemType === 'habit' && draggingSlot?.itemId === habit.id
                const reminderMins = timeToMinutes(habit.reminder_time || '08:00')
                const activeStart = isBeingDragged ? draggingSlot.currentStartMins : reminderMins
                const top = Math.max(0, ((activeStart - START_HOUR * 60) / 60) * HOUR_HEIGHT)
                const displayReminderTime = isBeingDragged ? minutesToTimeStr(activeStart) : (habit.reminder_time || '08:00')
                const isDone = !!habit.today_completed
                const layoutStyle = getItemHorizontalStyle(`habit-${habit.id}`, isBeingDragged)
                const isPopoverActive = !isBeingDragged && activePopoverId === `habit-${habit.id}`

                return (
                  <div
                    key={`habit-rem-${habit.id}`}
                    onPointerDown={(e) => handleStartHabitMove(e, habit)}
                    onMouseEnter={() => handlePopoverMouseEnter(`habit-${habit.id}`)}
                    onMouseLeave={handlePopoverMouseLeave}
                    onClick={(e) => {
                      if (!isBeingDragged) {
                        e.stopPropagation()
                        setPinnedPopoverId(pinnedPopoverId === `habit-${habit.id}` ? null : `habit-${habit.id}`)
                      }
                    }}
                    className={`timeline-card-container absolute rounded-xl px-2 py-1.5 border flex items-center justify-between gap-1 shadow-2xs transition select-none touch-none cursor-grab active:cursor-grabbing backdrop-blur-xs ${
                      isBeingDragged
                        ? 'ring-2 ring-emerald-500 shadow-2xl z-40 scale-[1.01] bg-emerald-100/95 border-emerald-400 text-emerald-950'
                        : isPopoverActive
                        ? 'ring-2 ring-emerald-400 bg-emerald-50/95 border-emerald-400 text-emerald-950 shadow-2xl z-50'
                        : isDone
                        ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 opacity-80 z-20'
                        : 'bg-emerald-50/95 border-emerald-300 text-emerald-950 hover:border-emerald-500 z-20'
                    }`}
                    style={{ top: `${top}px`, height: '36px', ...layoutStyle }}
                  >
                    {/* Interactive Floating Popover */}
                    {isPopoverActive && (
                      <TimelineItemPopover
                        type="habit"
                        title={habit.title}
                        timeStr={`⚡ ${displayReminderTime}`}
                        category={habit.category}
                        notes={habit.description || (habit.target_count ? `Target: ${habit.target_count} ${habit.unit}` : undefined)}
                        isDone={isDone}
                        onMouseEnter={() => handlePopoverMouseEnter(`habit-${habit.id}`)}
                        onMouseLeave={handlePopoverMouseLeave}
                        onEdit={() => {
                          setPinnedPopoverId(null)
                          setHoveredPopoverId(null)
                          handleOpenEditHabit(habit)
                        }}
                        onPlay={() => handleStartHabitFocus(habit)}
                        onToggleDone={() => {
                          sounds.playTap()
                          checkinHabit(habit.id, { logged_date: selectedDate, completed: !isDone })
                          if (!isDone) sounds.playSuccess()
                        }}
                        onDelete={() => {
                          sounds.playTap()
                          deleteHabit(habit.id)
                          setPinnedPopoverId(null)
                          setHoveredPopoverId(null)
                        }}
                      />
                    )}

                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="p-1 rounded bg-white border border-emerald-200 shrink-0 text-emerald-700 flex items-center justify-center shadow-2xs">
                        <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600/20" />
                      </span>
                      {isBeingDragged && (
                        <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-white border border-emerald-300 text-emerald-800 shrink-0 shadow-2xs">
                          {displayReminderTime}
                        </span>
                      )}
                      <span className={`text-xs font-bold truncate ${isDone ? 'opacity-70 line-through text-slate-600' : 'text-slate-900'}`}>
                        {habit.title}
                      </span>
                      {habit.target_count && (
                        <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                          ({habit.target_count} {habit.unit})
                        </span>
                      )}
                      {isDone && (
                        <span className="text-[10px] font-black text-emerald-600 shrink-0">✓</span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* ── Render Deadline Tasks on the Timeline (Draggable to change time) ── */}
              {visibleDeadlines.map(task => {
                const dueTime = extractTaskDueTime(task.due_date)
                const dueMins = timeToMinutes(dueTime)
                const isBeingDragged = draggingSlot?.itemType === 'deadline' && draggingSlot?.itemId === task.id
                const activeStart = isBeingDragged ? draggingSlot.currentStartMins : dueMins
                const top = Math.max(0, ((activeStart - START_HOUR * 60) / 60) * HOUR_HEIGHT)
                const displayDueTime = isBeingDragged ? minutesToTimeStr(activeStart) : dueTime
                const isDone = task.status === 'completed'
                const layoutStyle = getItemHorizontalStyle(`deadline-${task.id}`, isBeingDragged)
                const isPopoverActive = !isBeingDragged && activePopoverId === `deadline-${task.id}`

                return (
                  <div
                    key={`deadline-line-${task.id}`}
                    onPointerDown={(e) => handleStartDeadlineMove(e, task)}
                    onMouseEnter={() => handlePopoverMouseEnter(`deadline-${task.id}`)}
                    onMouseLeave={handlePopoverMouseLeave}
                    onClick={(e) => {
                      if (!isBeingDragged) {
                        e.stopPropagation()
                        setPinnedPopoverId(pinnedPopoverId === `deadline-${task.id}` ? null : `deadline-${task.id}`)
                      }
                    }}
                    className={`timeline-card-container absolute rounded-xl px-2 py-1.5 border flex items-center justify-between gap-1 shadow-2xs transition select-none touch-none cursor-grab active:cursor-grabbing z-20 ${
                      isBeingDragged
                        ? 'ring-2 ring-rose-500 shadow-2xl z-40 scale-[1.01] bg-rose-100/95 border-rose-400 text-rose-950'
                        : isPopoverActive
                        ? 'ring-2 ring-rose-400 bg-rose-50/95 border-rose-400 text-rose-950 shadow-2xl z-50'
                        : isDone
                        ? 'bg-rose-50/70 border-rose-200 text-rose-950 opacity-75'
                        : 'bg-rose-50/95 border-rose-300 text-rose-950 hover:border-rose-500'
                    }`}
                    style={{ top: `${top}px`, height: '36px', ...layoutStyle }}
                  >
                    {/* Interactive Floating Popover */}
                    {isPopoverActive && (
                      <TimelineItemPopover
                        type="deadline"
                        title={task.title}
                        timeStr={`🎯 ${displayDueTime}`}
                        category={task.category}
                        notes={task.description}
                        isDone={isDone}
                        onMouseEnter={() => handlePopoverMouseEnter(`deadline-${task.id}`)}
                        onMouseLeave={handlePopoverMouseLeave}
                        onEdit={() => {
                          setPinnedPopoverId(null)
                          setHoveredPopoverId(null)
                          handleOpenEditTask(task)
                        }}
                        onPlay={() => handleStartTaskFocus(task)}
                        onToggleDone={() => {
                          sounds.playTap()
                          toggleTaskStatus(task.id)
                          if (!isDone) sounds.playSuccess()
                        }}
                        onDelete={() => {
                          sounds.playTap()
                          deleteTask(task.id)
                          setPinnedPopoverId(null)
                          setHoveredPopoverId(null)
                        }}
                      />
                    )}

                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="p-1 rounded bg-white border border-rose-200 text-rose-700 shrink-0 flex items-center justify-center shadow-2xs">
                        <Target className="w-3 h-3 text-rose-600" />
                      </span>
                      {isBeingDragged && (
                        <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-white border border-rose-300 text-rose-800 shrink-0 shadow-2xs">
                          {displayDueTime}
                        </span>
                      )}
                      <span className={`text-xs font-bold truncate ${isDone ? 'opacity-70 line-through text-slate-600' : 'text-slate-900'}`}>
                        {task.title}
                      </span>
                      {isDone && (
                        <span className="text-[10px] font-black text-emerald-600 shrink-0">✓</span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* ── Render Planned Slots (Full-Width Canvas with Drag & Resize) ── */}
              {visibleSlots.map(slot => {
                const isBeingDragged = draggingSlot?.itemType === 'slot' && draggingSlot?.itemId === slot.id

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
                const layoutStyle = getItemHorizontalStyle(`slot-${slot.id}`, isBeingDragged)
                const isPopoverActive = !isBeingDragged && activePopoverId === `slot-${slot.id}`

                return (
                  <div
                    key={`slot-${slot.id}`}
                    onPointerDown={(e) => handleStartMove(e, slot)}
                    onMouseEnter={() => handlePopoverMouseEnter(`slot-${slot.id}`)}
                    onMouseLeave={handlePopoverMouseLeave}
                    onClick={(e) => {
                      if (!isBeingDragged) {
                        e.stopPropagation()
                        setPinnedPopoverId(pinnedPopoverId === `slot-${slot.id}` ? null : `slot-${slot.id}`)
                      }
                    }}
                    className={`timeline-card-container absolute rounded-2xl p-2.5 border transition select-none touch-none cursor-grab active:cursor-grabbing flex flex-col justify-between overflow-visible ${
                      isBeingDragged
                        ? 'ring-2 ring-violet-500 shadow-2xl z-40 scale-[1.01] bg-sky-100/95 border-sky-400 text-sky-950'
                        : isPopoverActive
                        ? 'ring-2 ring-sky-400 bg-sky-50/95 border-sky-400 text-sky-950 shadow-2xl z-50'
                        : slot.is_done
                        ? 'bg-sky-50/90 border-sky-300 text-sky-950 opacity-80 z-10'
                        : 'bg-sky-50/95 border-sky-300 text-sky-950 hover:border-sky-500 hover:shadow-md z-10'
                    }`}
                    style={{ top: `${top}px`, height: `${height}px`, ...layoutStyle }}
                  >
                    {/* Interactive Floating Popover */}
                    {isPopoverActive && (
                      <TimelineItemPopover
                        type="slot"
                        title={slot.title}
                        timeStr={`📅 ${displayStartTime} - ${displayEndTime}`}
                        category={slot.category}
                        notes={slot.notes}
                        isDone={slot.is_done}
                        onMouseEnter={() => handlePopoverMouseEnter(`slot-${slot.id}`)}
                        onMouseLeave={handlePopoverMouseLeave}
                        onEdit={() => {
                          setPinnedPopoverId(null)
                          setHoveredPopoverId(null)
                          handleOpenEditSlot(slot)
                        }}
                        onPlay={() => handleStartSlotFocus(slot)}
                        onToggleDone={() => {
                          sounds.playTap()
                          toggleSlotDone(slot.id, !slot.is_done)
                        }}
                        onDelete={() => {
                          sounds.playTap()
                          deleteSlot(slot.id)
                          setPinnedPopoverId(null)
                          setHoveredPopoverId(null)
                        }}
                      />
                    )}
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
                          className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
                        >
                          <span className="p-1 rounded bg-white/90 border border-sky-200 shrink-0 flex items-center justify-center shadow-2xs">
                            <CalendarIcon className="w-3 h-3 text-sky-600" />
                          </span>
                          {isBeingDragged && (
                            <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-white border border-sky-300 text-sky-800 shrink-0 shadow-2xs">
                              {displayStartTime} - {displayEndTime}
                            </span>
                          )}
                          <span className={`text-xs font-bold truncate ${slot.is_done ? 'opacity-70 line-through text-slate-600' : 'text-slate-900'}`}>
                            {slot.title}
                          </span>
                          {slot.is_done && (
                            <span className="text-[10px] font-black text-emerald-600 shrink-0">✓</span>
                          )}
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
                              <span className="p-1 rounded bg-white/90 border border-sky-200 shrink-0 flex items-center justify-center shadow-2xs">
                                <CalendarIcon className="w-3 h-3 text-sky-600" />
                              </span>
                              {isBeingDragged && (
                                <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-white border border-sky-300 text-sky-800 shrink-0 shadow-2xs">
                                  {displayStartTime} - {displayEndTime}
                                </span>
                              )}
                              {slot.is_done && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded">✓ Done</span>
                              )}
                              {slot.reminder_enabled && (
                                <span className="text-[9px] font-bold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded flex items-center gap-0.5" title="Reminder Active">
                                  <Bell className="w-2.5 h-2.5 text-violet-600 fill-violet-600/20" />
                                  <span>{slot.remind_before_mins || 30}m</span>
                                </span>
                              )}
                              {isBeingDragged && (
                                <span className="text-[9px] font-bold text-violet-700 bg-violet-100 px-1.5 rounded animate-pulse">
                                  {draggingSlot?.type === 'resize' ? 'Resizing...' : 'Moving...'}
                                </span>
                              )}
                            </div>
                            <h4 className={`text-xs font-bold mt-1 truncate ${slot.is_done ? 'opacity-70 line-through text-slate-600' : 'text-slate-900'}`}>
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
                        </div>
                      </>
                    )}

                    {/* Resize Bottom Handle */}
                    <div
                      onPointerDown={(e) => handleStartResize(e, slot)}
                      className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-center justify-center hover:bg-sky-400/20 group/resize transition rounded-b-2xl z-20"
                      title="Drag to resize duration"
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
                <h2 className="text-sm font-black text-slate-900">Schedule Plan Block</h2>
                <p className="text-[11px] text-slate-500 font-medium">Focus time window for today</p>
              </div>
              <button onClick={() => setPlanModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Plan Title *
                </label>
                <input
                  type="text"
                  value={slotTitle}
                  onChange={e => setSlotTitle(e.target.value)}
                  placeholder="e.g. Deep Work Coding, English Study, Team Sync..."
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
                  placeholder="Specific goals or reference links..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              {/* Reminder Section */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${slotReminderEnabled ? 'bg-violet-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-500'}`}>
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Focus Session Reminder</div>
                      <div className="text-[10px] text-slate-400">Telegram & In-App Alert</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slotReminderEnabled}
                      onChange={e => { sounds.playTap(); setSlotReminderEnabled(e.target.checked) }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                {slotReminderEnabled && (
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 flex-wrap">
                    {[
                      { mins: 15, label: '⏱️ 15m before' },
                      { mins: 30, label: '⏱️ 30m before' },
                      { mins: 60, label: '⏱️ 1h before' }
                    ].map(opt => (
                      <button
                        key={opt.mins}
                        type="button"
                        onClick={() => { sounds.playTap(); setSlotRemindBeforeMins(opt.mins) }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                          slotRemindBeforeMins === opt.mins
                            ? 'bg-violet-600 border-violet-600 text-white shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold active:scale-[0.98] transition shadow-md shadow-violet-600/20 mt-2 cursor-pointer"
              >
                Save Plan Block
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
                <h2 className="text-sm font-black text-slate-900">Edit Plan Block</h2>
                <p className="text-[11px] text-slate-500 font-medium">Update or convert to Actual Log</p>
              </div>
              <button onClick={() => setEditPlanModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditSlot} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Plan Title *
                </label>
                <input
                  type="text"
                  value={editSlotTitle}
                  onChange={e => setEditSlotTitle(e.target.value)}
                  placeholder="e.g. Deep Work Coding, English Study..."
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
                  value={editSlotCategoryId || ''}
                  onChange={e => setEditSlotCategoryId(e.target.value ? Number(e.target.value) : null)}
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
                    value={editSlotStart}
                    onChange={e => setEditSlotStart(e.target.value)}
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
                    value={editSlotEnd}
                    onChange={e => setEditSlotEnd(e.target.value)}
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
                  value={editSlotNotes}
                  onChange={e => setEditSlotNotes(e.target.value)}
                  placeholder="Additional notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              {/* Edit Reminder Section */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${editSlotReminderEnabled ? 'bg-violet-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-500'}`}>
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Focus Session Reminder</div>
                      <div className="text-[10px] text-slate-400">Telegram & In-App Alert</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editSlotReminderEnabled}
                      onChange={e => { sounds.playTap(); setEditSlotReminderEnabled(e.target.checked) }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                {editSlotReminderEnabled && (
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 flex-wrap">
                    {[
                      { mins: 15, label: '⏱️ 15m before' },
                      { mins: 30, label: '⏱️ 30m before' },
                      { mins: 60, label: '⏱️ 1h before' }
                    ].map(opt => (
                      <button
                        key={opt.mins}
                        type="button"
                        onClick={() => { sounds.playTap(); setEditSlotRemindBeforeMins(opt.mins) }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                          editSlotRemindBeforeMins === opt.mins
                            ? 'bg-violet-600 border-violet-600 text-white shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
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
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 active:scale-98 transition shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✓ Convert to Actual Time Log</span>
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
                    className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black active:scale-[0.98] transition shadow-md shadow-violet-600/20 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── Modal 3: Edit Task / Deadline ────── */}
      {editTaskModalOpen && editingTask && (
        <>
          <div className="sheet-backdrop" onClick={() => setEditTaskModalOpen(false)} />
          <div className="sheet-content max-w-lg mx-auto">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">Edit Task Deadline</h2>
                <p className="text-[11px] text-slate-500 font-medium">Update task details and due time</p>
              </div>
              <button onClick={() => setEditTaskModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditTask} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={editTaskTitle}
                  onChange={e => setEditTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  autoFocus
                  required
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-rose-500 focus:bg-white transition"
                />
              </div>

              {/* Category Picker */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Category
                </label>
                <select
                  value={editTaskCategoryId || ''}
                  onChange={e => setEditTaskCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-rose-500 focus:bg-white transition"
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
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editTaskDueDate}
                    onChange={e => setEditTaskDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-rose-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={editTaskDueTime}
                    onChange={e => setEditTaskDueTime(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-rose-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Description / Notes
                </label>
                <input
                  type="text"
                  value={editTaskDescription}
                  onChange={e => setEditTaskDescription(e.target.value)}
                  placeholder="Task details..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-rose-500 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap()
                    deleteTask(editingTask.id)
                    setEditTaskModalOpen(false)
                  }}
                  className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black active:scale-[0.98] transition shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── Modal 4: Edit Habit ────── */}
      {editHabitModalOpen && editingHabit && (
        <>
          <div className="sheet-backdrop" onClick={() => setEditHabitModalOpen(false)} />
          <div className="sheet-content max-w-lg mx-auto">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">Edit Habit</h2>
                <p className="text-[11px] text-slate-500 font-medium">Update habit schedule and targets</p>
              </div>
              <button onClick={() => setEditHabitModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditHabit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Habit Title *
                </label>
                <input
                  type="text"
                  value={editHabitTitle}
                  onChange={e => setEditHabitTitle(e.target.value)}
                  placeholder="e.g. Read Book, Morning Workout..."
                  autoFocus
                  required
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              {/* Category Picker */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Category
                </label>
                <select
                  value={editHabitCategoryId || ''}
                  onChange={e => setEditHabitCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition"
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
                    Reminder Time
                  </label>
                  <input
                    type="time"
                    value={editHabitReminderTime}
                    onChange={e => setEditHabitReminderTime(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Daily Target
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      value={editHabitTargetCount}
                      onChange={e => setEditHabitTargetCount(Number(e.target.value) || 1)}
                      className="w-16 px-2.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                    />
                    <input
                      type="text"
                      value={editHabitUnit}
                      onChange={e => setEditHabitUnit(e.target.value)}
                      placeholder="unit (e.g. mins, pages)"
                      className="flex-1 px-2.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap()
                    deleteHabit(editingHabit.id)
                    setEditHabitModalOpen(false)
                  }}
                  className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black active:scale-[0.98] transition shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
