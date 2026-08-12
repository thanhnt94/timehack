import { create } from 'zustand'
import axios from 'axios'

interface UserProfile {
  id: number
  username: string
  email: string
  full_name?: string
  avatar_url?: string
  settings?: any
}

interface AuthState {
  user: UserProfile | null
  isLoading: boolean
  fetchUser: () => Promise<void>
  updateSettings: (settings: any) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  fetchUser: async () => {
    try {
      set({ isLoading: true })
      const res = await axios.get('/api/v1/auth/me')
      set({ user: res.data, isLoading: false })
    } catch (e) {
      console.error('Failed to fetch user profile', e)
      set({ isLoading: false })
    }
  },
  updateSettings: async (newSettings: any) => {
    try {
      const res = await axios.post('/api/v1/auth/settings', newSettings)
      const current = get().user
      if (current) {
        set({ user: { ...current, settings: res.data.settings } })
      }
    } catch (e) {
      console.error('Failed to update settings', e)
    }
  }
}))
