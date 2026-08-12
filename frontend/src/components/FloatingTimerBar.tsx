import React from 'react'
import { Play, Pause, Square, Timer, Flame } from 'lucide-react'
import { useTimerStore } from '../store/useTimerStore'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export const FloatingTimerBar: React.FC = () => {
  const { isRunning, isPaused, mode, secondsRemaining, elapsedSeconds, activeTitle, pauseTimer, resumeTimer, stopTimer } = useTimerStore()
  const navigate = useNavigate()

  if (!isRunning && !isPaused) return null

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const timeDisplay = mode === 'pomodoro' ? formatTime(secondsRemaining) : formatTime(elapsedSeconds)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 glass-card px-4 md:px-5 py-3 rounded-2xl border border-violet-500/40 shadow-2xl shadow-violet-950/50 flex items-center justify-between md:justify-start gap-2 md:gap-4 bg-[#0F172A]/95"
      >
        <div 
          onClick={() => navigate('/focus')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
            <Timer className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-400" />
              <span>Đang tập trung ({mode})</span>
            </div>
            <div className="text-xs font-bold text-white truncate max-w-[180px]">{activeTitle}</div>
          </div>
        </div>

        <div className="text-xl font-black font-mono text-cyan-400 tracking-wider px-2">
          {timeDisplay}
        </div>

        <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
          {isPaused ? (
            <button
              onClick={resumeTimer}
              className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all"
              title="Tiếp tục"
            >
              <Play className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="p-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 transition-all"
              title="Tạm dừng"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => stopTimer()}
            className="p-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 transition-all"
            title="Kết thúc phiên"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
