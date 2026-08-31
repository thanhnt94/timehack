import React, { useEffect, useState } from 'react'
import { 
  Plus, 
  Check, 
  Trash2, 
  Play, 
  Grid, 
  List, 
  Sparkles, 
  Clock, 
  CheckSquare, 
  X
} from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore'
import { useTimerStore } from '../store/useTimerStore'
import { useNavigate } from 'react-router-dom'
import { sounds } from '../utils/soundEffects'

interface TasksBoardProps {
  onOpenCreate?: () => void
}

export const TasksBoard: React.FC<TasksBoardProps> = ({ onOpenCreate }) => {
  const { tasks, fetchTasks, fetchCategories, createTask, deleteTask, toggleTaskStatus } = useTaskStore()
  const { startTimer } = useTimerStore()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'eisenhower' | 'all'>('eisenhower')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [newEisenhower, setNewEisenhower] = useState<'do_first' | 'schedule' | 'delegate' | 'eliminate'>('do_first')

  useEffect(() => {
    fetchTasks()
    fetchCategories()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    sounds.playTap()
    await createTask({
      title: newTitle,
      description: newDesc,
      priority: newPriority,
      eisenhower: newEisenhower
    })
    sounds.playSuccess()
    setNewTitle('')
    setNewDesc('')
    setIsCreateModalOpen(false)
  }

  const handleStartTaskFocus = (taskTitle: string) => {
    sounds.playTap()
    startTimer(taskTitle, 'pomodoro')
    navigate('/focus')
  }

  const eisenhowerQuadrants = [
    {
      id: 'do_first',
      title: 'Q1: Do First',
      desc: '🚨 Khẩn cấp & Quan trọng',
      color: 'border-rose-500/30 bg-gradient-to-b from-rose-950/20 to-slate-900/60',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      tasks: tasks.filter(t => t.eisenhower === 'do_first' || t.priority === 'urgent')
    },
    {
      id: 'schedule',
      title: 'Q2: Schedule',
      desc: '📅 Quan trọng • Kế hoạch dài hạn',
      color: 'border-violet-500/30 bg-gradient-to-b from-violet-950/20 to-slate-900/60',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      tasks: tasks.filter(t => (t.eisenhower === 'schedule' || (!t.eisenhower && t.priority !== 'urgent')))
    },
    {
      id: 'delegate',
      title: 'Q3: Delegate',
      desc: '👥 Khẩn cấp • Ủy quyền',
      color: 'border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-slate-900/60',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      tasks: tasks.filter(t => t.eisenhower === 'delegate')
    },
    {
      id: 'eliminate',
      title: 'Q4: Eliminate',
      desc: '🗑️ Không quan trọng • Loại bỏ',
      color: 'border-slate-700 bg-gradient-to-b from-slate-900/60 to-slate-900/40',
      badgeColor: 'bg-slate-800 text-slate-400 border-slate-700',
      tasks: tasks.filter(t => t.eisenhower === 'eliminate')
    }
  ]

  return (
    <div className="space-y-4 select-none pb-8 animate-in fade-in duration-200">
      {/* 1. HEADER & ACTIONS */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1">
            <CheckSquare className="w-3 h-3" />
            <span>Ma Trận & Nhiệm Vụ</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Nhiệm Vụ Công Việc</h1>
        </div>

        <button
          onClick={() => { sounds.playTap(); onOpenCreate ? onOpenCreate() : setIsCreateModalOpen(true); }}
          className="px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-violet-600/30 transition-all flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm Task</span>
        </button>
      </div>

      {/* 2. VIEW SWITCHER PILLS */}
      <div className="p-1 rounded-2xl bg-[#0C1222] flex items-center gap-1 border border-white/[0.06]">
        <button
          onClick={() => { sounds.playTap(); setActiveTab('eisenhower'); }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'eisenhower' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Ma Trận Eisenhower (4 Góc)</span>
        </button>
        <button
          onClick={() => { sounds.playTap(); setActiveTab('all'); }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'all' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Tất Cả ({tasks.length})</span>
        </button>
      </div>

      {/* 3. EISENHOWER 4-QUADRANT VIEW */}
      {activeTab === 'eisenhower' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {eisenhowerQuadrants.map(quad => (
            <div
              key={quad.id}
              className={`glass-card rounded-[28px] p-4 border ${quad.color} shadow-lg space-y-2.5`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                <div>
                  <div className="text-xs font-black text-white">{quad.title}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{quad.desc}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${quad.badgeColor}`}>
                  {quad.tasks.length}
                </span>
              </div>

              {/* Task Items */}
              <div className="space-y-1.5">
                {quad.tasks.length === 0 ? (
                  <div className="py-4 text-center text-[11px] text-slate-500 font-medium italic">
                    Trống
                  </div>
                ) : (
                  quad.tasks.map(task => {
                    const isDone = task.status === 'completed'
                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-2xl bg-slate-900/80 border transition-all flex items-center justify-between gap-2.5 ${
                          isDone ? 'opacity-50 border-slate-800' : 'border-white/[0.08] hover:border-violet-500/30'
                        }`}
                      >
                        <button
                          onClick={() => {
                            sounds.playTap()
                            toggleTaskStatus(task.id)
                            sounds.playSuccess()
                          }}
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                            isDone 
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black' 
                              : 'border-slate-600 bg-slate-950 hover:border-violet-400'
                          }`}
                        >
                          {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-bold truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {task.title}
                          </div>
                        </div>

                        {!isDone && (
                          <button
                            onClick={() => handleStartTaskFocus(task.title)}
                            title="Tập trung"
                            className="p-1.5 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-600 hover:text-white transition shrink-0 active:scale-90"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Flat List View */
        <div className="space-y-2">
          {tasks.map(task => {
            const isDone = task.status === 'completed'
            return (
              <div
                key={task.id}
                className="glass-card rounded-2xl p-3.5 border border-white/[0.08] flex items-center justify-between gap-3 shadow-md"
              >
                <button
                  onClick={() => {
                    sounds.playTap()
                    toggleTaskStatus(task.id)
                    sounds.playSuccess()
                  }}
                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition shrink-0 ${
                    isDone ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600 bg-slate-900'
                  }`}
                >
                  {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs sm:text-sm font-bold truncate ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                    {task.title}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {task.eisenhower?.toUpperCase() || 'NORMAL'} • {Math.round(task.spent_seconds / 60)} phút tập trung
                  </div>
                </div>
                <button
                  onClick={() => {
                    sounds.playTap()
                    deleteTask(task.id)
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* 4. CREATE TASK MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-violet-600/20 text-violet-400">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-white">Thêm Nhiệm Vụ Mới</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Tên Nhiệm Vụ</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Hoàn thiện báo cáo, Luyện nghe tiếng Nhật..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Phân Loại Ma Trận Eisenhower</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewEisenhower('do_first')}
                    className={`p-2 rounded-xl border text-left text-[11px] font-bold transition ${
                      newEisenhower === 'do_first' 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    🚨 Q1: Do First
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEisenhower('schedule')}
                    className={`p-2 rounded-xl border text-left text-[11px] font-bold transition ${
                      newEisenhower === 'schedule' 
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' 
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    📅 Q2: Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEisenhower('delegate')}
                    className={`p-2 rounded-xl border text-left text-[11px] font-bold transition ${
                      newEisenhower === 'delegate' 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    👥 Q3: Delegate
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEisenhower('eliminate')}
                    className={`p-2 rounded-xl border text-left text-[11px] font-bold transition ${
                      newEisenhower === 'eliminate' 
                        ? 'bg-slate-800 text-slate-300 border-slate-700' 
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    🗑️ Q4: Eliminate
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-violet-600/30 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lưu Nhiệm Vụ</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
