import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Sparkles, Globe } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { BottomNav } from './components/BottomNav'
import { FloatingTimerBar } from './components/FloatingTimerBar'
import { QuickActionSheet } from './components/QuickActionSheet'
import { SettingsModal } from './components/SettingsModal'
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

  const tzShort = user?.timezone ? user.timezone.split('/').pop()?.replace('_', ' ') : 'UTC+7'

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-[#F8FAFC] text-slate-900 overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar user={user} onLogout={logout} onOpenSettings={() => setSettingsOpen(true)} />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-h-0 md:ml-60">
        {/* Mobile top bar */}
        <header className="md:hidden shrink-0 flex items-center justify-between px-4 h-13 bg-white border-b border-slate-200 z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-sm tracking-wider font-mono text-slate-900">
              TIME<span className="text-violet-600">HACK</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Timezone button */}
            <button
              onClick={() => { sounds.playTap(); setSettingsOpen(true) }}
              className="flex items-center gap-1 text-[11px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg border border-violet-200 active:scale-95 transition"
              title="Cài đặt múi giờ"
            >
              <Globe className="w-3 h-3 text-violet-600" />
              <span className="truncate max-w-[80px]">{tzShort}</span>
            </button>

            {/* Logout button */}
            <button
              onClick={() => logout()}
              className="text-[11px] font-bold text-slate-600 hover:text-rose-600 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 active:scale-95 transition"
            >
              Đăng xuất
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

      {/* Settings modal */}
      <SettingsModal
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
