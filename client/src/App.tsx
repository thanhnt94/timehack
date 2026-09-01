import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { Sparkles, BarChart3, Clock, CheckSquare, Zap } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { BottomNav } from './components/BottomNav'
import { QuickActionSheet } from './components/QuickActionSheet'
import { UserSettingsModal } from './components/UserSettingsModal'
import { LiveTrackingHub } from './pages/LiveTrackingHub'
import { TasksAndHabitsHub } from './pages/TasksAndHabitsHub'
import { HabitDetailPage } from './pages/HabitDetailPage'
import { TimeBlockingSchedule } from './pages/TimeBlockingSchedule'
import { PomodoroFocus } from './pages/PomodoroFocus'
import { ProductivityAnalytics } from './pages/ProductivityAnalytics'
import { CategoryManagement } from './pages/CategoryManagement'
import { LandingPage } from './pages/LandingPage'
import { Admin } from './pages/Admin'
import { useAuthStore } from './store/useAuthStore'
import { useTimerStore } from './store/useTimerStore'
import { useTaskStore } from './store/useTaskStore'
import { useHabitStore } from './store/useHabitStore'
import { useTimeLogStore } from './store/useTimeLogStore'
import { sounds } from './utils/soundEffects'

/* ── Inner app with router context ────── */
const AppShell: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { isRunning } = useTimerStore()
  const { tasks } = useTaskStore()
  const { habits } = useHabitStore()
  const { logs } = useTimeLogStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [focusOpen, setFocusOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const location = useLocation()

  const doneTasks = (tasks || []).filter(t => t?.status === 'completed').length
  const doneHabits = (habits || []).filter(h => !!h?.today_completed).length

  const totalTrackedSec = (logs || []).reduce((acc, cur) => acc + (cur?.duration_seconds || 0), 0)
  const totalTrackedH = Math.floor(totalTrackedSec / 3600)
  const totalTrackedM = Math.round((totalTrackedSec % 3600) / 60)
  const formattedTracked = totalTrackedH > 0 ? `${totalTrackedH}h ${totalTrackedM > 0 ? `${totalTrackedM}m` : ''}` : `${totalTrackedM}m`

  const isTasksOrHabitsPage = location.pathname.startsWith('/tasks') || (location.pathname === '/habits')

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-[#F8FAFC] text-slate-900 overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar user={user} onLogout={logout} onOpenSettings={() => setSettingsOpen(true)} />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-h-0 md:ml-60">
        {/* Unified Mobile Top Bar (Single Header) */}
        <header className="md:hidden shrink-0 flex items-center justify-between px-4 h-13 bg-white border-b border-slate-200 z-20">
          {/* Always Show TIMEHACK Brand Logo + Active Page */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex items-center gap-1.5 font-black text-sm tracking-wider font-mono text-slate-900 truncate">
              <span className="shrink-0">TIME<span className="text-violet-600">HACK</span></span>
              <span className="text-slate-300 font-normal shrink-0">|</span>
              <span className="text-xs font-bold text-slate-700 font-sans tracking-normal truncate">
                {location.pathname === '/' || location.pathname === '/calendar' || location.pathname === '/schedule'
                  ? 'Calendar'
                  : location.pathname === '/tracking'
                  ? 'Tracking'
                  : isTasksOrHabitsPage
                  ? 'Tasks & Habits'
                  : location.pathname === '/categories'
                  ? 'Categories'
                  : location.pathname === '/analytics'
                  ? 'Analytics'
                  : ''}
              </span>
            </div>

            {/* Quick Badges in Header */}
            {location.pathname === '/tracking' && (
              <span className="text-[10px] font-black font-mono text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200 shrink-0 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                <span>{formattedTracked}</span>
              </span>
            )}
            {isTasksOrHabitsPage && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] font-bold font-mono text-violet-700 bg-violet-50 px-1.5 py-0.2 rounded border border-violet-200 shrink-0 flex items-center gap-0.5">
                  <CheckSquare className="w-2.5 h-2.5" />
                  <span>{doneTasks}/{(tasks || []).length}</span>
                </span>
                <span className="text-[9px] font-bold font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0 flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" />
                  <span>{doneHabits}/{(habits || []).length}</span>
                </span>
              </div>
            )}
          </div>

          {/* Right Header Actions: Analytics & User Profile Avatar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Analytics Shortcut */}
            <Link
              to="/analytics"
              onClick={() => sounds.playTap()}
              className={`p-2 rounded-xl border transition active:scale-95 ${
                location.pathname === '/analytics'
                  ? 'bg-violet-50 text-violet-700 border-violet-200 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-violet-700 hover:bg-slate-50'
              }`}
              title="Analytics"
            >
              <BarChart3 className="w-4 h-4" />
            </Link>

            {/* User Profile Avatar (1-Tap opens Settings Modal) */}
            <button
              onClick={() => { sounds.playTap(); setSettingsOpen(true) }}
              className="relative flex items-center justify-center w-8 h-8 rounded-full bg-violet-600 text-white font-black text-xs shadow-xs hover:ring-2 hover:ring-violet-400 active:scale-90 transition-transform"
              title="User Settings, Timezone & Telegram"
              aria-label="User Settings"
            >
              <span>{user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}</span>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* Main page container */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F8FAFC]">
          <Routes>
            <Route path="/" element={<div className="flex-1 flex flex-col min-h-0 px-3 pt-2 md:px-8 md:pt-4 overflow-hidden"><div className="max-w-lg md:max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0 overflow-hidden"><TimeBlockingSchedule /></div></div>} />
            <Route path="/calendar" element={<div className="flex-1 flex flex-col min-h-0 px-3 pt-2 md:px-8 md:pt-4 overflow-hidden"><div className="max-w-lg md:max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0 overflow-hidden"><TimeBlockingSchedule /></div></div>} />
            <Route path="/schedule" element={<div className="flex-1 flex flex-col min-h-0 px-3 pt-2 md:px-8 md:pt-4 overflow-hidden"><div className="max-w-lg md:max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0 overflow-hidden"><TimeBlockingSchedule /></div></div>} />
            <Route path="/tracking" element={<LiveTrackingHub onOpenFullscreenFocus={() => setFocusOpen(true)} />} />
            <Route path="/tasks" element={<TasksAndHabitsHub />} />
            <Route path="/habits" element={<TasksAndHabitsHub />} />
            <Route path="/habits/:id" element={<HabitDetailPage />} />
            <Route path="/categories" element={<CategoryManagement />} />
            <Route path="/analytics" element={<div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6"><div className="max-w-lg md:max-w-5xl mx-auto"><ProductivityAnalytics /></div></div>} />
            <Route path="/admin" element={<div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6"><div className="max-w-lg md:max-w-5xl mx-auto"><Admin /></div></div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Mobile bottom nav */}
        <BottomNav onFabTap={() => setSheetOpen(true)} />
      </div>

      {/* Global Quick Action Sheet (FAB) */}
      <QuickActionSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onStartFocus={() => setFocusOpen(true)}
      />

      {/* Pomodoro Focus Modal */}
      {focusOpen && (
        <PomodoroFocus onClose={() => setFocusOpen(false)} />
      )}

      {/* User Settings, Timezone & Telegram Modal */}
      <UserSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}

export const App: React.FC = () => {
  const { user, isLoading, fetchUser } = useAuthStore()
  const { fetchTasks, fetchCategories } = useTaskStore()
  const { fetchHabits } = useHabitStore()
  const { fetchLogs } = useTimeLogStore()
  const { fetchActiveTracks } = useTimerStore()

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchTasks()
      fetchCategories()
      fetchHabits()
      fetchActiveTracks()
      const todayIso = new Date().toISOString().split('T')[0]
      fetchLogs(todayIso)
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-500 font-mono tracking-wider">SYNCING TIMEHACK...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  return (
    <Router>
      <AppShell />
    </Router>
  )
}

export default App

