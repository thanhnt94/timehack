import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { Sparkles, BarChart3 } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { BottomNav } from './components/BottomNav'
import { FloatingTimerBar } from './components/FloatingTimerBar'
import { QuickActionSheet } from './components/QuickActionSheet'
import { UserSettingsModal } from './components/UserSettingsModal'
import { TodayPlanner } from './pages/TodayPlanner'
import { TasksBoard } from './pages/TasksBoard'
import { HabitMatrix } from './pages/HabitMatrix'
import { HabitDetailPage } from './pages/HabitDetailPage'
import { TimeBlockingSchedule } from './pages/TimeBlockingSchedule'
import { PomodoroFocus } from './pages/PomodoroFocus'
import { ProductivityAnalytics } from './pages/ProductivityAnalytics'
import { LandingPage } from './pages/LandingPage'
import { Admin } from './pages/Admin'
import { useAuthStore } from './store/useAuthStore'
import { useTimerStore } from './store/useTimerStore'
import { useTaskStore } from './store/useTaskStore'
import { useHabitStore } from './store/useHabitStore'
import { sounds } from './utils/soundEffects'

/* ── Inner app with router context ────── */
const AppShell: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { isRunning } = useTimerStore()
  const { tasks } = useTaskStore()
  const { habits } = useHabitStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [focusOpen, setFocusOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const location = useLocation()

  const doneTasks = tasks.filter(t => t.status === 'completed').length
  const doneHabits = habits.filter(h => !!h.today_completed).length

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-[#F8FAFC] text-slate-900 overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar user={user} onLogout={logout} onOpenSettings={() => setSettingsOpen(true)} />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-h-0 md:ml-60">
        {/* Mobile top bar */}
        <header className="md:hidden shrink-0 flex items-center justify-between px-4 h-13 bg-white border-b border-slate-200 z-20">
          {/* Dynamic Title / Counter on Top Bar */}
          {location.pathname === '/tasks' ? (
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-900 tracking-tight">Tasks</span>
              <span className="text-xs font-black font-mono text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-200">
                {doneTasks}/{tasks.length} done
              </span>
            </div>
          ) : location.pathname === '/habits' ? (
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-900 tracking-tight">Habits</span>
              <span className="text-xs font-black font-mono text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-200">
                {doneHabits}/{habits.length} done
              </span>
            </div>
          ) : location.pathname === '/calendar' || location.pathname === '/schedule' ? (
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-900 tracking-tight">Calendar</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                Plan & Logs
              </span>
            </div>
          ) : location.pathname === '/analytics' ? (
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-900 tracking-tight">Analytics</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-black text-sm tracking-wider font-mono text-slate-900">
                TIME<span className="text-violet-600">HACK</span>
              </span>
            </div>
          )}

          {/* Right Header Actions: Analytics & User Profile Avatar */}
          <div className="flex items-center gap-2">
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
            <Route path="/" element={<div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6"><div className="max-w-lg md:max-w-5xl mx-auto"><TodayPlanner onOpenFocus={() => setFocusOpen(true)} /></div></div>} />
            <Route path="/tasks" element={<TasksBoard />} />
            <Route path="/habits" element={<HabitMatrix />} />
            <Route path="/habits/:id" element={<HabitDetailPage />} />
            <Route path="/calendar" element={<div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6"><div className="max-w-lg md:max-w-5xl mx-auto"><TimeBlockingSchedule /></div></div>} />
            <Route path="/schedule" element={<div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6"><div className="max-w-lg md:max-w-5xl mx-auto"><TimeBlockingSchedule /></div></div>} />
            <Route path="/analytics" element={<div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6"><div className="max-w-lg md:max-w-5xl mx-auto"><ProductivityAnalytics /></div></div>} />
            <Route path="/admin" element={<div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6"><div className="max-w-lg md:max-w-5xl mx-auto"><Admin /></div></div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Floating timer pill (above bottom nav) */}
        {isRunning && !focusOpen && (
          <FloatingTimerBar onTap={() => setFocusOpen(true)} />
        )}

        {/* Mobile bottom nav */}
        <BottomNav onFabTap={() => setSheetOpen(true)} />
      </div>

      {/* Quick action sheet */}
      <QuickActionSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onStartFocus={() => { setSheetOpen(false); setFocusOpen(true) }}
      />

      {/* User Settings & Timezone & Telegram modal */}
      <UserSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Focus overlay */}
      {focusOpen && (
        <PomodoroFocus onClose={() => setFocusOpen(false)} />
      )}
    </div>
  )
}

/* ── Root ──────────────────────────────── */
export const App: React.FC = () => {
  const { user, isLoading, fetchUser } = useAuthStore()

  useEffect(() => { fetchUser() }, [])

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#F8FAFC] gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-600/20 anim-pulse-ring">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs font-bold text-slate-500 font-mono tracking-widest uppercase">Loading...</span>
      </div>
    )
  }

  if (!user) return <LandingPage />

  return (
    <Router>
      <AppShell />
    </Router>
  )
}

export default App
