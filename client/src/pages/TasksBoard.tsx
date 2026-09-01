import React, { useEffect, useState, useMemo } from 'react'
import { Check, Play, Trash2, Plus, Grid, List, X, CheckSquare, Calendar, Sparkles } from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore'
import { useTimerStore } from '../store/useTimerStore'
import { useNavigate } from 'react-router-dom'
import { sounds } from '../utils/soundEffects'

const EISENHOWER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'do_first', label: 'Q1 Urgent', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  { key: 'schedule', label: 'Q2 Schedule', color: 'text-violet-700 bg-violet-50 border-violet-200' },
  { key: 'delegate', label: 'Q3 Delegate', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { key: 'eliminate', label: 'Q4 Eliminate', color: 'text-slate-600 bg-slate-100 border-slate-200' },
] as const

const EISENHOWER_QUADRANTS = [
  { key: 'do_first', label: 'Q1 · Urgent & Important', color: 'border-rose-300 text-rose-700 bg-rose-50/70' },
  { key: 'schedule', label: 'Q2 · Important, Not Urgent', color: 'border-violet-300 text-violet-700 bg-violet-50/70' },
  { key: 'delegate', label: 'Q3 · Urgent, Less Important', color: 'border-amber-300 text-amber-800 bg-amber-50/70' },
  { key: 'eliminate', label: 'Q4 · Not Urgent or Important', color: 'border-slate-200 text-slate-600 bg-slate-50' },
] as const

export const TasksBoard: React.FC = () => {
  const { tasks, fetchTasks, fetchCategories, createTask, deleteTask, toggleTaskStatus } = useTaskStore()
  const { startTimer } = useTimerStore()
  const navigate = useNavigate()

  const [filter, setFilter] = useState<string>('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [eisen, setEisen] = useState<'do_first' | 'schedule' | 'delegate' | 'eliminate'>('do_first')

  useEffect(() => { fetchTasks(); fetchCategories() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    sounds.playTap()
    await createTask({
      title,
      eisenhower: eisen,
      due_date: dueDate ? `${dueDate}T23:59:59` : undefined
    })
    sounds.playSuccess()
    setTitle('')
    setDueDate('')
    setSheetOpen(false)
  }

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks
    return tasks.filter(t => t.eisenhower === filter)
  }, [tasks, filter])

  const doneCount = tasks.filter(t => t.status === 'completed').length

  const handlePlayTask = (task: any) => {
    sounds.playTap()
    startTimer({ taskId: task.id, title: task.title })
    navigate('/')
  }

  return (
    <div className="space-y-4 pb-4">
      {/* ── Ergonomic Large Header ─────── */}
      <div className="pt-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Deliverables & Action Items</span>
            <h1 className="text-2xl font-black text-slate-900 mt-0.5">Tasks</h1>
          </div>
          {tasks.length > 0 && (
            <span className="text-xs font-black font-mono text-violet-700 bg-violet-50 px-2.5 py-1 rounded-xl border border-violet-200">
              {doneCount}/{tasks.length} done
            </span>
          )}
        </div>
      </div>

      {/* ── Horizontal Eisenhower Filter Pills ── */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {EISENHOWER_TABS.map(tab => {
          const isSelected = filter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => { sounds.playTap(); setFilter(tab.key) }}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 border ${
                isSelected
                  ? 'bg-violet-600 border-violet-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Task List or Centered Empty State ── */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center shadow-xs mb-3">
            <CheckSquare className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-900">
            {filter === 'all' ? 'No tasks found' : 'No tasks in this quadrant'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[260px] leading-relaxed">
            Add deliverables with deadlines and priorities to manage your productivity effectively.
          </p>

          <button
            onClick={() => { sounds.playTap(); setSheetOpen(true) }}
            className="mt-6 px-6 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-lg shadow-violet-600/25 active:scale-95 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create First Task</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map(task => {
            const done = task.status === 'completed'
            return (
              <div
                key={task.id}
                className={`glass rounded-2xl p-3.5 border transition ${
                  done
                    ? 'opacity-50 bg-slate-50 border-slate-200'
                    : 'border-slate-200 hover:border-violet-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Large Checkbox */}
                  <button
                    onClick={() => { sounds.playTap(); toggleTaskStatus(task.id); if (!done) sounds.playSuccess() }}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 active:scale-90 transition ${
                      done
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 hover:border-violet-500 bg-white'
                    }`}
                    aria-label="Mark task completed"
                  >
                    {done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold truncate ${done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {task.eisenhower && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          task.eisenhower === 'do_first' ? 'text-rose-600' :
                          task.eisenhower === 'schedule' ? 'text-violet-600' :
                          task.eisenhower === 'delegate' ? 'text-amber-600' : 'text-slate-400'
                        }`}>
                          {task.eisenhower === 'do_first' ? 'Q1 Urgent' :
                           task.eisenhower === 'schedule' ? 'Q2 Plan' :
                           task.eisenhower === 'delegate' ? 'Q3 Delegate' : 'Q4 Eliminate'}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Due: {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Focus Action */}
                  {!done && (
                    <button
                      onClick={() => handlePlayTask(task)}
                      className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-600 hover:text-white active:scale-90 transition shrink-0 flex items-center justify-center shadow-xs"
                      title="Start Focus"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => { sounds.playTap(); deleteTask(task.id) }}
                    className="p-1.5 text-slate-300 hover:text-rose-600 transition shrink-0 active:scale-90"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}

          {/* Bottom Thumb CTA */}
          <div className="pt-2">
            <button
              onClick={() => { sounds.playTap(); setSheetOpen(true) }}
              className="w-full py-3 rounded-2xl bg-white border border-dashed border-slate-300 hover:border-violet-400 text-slate-600 hover:text-violet-700 text-xs font-bold transition active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Task</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Create Task Bottom Sheet ───────── */}
      {sheetOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
          <div className="sheet-content max-w-lg mx-auto">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900">Create New Task</h2>
                <p className="text-[11px] text-slate-500 font-medium">Set deadline and Eisenhower priority</p>
              </div>
              <button onClick={() => setSheetOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Finish financial report, Send client invoice..."
                  autoFocus
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Priority Level (Eisenhower Matrix)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {EISENHOWER_QUADRANTS.map(q => (
                    <button
                      key={q.key}
                      type="button"
                      onClick={() => setEisen(q.key)}
                      className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition ${
                        eisen === q.key
                          ? `${q.color} ring-2 ring-violet-500`
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs active:scale-[0.98] transition shadow-md shadow-violet-600/20 mt-2"
              >
                Save Task
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
