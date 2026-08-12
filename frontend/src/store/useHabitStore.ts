import { create } from 'zustand'
import axios from 'axios'

export interface Habit {
  id: number
  title: string
  description?: string
  category_id?: number
  category?: { id: number; name: string; color: string; icon?: string }
  frequency_type: 'daily' | 'weekly_days' | 'interval'
  weekly_days?: number[]
  target_count: number
  unit: string
  reminder_time?: string
  icon: string
  color: string
  current_streak: number
  longest_streak: number
  today_completed: boolean
  today_count: number
  created_at: string
}

export interface HeatmapItem {
  date: string
  completed: boolean
  count: number
}

interface HabitState {
  habits: Habit[]
  isLoading: boolean
  heatmapData: Record<number, HeatmapItem[]>

  fetchHabits: () => Promise<void>
  createHabit: (data: Partial<Habit>) => Promise<void>
  checkinHabit: (habitId: number, logged_date?: string, completed?: boolean) => Promise<void>
  fetchHeatmap: (habitId: number, days?: number) => Promise<void>
  deleteHabit: (habitId: number) => Promise<void>
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  isLoading: false,
  heatmapData: {},

  fetchHabits: async () => {
    try {
      set({ isLoading: true })
      const res = await axios.get('/api/v1/habits')
      set({ habits: res.data, isLoading: false })
    } catch (e) {
      console.error('Failed to fetch habits', e)
      set({ isLoading: false })
    }
  },

  createHabit: async (data) => {
    try {
      await axios.post('/api/v1/habits', data)
      await get().fetchHabits()
    } catch (e) {
      console.error('Failed to create habit', e)
    }
  },

  checkinHabit: async (habitId, logged_date, completed) => {
    try {
      await axios.post(`/api/v1/habits/${habitId}/checkin`, { logged_date, completed })
      await get().fetchHabits()
      await get().fetchHeatmap(habitId)
    } catch (e) {
      console.error('Failed to checkin habit', e)
    }
  },

  fetchHeatmap: async (habitId, days = 30) => {
    try {
      const res = await axios.get(`/api/v1/habits/${habitId}/heatmap?days=${days}`)
      set({ heatmapData: { ...get().heatmapData, [habitId]: res.data } })
    } catch (e) {
      console.error('Failed to fetch heatmap', e)
    }
  },

  deleteHabit: async (habitId) => {
    try {
      await axios.delete(`/api/v1/habits/${habitId}`)
      set({ habits: get().habits.filter(h => h.id !== habitId) })
    } catch (e) {
      console.error('Failed to delete habit', e)
    }
  }
}))
