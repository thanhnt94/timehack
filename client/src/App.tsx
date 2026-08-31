import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Sparkles, LogOut, ShieldAlert, Flame } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { BottomNav } from './components/BottomNav'
import { FloatingTimerBar } from './components/FloatingTimerBar'
import { TodayPlanner } from './pages/TodayPlanner'
import { TasksBoard } from './pages/TasksBoard'
import { HabitMatrix } from './pages/HabitMatrix'
import { TimeBlockingSchedule } from './pages/TimeBlockingSchedule'
import { PomodoroFocus } from './pages/PomodoroFocus'
import { ProductivityAnalytics } from './pages/ProductivityAnalytics'
import { LandingPage } from './pages/LandingPage'
import { Admin } from './pages/Admin'
import { useAuthStore } from './store/useAuthStore'

export const App: React.FC = () => {
  const { user, isLoading, fetchUser, logout } = useAuthStore()

  useEffect(() => {
    fetchUser()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070A13] flex flex-col items-center justify-center text-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-violet-500/30 animate-bounce mb-4">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="text-sm font-bold tracking-wider font-mono uppercase text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
          TIMEHACK LOADING...
        </div>
      </div>
    )
  }

  // If user is not logged in, render the Mobile-First Landing & Login Gateway
  if (!user) {
    return <LandingPage />
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#070A13] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-violet-500 selection:text-white">
        {/* Desktop Navigation Sidebar */}
        <Sidebar />

        {/* Mobile Header Bar */}
        <header className="md:hidden sticky top-0 z-30 bg-[#0F172A]/90 backdrop-blur-2xl border-b border-white/[0.08] px-3.5 py-2.5 flex items-center justify-between shadow-lg shadow-black/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <span className="font-black text-sm text-white tracking-wider font-mono uppercase leading-none">
                TIME<span className="text-cyan-400">HACK</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition"
              >
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                <span>Admin</span>
              </Link>
            )}

            <div className="flex items-center gap-1.5 px-2 py-1 glass-card rounded-xl border border-white/[0.08]">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[9px] font-black text-white">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <span className="text-[11px] font-bold text-slate-200 truncate max-w-[80px]">
                {user?.username || 'User'}
              </span>
            </div>

            <button
              onClick={() => logout()}
              title="Đăng xuất"
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 ml-0 md:ml-64 p-3.5 md:p-8 pb-24 md:pb-8 min-h-screen">
          <div className="max-w-md mx-auto md:max-w-7xl space-y-4 md:space-y-6">
            <Routes>
              <Route path="/" element={<TodayPlanner />} />
              <Route path="/tasks" element={<TasksBoard />} />
              <Route path="/habits" element={<HabitMatrix />} />
              <Route path="/schedule" element={<TimeBlockingSchedule />} />
              <Route path="/focus" element={<PomodoroFocus />} />
              <Route path="/analytics" element={<ProductivityAnalytics />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav />

        {/* Global Floating Focus Timer Bar */}
        <FloatingTimerBar />
      </div>
    </Router>
  )
}

export default App

