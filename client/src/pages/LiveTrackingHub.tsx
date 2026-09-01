import React, { useState, useEffect, useMemo } from 'react'
import {
  Clock, Play, Pause, Square, Plus, Check, RotateCcw,
  Sparkles, Maximize2, Trash2, Calendar as CalendarIcon,
  Flame, CheckCircle2, ChevronRight, BarChart3, AlertCircle,
  Tag, Layers, ArrowRight, Zap, Target, Edit3, X, Coffee,
  Activity, BookOpen, Briefcase, Code, Smile, Navigation
} from 'lucide-react'
import { useTimerStore } from '../store/useTimerStore'
import { useTimeLogStore, type TimeLogItem } from '../store/useTimeLogStore'
import { useTaskStore, type Task } from '../store/useTaskStore'
import { useScheduleStore, type ScheduleSlot } from '../store/useScheduleStore'
import { sounds } from '../utils/soundEffects'

interface Props {
  onOpenFullscreenFocus: () => void
}

type ReadyTrackTab = 'presets' | 'tasks' | 'plans'

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
    secondsRemaining,
    elapsedSeconds,
    startTime,
    activeTitle,
    activeCategoryName,
    activeCategoryColor
  } = useTimerStore()

  const { logs, fetchLogs, createLog, updateLog, deleteLog } = useTimeLogStore()
  const { tasks, categories, fetchTasks, fetchCategories } = useTaskStore()
  const { slots, fetchSlots } = useScheduleStore()

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Quick Start Input State
  const [quickTitle, setQuickTitle] = useState('')
  const [quickCategoryId, setQuickCategoryId] = useState<number | null>(null)
  const [showReadyQueue, setShowReadyQueue] = useState(false)
  const [readyTab, setReadyTab] = useState<ReadyTrackTab>('presets')

  // Edit Log Modal State
  const [editingLog, setEditingLog] = useState<TimeLogItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null)
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editDurationMins, setEditDurationMins] = useState(30)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Manual Quick Log Modal State
  const [showManualModal, setShowManualModal] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [manualCategoryId, setManualCategoryId] = useState<number | null>(null)
  const [manualStartTime, setManualStartTime] = useState(() => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    return `${String(oneHourAgo.getHours()).padStart(2, '0')}:${String(oneHourAgo.getMinutes()).padStart(2, '0')}`
  })
  const [manualEndTime, setManualEndTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [manualNotes, setManualNotes] = useState('')
  const [isSubmittingManual, setIsSubmittingManual] = useState(false)

  useEffect(() => {
    fetchLogs(todayIso)
    fetchTasks()
    fetchCategories()
    fetchSlots(todayIso)
  }, [])

  // Formatted timer strings for StopWatch (counting UP) and Pomodoro
  const formatClockDigits = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const formatLocalTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch {
      return ''
    }
  }

  const formattedStartTime = useMemo(() => {
    if (!startTime) return ''
    try {
      const d = new Date(startTime)
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    } catch {
      return ''
    }
  }, [startTime])

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

  // Real-time Live Track Action (Stopwatch count-up, auto-saves previous active timer)
  const handleStartQuickTrack = async (title?: string, catId?: number) => {
    sounds.playTap()
    const chosenTitle = title || quickTitle.trim() || 'Hoạt động thực tế'
    const chosenCatId = catId !== undefined ? catId : quickCategoryId
    const chosenCat = categories.find(c => c.id === chosenCatId)

    await startTimer({
      title: chosenTitle,
      categoryId: chosenCat?.id,
      categoryName: chosenCat?.name,
      categoryColor: chosenCat?.color,
      categoryType: chosenCat?.category_type,
      mode: 'stopwatch' // Default to stopwatch count-up
    })

    setQuickTitle('')
    setShowReadyQueue(false)
    fetchLogs(todayIso)
  }

  const handleTrackTask = async (task: Task) => {
    sounds.playTap()
    await startTimer({
      taskId: task.id,
      title: task.title,
      categoryId: task.category?.id,
      categoryName: task.category?.name,
      categoryColor: task.category?.color,
      mode: 'stopwatch'
    })
    setShowReadyQueue(false)
    fetchLogs(todayIso)
  }

  const handleTrackPlanSlot = async (slot: ScheduleSlot) => {
    sounds.playTap()
    await startTimer({
      title: slot.title,
      categoryId: slot.category_id || undefined,
      categoryName: slot.category?.name,
      categoryColor: slot.category?.color,
      mode: 'stopwatch'
    })
    setShowReadyQueue(false)
    fetchLogs(todayIso)
  }

  // Open Edit Modal for Log
  const handleOpenEditModal = (log: TimeLogItem) => {
    sounds.playTap()
    setEditingLog(log)
    setEditTitle(log.task_title || log.habit_title || log.notes || 'Phiên tập trung')
    setEditCategoryId(log.category_id || null)

    try {
      const s = new Date(log.start_time)
      const e = new Date(log.end_time)
      setEditStartTime(`${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}`)
      setEditEndTime(`${String(e.getHours()).padStart(2, '0')}:${String(e.getMinutes()).padStart(2, '0')}`)
    } catch {
      setEditStartTime('09:00')
      setEditEndTime('09:30')
    }

    setEditDurationMins(Math.round((log.duration_seconds || 0) / 60))
  }

  const handleSaveEditLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLog || isSavingEdit) return

    try {
      setIsSavingEdit(true)
      sounds.playTap()

      const [sh, sm] = editStartTime.split(':').map(Number)
      const [eh, em] = editEndTime.split(':').map(Number)
      let calcDuration = (eh * 60 + em) - (sh * 60 + sm)
      if (calcDuration <= 0) calcDuration = editDurationMins || 30

      const startIso = `${todayIso}T${editStartTime}:00`
      const endIso = `${todayIso}T${editEndTime}:00`

      await updateLog(editingLog.id, {
        notes: editTitle.trim(),
        category_id: editCategoryId || undefined,
        start_time: startIso,
        end_time: endIso,
        duration_seconds: calcDuration * 60
      })

      sounds.playSuccess()
      setEditingLog(null)
      fetchLogs(todayIso)
    } catch (err) {
      console.error('Failed to update log', err)
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Submit Manual Quick Log
  const handleSaveManualLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualTitle.trim() || isSubmittingManual) return

    const [sh, sm] = manualStartTime.split(':').map(Number)
    const [eh, em] = manualEndTime.split(':').map(Number)
    let durMins = (eh * 60 + em) - (sh * 60 + sm)
    if (durMins <= 0) durMins = 30

    try {
      setIsSubmittingManual(true)
      sounds.playTap()

      const startIso = `${todayIso}T${manualStartTime}:00`
      const endIso = `${todayIso}T${manualEndTime}:00`

      await createLog({
        start_time: startIso,
        end_time: endIso,
        duration_seconds: durMins * 60,
        timer_type: 'manual',
        category_id: manualCategoryId || undefined,
        notes: `${manualTitle.trim()}${manualNotes.trim() ? ` - ${manualNotes.trim()}` : ''}`
      })

      sounds.playSuccess()
      setManualTitle('')
      setManualNotes('')
      setManualCategoryId(null)
      setShowManualModal(false)
      fetchLogs(todayIso)
    } catch (err) {
      console.error('Failed to log actual time', err)
    } finally {
      setIsSubmittingManual(false)
    }
  }

  const handleDeleteLog = async (id: number) => {
    sounds.playTap()
    await deleteLog(id)
    sounds.playSuccess()
    if (editingLog?.id === id) setEditingLog(null)
  }

  const activePlanSlots = slots.filter(s => !s.is_done)
  const activeTasks = tasks.filter(t => t.status !== 'completed')

  // Real-world practical presets
  const presets = [
    { title: '🚗 Đi làm / Di chuyển', catName: 'Công việc & Dự án', color: '#3B82F6' },
    { title: '💻 Lập trình & Kỹ thuật', catName: 'Lập trình & Kỹ thuật', color: '#8B5CF6' },
    { title: '💼 Họp & Thảo luận', catName: 'Công việc & Dự án', color: '#3B82F6' },
    { title: '🏃 Chạy bộ & Thể thao', catName: 'Sức khỏe & Thể thao', color: '#F59E0B' },
    { title: '☕ Ăn uống & Nghỉ giải lao', catName: 'Nghỉ ngơi & Giải trí', color: '#64748B' },
    { title: '📚 Đọc sách & Học tập', catName: 'Học tập & Ngoại ngữ', color: '#10B981' }
  ]

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900 text-slate-100">
      {/* ── 1. STICKY APP HEADER BAR ── */}
      <header className="shrink-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-violet-600/30">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white">Tracking Hub</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                LIVE STOPWATCH
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Bấm giờ ghi nhận thời gian thực tế từ khi bắt đầu đến khi kết thúc
            </p>
          </div>
        </div>

        {/* Right Summary Pill + Quick Add Button */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-right shadow-2xs">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Đã ghi hôm nay</span>
            <span className="text-xs sm:text-sm font-black text-violet-400 font-mono">
              {totalLoggedFormatted}
            </span>
          </div>

          <button
            onClick={() => { sounds.playTap(); setShowManualModal(true) }}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
            title="Ghi nhận log thủ công"
          >
            <Plus className="w-4 h-4 text-violet-400" />
            <span className="hidden sm:inline">Ghi log</span>
          </button>
        </div>
      </header>

      {/* ── 2. MAIN APP CONTENT SCROLL AREA ── */}
      <main className="flex-1 overflow-y-auto px-3.5 py-3.5 sm:px-6 sm:py-5 space-y-3.5 max-w-4xl w-full mx-auto pb-24">

        {/* ── A. SLEEK COMPACT ACTIVE RUNNER BAR (WHEN TRACKING) ── */}
        {isRunning && (
          <div className="bg-gradient-to-r from-violet-950/90 via-slate-900/95 to-indigo-950/90 rounded-2xl p-3.5 sm:p-4 border border-violet-600/60 shadow-lg shadow-violet-950/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative overflow-hidden anim-fade-in">
            {/* Pulsing indicator & Activity Title */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-white truncate">
                    {activeTitle || 'Hoạt động thực tế'}
                  </h3>
                  {activeCategoryName && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.2 rounded-md text-white shadow-xs shrink-0"
                      style={{ backgroundColor: activeCategoryColor || '#8B5CF6' }}
                    >
                      {activeCategoryName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                  {formattedStartTime && <span>Bắt đầu: {formattedStartTime}</span>}
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">
                    {mode === 'stopwatch' ? '⏱️ Bấm giờ' : '🔥 Pomodoro'}
                  </span>
                </div>
              </div>
            </div>

            {/* Big Digits & Quick Control Buttons */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
              {/* Digital counter */}
              <div className="bg-black/60 px-3.5 py-1.5 rounded-xl border border-white/10 text-right">
                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-400 tabular-nums">
                  {mode === 'stopwatch' ? formatClockDigits(elapsedSeconds) : formatClockDigits(secondsRemaining)}
                </span>
              </div>

              {/* Pause / Resume */}
              <button
                onClick={() => { sounds.playTap(); isPaused ? resumeTimer() : pauseTimer() }}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition active:scale-95 border border-white/15"
                title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
              >
                {isPaused ? <Play className="w-4 h-4 fill-current text-emerald-400" /> : <Pause className="w-4 h-4 fill-current text-amber-400" />}
                <span className="hidden sm:inline">{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
              </button>

              {/* Finish & Save Log */}
              <button
                onClick={async () => {
                  sounds.playTap()
                  await stopTimer()
                  sounds.playSuccess()
                  fetchLogs(todayIso)
                }}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-600/30"
                title="Dừng và lưu vào Actual"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Kết thúc</span>
              </button>

              {/* Fullscreen focus */}
              <button
                onClick={() => { sounds.playTap(); onOpenFullscreenFocus() }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition active:scale-90"
                title="Toàn màn hình Focus"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Reset */}
              <button
                onClick={() => { sounds.playTap(); resetTimer() }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition active:scale-90"
                title="Hủy phiên"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── B. QUICK TRACK LAUNCHER BAR (ALWAYS ACCESSIBLE TO SWITCH / START) ── */}
        <div className="bg-slate-800/90 rounded-2xl p-3 sm:p-4 border border-slate-700/80 shadow-md space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-white uppercase tracking-wider">
                {isRunning ? 'Chuyển sang Track việc khác' : 'Bắt đầu Track Nhanh'}
              </span>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center p-0.5 bg-slate-900 rounded-lg text-[10px] font-bold border border-slate-700">
              <button
                onClick={() => { sounds.playTap(); switchMode('stopwatch') }}
                className={`px-2 py-0.5 rounded-md transition ${
                  mode === 'stopwatch' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-400'
                }`}
              >
                ⏱️ Bấm giờ
              </button>
              <button
                onClick={() => { sounds.playTap(); switchMode('pomodoro') }}
                className={`px-2 py-0.5 rounded-md transition ${
                  mode === 'pomodoro' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-400'
                }`}
              >
                🔥 Pomodoro
              </button>
            </div>
          </div>

          {/* Quick Track Input Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
              placeholder="Ví dụ: Đi làm, Họp Sprint, Code API, Đọc sách..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white placeholder:text-slate-500 outline-none focus:border-violet-500 transition"
              onKeyDown={e => {
                if (e.key === 'Enter') handleStartQuickTrack()
              }}
            />

            <select
              value={quickCategoryId || ''}
              onChange={e => setQuickCategoryId(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 outline-none focus:border-violet-500 transition shrink-0"
            >
              <option value="">📁 Chọn danh mục...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleStartQuickTrack()}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/30 active:scale-95 transition shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Đổi Track' : 'Track ngay'}</span>
            </button>
          </div>

          {/* Quick Activity Chips */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-700/60 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Gợi ý nhanh:
              </span>
              {presets.slice(0, 4).map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const matchedCat = categories.find(c => c.name.toLowerCase().includes(p.catName.toLowerCase().slice(0, 5)))
                    handleStartQuickTrack(p.title, matchedCat?.id)
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-700 text-[11px] font-bold text-slate-300 border border-slate-700/80 transition active:scale-95 shrink-0"
                >
                  {p.title}
                </button>
              ))}
            </div>

            <button
              onClick={() => { sounds.playTap(); setShowReadyQueue(!showReadyQueue) }}
              className="text-[11px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 shrink-0 ml-auto"
            >
              <span>{showReadyQueue ? 'Thu gọn hàng đợi ▲' : 'Chọn từ Task/Lịch ▼'}</span>
            </button>
          </div>
        </div>

        {/* ── C. READY-TO-TRACK QUEUE DRAWER (OPTIONAL EXPANDABLE) ── */}
        {showReadyQueue && (
          <div className="bg-slate-800/90 rounded-2xl p-3 sm:p-4 border border-slate-700/80 shadow-md space-y-3 anim-fade-in">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Danh sách chờ Track (1-Tap Play)
                </span>
              </div>

              <div className="flex items-center p-0.5 bg-slate-900 rounded-lg text-[10px] font-bold border border-slate-700">
                <button
                  onClick={() => setReadyTab('presets')}
                  className={`px-2 py-0.5 rounded-md transition ${
                    readyTab === 'presets' ? 'bg-violet-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Mẫu phổ biến
                </button>
                <button
                  onClick={() => setReadyTab('tasks')}
                  className={`px-2 py-0.5 rounded-md transition ${
                    readyTab === 'tasks' ? 'bg-violet-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Nhiệm vụ ({activeTasks.length})
                </button>
                <button
                  onClick={() => setReadyTab('plans')}
                  className={`px-2 py-0.5 rounded-md transition ${
                    readyTab === 'plans' ? 'bg-violet-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Kế hoạch ({activePlanSlots.length})
                </button>
              </div>
            </div>

            {/* Tab: Presets */}
            {readyTab === 'presets' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                {presets.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const matchedCat = categories.find(c => c.name.toLowerCase().includes(p.catName.toLowerCase().slice(0, 5)))
                      handleStartQuickTrack(p.title, matchedCat?.id)
                    }}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center justify-between gap-2 hover:border-violet-500 cursor-pointer transition active:scale-98"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{p.title}</div>
                      <div className="text-[10px] text-slate-400">{p.catName}</div>
                    </div>
                    <Play className="w-3.5 h-3.5 text-violet-400 fill-current shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Tasks */}
            {readyTab === 'tasks' && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {activeTasks.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-500">
                    Không có nhiệm vụ nào chưa xong.
                  </div>
                ) : (
                  activeTasks.map(task => (
                    <div
                      key={task.id}
                      className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center justify-between gap-2 hover:border-violet-500 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{task.title}</div>
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
                        className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs active:scale-95 transition shrink-0"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Track</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Plans */}
            {readyTab === 'plans' && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {activePlanSlots.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-500">
                    Không có kế hoạch nào hôm nay.
                  </div>
                ) : (
                  activePlanSlots.map(slot => (
                    <div
                      key={slot.id}
                      className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center justify-between gap-2 hover:border-violet-500 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-mono font-bold text-sky-400 bg-sky-950 px-1 py-0.2 rounded border border-sky-800">
                          {slot.start_time} - {slot.end_time}
                        </span>
                        <div className="text-xs font-bold text-white mt-0.5 truncate">{slot.title}</div>
                      </div>
                      <button
                        onClick={() => handleTrackPlanSlot(slot)}
                        className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs active:scale-95 transition shrink-0"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Track</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ── D. TODAY'S ACTUAL TIME LOG STREAM (APP-LIKE HIGH DENSITY LIST) ── */}
        <div className="bg-slate-800/90 rounded-2xl p-3 sm:p-4 border border-slate-700/80 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                Các phiên đã Track hôm nay ({logs.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              Nhấp vào để sửa thông tin ✎
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <Clock className="w-8 h-8 mx-auto opacity-30 text-violet-400" />
              <p className="text-xs font-bold text-slate-400">Chưa có phiên tracking nào hôm nay</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Bấm nút "Track ngay" ở trên hoặc bắt đầu bấm giờ để ghi nhận thời gian thực tế.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => {
                const durMins = Math.round((log.duration_seconds || 0) / 60)
                const logTitle = log.task_title || log.habit_title || log.notes || 'Phiên tập trung'

                return (
                  <div
                    key={log.id}
                    onClick={() => handleOpenEditModal(log)}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-violet-500/80 flex items-center justify-between gap-3 cursor-pointer transition active:scale-98 group"
                  >
                    {/* Category Color Indicator Bar */}
                    <div
                      className="w-1.5 self-stretch rounded-full shrink-0"
                      style={{ backgroundColor: log.category_color || '#8B5CF6' }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-violet-300 bg-violet-950/80 px-1.5 py-0.2 rounded border border-violet-800/80">
                          {formatLocalTime(log.start_time)} - {formatLocalTime(log.end_time)} ({durMins}p)
                        </span>

                        <span className="text-[9px] font-bold uppercase text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                          {log.timer_type === 'stopwatch' ? '⏱️ Bấm giờ' : log.timer_type === 'pomodoro' ? '🔥 Pomodoro' : '📝 Thủ công'}
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

                      <h4 className="text-xs font-bold text-white mt-1 truncate group-hover:text-violet-300 transition">
                        {logTitle}
                      </h4>
                    </div>

                    {/* Edit Icon & Delete Action */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="p-1.5 text-slate-400 group-hover:text-violet-400 transition" title="Chỉnh sửa log">
                        <Edit3 className="w-3.5 h-3.5" />
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteLog(log.id)
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                        title="Xóa log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── 3. EDIT LOG MODAL / BOTTOM SHEET ── */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs anim-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-black text-white">Chỉnh sửa phiên Tracking</h3>
              </div>
              <button
                onClick={() => setEditingLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLog} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nội dung hoạt động *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Danh mục
                </label>
                <select
                  value={editCategoryId || ''}
                  onChange={e => setEditCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 outline-none focus:border-violet-500"
                >
                  <option value="">-- Không có danh mục --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Bắt đầu
                  </label>
                  <input
                    type="time"
                    required
                    value={editStartTime}
                    onChange={e => setEditStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-white outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Kết thúc
                  </label>
                  <input
                    type="time"
                    required
                    value={editEndTime}
                    onChange={e => setEditEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-white outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeleteLog(editingLog.id)}
                  className="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa log</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLog(null)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black transition active:scale-95 shadow-md shadow-violet-600/30"
                  >
                    {isSavingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 4. MANUAL QUICK LOG MODAL ── */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs anim-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-black text-white">Ghi nhận thời gian đã làm</h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualLog} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nội dung hoạt động *
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                  placeholder="Ví dụ: Đã đi làm, Đã họp Sprint, Đã tập gym..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Danh mục
                </label>
                <select
                  value={manualCategoryId || ''}
                  onChange={e => setManualCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 outline-none focus:border-violet-500"
                >
                  <option value="">-- Không có danh mục --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Bắt đầu
                  </label>
                  <input
                    type="time"
                    required
                    value={manualStartTime}
                    onChange={e => setManualStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-white outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Kết thúc
                  </label>
                  <input
                    type="time"
                    required
                    value={manualEndTime}
                    onChange={e => setManualEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-white outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Ghi chú thêm (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={e => setManualNotes(e.target.value)}
                  placeholder="Ghi chú chi tiết kết quả..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-white outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black transition active:scale-95 shadow-md shadow-violet-600/30"
                >
                  {isSubmittingManual ? 'Đang lưu...' : 'Lưu log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
