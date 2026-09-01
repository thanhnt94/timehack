import { create } from 'zustand'
import axios from 'axios'
import { useTaskStore } from './useTaskStore'
import { useHabitStore } from './useHabitStore'

export type TimerMode = 'pomodoro' | 'stopwatch'

interface TimerState {
  mode: TimerMode
  isRunning: boolean
  isPaused: boolean
  
  // Pomodoro settings
  workDuration: number // seconds (default 25m = 1500)
  shortBreakDuration: number // seconds (default 5m = 300)
  longBreakDuration: number // seconds (default 15m = 900)
  currentPhase: 'work' | 'short_break' | 'long_break'
  completedPomodoros: number

  // Dynamic state
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

  startTimer: (target?: { taskId?: number; habitId?: number; categoryId?: number; categoryName?: string; categoryColor?: string; categoryIcon?: string; categoryType?: string; title?: string; durationMinutes?: number }) => void
  setCategory: (cat: { id: number; name: string; color: string; icon?: string; category_type?: string } | null) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => Promise<void>
  setMode: (mode: TimerMode) => void
  setPomodoroDurations: (work: number, shortBreak: number, longBreak: number) => void
}

export const useTimerStore = create<TimerState>((set, get) => ({
  mode: 'pomodoro',
  isRunning: false,
  isPaused: false,

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
  activeTitle: 'Tập trung công việc',
  intervalId: null,

  setMode: (mode) => {
    const isRunning = get().isRunning
    if (!isRunning) {
      set({ 
        mode, 
        secondsRemaining: mode === 'pomodoro' ? get().workDuration : 0, 
        elapsedSeconds: 0 
      })
    }
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
      longBreakDuration: longBreak,
      secondsRemaining: get().mode === 'pomodoro' && !get().isRunning ? work : get().secondsRemaining
    })
  },

  startTimer: (target) => {
    const existing = get().intervalId
    if (existing) clearInterval(existing)

    const now = new Date()
    const mode = get().mode
    const customDurationSec = target?.durationMinutes ? target.durationMinutes * 60 : get().workDuration

    // Infer category from task or target if provided
    let catId = target?.categoryId || get().activeCategoryId
    let catName = target?.categoryName || get().activeCategoryName
    let catColor = target?.categoryColor || get().activeCategoryColor
    let catIcon = target?.categoryIcon || get().activeCategoryIcon
    let catType = target?.categoryType || get().activeCategoryType

    if (target?.taskId && !catId) {
      const task = useTaskStore.getState().tasks.find(t => t.id === target.taskId)
      if (task?.category) {
        catId = task.category.id
        catName = task.category.name
        catColor = task.category.color
        catIcon = task.category.icon || 'folder'
      }
    }

    set({
      isRunning: true,
      isPaused: false,
      startTime: now,
      workDuration: customDurationSec,
      activeTaskId: target?.taskId || null,
      activeHabitId: target?.habitId || null,
      activeCategoryId: catId || null,
      activeCategoryName: catName || null,
      activeCategoryColor: catColor || null,
      activeCategoryIcon: catIcon || null,
      activeCategoryType: catType || 'productive',
      activeTitle: target?.title || (target?.taskId ? 'Task' : target?.habitId ? 'Habit' : 'Phiên tập trung'),
      secondsRemaining: mode === 'pomodoro' ? customDurationSec : 0,
      elapsedSeconds: 0
    })

    const timerInt = setInterval(() => {
      const { isRunning, isPaused, mode, secondsRemaining, elapsedSeconds, currentPhase } = get()
      if (!isRunning || isPaused) return

      if (mode === 'pomodoro') {
        if (secondsRemaining > 1) {
          set({ 
            secondsRemaining: secondsRemaining - 1, 
            elapsedSeconds: elapsedSeconds + 1 
          })
        } else {
          // Pomodoro phase finished!
          clearInterval(get().intervalId)
          set({ isRunning: false, intervalId: null })

          if (currentPhase === 'work') {
            const nextCompleted = get().completedPomodoros + 1
            const nextPhase = nextCompleted % 4 === 0 ? 'long_break' : 'short_break'
            const nextDuration = nextPhase === 'long_break' ? get().longBreakDuration : get().shortBreakDuration
            
            set({ 
              completedPomodoros: nextCompleted, 
              currentPhase: nextPhase,
              secondsRemaining: nextDuration
            })
            // Save time log
            get().stopTimer()
          } else {
            set({ 
              currentPhase: 'work', 
              secondsRemaining: get().workDuration 
            })
          }
        }
      } else {
        // Stopwatch mode
        set({ elapsedSeconds: elapsedSeconds + 1 })
      }
    }, 1000)

    set({ intervalId: timerInt })
  },

  pauseTimer: () => {
    set({ isPaused: true })
  },

  resumeTimer: () => {
    set({ isPaused: false })
  },

  stopTimer: async () => {
    const { intervalId, startTime, elapsedSeconds, activeTaskId, activeHabitId, activeCategoryId, activeTitle, mode } = get()
    if (intervalId) clearInterval(intervalId)

    const end = new Date()
    const start = startTime || new Date(end.getTime() - elapsedSeconds * 1000)

    if (elapsedSeconds > 5) {
      const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60))
      try {
        await axios.post('/api/v1/time-tracking/logs', {
          task_id: activeTaskId,
          habit_id: activeHabitId,
          category_id: activeCategoryId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          duration_seconds: elapsedSeconds,
          timer_type: mode,
          notes: activeTitle
        })

        // If habit focus session, log directly to habit log
        if (activeHabitId) {
          await axios.post(`/api/v1/habits/${activeHabitId}/log-focus`, {
            duration_minutes: durationMinutes,
            notes: activeTitle
          })
          useHabitStore.getState().fetchHabits()
        }

        // Refresh stores
        useTaskStore.getState().fetchTasks()
        useTaskStore.getState().fetchCategories()
      } catch (e) {
        console.error('Failed to log time session', e)
      }
    }

    set({
      isRunning: false,
      isPaused: false,
      startTime: null,
      elapsedSeconds: 0,
      secondsRemaining: mode === 'pomodoro' ? get().workDuration : 0,
      intervalId: null
    })
  }
}))
