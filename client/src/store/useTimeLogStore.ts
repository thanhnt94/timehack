import { create } from 'zustand'
import axios from 'axios'

export interface TimeLogItem {
  id: number
  task_id?: number | null
  task_title?: string | null
  habit_id?: number | null
  habit_title?: string | null
  category_id?: number | null
  category_name?: string | null
  category_color?: string | null
  start_time: string // UTC ISO
  end_time: string // UTC ISO
  duration_seconds: number
  timer_type: string // pomodoro, stopwatch, manual
  notes?: string | null
}

interface TimeLogState {
  logs: TimeLogItem[]
  isLoading: boolean
  selectedDate: string
  setSelectedDate: (d: string) => void
  fetchLogs: (date?: string) => Promise<void>
  createLog: (data: {
    task_id?: number | null
    habit_id?: number | null
    category_id?: number | null
    start_time: string
    end_time: string
    duration_seconds: number
    timer_type?: string
    notes?: string
  }) => Promise<boolean>
  deleteLog: (id: number) => Promise<boolean>
}

export const useTimeLogStore = create<TimeLogState>((set, get) => ({
  logs: [],
  isLoading: false,
  selectedDate: new Date().toISOString().split('T')[0],

  setSelectedDate: (d: string) => {
    set({ selectedDate: d })
    get().fetchLogs(d)
  },

  fetchLogs: async (dateStr?: string) => {
    const d = dateStr || get().selectedDate
    set({ isLoading: true })
    try {
      const res = await axios.get('/api/v1/time-tracking/logs', {
        params: { date_str: d }
      })
      set({ logs: res.data, isLoading: false })
    } catch (e) {
      console.error('Failed to fetch time logs', e)
      set({ isLoading: false })
    }
  },

  createLog: async (data) => {
    try {
      await axios.post('/api/v1/time-tracking/logs', data)
      await get().fetchLogs()
      return true
    } catch (e) {
      console.error('Failed to create time log', e)
      return false
    }
  },

  deleteLog: async (id: number) => {
    try {
      await axios.delete(`/api/v1/time-tracking/logs/${id}`)
      set({ logs: get().logs.filter(l => l.id !== id) })
      return true
    } catch (e) {
      console.error('Failed to delete time log', e)
      return false
    }
  }
}))
