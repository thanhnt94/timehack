import { create } from 'zustand'
import axios from 'axios'

export interface UserProfile {
  id: number
  username: string
  email: string
  full_name?: string
  avatar_url?: string
  timezone?: string
  role?: string
  settings?: any
}

interface AuthState {
  user: UserProfile | null
  isLoading: boolean
  fetchUser: () => Promise<void>
  login: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>
  backdoorLogin: (username?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateSettings: (settings: any) => Promise<void>
  updateTimezone: (timezone: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,

  fetchUser: async () => {
    try {
      set({ isLoading: true })
      const res = await axios.get('/api/v1/auth/me')
      set({ user: res.data, isLoading: false })
    } catch (e: any) {
      set({ user: null, isLoading: false })
    }
  },

  login: async (username: string, password?: string) => {
    try {
      const res = await axios.post('/api/v1/auth/login', { username, password })
      if (res.data.status === 'ok') {
        await get().fetchUser()
        return { success: true }
      }
      return { success: false, error: 'Đăng nhập thất bại' }
    } catch (e: any) {
      return {
        success: false,
        error: e.response?.data?.detail || 'Không thể đăng nhập. Vui lòng thử lại!'
      }
    }
  },

  backdoorLogin: async (username: string = 'admin') => {
    try {
      const res = await axios.post('/api/v1/auth/backdoor-login', { username })
      if (res.data.status === 'ok') {
        await get().fetchUser()
        return { success: true }
      }
      return { success: false, error: 'Đăng nhập khẩn cấp thất bại' }
    } catch (e: any) {
      return {
        success: false,
        error: e.response?.data?.detail || 'Lỗi đăng nhập khẩn cấp'
      }
    }
  },

  logout: async () => {
    try {
      await axios.post('/api/v1/auth/logout')
    } catch (e) {
      console.error('Logout error', e)
    } finally {
      set({ user: null })
      window.location.href = '/'
    }
  },

  updateSettings: async (newSettings: any) => {
    try {
      const res = await axios.post('/api/v1/auth/settings', newSettings)
      const current = get().user
      if (current) {
        set({
          user: {
            ...current,
            timezone: res.data.timezone || current.timezone,
            settings: res.data.settings
          }
        })
      }
    } catch (e) {
      console.error('Failed to update settings', e)
    }
  },

  updateTimezone: async (timezone: string) => {
    try {
      const res = await axios.post('/api/v1/auth/settings', { timezone })
      const current = get().user
      if (current) {
        set({
          user: {
            ...current,
            timezone: res.data.timezone || timezone,
            settings: res.data.settings
          }
        })
      }
    } catch (e) {
      console.error('Failed to update timezone', e)
    }
  }
}))
