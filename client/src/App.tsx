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
import { TimeBlockingSchedule } from './pages/TimeBlockingSchedule'
import { PomodoroFocus } from './pages/PomodoroFocus'
import { ProductivityAnalytics } from './pages/ProductivityAnalytics'
import { LandingPage } from './pages/LandingPage'
import { Admin } from './pages/Admin'
import { useAuthStore } from './store/useAuthStore'
import { useTimerStore } from './store/useTimerStore'
import { sounds } from './utils/soundEffects'

/* ── Inner app with router context ────── */
const AppShell: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { isRunning } = useTimerStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [focusOpen, setFocusOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-[#F8FAFC] text-slate-900 overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar user={user} onLogout={logout} onOpenSettings={() => setSettingsOpen(true)} />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-h-0 md:ml-60">
        {/* Mobile top bar */}
        <header className="md:hidden shrink-0 flex items-center justify-between px-4 h-13 bg-white border-b border-slate-200 z-20">
          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-sm tracking-wider font-mono text-slate-900">
              TIME<span className="text-violet-600">HACK</span>
            </span>
          </div>

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
              title="Thống kê"
            >
              <BarChart3 className="w-4 h-4" />
            </Link>

            {/* User Profile Avatar (1-Tap opens Settings Modal) */}
            <button
              onClick={() => { sounds.playTap(); setSettingsOpen(true) }}
              className="relative flex items-center justify-center w-8 h-8 rounded-full bg-violet-600 text-white font-black text-xs shadow-xs hover:ring-2 hover:ring-violet-400 active:scale-90 transition-transform"
              title="Cài đặt tài khoản & Múi giờ, Telegram"
              aria-label="Cài đặt người dùng"
            >
              <span>{user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}</span>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC]">
          <div className="max-w-lg mx-auto px-4 py-4 md:max-w-5xl md:px-8 md:py-6">
            <Routes>
              <Route path="/" element={<TodayPlanner onOpenFocus={() => setFocusOpen(true)} />} />
              <Route path="/tasks" element={<TasksBoard />} />
              <Route path="/habits" element={<HabitMatrix />} />
              <Route path="/calendar" element={<TimeBlockingSchedule />} />
              <Route path="/schedule" element={<TimeBlockingSchedule />} />
              <Route path="/analytics" element={<ProductivityAnalytics />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
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
