import React, { useEffect, useState, useMemo } from 'react'
import {
  Check, Play, Trash2, Plus, X, CheckSquare, Calendar,
  Flame, Star, Users, Inbox, Layers, Edit3, ChevronDown,
  ChevronRight, ListTodo, CornerDownRight, Sparkles, Clock,
  Search, ChevronLeft, ArrowUpDown
} from 'lucide-react'
import { useTaskStore, type Task, type Subtask } from '../store/useTaskStore'
import { useTimerStore } from '../store/useTimerStore'
import { useNavigate } from 'react-router-dom'
import { sounds } from '../utils/soundEffects'

// Priority categories with distinct visual identity
const PRIORITY_TABS = [
  {
    key: 'all',
    label: 'All Tasks',
    icon: Layers,
    activeClass: 'bg-violet-600 border-violet-600 text-white',
    inactiveClass: 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
  },
  {
    key: 'do_first',
    label: 'Urgent',
    icon: Flame,
    activeClass: 'bg-rose-600 border-rose-600 text-white',
    inactiveClass: 'bg-rose-50/80 border-rose-200 text-rose-700 hover:bg-rose-100'
  },
  {
    key: 'schedule',
    label: 'Important',
    icon: Star,
    activeClass: 'bg-violet-600 border-violet-600 text-white',
    inactiveClass: 'bg-violet-50/80 border-violet-200 text-violet-700 hover:bg-violet-100'
  },
  {
    key: 'delegate',
    label: 'Delegate',
    icon: Users,
    activeClass: 'bg-amber-600 border-amber-600 text-white',
    inactiveClass: 'bg-amber-50/80 border-amber-200 text-amber-800 hover:bg-amber-100'
  },
  {
    key: 'eliminate',
    label: 'Backlog',
    icon: Inbox,
    activeClass: 'bg-slate-700 border-slate-700 text-white',
    inactiveClass: 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
  },
] as const

const PRIORITY_CHOICES = [
  {
    key: 'do_first',
    label: 'Urgent & Important',
    desc: 'Do immediately',
    icon: Flame,
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    selectedBg: 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-500'
  },
  {
    key: 'schedule',
    label: 'Important, Not Urgent',
    desc: 'Plan & schedule',
    icon: Star,
    badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
    selectedBg: 'bg-violet-50 border-violet-400 text-violet-800 ring-2 ring-violet-500'
  },
  {
    key: 'delegate',
    label: 'Urgent, Less Important',
    desc: 'Delegate or do fast',
    icon: Users,
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    selectedBg: 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-500'
  },
  {
    key: 'eliminate',
    label: 'Not Urgent or Important',
    desc: 'Backlog / Eliminate',
    icon: Inbox,
    badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
    selectedBg: 'bg-slate-100 border-slate-400 text-slate-800 ring-2 ring-slate-400'
  },
] as const

const PAGE_SIZE = 5

export const TasksBoard: React.FC = () => {
  const {
    tasks,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    createSubtask,
    toggleSubtask,
    updateSubtask,
    deleteSubtask
  } = useTaskStore()

  const { startTimer } = useTimerStore()
  const navigate = useNavigate()

  // Filter & Search & Pagination State
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Modals state
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [editTaskData, setEditTaskData] = useState<Task | null>(null)

  // Track expanded subtask panels
  const [collapsedTasks, setCollapsedTasks] = useState<Record<number, boolean>>({})
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<number, string>>({})
  const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null)
  const [editingSubtaskText, setEditingSubtaskText] = useState('')

  // Create form state
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newEisen, setNewEisen] = useState<'do_first' | 'schedule' | 'delegate' | 'eliminate'>('do_first')

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editEisen, setEditEisen] = useState<'do_first' | 'schedule' | 'delegate' | 'eliminate'>('do_first')

  useEffect(() => {
    fetchTasks()
  }, [])

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchQuery])

  // Filtered tasks by priority and search query
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // 1. Priority filter
      if (filter !== 'all' && t.eisenhower !== filter) return false
      
      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = t.title.toLowerCase().includes(q)
        const matchDesc = t.description?.toLowerCase().includes(q)
        const matchSubtask = t.subtasks?.some(st => st.title.toLowerCase().includes(q))
        if (!matchTitle && !matchDesc && !matchSubtask) return false
      }

      return true
    })
  }, [tasks, filter, searchQuery])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE))
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredTasks.slice(start, start + PAGE_SIZE)
  }, [filteredTasks, currentPage])

  const doneCount = tasks.filter(t => t.status === 'completed').length

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    sounds.playTap()
    await createTask({
      title: newTitle.trim(),
      eisenhower: newEisen,
      due_date: newDueDate ? `${newDueDate}T23:59:59` : undefined
    })
    sounds.playSuccess()
    setNewTitle('')
    setNewDueDate('')
    setCreateSheetOpen(false)
  }

  const handleOpenEdit = (task: Task) => {
    sounds.playTap()
    setEditTaskData(task)
    setEditTitle(task.title)
    setEditEisen(task.eisenhower)
    setEditDueDate(task.due_date ? task.due_date.split('T')[0] : '')
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTaskData || !editTitle.trim()) return
    sounds.playTap()
    await updateTask(editTaskData.id, {
      title: editTitle.trim(),
      eisenhower: editEisen,
      due_date: editDueDate ? `${editDueDate}T23:59:59` : ''
    })
    sounds.playSuccess()
    setEditTaskData(null)
  }

  const handlePlayTask = (task: any) => {
    sounds.playTap()
    startTimer({ taskId: task.id, title: task.title })
    navigate('/')
  }

  const toggleCollapse = (taskId: number) => {
    sounds.playTap()
    setCollapsedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }))
  }

  const handleAddSubtask = async (taskId: number, e: React.FormEvent) => {
    e.preventDefault()
    const text = (newSubtaskInputs[taskId] || '').trim()
    if (!text) return
    sounds.playTap()
    await createSubtask(taskId, text)
    sounds.playSuccess()
    setNewSubtaskInputs(prev => ({ ...prev, [taskId]: '' }))
  }

  const handleStartEditSubtask = (st: Subtask) => {
    setEditingSubtaskId(st.id)
    setEditingSubtaskText(st.title)
  }

  const handleSaveSubtaskTitle = async (subtaskId: number) => {
    if (!editingSubtaskText.trim()) return
    sounds.playTap()
    await updateSubtask(subtaskId, { title: editingSubtaskText.trim() })
    setEditingSubtaskId(null)
  }

  const getPriorityMeta = (key?: string) => {
    return PRIORITY_CHOICES.find(p => p.key === key) || PRIORITY_CHOICES[1]
  }

  return (
    <div className="flex flex-col min-h-full pb-20">
      {/* ── Top Header ─────────────────── */}
      <div className="space-y-4">
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

        {/* ── Rich Colored Priority Tabs with Icons ── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {PRIORITY_TABS.map(tab => {
            const Icon = tab.icon
            const isSelected = filter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => { sounds.playTap(); setFilter(tab.key) }}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition active:scale-95 border shadow-xs ${
                  isSelected ? tab.activeClass : tab.inactiveClass
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Active Search Indicator Pill (if search is filtered) ── */}
      {searchQuery && (
        <div className="my-3 flex items-center justify-between px-3.5 py-2 rounded-xl bg-violet-50 border border-violet-200 text-xs font-bold text-violet-800">
          <div className="flex items-center gap-1.5 min-w-0">
            <Search className="w-3.5 h-3.5 text-violet-600 shrink-0" />
            <span className="truncate">Searching: "{searchQuery}" ({filteredTasks.length} results)</span>
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="p-1 hover:text-violet-950 transition shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Task List or Empty State ────── */}
      <div className="flex-1 my-3 space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center shadow-xs mb-3">
              <CheckSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              {searchQuery ? 'No matching tasks found' : filter === 'all' ? 'No tasks found' : 'No tasks in this category'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[260px] leading-relaxed">
              {searchQuery ? 'Try searching with different keywords.' : 'Add deliverables with subtasks, deadlines, and priority.'}
            </p>

            <button
              onClick={() => { sounds.playTap(); setCreateSheetOpen(true) }}
              className="mt-6 px-6 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-lg shadow-violet-600/25 active:scale-95 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create First Task</span>
            </button>
          </div>
        ) : (
          paginatedTasks.map(task => {
            const done = task.status === 'completed'
            const pMeta = getPriorityMeta(task.eisenhower)
            const PIcon = pMeta.icon
            const subtasks = task.subtasks || []
            const doneSubtasks = subtasks.filter(s => s.is_completed).length
            const isCollapsed = !!collapsedTasks[task.id]
            const progressPercent = subtasks.length > 0 ? Math.round((doneSubtasks / subtasks.length) * 100) : 0

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border transition shadow-xs overflow-hidden ${
                  done
                    ? 'opacity-60 bg-slate-50/80 border-slate-200'
                    : 'border-slate-200/90 hover:border-violet-300'
                }`}
              >
                {/* ── Main Task Card Row ── */}
                <div className="p-3.5 flex items-start gap-3">
                  {/* Custom 24px Checkbox Circle */}
                  <button
                    onClick={() => { sounds.playTap(); toggleTaskStatus(task.id); if (!done) sounds.playSuccess() }}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 active:scale-90 transition shadow-2xs ${
                      done
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 hover:border-violet-500 bg-white'
                    }`}
                    aria-label="Mark task completed"
                  >
                    {done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div
                        onClick={() => handleOpenEdit(task)}
                        className="cursor-pointer group flex-1 min-w-0"
                      >
                        <h4 className={`text-sm font-bold truncate group-hover:text-violet-700 transition ${
                          done ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}>
                          {task.title}
                        </h4>
                      </div>

                      {/* Right Action Icons Group */}
                      <div className="flex items-center gap-1 shrink-0 -mt-0.5">
                        {/* Play Focus */}
                        {!done && (
                          <button
                            onClick={() => handlePlayTask(task)}
                            className="w-7 h-7 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-600 hover:text-white active:scale-90 transition flex items-center justify-center shadow-2xs"
                            title="Start Focus"
                          >
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          </button>
                        )}

                        {/* Edit task */}
                        <button
                          onClick={() => handleOpenEdit(task)}
                          className="w-7 h-7 rounded-xl text-slate-400 hover:text-violet-700 hover:bg-violet-50 active:scale-90 transition flex items-center justify-center"
                          title="Edit Task"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete task */}
                        <button
                          onClick={() => { sounds.playTap(); deleteTask(task.id) }}
                          className="w-7 h-7 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 active:scale-90 transition flex items-center justify-center"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Badges Row */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {/* Priority Tag */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${pMeta.badgeBg}`}>
                        <PIcon className="w-3 h-3" />
                        <span>{pMeta.label.split(' ')[0]}</span>
                      </span>

                      {/* Subtask Progress Counter Pill (e.g. 2/3 subtasks) */}
                      {subtasks.length > 0 && (
                        <button
                          onClick={() => toggleCollapse(task.id)}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                            doneSubtasks === subtasks.length
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-mono'
                              : 'bg-violet-50 border-violet-200 text-violet-700 font-mono'
                          }`}
                        >
                          <ListTodo className="w-3 h-3" />
                          <span>{doneSubtasks}/{subtasks.length} Subtasks ({progressPercent}%)</span>
                          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}

                      {/* Due Date */}
                      {task.due_date && (
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Subtasks Checklist Section (Task Con) ── */}
                {!isCollapsed && (
                  <div className="bg-slate-50/70 border-t border-slate-100 px-4 py-3 space-y-2.5">
                    {/* Progress Bar */}
                    {subtasks.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <span>Subtasks Checklist ({doneSubtasks}/{subtasks.length})</span>
                          <span className="font-mono text-violet-700">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              doneSubtasks === subtasks.length ? 'bg-emerald-500' : 'bg-violet-600'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Subtask Items List */}
                    {subtasks.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {subtasks.map(st => {
                          const isEditing = editingSubtaskId === st.id
                          return (
                            <div
                              key={st.id}
                              className="group flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 hover:border-violet-200 transition"
                            >
                              {/* Custom Subtask Checkbox */}
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playTap()
                                  toggleSubtask(st.id, !st.is_completed)
                                  if (!st.is_completed) sounds.playSuccess()
                                }}
                                className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition active:scale-90 ${
                                  st.is_completed
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-slate-300 hover:border-violet-500 bg-white'
                                }`}
                              >
                                {st.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>

                              {/* Title / Inline Edit Input */}
                              <div className="flex-1 min-w-0">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingSubtaskText}
                                    onChange={(e) => setEditingSubtaskText(e.target.value)}
                                    onBlur={() => handleSaveSubtaskTitle(st.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveSubtaskTitle(st.id)
                                      if (e.key === 'Escape') setEditingSubtaskId(null)
                                    }}
                                    autoFocus
                                    className="w-full px-2 py-0.5 text-xs font-semibold text-slate-900 border border-violet-400 rounded-md outline-none bg-violet-50/40"
                                  />
                                ) : (
                                  <span
                                    onClick={() => handleStartEditSubtask(st)}
                                    className={`text-xs font-semibold cursor-text block truncate ${
                                      st.is_completed ? 'line-through text-slate-400' : 'text-slate-800'
                                    }`}
                                    title="Click to edit subtask"
                                  >
                                    {st.title}
                                  </span>
                                )}
                              </div>

                              {/* Delete Subtask */}
                              <button
                                type="button"
                                onClick={() => { sounds.playTap(); deleteSubtask(st.id) }}
                                className="p-1 text-slate-300 hover:text-rose-600 rounded transition shrink-0 active:scale-90"
                                title="Delete subtask"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Inline Add Subtask Input Form */}
                    <form
                      onSubmit={(e) => handleAddSubtask(task.id, e)}
                      className="flex items-center gap-2 pt-1"
                    >
                      <div className="relative flex-1">
                        <CornerDownRight className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={newSubtaskInputs[task.id] || ''}
                          onChange={(e) => setNewSubtaskInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                          placeholder="Add subtask / step..."
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-violet-500 focus:bg-white transition shadow-2xs"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!(newSubtaskInputs[task.id] || '').trim()}
                        className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold disabled:opacity-40 transition shadow-2xs active:scale-95 shrink-0"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ═══════════ FIXED ACTION & PAGINATION TOOLBAR (ABOVE BOTTOM NAV) ═══════════ */}
      <div className="fixed bottom-[calc(56px+var(--safe-bottom))] left-0 right-0 md:left-60 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-4 py-2 z-20 shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
        <div className="max-w-lg md:max-w-5xl mx-auto flex items-center justify-between gap-2 min-h-[38px]">
          {isSearchOpen ? (
            <div className="flex items-center gap-2 flex-1 animate-fade-in">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-violet-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search tasks or subtasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100/90 border border-violet-300 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-violet-600 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setIsSearchOpen(false)
                }}
                className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition shrink-0 active:scale-95"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Left: Pagination Stepper */}
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => { sounds.playTap(); setCurrentPage(p => Math.max(1, p - 1)) }}
                  className="h-8.5 w-8.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition active:scale-95 disabled:opacity-40 shadow-2xs"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-black font-mono">
                  {currentPage}/{totalPages}
                </span>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => { sounds.playTap(); setCurrentPage(p => Math.min(totalPages, p + 1)) }}
                  className="h-8.5 w-8.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition active:scale-95 disabled:opacity-40 shadow-2xs"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <span className="hidden sm:inline text-[11px] font-bold text-slate-400 ml-1">
                  ({filteredTasks.length} tasks)
                </span>
              </div>

              {/* Right: Quick Action Buttons (Search & Add Task) */}
              <div className="flex items-center gap-2">
                {/* Search Toggle Button */}
                <button
                  onClick={() => { sounds.playTap(); setIsSearchOpen(true) }}
                  className={`h-8.5 w-8.5 rounded-xl border flex items-center justify-center transition active:scale-95 shadow-2xs ${
                    searchQuery
                      ? 'bg-violet-50 border-violet-300 text-violet-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Search Tasks"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Add Task Button */}
                <button
                  onClick={() => { sounds.playTap(); setCreateSheetOpen(true) }}
                  className="h-8.5 px-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-violet-600/20 active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>New Task</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal 1: Create Task Bottom Sheet ── */}
      {createSheetOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setCreateSheetOpen(false)} />
          <div className="sheet-content max-w-lg mx-auto">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900">Create New Task</h2>
                <p className="text-[11px] text-slate-500 font-medium">Set deadline and priority category</p>
              </div>
              <button onClick={() => setCreateSheetOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700">
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
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Finish financial report, Send client invoice..."
                  autoFocus
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Priority Level
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRIORITY_CHOICES.map(q => {
                    const QIcon = q.icon
                    const isSelected = newEisen === q.key
                    return (
                      <button
                        key={q.key}
                        type="button"
                        onClick={() => setNewEisen(q.key as any)}
                        className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition flex items-start gap-2 ${
                          isSelected
                            ? q.selectedBg
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <QIcon className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <div>{q.label}</div>
                          <div className="text-[9px] font-normal text-slate-400">{q.desc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
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

      {/* ── Modal 2: Edit Task Bottom Sheet ── */}
      {editTaskData && (
        <>
          <div className="sheet-backdrop" onClick={() => setEditTaskData(null)} />
          <div className="sheet-content max-w-lg mx-auto">
            <div className="sheet-handle" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900">Edit Task</h2>
                <p className="text-[11px] text-slate-500 font-medium">Modify properties and subtasks checklist</p>
              </div>
              <button onClick={() => setEditTaskData(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Priority Level
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRIORITY_CHOICES.map(q => {
                    const QIcon = q.icon
                    const isSelected = editEisen === q.key
                    return (
                      <button
                        key={q.key}
                        type="button"
                        onClick={() => setEditEisen(q.key as any)}
                        className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition flex items-start gap-2 ${
                          isSelected
                            ? q.selectedBg
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <QIcon className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <div>{q.label}</div>
                          <div className="text-[9px] font-normal text-slate-400">{q.desc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Deadline
                </label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={e => setEditDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              {/* Subtasks in Edit Modal */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Subtasks ({editTaskData.subtasks?.length || 0})
                  </label>
                </div>
                {editTaskData.subtasks && editTaskData.subtasks.length > 0 && (
                  <div className="space-y-1.5 mb-2 max-h-36 overflow-y-auto">
                    {editTaskData.subtasks.map(st => (
                      <div key={st.id} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className={`truncate font-semibold ${st.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {st.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => { sounds.playTap(); deleteSubtask(st.id) }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { sounds.playTap(); deleteTask(editTaskData.id); setEditTaskData(null) }}
                  className="py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 active:scale-[0.98] transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Task</span>
                </button>

                <button
                  type="submit"
                  className="py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs active:scale-[0.98] transition shadow-md shadow-violet-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
