import React, { useState, useEffect } from 'react'
import {
  X, Play, Pause, Square,
  CloudRain, Trees, Waves, Coffee, VolumeX, Sparkles, Flame,
  Folder, Tag, ChevronDown, Check
} from 'lucide-react'
import { useTimerStore } from '../store/useTimerStore'
import { useTaskStore } from '../store/useTaskStore'
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
    activeCategoryId,
    activeCategoryName,
    activeCategoryColor,
    activeCategoryIcon,
    activeCategoryType,
    setCategory,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    setMode
  } = useTimerStore()

  const { categories, fetchCategories } = useTaskStore()
  const [activeAmbient, setActiveAmbient] = useState<string | null>(ambientSound.getCurrentSound())
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const targetDuration =
    currentPhase === 'work'
      ? workDuration
      : currentPhase === 'short_break'
      ? shortBreakDuration
      : longBreakDuration

  const progressPercent =
    mode === 'pomodoro'
      ? targetDuration > 0
        ? ((targetDuration - secondsRemaining) / targetDuration) * 100
        : 0
      : 100

  const ringSize = 270
  const strokeWidth = 14
  const radius = (ringSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

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

  const handleSelectCategory = (cat: any) => {
    sounds.playTap()
    setCategory(cat)
    setCategoryPickerOpen(false)
  }

  const ambientButtons = [
    { id: 'rain', label: 'Rain', icon: CloudRain, color: 'text-sky-600' },
    { id: 'forest', label: 'Forest', icon: Trees, color: 'text-emerald-600' },
    { id: 'waves', label: 'Waves', icon: Waves, color: 'text-blue-600' },
    { id: 'cafe', label: 'Cafe', icon: Coffee, color: 'text-amber-600' },
  ] as const

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col justify-between px-6 py-6 select-none animate-fade-in text-slate-900">
      {/* ── Top Header ──────────────── */}
      <div className="flex items-center justify-between">
        {/* Mode & Phase Badge */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-200/80 p-1 rounded-2xl border border-slate-300">
            <button
              onClick={() => { sounds.playTap(); setMode('pomodoro') }}
              className={`px-3.5 py-1 rounded-xl text-xs font-bold transition ${
                mode === 'pomodoro'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => { sounds.playTap(); setMode('stopwatch') }}
              className={`px-3.5 py-1 rounded-xl text-xs font-bold transition ${
                mode === 'stopwatch'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stopwatch
            </button>
          </div>

          {mode === 'pomodoro' && (
            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
              currentPhase === 'work'
                ? 'bg-violet-50 border-violet-200 text-violet-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              {currentPhase === 'work' ? '🔥 Focus' : currentPhase === 'short_break' ? '☕ Short Break' : '🌴 Long Break'}
            </span>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => { sounds.playTap(); onClose() }}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 active:scale-90 transition shadow-sm"
          title="Minimize"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Center: Circular Timer ─────── */}
      <div className="flex flex-col items-center justify-center my-auto">
        {/* Active Title & Category Tag */}
        <div className="text-center max-w-sm mb-4 space-y-2">
          {/* Category Selector Pill */}
          <div className="relative inline-block">
            <button
              onClick={() => { sounds.playTap(); setCategoryPickerOpen(!categoryPickerOpen) }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs hover:border-violet-300 hover:bg-violet-50/50 transition active:scale-95"
            >
              {activeCategoryName ? (
                <>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: activeCategoryColor || '#8B5CF6' }}
                  />
                  <span>{activeCategoryName}</span>
                  <span className="text-[10px] text-slate-400">
                    ({activeCategoryType === 'wasted' ? '🔴 Lãng phí' : activeCategoryType === 'neutral' ? '🔵 Sinh hoạt' : '🟢 Giá trị'})
                  </span>
                </>
              ) : (
                <>
                  <Tag className="w-3.5 h-3.5 text-violet-600" />
                  <span>Chọn danh mục phân loại</span>
                </>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Category Dropdown Modal / Popover */}
            {categoryPickerOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 max-h-60 overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-left space-y-1 anim-scale-in">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tag Focus Category
                </div>
                <button
                  onClick={() => handleSelectCategory(null)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    !activeCategoryId ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Uncategorized</span>
                  {!activeCategoryId && <Check className="w-3.5 h-3.5 text-violet-600" />}
                </button>

                {categories.map(c => (
                  <div key={c.id} className="space-y-0.5">
                    <button
                      onClick={() => handleSelectCategory(c)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        activeCategoryId === c.id ? 'bg-violet-50 text-violet-700' : 'text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="truncate">{c.name}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 shrink-0">
                        {c.category_type === 'wasted' ? '🔴' : c.category_type === 'neutral' ? '🔵' : '🟢'}
                      </span>
                    </button>

                    {/* Subcategories */}
                    {c.subcategories && c.subcategories.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => handleSelectCategory(sub)}
                        className={`w-full flex items-center justify-between pl-6 pr-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                          activeCategoryId === sub.id ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-slate-300">↳</span>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sub.color || c.color }} />
                          <span className="truncate">{sub.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <h2 className="text-xl font-black text-slate-900 truncate">{activeTitle || 'Deep Focus Session'}</h2>
        </div>

        {/* SVG Progress Circle */}
        <div className="relative flex items-center justify-center">
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            {/* Background Track */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Animated Progress Ring */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke="url(#focusPurpleGrad)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={mode === 'pomodoro' ? strokeDashoffset : 0}
              className="transition-all duration-500 ease-linear"
            />
            <defs>
              <linearGradient id="focusPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#9333EA" />
              </linearGradient>
            </defs>
          </svg>

          {/* Time text & Rapid Mascot centered inside circle */}
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            {/* Mascot State Avatar */}
            <div className="w-12 h-12 mb-0.5 relative flex items-center justify-center">
              <img
                src={
                  currentPhase === 'short_break' || currentPhase === 'long_break'
                    ? '/mascot/rapid_sleepy.svg'
                    : isRunning && !isPaused
                    ? '/mascot/rapid_focus.svg'
                    : '/mascot/rapid_3d_mascot.png'
                }
                alt="Rapid the Mascot"
                className={`w-full h-full object-contain drop-shadow-xs ${isRunning && !isPaused ? 'animate-pulse' : ''}`}
              />
            </div>

            <span className="text-5xl font-black text-slate-900 font-mono tracking-tight">
              {mode === 'pomodoro' ? formatTime(secondsRemaining) : formatTime(elapsedSeconds)}
            </span>
            {mode === 'pomodoro' && (
              <span className="text-xs text-slate-500 font-bold mt-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>{completedPomodoros} Pomodoro completed</span>
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
              className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center active:scale-90 transition shadow-sm"
              title="Finish & Save"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          )}

          {/* Big Play / Pause (Purple Flat) */}
          <button
            onClick={handleTogglePlay}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg active:scale-95 transition-transform ${
              isRunning && !isPaused
                ? 'bg-white border-2 border-violet-600 text-violet-700 shadow-violet-200'
                : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/30'
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
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ambient Soundscape</span>
          {activeAmbient && (
            <button
              onClick={handleStopAmbient}
              className="text-[11px] text-rose-600 font-bold hover:underline flex items-center gap-1"
            >
              <VolumeX className="w-3.5 h-3.5" /> Mute
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
                    ? 'bg-violet-50 border-violet-300 text-violet-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isPlaying ? item.color : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
