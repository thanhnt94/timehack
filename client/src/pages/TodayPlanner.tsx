import React, { useEffect } from 'react'
import { Sun, Moon, Coffee, Play, Check, Flame, ChevronRight } from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore'
import { useHabitStore } from '../store/useHabitStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { useTimerStore } from '../store/useTimerStore'
import { sounds } from '../utils/soundEffects'

interface Props {
  onOpenFocus: () => void
}

export const TodayPlanner: React.FC<Props> = ({ onOpenFocus }) => {
  const { tasks, fetchTasks, toggleTaskStatus } = useTaskStore()
  const { habits, fetchHabits, checkinHabit } = useHabitStore()
  const { slots, fetchSlots } = useScheduleStore()
  const { startTimer } = useTimerStore()

  useEffect(() => { fetchTasks(); fetchHabits(); fetchSlots() }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
  const GreetIcon = hour < 12 ? Sun : hour < 18 ? Coffee : Moon

  const done = tasks.filter(t => t.status === 'completed').length
  const total = tasks.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const todayStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })

  const handlePlayTask = (task: any) => {
    sounds.playTap()
    startTimer({ taskId: task.id, title: task.title })
    onOpenFocus()
  }

  return (
    <div className="space-y-5">
      {/* ── Date & greeting ───────────── */}
      <div>
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
          <GreetIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>{greeting}</span>
        </div>
        <h1 className="text-xl font-black text-white mt-0.5">{todayStr}</h1>
      </div>

      {/* ── 3 stat pills ──────────────── */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass rounded-2xl p-3 text-center">
          <div className="text-lg font-black text-white font-mono">{done}/{total}</div>
          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Nhiệm vụ</div>
        </div>
        <div className="glass rounded-2xl p-3 text-center">
          <div className="text-lg font-black text-emerald-400 font-mono">{habits.length}</div>
          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Thói quen</div>
        </div>
        <div className="glass rounded-2xl p-3 text-center">
          <div className="text-lg font-black text-cyan-400 font-mono">{slots.length}</div>
          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Khung giờ</div>
        </div>
      </div>

      {/* ── Habit strip (horizontal scroll) */}
      {habits.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Thói quen hôm nay</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {habits.map(h => {
              const checked = !!h.today_completed
              return (
                <button
                  key={h.id}
                  onClick={() => { sounds.playTap(); checkinHabit(h.id); sounds.playSuccess() }}
                  className={`shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-2xl border transition-all active:scale-95 ${
                    checked
                      ? 'bg-emerald-500/15 border-emerald-500/30'
                      : 'glass border-[var(--border-subtle)]'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                    checked
                      ? 'bg-emerald-500 text-white anim-check'
                      : 'bg-slate-800 border border-slate-700'
                  }`}>
                    {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="text-left min-w-0">
                    <div className={`text-xs font-semibold truncate max-w-[80px] ${checked ? 'text-emerald-300' : 'text-slate-200'}`}>{h.title}</div>
                    {h.current_streak > 0 && (
                      <div className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5" /> {h.current_streak}d
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Task list ─────────────────── */}
      <section>
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Nhiệm vụ</h2>

        {tasks.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-sm text-slate-400">Chưa có nhiệm vụ nào.</p>
            <p className="text-xs text-slate-500 mt-1">Chạm nút <strong>(+)</strong> để tạo mới.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {tasks.map(task => {
              const isDone = task.status === 'completed'
              return (
                <div
                  key={task.id}
                  className={`glass rounded-2xl px-3 py-2.5 flex items-center gap-3 transition-opacity ${isDone ? 'opacity-45' : ''}`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => { sounds.playTap(); toggleTaskStatus(task.id); if (!isDone) sounds.playSuccess() }}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition active:scale-90 ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-600 hover:border-violet-400'
                    }`}
                  >
                    {isDone && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </button>

                  {/* Title + badge */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                      {task.title}
                    </div>
                    {task.eisenhower && (
                      <span className={`text-[9px] font-bold uppercase ${
                        task.eisenhower === 'do_first' ? 'text-rose-400' :
                        task.eisenhower === 'schedule' ? 'text-violet-400' :
                        task.eisenhower === 'delegate' ? 'text-amber-400' : 'text-slate-500'
                      }`}>
                        {task.eisenhower === 'do_first' ? 'Q1 Urgent' :
                         task.eisenhower === 'schedule' ? 'Q2 Plan' :
                         task.eisenhower === 'delegate' ? 'Q3 Delegate' : 'Q4'}
                      </span>
                    )}
                  </div>

                  {/* Play button */}
                  {!isDone && (
                    <button
                      onClick={() => handlePlayTask(task)}
                      className="w-8 h-8 rounded-xl bg-rose-600/15 border border-rose-500/25 flex items-center justify-center text-rose-400 hover:bg-rose-600 hover:text-white transition active:scale-90 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
