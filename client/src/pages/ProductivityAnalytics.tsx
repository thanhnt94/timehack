import React, { useEffect, useState } from 'react'
import { 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Trophy, 
  Award, 
  Flame, 
  Sparkles,
  Zap,
  Sliders,
  Bell,
  ShieldCheck
} from 'lucide-react'
import axios from 'axios'
import { sounds } from '../utils/soundEffects'

export const ProductivityAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [days, setDays] = useState(7)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        const res = await axios.get(`/api/v1/analytics/summary?days=${days}`)
        setData(res.data)
      } catch (e) {
        console.error('Failed to fetch analytics', e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAnalytics()
  }, [days])

  if (isLoading || !data) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs font-bold space-y-2">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
        <div>Đang tổng hợp báo cáo năng suất...</div>
      </div>
    )
  }

  const maxMinutes = Math.max(...data.daily_productivity.map((d: any) => d.minutes), 1)
  const totalFocusHours = (data.total_focus_minutes / 60).toFixed(1)
  const totalXP = (data.total_focus_minutes * 2) + (data.completed_tasks_count * 10)
  const userLevel = Math.floor(totalXP / 100) + 1
  const levelProgress = totalXP % 100

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 select-none pb-6">
      {/* 1. GAMIFIED PRODUCTIVITY LEVEL HERO */}
      <div className="glass-card rounded-3xl p-4 sm:p-6 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-purple-950/30 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
              <Trophy className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Cấp Độ Năng Suất</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                Level {userLevel} • Focus Master
              </h2>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono font-black text-amber-300">{totalXP} XP</div>
            <div className="text-[9px] text-slate-400 font-bold">Điểm rèn luyện</div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-4 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
            <span>Tiến độ lên Level {userLevel + 1}</span>
            <span>{levelProgress} / 100 XP</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. TIME RANGE SELECTOR PILLS */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>Báo Cáo Hoạt Động</span>
        </h3>
        <div className="flex items-center gap-1 p-1 glass-card rounded-2xl border border-white/[0.08]">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => { sounds.playTap(); setDays(d); }}
              className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all ${
                days === d 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {d} ngày
            </button>
          ))}
        </div>
      </div>

      {/* 3. 3-GRID SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="p-3 rounded-2xl glass-card border border-white/[0.08] text-center">
          <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
          <div className="text-[10px] text-slate-400 font-semibold">Tập trung</div>
          <div className="text-sm sm:text-base font-black text-white mt-0.5 font-mono">{totalFocusHours}h</div>
        </div>

        <div className="p-3 rounded-2xl glass-card border border-white/[0.08] text-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <div className="text-[10px] text-slate-400 font-semibold">Đã xong</div>
          <div className="text-sm sm:text-base font-black text-emerald-400 mt-0.5 font-mono">{data.completed_tasks_count} tasks</div>
        </div>

        <div className="p-3 rounded-2xl glass-card border border-white/[0.08] text-center">
          <TrendingUp className="w-4 h-4 text-rose-400 mx-auto mb-1" />
          <div className="text-[10px] text-slate-400 font-semibold">Tỷ lệ xong</div>
          <div className="text-sm sm:text-base font-black text-rose-300 mt-0.5 font-mono">{data.completion_rate}%</div>
        </div>
      </div>

      {/* 4. DAILY PRODUCTIVITY BAR CHART */}
      <div className="glass-card rounded-3xl p-4 sm:p-6 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black text-white">Biểu Đồ Phút Tập Trung Hàng Ngày</div>
          <span className="text-[10px] font-bold text-slate-400">Đơn vị: Phút</span>
        </div>

        <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-44 pt-6 pb-2 border-b border-white/[0.06]">
          {data.daily_productivity.map((d: any) => {
            const barHeight = Math.max(8, (d.minutes / maxMinutes) * 100)
            const isTop = d.minutes === maxMinutes && d.minutes > 0

            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div className="text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition">
                  {d.minutes}p
                </div>
                <div 
                  className={`w-full rounded-t-xl transition-all duration-500 ${
                    isTop 
                      ? 'bg-gradient-to-t from-indigo-600 via-violet-500 to-cyan-400 shadow-md shadow-indigo-500/30' 
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                  style={{ height: `${barHeight}%` }}
                />
                <div className="text-[9px] text-slate-500 font-semibold mt-1 truncate max-w-full">
                  {d.date.slice(5)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. DATABASE SYNC & PRIVACY BADGE */}
      <div className="p-3.5 rounded-2xl glass-card border border-white/[0.08] flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-[11px] text-slate-300">
          <div className="font-bold text-white">Bảo Mật & Đồng Bộ Realtime</div>
          <div className="text-slate-400 text-[10px]">Tất cả tiến độ được lưu trên Database Ecosystem Server (Zero localStorage).</div>
        </div>
      </div>
    </div>
  )
}
