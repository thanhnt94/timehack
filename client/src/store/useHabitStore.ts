import { create } from 'zustand'
import axios from 'axios'

export interface Habit {
  id: number
  title: string
  description?: string
  category_id?: number
  category?: { id: number; name: string; color: string; icon?: string }
  frequency_type: 'daily' | 'weekly_days' | 'weekly_target' | 'monthly_target'
  weekly_days?: number[]
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'anytime'
  target_count: number
  unit: string
  reminder_time?: string
  icon: string
  color: string
  archived: boolean
  streak_freeze_count: number
  current_streak: number
  longest_streak: number
  streak_unit?: 'days' | 'weeks' | 'months'
  period_label?: string
  current_period_count?: number
  period_completed?: boolean
  strength_percent: number
  mastery_rank: 'S' | 'A' | 'B' | 'C'
  rank_title: string
  total_completions: number
  today_completed: boolean
  today_frozen: boolean
  today_count: number
  today_time_spent: number
  today_notes?: string
  today_mood?: string
  mini_history?: { date: string; completed: boolean; is_frozen_day?: boolean }[]
  created_at: string
}

export interface HabitLogEntry {
  id: number
  logged_date: string
  completed_time?: string
  count: number
  completed: boolean
  is_frozen_day: boolean
  time_spent: number
  notes?: string
  mood?: string
  created_at: string
}

export interface HeatmapItem {
  date: string
  completed: boolean
  is_frozen_day?: boolean
  time_spent?: number
  count: number
  mood?: string
  notes?: string
  completed_time?: string
}

export interface HabitDetail extends Habit {
  total_time_spent: number
  heatmap: HeatmapItem[]
  logs: HabitLogEntry[]
}

interface HabitState {
  habits: Habit[]
  activeDetail: HabitDetail | null
  isLoading: boolean
  isDetailLoading: boolean
  heatmapData: Record<number, HeatmapItem[]>

  fetchHabits: (includeArchived?: boolean) => Promise<void>
  fetchHabitDetail: (habitId: number) => Promise<HabitDetail | null>
  createHabit: (data: Partial<Habit>) => Promise<number | undefined>
  updateHabit: (habitId: number, data: Partial<Habit>) => Promise<void>
  toggleFreezeHabit: (habitId: number) => Promise<void>
  freezeDay: (habitId: number, logged_date?: string) => Promise<void>
  logHabitFocus: (habitId: number, durationMinutes: number) => Promise<void>
  checkinHabit: (habitId: number, payload?: { logged_date?: string; completed?: boolean; is_frozen_day?: boolean; count?: number; notes?: string; mood?: string; completed_time?: string }) => Promise<void>
  upsertHabitLog: (habitId: number, logData: { logged_date: string; completed_time?: string; count?: number; completed?: boolean; is_frozen_day?: boolean; time_spent?: number; notes?: string; mood?: string }) => Promise<void>
  deleteHabit: (habitId: number, permanent?: boolean) => Promise<void>
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  activeDetail: null,
  isLoading: false,
  isDetailLoading: false,
  heatmapData: {},

  fetchHabits: async (includeArchived = true) => {
    try {
      set({ isLoading: true })
      const res = await axios.get(`/api/v1/habits?include_archived=${includeArchived}`)
      set({ habits: res.data, isLoading: false })
    } catch (e) {
      console.error('Failed to fetch habits', e)
      set({ isLoading: false })
    }
  },

  fetchHabitDetail: async (habitId: number) => {
    try {
      set({ isDetailLoading: true })
      const res = await axios.get(`/api/v1/habits/${habitId}`)
      set({ activeDetail: res.data, isDetailLoading: false })
      return res.data
    } catch (e) {
      console.error('Failed to fetch habit detail', e)
      set({ isDetailLoading: false })
      return null
    }
  },

  createHabit: async (data) => {
    try {
      const res = await axios.post('/api/v1/habits', data)
      await get().fetchHabits(true)
      return res.data.habit_id
    } catch (e) {
      console.error('Failed to create habit', e)
      return undefined
    }
  },

  updateHabit: async (habitId, data) => {
    try {
      await axios.patch(`/api/v1/habits/${habitId}`, data)
      await get().fetchHabits(true)
      if (get().activeDetail?.id === habitId) {
        await get().fetchHabitDetail(habitId)
      }
    } catch (e) {
      console.error('Failed to update habit', e)
    }
  },

  toggleFreezeHabit: async (habitId) => {
    try {
      await axios.post(`/api/v1/habits/${habitId}/toggle-freeze`)
      await get().fetchHabits(true)
      if (get().activeDetail?.id === habitId) {
        await get().fetchHabitDetail(habitId)
      }
    } catch (e) {
      console.error('Failed to toggle freeze habit', e)
    }
  },

  freezeDay: async (habitId, logged_date) => {
    try {
      await axios.post(`/api/v1/habits/${habitId}/freeze-day`, { logged_date })
      await get().fetchHabits(true)
      if (get().activeDetail?.id === habitId) {
        await get().fetchHabitDetail(habitId)
      }
    } catch (e) {
      console.error('Failed to freeze habit day', e)
    }
  },

  logHabitFocus: async (habitId, durationMinutes) => {
    try {
      await axios.post(`/api/v1/habits/${habitId}/log-focus`, { duration_minutes: durationMinutes })
      await get().fetchHabits(true)
      if (get().activeDetail?.id === habitId) {
        await get().fetchHabitDetail(habitId)
      }
    } catch (e) {
      console.error('Failed to log habit focus', e)
    }
  },

  checkinHabit: async (habitId, payload = {}) => {
    try {
      await axios.post(`/api/v1/habits/${habitId}/checkin`, payload)
      await get().fetchHabits(true)
      if (get().activeDetail?.id === habitId) {
        await get().fetchHabitDetail(habitId)
      }
    } catch (e) {
      console.error('Failed to checkin habit', e)
    }
  },

  upsertHabitLog: async (habitId, logData) => {
    try {
      await axios.post(`/api/v1/habits/${habitId}/logs`, logData)
      await get().fetchHabits(true)
      if (get().activeDetail?.id === habitId) {
        await get().fetchHabitDetail(habitId)
      }
    } catch (e) {
      console.error('Failed to upsert habit log', e)
    }
  },

  deleteHabit: async (habitId, permanent = false) => {
    try {
      await axios.delete(`/api/v1/habits/${habitId}?permanent=${permanent}`)
      set({ habits: get().habits.filter(h => h.id !== habitId) })
      if (get().activeDetail?.id === habitId) {
        set({ activeDetail: null })
      }
    } catch (e) {
      console.error('Failed to delete habit', e)
    }
  }
}))
