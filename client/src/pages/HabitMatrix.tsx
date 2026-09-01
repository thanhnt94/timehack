import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Flame, Check, Plus, X, Zap, Sparkles, Layers, Search,
  Snowflake, ChevronRight, Calendar, Clock, Edit3, Trash2,
  Minus, CheckCircle2, RotateCcw
} from 'lucide-react'
import { useHabitStore, type Habit } from '../store/useHabitStore'
import { TaskPagination } from '../components/TaskPagination'
import { sounds } from '../utils/soundEffects'

const HABIT_COLORS = ['#7C3AED', '#0284C7', '#10B981', '#D97706', '#E11D48', '#6366F1', '#EC4899', '#059669']

const ICONS = ['⚡', '💧', '🏃', '📚', '🧘', '💪', '🎯', '💊', '✍️', '🍏', '💤', '🔥']

const FILTER_TABS = [
  { key: 'all', label: 'All Habits', icon: Layers, activeClass: 'bg-violet-600 border-violet-600 text-white shadow-2xs', inactiveClass: 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' },
  { key: 'active', label: 'Active', icon: Zap, activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-2xs', inactiveClass: 'bg-emerald-50/80 border-emerald-200 text-emerald-700 hover:bg-emerald-100' },
  { key: 'frozen', label: 'Frozen', icon: Snowflake, activeClass: 'bg-blue-600 border-blue-600 text-white shadow-2xs', inactiveClass: 'bg-blue-50/80 border-blue-200 text-blue-700 hover:bg-blue-100' },
  { key: 'daily', label: 'Daily', icon: Calendar, activeClass: 'bg-slate-900 border-slate-900 text-white shadow-2xs', inactiveClass: 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' },
  { key: 'weekly', label: 'Weekly', icon: Clock, activeClass: 'bg-slate-900 border-slate-900 text-white shadow-2xs', inactiveClass: 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' },
] as const

const PAGE_SIZE = 6

export const HabitMatrix: React.FC = () => {
  const {
    habits,
    fetchHabits,
    createHabit,
    checkinHabit,
    upsertHabitLog
  } = useHabitStore()

  const navigate = useNavigate()

  // Filter & Search & Pagination State
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Create Habit Sheet State
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [presetType, setPresetType] = useState<'once' | 'count' | 'timer'>('once')
  const [newTargetCount, setNewTargetCount] = useState(1)
  const [newUnit, setNewUnit] = useState('times')
  const [newFreq, setNewFreq] = useState<'daily' | 'weekly_days' | 'weekly_target' | 'monthly_target'>('daily')
  const [newColor, setNewColor] = useState(HABIT_COLORS[0])
  const [newIcon, setNewIcon] = useState('⚡')

  // Quick Progress Adjustment Modal (for exact logging e.g. 12 mins / 30 mins)
  const [progressModalHabit, setProgressModalHabit] = useState<Habit | null>(null)
  const [inputCount, setInputCount] = useState(0)

  useEffect(() => {
    fetchHabits(true)
  }, [])

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchQuery])

  // Filtered habits
  const filteredHabits = useMemo(() => {
    return habits.filter(h => {
      if (filter === 'active' && h.archived) return false
      if (filter === 'frozen' && !h.archived) return false
      if (filter === 'daily' && h.frequency_type !== 'daily') return false
      if (filter === 'weekly' && h.frequency_type !== 'weekly_days' && h.frequency_type !== 'weekly_target') return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = h.title.toLowerCase().includes(q)
        const matchDesc = h.description?.toLowerCase().includes(q)
        if (!matchTitle && !matchDesc) return false
      }

      return true
    })
  }, [habits, filter, searchQuery])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredHabits.length / PAGE_SIZE))
  const paginatedHabits = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredHabits.slice(start, start + PAGE_SIZE)
  }, [filteredHabits, currentPage])

  const handleApplyPreset = (type: 'once' | 'count' | 'timer') => {
    sounds.playTap()
    setPresetType(type)
    if (type === 'once') {
      setNewTargetCount(1)
      setNewUnit('times')
    } else if (type === 'count') {
      setNewTargetCount(2)
      setNewUnit('times')
    } else if (type === 'timer') {
      setNewTargetCount(30)
      setNewUnit('mins')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    sounds.playTap()
    const newId = await createHabit({
      title: newTitle.trim(),
      frequency_type: newFreq,
      target_count: Math.max(1, Number(newTargetCount) || 1),
      unit: newUnit.trim() || 'times',
      color: newColor,
      icon: newIcon
    })
    sounds.playSuccess()
    setNewTitle('')
    setCreateSheetOpen(false)
    if (newId) {
      navigate(`/habits/${newId}`)
    }
  }

  const handleQuickCheckin = (e: React.MouseEvent, h: Habit) => {
    e.stopPropagation()
    sounds.playTap()
    checkinHabit(h.id)
    if (!h.today_completed) sounds.playSuccess()
  }

  const handleStepIncrement = (e: React.MouseEvent, h: Habit, step: number) => {
    e.stopPropagation()
    sounds.playTap()
    const current = h.today_count || 0
    const target = h.target_count || 1
    const nextCount = Math.max(0, current + step)
    checkinHabit(h.id, {
      count: nextCount,
      completed: nextCount >= target
    })
    if (nextCount >= target && current < target) sounds.playSuccess()
  }

  const handleOpenProgressModal = (e: React.MouseEvent, h: Habit) => {
    e.stopPropagation()
    sounds.playTap()
    setProgressModalHabit(h)
    setInputCount(h.today_count || 0)
  }

  const handleSaveProgressModal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!progressModalHabit) return
    sounds.playTap()
    const target = progressModalHabit.target_count || 1
    const finalCount = Math.max(0, inputCount)
    await checkinHabit(progressModalHabit.id, {
      count: finalCount,
      completed: finalCount >= target
    })
    sounds.playSuccess()
    setProgressModalHabit(null)
  }

  const handleCardClick = (habitId: number) => {
    sounds.playTap()
    navigate(`/habits/${habitId}`)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* ── 1. Fixed / Sticky Top Filter Bar ── */}
      <div className="shrink-0 bg-[#F8FAFC] border-b border-slate-200/70 px-4 py-2 z-10 shadow-2xs">
        <div className="max-w-lg md:max-w-5xl mx-auto flex gap-1.5 overflow-x-auto no-scrollbar">
          {FILTER_TABS.map(tab => {
            const Icon = tab.icon
            const isSelected = filter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => { sounds.playTap(); setFilter(tab.key) }}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 border ${
                  isSelected ? tab.activeClass : tab.inactiveClass
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 2. Scrollable Habit Cards Area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
        <div className="max-w-lg md:max-w-5xl mx-auto space-y-2.5 pb-2">
          {/* Active Search Filter Notice */}
          {searchQuery && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200 text-xs font-bold text-violet-800">
              <div className="flex items-center gap-1.5 truncate">
                <Search className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                <span className="truncate">"{searchQuery}" ({filteredHabits.length} results)</span>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="p-0.5 hover:text-violet-950 transition shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Habit List / Empty State */}
          {filteredHabits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs mb-3">
                <Zap className="w-8 h-8 fill-emerald-400" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                {searchQuery ? 'No matching habits found' : filter === 'frozen' ? 'No frozen habits' : 'No habits tracked'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[260px] leading-relaxed">
                {searchQuery ? 'Try searching with different keywords.' : 'Build daily discipline with partial progress, streaks, and reflections.'}
              </p>

              <button
                onClick={() => { sounds.playTap(); setCreateSheetOpen(true) }}
                className="mt-6 px-6 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-lg shadow-violet-600/25 active:scale-95 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create First Habit</span>
              </button>
            </div>
          ) : (
            paginatedHabits.map(h => {
              const done = !!h.today_completed
              const isFrozen = !!h.archived
              const targetCount = h.target_count || 1
              const todayCount = h.today_count || 0
              const isMultiTarget = targetCount > 1
              const progressPercent = Math.min(100, Math.round((todayCount / targetCount) * 100))
              const miniHistory = h.mini_history || []

              return (
                <div
                  key={h.id}
                  onClick={() => handleCardClick(h.id)}
                  className={`bg-white rounded-2xl border transition shadow-2xs overflow-hidden cursor-pointer group hover:border-violet-300 ${
                    isFrozen
                      ? 'opacity-65 bg-slate-50/80 border-slate-200'
                      : done
                      ? 'border-emerald-200/90 bg-emerald-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="p-3.5">
                    {/* Main Row */}
                    <div className="flex items-center gap-3.5">
                      {/* Check-in Target Button */}
                      <button
                        type="button"
                        onClick={(e) => handleQuickCheckin(e, h)}
                        className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 transition active:scale-90 shadow-2xs relative ${
                          done
                            ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                            : todayCount > 0
                            ? 'bg-violet-50 border-2 border-violet-500 text-violet-700 font-bold'
                            : 'border-2 border-dashed border-slate-300 hover:border-violet-500 bg-white'
                        }`}
                        title={isMultiTarget ? `Progress: ${todayCount}/${targetCount} ${h.unit}` : 'Check in habit'}
                      >
                        {done ? (
                          <Check className="w-6 h-6 text-white stroke-[3]" />
                        ) : isMultiTarget && todayCount > 0 ? (
                          <span className="text-[11px] font-black font-mono leading-none">
                            {todayCount}/{targetCount}
                          </span>
                        ) : (
                          <span className="text-lg">{h.icon || '⚡'}</span>
                        )}
                      </button>

                      {/* Habit Info & Metrics */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className={`text-sm font-bold truncate group-hover:text-violet-700 transition ${
                              done ? 'text-emerald-950' : 'text-slate-900'
                            }`}>
                              {h.title}
                            </h4>
                            {isFrozen && (
                              <span className="px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-black shrink-0">
                                ❄️ Frozen
                              </span>
                            )}
                          </div>

                          {/* Streak Badge */}
                          {h.current_streak > 0 && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 font-bold flex items-center gap-0.5 shrink-0">
                              <Flame className="w-3 h-3 text-amber-500" /> {h.current_streak}d
                            </span>
                          )}
                        </div>

                        {/* Progress Details / Stepper */}
                        <div className="flex items-center justify-between mt-2 gap-2">
                          {/* Mini 7-Day Sparkline Dots */}
                          <div className="flex items-center gap-1">
                            {miniHistory.map((day, idx) => (
                              <div
                                key={idx}
                                className={`w-2.5 h-2.5 rounded-full transition ${
                                  day.completed
                                    ? 'bg-emerald-500 ring-1 ring-emerald-300'
                                    : 'bg-slate-200'
                                }`}
                                title={day.date}
                              />
                            ))}
                          </div>

                          {/* Target / Partial Progress Stepper & Badge */}
                          <div className="flex items-center gap-1.5">
                            {isMultiTarget ? (
                              <div className="flex items-center gap-1 bg-slate-100/90 px-1.5 py-0.5 rounded-lg border border-slate-200">
                                <button
                                  type="button"
                                  onClick={(e) => handleStepIncrement(e, h, -1)}
                                  className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold active:scale-90 transition shadow-2xs"
                                  title="Decrease"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleOpenProgressModal(e, h)}
                                  className="text-[10px] font-black font-mono px-1 hover:text-violet-700 transition"
                                  title="Click to set exact progress"
                                >
                                  {todayCount}/{targetCount} {h.unit} ({progressPercent}%)
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleStepIncrement(e, h, 1)}
                                  className="w-5 h-5 rounded-md bg-white hover:bg-violet-100 hover:text-violet-700 text-slate-700 flex items-center justify-center text-[10px] font-bold active:scale-90 transition shadow-2xs"
                                  title="Increase +1"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400">
                                1 {h.unit} / day
                              </span>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-violet-500 transition shrink-0" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Multi-step Visual Progress Bar */}
                    {isMultiTarget && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100/80">
                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1 font-mono">
                          <span>Today: {todayCount} of {targetCount} {h.unit}</span>
                          <span className={done ? 'text-emerald-600' : 'text-violet-600'}>{progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              done ? 'bg-emerald-500' : 'bg-violet-600'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── 3. Fixed Bottom Toolbar (Icon Only +) ── */}
      <div className="shrink-0 z-30 bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 px-4 py-2 shadow-[0_-2px_12px_rgba(0,0,0,0.03)]">
        <div className="max-w-lg md:max-w-5xl mx-auto flex items-center justify-between gap-2 min-h-[36px]">
          {isSearchOpen ? (
            <div className="flex items-center gap-2 flex-1 animate-in fade-in duration-150">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-violet-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search habits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-100/90 border border-violet-200 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-violet-500 shadow-inner transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setIsSearchOpen(false)
                }}
                className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition shrink-0 active:scale-95 cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Left: Habit Pagination Stepper */}
              <TaskPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />

              {/* Right: Quick Action Buttons (Search & Add Habit Icon-Only) */}
              <div className="flex items-center gap-1.5">
                {/* Search Toggle Button */}
                <button
                  onClick={() => { sounds.playTap(); setIsSearchOpen(true) }}
                  className={`h-8 w-8 rounded-xl border flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs ${
                    searchQuery
                      ? 'bg-violet-50 border-violet-300 text-violet-700 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700'
                  }`}
                  title="Search Habits"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Add Habit Button (Icon Only) */}
                <button
                  onClick={() => { sounds.playTap(); setCreateSheetOpen(true) }}
                  className="h-8 w-8 rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shadow-xs shadow-violet-500/20 active:scale-95 transition cursor-pointer"
                  title="Create new habit"
                  aria-label="Create new habit"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal 1: Streamlined & Clean Create Habit Sheet ── */}
      {createSheetOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setCreateSheetOpen(false)} />
          <div className="sheet-content max-w-lg mx-auto">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h2 className="text-sm font-black text-slate-900">Create New Habit</h2>
                <p className="text-[11px] text-slate-500 font-medium">Simple steps to build daily consistency</p>
              </div>
              <button onClick={() => setCreateSheetOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              {/* Habit Name */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Drink 2L water, Read book, Morning workout..."
                  autoFocus
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              {/* Habit Tracking Preset Chips */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Tracking Goal Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('once')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      presetType === 'once'
                        ? 'bg-violet-50 border-violet-400 text-violet-800 ring-2 ring-violet-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1">⚡ 1x / Day</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Simple check-in</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('count')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      presetType === 'count'
                        ? 'bg-violet-50 border-violet-400 text-violet-800 ring-2 ring-violet-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1">🔢 Multi-Count</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">e.g. 2, 4, 8 times</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('timer')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      presetType === 'timer'
                        ? 'bg-violet-50 border-violet-400 text-violet-800 ring-2 ring-violet-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1">⏱️ Duration</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">e.g. 30 mins</div>
                  </button>
                </div>
              </div>

              {/* Target & Unit (Customizable) */}
              {presetType !== 'once' && (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-150">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Daily Target Number
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newTargetCount}
                      onChange={e => setNewTargetCount(Number(e.target.value) || 1)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={newUnit}
                      onChange={e => setNewUnit(e.target.value)}
                      placeholder="times, mins, pages, lít..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              {/* Icon & Color Badge */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Icon & Color
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {ICONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setNewIcon(ic)}
                      className={`w-8 h-8 rounded-xl text-sm flex items-center justify-center transition shrink-0 ${
                        newIcon === ic ? 'bg-violet-100 border-2 border-violet-600 scale-105' : 'bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 mt-1.5">
                  {HABIT_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`w-7 h-7 rounded-xl transition active:scale-90 shrink-0 ${
                        newColor === c ? 'ring-2 ring-violet-600 ring-offset-2 scale-105' : ''
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
                Create Habit
              </button>
            </form>
          </div>
        </>
      )}

      {/* ── Modal 2: Quick Exact Progress Setting Modal ── */}
      {progressModalHabit && (
        <>
          <div className="sheet-backdrop" onClick={() => setProgressModalHabit(null)} />
          <div className="sheet-content max-w-lg mx-auto">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h2 className="text-sm font-black text-slate-900">Log Progress for Today</h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {progressModalHabit.title} (Target: {progressModalHabit.target_count} {progressModalHabit.unit})
                </p>
              </div>
              <button onClick={() => setProgressModalHabit(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgressModal} className="space-y-4">
              <div className="flex items-center justify-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => setInputCount(Math.max(0, inputCount - 1))}
                  className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-lg font-bold flex items-center justify-center active:scale-90 transition"
                >
                  -
                </button>

                <div className="flex items-baseline gap-1 text-center">
                  <input
                    type="number"
                    min="0"
                    value={inputCount}
                    onChange={e => setInputCount(Number(e.target.value) || 0)}
                    autoFocus
                    className="w-24 text-center text-3xl font-black font-mono text-slate-900 border-b-2 border-violet-500 outline-none bg-transparent"
                  />
                  <span className="text-sm font-bold text-slate-400">
                    / {progressModalHabit.target_count} {progressModalHabit.unit}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setInputCount(inputCount + 1)}
                  className="w-11 h-11 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-lg font-bold flex items-center justify-center active:scale-90 transition shadow-md shadow-violet-600/20"
                >
                  +
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setInputCount(Math.round(progressModalHabit.target_count / 2))}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
                >
                  Half (50%)
                </button>
                <button
                  type="button"
                  onClick={() => setInputCount(progressModalHabit.target_count)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition"
                >
                  Full (100%)
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs active:scale-[0.98] transition shadow-md shadow-violet-600/20"
              >
                Save Progress
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
