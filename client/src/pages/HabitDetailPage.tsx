import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Flame, Trophy, CheckCircle2, Percent, Calendar,
  Clock, Smile, Edit3, Trash2, Snowflake, Play, Plus, X,
  Sparkles, Check, ChevronRight, ChevronLeft, MessageSquare, AlertCircle,
  Shield, Sun, Sunrise, Sunset, Award, Minus, Split
} from 'lucide-react'
import { useHabitStore, type HabitDetail, type HabitLogEntry } from '../store/useHabitStore'
import { useTaskStore } from '../store/useTaskStore'
import { useTimerStore } from '../store/useTimerStore'
import { sounds } from '../utils/soundEffects'
import { renderAppIcon } from '../utils/iconHelper'

const MOODS = [
  { id: 'energized', label: 'Energized', icon: '⚡', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'happy', label: 'Happy', icon: '😊', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'mindful', label: 'Mindful', icon: '🧘', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'productive', label: 'Productive', icon: '🎯', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { id: 'tired', label: 'Tired', icon: '😴', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'neutral', label: 'Normal', icon: '😐', color: 'bg-slate-50 text-slate-600 border-slate-200' },
] as const

const HABIT_COLORS = ['#7C3AED', '#0284C7', '#10B981', '#D97706', '#E11D48', '#6366F1', '#EC4899', '#059669']

const ICONS = ['⚡', '💧', '🏃', '📚', '🧘', '💪', '🎯', '💊', '✍️', '🍏', '💤', '🔥', '🏊', '🚴', '🧹']

const PRESET_UNITS = ['times', 'mins', 'hours', 'pages', 'cups', 'km', 'reps', 'books']

export const HabitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const habitId = Number(id)

  const {
    activeDetail,
    isDetailLoading,
    fetchHabitDetail,
    updateHabit,
    toggleFreezeHabit,
    freezeDay,
    upsertHabitLog,
    deleteHabit
  } = useHabitStore()

  const { categories, fetchCategories } = useTaskStore()
  const { startTimer } = useTimerStore()

  // Edit Habit Sheet State
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null)
  const [editFreq, setEditFreq] = useState<'daily' | 'weekly_days' | 'weekly_target' | 'monthly_target'>('daily')
  const [editTimeOfDay, setEditTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('anytime')
  const [editTargetCount, setEditTargetCount] = useState(1)
  const [editUnit, setEditUnit] = useState('times')
  const [isCustomEditUnit, setIsCustomEditUnit] = useState(false)

  // Secondary OR Goal State
  const [hasSecondaryGoal, setHasSecondaryGoal] = useState(false)
  const [editTargetCountSecondary, setEditTargetCountSecondary] = useState<number | undefined>(15)
  const [editUnitSecondary, setEditUnitSecondary] = useState<string | undefined>('mins')
  const [isCustomSecondaryUnit, setIsCustomSecondaryUnit] = useState(false)

  const [editColor, setEditColor] = useState(HABIT_COLORS[0])
  const [editIcon, setEditIcon] = useState('⚡')
  const [editReminder, setEditReminder] = useState('')

  // Log Edit / Checkin Modal State
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [logDate, setLogDate] = useState('')
  const [logCompletedTime, setLogCompletedTime] = useState('')
  const [logCompleted, setLogCompleted] = useState(true)
  const [logFrozenDay, setLogFrozenDay] = useState(false)
  const [logCount, setLogCount] = useState(1)
  const [logTimeSpent, setLogTimeSpent] = useState(0)
  const [logMood, setLogMood] = useState('energized')
  const [logNotes, setLogNotes] = useState('')

  // Monthly Calendar View Date State
  const [viewDate, setViewDate] = useState(() => new Date())

  useEffect(() => {
    fetchCategories()
    if (habitId && !isNaN(habitId)) {
      fetchHabitDetail(habitId)
    }
  }, [habitId])

  // Populate edit form when activeDetail loads
  useEffect(() => {
    if (activeDetail) {
      setEditTitle(activeDetail.title || '')
      setEditDescription(activeDetail.description || '')
      setEditCategoryId(activeDetail.category_id || null)
      setEditFreq(activeDetail.frequency_type || 'daily')
      setEditTimeOfDay(activeDetail.time_of_day || 'anytime')
      setEditTargetCount(activeDetail.target_count || 1)
      setEditUnit(activeDetail.unit || 'times')
      setIsCustomEditUnit(!PRESET_UNITS.includes(activeDetail.unit || 'times'))

      if (activeDetail.target_count_secondary && activeDetail.unit_secondary) {
        setHasSecondaryGoal(true)
        setEditTargetCountSecondary(activeDetail.target_count_secondary)
        setEditUnitSecondary(activeDetail.unit_secondary)
        setIsCustomSecondaryUnit(!PRESET_UNITS.includes(activeDetail.unit_secondary))
      } else {
        setHasSecondaryGoal(false)
        setEditTargetCountSecondary(15)
        setEditUnitSecondary('mins')
      }

      setEditColor(activeDetail.color || HABIT_COLORS[0])
      setEditIcon(activeDetail.icon || '⚡')
      setEditReminder(activeDetail.reminder_time || '')
    }
  }, [activeDetail])

  if (isDetailLoading || !activeDetail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F8FAFC]">
        <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500">Loading habit analytics...</p>
      </div>
    )
  }

  if (activeDetail.id !== habitId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F8FAFC] text-center">
        <AlertCircle className="w-10 h-10 text-slate-400 mb-2" />
        <h3 className="text-sm font-black text-slate-900">Habit Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">This habit may have been deleted or does not exist.</p>
        <button
          onClick={() => navigate('/habits')}
          className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold shadow-xs active:scale-95 transition"
        >
          Back to Habits
        </button>
      </div>
    )
  }

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim()) return
    sounds.playTap()

    const payload: Partial<HabitDetail> = {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      category_id: editCategoryId || undefined,
      frequency_type: editFreq,
      time_of_day: editTimeOfDay,
      target_count: editTargetCount,
      unit: editUnit.trim() || 'times',
      color: editColor,
      icon: editIcon,
      reminder_time: editReminder || undefined
    }

    if (hasSecondaryGoal && editTargetCountSecondary && editUnitSecondary) {
      payload.target_count_secondary = Math.max(1, Number(editTargetCountSecondary) || 1)
      payload.unit_secondary = editUnitSecondary.trim()
    } else {
      payload.target_count_secondary = undefined
      payload.unit_secondary = undefined
    }

    await updateHabit(habitId, payload)
    sounds.playSuccess()
    setEditSheetOpen(false)
  }

  const handleOpenLogModal = (existingDate?: string) => {
    sounds.playTap()
    const targetD = existingDate || new Date().toISOString().split('T')[0]
    const logsList = activeDetail.logs || []
    const existingLog = logsList.find(l => l.logged_date === targetD)

    setLogDate(targetD)
    setLogCompletedTime(existingLog?.completed_time || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }))
    setLogCompleted(existingLog ? existingLog.completed : true)
    setLogFrozenDay(existingLog ? existingLog.is_frozen_day : false)
    setLogCount(existingLog?.count || (activeDetail.unit === 'mins' ? activeDetail.target_count : 1))
    setLogTimeSpent(existingLog?.time_spent || 0)
    setLogMood(existingLog?.mood || 'energized')
    setLogNotes(existingLog?.notes || '')
    setLogModalOpen(true)
  }

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault()
    sounds.playTap()
    await upsertHabitLog(habitId, {
      logged_date: logDate,
      completed_time: logCompletedTime,
      completed: logCompleted,
      is_frozen_day: logFrozenDay,
      time_spent: Number(logTimeSpent) || 0,
      count: Number(logCount) || 1,
      mood: logMood,
      notes: logNotes.trim() || undefined
    })
    sounds.playSuccess()
    setLogModalOpen(false)
  }

  const handleStartFocus = () => {
    sounds.playTap()
    let duration = 25
    if (activeDetail.unit === 'mins' || activeDetail.unit === 'minutes' || activeDetail.unit === 'phút') {
      duration = activeDetail.target_count
    } else if (activeDetail.unit_secondary === 'mins' || activeDetail.unit_secondary === 'minutes' || activeDetail.unit_secondary === 'phút') {
      duration = activeDetail.target_count_secondary || 25
    }

    startTimer({
      habitId: activeDetail.id,
      title: `Habit: ${activeDetail.title}`,
      durationMinutes: duration
    })
    navigate('/')
  }

  const handleToggleFreeze = async () => {
    sounds.playTap()
    await toggleFreezeHabit(habitId)
    sounds.playSuccess()
  }

  const handleApplyShieldToday = async () => {
    sounds.playTap()
    await freezeDay(habitId)
    sounds.playSuccess()
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this habit?')) return
    sounds.playTap()
    await deleteHabit(habitId, true)
    navigate('/habits')
  }

  const getMoodMeta = (moodKey?: string) => {
    return MOODS.find(m => m.id === moodKey) || MOODS[0]
  }

  const getRankBadge = (rank?: string) => {
    switch (rank) {
      case 'S':
        return { label: '👑 Mastered', color: 'bg-amber-100 text-amber-900 border-amber-300 font-black' }
      case 'A':
        return { label: '💎 Consistent', color: 'bg-violet-100 text-violet-800 border-violet-300 font-bold' }
      case 'B':
        return { label: '⚡ Building', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' }
      default:
        return { label: '🌱 Starting', color: 'bg-slate-100 text-slate-600 border-slate-200' }
    }
  }

  const rankMeta = getRankBadge(activeDetail.mastery_rank)
  const heatmapList = activeDetail.heatmap || []
  const logsList = activeDetail.logs || []

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* ── Top Fixed Navigation Bar ── */}
      <div className="shrink-0 bg-white border-b border-slate-200/80 px-4 py-2.5 z-10 shadow-2xs">
        <div className="max-w-lg md:max-w-5xl mx-auto flex items-center justify-between gap-2">
          {/* Back Button & Habit Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => { sounds.playTap(); navigate('/habits') }}
              className="p-1.5 -ml-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95 shrink-0"
              title="Back to Habits"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 shadow-2xs"
                style={{ backgroundColor: `${activeDetail.color || '#7C3AED'}15`, border: `1px solid ${activeDetail.color || '#7C3AED'}40` }}
              >
                {renderAppIcon(activeDetail.icon, 'w-4 h-4 text-violet-700')}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-sm font-black text-slate-900 truncate">
                    {activeDetail.title}
                  </h1>
                  {activeDetail.category && (
                    <span
                      className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: activeDetail.category.color }}
                    >
                      {activeDetail.category.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>{activeDetail.time_of_day !== 'anytime' ? activeDetail.time_of_day : 'anytime'}</span>
                  <span>•</span>
                  <span>
                    {activeDetail.target_count} {activeDetail.unit}
                    {activeDetail.target_count_secondary ? ` OR ${activeDetail.target_count_secondary} ${activeDetail.unit_secondary}` : ''}
                  </span>
                  {activeDetail.archived && (
                    <span className="px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-black">
                      ❄️ Frozen
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top Actions: Pomodoro Focus, Shield, Edit & Delete */}
          <div className="flex items-center gap-1 shrink-0">
            {/* 1-Tap Pomodoro Focus */}
            <button
              onClick={handleStartFocus}
              className="px-2.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs shadow-violet-600/20 active:scale-95 transition"
              title="Start Focus Session"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Focus</span>
            </button>

            <button
              onClick={handleToggleFreeze}
              className={`p-2 rounded-xl border text-xs font-bold transition active:scale-95 ${
                activeDetail.archived
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title={activeDetail.archived ? 'Unfreeze Habit' : 'Freeze Habit'}
            >
              <Snowflake className="w-4 h-4" />
            </button>

            <button
              onClick={() => { sounds.playTap(); setEditSheetOpen(true) }}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition active:scale-95"
              title="Edit Habit"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={handleDelete}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95"
              title="Delete Habit"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable Detail Content Area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <div className="max-w-lg md:max-w-5xl mx-auto space-y-4 pb-6">

          {/* 1. Mastery Rank & Habit Strength Hero Banner */}
          <div className="bg-gradient-to-r from-violet-900 to-indigo-900 rounded-3xl p-4 text-white shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-inner shrink-0">
                {activeDetail.mastery_rank === 'S' ? '👑' : activeDetail.mastery_rank === 'A' ? '💎' : activeDetail.mastery_rank === 'B' ? '⚡' : '🌱'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${rankMeta.color}`}>
                    {rankMeta.label}
                  </span>
                  <span className="text-xs text-violet-200 font-mono font-bold">
                    {activeDetail.strength_percent}% Resilience
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-black mt-1">
                  30-Day Habit Strength Score
                </h2>
              </div>
            </div>

            {/* Quick Streak Shield Button */}
            <button
              onClick={handleApplyShieldToday}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition shrink-0"
              title="Protect streak with freeze shield"
            >
              <Shield className="w-3.5 h-3.5 text-blue-300" />
              <span>Shield ({activeDetail.streak_freeze_count || 0})</span>
            </button>
          </div>

          {/* 2. Hero KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Current Streak */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Streak</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-900 font-mono">{activeDetail.current_streak}</span>
                <span className="text-xs text-slate-400 ml-1 font-bold">{activeDetail.streak_unit || 'days'}</span>
              </div>
            </div>

            {/* Best Streak */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Streak</span>
                <Trophy className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-900 font-mono">{activeDetail.longest_streak}</span>
                <span className="text-xs text-slate-400 ml-1 font-bold">{activeDetail.streak_unit || 'days'}</span>
              </div>
            </div>

            {/* Total Completions */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Done</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-900 font-mono">{activeDetail.total_completions}</span>
                <span className="text-xs text-slate-400 ml-1 font-bold">times</span>
              </div>
            </div>

            {/* Focus Minutes */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Focus Time</span>
                <Clock className="w-4 h-4 text-violet-500" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-900 font-mono">{activeDetail.total_time_spent || 0}</span>
                <span className="text-xs text-slate-400 ml-1 font-bold">mins</span>
              </div>
            </div>
          </div>

          {/* 3. Monthly Calendar Matrix (Calendar Book Style) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3.5">
            {/* Calendar Header with Navigation */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap()
                      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
                    }}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-90 shadow-2xs"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-2 text-xs font-black text-slate-900 font-mono">
                    {viewDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap()
                      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
                    }}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-90 shadow-2xs"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Return to Current Month button if navigated away */}
                {(viewDate.getMonth() !== new Date().getMonth() || viewDate.getFullYear() !== new Date().getFullYear()) && (
                  <button
                    type="button"
                    onClick={() => { sounds.playTap(); setViewDate(new Date()) }}
                    className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-slate-200 transition"
                  >
                    Today
                  </button>
                )}
              </div>

              <button
                onClick={() => handleOpenLogModal()}
                className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs active:scale-95 transition flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Log Today</span>
              </button>
            </div>

            {/* Days of the Week Header (Mon - Sun) */}
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                <div key={idx} className="text-[10px] font-black uppercase text-slate-400 py-0.5 tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Square Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {(() => {
                const year = viewDate.getFullYear()
                const month = viewDate.getMonth()
                // Monday = 0, Sunday = 6
                const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7
                const totalDaysInMonth = new Date(year, month + 1, 0).getDate()
                const todayStr = new Date().toISOString().split('T')[0]

                const leadingBlanks = Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`blank-${i}`} className="aspect-square rounded-xl bg-slate-50/40 border border-dashed border-slate-100" />
                ))

                const monthDays = Array.from({ length: totalDaysInMonth }).map((_, i) => {
                  const dayNum = i + 1
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                  const isToday = dateStr === todayStr
                  const isFuture = dateStr > todayStr

                  const log = logsList.find(l => l.logged_date === dateStr)
                  const isCompleted = log?.completed || false
                  const isFrozen = log?.is_frozen_day || false

                  return (
                    <button
                      key={dayNum}
                      disabled={isFuture}
                      onClick={() => handleOpenLogModal(dateStr)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-between p-1 sm:p-1.5 transition active:scale-90 border relative ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-2xs'
                          : isFrozen
                          ? 'bg-blue-500 border-blue-600 text-white shadow-2xs'
                          : isToday
                          ? 'bg-violet-50 border-2 border-violet-500 text-violet-700 ring-2 ring-violet-200'
                          : isFuture
                          ? 'bg-slate-50/30 border-slate-100 text-slate-300 opacity-40 cursor-default'
                          : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                      title={`${dateStr}: ${isCompleted ? 'Completed' : isFrozen ? 'Shield Protected' : isFuture ? 'Future' : 'Not completed'}`}
                    >
                      {/* Top: Day Number */}
                      <span className={`text-[10px] sm:text-[11px] font-black leading-none self-start ${
                        isCompleted || isFrozen ? 'text-white/95' : isToday ? 'text-violet-700' : 'text-slate-500'
                      }`}>
                        {dayNum}
                      </span>

                      {/* Center: Completion Check / Mood / Shield */}
                      <div className="flex-1 flex items-center justify-center">
                        {isCompleted ? (
                          <span className="text-xs sm:text-sm">{log?.mood ? getMoodMeta(log.mood).icon : '✓'}</span>
                        ) : isFrozen ? (
                          <span className="text-xs sm:text-sm">🛡️</span>
                        ) : isToday ? (
                          <span className="text-[10px] text-violet-400 font-bold">•</span>
                        ) : null}
                      </div>

                      {/* Bottom: Focus Minutes Badge */}
                      {log && log.time_spent > 0 ? (
                        <span className={`text-[8px] sm:text-[9px] font-mono leading-none ${isCompleted ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {log.time_spent}m
                        </span>
                      ) : (
                        <span className="h-1.5" />
                      )}
                    </button>
                  )
                })

                return [...leadingBlanks, ...monthDays]
              })()}
            </div>
          </div>

          {/* 4. Daily Log & Emotion History List */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Completion & Reflection Logs</h3>
                <p className="text-[10px] text-slate-400 font-medium">History of check-in timestamps, focus minutes, and notes</p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                {logsList.length} entries
              </span>
            </div>

            {logsList.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold">No reflection logs yet</p>
                <p className="text-[10px] mt-0.5">Check in daily to track timestamps, reflections, and moods!</p>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {logsList.map(log => {
                  const moodMeta = getMoodMeta(log.mood)
                  const dateFormatted = new Date(log.logged_date).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                  })

                  return (
                    <div
                      key={log.id}
                      onClick={() => handleOpenLogModal(log.logged_date)}
                      className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-violet-300 transition cursor-pointer flex items-start justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* Check Status */}
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          log.completed
                            ? 'bg-emerald-500 text-white'
                            : log.is_frozen_day
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}>
                          {log.completed ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : log.is_frozen_day ? (
                            <Shield className="w-3.5 h-3.5" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                        </div>

                        {/* Info & Notes */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">{dateFormatted}</span>
                            {log.completed_time && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                <span>{log.completed_time}</span>
                              </span>
                            )}
                            {log.time_spent > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-violet-700 font-mono bg-violet-50 px-1.5 py-0.2 rounded border border-violet-200 font-bold">
                                <span>⏱️ {log.time_spent}m</span>
                              </span>
                            )}
                            {log.is_frozen_day && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-bold">
                                <span>🛡️ Shield</span>
                              </span>
                            )}
                            {log.mood && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${moodMeta.color}`}>
                                <span>{moodMeta.icon}</span>
                                <span>{moodMeta.label}</span>
                              </span>
                            )}
                          </div>

                          {log.notes && (
                            <p className="text-xs text-slate-600 mt-1 italic line-clamp-2 bg-white/70 p-1.5 rounded-lg border border-slate-100">
                              "{log.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenLogModal(log.logged_date) }}
                        className="p-1 rounded-lg text-slate-400 group-hover:text-violet-600 transition shrink-0"
                        title="Edit Log"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal 1: Edit / Backfill Daily Log & Reflection ── */}
      {logModalOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setLogModalOpen(false)} />
          <div className="sheet-content max-w-lg mx-auto">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900">Habit Log & Reflection</h2>
                <p className="text-[11px] text-slate-500 font-medium">Log completion timestamps, focus minutes, and notes</p>
              </div>
              <button onClick={() => setLogModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-3.5">
              {/* Date & Completion Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Log Date
                  </label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={e => setLogDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Completed Time
                  </label>
                  <input
                    type="time"
                    value={logCompletedTime}
                    onChange={e => setLogCompletedTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Status Toggle & Shield */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Completion Status
                  </label>
                  <button
                    type="button"
                    onClick={() => { setLogCompleted(!logCompleted); if (!logCompleted) setLogFrozenDay(false) }}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      logCompleted
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{logCompleted ? 'Completed' : 'Not Completed'}</span>
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Streak Shield
                  </label>
                  <button
                    type="button"
                    onClick={() => { setLogFrozenDay(!logFrozenDay); if (!logFrozenDay) setLogCompleted(false) }}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      logFrozenDay
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>{logFrozenDay ? 'Shield Active 🛡️' : 'No Shield'}</span>
                  </button>
                </div>
              </div>

              {/* Quantity / Units & Time Spent */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Quantity ({activeDetail.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={logCount}
                    onChange={e => setLogCount(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Focus Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={logTimeSpent}
                    onChange={e => setLogTimeSpent(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Mood Selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  How did it feel today? (Mood / Emotion)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {MOODS.map(m => {
                    const isSelected = logMood === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setLogMood(m.id)}
                        className={`p-2 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 ${
                          isSelected
                            ? `${m.color} ring-2 ring-violet-500`
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm">{m.icon}</span>
                        <span>{m.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Daily Reflection / Notes
                </label>
                <textarea
                  rows={2}
                  value={logNotes}
                  onChange={e => setLogNotes(e.target.value)}
                  placeholder="e.g. Completed 30m reading with deep focus..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs active:scale-[0.98] transition shadow-md shadow-violet-600/20"
              >
                Save Log
              </button>
            </form>
          </div>
        </>
      )}

      {/* ── Modal 2: Edit Habit Settings Sheet ── */}
      {editSheetOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setEditSheetOpen(false)} />
          <div className="sheet-content max-w-lg mx-auto">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900">Edit Habit Settings</h2>
                <p className="text-[11px] text-slate-500 font-medium">Update frequency, dual goals, and color badge</p>
              </div>
              <button onClick={() => setEditSheetOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHabit} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Habit Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Description / Intention
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="e.g. Read 20 pages before going to sleep"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              {/* Frequency & Primary Target & Dual OR Goal */}
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Frequency
                    </label>
                    <select
                      value={editFreq}
                      onChange={e => setEditFreq(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 transition"
                    >
                      <option value="daily">📅 Daily (Every day)</option>
                      <option value="weekly_target">🗓️ Weekly Target</option>
                      <option value="monthly_target">📆 Monthly Target</option>
                      <option value="weekly_days">Specific Days / Week</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Primary Target
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editTargetCount}
                      onChange={e => setEditTargetCount(Number(e.target.value) || 1)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 transition text-center"
                    />
                  </div>
                </div>

                {/* Primary Unit Selector & Custom Write-in */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Unit ({editTargetCount} {editUnit})
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomEditUnit(!isCustomEditUnit)}
                      className="text-[10px] font-bold text-violet-600 hover:text-violet-800"
                    >
                      {isCustomEditUnit ? '← Preset units' : '+ Custom unit'}
                    </button>
                  </div>

                  {isCustomEditUnit ? (
                    <input
                      type="text"
                      value={editUnit}
                      onChange={e => setEditUnit(e.target.value)}
                      placeholder="e.g. ml, pushups, chapters, words..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-violet-300 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 transition"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PRESET_UNITS.map(u => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => { sounds.playTap(); setEditUnit(u) }}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition ${
                            editUnit === u
                              ? 'bg-violet-600 text-white shadow-2xs'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Secondary "OR" Goal Toggle & Setup */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Split className="w-3.5 h-3.5 text-violet-600" />
                      <span className="text-[11px] font-bold text-slate-800">Either / OR Goal</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { sounds.playTap(); setHasSecondaryGoal(!hasSecondaryGoal) }}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition border ${
                        hasSecondaryGoal
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {hasSecondaryGoal ? '✓ Enabled' : '+ Add OR Goal'}
                    </button>
                  </div>

                  {hasSecondaryGoal && (
                    <div className="mt-2.5 space-y-2 p-2.5 bg-violet-50/60 rounded-xl border border-violet-200 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-violet-700 bg-violet-200 px-1.5 py-0.5 rounded">
                          OR
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={editTargetCountSecondary || 15}
                          onChange={e => setEditTargetCountSecondary(Number(e.target.value) || 1)}
                          className="w-16 px-2.5 py-1.5 rounded-xl bg-white border border-violet-300 text-xs font-bold text-slate-900 text-center outline-none focus:border-violet-500"
                        />
                        <div className="flex-1">
                          {isCustomSecondaryUnit ? (
                            <input
                              type="text"
                              value={editUnitSecondary || ''}
                              onChange={e => setEditUnitSecondary(e.target.value)}
                              placeholder="unit (e.g. mins, pages)"
                              className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-violet-300 text-xs font-bold text-slate-900 outline-none"
                            />
                          ) : (
                            <select
                              value={editUnitSecondary || 'mins'}
                              onChange={e => {
                                if (e.target.value === '__custom__') {
                                  setIsCustomSecondaryUnit(true)
                                  setEditUnitSecondary('')
                                } else {
                                  setEditUnitSecondary(e.target.value)
                                }
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-violet-300 text-xs font-bold text-slate-900 outline-none"
                            >
                              <option value="mins">mins (Focus)</option>
                              <option value="pages">pages</option>
                              <option value="times">times</option>
                              <option value="km">km</option>
                              <option value="cups">cups</option>
                              <option value="__custom__">+ Custom unit...</option>
                            </select>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-violet-800 font-medium">
                        💡 Either <b>{editTargetCount} {editUnit}</b> OR <b>{editTargetCountSecondary} {editUnitSecondary}</b> will complete the habit!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Time of Day Routine */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Routine (Time of Day)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'morning', label: '🌅 Morning' },
                    { id: 'afternoon', label: '☀️ Afternoon' },
                    { id: 'evening', label: '🌙 Evening' },
                    { id: 'anytime', label: '⚡ Anytime' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setEditTimeOfDay(t.id as any)}
                      className={`py-2 px-1 text-center rounded-xl border text-[11px] font-bold transition ${
                        editTimeOfDay === t.id
                          ? 'bg-violet-50 border-violet-400 text-violet-800 ring-2 ring-violet-500'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Category (Shared System)
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <button
                    type="button"
                    onClick={() => { sounds.playTap(); setEditCategoryId(null) }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition border ${
                      editCategoryId === null
                        ? 'bg-violet-600 text-white border-violet-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    None
                  </button>
                  {(categories || []).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { sounds.playTap(); setEditCategoryId(c.id) }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition border flex items-center gap-1.5 ${
                        editCategoryId === c.id
                          ? 'text-white border-transparent shadow-xs ring-2 ring-violet-400'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                      style={editCategoryId === c.id ? { backgroundColor: c.color } : {}}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Row */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Icon
                </label>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {ICONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => { sounds.playTap(); setEditIcon(ic) }}
                      className={`w-9 h-9 rounded-xl text-base flex items-center justify-center transition shrink-0 ${
                        editIcon === ic ? 'bg-violet-100 border-2 border-violet-600 scale-105 shadow-2xs' : 'bg-slate-100 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Tag */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {HABIT_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { sounds.playTap(); setEditColor(c) }}
                      className={`w-8 h-8 rounded-xl transition active:scale-90 shrink-0 ${
                        editColor === c ? 'ring-2 ring-violet-600 ring-offset-2 scale-105 shadow-xs' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs active:scale-[0.98] transition shadow-md shadow-violet-600/20 mt-3"
              >
                Save Changes
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
