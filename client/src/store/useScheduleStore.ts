import { create } from 'zustand'
import axios from 'axios'

export interface ScheduleSlot {
  id: number
  date: string
  start_time: string
  end_time: string
  title: string
  task_id?: number
  habit_id?: number
  category_id?: number
  category?: { id: number; name: string; color: string }
  is_done: boolean
  reminder_enabled?: boolean
  remind_at?: string
  remind_before_mins?: number
  notes?: string
}

interface ScheduleState {
  slots: ScheduleSlot[]
  selectedDate: string
  isLoading: boolean

  setSelectedDate: (dateStr: string) => void
  fetchSlots: (dateStr?: string) => Promise<void>
  createSlot: (data: Partial<ScheduleSlot>) => Promise<void>
  updateSlot: (slotId: number, data: Partial<ScheduleSlot>) => Promise<void>
  toggleSlotDone: (slotId: number, is_done: boolean) => Promise<void>
  deleteSlot: (slotId: number) => Promise<void>
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  slots: [],
  selectedDate: new Date().toISOString().split('T')[0],
  isLoading: false,

  setSelectedDate: (dateStr) => {
    set({ selectedDate: dateStr })
    get().fetchSlots(dateStr)
  },

  fetchSlots: async (dateStr) => {
    try {
      set({ isLoading: true })
      const targetDate = dateStr || get().selectedDate
      const res = await axios.get(`/api/v1/schedule?date_str=${targetDate}`)
      set({ slots: Array.isArray(res.data) ? res.data : [], isLoading: false })
    } catch (e) {
      console.error('Failed to fetch schedule slots', e)
      set({ slots: [], isLoading: false })
    }
  },

  createSlot: async (data) => {
    try {
      const payload = {
        date: data.date || get().selectedDate,
        start_time: data.start_time || '09:00',
        end_time: data.end_time || '10:00',
        title: data.title || 'New Schedule Slot',
        task_id: data.task_id,
        habit_id: data.habit_id,
        category_id: data.category_id,
        notes: data.notes
      }
      await axios.post('/api/v1/schedule', payload)
      await get().fetchSlots(payload.date)
    } catch (e) {
      console.error('Failed to create schedule slot', e)
    }
  },

  updateSlot: async (slotId, data) => {
    try {
      // Optimistic update
      set({
        slots: get().slots.map(s => s.id === slotId ? { ...s, ...data } : s)
      })
      await axios.patch(`/api/v1/schedule/${slotId}`, data)
      await get().fetchSlots()
    } catch (e) {
      console.error('Failed to update schedule slot', e)
      await get().fetchSlots()
    }
  },

  toggleSlotDone: async (slotId, is_done) => {
    try {
      await axios.patch(`/api/v1/schedule/${slotId}`, { is_done })
      await get().fetchSlots()
    } catch (e) {
      console.error('Failed to toggle schedule slot', e)
    }
  },

  deleteSlot: async (slotId) => {
    try {
      await axios.delete(`/api/v1/schedule/${slotId}`)
      set({ slots: get().slots.filter(s => s.id !== slotId) })
    } catch (e) {
      console.error('Failed to delete schedule slot', e)
    }
  }
}))
