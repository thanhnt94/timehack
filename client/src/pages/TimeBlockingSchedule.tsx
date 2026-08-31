import React, { useEffect, useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon, Plus, Check, Clock, Trash2, X
} from 'lucide-react'
import { useScheduleStore, type ScheduleSlot } from '../store/useScheduleStore'
import { sounds } from '../utils/soundEffects'

export const TimeBlockingSchedule: React.FC = () => {
  const { slots, selectedDate, setSelectedDate, fetchSlots, createSlot, toggleSlotDone, deleteSlot } = useScheduleStore()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:30')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchSlots(selectedDate)
  }, [selectedDate])

  const datePills = useMemo(() => {
    const dates = []
    const base = new Date()
    for (let i = -1; i < 6; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      const iso = d.toISOString().split('T')[0]
      const label =
        i === 0
          ? 'Hôm nay'
          : i === 1
          ? 'Ngày mai'
          : d.toLocaleDateString('vi-VN', { weekday: 'short' }).replace('Th ', 'T')
      const dayNum = d.getDate()
      dates.push({ iso, label, dayNum })
    }
    return dates
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    sounds.playTap()
    await createSlot({
      date: selectedDate,
      start_time: startTime,
      end_time: endTime,
      title,
      notes: notes.trim() || undefined
    })
    sounds.playSuccess()
    setTitle('')
    setNotes('')
    setSheetOpen(false)
  }

  const handleToggle = (slot: ScheduleSlot) => {
    sounds.playTap()
    toggleSlotDone(slot.id, !slot.is_done)
    if (!slot.is_done) sounds.playSuccess()
  }

  const sortedSlots = useMemo(() => {
    return [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [slots])

  return (
    <div className="space-y-4">
      {/* ── Top Header ──────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Lịch Trình</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Time-blocking theo khung giờ</p>
        </div>
        <button
          onClick={() => { sounds.playTap(); setSheetOpen(true) }}
          className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition shadow-sm shadow-violet-600/20"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Thêm khung giờ
        </button>
      </div>

      {/* ── Date Pills Horizontal Carousel ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {datePills.map(d => {
          const isSelected = selectedDate === d.iso
          return (
            <button
              key={d.iso}
              onClick={() => { sounds.playTap(); setSelectedDate(d.iso) }}
              className={`shrink-0 flex flex-col items-center justify-center w-14 py-2 rounded-2xl border transition active:scale-95 ${
                isSelected
                  ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-[10px] font-bold uppercase">{d.label}</span>
              <span className={`text-base font-black font-mono mt-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                {d.dayNum}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Structured-style Vertical Timeline ── */}
      <div className="space-y-3 pt-2">
        {sortedSlots.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-700 font-bold">Chưa có khung giờ nào</p>
            <p className="text-xs text-slate-400 mt-1">Lên kế hoạch các khoảng thời gian tập trung trong ngày.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {sortedSlots.map(slot => {
              const isDone = !!slot.is_done
              return (
                <div key={slot.id} className="relative group">
                  {/* Timeline dot */}
                  <div className={`absolute -left-6 top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'bg-white border-violet-600'
                  }`}>
                    {isDone && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </div>

                  {/* Slot Card */}
                  <div className={`glass rounded-2xl p-3.5 flex items-center gap-3 border border-slate-200 transition ${
                    isDone ? 'opacity-45 bg-slate-50' : 'hover:border-violet-300'
                  }`}>
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggle(slot)}
                      className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 active:scale-90 transition ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 hover:border-violet-500 bg-white text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    {/* Slot Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-violet-700">
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </div>
                      <h3 className={`text-sm font-semibold truncate mt-0.5 ${
                        isDone ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}>
                        {slot.title}
                      </h3>
                      {slot.notes && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{slot.notes}</p>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => { sounds.playTap(); deleteSlot(slot.id) }}
                      className="p-2 text-slate-400 hover:text-rose-600 active:scale-90 transition shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Create Slot Bottom Sheet ── */}
      {sheetOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
          <div className="sheet-content">
            <div className="sheet-handle" />

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-900">Thêm Khung Giờ Mới</h2>
              <button onClick={() => setSheetOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Tên hoạt động..."
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:bg-white transition"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Bắt đầu
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono outline-none focus:border-violet-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Kết thúc
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono outline-none focus:border-violet-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ghi chú thêm (tuỳ chọn)..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:bg-white resize-none transition"
              />

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm active:scale-[0.98] transition shadow-md shadow-violet-600/20"
              >
                Lên Lịch
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
