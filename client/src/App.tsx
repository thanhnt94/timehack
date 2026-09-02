import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { Sparkles, BarChart3, Clock, CheckSquare, Zap, FolderTree } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { BottomNav } from './components/BottomNav'
import { QuickActionSheet } from './components/QuickActionSheet'
import { UserSettingsModal } from './components/UserSettingsModal'
import { TimeHub } from './pages/TimeHub'
import { TasksAndHabitsHub } from './pages/TasksAndHabitsHub'
import { HabitDetailPage } from './pages/HabitDetailPage'
import { PomodoroFocus } from './pages/PomodoroFocus'
import { ProductivityAnalytics } from './pages/ProductivityAnalytics'
import { CategoryManagement } from './pages/CategoryManagement'
import { SettingsHub } from './pages/SettingsHub'
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

  const isTimePage = location.pathname === '/' || location.pathname.startsWith('/calendar') || location.pathname.startsWith('/schedule') || location.pathname.startsWith('/tracking')
  const isActionsPage = location.pathname.startsWith('/tasks') || (location.pathname === '/habits') || (location.pathname === '/plans')

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-[#F8FAFC] text-slate-900 overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar user={user} onLogout={logout} onOpenSettings={() => setSettingsOpen(true)} />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-h-0 md:ml-60">
        {/* Unified Mobile Top Bar (Ultra Premium, Glassmorphic & Modern App Aesthetic) */}
        <header className="md:hidden shrink-0 flex items-center justify-between px-3.5 h-12 bg-white/90 backdrop-blur-2xl border-b border-slate-200/80 z-20 shadow-2xs">
          {/* Left: Brand Identity & Live Context Pill */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Gem Mascot Brand Logo */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center text-white shadow-sm shadow-violet-600/30 ring-1 ring-white/30 shrink-0">
              <Sparkles className="w-4 h-4 fill-white/20 text-white stroke-[2.2]" />
            </div>
            
            {/* Brand Title in Crisp Sans-Serif Typography */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight font-sans text-slate-900">
                Time<span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Hack</span>
              </span>

              {/* Dynamic Context Pill */}
              {isTimePage ? (
                totalTrackedSec > 0 ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 text-white shadow-xs border border-slate-800">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-black font-mono text-emerald-400 tracking-tight">{formattedTracked}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200/70 text-violet-700 text-[10px] font-black">
                    <Clock className="w-2.5 h-2.5 text-violet-600" />
                    <span>Time</span>
                  </div>
                )
              ) : isActionsPage ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-[10px] font-mono font-bold">
                  <span className="text-violet-700">{doneTasks}/{(tasks || []).length} tasks</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-700">{doneHabits}/{(habits || []).length} habits</span>
                </div>
              ) : location.pathname === '/settings' || location.pathname === '/categories' ? (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200/70 text-violet-700 text-[10px] font-black">
                  <Sparkles className="w-2.5 h-2.5 text-violet-600" />
                  <span>Settings</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200/70 text-violet-700 text-[10px] font-black">
                  <BarChart3 className="w-2.5 h-2.5 text-violet-600" />
                  <span>Insights</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Header Actions: User Profile Avatar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* User Profile Avatar (1-Tap opens Settings Modal) */}
            <button
              onClick={() => { sounds.playTap(); setSettingsOpen(true) }}
              className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-700 text-white font-black text-xs shadow-sm shadow-violet-600/25 flex items-center justify-center border border-white/40 ring-1 ring-slate-200 active:scale-90 transition-transform cursor-pointer"
              title="User Settings, Timezone & Telegram"
              aria-label="User Settings"
            >
              <span>{user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* Main page container */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F8FAFC]">
          <Routes>
            <Route path="/" element={<TimeHub onOpenFullscreenFocus={() => setFocusOpen(true)} />} />
            <Route path="/calendar" element={<TimeHub onOpenFullscreenFocus={() => setFocusOpen(true)} />} />
            <Route path="/schedule" element={<TimeHub onOpenFullscreenFocus={() => setFocusOpen(true)} />} />
            <Route path="/tracking" element={<TimeHub onOpenFullscreenFocus={() => setFocusOpen(true)} />} />
            <Route path="/ledger" element={<TimeHub onOpenFullscreenFocus={() => setFocusOpen(true)} />} />
            <Route path="/tasks" element={<TasksAndHabitsHub />} />
            <Route path="/habits" element={<TasksAndHabitsHub />} />
            <Route path="/plans" element={<TasksAndHabitsHub />} />
            <Route path="/habits/:id" element={<HabitDetailPage />} />
            <Route path="/settings" element={<SettingsHub />} />
            <Route path="/categories" element={<SettingsHub />} />
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
