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
      const dayLabel = d.toLocaleDateString('vi-VN', { weekday: 'short' }).replace('Th ', 'T')
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
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-slate-900">Thống Kê</h1>

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
            {r} ngày
          </button>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="glass rounded-2xl p-3.5 text-center border border-slate-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <div className="text-xl font-black text-slate-900 font-mono">{doneTasks}</div>
          <div className="text-[11px] text-slate-500 font-medium">Hoàn thành</div>
        </div>
        <div className="glass rounded-2xl p-3.5 text-center border border-slate-200">
          <Clock className="w-4 h-4 text-violet-600 mx-auto mb-1" />
          <div className="text-xl font-black text-slate-900 font-mono">{totalFocusMin}<span className="text-xs text-slate-400">m</span></div>
          <div className="text-[11px] text-slate-500 font-medium">Tập trung</div>
        </div>
        <div className="glass rounded-2xl p-3.5 text-center border border-slate-200">
          <Flame className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <div className="text-xl font-black text-slate-900 font-mono">{longestStreak}</div>
          <div className="text-[11px] text-slate-500 font-medium">Streak dài</div>
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
              strokeLinecap="round" strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="flatPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
            </defs>
          </svg>
          <div className="mt-3 text-center">
            <div className="text-2xl font-black text-slate-900 font-mono">{completionPct}%</div>
            <div className="text-[11px] text-slate-500 font-medium">Tỉ lệ hoàn thành task</div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="glass rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center gap-1.5 mb-4">
            <TrendingUp className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-bold text-slate-800">Task hoàn thành mỗi ngày</span>
          </div>
          <div className="flex items-end gap-1.5 h-28 pt-2">
            {barData.slice(-7).map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-md bg-violet-600 hover:bg-violet-700 transition-all duration-300"
                  style={{ height: `${Math.max((d.count / maxBar) * 85, 6)}%` }}
                />
                <span className="text-[9px] text-slate-500 font-mono font-medium">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
