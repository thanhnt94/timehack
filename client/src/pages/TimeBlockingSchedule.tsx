import React, { useEffect, useState } from 'react'
import { Plus, Check, Trash2, Clock, Calendar, Sparkles, X } from 'lucide-react'
import { useScheduleStore } from '../store/useScheduleStore'
import { useTaskStore } from '../store/useTaskStore'
import { sounds } from '../utils/soundEffects'

export const TimeBlockingSchedule: React.FC = () => {
  const { slots, selectedDate, setSelectedDate, fetchSlots, createSlot, toggleSlotDone, deleteSlot } = useScheduleStore()
  const { fetchTasks } = useTaskStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [title, setTitle] = useState('')

  useEffect(() => {
    fetchSlots(selectedDate)
    fetchTasks()
  }, [selectedDate])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    sounds.playTap()
    await createSlot({
      date: selectedDate,
      start_time: startTime,
      end_time: endTime,
      title
    })
    sounds.playSuccess()
    setTitle('')
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 select-none pb-6">
      {/* 1. HEADER WITH DATE PICKER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Kế Hoạch Khung Giờ</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Lịch Time-Blocking</h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm Khung</span>
        </button>
      </div>

      {/* Date Selector */}
      <div className="flex items-center gap-2 p-2 glass-card rounded-2xl border border-white/[0.08]">
        <Calendar className="w-4 h-4 text-cyan-400 ml-1" />
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="bg-transparent text-xs sm:text-sm text-white font-bold outline-none flex-1"
        />
      </div>

      {/* 2. TIMELINE SLOTS LIST */}
      <div className="space-y-2.5">
        {slots.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 border border-white/[0.08] text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mx-auto flex items-center justify-center text-cyan-400">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white">Chưa Có Khung Giờ Nào</div>
            <p className="text-xs text-slate-400">Phân bổ khung giờ làm việc tập trung (Deep Work) giúp tăng 200% hiệu suất.</p>
          </div>
        ) : (
          slots.map((slot) => {
            const isDone = !!slot.is_done

            return (
              <div
                key={slot.id}
                className={`glass-card rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 ${
                  isDone 
                    ? 'opacity-60 border-slate-800' 
                    : 'border-white/[0.08] hover:border-cyan-500/30'
                }`}
              >
                {/* 1-Tap Toggle */}
                <button
                  onClick={() => {
                    sounds.playTap()
                    toggleSlotDone(slot.id)
                  }}
                  className={`w-6 h-6 rounded-xl border flex items-center justify-center transition-all active:scale-90 shrink-0 ${
                    isDone 
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-sm' 
                      : 'border-slate-600 bg-slate-900/80 hover:border-cyan-400'
                  }`}
                >
                  {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                {/* Slot Details */}
                <div className="flex-1 min-w-0">
                  <div className={`text-xs sm:text-sm font-bold truncate ${
                    isDone ? 'line-through text-slate-500' : 'text-white'
                  }`}>
                    {slot.title}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 font-bold mt-0.5">
                    {slot.start_time} - {slot.end_time}
                  </div>
                </div>

                <button
                  onClick={() => deleteSlot(slot.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* 3. CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-cyan-600/20 text-cyan-400">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-white">Thêm Khung Giờ Time-Blocking</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Tên Khung Giờ</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Deep Work Coding, Luyện Từ Vựng..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Bắt đầu</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Kết thúc</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lưu Khung Giờ</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
