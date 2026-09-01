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
  parent_id?: number | null
  parent?: { id: number; name: string; color: string; icon?: string } | null
  name: string
  color: string
  icon?: string
  category_type?: 'productive' | 'neutral' | 'wasted'
  is_default?: boolean
  tasks_count?: number
  focus_minutes?: number
  subcategories?: Category[]
  created_at?: string
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
  toggleTaskStatus: (id: number) => Promise<void>
  createSubtask: (taskId: number, title: string) => Promise<void>
  toggleSubtask: (subtaskId: number, is_completed: boolean) => Promise<void>
  updateSubtask: (subtaskId: number, data: { title?: string; is_completed?: boolean }) => Promise<void>
  deleteSubtask: (subtaskId: number) => Promise<void>
  createCategory: (data: { name: string; color: string; icon?: string; parent_id?: number | null; category_type?: string }) => Promise<void>
  updateCategory: (id: number, data: Partial<Category>) => Promise<void>
  deleteCategory: (id: number) => Promise<void>
  seedPresetCategories: () => Promise<void>
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
      set({ tasks: Array.isArray(res.data) ? res.data : [], isLoading: false })
    } catch (e) {
      console.error('Failed to fetch tasks', e)
      set({ tasks: [], isLoading: false })
    }
  },

  fetchCategories: async () => {
    try {
      const res = await axios.get('/api/v1/tasks/categories')
      set({ categories: Array.isArray(res.data) ? res.data : [] })
    } catch (e) {
      console.error('Failed to fetch categories', e)
      set({ categories: [] })
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

  createCategory: async (data) => {
    try {
      await axios.post('/api/v1/tasks/categories', data)
      await get().fetchCategories()
    } catch (e) {
      console.error('Failed to create category', e)
    }
  },

  updateCategory: async (id, data) => {
    try {
      await axios.patch(`/api/v1/tasks/categories/${id}`, data)
      await get().fetchCategories()
    } catch (e) {
      console.error('Failed to update category', e)
    }
  },

  deleteCategory: async (id) => {
    try {
      await axios.delete(`/api/v1/tasks/categories/${id}`)
      await get().fetchCategories()
    } catch (e) {
      console.error('Failed to delete category', e)
    }
  },

  seedPresetCategories: async () => {
    try {
      await axios.post('/api/v1/tasks/categories/seed-presets')
      await get().fetchCategories()
    } catch (e) {
      console.error('Failed to seed preset categories', e)
    }
  },

  setCategoryFilter: (catId) => set({ activeCategoryFilter: catId }),
  setPriorityFilter: (p) => set({ activePriorityFilter: p }),
  setActiveTab: (tab) => set({ activeTab: tab })
}))
