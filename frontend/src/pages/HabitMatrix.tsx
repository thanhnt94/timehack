import React, { useEffect, useState } from 'react'
import { Plus, Check, Flame, Trophy, Trash2, Play } from 'lucide-react'
import { useHabitStore } from '../store/useHabitStore'
import { useTimerStore } from '../store/useTimerStore'

export const HabitMatrix: React.FC = () => {
  const { habits, heatmapData, fetchHabits, createHabit, checkinHabit, fetchHeatmap, deleteHabit } = useHabitStore()
  const { startTimer } = useTimerStore()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  useEffect(() => {
    fetchHabits()
  }, [])

  useEffect(() => {
    habits.forEach(h => fetchHeatmap(h.id, 30))
  }, [habits])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await createHabit({ title, description: desc, icon: 'zap', color: '#10B981' })
    setTitle('')
    setDesc('')
    setIsCreateModalOpen(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Theo Dõi Thói Quen (Habit Tracker)</h1>
          <p className="text-xs text-slate-400">Rèn luyện kỷ luật, giữ gìn chuỗi ngày liên tục (Streak).</p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Thói Quen Mới</span>
        </button>
      </div>

      {/* Habit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {habits.map((h) => {
          const heatmap = heatmapData[h.id] || []

          return (
            <div key={h.id} className="p-6 glass-card rounded-3xl space-y-4 border border-emerald-500/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => checkinHabit(h.id)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                      h.today_completed 
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30' 
                        : 'bg-slate-800 text-slate-400 hover:border-emerald-400 border border-slate-700'
                    }`}
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="text-sm font-bold text-white">{h.title}</h3>
                    {h.description && <p className="text-xs text-slate-400">{h.description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startTimer({ habitId: h.id, title: `Thói quen: ${h.title}` })}
                    className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 transition-all"
                    title="Tập trung thói quen"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button onClick={() => deleteHabit(h.id)} className="text-slate-500 hover:text-rose-400 p-2">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Streaks Banner */}
              <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                  <span className="text-xs font-bold text-slate-200">Chuỗi hiện tại: {h.current_streak} ngày</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-400">Kỷ lục: {h.longest_streak} ngày</span>
                </div>
              </div>

              {/* 30-Day Heatmap grid */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Heatmap 30 ngày gần đây</div>
                <div className="grid grid-cols-10 gap-1.5">
                  {heatmap.map((item, idx) => (
                    <div
                      key={idx}
                      title={`${item.date}: ${item.completed ? 'Hoàn thành' : 'Chưa làm'}`}
                      className={`h-5 rounded-md transition-all ${
                        item.completed 
                          ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' 
                          : 'bg-slate-800/80 border border-slate-700/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="p-6 glass-card rounded-3xl w-full max-w-md space-y-4 border border-emerald-500/30">
            <h3 className="text-lg font-black text-white">Tạo Thói Quen Mới</h3>

            <input
              type="text"
              placeholder="Tên thói quen (ví dụ: Dậy sớm 6h, Đọc sách 20 phút)..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500"
              required
            />

            <textarea
              placeholder="Ghi chú thêm..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500 h-20"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-400">Hủy</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30">Tạo Thói Quen</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
