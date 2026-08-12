import React, { useEffect, useState } from 'react'
import { BarChart3, Clock, CheckCircle2, TrendingUp } from 'lucide-react'
import axios from 'axios'

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
    return <div className="p-12 text-center text-slate-400 text-xs font-bold">Đang tải báo cáo thống kê...</div>
  }

  const maxMinutes = Math.max(...data.daily_productivity.map((d: any) => d.minutes), 1)

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Thống Kê & Báo Cáo Năng Suất (Analytics)</h1>
          <p className="text-xs text-slate-400">Đánh giá thời gian làm việc thực tế, tỷ lệ hoàn thành công việc.</p>
        </div>

        <div className="flex items-center gap-2 p-1 glass-card rounded-2xl">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                days === d ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {d} ngày qua
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 glass-card rounded-3xl border border-indigo-500/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">Tổng Giờ Làm Việc</div>
            <div className="text-2xl font-black text-white">{data.total_hours} <span className="text-sm font-normal text-slate-400">Giờ</span></div>
          </div>
        </div>

        <div className="p-6 glass-card rounded-3xl border border-emerald-500/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">Tasks Đã Hoàn Thành</div>
            <div className="text-2xl font-black text-white">{data.completed_tasks_count} / {data.total_tasks_count}</div>
          </div>
        </div>

        <div className="p-6 glass-card rounded-3xl border border-cyan-500/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">Trung Bình Mỗi Ngày</div>
            <div className="text-2xl font-black text-white">
              {roundTwo(data.total_hours / days)} <span className="text-sm font-normal text-slate-400">Giờ/Ngày</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Time Bar Chart */}
      <div className="p-6 glass-card rounded-3xl space-y-4 border border-indigo-500/20">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>Biểu Đồ Thời Gian Làm Việc Theo Ngày (Phút)</span>
        </h3>

        <div className="h-64 flex items-end justify-between gap-2 pt-6 pb-2 px-4 border-b border-slate-800">
          {data.daily_productivity.map((d: any, idx: number) => {
            const heightPercent = Math.max(8, Math.round((d.minutes / maxMinutes) * 100))

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="text-[10px] font-mono font-bold text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.minutes}m
                </div>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[36px] bg-gradient-to-t from-violet-600 to-cyan-400 rounded-t-xl group-hover:brightness-125 transition-all shadow-lg shadow-violet-600/20"
                />
                <div className="text-[10px] font-bold text-slate-400">{d.day_name}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function roundTwo(num: number) {
  return Math.round(num * 10) / 10
}
