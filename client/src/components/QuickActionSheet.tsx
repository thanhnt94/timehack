import React, { useState } from 'react'
import {
  X, ArrowLeft, CheckSquare, Zap, Play, Calendar, Clock,
  Flame, Star, Users, Inbox
} from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore'
import { useHabitStore } from '../store/useHabitStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { useTimeLogStore } from '../store/useTimeLogStore'
import { useTimerStore } from '../store/useTimerStore'
import { sounds } from '../utils/soundEffects'

interface Props {
  isOpen: boolean
  onClose: () => void
  onStartFocus: () => void
}

type SubView = 'menu' | 'task' | 'habit' | 'schedule' | 'actual'

const HABIT_COLORS = ['#7C3AED', '#0284C7', '#10B981', '#D97706', '#E11D48', '#6366F1']

const PRIORITY_CHOICES = [
  {
    key: 'do_first',
    label: 'Urgent & Important',
    desc: 'Do immediately',
    icon: Flame,
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    selectedBg: 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-500'
  },
  {
    key: 'schedule',
    label: 'Important, Not Urgent',
    desc: 'Plan & schedule',
    icon: Star,
    badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
    selectedBg: 'bg-violet-50 border-violet-400 text-violet-800 ring-2 ring-violet-500'
  },
  {
    key: 'delegate',
    label: 'Urgent, Less Important',
    desc: 'Delegate or do fast',
    icon: Users,
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    selectedBg: 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-500'
  },
  {
    key: 'eliminate',
    label: 'Not Urgent or Important',
    desc: 'Backlog / Eliminate',
    icon: Inbox,
    badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
    selectedBg: 'bg-slate-100 border-slate-400 text-slate-800 ring-2 ring-slate-400'
  },
] as const

export const QuickActionSheet: React.FC<Props> = ({ isOpen, onClose, onStartFocus }) => {
  const [subView, setSubView] = useState<SubView>('menu')

  const { createTask, categories, fetchCategories } = useTaskStore()
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskEisen, setTaskEisen] = useState<'do_first' | 'schedule' | 'delegate' | 'eliminate'>('do_first')
  const [taskCategoryId, setTaskCategoryId] = useState<number | null>(null)

  const [habitTitle, setHabitTitle] = useState('')
  const [habitFreqPeriod, setHabitFreqPeriod] = useState<'daily' | 'weekly_target' | 'monthly_target'>('daily')
  const [habitTargetCount, setHabitTargetCount] = useState(1)
  const [habitUnit, setHabitUnit] = useState('times')
  const [habitColor, setHabitColor] = useState(HABIT_COLORS[0])
  const { createHabit } = useHabitStore()

  const [scheduleTitle, setScheduleTitle] = useState('')
  const [scheduleStart, setScheduleStart] = useState('09:00')
  const [scheduleEnd, setScheduleEnd] = useState('10:00')
  const [scheduleCategoryId, setScheduleCategoryId] = useState<number | null>(null)
  const { createSlot, selectedDate } = useScheduleStore()

  const [logNotes, setLogNotes] = useState('')
  const [logStart, setLogStart] = useState('09:00')
  const [logEnd, setLogEnd] = useState('10:00')
  const [logCategoryId, setLogCategoryId] = useState<number | null>(null)
  const { createLog } = useTimeLogStore()

  const { startTimer } = useTimerStore()

  React.useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClose = () => {
    setSubView('menu')
    onClose()
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return
    sounds.playTap()
    await createTask({
      title: taskTitle.trim(),
      category_id: taskCategoryId || undefined,
      eisenhower: taskEisen,
      due_date: taskDueDate ? `${taskDueDate}T23:59:59` : undefined
    })
    sounds.playSuccess()
    setTaskTitle('')
    setTaskDueDate('')
    setTaskCategoryId(null)
    handleClose()
  }

  const handleApplyHabitPreset = (period: 'daily' | 'weekly_target' | 'monthly_target', count: number, unit: string) => {
    sounds.playTap()
    setHabitFreqPeriod(period)
    setHabitTargetCount(count)
    setHabitUnit(unit)
  }

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!habitTitle.trim()) return
    sounds.playTap()
    await createHabit({
      title: habitTitle.trim(),
      color: habitColor,
      icon: '⚡',
      target_count: Math.max(1, Number(habitTargetCount) || 1),
      unit: habitUnit.trim() || 'times',
      frequency_type: habitFreqPeriod
    })
    sounds.playSuccess()
    setHabitTitle('')
    handleClose()
  }

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scheduleTitle.trim()) return
    sounds.playTap()
    await createSlot({
      date: selectedDate,
      start_time: scheduleStart,
      end_time: scheduleEnd,
      title: scheduleTitle.trim(),
      category_id: scheduleCategoryId || undefined
    })
    sounds.playSuccess()
    setScheduleTitle('')
    setScheduleCategoryId(null)
    handleClose()
  }

  const handleCreateActualLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logNotes.trim()) return
    sounds.playTap()
    const [sh, sm] = logStart.split(':').map(Number)
    const [eh, em] = logEnd.split(':').map(Number)
    let durMins = (eh * 60 + em) - (sh * 60 + sm)
    if (durMins <= 0) durMins = 30

    const todayIso = new Date().toISOString().split('T')[0]
    const startIso = `${selectedDate || todayIso}T${logStart}:00`
    const endIso = `${selectedDate || todayIso}T${logEnd}:00`

    await createLog({
      start_time: startIso,
      end_time: endIso,
      duration_seconds: durMins * 60,
      timer_type: 'manual',
      category_id: logCategoryId || undefined,
      notes: logNotes.trim()
    })
    sounds.playSuccess()
    setLogNotes('')
    setLogCategoryId(null)
    handleClose()
  }

  const handleDirectFocus = () => {
    sounds.playTap()
    startTimer({ title: 'Quick Focus Session' })
    handleClose()
    onStartFocus()
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={handleClose} />

      <div className="sheet-content max-w-lg mx-auto">
        <div className="sheet-handle" />

        {/* ── Menu Header ───────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {subView !== 'menu' && (
              <button
                onClick={() => { sounds.playTap(); setSubView('menu') }}
                className="p-1 -ml-1 text-slate-400 hover:text-slate-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-black text-slate-900">
                {subView === 'menu' && 'Quick Create'}
                {subView === 'task' && 'Create New Task'}
                {subView === 'habit' && 'Create New Habit'}
                {subView === 'schedule' && 'Plan Time Block'}
                {subView === 'actual' && 'Log Actual Time'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {subView === 'menu' && 'Choose an action to create or focus'}
                {subView === 'task' && 'Set deadline and priority level'}
                {subView === 'habit' && 'Build a new daily streak'}
                {subView === 'schedule' && 'Budget planned hours for today'}
                {subView === 'actual' && 'Record actual focus time spent'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── View 1: 5 Action Cards Menu ── */}
        {subView === 'menu' && (
          <div className="space-y-2 pb-2">
            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Task */}
              <button
                onClick={() => { sounds.playTap(); setSubView('task') }}
                className="bg-white rounded-2xl p-3.5 flex flex-col items-start gap-2 border border-slate-200 hover:border-violet-400 active:scale-95 transition text-left shadow-2xs"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">New Task</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Add to-do deliverable</div>
                </div>
              </button>

              {/* 2. Habit */}
              <button
                onClick={() => { sounds.playTap(); setSubView('habit') }}
                className="bg-white rounded-2xl p-3.5 flex flex-col items-start gap-2 border border-slate-200 hover:border-emerald-400 active:scale-95 transition text-left shadow-2xs"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">New Habit</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Build daily streak</div>
                </div>
              </button>

              {/* 3. Plan Slot */}
              <button
                onClick={() => { sounds.playTap(); setSubView('schedule') }}
                className="bg-white rounded-2xl p-3.5 flex flex-col items-start gap-2 border border-slate-200 hover:border-sky-400 active:scale-95 transition text-left shadow-2xs"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Plan Slot</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Block calendar time</div>
                </div>
              </button>

              {/* 4. Log Actual */}
              <button
                onClick={() => { sounds.playTap(); setSubView('actual') }}
                className="bg-white rounded-2xl p-3.5 flex flex-col items-start gap-2 border border-slate-200 hover:border-amber-400 active:scale-95 transition text-left shadow-2xs"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Log Actual</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Record spent time</div>
                </div>
              </button>
            </div>

            {/* 5. Focus Now - Prominent full card */}
            <button
              onClick={handleDirectFocus}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-3.5 flex items-center justify-between text-white active:scale-98 transition text-left shadow-md shadow-violet-600/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div>
                  <div className="text-xs font-black">Focus Now</div>
                  <div className="text-[10px] text-violet-200 mt-0.5">Launch Pomodoro / Stopwatch timer</div>
                </div>
              </div>
              <span className="text-xs font-bold bg-white text-violet-700 px-3 py-1.5 rounded-xl shadow-2xs">
                Start →
              </span>
            </button>
          </div>
        )}

        {/* ── View 2: Form Task ─────────── */}
        {subView === 'task' && (
          <form onSubmit={handleCreateTask} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Task Title
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="e.g. Finish financial report, Send client invoice..."
                autoFocus
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Priority Level
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRIORITY_CHOICES.map(q => {
                  const QIcon = q.icon
                  const isSelected = taskEisen === q.key
                  return (
                    <button
                      key={q.key}
                      type="button"
                      onClick={() => setTaskEisen(q.key as any)}
                      className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition flex items-start gap-2 ${
                        isSelected
                          ? q.selectedBg
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <QIcon className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <div>{q.label}</div>
                        <div className="text-[9px] font-normal text-slate-400">{q.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Category
              </label>
              <select
                value={taskCategoryId || ''}
                onChange={e => setTaskCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 focus:bg-white transition"
              >
                <option value="">-- No category --</option>
                {categories.map(c => (
                  <React.Fragment key={c.id}>
                    <option value={c.id}>📁 {c.name}</option>
                    {c.subcategories && c.subcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>&nbsp;&nbsp;&nbsp;&nbsp;↳ {sub.name}</option>
                    ))}
                  </React.Fragment>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Deadline (Optional)
              </label>
              <input
                type="date"
                value={taskDueDate}
                onChange={e => setTaskDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs active:scale-[0.98] transition shadow-md shadow-violet-600/20 mt-2"
            >
              Save Task
            </button>
          </form>
        )}

        {/* ── View 3: Form Habit (Streamlined: Unit Chips, Split Icon & Color) ────────── */}
        {subView === 'habit' && (
          <form onSubmit={handleCreateHabit} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Habit Title
              </label>
              <input
                type="text"
                value={habitTitle}
                onChange={e => setHabitTitle(e.target.value)}
                placeholder="e.g. Read Books, Morning Jog, Deep Work, Drink Water..."
                autoFocus
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
              />
            </div>

            {/* Frequency & Target */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Frequency
                  </label>
                  <select
                    value={habitFreqPeriod}
                    onChange={e => setHabitFreqPeriod(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                  >
                    <option value="daily">📅 Daily (Every day)</option>
                    <option value="weekly_target">🗓️ Weekly Target</option>
                    <option value="monthly_target">📆 Monthly Target</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Target Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={habitTargetCount}
                    onChange={e => setHabitTargetCount(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition text-center"
                  />
                </div>
              </div>

              {/* Unit Preset Chips & Custom */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Unit ({habitTargetCount} {habitUnit} / {habitFreqPeriod === 'daily' ? 'day' : habitFreqPeriod === 'weekly_target' ? 'week' : 'month'})
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['times', 'mins', 'hours', 'pages', 'cups', 'km', 'reps', 'books'].map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => { sounds.playTap(); setHabitUnit(u) }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        habitUnit === u
                          ? 'bg-violet-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Color Tag
              </label>
              <div className="flex gap-2">
                {HABIT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { sounds.playTap(); setHabitColor(c) }}
                    className={`w-8 h-8 rounded-xl transition active:scale-90 ${
                      habitColor === c ? 'ring-2 ring-violet-600 ring-offset-2 scale-105 shadow-xs' : ''
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
        )}

        {/* ── View 4: Form Schedule ──────── */}
        {subView === 'schedule' && (
          <form onSubmit={handleCreateSchedule} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Planned Activity
              </label>
              <input
                type="text"
                value={scheduleTitle}
                onChange={e => setScheduleTitle(e.target.value)}
                placeholder="e.g. Team Standup, Deep Coding Block..."
                autoFocus
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={scheduleStart}
                  onChange={e => setScheduleStart(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={scheduleEnd}
                  onChange={e => setScheduleEnd(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Category
              </label>
              <select
                value={scheduleCategoryId || ''}
                onChange={e => setScheduleCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 focus:bg-white transition"
              >
                <option value="">-- No category --</option>
                {categories.map(c => (
                  <React.Fragment key={c.id}>
                    <option value={c.id}>📁 {c.name}</option>
                    {c.subcategories && c.subcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>&nbsp;&nbsp;&nbsp;&nbsp;↳ {sub.name}</option>
                    ))}
                  </React.Fragment>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs active:scale-[0.98] transition shadow-md shadow-violet-600/20 mt-2"
            >
              Save Time Slot
            </button>
          </form>
        )}

        {/* ── View 5: Form Actual Time Log ── */}
        {subView === 'actual' && (
          <form onSubmit={handleCreateActualLog} className="space-y-3.5">
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
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Category
              </label>
              <select
                value={logCategoryId || ''}
                onChange={e => setLogCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 focus:bg-white transition"
              >
                <option value="">-- No category --</option>
                {categories.map(c => (
                  <React.Fragment key={c.id}>
                    <option value={c.id}>📁 {c.name}</option>
                    {c.subcategories && c.subcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>&nbsp;&nbsp;&nbsp;&nbsp;↳ {sub.name}</option>
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs active:scale-[0.98] transition shadow-md shadow-slate-900/20 mt-2"
            >
              Save Time Log
            </button>
          </form>
        )}
      </div>
    </>
  )
}
