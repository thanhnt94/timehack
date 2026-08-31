import React from 'react'
import { Play, Pause, Square, Flame } from 'lucide-react'
import { useTimerStore } from '../store/useTimerStore'

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
    setMode 
  } = useTimerStore()

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const timeDisplay = mode === 'pomodoro' ? formatTime(secondsRemaining) : formatTime(elapsedSeconds)

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-300">
      {/* Mode Switcher */}
      <div className="p-1.5 glass-card rounded-2xl flex items-center gap-2 border border-rose-500/30">
        <button
          onClick={() => setMode('pomodoro')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            mode === 'pomodoro' ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Pomodoro (25 Min)
        </button>
        <button
          onClick={() => setMode('stopwatch')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            mode === 'stopwatch' ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Stopwatch (Bấm Giờ Tự Do)
        </button>
      </div>

      {/* Main Focus Ring Card */}
      <div className="p-12 glass-card rounded-full border border-rose-500/30 bg-gradient-to-b from-rose-950/20 via-slate-900/90 to-purple-950/20 shadow-2xl shadow-rose-950/80 text-center flex flex-col items-center justify-center relative w-80 h-80 md:w-96 md:h-96">
        <div className="absolute inset-0 rounded-full border-4 border-slate-800 pointer-events-none" />
        
        {/* Active Title */}
        <div className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
          <Flame className="w-4 h-4 fill-rose-400" />
          <span>{currentPhase === 'work' ? 'Phiên Tập Trung' : 'Nghỉ Ngơi'}</span>
        </div>

        {/* Big Timer Display */}
        <div className="text-6xl md:text-7xl font-black font-mono text-white tracking-widest drop-shadow-lg my-2">
          {timeDisplay}
        </div>

        <p className="text-xs text-slate-400 font-semibold max-w-[200px] truncate">
          {activeTitle}
        </p>

        <div className="text-[10px] text-slate-500 font-bold mt-3">
          Đã hoàn thành: <span className="text-rose-400">{completedPomodoros}</span> phiên Pomodoro
        </div>
      </div>

      {/* Control Action Buttons */}
      <div className="flex items-center gap-4">
        {!isRunning && !isPaused ? (
          <button
            onClick={() => startTimer()}
            className="px-8 py-4 bg-gradient-to-r from-rose-600 via-pink-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-600/30 transition-all flex items-center gap-3 uppercase tracking-wider glow-violet"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Bắt Đầu Tập Trung</span>
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={resumeTimer}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 uppercase tracking-wider"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Tiếp Tục</span>
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="px-6 py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 uppercase tracking-wider"
              >
                <Pause className="w-4 h-4" />
                <span>Tạm Dừng</span>
              </button>
            )}

            <button
              onClick={() => stopTimer()}
              className="px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 uppercase tracking-wider"
            >
              <Square className="w-4 h-4" />
              <span>Kết Thúc Phiên</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
