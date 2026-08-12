import React, { useEffect, useState } from 'react'
import { Plus, Check, Trash2 } from 'lucide-react'
import { useScheduleStore } from '../store/useScheduleStore'
import { useTaskStore } from '../store/useTaskStore'

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
    await createSlot({
      date: selectedDate,
      start_time: startTime,
      end_time: endTime,
      title
    })
    setTitle('')
    setIsModalOpen(false)
  }

  // Hours array from 06:00 to 22:00 for daily timeline
  const hours = Array.from({ length: 17 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Thời Gian Biểu (Time-Blocking Planner)</h1>
          <p className="text-xs text-slate-400">Phân bổ khung giờ tập trung cụ thể cho từng công việc.</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-[#151D2A] border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white outline-none focus:border-amber-500"
          />

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-amber-600/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Khung Giờ</span>
          </button>
        </div>
      </div>

      {/* Timeline Layout */}
      <div className="p-6 glass-card rounded-3xl space-y-3 border border-amber-500/20">
        {hours.map((h) => {
          const matchingSlots = slots.filter(s => s.start_time.startsWith(h.substring(0, 2)))

          return (
            <div key={h} className="flex items-start gap-4 py-2 border-b border-slate-800/50">
              <div className="w-16 text-xs font-mono font-bold text-slate-400 shrink-0">{h}</div>
              <div className="flex-1 min-h-[36px] flex flex-col gap-2">
                {matchingSlots.map(s => (
                  <div key={s.id} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSlotDone(s.id, !s.is_done)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                          s.is_done ? 'bg-amber-500 text-slate-950 font-bold' : 'border-slate-700 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <div>
                        <div className="text-xs font-bold text-white">{s.title}</div>
                        <div className="text-[10px] text-amber-300 font-mono">{s.start_time} - {s.end_time}</div>
                      </div>
                    </div>

                    <button onClick={() => deleteSlot(s.id)} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="p-6 glass-card rounded-3xl w-full max-w-md space-y-4 border border-amber-500/30">
            <h3 className="text-lg font-black text-white">Thêm Khung Giờ Làm Việc</h3>

            <input
              type="text"
              placeholder="Tên khung giờ..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Giờ bắt đầu</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Giờ kết thúc</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-400">Hủy</button>
              <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/30">Thêm Khung Giờ</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
