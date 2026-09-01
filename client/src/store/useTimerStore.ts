import { create } from 'zustand'
import axios from 'axios'
import { useTaskStore } from './useTaskStore'
import { useHabitStore } from './useHabitStore'
import { useTimeLogStore } from './useTimeLogStore'

export type TimerMode = 'pomodoro' | 'stopwatch'

export interface ActiveTrack {
  id: string
  db_id?: number
  title: string
  taskId?: number | null
  habitId?: number | null
  categoryId?: number | null
  categoryName?: string | null
  categoryColor?: string | null
  categoryType?: string | null
  startTime: Date
  elapsedSeconds: number
  isPaused: boolean
  mode: TimerMode
}

interface TimerState {
  mode: TimerMode
  isRunning: boolean
  isPaused: boolean
  isLoadingTracks: boolean

  // Active Multi-Tracks
  activeTracks: ActiveTrack[]
  
  // Pomodoro settings
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  currentPhase: 'work' | 'short_break' | 'long_break'
  completedPomodoros: number

  // Dynamic state for active primary track
  secondsRemaining: number
  elapsedSeconds: number
  startTime: Date | null
  
  // Targets
  activeTaskId: number | null
  activeHabitId: number | null
  activeCategoryId: number | null
  activeCategoryName: string | null
  activeCategoryColor: string | null
  activeCategoryIcon: string | null
  activeCategoryType: string | null
  activeTitle: string

  // Timer interval reference (internal)
  intervalId: any | null

  fetchActiveTracks: () => Promise<void>
  startNewTrack: (target: { 
    title: string; 
    categoryId?: number | null; 
    categoryName?: string | null; 
    categoryColor?: string | null; 
    categoryType?: string | null; 
    taskId?: number | null; 
    habitId?: number | null; 
    mode?: TimerMode;
  }) => Promise<string>
  updateActiveTrack: (trackId: string, data: {
    title?: string
    categoryId?: number | null
    categoryName?: string | null
    categoryColor?: string | null
    categoryType?: string | null
    startTime?: Date
  }) => Promise<void>
  pauseTrack: (trackId: string) => Promise<void>
  resumeTrack: (trackId: string) => Promise<void>
  stopTrack: (trackId: string) => Promise<void>
  cancelTrack: (trackId: string) => Promise<void>

  startTimer: (target?: { taskId?: number; habitId?: number; categoryId?: number; categoryName?: string; categoryColor?: string; categoryIcon?: string; categoryType?: string; title?: string; durationMinutes?: number; mode?: TimerMode }) => Promise<void>
  setCategory: (cat: { id: number; name: string; color: string; icon?: string; category_type?: string } | null) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => Promise<void>
  resetTimer: () => void
  switchMode: (mode: TimerMode) => void
  setMode: (mode: TimerMode) => void
  setPomodoroDurations: (work: number, shortBreak: number, longBreak: number) => void
}

const ensureInterval = (set: any, get: any) => {
  if (get().intervalId) return

  const intId = setInterval(() => {
    const { activeTracks } = get()
    if (activeTracks.length === 0) {
      clearInterval(get().intervalId)
      set({ intervalId: null, isRunning: false })
      return
    }

    const updated = activeTracks.map((t: ActiveTrack) => {
      if (t.isPaused) return t
      return { ...t, elapsedSeconds: t.elapsedSeconds + 1 }
    })

    set({
      activeTracks: updated,
      isRunning: updated.length > 0,
      elapsedSeconds: updated[0]?.elapsedSeconds || 0,
      startTime: updated[0]?.startTime || null,
      activeTitle: updated[0]?.title || '',
      activeCategoryName: updated[0]?.categoryName || null,
      activeCategoryColor: updated[0]?.categoryColor || null
    })
  }, 1000)

  set({ intervalId: intId })
}

export const useTimerStore = create<TimerState>((set, get) => ({
  mode: 'stopwatch',
  isRunning: false,
  isPaused: false,
  isLoadingTracks: false,
  activeTracks: [],

  workDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  currentPhase: 'work',
  completedPomodoros: 0,

  secondsRemaining: 25 * 60,
  elapsedSeconds: 0,
  startTime: null,

  activeTaskId: null,
  activeHabitId: null,
  activeCategoryId: null,
  activeCategoryName: null,
  activeCategoryColor: null,
  activeCategoryIcon: null,
  activeCategoryType: null,
  activeTitle: 'Hoạt động thực tế',
  intervalId: null,

  setMode: (mode) => set({ mode }),
  switchMode: (mode) => set({ mode }),

  setCategory: (cat) => {
    if (!cat) {
      set({
        activeCategoryId: null,
        activeCategoryName: null,
        activeCategoryColor: null,
        activeCategoryIcon: null,
        activeCategoryType: null
      })
    } else {
      set({
        activeCategoryId: cat.id,
        activeCategoryName: cat.name,
        activeCategoryColor: cat.color,
        activeCategoryIcon: cat.icon || 'folder',
        activeCategoryType: cat.category_type || 'productive'
      })
    }
  },

  setPomodoroDurations: (work, shortBreak, longBreak) => {
    set({ 
      workDuration: work, 
      shortBreakDuration: shortBreak, 
      longBreakDuration: longBreak
    })
  },

  // Fetch active tracks from database on load
  fetchActiveTracks: async () => {
    try {
      set({ isLoadingTracks: true })
      const res = await axios.get('/api/v1/time-tracking/active-tracks')
      const rawList = Array.isArray(res.data) ? res.data : []
      const tracks: ActiveTrack[] = rawList.map((t: any) => ({
        id: String(t.id),
        db_id: t.db_id || Number(t.id),
        title: t.title || 'Hoạt động thực tế',
        taskId: t.task_id || null,
        habitId: t.habit_id || null,
        categoryId: t.category_id || null,
        categoryName: t.category_name || null,
        categoryColor: t.category_color || null,
        categoryType: t.category_type || 'productive',
        startTime: t.start_time ? new Date(t.start_time) : new Date(),
        elapsedSeconds: t.elapsed_seconds || 0,
        isPaused: t.is_paused || false,
        mode: (t.timer_type as TimerMode) || 'stopwatch'
      }))

      set({
        activeTracks: tracks,
        isRunning: tracks.length > 0,
        startTime: tracks[0]?.startTime || null,
        activeTitle: tracks[0]?.title || '',
        activeCategoryName: tracks[0]?.categoryName || null,
        activeCategoryColor: tracks[0]?.categoryColor || null,
        isLoadingTracks: false
      })

      if (tracks.length > 0) {
        ensureInterval(set, get)
      }
    } catch (e) {
      console.error('Failed to fetch active tracks from DB', e)
      set({ activeTracks: [], isLoadingTracks: false })
    }
  },

  // Multi-track Start (POST to DB)
  startNewTrack: async (target) => {
    const chosenMode = target.mode || get().mode || 'stopwatch'
    const now = new Date()

    let createdId = `temp_${Date.now()}`
    let dbId: number | undefined = undefined

    try {
      const res = await axios.post('/api/v1/time-tracking/active-tracks', {
        title: target.title.trim() || 'Hoạt động thực tế',
        task_id: target.taskId || null,
        habit_id: target.habitId || null,
        category_id: target.categoryId || null,
        start_time: now.toISOString(),
        timer_type: chosenMode,
        is_paused: false,
        accumulated_seconds: 0
      })

      if (res.data?.id) {
        createdId = String(res.data.id)
        dbId = res.data.db_id || Number(res.data.id)
      }
    } catch (e) {
      console.error('Failed to persist active track to DB', e)
    }

    const newTrack: ActiveTrack = {
      id: createdId,
      db_id: dbId,
      title: target.title.trim() || 'Hoạt động thực tế',
      taskId: target.taskId || null,
      habitId: target.habitId || null,
      categoryId: target.categoryId || null,
      categoryName: target.categoryName || null,
      categoryColor: target.categoryColor || null,
      categoryType: target.categoryType || 'productive',
      startTime: now,
      elapsedSeconds: 0,
      isPaused: false,
      mode: chosenMode
    }

    const nextTracks = [newTrack, ...get().activeTracks]
    set({
      activeTracks: nextTracks,
      isRunning: true,
      isPaused: false,
      startTime: nextTracks[0]?.startTime || now,
      activeTitle: nextTracks[0]?.title || '',
      activeCategoryName: nextTracks[0]?.categoryName || null,
      activeCategoryColor: nextTracks[0]?.categoryColor || null
    })

    ensureInterval(set, get)
    return createdId
  },

  // Update active track (PATCH to DB)
  updateActiveTrack: async (trackId, data) => {
    const updated = get().activeTracks.map(t => {
      if (t.id === trackId) {
        let newElapsed = t.elapsedSeconds
        if (data.startTime) {
          const now = new Date()
          const diffSec = Math.max(0, Math.floor((now.getTime() - data.startTime.getTime()) / 1000))
          newElapsed = diffSec
        }
        return {
          ...t,
          title: data.title !== undefined ? data.title : t.title,
          categoryId: data.categoryId !== undefined ? data.categoryId : t.categoryId,
          categoryName: data.categoryName !== undefined ? data.categoryName : t.categoryName,
          categoryColor: data.categoryColor !== undefined ? data.categoryColor : t.categoryColor,
          categoryType: data.categoryType !== undefined ? data.categoryType : t.categoryType,
          startTime: data.startTime !== undefined ? data.startTime : t.startTime,
          elapsedSeconds: newElapsed
        }
      }
      return t
    })

    set({
      activeTracks: updated,
      activeTitle: updated[0]?.title || '',
      activeCategoryName: updated[0]?.categoryName || null,
      activeCategoryColor: updated[0]?.categoryColor || null
    })

    const track = get().activeTracks.find(t => t.id === trackId)
    const dbId = track?.db_id || Number(trackId)
    if (dbId && !isNaN(dbId)) {
      try {
        await axios.patch(`/api/v1/time-tracking/active-tracks/${dbId}`, {
          title: data.title,
          category_id: data.categoryId,
          start_time: data.startTime ? data.startTime.toISOString() : undefined
        })
      } catch (e) {
        console.error('Failed to patch active track in DB', e)
      }
    }
  },

  pauseTrack: async (trackId: string) => {
    const track = get().activeTracks.find(t => t.id === trackId)
    const updated = get().activeTracks.map(t => {
      if (t.id === trackId) return { ...t, isPaused: true }
      return t
    })
    set({ activeTracks: updated })

    const dbId = track?.db_id || Number(trackId)
    if (dbId && !isNaN(dbId)) {
      try {
        await axios.patch(`/api/v1/time-tracking/active-tracks/${dbId}`, {
          is_paused: true,
          accumulated_seconds: track?.elapsedSeconds || 0
        })
      } catch (e) {
        console.error('Failed to pause track in DB', e)
      }
    }
  },

  resumeTrack: async (trackId: string) => {
    const track = get().activeTracks.find(t => t.id === trackId)
    const updated = get().activeTracks.map(t => {
      if (t.id === trackId) return { ...t, isPaused: false }
      return t
    })
    set({ activeTracks: updated })

    const dbId = track?.db_id || Number(trackId)
    if (dbId && !isNaN(dbId)) {
      try {
        await axios.patch(`/api/v1/time-tracking/active-tracks/${dbId}`, {
          is_paused: false
        })
      } catch (e) {
        console.error('Failed to resume track in DB', e)
      }
    }
  },

  stopTrack: async (trackId: string) => {
    const track = get().activeTracks.find(t => t.id === trackId)
    const dbId = track?.db_id || Number(trackId)

    if (dbId && !isNaN(dbId)) {
      try {
        await axios.post(`/api/v1/time-tracking/active-tracks/${dbId}/finish`)
        const todayIso = new Date().toISOString().split('T')[0]
        useTimeLogStore.getState().fetchLogs(todayIso)
        useTaskStore.getState().fetchTasks()
      } catch (e) {
        console.error('Failed to finish track in DB', e)
      }
    }

    const remainingTracks = get().activeTracks.filter(t => t.id !== trackId)
    set({
      activeTracks: remainingTracks,
      isRunning: remainingTracks.length > 0,
      elapsedSeconds: remainingTracks[0]?.elapsedSeconds || 0,
      startTime: remainingTracks[0]?.startTime || null,
      activeTitle: remainingTracks[0]?.title || '',
      activeCategoryName: remainingTracks[0]?.categoryName || null,
      activeCategoryColor: remainingTracks[0]?.categoryColor || null
    })

    if (remainingTracks.length === 0 && get().intervalId) {
      clearInterval(get().intervalId)
      set({ intervalId: null, isRunning: false })
    }
  },

  cancelTrack: async (trackId: string) => {
    const track = get().activeTracks.find(t => t.id === trackId)
    const dbId = track?.db_id || Number(trackId)

    if (dbId && !isNaN(dbId)) {
      try {
        await axios.delete(`/api/v1/time-tracking/active-tracks/${dbId}`)
      } catch (e) {
        console.error('Failed to delete active track in DB', e)
      }
    }

    const remainingTracks = get().activeTracks.filter(t => t.id !== trackId)
    set({
      activeTracks: remainingTracks,
      isRunning: remainingTracks.length > 0,
      elapsedSeconds: remainingTracks[0]?.elapsedSeconds || 0,
      startTime: remainingTracks[0]?.startTime || null,
      activeTitle: remainingTracks[0]?.title || '',
      activeCategoryName: remainingTracks[0]?.categoryName || null,
      activeCategoryColor: remainingTracks[0]?.categoryColor || null
    })

    if (remainingTracks.length === 0 && get().intervalId) {
      clearInterval(get().intervalId)
      set({ intervalId: null, isRunning: false })
    }
  },

  startTimer: async (target) => {
    await get().startNewTrack({
      title: target?.title || 'Hoạt động thực tế',
      categoryId: target?.categoryId,
      categoryName: target?.categoryName,
      categoryColor: target?.categoryColor,
      categoryType: target?.categoryType,
      taskId: target?.taskId,
      habitId: target?.habitId,
      mode: target?.mode || get().mode
    })
  },

  pauseTimer: () => {
    const first = get().activeTracks[0]
    if (first) get().pauseTrack(first.id)
    set({ isPaused: true })
  },

  resumeTimer: () => {
    const first = get().activeTracks[0]
    if (first) get().resumeTrack(first.id)
    set({ isPaused: false })
  },

  stopTimer: async () => {
    const first = get().activeTracks[0]
    if (first) await get().stopTrack(first.id)
  },

  resetTimer: () => {
    const first = get().activeTracks[0]
    if (first) get().cancelTrack(first.id)
  }
}))
