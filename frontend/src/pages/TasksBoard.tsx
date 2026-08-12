import React, { useEffect, useState } from 'react'
import { Plus, Check, Trash2, Play, Layers, Grid, List } from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore'
import { useTimerStore } from '../store/useTimerStore'

export const TasksBoard: React.FC = () => {
  const { tasks, fetchTasks, fetchCategories, createTask, deleteTask, toggleTaskStatus } = useTaskStore()
  const { startTimer } = useTimerStore()

  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'eisenhower'>('kanban')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [newEisenhower, setNewEisenhower] = useState<'do_first' | 'schedule' | 'delegate' | 'eliminate'>('schedule')

  useEffect(() => {
    fetchTasks()
    fetchCategories()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    await createTask({
      title: newTitle,
      description: newDesc,
      priority: newPriority,
      eisenhower: newEisenhower
    })
    setNewTitle('')
    setNewDesc('')
    setIsCreateModalOpen(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Quản Lý Công Việc (Tasks)</h1>
          <p className="text-xs text-slate-400">Theo dõi, sắp xếp ưu tiên và hoàn thành mục tiêu.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="p-1 glass-card rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'kanban' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'list' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Danh Sách</span>
            </button>
            <button
              onClick={() => setViewMode('eisenhower')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'eisenhower' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Eisenhower</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-violet-600/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Task Mới</span>
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { key: 'todo', label: 'CẦN LÀM', color: 'border-cyan-500/30 text-cyan-400' },
            { key: 'in_progress', label: 'ĐANG LÀM', color: 'border-amber-500/30 text-amber-400' },
            { key: 'completed', label: 'HOÀN THÀNH', color: 'border-emerald-500/30 text-emerald-400' }
          ].map(col => (
            <div key={col.key} className="space-y-4">
              <div className={`p-3 glass-card rounded-2xl border-b-2 ${col.color} flex items-center justify-between`}>
                <span className="text-xs font-black uppercase tracking-wider">{col.label}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {tasks.filter(t => t.status === col.key).length}
                </span>
              </div>

              <div className="space-y-3 min-h-[400px]">
                {tasks.filter(t => t.status === col.key).map(t => (
                  <div key={t.id} className="p-4 glass-card glass-card-hover rounded-2xl space-y-3 group">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-white leading-snug">{t.title}</span>
                      <button onClick={() => deleteTask(t.id)} className="text-slate-500 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {t.description && <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-violet-300 uppercase">
                        {t.priority}
                      </span>
                      <button
                        onClick={() => startTimer({ taskId: t.id, title: t.title })}
                        className="p-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Eisenhower Matrix View */}
      {viewMode === 'eisenhower' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { key: 'do_first', label: '1. QUAN TRỌNG & KHẨN CẤP (Làm Ngay)', color: 'border-rose-500/40 text-rose-400' },
            { key: 'schedule', label: '2. QUAN TRỌNG nhưng KHÔNG KHẨN CẤP (Lên Lịch)', color: 'border-cyan-500/40 text-cyan-400' },
            { key: 'delegate', label: '3. KHÔNG QUAN TRỌNG nhưng KHẨN CẤP (Ủy Quyền)', color: 'border-amber-500/40 text-amber-400' },
            { key: 'eliminate', label: '4. KHÔNG QUAN TRỌNG & KHÔNG KHẨN CẤP (Loại Bỏ)', color: 'border-slate-600 text-slate-400' }
          ].map(quad => (
            <div key={quad.key} className="p-5 glass-card rounded-3xl space-y-4">
              <h3 className={`text-xs font-black uppercase tracking-wider ${quad.color}`}>{quad.label}</h3>
              <div className="space-y-2.5">
                {tasks.filter(t => t.eisenhower === quad.key).map(t => (
                  <div key={t.id} className="p-3.5 bg-slate-900/60 rounded-2xl flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-200 truncate">{t.title}</span>
                    <button
                      onClick={() => toggleTaskStatus(t.id)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                        t.status === 'completed' ? 'bg-emerald-500 text-slate-950' : 'border-slate-700 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="p-6 glass-card rounded-3xl w-full max-w-lg space-y-4 border border-violet-500/30">
            <h3 className="text-lg font-black text-white">Thêm Công Việc Mới</h3>
            
            <input
              type="text"
              placeholder="Tiêu đề công việc..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-violet-500"
              required
            />

            <textarea
              placeholder="Mô tả chi tiết..."
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-violet-500 h-24"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Mức độ ưu tiên</label>
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value as any)}
                  className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="low">Thấp (Low)</option>
                  <option value="medium">Vừa (Medium)</option>
                  <option value="high">Cao (High)</option>
                  <option value="urgent">Khẩn cấp (Urgent)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Eisenhower Quadrant</label>
                <select
                  value={newEisenhower}
                  onChange={e => setNewEisenhower(e.target.value as any)}
                  className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="do_first">Làm ngay (Do First)</option>
                  <option value="schedule">Lên lịch (Schedule)</option>
                  <option value="delegate">Ủy quyền (Delegate)</option>
                  <option value="eliminate">Loại bỏ (Eliminate)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-600/30"
              >
                Tạo Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
