import { create } from 'zustand'
import axios from 'axios'
import { useTaskStore } from './useTaskStore'
import { useHabitStore } from './useHabitStore'
import { useTimeLogStore } from './useTimeLogStore'

export type TimerMode = 'pomodoro' | 'stopwatch'

export interface ActiveTrack {
  id: string
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

  // Active Multi-Tracks
  activeTracks: ActiveTrack[]
  
  // Pomodoro settings
  workDuration: number // seconds (default 25m = 1500)
  shortBreakDuration: number // seconds (default 5m = 300)
  longBreakDuration: number // seconds (default 15m = 900)
  currentPhase: 'work' | 'short_break' | 'long_break'
  completedPomodoros: number

  // Dynamic state for active primary track
  secondsRemaining: number // for pomodoro
  elapsedSeconds: number // for stopwatch & work session
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

  startNewTrack: (target: { 
    title: string; 
    categoryId?: number | null; 
    categoryName?: string | null; 
    categoryColor?: string | null; 
    categoryType?: string | null; 
    taskId?: number | null; 
    habitId?: number | null; 
    mode?: TimerMode;
    durationMinutes?: number;
  }) => Promise<string>
  updateActiveTrack: (trackId: string, data: {
    title?: string
    categoryId?: number | null
    categoryName?: string | null
    categoryColor?: string | null
    categoryType?: string | null
    startTime?: Date
  }) => void
  pauseTrack: (trackId: string) => void
  resumeTrack: (trackId: string) => void
  stopTrack: (trackId: string) => Promise<void>
  cancelTrack: (trackId: string) => void

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

export const useTimerStore = create<TimerState>((set, get) => ({
  mode: 'stopwatch',
  isRunning: false,
  isPaused: false,
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

  setMode: (mode) => {
    set({ mode })
  },

  switchMode: (mode) => {
    set({ mode })
  },

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

  // Multi-track Start
  startNewTrack: async (target) => {
    const now = new Date()
    const trackId = `track_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    const chosenMode = target.mode || get().mode || 'stopwatch'

    const newTrack: ActiveTrack = {
      id: trackId,
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

    // Start global interval ticker if not already running
    if (!get().intervalId) {
      const intId = setInterval(() => {
        const { activeTracks } = get()
        if (activeTracks.length === 0) {
          clearInterval(get().intervalId)
          set({ intervalId: null, isRunning: false })
          return
        }

        const updated = activeTracks.map(t => {
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

    return trackId
  },

  updateActiveTrack: (trackId, data) => {
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
  },

  pauseTrack: (trackId: string) => {
    const updated = get().activeTracks.map(t => {
      if (t.id === trackId) return { ...t, isPaused: true }
      return t
    })
    set({ activeTracks: updated })
  },

  resumeTrack: (trackId: string) => {
    const updated = get().activeTracks.map(t => {
      if (t.id === trackId) return { ...t, isPaused: false }
      return t
    })
    set({ activeTracks: updated })
  },

  stopTrack: async (trackId: string) => {
    const track = get().activeTracks.find(t => t.id === trackId)
    if (!track) return

    const end = new Date()
    const start = track.startTime || new Date(end.getTime() - track.elapsedSeconds * 1000)

    if (track.elapsedSeconds >= 1) {
      try {
        await axios.post('/api/v1/time-tracking/logs', {
          task_id: track.taskId,
          habit_id: track.habitId,
          category_id: track.categoryId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          duration_seconds: track.elapsedSeconds,
          timer_type: track.mode,
          notes: track.title
        })

        // Refresh stores
        const todayIso = new Date().toISOString().split('T')[0]
        useTimeLogStore.getState().fetchLogs(todayIso)
        useTaskStore.getState().fetchTasks()
      } catch (e) {
        console.error('Failed to save actual time log', e)
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

  cancelTrack: (trackId: string) => {
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

  // Legacy single-timer compatibility
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
