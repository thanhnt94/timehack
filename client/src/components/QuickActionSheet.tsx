import React, { useState } from 'react'
import {
  X, ArrowLeft, CheckSquare, Zap, Play, Calendar,
  Sparkles, Check
} from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore'
import { useHabitStore } from '../store/useHabitStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { useTimerStore } from '../store/useTimerStore'
import { sounds } from '../utils/soundEffects'

interface Props {
  isOpen: boolean
  onClose: () => void
  onStartFocus: () => void
}

type SubView = 'menu' | 'task' | 'habit' | 'schedule'

const HABIT_COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E', '#6366F1']

const EISENHOWER_QUADRANTS = [
  { key: 'do_first', label: 'Q1 · Khẩn cấp & Quan trọng', color: 'border-rose-500/40 text-rose-400' },
  { key: 'schedule', label: 'Q2 · Quan trọng, chưa gấp', color: 'border-violet-500/40 text-violet-400' },
  { key: 'delegate', label: 'Q3 · Gấp, ít quan trọng', color: 'border-amber-500/40 text-amber-400' },
  { key: 'eliminate', label: 'Q4 · Không gấp & quan trọng', color: 'border-slate-700 text-slate-500' },
] as const

export const QuickActionSheet: React.FC<Props> = ({ isOpen, onClose, onStartFocus }) => {
  const [subView, setSubView] = useState<SubView>('menu')

  // Task form state
  const [taskTitle, setTaskTitle] = useState('')
  const [taskEisen, setTaskEisen] = useState<'do_first' | 'schedule' | 'delegate' | 'eliminate'>('do_first')
  const { createTask } = useTaskStore()

  // Habit form state
  const [habitTitle, setHabitTitle] = useState('')
  const [habitColor, setHabitColor] = useState(HABIT_COLORS[0])
  const { createHabit } = useHabitStore()

  // Schedule form state
  const [scheduleTitle, setScheduleTitle] = useState('')
  const [scheduleStart, setScheduleStart] = useState('09:00')
  const [scheduleEnd, setScheduleEnd] = useState('10:00')
  const { createSlot, selectedDate } = useScheduleStore()

  const { startTimer } = useTimerStore()

  if (!isOpen) return null

  const handleClose = () => {
    setSubView('menu')
    onClose()
  }

  // Handle Task Submit
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return
    sounds.playTap()
    await createTask({ title: taskTitle.trim(), eisenhower: taskEisen })
    sounds.playSuccess()
    setTaskTitle('')
    handleClose()
  }

  // Handle Habit Submit
  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!habitTitle.trim()) return
    sounds.playTap()
    await createHabit({
      title: habitTitle.trim(),
      color: habitColor,
      icon: '⚡',
      target_count: 1,
      unit: 'lần',
      frequency_type: 'daily'
    })
    sounds.playSuccess()
    setHabitTitle('')
    handleClose()
  }

  // Handle Schedule Submit
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scheduleTitle.trim()) return
    sounds.playTap()
    await createSlot({
      date: selectedDate,
      start_time: scheduleStart,
      end_time: scheduleEnd,
      title: scheduleTitle.trim()
    })
    sounds.playSuccess()
    setScheduleTitle('')
    handleClose()
  }

  // Handle Quick Focus Tap
  const handleDirectFocus = () => {
    sounds.playTap()
    startTimer({ title: 'Phiên tập trung nhanh' })
    handleClose()
    onStartFocus()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="sheet-backdrop" onClick={handleClose} />

      {/* Sheet Content */}
      <div className="sheet-content">
        <div className="sheet-handle" />

        {/* ── Menu Header ───────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {subView !== 'menu' && (
              <button
                onClick={() => { sounds.playTap(); setSubView('menu') }}
                className="p-1 -ml-1 text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-sm font-black text-white">
              {subView === 'menu' && 'Tạo Mới Nhanh'}
              {subView === 'task' && 'Tạo Nhiệm Vụ Mới'}
              {subView === 'habit' && 'Tạo Thói Quen Mới'}
              {subView === 'schedule' && 'Lên Lịch Khung Giờ'}
            </h2>
          </div>
          <button onClick={handleClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── View 1: 2x2 Action Cards Menu ── */}
        {subView === 'menu' && (
          <div className="grid grid-cols-2 gap-2.5 pb-2">
            {/* 1. Nhiệm vụ */}
            <button
              onClick={() => { sounds.playTap(); setSubView('task') }}
              className="glass rounded-2xl p-4 flex flex-col items-start gap-2 border border-violet-500/20 hover:border-violet-500/50 active:scale-95 transition text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Nhiệm Vụ</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Thêm việc cần làm</div>
              </div>
            </button>

            {/* 2. Thói quen */}
            <button
              onClick={() => { sounds.playTap(); setSubView('habit') }}
              className="glass rounded-2xl p-4 flex flex-col items-start gap-2 border border-emerald-500/20 hover:border-emerald-500/50 active:scale-95 transition text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Thói Quen</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Xây dựng chuỗi streak</div>
              </div>
            </button>

            {/* 3. Bắt đầu Focus */}
            <button
              onClick={handleDirectFocus}
              className="glass rounded-2xl p-4 flex flex-col items-start gap-2 border border-rose-500/20 hover:border-rose-500/50 active:scale-95 transition text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Tập Trung</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Bắt đầu Pomodoro ngay</div>
              </div>
            </button>

            {/* 4. Lên Lịch */}
            <button
              onClick={() => { sounds.playTap(); setSubView('schedule') }}
              className="glass rounded-2xl p-4 flex flex-col items-start gap-2 border border-cyan-500/20 hover:border-cyan-500/50 active:scale-95 transition text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Khung Giờ</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Khóa thời gian trong ngày</div>
              </div>
            </button>
          </div>
        )}

        {/* ── View 2: Form Tạo Task ─────── */}
        {subView === 'task' && (
          <form onSubmit={handleCreateTask} className="space-y-3">
            <input
              type="text"
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              placeholder="Tên nhiệm vụ cần làm..."
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-[var(--border-default)] text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500"
            />

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Mức độ ưu tiên (Eisenhower)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {EISENHOWER_QUADRANTS.map(q => (
                  <button
                    key={q.key}
                    type="button"
                    onClick={() => setTaskEisen(q.key)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                      taskEisen === q.key
                        ? `bg-violet-600/20 ${q.color}`
                        : 'bg-slate-900/80 border-slate-800 text-slate-400'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold text-sm active:scale-[0.97] transition shadow-lg shadow-violet-600/30"
            >
              Lưu Nhiệm Vụ
            </button>
          </form>
        )}

        {/* ── View 3: Form Tạo Habit ────── */}
        {subView === 'habit' && (
          <form onSubmit={handleCreateHabit} className="space-y-3">
            <input
              type="text"
              value={habitTitle}
              onChange={e => setHabitTitle(e.target.value)}
              placeholder="Tên thói quen mới (ví dụ: Đọc sách 20p)..."
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-[var(--border-default)] text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Chọn màu sắc nhận diện
              </label>
              <div className="flex gap-2">
                {HABIT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setHabitColor(c)}
                    className={`w-8 h-8 rounded-xl transition active:scale-90 ${
                      habitColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm active:scale-[0.97] transition shadow-lg shadow-emerald-600/30"
            >
              Lưu Thói Quen
            </button>
          </form>
        )}

        {/* ── View 4: Form Lên Lịch ──────── */}
        {subView === 'schedule' && (
          <form onSubmit={handleCreateSchedule} className="space-y-3">
            <input
              type="text"
              value={scheduleTitle}
              onChange={e => setScheduleTitle(e.target.value)}
              placeholder="Tên công việc trong khung giờ..."
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-[var(--border-default)] text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Bắt đầu
                </label>
                <input
                  type="time"
                  value={scheduleStart}
                  onChange={e => setScheduleStart(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-[var(--border-default)] text-sm text-white font-mono outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Kết thúc
                </label>
                <input
                  type="time"
                  value={scheduleEnd}
                  onChange={e => setScheduleEnd(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-[var(--border-default)] text-sm text-white font-mono outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-cyan-600 text-white font-bold text-sm active:scale-[0.97] transition shadow-lg shadow-cyan-600/30"
            >
              Lưu Khung Giờ
            </button>
          </form>
        )}
      </div>
    </>
  )
}
