import React, { useState, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Flame, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  CloudRain, 
  TreePine, 
  Waves, 
  Coffee,
  CheckCircle2,
  ListTodo
} from 'lucide-react'
import { useTimerStore } from '../store/useTimerStore'
import { useTaskStore } from '../store/useTaskStore'

export const PomodoroFocus: React.FC = () => {
  const { 
    mode, 
    isRunning, 
    isPaused, 
    currentPhase, 
    secondsRemaining, 
    elapsedSeconds, 
    activeTitle, 
    completedPomodoros,
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    stopTimer, 
    setMode,
    setActiveTitle
  } = useTimerStore()

  const { tasks, fetchTasks } = useTaskStore()
  const [selectedSoundscape, setSelectedSoundscape] = useState<string | null>(null)
  const [showTaskSelector, setShowTaskSelector] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const totalDuration = currentPhase === 'work' ? 25 * 60 : (currentPhase === 'short_break' ? 5 * 60 : 15 * 60)
  const progressPercent = mode === 'pomodoro' 
    ? Math.min(100, Math.max(0, ((totalDuration - secondsRemaining) / totalDuration) * 100))
    : 100

  const timeDisplay = mode === 'pomodoro' ? formatTime(secondsRemaining) : formatTime(elapsedSeconds)

  const soundscapes = [
    { id: 'rain', label: 'Mưa rơi', icon: CloudRain, color: 'text-cyan-400' },
    { id: 'forest', label: 'Rừng thông', icon: TreePine, color: 'text-emerald-400' },
    { id: 'waves', label: 'Sóng biển', icon: Waves, color: 'text-blue-400' },
    { id: 'cafe', label: 'Lofi Cafe', icon: Coffee, color: 'text-amber-400' }
  ]

  return (
    <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 py-2 select-none animate-in fade-in duration-300 max-w-md mx-auto">
      {/* 1. FOCUS MODE SELECTOR PILLS */}
      <div className="p-1 glass-card rounded-2xl flex items-center gap-1 border border-white/[0.08] w-full justify-between">
        <button
          onClick={() => { setMode('pomodoro'); stopTimer(); }}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            mode === 'pomodoro' && currentPhase === 'work'
              ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🎯 Focus (25m)
        </button>
        <button
          onClick={() => { setMode('pomodoro'); stopTimer(); }}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            mode === 'pomodoro' && currentPhase !== 'work'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ☕ Nghỉ (5m)
        </button>
        <button
          onClick={() => { setMode('stopwatch'); stopTimer(); }}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            mode === 'stopwatch'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ⏱️ Tự do
        </button>
      </div>

      {/* 2. CIRCULAR NEON FOCUS RING (IMMERSIVE APP GAUGE) */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
        {/* Ambient Glow */}
        <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
          isRunning 
            ? 'bg-rose-600/20 scale-110' 
            : 'bg-violet-600/15'
        }`} />

        {/* SVG Progress Circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            className="text-slate-900/80 stroke-current"
            strokeWidth="5"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            className="transition-all duration-500"
            strokeWidth="5"
            strokeDasharray={276.46}
            strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
            strokeLinecap="round"
            stroke="url(#focusGlowGrad)"
            fill="transparent"
          />
          <defs>
            <linearGradient id="focusGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-400 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/25 mb-1">
            <Flame className="w-3 h-3 fill-rose-400 animate-bounce" />
            <span>{currentPhase === 'work' ? 'Đang Tập Trung' : 'Nghỉ Ngơi'}</span>
          </div>

          <div className="text-5xl sm:text-6xl font-black font-mono text-white tracking-wider my-1 drop-shadow-md">
            {timeDisplay}
          </div>

          {/* Bound Task Title or Selector */}
          <button
            onClick={() => setShowTaskSelector(prev => !prev)}
            className="text-[11px] font-bold text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-xl max-w-[190px] truncate flex items-center gap-1 transition active:scale-95 mt-1"
          >
            <ListTodo className="w-3 h-3 text-violet-400 shrink-0" />
            <span className="truncate">{activeTitle || 'Chọn nhiệm vụ...'}</span>
          </button>
        </div>
      </div>

      {/* 3. TASK BINDING DROPDOWN (OPTIONAL OVERLAY) */}
      {showTaskSelector && (
        <div className="w-full glass-card rounded-2xl p-3 border border-violet-500/30 space-y-2 animate-in fade-in">
          <div className="text-xs font-bold text-violet-300">Gán thời gian cho nhiệm vụ:</div>
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {tasks.filter(t => t.status !== 'completed').map(task => (
              <button
                key={task.id}
                onClick={() => {
                  setActiveTitle(task.title)
                  setShowTaskSelector(false)
                }}
                className="w-full text-left p-2 rounded-xl bg-slate-900/80 hover:bg-violet-600/20 border border-slate-800 text-xs font-semibold text-white truncate transition flex items-center justify-between"
              >
                <span className="truncate">{task.title}</span>
                <span className="text-[9px] text-slate-400 font-mono shrink-0 ml-2">{Math.round(task.spent_seconds / 60)}p</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. PRIMARY CONTROLS (TACTILE BIG BUTTONS) */}
      <div className="flex items-center gap-3 w-full justify-center">
        {!isRunning && !isPaused ? (
          <button
            onClick={() => startTimer(activeTitle || 'Phiên làm việc sâu', mode)}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Bắt Đầu Tập Trung</span>
          </button>
        ) : isRunning ? (
          <>
            <button
              onClick={() => pauseTimer()}
              className="flex-1 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-sm shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Tạm Dừng</span>
            </button>
            <button
              onClick={() => stopTimer()}
              className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition active:scale-95"
              title="Kết thúc phiên"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => resumeTimer()}
              className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Tiếp Tục</span>
            </button>
            <button
              onClick={() => stopTimer()}
              className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition active:scale-95"
              title="Kết thúc"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          </>
        )}
      </div>

      {/* 5. AMBIENT SOUNDSCAPES BAR */}
      <div className="w-full glass-card rounded-2xl p-2.5 border border-white/[0.08] space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-cyan-400" />
            <span>Âm thanh nền tăng tập trung</span>
          </span>
          {selectedSoundscape && (
            <button 
              onClick={() => setSelectedSoundscape(null)}
              className="text-[10px] text-rose-400 hover:underline"
            >
              Tắt
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {soundscapes.map(snd => {
            const Icon = snd.icon
            const isSel = selectedSoundscape === snd.id
            return (
              <button
                key={snd.id}
                onClick={() => setSelectedSoundscape(isSel ? null : snd.id)}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all active:scale-95 ${
                  isSel 
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 mb-0.5 ${snd.color}`} />
                <span className="text-[9px] font-bold">{snd.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 6. COMPLETED POMODORO BADGE */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-bold text-slate-300">
        <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
        <span>Hôm nay đã hoàn thành <strong className="text-white font-mono">{completedPomodoros}</strong> phiên Pomodoro</span>
      </div>
    </div>
  )
}
