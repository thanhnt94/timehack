import React, { useState, useEffect } from 'react'
import {
  X, Play, Pause, Square, SkipForward,
  CloudRain, Trees, Waves, Coffee, VolumeX, Sparkles, Flame
} from 'lucide-react'
import { useTimerStore } from '../store/useTimerStore'
import { ambientSound } from '../utils/ambientAudio'
import { sounds } from '../utils/soundEffects'

interface Props {
  onClose: () => void
}

export const PomodoroFocus: React.FC<Props> = ({ onClose }) => {
  const {
    mode,
    isRunning,
    isPaused,
    currentPhase,
    secondsRemaining,
    elapsedSeconds,
    workDuration,
    shortBreakDuration,
    longBreakDuration,
    completedPomodoros,
    activeTitle,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    setMode
  } = useTimerStore()

  const [activeAmbient, setActiveAmbient] = useState<string | null>(ambientSound.getCurrentSound())

  // Format seconds to MM:SS
  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Calculate duration target for current phase
  const targetDuration =
    currentPhase === 'work'
      ? workDuration
      : currentPhase === 'short_break'
      ? shortBreakDuration
      : longBreakDuration

  // Percentage for SVG ring
  const progressPercent =
    mode === 'pomodoro'
      ? targetDuration > 0
        ? ((targetDuration - secondsRemaining) / targetDuration) * 100
        : 0
      : 100

  // SVG ring parameters
  const ringSize = 260
  const strokeWidth = 12
  const radius = (ringSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  // Ambient sound handler
  const handleToggleAmbient = (soundId: 'rain' | 'forest' | 'waves' | 'cafe') => {
    sounds.playTap()
    if (activeAmbient === soundId) {
      ambientSound.stop()
      setActiveAmbient(null)
    } else {
      ambientSound.play(soundId)
      setActiveAmbient(soundId)
    }
  }

  const handleStopAmbient = () => {
    sounds.playTap()
    ambientSound.stop()
    setActiveAmbient(null)
  }

  // Handle Play/Pause
  const handleTogglePlay = () => {
    sounds.playTap()
    if (!isRunning) {
      startTimer()
    } else if (isPaused) {
      resumeTimer()
    } else {
      pauseTimer()
    }
  }

  const handleStop = async () => {
    sounds.playTap()
    await stopTimer()
    sounds.playSuccess()
    onClose()
  }

  const ambientButtons = [
    { id: 'rain', label: 'Mưa', icon: CloudRain, color: 'text-cyan-400' },
    { id: 'forest', label: 'Rừng', icon: Trees, color: 'text-emerald-400' },
    { id: 'waves', label: 'Biển', icon: Waves, color: 'text-blue-400' },
    { id: 'cafe', label: 'Cafe', icon: Coffee, color: 'text-amber-400' },
  ] as const

  return (
    <div className="fixed inset-0 z-50 bg-[#050810]/98 backdrop-blur-2xl flex flex-col justify-between px-6 py-6 select-none animate-fade-in">
      {/* ── Top Header ──────────────── */}
      <div className="flex items-center justify-between">
        {/* Mode & Phase Badge */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-[var(--border-subtle)]">
            <button
              onClick={() => { sounds.playTap(); setMode('pomodoro') }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                mode === 'pomodoro'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => { sounds.playTap(); setMode('stopwatch') }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                mode === 'stopwatch'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bấm giờ
            </button>
          </div>

          {mode === 'pomodoro' && (
            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
              currentPhase === 'work'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}>
              {currentPhase === 'work' ? '🔥 Làm việc' : currentPhase === 'short_break' ? '☕ Nghỉ ngắn' : '🌴 Nghỉ dài'}
            </span>
          )}
        </div>

        {/* Close / Minimize button */}
        <button
          onClick={() => { sounds.playTap(); onClose() }}
          className="p-2.5 rounded-2xl bg-slate-900/80 border border-[var(--border-subtle)] text-slate-400 hover:text-white active:scale-90 transition"
          title="Thu nhỏ"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Center: Circular Timer ─────── */}
      <div className="flex flex-col items-center justify-center my-auto">
        {/* Active Title */}
        <div className="text-center max-w-xs mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-semibold text-slate-400 mb-2">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Mục tiêu phiên</span>
          </div>
          <h2 className="text-lg font-bold text-white truncate">{activeTitle || 'Phiên tập trung'}</h2>
        </div>

        {/* SVG Progress Circle */}
        <div className="relative flex items-center justify-center">
          {/* Ambient Glow */}
          <div className={`absolute w-48 h-48 rounded-full blur-[80px] -z-10 transition-colors duration-700 ${
            currentPhase === 'work' ? 'bg-violet-600/20' : 'bg-emerald-500/20'
          }`} />

          <svg width={ringSize} height={ringSize} className="-rotate-90">
            {/* Background Track */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Animated Progress Ring */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke={currentPhase === 'work' ? 'url(#focusGrad)' : 'url(#breakGrad)'}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={mode === 'pomodoro' ? strokeDashoffset : 0}
              className="transition-all duration-500 ease-linear"
            />
            <defs>
              <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#F43F5E" />
              </linearGradient>
              <linearGradient id="breakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>

          {/* Time text centered inside circle */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-white font-mono tracking-tight drop-shadow-md">
              {mode === 'pomodoro' ? formatTime(secondsRemaining) : formatTime(elapsedSeconds)}
            </span>
            {mode === 'pomodoro' && (
              <span className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>{completedPomodoros} Pomodoro hoàn thành</span>
              </span>
            )}
          </div>
        </div>

        {/* ── Main Controls (Play / Pause / Stop) ── */}
        <div className="flex items-center gap-4 mt-8">
          {/* Stop & Save */}
          {isRunning && (
            <button
              onClick={handleStop}
              className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-rose-400 flex items-center justify-center active:scale-90 transition"
              title="Kết thúc & Lưu"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          )}

          {/* Big Play / Pause */}
          <button
            onClick={handleTogglePlay}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl active:scale-95 transition-transform ${
              isRunning && !isPaused
                ? 'bg-slate-900 border-2 border-violet-500/50 text-violet-400 shadow-violet-950/50'
                : 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-violet-600/40'
            }`}
          >
            {isRunning && !isPaused ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>
        </div>
      </div>

      {/* ── Bottom: Ambient Soundscapes Bar ──── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Âm thanh nền (Ambient)</span>
          {activeAmbient && (
            <button
              onClick={handleStopAmbient}
              className="text-[10px] text-rose-400 hover:underline flex items-center gap-1"
            >
              <VolumeX className="w-3 h-3" /> Tắt âm
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {ambientButtons.map(item => {
            const Icon = item.icon
            const isPlaying = activeAmbient === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleToggleAmbient(item.id)}
                className={`py-2.5 px-2 rounded-2xl border flex flex-col items-center gap-1 transition active:scale-95 ${
                  isPlaying
                    ? 'bg-violet-600/20 border-violet-500/50 text-white shadow-lg shadow-violet-950/50'
                    : 'bg-slate-900/60 border-[var(--border-subtle)] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isPlaying ? item.color : 'text-slate-400'}`} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
