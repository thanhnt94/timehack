import React, { useState, useEffect, useMemo } from 'react'
import {
  Clock, Plus, Trash2, Calendar as CalendarIcon,
  Tag, ChevronLeft, ChevronRight, Folder, ArrowUpDown, X, Edit3
} from 'lucide-react'
import { useTimeLogStore, type TimeLogItem } from '../store/useTimeLogStore'
import { useTaskStore } from '../store/useTaskStore'
import { sounds } from '../utils/soundEffects'

type LedgerGroupMode = 'time' | 'category'
type LedgerSortOrder = 'desc' | 'asc'

export const TimeLedgerView: React.FC = () => {
  const { logs, fetchLogs, createLog, updateLog, deleteLog } = useTimeLogStore()
  const { categories, fetchCategories } = useTaskStore()

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Time Ledger Date & View state
  const [ledgerDate, setLedgerDate] = useState<string>(todayIso)
  const [ledgerGroupMode, setLedgerGroupMode] = useState<LedgerGroupMode>('time')
  const [ledgerSortOrder, setLedgerSortOrder] = useState<LedgerSortOrder>('desc')

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
    fetchLogs(ledgerDate)
    fetchCategories()
  }, [])

  const formatLocalTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch {
      return ''
    }
  }

  const formatDurationDisplay = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600)
    const mins = Math.round((totalSec % 3600) / 60)
    if (hours === 0 && mins === 0) return '< 1m'
    if (hours === 0) return `${mins}m`
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
  }

  // Date navigation helpers
  const getFormattedDateHeading = (dateStr: string) => {
    try {
      const parts = dateStr.split('-').map(Number)
      const d = new Date(parts[0], parts[1] - 1, parts[2])
      const today = new Date()
      const todayYmd = today.toISOString().split('T')[0]
      
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      const yesterdayYmd = yesterday.toISOString().split('T')[0]
      
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      const tomorrowYmd = tomorrow.toISOString().split('T')[0]

      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
      const dayName = dayNames[d.getDay()]

      if (dateStr === todayYmd) {
        return `Hôm nay, ${d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}`
      }
      if (dateStr === yesterdayYmd) {
        return `Hôm qua, ${d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}`
      }
      if (dateStr === tomorrowYmd) {
        return `Ngày mai, ${d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}`
      }
      return `${dayName}, ${d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}`
    } catch {
      return dateStr
    }
  }

  const shiftLedgerDate = (offsetDays: number) => {
    sounds.playTap()
    try {
      const parts = ledgerDate.split('-').map(Number)
      const cur = new Date(parts[0], parts[1] - 1, parts[2])
      cur.setDate(cur.getDate() + offsetDays)
      const y = cur.getFullYear()
      const m = String(cur.getMonth() + 1).padStart(2, '0')
      const d = String(cur.getDate()).padStart(2, '0')
      const newIso = `${y}-${m}-${d}`
      setLedgerDate(newIso)
      fetchLogs(newIso)
    } catch {
      // Ignore
    }
  }

  const setLedgerDateDirectly = (newIso: string) => {
    if (!newIso) return
    sounds.playTap()
    setLedgerDate(newIso)
    fetchLogs(newIso)
  }

  const totalLoggedSeconds = useMemo(() => {
    return (logs || []).reduce((acc, cur) => acc + (cur?.duration_seconds || 0), 0)
  }, [logs])

  const totalLoggedFormatted = useMemo(() => {
    return formatDurationDisplay(totalLoggedSeconds)
  }, [totalLoggedSeconds])

  // Ledger Breakdown
  const ledgerBreakdown = useMemo(() => {
    let productiveSec = 0
    let neutralSec = 0
    let wastedSec = 0

    ;(logs || []).forEach(l => {
      const cat = (categories || []).find(c => c?.id === l?.category_id)
      const type = cat?.category_type || 'productive'
      if (type === 'wasted') wastedSec += l?.duration_seconds || 0
      else if (type === 'neutral') neutralSec += l?.duration_seconds || 0
      else productiveSec += l?.duration_seconds || 0
    })

    return {
      productive: formatDurationDisplay(productiveSec),
      neutral: formatDurationDisplay(neutralSec),
      wasted: formatDurationDisplay(wastedSec)
    }
  }, [logs, categories])

  // Sorted logs list
  const sortedLogs = useMemo(() => {
    const list = [...(logs || [])]
    list.sort((a, b) => {
      const timeA = new Date(a.start_time).getTime()
      const timeB = new Date(b.start_time).getTime()
      return ledgerSortOrder === 'desc' ? timeB - timeA : timeA - timeB
    })
    return list
  }, [logs, ledgerSortOrder])

  // Logs grouped by category
  const categoryGroupedLogs = useMemo(() => {
    const groups: {
      categoryId: number | null
      categoryName: string
      categoryColor: string
      categoryType: string
      totalDurationSeconds: number
      logs: TimeLogItem[]
    }[] = []

    const map = new Map<number | null, typeof groups[0]>()

    ;(sortedLogs || []).forEach(log => {
      const catId = log.category_id || null
      if (!map.has(catId)) {
        const cat = (categories || []).find(c => c.id === catId)
        const groupObj = {
          categoryId: catId,
          categoryName: cat?.name || log.category_name || 'Không danh mục',
          categoryColor: cat?.color || log.category_color || '#94A3B8',
          categoryType: cat?.category_type || 'neutral',
          totalDurationSeconds: 0,
          logs: []
        }
        map.set(catId, groupObj)
        groups.push(groupObj)
      }
      const group = map.get(catId)!
      group.totalDurationSeconds += log.duration_seconds || 0
      group.logs.push(log)
    })

    // Sort categories: highest total duration first
    groups.sort((a, b) => b.totalDurationSeconds - a.totalDurationSeconds)
    return groups
  }, [sortedLogs, categories])

  // ── Open Edit Completed Log Modal ──
  const handleOpenEditModal = (log: TimeLogItem) => {
    sounds.playTap()
    setEditingLog(log)
    setEditTitle(log.notes || log.task_title || log.habit_title || 'Phiên tập trung')
    setEditCategoryId(log.category_id || null)
    
    try {
      const st = new Date(log.start_time)
      const et = new Date(log.end_time)
      setEditStartTime(`${String(st.getHours()).padStart(2, '0')}:${String(st.getMinutes()).padStart(2, '0')}`)
      setEditEndTime(`${String(et.getHours()).padStart(2, '0')}:${String(et.getMinutes()).padStart(2, '0')}`)
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

      const startIso = `${ledgerDate}T${editStartTime}:00`
      const endIso = `${ledgerDate}T${editEndTime}:00`

      await updateLog(editingLog.id, {
        notes: editTitle.trim(),
        category_id: editCategoryId || undefined,
        start_time: startIso,
        end_time: endIso,
        duration_seconds: calcDuration * 60
      })

      sounds.playSuccess()
      setEditingLog(null)
      fetchLogs(ledgerDate)
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

      const startIso = `${ledgerDate}T${manualStartTime}:00`
      const endIso = `${ledgerDate}T${manualEndTime}:00`

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
      fetchLogs(ledgerDate)
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
    fetchLogs(ledgerDate)
  }

  // Render single log card
  const renderLogCard = (log: TimeLogItem) => {
    const durDisplay = formatDurationDisplay(log.duration_seconds || 0)
    const logTitle = log.task_title || log.habit_title || log.notes || 'Phiên tập trung'
    const catColor = log.category_color || '#8B5CF6'

    return (
      <div
        key={log.id}
        onClick={() => handleOpenEditModal(log)}
        className="py-2.5 px-3 flex items-center justify-between gap-3 hover:bg-violet-50/50 rounded-2xl cursor-pointer transition active:scale-99 group"
      >
        <div
          className="w-1.5 h-8 rounded-full shrink-0 shadow-2xs"
          style={{ backgroundColor: catColor }}
        />

        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-sm font-black text-slate-800 truncate group-hover:text-violet-700 transition">
            {logTitle}
          </h4>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5 flex-wrap">
            <span className="text-slate-600 font-bold">
              {formatLocalTime(log.start_time)} - {formatLocalTime(log.end_time)}
            </span>
            <span>•</span>
            <span className="text-slate-500">
              {log.timer_type === 'stopwatch' ? '⏱️ Bấm giờ' : log.timer_type === 'pomodoro' ? '🔥 Pomodoro' : '📝 Thủ công'}
            </span>
            {log.category_name && ledgerGroupMode === 'time' && (
              <>
                <span>•</span>
                <span className="font-bold" style={{ color: catColor }}>
                  {log.category_name}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs sm:text-sm font-black font-mono text-violet-700">
            +{durDisplay}
          </div>
          <span className="text-[9px] font-bold text-slate-400 block uppercase">
            Đã ghi nhận
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC] text-slate-900">
      {/* ── 1. SCROLLABLE CONTENT ── */}
      <main className="flex-1 overflow-y-auto px-3.5 pt-2 pb-4 sm:px-6 sm:pt-3 max-w-3xl w-full mx-auto space-y-3">
        {/* ── DATE NAVIGATION BAR ── */}
        <div className="bg-white rounded-2xl p-2 px-3 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2">
          <button
            onClick={() => shiftLedgerDate(-1)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition active:scale-90 cursor-pointer"
            title="Ngày trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Clickable Date with Hidden Native Date Picker */}
          <div className="relative flex items-center gap-1.5 cursor-pointer group">
            <input
              type="date"
              value={ledgerDate}
              onChange={e => setLedgerDateDirectly(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              title="Chọn ngày cụ thể"
            />
            <CalendarIcon className="w-4 h-4 text-violet-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-violet-700 transition">
              {getFormattedDateHeading(ledgerDate)}
            </span>
            {ledgerDate !== todayIso && (
              <button
                onClick={(e) => { e.stopPropagation(); setLedgerDateDirectly(todayIso) }}
                className="relative z-20 text-[10px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-lg active:scale-95 transition ml-1"
                title="Về hôm nay"
              >
                Hôm nay
              </button>
            )}
          </div>

          <button
            onClick={() => shiftLedgerDate(1)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition active:scale-90 cursor-pointer"
            title="Ngày sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Daily Summary Card */}
        <div className="bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 rounded-3xl p-4 text-white shadow-xl shadow-indigo-950/20 space-y-2.5 border border-indigo-700/40">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300 block font-mono">
                Sổ Thu Chi Thời Gian • {ledgerDate === todayIso ? 'Hôm nay' : ledgerDate}
              </span>
              <div className="text-2xl font-black font-mono tracking-tight text-white mt-0.5">
                {totalLoggedFormatted}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block font-mono">Tổng cộng</span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {logs.length} bản ghi
                </span>
              </div>
              <button
                onClick={() => { sounds.playTap(); setShowManualModal(true) }}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition active:scale-95 cursor-pointer"
                title="Thêm nhật ký thời gian thủ công"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-2xl p-2 border border-white/10 text-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 block">
                🟢 Hữu ích
              </span>
              <span className="text-xs font-black font-mono text-white mt-0.5 block">
                {ledgerBreakdown.productive}
              </span>
            </div>

            <div className="bg-white/10 rounded-2xl p-2 border border-white/10 text-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-sky-300 block">
                🔵 Trung tính
              </span>
              <span className="text-xs font-black font-mono text-white mt-0.5 block">
                {ledgerBreakdown.neutral}
              </span>
            </div>

            <div className="bg-white/10 rounded-2xl p-2 border border-white/10 text-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-rose-300 block">
                🔴 Lãng phí
              </span>
              <span className="text-xs font-black font-mono text-white mt-0.5 block">
                {ledgerBreakdown.wasted}
              </span>
            </div>
          </div>
        </div>

        {/* ── SORT & GROUPING CONTROLS ── */}
        <div className="flex items-center justify-between gap-2 px-1">
          {/* Group By Mode: Time vs Category */}
          <div className="inline-flex p-0.5 bg-slate-200/80 rounded-xl text-xs font-bold">
            <button
              onClick={() => { sounds.playTap(); setLedgerGroupMode('time') }}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                ledgerGroupMode === 'time'
                  ? 'bg-white text-violet-900 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Theo giờ</span>
            </button>
            <button
              onClick={() => { sounds.playTap(); setLedgerGroupMode('category') }}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                ledgerGroupMode === 'category'
                  ? 'bg-white text-violet-900 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-amber-500" />
              <span>Theo danh mục</span>
            </button>
          </div>

          {/* Sort Order Toggle (Only for Chronological Mode) */}
          {ledgerGroupMode === 'time' && (
            <button
              onClick={() => {
                sounds.playTap()
                setLedgerSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
              }}
              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition cursor-pointer"
              title="Đổi thứ tự sắp xếp"
            >
              <ArrowUpDown className="w-3 h-3 text-violet-600" />
              <span>{ledgerSortOrder === 'desc' ? 'Mới nhất ↓' : 'Cũ nhất ↑'}</span>
            </button>
          )}
        </div>

        {/* Transaction Stream / Grouped Stream */}
        {logs.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xs text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 mx-auto opacity-30 text-violet-600" />
            <p className="text-xs font-bold text-slate-600">
              Chưa có bản ghi thời gian nào cho ngày {ledgerDate}
            </p>
            <button
              onClick={() => { sounds.playTap(); setShowManualModal(true) }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 text-xs font-bold hover:bg-violet-100 transition active:scale-95 mt-1 border border-violet-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm ghi nhận thời gian</span>
            </button>
          </div>
        ) : ledgerGroupMode === 'time' ? (
          /* Chronological Stream */
          <div className="bg-white rounded-3xl p-2 sm:p-3 border border-slate-200 shadow-2xs">
            <div className="divide-y divide-slate-100">
              {sortedLogs.map(log => renderLogCard(log))}
            </div>
          </div>
        ) : (
          /* Category Folder Grouped View */
          <div className="space-y-3">
            {categoryGroupedLogs.map(group => {
              const durStr = formatDurationDisplay(group.totalDurationSeconds)
              const typeLabel = group.categoryType === 'wasted' ? '🔴 Lãng phí' : group.categoryType === 'neutral' ? '🔵 Trung tính' : '🟢 Hữu ích'
              
              return (
                <div
                  key={`cat_group_${group.categoryId || 'none'}`}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden"
                >
                  {/* Category Header Card */}
                  <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: group.categoryColor }}
                      />
                      <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                        {group.categoryName}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                        {typeLabel}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-black font-mono text-violet-700">
                        +{durStr}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 block font-mono">
                        {group.logs.length} bản ghi
                      </span>
                    </div>
                  </div>

                  {/* Items under this category */}
                  <div className="p-1 sm:p-2 divide-y divide-slate-100">
                    {group.logs.map(log => renderLogCard(log))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ── MODAL: MANUAL TIME LOG ADDITION ── */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm anim-fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                  📝
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  Ghi nhận thời gian thủ công
                </h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualLog} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Tên hoạt động *
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                  placeholder="Học bài, Họp, Tập gym, Đọc sách..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-500 transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Danh mục
                </label>
                <select
                  value={manualCategoryId || ''}
                  onChange={e => setManualCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-violet-500 transition"
                >
                  <option value="">📁 Không danh mục</option>
                  {(categories || []).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Bắt đầu
                  </label>
                  <input
                    type="time"
                    required
                    value={manualStartTime}
                    onChange={e => setManualStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Kết thúc
                  </label>
                  <input
                    type="time"
                    required
                    value={manualEndTime}
                    onChange={e => setManualEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Ghi chú (tùy chọn)
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={e => setManualNotes(e.target.value)}
                  placeholder="Ghi chú chi tiết kết quả..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-violet-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black shadow-md shadow-violet-600/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingManual ? 'Đang lưu...' : 'Lưu bản ghi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT COMPLETED TIME LOG ── */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm anim-fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  ✏️
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  Chỉnh sửa bản ghi thời gian
                </h3>
              </div>
              <button
                onClick={() => setEditingLog(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLog} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Tên hoạt động *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Danh mục
                </label>
                <select
                  value={editCategoryId || ''}
                  onChange={e => setEditCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-violet-500 transition"
                >
                  <option value="">📁 Không danh mục</option>
                  {(categories || []).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Bắt đầu
                  </label>
                  <input
                    type="time"
                    required
                    value={editStartTime}
                    onChange={e => setEditStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Kết thúc
                  </label>
                  <input
                    type="time"
                    required
                    value={editEndTime}
                    onChange={e => setEditEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-500 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteLog(editingLog.id)}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                  title="Xóa bản ghi"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLog(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black shadow-md shadow-violet-600/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
