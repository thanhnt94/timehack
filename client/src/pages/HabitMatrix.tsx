import React, { useEffect, useState } from 'react'
import { Flame, Check, Plus, X, Trash2 } from 'lucide-react'
import { useHabitStore, type Habit } from '../store/useHabitStore'
import { sounds } from '../utils/soundEffects'

const COLORS = ['#7C3AED', '#0284C7', '#10B981', '#D97706', '#E11D48', '#6366F1']

export const HabitMatrix: React.FC = () => {
  const { habits, isLoading, fetchHabits, createHabit, checkinHabit, fetchHeatmap, deleteHabit, heatmapData } = useHabitStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(COLORS[0])

  useEffect(() => {
    fetchHabits()
  }, [])

  useEffect(() => {
    habits.forEach(h => fetchHeatmap(h.id, 7))
  }, [habits.length])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    sounds.playTap()
    await createHabit({ title, color, icon: '⚡', target_count: 1, unit: 'lần', frequency_type: 'daily' })
    sounds.playSuccess()
    setTitle('')
    setSheetOpen(false)
  }

  const handleCheckin = (h: Habit) => {
    sounds.playTap()
    checkinHabit(h.id)
    sounds.playSuccess()
  }

  // Mini heatmap: last 7 days
  const MiniHeatmap = ({ habitId }: { habitId: number }) => {
    const data = heatmapData[habitId] || []
    const last7: { completed: boolean }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const item = data.find(x => x.date === dateStr)
      last7.push({ completed: !!item?.completed })
    }
    return (
      <div className="flex gap-1">
        {last7.map((day, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm transition ${
              day.completed ? 'bg-emerald-500 shadow-xs' : 'bg-slate-100 border border-slate-200'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">Thói Quen</h1>
        <button
          onClick={() => { sounds.playTap(); setSheetOpen(true) }}
          className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition shadow-sm shadow-violet-600/20"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Thêm
        </button>
      </div>

      {/* Habit list */}
      {habits.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center border border-slate-200">
          <div className="text-3xl mb-2">⚡</div>
          <p className="text-sm font-semibold text-slate-600">Chưa có thói quen nào.</p>
          <p className="text-xs text-slate-400 mt-1">Tạo thói quen để bắt đầu duy trì streak mỗi ngày!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {habits.map(h => {
            const done = !!h.today_completed
            return (
              <div key={h.id} className="glass rounded-2xl p-4 flex items-center gap-3.5 border border-slate-200 hover:border-slate-300 transition">
                {/* Check-in button */}
                <button
                  onClick={() => handleCheckin(h)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition active:scale-90 ${
                    done
                      ? 'bg-emerald-500 shadow-md shadow-emerald-500/25'
                      : 'border-2 border-dashed border-slate-300 hover:border-violet-500 bg-slate-50'
                  }`}
                >
                  {done ? (
                    <Check className="w-6 h-6 text-white stroke-[3] anim-check" />
                  ) : (
                    <span className="text-lg">{h.icon || '⚡'}</span>
                  )}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold truncate ${done ? 'text-emerald-800' : 'text-slate-900'}`}>
                      {h.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    {h.current_streak > 0 && (
                      <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 font-bold flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" /> {h.current_streak} ngày
                      </span>
                    )}
                    <MiniHeatmap habitId={h.id} />
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => { sounds.playTap(); deleteHabit(h.id) }}
                  className="p-2 text-slate-400 hover:text-rose-600 transition shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Create sheet */}
      {sheetOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
          <div className="sheet-content">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-900">Thêm Thói Quen Mới</h2>
              <button onClick={() => setSheetOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Tên thói quen (ví dụ: Chạy bộ 15p)..."
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:bg-white transition"
              />
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Màu sắc nhận diện</label>
                <div className="flex gap-2 mt-1.5">
                  {COLORS.map(c => (
                    <button
                      key={c} type="button" onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-xl transition active:scale-90 ${color === c ? 'ring-2 ring-violet-600 ring-offset-2 scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm active:scale-[0.98] transition shadow-md shadow-violet-600/20"
              >
                Tạo Thói Quen
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
