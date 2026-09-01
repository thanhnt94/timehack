import React, { useEffect, useState, useMemo } from 'react'
import { TrendingUp, CheckCircle2, Flame, Clock } from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore'
import { useHabitStore } from '../store/useHabitStore'

type Range = 7 | 14 | 30

export const ProductivityAnalytics: React.FC = () => {
  const { tasks, fetchTasks } = useTaskStore()
  const { habits, fetchHabits } = useHabitStore()
  const [range, setRange] = useState<Range>(7)

  useEffect(() => { fetchTasks(); fetchHabits() }, [])

  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.status === 'completed').length
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const totalFocusMin = Math.round(tasks.reduce((s, t) => s + (t.spent_seconds || 0), 0) / 60)

  const longestStreak = habits.reduce((max, h) => Math.max(max, h.longest_streak || 0), 0)

  // SVG ring
  const ringSize = 130
  const strokeW = 10
  const radius = (ringSize - strokeW) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (completionPct / 100) * circumference

  // Bar chart data
  const barData = useMemo(() => {
    const days: { label: string; count: number }[] = []
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' })
      const count = tasks.filter(t => {
        if (!t.completed_at) return false
        return t.completed_at.startsWith(dateStr)
      }).length
      days.push({ label: dayLabel, count })
    }
    return days
  }, [tasks, range])

  const maxBar = Math.max(...barData.map(d => d.count), 1)

  return (
    <div className="space-y-4 pb-4">
      {/* ── Ergonomic Large Header ─────── */}
      <div className="pt-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Performance & Reports</span>
        <h1 className="text-2xl font-black text-slate-900 mt-0.5">Analytics</h1>
      </div>

      {/* Range selector */}
      <div className="flex gap-2">
        {([7, 14, 30] as Range[]).map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
              range === r
                ? 'bg-violet-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {r} Days
          </button>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="glass rounded-2xl p-3.5 text-center border border-slate-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <div className="text-xl font-black text-slate-900 font-mono">{doneTasks}</div>
          <div className="text-[11px] text-slate-500 font-medium">Completed</div>
        </div>
        <div className="glass rounded-2xl p-3.5 text-center border border-slate-200">
          <Clock className="w-4 h-4 text-violet-600 mx-auto mb-1" />
          <div className="text-xl font-black text-slate-900 font-mono">{totalFocusMin}<span className="text-xs text-slate-400">m</span></div>
          <div className="text-[11px] text-slate-500 font-medium">Focus Time</div>
        </div>
        <div className="glass rounded-2xl p-3.5 text-center border border-slate-200">
          <Flame className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <div className="text-xl font-black text-slate-900 font-mono">{longestStreak}</div>
          <div className="text-[11px] text-slate-500 font-medium">Best Streak</div>
        </div>
      </div>

      {/* Completion ring + bar chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Ring */}
        <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center border border-slate-200">
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={radius}
              stroke="#F1F5F9" strokeWidth={strokeW} fill="none"
            />
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={radius}
              stroke="url(#flatPurpleGrad)" strokeWidth={strokeW} fill="none"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="flatPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono">{completionPct}%</div>
            <div className="text-xs text-slate-500 font-semibold">Task Completion Rate</div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass rounded-2xl p-4 border border-slate-200 flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Completed Tasks by Day
          </div>
          <div className="flex items-end justify-between gap-1.5 h-32 pt-2">
            {barData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div
                  style={{ height: `${(d.count / maxBar) * 100}%` }}
                  className={`w-full rounded-t-lg transition-all ${
                    d.count > 0 ? 'bg-violet-600' : 'bg-slate-100'
                  }`}
                />
                <span className="text-[9px] font-bold text-slate-400 font-mono truncate max-w-full">
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
