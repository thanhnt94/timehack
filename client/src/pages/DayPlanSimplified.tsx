import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon, Plus, Check, Clock, Trash2, Edit3,
  Play, Sparkles, ChevronLeft, ChevronRight, CheckSquare, Tag,
  Zap, AlertCircle, ArrowRight, X, Layers
} from 'lucide-react'
import { useScheduleStore, type ScheduleSlot } from '../store/useScheduleStore'
import { useTaskStore, type Task } from '../store/useTaskStore'
import { useTimerStore } from '../store/useTimerStore'
import { sounds } from '../utils/soundEffects'

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

const minutesToTimeStr = (totalMins: number): string => {
  const h = Math.floor(totalMins / 60) % 24
  const m = totalMins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export const DayPlanSimplified: React.FC = () => {
  const { slots, selectedDate, setSelectedDate, fetchSlots, createSlot, updateSlot, toggleSlotDone, deleteSlot, isLoading } = useScheduleStore()
  const { tasks, categories, fetchTasks, fetchCategories } = useTaskStore()
  const { startTimer } = useTimerStore()

  // Form states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [slotTitle, setSlotTitle] = useState('')
  const [slotStart, setSlotStart] = useState('09:00')
  const [slotEnd, setSlotEnd] = useState('10:30')
  const [slotCategoryId, setSlotCategoryId] = useState<number | null>(null)
  const [slotNotes, setSlotNotes] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)

  // Edit modal
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editStart, setEditStart] = useState('09:00')
  const [editEnd, setEditEnd] = useState('10:30')
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null)
  const [editNotes, setEditNotes] = useState('')

  useEffect(() => {
    fetchSlots(selectedDate)
    fetchTasks()
    fetchCategories()
  }, [selectedDate])

  const todayIso = new Date().toISOString().split('T')[0]
  const tomorrowIso = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })()

  // Sorted slots for the selected date
  const sortedSlots = useMemo(() => {
    return [...(slots || [])].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
  }, [slots])

  // Total planned duration
  const totalPlannedMinutes = useMemo(() => {
    return sortedSlots.reduce((acc, slot) => {
      const s = timeToMinutes(slot.start_time)
      let e = timeToMinutes(slot.end_time)
      if (e <= s) e = slot.end_time === '00:00' ? 24 * 60 : s + 30
      return acc + Math.max(15, e - s)
    }, 0)
  }, [sortedSlots])

  const plannedHoursFormatted = (() => {
    const h = Math.floor(totalPlannedMinutes / 60)
    const m = totalPlannedMinutes % 60
    return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}` : `${m}m`
  })()

  const completedCount = sortedSlots.filter(s => s.is_done).length

  // Quick jump date handlers
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

  const handleSelectToday = () => {
    sounds.playTap()
    setSelectedDate(todayIso)
  }

  const handleSelectTomorrow = () => {
    sounds.playTap()
    setSelectedDate(tomorrowIso)
  }

  // Handle Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slotTitle.trim()) return
    sounds.playTap()

    const sMin = timeToMinutes(slotStart)
    let eMin = timeToMinutes(slotEnd)
    let finalEnd = slotEnd
    if (eMin <= sMin) {
      finalEnd = slotEnd === '00:00' ? '23:59' : minutesToTimeStr(Math.min(24 * 60, sMin + 30))
    }

    await createSlot({
      date: selectedDate,
      start_time: slotStart,
      end_time: finalEnd,
      title: slotTitle.trim(),
      category_id: slotCategoryId || undefined,
      task_id: selectedTaskId || undefined,
      notes: slotNotes.trim() || undefined
    })

    sounds.playSuccess()
    setSlotTitle('')
    setSlotNotes('')
    setSelectedTaskId(null)
    setSlotCategoryId(null)
    setIsAddOpen(false)
  }

  // Handle Open Edit
  const handleOpenEdit = (slot: ScheduleSlot) => {
    sounds.playTap()
    setEditingSlot(slot)
    setEditTitle(slot.title)
    setEditStart(slot.start_time)
    setEditEnd(slot.end_time)
    setEditCategoryId(slot.category_id || null)
    setEditNotes(slot.notes || '')
  }

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSlot || !editTitle.trim()) return
    sounds.playTap()

    await updateSlot(editingSlot.id, {
      title: editTitle.trim(),
      start_time: editStart,
      end_time: editEnd,
      category_id: editCategoryId || undefined,
      notes: editNotes.trim() || undefined
    })

    sounds.playSuccess()
    setEditingSlot(null)
  }

  // Handle start timer
  const handleStartFocus = (slot: ScheduleSlot) => {
    sounds.playTap()
    const sMin = timeToMinutes(slot.start_time)
    let eMin = timeToMinutes(slot.end_time)
    if (eMin <= sMin) eMin = slot.end_time === '00:00' ? 24 * 60 : sMin + 30
    const durMins = Math.max(15, eMin - sMin)

    startTimer({
      title: slot.title,
      categoryId: slot.category_id || undefined,
      categoryName: slot.category?.name,
      categoryColor: slot.category?.color,
      durationMinutes: durMins
    })
  }

  const isToday = selectedDate === todayIso
  const isTomorrow = selectedDate === tomorrowIso

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-3 pt-2 md:px-8 md:pt-4">
      <div className="max-w-lg md:max-w-3xl mx-auto w-full flex-1 flex flex-col min-h-0 overflow-hidden space-y-2">
        {/* ── 1. COMPACT DATE NAVIGATOR & SUMMARY ── */}
        <div className="shrink-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Day Navigator */}
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-slate-200/90 shadow-2xs">
                <button
                  onClick={handlePrevDay}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition active:scale-90"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-2 text-xs font-black text-slate-900 font-mono tracking-tight">
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

              {/* Quick Jump Today / Tomorrow */}
              <button
                onClick={handleSelectToday}
                className={`px-2 py-1 rounded-xl text-[10px] font-black transition active:scale-95 border ${
                  isToday
                    ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Today
              </button>

              <button
                onClick={handleSelectTomorrow}
                className={`px-2 py-1 rounded-xl text-[10px] font-black transition active:scale-95 border ${
                  isTomorrow
                    ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Tomorrow
              </button>
            </div>

            {/* Right: + Add Block Button */}
            <button
              onClick={() => { sounds.playTap(); setIsAddOpen(prev => !prev) }}
              className={`h-7 px-2.5 rounded-xl font-bold text-xs flex items-center gap-1 transition active:scale-95 shadow-2xs ${
                isAddOpen
                  ? 'bg-slate-200 text-slate-700'
                  : 'bg-violet-600 hover:bg-violet-700 text-white'
              }`}
            >
              {isAddOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isAddOpen ? 'Close' : 'Add Block'}</span>
            </button>
          </div>

          {/* Planned Metrics Strip */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-sky-50/80 border border-sky-200/80 text-xs font-bold text-sky-950 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>{isToday ? "Today's Plan" : isTomorrow ? "Tomorrow's Plan" : `Plan for ${selectedDate}`}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="font-black text-sky-900">{plannedHoursFormatted}</span>
              <span className="text-sky-600">({completedCount}/{sortedSlots.length} done)</span>
            </div>
          </div>
        </div>

        {/* ── 2. QUICK ADD TIME BLOCK FORM ── */}
        {isAddOpen && (
          <form onSubmit={handleCreate} className="shrink-0 bg-white p-3 rounded-2xl border border-violet-200 shadow-xs space-y-2.5 anim-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-violet-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Schedule Block</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{selectedDate}</span>
            </div>

            {/* Quick Link Pending Task */}
            {(tasks || []).filter(t => t.status !== 'completed').length > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Schedule from Pending Task (Optional)</label>
                <select
                  value={selectedTaskId || ''}
                  onChange={e => {
                    const tid = e.target.value ? Number(e.target.value) : null
                    setSelectedTaskId(tid)
                    if (tid) {
                      const found = tasks.find(t => t.id === tid)
                      if (found) {
                        setSlotTitle(found.title)
                        if (found.category_id) setSlotCategoryId(found.category_id)
                      }
                    }
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-violet-500"
                >
                  <option value="">-- Choose task to schedule --</option>
                  {(tasks || []).filter(t => t.status !== 'completed').map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Title Input */}
            <input
              type="text"
              required
              value={slotTitle}
              onChange={e => setSlotTitle(e.target.value)}
              placeholder="Block title (e.g. Deep Work: System Architecture)"
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500"
            />

            {/* Time Pickers */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Start Time</label>
                <input
                  type="time"
                  required
                  value={slotStart}
                  onChange={e => setSlotStart(e.target.value)}
                  className="w-full px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">End Time</label>
                <input
                  type="time"
                  required
                  value={slotEnd}
                  onChange={e => setSlotEnd(e.target.value)}
                  className="w-full px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block">Category (Optional)</label>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  type="button"
                  onClick={() => setSlotCategoryId(null)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 transition border ${
                    slotCategoryId === null
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  None
                </button>
                {(categories || []).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSlotCategoryId(c.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 transition border ${
                      slotCategoryId === c.id
                        ? 'text-white border-transparent'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                    style={slotCategoryId === c.id ? { backgroundColor: c.color } : {}}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs active:scale-95 transition"
            >
              Add to Schedule
            </button>
          </form>
        )}

        {/* ── 3. LIST OF PLANNED SLOTS FOR SELECTED DATE ── */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 pb-16">
          {sortedSlots.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">
                  No schedule blocks for {isToday ? 'today' : isTomorrow ? 'tomorrow' : selectedDate}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Plan your time blocks ahead for peak focus and efficiency.
                </p>
              </div>
              <button
                onClick={() => { sounds.playTap(); setIsAddOpen(true) }}
                className="px-3.5 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition active:scale-95 shadow-2xs"
              >
                + Add First Time Block
              </button>
            </div>
          ) : (
            sortedSlots.map(slot => {
              const isDone = !!slot.is_done
              const sMin = timeToMinutes(slot.start_time)
              let eMin = timeToMinutes(slot.end_time)
              if (eMin <= sMin) eMin = slot.end_time === '00:00' ? 24 * 60 : sMin + 30
              const durMins = Math.max(15, eMin - sMin)

              return (
                <div
                  key={slot.id}
                  className={`bg-white rounded-2xl p-3 border transition shadow-2xs ${
                    isDone
                      ? 'opacity-70 bg-emerald-50/20 border-emerald-200'
                      : 'border-slate-200 hover:border-violet-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={async () => {
                        sounds.playTap()
                        await toggleSlotDone(slot.id, !isDone)
                        if (!isDone) sounds.playSuccess()
                      }}
                      className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition active:scale-90 ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                          : 'border-slate-300 hover:border-violet-500 bg-white'
                      }`}
                      title={isDone ? 'Mark uncompleted' : 'Mark completed'}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    {/* Content */}
                    <div
                      onClick={() => handleOpenEdit(slot)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-black text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                          {slot.start_time} - {slot.end_time} ({durMins}m)
                        </span>
                        {slot.category && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white shadow-2xs"
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
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 italic">{slot.notes}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!isDone && (
                        <button
                          onClick={() => handleStartFocus(slot)}
                          className="h-7 px-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition"
                          title="Start focus timer"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Focus</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEdit(slot)}
                        className="p-1.5 text-slate-400 hover:text-violet-600 transition active:scale-90"
                        title="Edit slot"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { sounds.playTap(); deleteSlot(slot.id) }}
                        className="p-1.5 text-slate-300 hover:text-rose-600 transition active:scale-90"
                        title="Delete slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── 4. EDIT SLOT MODAL ── */}
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 anim-fade-in">
          <form onSubmit={handleSaveEdit} className="bg-white rounded-3xl p-5 w-full max-w-sm border border-slate-200 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Edit Schedule Block</h3>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="Block Title"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Start Time</label>
                <input
                  type="time"
                  required
                  value={editStart}
                  onChange={e => setEditStart(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">End Time</label>
                <input
                  type="time"
                  required
                  value={editEnd}
                  onChange={e => setEditEnd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block">Category</label>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  type="button"
                  onClick={() => setEditCategoryId(null)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 transition border ${
                    editCategoryId === null
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  None
                </button>
                {(categories || []).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setEditCategoryId(c.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 transition border ${
                      editCategoryId === c.id
                        ? 'text-white border-transparent'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                    style={editCategoryId === c.id ? { backgroundColor: c.color } : {}}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={2}
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder="Notes (optional)..."
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none"
            />

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
export default DayPlanSimplified
