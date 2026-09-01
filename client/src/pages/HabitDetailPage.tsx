import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Flame, Trophy, CheckCircle2, Percent, Calendar,
  Clock, Smile, Edit3, Trash2, Snowflake, Play, Plus, X,
  Sparkles, Check, ChevronRight, MessageSquare, AlertCircle
} from 'lucide-react'
import { useHabitStore, type HabitDetail, type HabitLogEntry } from '../store/useHabitStore'
import { sounds } from '../utils/soundEffects'

const MOODS = [
  { id: 'energized', label: 'Energized', icon: '⚡', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'happy', label: 'Happy', icon: '😊', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'mindful', label: 'Mindful', icon: '🧘', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'productive', label: 'Productive', icon: '🎯', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { id: 'tired', label: 'Tired', icon: '😴', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'neutral', label: 'Normal', icon: '😐', color: 'bg-slate-50 text-slate-600 border-slate-200' },
] as const

const HABIT_COLORS = ['#7C3AED', '#0284C7', '#10B981', '#D97706', '#E11D48', '#6366F1', '#EC4899', '#059669']

const ICONS = ['⚡', '🔥', '📚', '💧', '🏃', '🧘', '💪', '💊', '🎯', '✍️', '🍏', '💤']

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
    checkinHabit,
    upsertHabitLog,
    deleteHabit
  } = useHabitStore()

  // Edit Habit Sheet State
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editFreq, setEditFreq] = useState<'daily' | 'weekly_days' | 'weekly_target' | 'monthly_target'>('daily')
  const [editTargetCount, setEditTargetCount] = useState(1)
  const [editUnit, setEditUnit] = useState('times')
  const [editColor, setEditColor] = useState(HABIT_COLORS[0])
  const [editIcon, setEditIcon] = useState('⚡')
  const [editReminder, setEditReminder] = useState('')

  // Log Edit / Checkin Modal State
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [logDate, setLogDate] = useState('')
  const [logCompletedTime, setLogCompletedTime] = useState('')
  const [logCompleted, setLogCompleted] = useState(true)
  const [logCount, setLogCount] = useState(1)
  const [logMood, setLogMood] = useState('energized')
  const [logNotes, setLogNotes] = useState('')

  useEffect(() => {
    if (habitId) {
      fetchHabitDetail(habitId)
    }
  }, [habitId])

  // Populate edit form when activeDetail loads
  useEffect(() => {
    if (activeDetail) {
      setEditTitle(activeDetail.title)
      setEditDescription(activeDetail.description || '')
      setEditFreq(activeDetail.frequency_type || 'daily')
      setEditTargetCount(activeDetail.target_count || 1)
      setEditUnit(activeDetail.unit || 'times')
      setEditColor(activeDetail.color || HABIT_COLORS[0])
      setEditIcon(activeDetail.icon || '⚡')
      setEditReminder(activeDetail.reminder_time || '')
    }
  }, [activeDetail])

  if (isDetailLoading || !activeDetail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Habit Details...</span>
      </div>
    )
  }

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim()) return
    sounds.playTap()
    await updateHabit(habitId, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      frequency_type: editFreq,
      target_count: editTargetCount,
      unit: editUnit.trim() || 'times',
      color: editColor,
      icon: editIcon,
      reminder_time: editReminder || undefined
    })
    sounds.playSuccess()
    setEditSheetOpen(false)
  }

  const handleOpenLogModal = (existingDate?: string) => {
    sounds.playTap()
    const targetD = existingDate || new Date().toISOString().split('T')[0]
    const existingLog = activeDetail.logs.find(l => l.logged_date === targetD)

    setLogDate(targetD)
    setLogCompletedTime(existingLog?.completed_time || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }))
    setLogCompleted(existingLog ? existingLog.completed : true)
    setLogCount(existingLog?.count || 1)
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
      count: logCount,
      mood: logMood,
      notes: logNotes.trim() || undefined
    })
    sounds.playSuccess()
    setLogModalOpen(false)
  }

  const handleToggleFreeze = async () => {
    sounds.playTap()
    await toggleFreezeHabit(habitId)
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
                style={{ backgroundColor: `${activeDetail.color}15`, border: `1px solid ${activeDetail.color}40` }}
              >
                {activeDetail.icon || '⚡'}
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-black text-slate-900 truncate">
                  {activeDetail.title}
                </h1>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>{activeDetail.frequency_type}</span>
                  <span>•</span>
                  <span>{activeDetail.target_count} {activeDetail.unit}</span>
                  {activeDetail.archived && (
                    <span className="px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-black">
                      ❄️ Frozen
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleToggleFreeze}
              className={`p-2 rounded-xl border text-xs font-bold transition active:scale-95 ${
                activeDetail.archived
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title={activeDetail.archived ? 'Unfreeze Habit' : 'Freeze / Pause Habit'}
            >
              <Snowflake className="w-4 h-4" />
            </button>

            <button
              onClick={() => { sounds.playTap(); setEditSheetOpen(true) }}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition active:scale-95"
              title="Edit Habit Settings"
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

          {/* 1. Hero KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Current Streak */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Streak</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-900 font-mono">{activeDetail.current_streak}</span>
                <span className="text-xs text-slate-400 ml-1 font-bold">days</span>
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
                <span className="text-xs text-slate-400 ml-1 font-bold">days</span>
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

            {/* Completion Rate */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Success Rate</span>
                <Percent className="w-4 h-4 text-violet-500" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-900 font-mono">{activeDetail.completion_rate}%</span>
                <span className="text-xs text-slate-400 ml-1 font-bold">score</span>
              </div>
            </div>
          </div>

          {/* 2. 30-Day Heatmap Matrix */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">30-Day Heatmap</h3>
                <p className="text-[10px] text-slate-400 font-medium">Tap any square to view or edit reflection</p>
              </div>
              <button
                onClick={() => handleOpenLogModal()}
                className="px-2.5 py-1 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold hover:bg-violet-100 transition active:scale-95 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Today</span>
              </button>
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 pt-1">
              {activeDetail.heatmap.map((item, idx) => {
                const dateObj = new Date(item.date)
                const dayStr = dateObj.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
                const isToday = item.date === new Date().toISOString().split('T')[0]

                return (
                  <button
                    key={idx}
                    onClick={() => handleOpenLogModal(item.date)}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center text-[9px] font-bold transition active:scale-90 border relative ${
                      item.completed
                        ? 'bg-emerald-500 border-emerald-600 text-white shadow-2xs'
                        : isToday
                        ? 'bg-violet-50 border-violet-400 text-violet-700 ring-2 ring-violet-300'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                    title={`${item.date}: ${item.completed ? 'Completed' : 'Not completed'}`}
                  >
                    <span className="leading-none">{dayStr}</span>
                    {item.completed ? (
                      <span className="text-[11px] mt-0.5">{item.mood ? getMoodMeta(item.mood).icon : '✓'}</span>
                    ) : (
                      <span className="text-[8px] opacity-40 mt-0.5">-</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. Daily Log & Emotion History List */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Completion & Mood Logs</h3>
                <p className="text-[10px] text-slate-400 font-medium">History of check-in timestamps and notes</p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                {activeDetail.logs.length} entries
              </span>
            </div>

            {activeDetail.logs.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold">No reflection logs yet</p>
                <p className="text-[10px] mt-0.5">Check in daily to track timestamps, reflections, and moods!</p>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {activeDetail.logs.map(log => {
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
                          log.completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                        }`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
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
                <h2 className="text-sm font-black text-slate-900">Habit Check-in & Reflection</h2>
                <p className="text-[11px] text-slate-500 font-medium">Record timestamp, mood, and daily notes</p>
              </div>
              <button onClick={() => setLogModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-3.5">
              {/* Date & Completion Time (Allows editing if checked in late!) */}
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

              {/* Status Toggle & Count */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Completion Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setLogCompleted(!logCompleted)}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      logCompleted
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{logCompleted ? 'Completed' : 'Missed / Skipped'}</span>
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Repetitions / Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={logCount}
                    onChange={e => setLogCount(Number(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Mood / Emotion Selector */}
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

              {/* Notes / Reflection */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Daily Reflection / Notes
                </label>
                <textarea
                  rows={2}
                  value={logNotes}
                  onChange={e => setLogNotes(e.target.value)}
                  placeholder="e.g. Felt super energized after morning run, did 5k easily..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs active:scale-[0.98] transition shadow-md shadow-violet-600/20"
              >
                Save Daily Log
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
                <h2 className="text-sm font-black text-slate-900">Edit Habit Properties</h2>
                <p className="text-[11px] text-slate-500 font-medium">Update frequency, target, and appearance</p>
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

              {/* Frequency Type */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Frequency
                  </label>
                  <select
                    value={editFreq}
                    onChange={e => setEditFreq(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                  >
                    <option value="daily">Daily (Every day)</option>
                    <option value="weekly_days">Specific Days / Week</option>
                    <option value="weekly_target">Weekly Target</option>
                    <option value="monthly_target">Monthly Target</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Target & Unit
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="1"
                      value={editTargetCount}
                      onChange={e => setEditTargetCount(Number(e.target.value) || 1)}
                      className="w-16 px-2.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition text-center"
                    />
                    <input
                      type="text"
                      value={editUnit}
                      onChange={e => setEditUnit(e.target.value)}
                      placeholder="times, mins, pages..."
                      className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* Icon & Color */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Icon & Color Badge
                </label>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {ICONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setEditIcon(ic)}
                      className={`w-9 h-9 rounded-xl text-base flex items-center justify-center transition shrink-0 ${
                        editIcon === ic ? 'bg-violet-100 border-2 border-violet-600 scale-105' : 'bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {HABIT_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-8 h-8 rounded-xl transition active:scale-90 shrink-0 ${
                        editColor === c ? 'ring-2 ring-violet-600 ring-offset-2 scale-105' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs active:scale-[0.98] transition shadow-md shadow-violet-600/20 mt-2"
              >
                Save Habit Changes
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
