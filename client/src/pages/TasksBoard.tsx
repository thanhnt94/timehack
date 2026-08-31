import React, { useEffect, useState } from 'react'
import { Check, Play, Trash2, Plus, Grid, List, X } from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore'
import { useTimerStore } from '../store/useTimerStore'
import { useNavigate } from 'react-router-dom'
import { sounds } from '../utils/soundEffects'

const quadrants = [
  { key: 'do_first', label: 'Q1 · Do First', desc: 'Khẩn & Quan trọng', bg: 'bg-rose-50/70 border-rose-200 text-rose-700' },
  { key: 'schedule', label: 'Q2 · Schedule', desc: 'Quan trọng', bg: 'bg-violet-50/70 border-violet-200 text-violet-700' },
  { key: 'delegate', label: 'Q3 · Delegate', desc: 'Khẩn cấp', bg: 'bg-amber-50/70 border-amber-200 text-amber-800' },
  { key: 'eliminate', label: 'Q4 · Eliminate', desc: 'Loại bỏ', bg: 'bg-slate-50 border-slate-200 text-slate-600' },
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

  const TaskRow = ({ task }: { task: any }) => {
    const done = task.status === 'completed'
    return (
      <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-2xl glass border border-slate-200 transition ${
        done ? 'opacity-45 bg-slate-50' : 'hover:border-violet-300'
      }`}>
        <button
          onClick={() => { sounds.playTap(); toggleTaskStatus(task.id); if (!done) sounds.playSuccess() }}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 active:scale-90 transition ${
            done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-violet-500 bg-white'
          }`}
        >
          {done && <Check className="w-3 h-3 stroke-[3]" />}
        </button>
        <span className={`flex-1 text-xs font-semibold truncate ${done ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.title}</span>
        {!done && (
          <button
            onClick={() => { sounds.playTap(); startTimer({ taskId: task.id, title: task.title }); navigate('/') }}
            className="p-1.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-600 hover:text-white active:scale-90 transition shrink-0"
            title="Focus"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        )}
        <button
          onClick={() => { sounds.playTap(); deleteTask(task.id) }}
          className="p-1.5 text-slate-400 hover:text-rose-600 transition shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">Nhiệm Vụ</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(v => v === 'list' ? 'matrix' : 'list')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 active:scale-90 transition shadow-sm"
          >
            {view === 'list' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { sounds.playTap(); setSheetOpen(true) }}
            className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition shadow-sm shadow-violet-600/20"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Thêm
          </button>
        </div>
      </div>

      {/* Content */}
      {view === 'list' ? (
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-sm font-semibold text-slate-500 border border-slate-200">
              Chưa có nhiệm vụ nào.
            </div>
          ) : tasks.map(t => <TaskRow key={t.id} task={t} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {quadrants.map(q => {
            const items = tasks.filter(t => t.eisenhower === q.key)
            return (
              <div key={q.key} className={`rounded-2xl p-3.5 border ${q.bg} min-h-[140px]`}>
                <div className="text-[11px] font-black uppercase tracking-wider mb-2">{q.label}</div>
                <div className="space-y-1.5">
                  {items.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic">Trống</div>
                  ) : items.map(t => {
                    const done = t.status === 'completed'
                    return (
                      <button
                        key={t.id}
                        onClick={() => { sounds.playTap(); toggleTaskStatus(t.id); if (!done) sounds.playSuccess() }}
                        className={`w-full text-left flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-white/60 transition ${done ? 'opacity-40' : ''}`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-400 bg-white'
                        }`}>
                          {done && <Check className="w-2 h-2 text-white stroke-[3]" />}
                        </div>
                        <span className={`text-xs font-semibold truncate ${done ? 'line-through text-slate-400' : 'text-slate-900'}`}>{t.title}</span>
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
              <h2 className="text-sm font-black text-slate-900">Thêm Nhiệm Vụ Mới</h2>
              <button onClick={() => setSheetOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Tên nhiệm vụ cần làm..."
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:bg-white transition"
              />
              <div className="grid grid-cols-2 gap-2">
                {quadrants.map(q => (
                  <button
                    key={q.key}
                    type="button"
                    onClick={() => setEisen(q.key)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                      eisen === q.key
                        ? `${q.bg} ring-2 ring-violet-500`
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm active:scale-[0.98] transition shadow-md shadow-violet-600/20"
              >
                Tạo Nhiệm Vụ
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
