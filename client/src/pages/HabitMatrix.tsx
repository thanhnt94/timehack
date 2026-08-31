import React, { useEffect, useState } from 'react'
import { Plus, Check, Flame, Trophy, Trash2, Zap, X } from 'lucide-react'
import { useHabitStore } from '../store/useHabitStore'
import { sounds } from '../utils/soundEffects'

interface HabitMatrixProps {
  onOpenCreate?: () => void
}

export const HabitMatrix: React.FC<HabitMatrixProps> = ({ onOpenCreate }) => {
  const { habits, heatmapData, fetchHabits, createHabit, checkinHabit, fetchHeatmap, deleteHabit } = useHabitStore()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  useEffect(() => {
    fetchHabits()
  }, [])

  useEffect(() => {
    habits.forEach(h => fetchHeatmap(h.id, 14))
  }, [habits])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    sounds.playTap()
    await createHabit({ title, description: desc, icon: 'zap', color: '#10B981' })
    sounds.playSuccess()
    setTitle('')
    setDesc('')
    setIsCreateModalOpen(false)
  }

  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

  return (
    <div className="space-y-4 select-none pb-8 animate-in fade-in duration-200">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>Kỷ Luật & Kiên Trì</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Ma Trận Thói Quen</h1>
        </div>

        <button
          onClick={() => { sounds.playTap(); onOpenCreate ? onOpenCreate() : setIsCreateModalOpen(true); }}
          className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm Mới</span>
        </button>
      </div>

      {/* 2. HABIT CARD LIST */}
      <div className="space-y-2.5">
        {habits.length === 0 ? (
          <div className="glass-card rounded-[28px] p-6 border border-white/[0.08] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-black text-white">Chưa Có Thói Quen Nào</div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                Xây dựng thói quen tốt mỗi ngày như Đọc sách, Tập thể dục, Luyện từ vựng...
              </p>
            </div>
            <button
              onClick={() => { sounds.playTap(); onOpenCreate ? onOpenCreate() : setIsCreateModalOpen(true); }}
              className="px-4 py-2 rounded-2xl bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1 shadow-lg shadow-emerald-600/30 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Thói Quen Đầu Tiên</span>
            </button>
          </div>
        ) : (
          habits.map((h) => {
            const isCompletedToday = !!h.today_completed
            const streakCount = h.current_streak || (isCompletedToday ? 1 : 0)

            return (
              <div 
                key={h.id} 
                className="p-4 glass-card rounded-[26px] border border-white/[0.08] hover:border-emerald-500/30 transition-all space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* 1-Tap Check-in Button */}
                    <button
                      onClick={() => {
                        sounds.playTap()
                        checkinHabit(h.id)
                        sounds.playSuccess()
                      }}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 shrink-0 ${
                        isCompletedToday 
                          ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/40 font-black' 
                          : 'bg-slate-900/90 border border-slate-700 text-slate-500 hover:border-emerald-500'
                      }`}
                    >
                      <Check className="w-5 h-5 stroke-[3]" />
                    </button>

                    <div className="min-w-0">
                      <div className={`text-sm font-black truncate ${
                        isCompletedToday ? 'text-white' : 'text-slate-200'
                      }`}>
                        {h.title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5 fill-emerald-400" />
                          <span>Streak: {streakCount} ngày</span>
                        </span>
                        {h.description && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{h.description}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delete Action */}
                  <button
                    onClick={() => {
                      sounds.playTap()
                      deleteHabit(h.id)
                    }}
                    title="Xóa thói quen"
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-slate-900 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 7-Day Mini Heatmap Row */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-1.5">
                  {daysOfWeek.map((day, idx) => (
                    <div key={day} className="flex-1 text-center">
                      <div className="text-[9px] font-bold text-slate-400 mb-1">{day}</div>
                      <div className={`h-6 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                        idx < 5 && isCompletedToday
                          ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30 font-black' 
                          : 'bg-slate-900/90 border border-slate-800 text-slate-600'
                      }`}>
                        {idx < 5 && isCompletedToday ? '✓' : '•'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 3. CREATE HABIT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-600/20 text-emerald-400">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-white">Tạo Thói Quen Mới</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Tên Thói Quen</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Đọc sách 20 trang, Tập Squat..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Ghi chú / Động lực (Tùy chọn)</label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Mục tiêu duy trì 30 ngày..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lưu Thói Quen</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
