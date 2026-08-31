import React from 'react'
import { Play, Pause, Maximize2 } from 'lucide-react'
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
      className="fixed bottom-[calc(64px+var(--safe-bottom))] left-3 right-3 md:left-64 md:right-8 z-30 cursor-pointer animate-slide-up"
    >
      <div className="rounded-2xl px-4 py-2.5 flex items-center justify-between border border-violet-200 bg-white shadow-lg shadow-slate-300/40 hover:border-violet-400 transition active:scale-[0.98]">
        {/* Left: Indicator & Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Pulsing Dot */}
          <div className="relative flex items-center justify-center shrink-0">
            <span className={`w-2.5 h-2.5 rounded-full ${
              isPaused ? 'bg-amber-500' : 'bg-violet-600'
            }`} />
            {!isPaused && (
              <span className="absolute w-4 h-4 rounded-full bg-violet-600/40 animate-ping" />
            )}
          </div>

          {/* Title & Phase */}
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[240px]">
              {activeTitle || 'Phiên tập trung'}
            </div>
            <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
              <span className={currentPhase === 'work' ? 'text-violet-600' : 'text-emerald-600'}>
                {mode === 'pomodoro' ? (currentPhase === 'work' ? 'Làm việc' : 'Nghỉ ngơi') : 'Bấm giờ'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Time & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-base font-black text-slate-900 font-mono tracking-tight">
            {timeText}
          </span>

          {/* Play/Pause toggle */}
          <button
            onClick={handleTogglePlay}
            className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 flex items-center justify-center hover:bg-violet-600 hover:text-white active:scale-90 transition"
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            ) : (
              <Pause className="w-3.5 h-3.5 fill-current" />
            )}
          </button>

          {/* Expand icon */}
          <div className="text-slate-400 hover:text-slate-600 p-1">
            <Maximize2 className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
