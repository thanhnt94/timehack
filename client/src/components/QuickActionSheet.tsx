import React, { useState } from 'react'
import { 
  X, 
  CheckSquare, 
  Zap, 
  Clock, 
  Timer, 
  Plus, 
  ArrowRight,
  Flame
} from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore'
import { useHabitStore } from '../store/useHabitStore'
import { useTimerStore } from '../store/useTimerStore'
import { useNavigate } from 'react-router-dom'
import { sounds } from '../utils/soundEffects'

interface QuickActionSheetProps {
  isOpen: boolean
  onClose: () => void
}

export const QuickActionSheet: React.FC<QuickActionSheetProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { createTask } = useTaskStore()
  const { createHabit } = useHabitStore()
  const { startTimer } = useTimerStore()

  const [mode, setMode] = useState<'menu' | 'task' | 'habit' | 'timer'>('menu')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskEisenhower, setTaskEisenhower] = useState<'do_first' | 'schedule' | 'delegate' | 'eliminate'>('do_first')
  const [habitTitle, setHabitTitle] = useState('')

  if (!isOpen) return null

  const handleClose = () => {
    setMode('menu')
    setTaskTitle('')
    setHabitTitle('')
    onClose()
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return
    sounds.playTap()
    await createTask({
      title: taskTitle,
      priority: taskEisenhower === 'do_first' ? 'high' : 'medium',
      eisenhower: taskEisenhower
    })
    sounds.playSuccess()
    handleClose()
  }

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!habitTitle.trim()) return
    sounds.playTap()
    await createHabit({
      title: habitTitle,
      icon: 'zap',
      color: '#10B981'
    })
    sounds.playSuccess()
    handleClose()
  }

  const handleQuickStartTimer = (mins: number) => {
    sounds.playTap()
    startTimer(`Phiên tập trung ${mins} phút`, 'pomodoro')
    handleClose()
    navigate('/focus')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in select-none">
      <div className="w-full max-w-md bg-[#0C1222] border border-white/[0.1] rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl space-y-4 relative animate-in slide-in-from-bottom duration-200">
        {/* Header bar with grab indicator on mobile */}
        <div className="w-10 h-1 rounded-full bg-slate-700 mx-auto -mt-2 mb-2 sm:hidden" />

        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <h3 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
            {mode === 'menu' && <span>⚡ Hành Động Nhanh</span>}
            {mode === 'task' && <span>🎯 Thêm Nhiệm Vụ Mới</span>}
            {mode === 'habit' && <span>🔥 Thêm Thói Quen Mới</span>}
            {mode === 'timer' && <span>⏱️ Khởi Chạy Pomodoro</span>}
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. MAIN MENU SELECTION */}
        {mode === 'menu' && (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => { sounds.playTap(); setMode('task'); }}
              className="p-4 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border border-violet-500/30 hover:border-violet-400 flex flex-col items-start gap-2 transition-all active:scale-95 text-left"
            >
              <div className="p-2.5 rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/30">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-white">Nhiệm Vụ Mới</div>
                <div className="text-[10px] text-slate-400">Ma trận Eisenhower</div>
              </div>
            </button>

            <button
              onClick={() => { sounds.playTap(); setMode('habit'); }}
              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/10 border border-emerald-500/30 hover:border-emerald-400 flex flex-col items-start gap-2 transition-all active:scale-95 text-left"
            >
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-white">Thói Quen Mới</div>
                <div className="text-[10px] text-slate-400">Duy trì chuỗi streak</div>
              </div>
            </button>

            <button
              onClick={() => { sounds.playTap(); setMode('timer'); }}
              className="p-4 rounded-2xl bg-gradient-to-br from-rose-600/20 to-pink-600/10 border border-rose-500/30 hover:border-rose-400 flex flex-col items-start gap-2 transition-all active:scale-95 text-left"
            >
              <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/30">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-white">Bắt Đầu Focus</div>
                <div className="text-[10px] text-slate-400">Đếm giờ Pomodoro</div>
              </div>
            </button>

            <button
              onClick={() => {
                sounds.playTap()
                handleClose()
                navigate('/schedule')
              }}
              className="p-4 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-600/10 border border-cyan-500/30 hover:border-cyan-400 flex flex-col items-start gap-2 transition-all active:scale-95 text-left"
            >
              <div className="p-2.5 rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-600/30">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-white">Lên Lịch Trình</div>
                <div className="text-[10px] text-slate-400">Time-blocking ngày</div>
              </div>
            </button>
          </div>
        )}

        {/* 2. CREATE TASK FORM */}
        {mode === 'task' && (
          <form onSubmit={handleCreateTask} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Tiêu đề nhiệm vụ</label>
              <input
                type="text"
                autoFocus
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Ví dụ: Làm báo cáo tiến độ quý..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Phân loại Eisenhower</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setTaskEisenhower('do_first')}
                  className={`p-2 rounded-xl text-left text-[11px] font-bold border transition ${
                    taskEisenhower === 'do_first' 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  🚨 Q1: Do First (Khẩn cấp)
                </button>
                <button
                  type="button"
                  onClick={() => setTaskEisenhower('schedule')}
                  className={`p-2 rounded-xl text-left text-[11px] font-bold border transition ${
                    taskEisenhower === 'schedule' 
                      ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' 
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  📅 Q2: Schedule (Kế hoạch)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!taskTitle.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Nhiệm Vụ Ngay</span>
            </button>
          </form>
        )}

        {/* 3. CREATE HABIT FORM */}
        {mode === 'habit' && (
          <form onSubmit={handleCreateHabit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Tên thói quen mới</label>
              <input
                type="text"
                autoFocus
                value={habitTitle}
                onChange={(e) => setHabitTitle(e.target.value)}
                placeholder="Ví dụ: Đọc sách 15 phút, Chạy bộ 2km..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={!habitTitle.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Bắt Đầu Thói Quen</span>
            </button>
          </form>
        )}

        {/* 4. QUICK TIMER LAUNCH */}
        {mode === 'timer' && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400">Chọn thời lượng tập trung:</div>
            <div className="grid grid-cols-3 gap-2">
              {[15, 25, 45, 60, 90].map(mins => (
                <button
                  key={mins}
                  onClick={() => handleQuickStartTimer(mins)}
                  className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 text-center transition active:scale-95"
                >
                  <div className="text-base font-black font-mono text-white">{mins}m</div>
                  <div className="text-[9px] text-rose-400 font-bold">Pomodoro</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
