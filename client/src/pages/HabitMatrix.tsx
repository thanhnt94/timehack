import React, { useEffect, useState } from 'react'
import { Flame, Check, Plus, X, Trash2, Zap, Sparkles } from 'lucide-react'
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

  // Mini heatmap: last 7 days with day labels
  const MiniHeatmap = ({ habitId }: { habitId: number }) => {
    const data = heatmapData[habitId] || []
    const last7: { completed: boolean; label: string }[] = []
    const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const item = data.find(x => x.date === dateStr)
      last7.push({
        completed: !!item?.completed,
        label: daysOfWeek[d.getDay()]
      })
    }
    return (
      <div className="flex items-center gap-1.5 pt-1">
        {last7.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div
              className={`w-3.5 h-3.5 rounded-md transition ${
                day.completed
                  ? 'bg-emerald-500 shadow-xs ring-1 ring-emerald-300'
                  : 'bg-slate-100 border border-slate-200'
              }`}
            />
            <span className="text-[8px] font-bold text-slate-400 font-mono">{day.label}</span>
          </div>
        ))}
      </div>
    )
  }

  const completedTodayCount = habits.filter(h => !!h.today_completed).length

  return (
    <div className="space-y-4 pb-4">
      {/* ── Ergonomic Large Header (1-Handed Friendly) ── */}
      <div className="pt-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Xây dựng thói quen</span>
            <h1 className="text-2xl font-black text-slate-900 mt-0.5">Thói Quen</h1>
          </div>
          {habits.length > 0 && (
            <div className="text-right">
              <span className="text-xs font-black font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                {completedTodayCount}/{habits.length} hoàn tất
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Habit list or Ergonomic Centered Empty State ── */}
      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center shadow-xs mb-3">
            <Zap className="w-8 h-8 fill-amber-400" />
          </div>
          <h3 className="text-base font-black text-slate-900">Bắt đầu thói quen mới</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[260px] leading-relaxed">
            Duy trì những hành động nhỏ hàng ngày để tạo nên sự bứt phá dài hạn và tích lũy streak 🔥.
          </p>

          {/* Large Thumb-Zone CTA Button */}
          <button
            onClick={() => { sounds.playTap(); setSheetOpen(true) }}
            className="mt-6 px-6 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-lg shadow-violet-600/25 active:scale-95 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tạo Thói Quen Đầu Tiên</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map(h => {
            const done = !!h.today_completed
            return (
              <div
                key={h.id}
                className={`glass rounded-2xl p-4 border transition ${
                  done
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'border-slate-200 hover:border-violet-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Large 48px Check-in Target (Thumb friendly) */}
                  <button
                    onClick={() => handleCheckin(h)}
                    className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 transition active:scale-90 ${
                      done
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                        : 'border-2 border-dashed border-slate-300 hover:border-violet-500 bg-white'
                    }`}
                    aria-label={done ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                  >
                    {done ? (
                      <Check className="w-7 h-7 text-white stroke-[3] anim-check" />
                    ) : (
                      <span className="text-xl">{h.icon || '⚡'}</span>
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-sm font-bold truncate ${done ? 'text-emerald-900' : 'text-slate-900'}`}>
                        {h.title}
                      </h4>
                      {h.current_streak > 0 && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 font-bold flex items-center gap-0.5 shrink-0">
                          <Flame className="w-3 h-3 text-amber-500" /> {h.current_streak}d
                        </span>
                      )}
                    </div>

                    {/* 7-day mini heatmap */}
                    <div className="mt-1.5">
                      <MiniHeatmap habitId={h.id} />
                    </div>
                  </div>

                  {/* Delete option */}
                  <button
                    onClick={() => { sounds.playTap(); deleteHabit(h.id) }}
                    className="p-2 text-slate-300 hover:text-rose-600 transition shrink-0 active:scale-90"
                    title="Xoá thói quen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}

          {/* Bottom Thumb CTA */}
          <div className="pt-2">
            <button
              onClick={() => { sounds.playTap(); setSheetOpen(true) }}
              className="w-full py-3 rounded-2xl bg-white border border-dashed border-slate-300 hover:border-violet-400 text-slate-600 hover:text-violet-700 text-xs font-bold transition active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm thói quen mới</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Create Habit Bottom Sheet ───────── */}
      {sheetOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
          <div className="sheet-content max-w-lg mx-auto">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900">Tạo Thói Quen Mới</h2>
                <p className="text-[11px] text-slate-500 font-medium">Hành động lặp lại hàng ngày để duy trì streak</p>
              </div>
              <button onClick={() => setSheetOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Tên thói quen
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ví dụ: Đọc sách 20p, Uống 2L nước, Chạy bộ 15p..."
                  autoFocus
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Màu sắc nhận diện
                </label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-9 h-9 rounded-xl transition active:scale-90 ${
                        color === c ? 'ring-2 ring-violet-600 ring-offset-2 scale-105' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs active:scale-[0.98] transition shadow-md shadow-violet-600/20 mt-2"
              >
                Lưu Thói Quen
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
