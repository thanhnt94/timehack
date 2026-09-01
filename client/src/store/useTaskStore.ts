import { create } from 'zustand'
import axios from 'axios'

export interface Subtask {
  id: number
  title: string
  is_completed: boolean
}

export interface Task {
  id: number
  title: string
  description?: string
  category_id?: number
  category?: { id: number; name: string; color: string; icon?: string }
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'completed'
  eisenhower: 'do_first' | 'schedule' | 'delegate' | 'eliminate'
  estimated_minutes: number
  spent_seconds: number
  due_date?: string
  completed_at?: string
  order_index: number
  subtasks: Subtask[]
  created_at: string
}

export interface Category {
  id: number
  name: string
  color: string
  icon?: string
}

interface TaskState {
  tasks: Task[]
  categories: Category[]
  isLoading: boolean
  activeCategoryFilter: number | null
  activePriorityFilter: string | null
  activeTab: 'all' | 'today' | 'eisenhower' | 'kanban'
  
  fetchTasks: () => Promise<void>
  fetchCategories: () => Promise<void>
  createTask: (data: Partial<Task>) => Promise<Task | undefined>
  updateTask: (id: number, data: Partial<Task>) => Promise<void>
  deleteTask: (id: number) => Promise<void>
  createSubtask: (taskId: number, title: string) => Promise<void>
  toggleSubtask: (subtaskId: number, is_completed: boolean) => Promise<void>
  updateSubtask: (subtaskId: number, data: { title?: string; is_completed?: boolean }) => Promise<void>
  deleteSubtask: (subtaskId: number) => Promise<void>
  createCategory: (name: string, color: string, icon?: string) => Promise<void>
  setCategoryFilter: (catId: number | null) => void
  setPriorityFilter: (p: string | null) => void
  setActiveTab: (tab: 'all' | 'today' | 'eisenhower' | 'kanban') => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  categories: [],
  isLoading: false,
  activeCategoryFilter: null,
  activePriorityFilter: null,
  activeTab: 'all',

  fetchTasks: async () => {
    try {
      set({ isLoading: true })
      const res = await axios.get('/api/v1/tasks')
      set({ tasks: res.data, isLoading: false })
    } catch (e) {
      console.error('Failed to fetch tasks', e)
      set({ isLoading: false })
    }
  },

  fetchCategories: async () => {
    try {
      const res = await axios.get('/api/v1/tasks/categories')
      set({ categories: res.data })
    } catch (e) {
      console.error('Failed to fetch categories', e)
    }
  },

  createTask: async (data) => {
    try {
      const res = await axios.post('/api/v1/tasks', data)
      await get().fetchTasks()
      return res.data.task
    } catch (e) {
      console.error('Failed to create task', e)
    }
  },

  updateTask: async (id, data) => {
    try {
      await axios.patch(`/api/v1/tasks/${id}`, data)
      await get().fetchTasks()
    } catch (e) {
      console.error('Failed to update task', e)
    }
  },

  deleteTask: async (id) => {
    try {
      await axios.delete(`/api/v1/tasks/${id}`)
      set({ tasks: get().tasks.filter(t => t.id !== id) })
    } catch (e) {
      console.error('Failed to delete task', e)
    }
  },

  toggleTaskStatus: async (id) => {
    const task = get().tasks.find(t => t.id === id)
    if (!task) return
    const newStatus = task.status === 'completed' ? 'todo' : 'completed'
    await get().updateTask(id, { status: newStatus })
  },

  createSubtask: async (taskId, title) => {
    try {
      await axios.post(`/api/v1/tasks/${taskId}/subtasks`, { title })
      await get().fetchTasks()
    } catch (e) {
      console.error('Failed to create subtask', e)
    }
  },

  toggleSubtask: async (subtaskId, is_completed) => {
    try {
      await axios.patch(`/api/v1/tasks/subtasks/${subtaskId}`, { is_completed })
      await get().fetchTasks()
    } catch (e) {
      console.error('Failed to toggle subtask', e)
    }
  },

  updateSubtask: async (subtaskId, data) => {
    try {
      await axios.patch(`/api/v1/tasks/subtasks/${subtaskId}`, data)
      await get().fetchTasks()
    } catch (e) {
      console.error('Failed to update subtask', e)
    }
  },

  deleteSubtask: async (subtaskId) => {
    try {
      await axios.delete(`/api/v1/tasks/subtasks/${subtaskId}`)
      await get().fetchTasks()
    } catch (e) {
      console.error('Failed to delete subtask', e)
    }
  },

  createCategory: async (name, color, icon = 'folder') => {
    try {
      await axios.post('/api/v1/tasks/categories', { name, color, icon })
      await get().fetchCategories()
    } catch (e) {
      console.error('Failed to create category', e)
    }
  },

  setCategoryFilter: (catId) => set({ activeCategoryFilter: catId }),
  setPriorityFilter: (p) => set({ activePriorityFilter: p }),
  setActiveTab: (tab) => set({ activeTab: tab })
}))
