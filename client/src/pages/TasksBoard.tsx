import React, { useEffect, useState } from 'react'
import { Check, Play, Trash2, Plus, Grid, List, X } from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore'
import { useTimerStore } from '../store/useTimerStore'
import { useNavigate } from 'react-router-dom'
import { sounds } from '../utils/soundEffects'

const quadrants = [
  { key: 'do_first', label: 'Q1 · Do First', desc: 'Khẩn & Quan trọng', accent: 'rose' },
  { key: 'schedule', label: 'Q2 · Schedule', desc: 'Quan trọng', accent: 'violet' },
  { key: 'delegate', label: 'Q3 · Delegate', desc: 'Khẩn cấp', accent: 'amber' },
  { key: 'eliminate', label: 'Q4 · Eliminate', desc: 'Loại bỏ', accent: 'slate' },
] as const

export const TasksBoard: React.FC = () => {
  const { tasks, fetchTasks, fetchCategories, createTask, deleteTask, toggleTaskStatus } = useTaskStore()
  const { startTimer } = useTimerStore()
  const navigate = useNavigate()

  const [view, setView] = useState<'list' | 'matrix'>('list')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [eisen, setEisen] = useState<'do_first' | 'schedule' | 'delegate' | 'eliminate'>('do_first')

  useEffect(() => { fetchTasks(); fetchCategories() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    sounds.playTap()
    await createTask({ title, eisenhower: eisen })
    sounds.playSuccess()
    setTitle('')
    setSheetOpen(false)
  }

  const accentMap: Record<string, string> = {
    rose: 'border-rose-500/30 text-rose-400',
    violet: 'border-violet-500/30 text-violet-400',
    amber: 'border-amber-500/30 text-amber-400',
    slate: 'border-slate-700 text-slate-500',
  }

  const TaskRow = ({ task }: { task: any }) => {
    const done = task.status === 'completed'
    return (
      <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl glass transition ${done ? 'opacity-40' : ''}`}>
        <button
          onClick={() => { sounds.playTap(); toggleTaskStatus(task.id); if (!done) sounds.playSuccess() }}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 active:scale-90 transition ${
            done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
          }`}
        >
          {done && <Check className="w-3 h-3 text-white stroke-[3]" />}
        </button>
        <span className={`flex-1 text-xs font-medium truncate ${done ? 'line-through text-slate-500' : 'text-white'}`}>{task.title}</span>
        {!done && (
          <button onClick={() => { sounds.playTap(); startTimer({ taskId: task.id, title: task.title }); navigate('/') }}
            className="p-1.5 rounded-lg bg-rose-600/10 text-rose-400 active:scale-90 transition shrink-0">
            <Play className="w-3 h-3 fill-current" />
          </button>
        )}
        <button onClick={() => { sounds.playTap(); deleteTask(task.id) }}
          className="p-1.5 text-slate-600 hover:text-rose-400 transition shrink-0">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white">Nhiệm Vụ</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setView(v => v === 'list' ? 'matrix' : 'list')}
            className="p-2 rounded-xl glass text-slate-400 active:scale-90 transition">
            {view === 'list' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </button>
          <button onClick={() => { sounds.playTap(); setSheetOpen(true) }}
            className="px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition">
            <Plus className="w-3.5 h-3.5" /> Thêm
          </button>
        </div>
      </div>

      {/* Content */}
      {view === 'list' ? (
        <div className="space-y-1.5">
          {tasks.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-slate-400">Chưa có nhiệm vụ.</div>
          ) : tasks.map(t => <TaskRow key={t.id} task={t} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {quadrants.map(q => {
            const items = tasks.filter(t => t.eisenhower === q.key)
            return (
              <div key={q.key} className={`glass rounded-2xl p-3 border ${accentMap[q.accent]} min-h-[120px]`}>
                <div className="text-[10px] font-black uppercase tracking-wider mb-2">{q.label}</div>
                <div className="space-y-1">
                  {items.length === 0 ? (
                    <div className="text-[10px] text-slate-600 italic">Trống</div>
                  ) : items.map(t => {
                    const done = t.status === 'completed'
                    return (
                      <button key={t.id}
                        onClick={() => { sounds.playTap(); toggleTaskStatus(t.id); if (!done) sounds.playSuccess() }}
                        className={`w-full text-left flex items-center gap-1.5 py-1 ${done ? 'opacity-40' : ''}`}>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                        }`}>
                          {done && <Check className="w-2 h-2 text-white stroke-[3]" />}
                        </div>
                        <span className={`text-[10px] truncate ${done ? 'line-through text-slate-500' : 'text-slate-200'}`}>{t.title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create sheet */}
      {sheetOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
          <div className="sheet-content">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-white">Thêm Nhiệm Vụ</h2>
              <button onClick={() => setSheetOpen(false)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Tên nhiệm vụ..."
                autoFocus className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-[var(--border-default)] text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500" />
              <div className="grid grid-cols-2 gap-1.5">
                {quadrants.map(q => (
                  <button key={q.key} type="button" onClick={() => setEisen(q.key)}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition ${
                      eisen === q.key ? `bg-${q.accent}-500/15 ${accentMap[q.accent]}` : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}>
                    {q.label}
                  </button>
                ))}
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold text-sm active:scale-[0.97] transition">
                Tạo Nhiệm Vụ
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
