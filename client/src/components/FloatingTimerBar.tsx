import React from 'react'
import { Play, Pause, Maximize2, Flame } from 'lucide-react'
import { useTimerStore } from '../store/useTimerStore'
import { sounds } from '../utils/soundEffects'

interface Props {
  onTap: () => void
}

export const FloatingTimerBar: React.FC<Props> = ({ onTap }) => {
  const {
    isRunning,
    isPaused,
    mode,
    currentPhase,
    secondsRemaining,
    elapsedSeconds,
    activeTitle,
    pauseTimer,
    resumeTimer
  } = useTimerStore()

  if (!isRunning) return null

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const timeText = mode === 'pomodoro' ? formatTime(secondsRemaining) : formatTime(elapsedSeconds)

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    sounds.playTap()
    if (isPaused) {
      resumeTimer()
    } else {
      pauseTimer()
    }
  }

  return (
    <div
      onClick={() => { sounds.playTap(); onTap() }}
      className="fixed bottom-[calc(62px+var(--safe-bottom))] left-3 right-3 md:left-64 md:right-8 z-30 cursor-pointer animate-slide-up"
    >
      <div className="glass-elevated rounded-2xl px-4 py-2.5 flex items-center justify-between border border-violet-500/40 bg-[#0C1222]/95 shadow-xl shadow-violet-950/40 hover:border-violet-400/60 transition active:scale-[0.98]">
        {/* Left: Indicator & Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Pulsing Dot */}
          <div className="relative flex items-center justify-center shrink-0">
            <span className={`w-2.5 h-2.5 rounded-full ${
              isPaused ? 'bg-amber-400' : 'bg-rose-500'
            }`} />
            {!isPaused && (
              <span className="absolute w-4 h-4 rounded-full bg-rose-500/50 animate-ping" />
            )}
          </div>

          {/* Title & Phase */}
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-[240px]">
              {activeTitle || 'Phiên tập trung'}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <span className={currentPhase === 'work' ? 'text-rose-400' : 'text-emerald-400'}>
                {mode === 'pomodoro' ? (currentPhase === 'work' ? 'Làm việc' : 'Nghỉ ngơi') : 'Bấm giờ'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Time & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-base font-black text-white font-mono tracking-tight drop-shadow">
            {timeText}
          </span>

          {/* Play/Pause toggle */}
          <button
            onClick={handleTogglePlay}
            className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 flex items-center justify-center hover:bg-violet-600 hover:text-white active:scale-90 transition"
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            ) : (
              <Pause className="w-3.5 h-3.5 fill-current" />
            )}
          </button>

          {/* Expand icon */}
          <div className="text-slate-500 hover:text-slate-300 p-1">
            <Maximize2 className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
