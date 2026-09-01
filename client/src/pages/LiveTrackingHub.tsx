import React, { useState, useEffect, useMemo } from 'react'
import {
  Clock, Play, Pause, Square, Plus, Trash2, Calendar as CalendarIcon,
  Flame, Target, Edit3, X, ListTodo, Wallet, Tag
} from 'lucide-react'
import { useTimerStore, type ActiveTrack } from '../store/useTimerStore'
import { useTimeLogStore, type TimeLogItem } from '../store/useTimeLogStore'
import { useTaskStore, type Task } from '../store/useTaskStore'
import { useHabitStore, type Habit } from '../store/useHabitStore'
import { useScheduleStore, type ScheduleSlot } from '../store/useScheduleStore'
import { sounds } from '../utils/soundEffects'

interface Props {
  onOpenFullscreenFocus: () => void
}

type MainTab = 'active' | 'ready' | 'history'
type ReadySubTab = 'all' | 'tasks' | 'habits' | 'plans'

export const LiveTrackingHub: React.FC<Props> = ({ onOpenFullscreenFocus }) => {
  const {
    activeTracks,
    fetchActiveTracks,
    startNewTrack,
    updateActiveTrack,
    pauseTrack,
    resumeTrack,
    stopTrack,
    cancelTrack
  } = useTimerStore()

  const { logs, fetchLogs, createLog, updateLog, deleteLog } = useTimeLogStore()
  const { tasks, categories, fetchTasks, fetchCategories } = useTaskStore()
  const { habits, fetchHabits } = useHabitStore()
  const { slots, fetchSlots } = useScheduleStore()

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], [])

  // 3 Primary Tabs
  const [activeTab, setActiveTab] = useState<MainTab>('active')
  const [readySubTab, setReadySubTab] = useState<ReadySubTab>('all')

  // Simple Track Input State (Only in 'active' tab)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickCategoryId, setQuickCategoryId] = useState<number | null>(null)

  // Edit Running Track Modal State
  const [editingActiveTrack, setEditingActiveTrack] = useState<ActiveTrack | null>(null)
  const [editActiveTitle, setEditActiveTitle] = useState('')
  const [editActiveCategoryId, setEditActiveCategoryId] = useState<number | null>(null)
  const [editActiveStartTime, setEditActiveStartTime] = useState('')

  // Edit Completed Log Modal State
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
    fetchActiveTracks()
    fetchLogs(todayIso)
    fetchTasks()
    fetchHabits()
    fetchCategories()
    fetchSlots(todayIso)
  }, [])

  // Formatted timer digits (HH:MM:SS)
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

  const formatTrackStartTime = (dateObj: Date) => {
    try {
      const d = new Date(dateObj)
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    } catch {
      return ''
    }
  }

  const formatDurationDisplay = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600)
    const mins = Math.round((totalSec % 3600) / 60)
    if (hours === 0 && mins === 0) return '< 1p'
    if (hours === 0) return `${mins}p`
    return `${hours}h ${mins > 0 ? `${mins}p` : ''}`
  }

  const totalLoggedSeconds = useMemo(() => {
    return logs.reduce((acc, cur) => acc + (cur.duration_seconds || 0), 0)
  }, [logs])

  const totalLoggedFormatted = useMemo(() => {
    return formatDurationDisplay(totalLoggedSeconds)
  }, [totalLoggedSeconds])

  // MISA Ledger Breakdown
  const ledgerBreakdown = useMemo(() => {
    let productiveSec = 0
    let neutralSec = 0
    let wastedSec = 0

    logs.forEach(l => {
      const cat = categories.find(c => c.id === l.category_id)
      const type = cat?.category_type || 'productive'
      if (type === 'wasted') wastedSec += l.duration_seconds || 0
      else if (type === 'neutral') neutralSec += l.duration_seconds || 0
      else productiveSec += l.duration_seconds || 0
    })

    return {
      productive: formatDurationDisplay(productiveSec),
      neutral: formatDurationDisplay(neutralSec),
      wasted: formatDurationDisplay(wastedSec)
    }
  }, [logs, categories])

  // Start Track: Explicitly NULL category if none selected
  const handleStartTrack = async (customTitle?: string, catId?: number | null) => {
    sounds.playTap()
    const chosenTitle = customTitle || quickTitle.trim() || 'Hoạt động thực tế'
    const chosenCatId = catId !== undefined ? catId : quickCategoryId
    const matchedCat = chosenCatId ? categories.find(c => c.id === chosenCatId) : null

    await startNewTrack({
      title: chosenTitle,
      categoryId: matchedCat?.id || null,
      categoryName: matchedCat?.name || null,
      categoryColor: matchedCat?.color || null,
      categoryType: matchedCat?.category_type || 'productive',
      mode: 'stopwatch'
    })

    setQuickTitle('')
    setQuickCategoryId(null)
    setActiveTab('active')
  }

  const handleTrackTask = async (task: Task) => {
    sounds.playTap()
    await startNewTrack({
      title: task.title,
      taskId: task.id,
      categoryId: task.category?.id || null,
      categoryName: task.category?.name || null,
      categoryColor: task.category?.color || null,
      mode: 'stopwatch'
    })
    setActiveTab('active')
  }

  const handleTrackHabit = async (habit: Habit) => {
    sounds.playTap()
    await startNewTrack({
      title: habit.title,
      habitId: habit.id,
      categoryId: habit.category?.id || habit.category_id || null,
      categoryName: habit.category?.name || null,
      categoryColor: habit.color || null,
      mode: 'stopwatch'
    })
    setActiveTab('active')
  }

  const handleTrackPlanSlot = async (slot: ScheduleSlot) => {
    sounds.playTap()
    await startNewTrack({
      title: slot.title,
      categoryId: slot.category_id || null,
      categoryName: slot.category?.name || null,
      categoryColor: slot.category?.color || null,
      mode: 'stopwatch'
    })
    setActiveTab('active')
  }

  const handleFinishTrack = async (trackId: string) => {
    sounds.playTap()
    await stopTrack(trackId)
    sounds.playSuccess()
    fetchLogs(todayIso)
  }

  // ── Open Edit Running Track Modal ──
  const handleOpenEditActiveTrack = (track: ActiveTrack) => {
    sounds.playTap()
    setEditingActiveTrack(track)
    setEditActiveTitle(track.title)
    setEditActiveCategoryId(track.categoryId || null)
    try {
      const d = new Date(track.startTime)
      setEditActiveStartTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
    } catch {
      setEditActiveStartTime('09:00')
    }
  }

  const handleSaveActiveTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingActiveTrack) return

    sounds.playTap()
    const chosenCat = categories.find(c => c.id === editActiveCategoryId)
    
    // Parse adjusted start time
    let adjustedStartDate = editingActiveTrack.startTime
    if (editActiveStartTime) {
      const [hh, mm] = editActiveStartTime.split(':').map(Number)
      const d = new Date()
      d.setHours(hh, mm, 0, 0)
      adjustedStartDate = d
    }

    await updateActiveTrack(editingActiveTrack.id, {
      title: editActiveTitle.trim() || 'Hoạt động thực tế',
      categoryId: chosenCat?.id || null,
      categoryName: chosenCat?.name || null,
      categoryColor: chosenCat?.color || null,
      categoryType: chosenCat?.category_type || 'productive',
      startTime: adjustedStartDate
    })

    sounds.playSuccess()
    setEditingActiveTrack(null)
  }

  // ── Open Edit Completed Log Modal ──
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC] text-slate-900">
      {/* ── 1. HEADER BAR ── */}
      <header className="shrink-0 bg-white border-b border-slate-200/90 px-4 py-3 sm:px-6 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs shadow-violet-600/30">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-slate-900">Tracking Hub</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 font-mono border border-emerald-200">
                ACTUAL
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Bấm giờ thực tế & sổ thu chi thời gian hàng ngày
            </p>
          </div>
        </div>

        {/* Right Pill + Quick Add */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-right shadow-2xs">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Hôm nay</span>
            <span className="text-xs sm:text-sm font-black text-violet-700 font-mono">
              {totalLoggedFormatted}
            </span>
          </div>

          <button
            onClick={() => { sounds.playTap(); setShowManualModal(true) }}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold border border-violet-200 flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
            title="Ghi nhận log thủ công"
          >
            <Plus className="w-4 h-4 text-violet-600" />
            <span className="hidden sm:inline">Ghi sổ</span>
          </button>
        </div>
      </header>

      {/* ── 2. SCROLLABLE MIDDLE CONTENT AREA ── */}
      <main className="flex-1 overflow-y-auto px-3.5 py-3.5 sm:px-6 sm:py-4 max-w-3xl w-full mx-auto">

        {/* ── TAB 1: ĐANG TRACK (ACTIVE TRACKS) ── */}
        {activeTab === 'active' && (
          <div className="space-y-3 anim-fade-in">
            {activeTracks.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-2xs text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Play className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Chưa có việc nào đang track</h3>
                  <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1">
                    Gõ việc vào thanh bên dưới và bấm <b>[Track]</b> hoặc chuyển sang tab <b>"Chờ Track"</b> để bắt đầu ngay!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700 font-mono">
                      Đang Bấm Giờ ({activeTracks.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Chạm thẻ hoặc bấm [✎] để sửa thông tin
                  </span>
                </div>

                <div className="space-y-2">
                  {activeTracks.map(track => (
                    <div
                      key={track.id}
                      className="bg-white rounded-2xl p-3.5 border border-emerald-300 shadow-sm shadow-emerald-500/10 flex items-center justify-between gap-3 anim-fade-in"
                    >
                      <div
                        className="w-1.5 self-stretch rounded-full shrink-0"
                        style={{ backgroundColor: track.categoryColor || '#94A3B8' }}
                      />

                      {/* Tap to edit info */}
                      <div
                        onClick={() => handleOpenEditActiveTrack(track)}
                        className="min-w-0 flex-1 cursor-pointer group"
                        title="Chạm để sửa tên & danh mục việc đang track"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-violet-700 transition">
                            {track.title}
                          </h3>
                          {track.categoryName ? (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.2 rounded-md text-white shadow-2xs"
                              style={{ backgroundColor: track.categoryColor || '#8B5CF6' }}
                            >
                              {track.categoryName}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-400 border border-slate-200">
                              Chưa có danh mục
                            </span>
                          )}
                          <Edit3 className="w-3 h-3 text-slate-300 group-hover:text-violet-600 transition" />
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Bắt đầu: {formatTrackStartTime(track.startTime)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="bg-slate-900 text-emerald-400 font-mono font-black text-sm sm:text-base px-2.5 py-1 rounded-xl shadow-xs">
                          {formatClockDigits(track.elapsedSeconds)}
                        </div>

                        <button
                          onClick={() => {
                            sounds.playTap()
                            track.isPaused ? resumeTrack(track.id) : pauseTrack(track.id)
                          }}
                          className="p-1.5 sm:px-2 sm:py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
                          title={track.isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                        >
                          {track.isPaused ? <Play className="w-3.5 h-3.5 fill-current text-emerald-600" /> : <Pause className="w-3.5 h-3.5 fill-current text-amber-600" />}
                        </button>

                        <button
                          onClick={() => handleFinishTrack(track.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1 shadow-xs transition active:scale-95"
                          title="Kết thúc và lưu vào sổ"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>Kết thúc</span>
                        </button>

                        <button
                          onClick={() => { sounds.playTap(); cancelTrack(track.id) }}
                          className="p-1.5 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition"
                          title="Hủy bỏ"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: CHỜ TRACK (READY TASKS, HABITS, PLANS) ── */}
        {activeTab === 'ready' && (
          <div className="space-y-3 anim-fade-in">
            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setReadySubTab('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  readySubTab === 'all' ? 'bg-violet-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Tất cả ({activeTasks.length + habits.length + activePlanSlots.length})
              </button>
              <button
                onClick={() => setReadySubTab('tasks')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  readySubTab === 'tasks' ? 'bg-violet-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Nhiệm vụ ({activeTasks.length})
              </button>
              <button
                onClick={() => setReadySubTab('habits')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  readySubTab === 'habits' ? 'bg-violet-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Thói quen ({habits.length})
              </button>
              <button
                onClick={() => setReadySubTab('plans')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  readySubTab === 'plans' ? 'bg-violet-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Kế hoạch ({activePlanSlots.length})
              </button>
            </div>

            {/* List Tasks */}
            {(readySubTab === 'all' || readySubTab === 'tasks') && activeTasks.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1">
                  <ListTodo className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nhiệm vụ chưa xong</span>
                </div>
                {activeTasks.map(task => (
                  <div
                    key={`task_${task.id}`}
                    className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-violet-300 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-slate-900 truncate">{task.title}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {task.category ? (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white shadow-2xs"
                            style={{ backgroundColor: task.category.color }}
                          >
                            {task.category.name}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-400">
                            Chưa có danh mục
                          </span>
                        )}
                        {task.due_date && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Hạn: {task.due_date.slice(11, 16) || task.due_date.slice(0, 10)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleTrackTask(task)}
                      className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black flex items-center gap-1 shadow-xs active:scale-95 transition shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Track</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* List Habits */}
            {(readySubTab === 'all' || readySubTab === 'habits') && habits.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Thói quen hôm nay</span>
                </div>
                {habits.map(habit => (
                  <div
                    key={`habit_${habit.id}`}
                    className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-amber-300 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 truncate">{habit.title}</span>
                        {habit.current_streak > 0 && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-md font-mono border border-amber-200 shrink-0">
                            🔥 {habit.current_streak}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-mono">
                        {habit.reminder_time && <span>Nhắc lúc: {habit.reminder_time}</span>}
                        <span>• Mục tiêu: {habit.target_count} {habit.unit}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTrackHabit(habit)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center gap-1 shadow-xs active:scale-95 transition shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Track</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* List Plans */}
            {(readySubTab === 'all' || readySubTab === 'plans') && activePlanSlots.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-sky-600" />
                  <span>Kế hoạch lịch trình</span>
                </div>
                {activePlanSlots.map(slot => (
                  <div
                    key={`slot_${slot.id}`}
                    className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-sky-300 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-mono font-bold text-sky-800 bg-sky-100 px-1.5 py-0.2 rounded border border-sky-200">
                        {slot.start_time} - {slot.end_time}
                      </span>
                      <div className="text-xs font-black text-slate-900 mt-1 truncate">{slot.title}</div>
                    </div>

                    <button
                      onClick={() => handleTrackPlanSlot(slot)}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black flex items-center gap-1 shadow-xs active:scale-95 transition shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Track</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: SỔ NHẬT KÝ (MISA TIME LEDGER) ── */}
        {activeTab === 'history' && (
          <div className="space-y-3.5 anim-fade-in">
            {/* Daily summary */}
            <div className="bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-xl shadow-indigo-950/20 space-y-3 border border-indigo-700/40">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300 block font-mono">
                    Sổ Thu Chi Thời Gian • Hôm Nay
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-0.5">
                    {totalLoggedFormatted}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block font-mono">Tổng số phiên</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {logs.length} bản ghi
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 block">
                    🟢 Tạo giá trị
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-white mt-0.5 block">
                    {ledgerBreakdown.productive}
                  </span>
                </div>

                <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-sky-300 block">
                    🔵 Trung tính
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-white mt-0.5 block">
                    {ledgerBreakdown.neutral}
                  </span>
                </div>

                <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-rose-300 block">
                    🔴 Lãng phí
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-white mt-0.5 block">
                    {ledgerBreakdown.wasted}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Stream */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-violet-600" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Nhật Ký Dòng Thời Gian Hôm Nay
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  Chạm để xem/sửa ✎
                </span>
              </div>

              {logs.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto opacity-30 text-violet-600" />
                  <p className="text-xs font-bold text-slate-600">Chưa có bản ghi thời gian nào hôm nay</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Các hoạt động sau khi hoàn thành sẽ được ghi chép chi tiết vào đây như sổ thu chi.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {logs.map(log => {
                    const durDisplay = formatDurationDisplay(log.duration_seconds || 0)
                    const logTitle = log.task_title || log.habit_title || log.notes || 'Phiên tập trung'
                    const catColor = log.category_color || '#8B5CF6'

                    return (
                      <div
                        key={log.id}
                        onClick={() => handleOpenEditModal(log)}
                        className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-violet-50/40 rounded-2xl cursor-pointer transition active:scale-99 group"
                      >
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs font-bold text-sm"
                          style={{ backgroundColor: catColor }}
                        >
                          {logTitle.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-violet-700 transition">
                            {logTitle}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5 flex-wrap">
                            <span className="text-slate-600 font-bold">
                              {formatLocalTime(log.start_time)} - {formatLocalTime(log.end_time)}
                            </span>
                            <span>•</span>
                            <span className="text-slate-500">
                              {log.timer_type === 'stopwatch' ? '⏱️ Bấm giờ' : log.timer_type === 'pomodoro' ? '🔥 Pomodoro' : '📝 Thủ công'}
                            </span>
                            {log.category_name ? (
                              <>
                                <span>•</span>
                                <span className="font-bold" style={{ color: catColor }}>
                                  {log.category_name}
                                </span>
                              </>
                            ) : (
                              <>
                                <span>•</span>
                                <span className="text-slate-400 font-medium">Chưa có danh mục</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm sm:text-base font-black font-mono text-violet-700">
                            +{durDisplay}
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">
                            Đã nạp
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── 3. NATURAL BOTTOM DOCKED CONTROLS ── */}
      <div className="shrink-0 bg-white border-t border-slate-200 px-3 py-2 sm:px-6 z-10 shadow-md">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Track Bar with Category Selector (Shown ONLY in 'active' tab) */}
          {activeTab === 'active' && (
            <div className="flex items-center gap-1.5 anim-fade-in">
              {/* Compact Category Selector (Defaults to No Category) */}
              <select
                value={quickCategoryId || ''}
                onChange={e => setQuickCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="px-2 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-violet-500 transition shrink-0 max-w-[110px]"
              >
                <option value="">📁 Không mục</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                placeholder="Nhập việc (Ví dụ: Đi làm, Họp...)"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-violet-500 transition shadow-inner min-w-0"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleStartTrack()
                }}
              />

              <button
                onClick={() => handleStartTrack()}
                className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black flex items-center justify-center gap-1 shadow-md shadow-violet-600/30 active:scale-95 transition shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Track</span>
              </button>
            </div>
          )}

          {/* 3 Primary Tabs Switcher */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => { sounds.playTap(); setActiveTab('active') }}
              className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                activeTab === 'active'
                  ? 'bg-white text-violet-950 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {activeTracks.length > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${activeTracks.length > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              </span>
              <span>Đang Track</span>
              {activeTracks.length > 0 && (
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                  {activeTracks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { sounds.playTap(); setActiveTab('ready') }}
              className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                activeTab === 'ready'
                  ? 'bg-white text-violet-950 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-violet-600" />
              <span>Chờ Track</span>
              <span className="text-[10px] font-mono font-bold bg-violet-100 text-violet-800 px-1.5 py-0.2 rounded-full">
                {activeTasks.length + habits.length}
              </span>
            </button>

            <button
              onClick={() => { sounds.playTap(); setActiveTab('history') }}
              className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                activeTab === 'history'
                  ? 'bg-white text-violet-950 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sổ Nhật Ký</span>
              {logs.length > 0 && (
                <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">
                  {logs.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. MODAL: SỬA THÔNG TIN VIỆC ĐANG BẤM GIỜ (EDIT RUNNING TRACK) ── */}
      {editingActiveTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs anim-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">Sửa thông tin việc đang bấm giờ</h3>
              </div>
              <button
                onClick={() => setEditingActiveTrack(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveActiveTrack} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nội dung hoạt động *
                </label>
                <input
                  type="text"
                  required
                  value={editActiveTitle}
                  onChange={e => setEditActiveTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Danh mục
                </label>
                <select
                  value={editActiveCategoryId || ''}
                  onChange={e => setEditActiveCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-violet-500"
                >
                  <option value="">-- Không có danh mục --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Giờ bắt đầu
                </label>
                <input
                  type="time"
                  value={editActiveStartTime}
                  onChange={e => setEditActiveStartTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingActiveTrack(null)}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition active:scale-95 shadow-md shadow-emerald-600/30"
                >
                  Lưu cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. MODAL: SỬA LOG ĐÃ HOÀN THÀNH ── */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs anim-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-black text-slate-900">Chỉnh sửa phiên Tracking</h3>
              </div>
              <button
                onClick={() => setEditingLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLog} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nội dung hoạt động *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Danh mục
                </label>
                <select
                  value={editCategoryId || ''}
                  onChange={e => setEditCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-violet-500"
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Bắt đầu
                  </label>
                  <input
                    type="time"
                    required
                    value={editStartTime}
                    onChange={e => setEditStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Kết thúc
                  </label>
                  <input
                    type="time"
                    required
                    value={editEndTime}
                    onChange={e => setEditEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteLog(editingLog.id)}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1 border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa log</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLog(null)}
                    className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200"
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

      {/* ── 6. MANUAL QUICK LOG MODAL ── */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs anim-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-black text-slate-900">Ghi nhận thời gian đã làm</h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualLog} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nội dung hoạt động *
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                  placeholder="Ví dụ: Đã đi làm, Đã họp Sprint, Đã tập gym..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Danh mục
                </label>
                <select
                  value={manualCategoryId || ''}
                  onChange={e => setManualCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-violet-500"
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Bắt đầu
                  </label>
                  <input
                    type="time"
                    required
                    value={manualStartTime}
                    onChange={e => setManualStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Kết thúc
                  </label>
                  <input
                    type="time"
                    required
                    value={manualEndTime}
                    onChange={e => setManualEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Ghi chú thêm (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={e => setManualNotes(e.target.value)}
                  placeholder="Ghi chú chi tiết kết quả..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200"
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
