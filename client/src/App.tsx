import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { BottomNav } from './components/BottomNav'
import { FloatingTimerBar } from './components/FloatingTimerBar'
import { QuickActionSheet } from './components/QuickActionSheet'
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

/* ── Inner app with router context ────── */
const AppShell: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { isRunning } = useTimerStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [focusOpen, setFocusOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-[var(--surface-base)] text-[var(--text-primary)] overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar user={user} onLogout={logout} />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-h-0 md:ml-60">
        {/* Mobile top bar */}
        <header className="md:hidden shrink-0 flex items-center justify-between px-4 h-12 bg-[var(--surface-base)]/95 backdrop-blur-xl border-b border-[var(--border-subtle)] z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-sm tracking-wider font-mono">
              TIME<span className="text-cyan-400">HACK</span>
            </span>
          </div>

          <button
            onClick={() => logout()}
            className="text-[10px] font-bold text-slate-400 px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] active:scale-95 transition"
          >
            Đăng xuất
          </button>
        </header>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
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
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[var(--surface-base)] gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center anim-pulse-ring">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs font-bold text-slate-400 font-mono tracking-widest uppercase">Loading...</span>
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
