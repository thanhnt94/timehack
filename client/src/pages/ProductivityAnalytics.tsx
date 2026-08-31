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
  const ringSize = 120
  const strokeW = 10
  const radius = (ringSize - strokeW) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (completionPct / 100) * circumference

  // Fake bar chart data (7 days based on task created_at)
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
      <h1 className="text-xl font-black text-white">Thống Kê</h1>

      {/* Range selector */}
      <div className="flex gap-1.5">
        {([7, 14, 30] as Range[]).map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
              range === r
                ? 'bg-violet-600 text-white'
                : 'glass text-slate-400'
            }`}
          >
            {r} ngày
          </button>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass rounded-2xl p-3 text-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <div className="text-lg font-black text-white font-mono">{doneTasks}</div>
          <div className="text-[9px] text-slate-400 font-semibold">Hoàn thành</div>
        </div>
        <div className="glass rounded-2xl p-3 text-center">
          <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
          <div className="text-lg font-black text-white font-mono">{totalFocusMin}<span className="text-xs text-slate-400">m</span></div>
          <div className="text-[9px] text-slate-400 font-semibold">Tập trung</div>
        </div>
        <div className="glass rounded-2xl p-3 text-center">
          <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
          <div className="text-lg font-black text-white font-mono">{longestStreak}</div>
          <div className="text-[9px] text-slate-400 font-semibold">Streak dài nhất</div>
        </div>
      </div>

      {/* Completion ring + bar chart side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Ring */}
        <div className="glass rounded-2xl p-5 flex flex-col items-center justify-center">
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            <circle cx={ringSize / 2} cy={ringSize / 2} r={radius}
              stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} fill="none" />
            <circle cx={ringSize / 2} cy={ringSize / 2} r={radius}
              stroke="url(#grad)" strokeWidth={strokeW} fill="none"
              strokeLinecap="round" strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700" />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="mt-2 text-center">
            <div className="text-2xl font-black text-white font-mono">{completionPct}%</div>
            <div className="text-[10px] text-slate-400 font-semibold">Hoàn thành</div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[11px] font-bold text-slate-300">Task hoàn thành</span>
          </div>
          <div className="flex items-end gap-1 h-24">
            {barData.slice(-7).map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-cyan-500 transition-all duration-300"
                  style={{ height: `${Math.max((d.count / maxBar) * 80, 4)}%` }} />
                <span className="text-[8px] text-slate-500 font-mono">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
