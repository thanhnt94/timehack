import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { BottomNav } from './components/BottomNav'
import { FloatingTimerBar } from './components/FloatingTimerBar'
import { TodayPlanner } from './pages/TodayPlanner'
import { TasksBoard } from './pages/TasksBoard'
import { HabitMatrix } from './pages/HabitMatrix'
import { TimeBlockingSchedule } from './pages/TimeBlockingSchedule'
import { PomodoroFocus } from './pages/PomodoroFocus'
import { ProductivityAnalytics } from './pages/ProductivityAnalytics'
import { useAuthStore } from './store/useAuthStore'

export const App: React.FC = () => {
  const { user, fetchUser } = useAuthStore()

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <Router>
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col md:flex-row">
        {/* Desktop Navigation Sidebar */}
        <Sidebar />

        {/* Mobile Header Bar */}
        <header className="md:hidden sticky top-0 z-30 bg-[#0F172A]/90 backdrop-blur-2xl border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-black text-sm text-white tracking-wider font-mono uppercase">
                TIME<span className="text-cyan-400">HACK</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 glass-card rounded-xl border border-slate-800">
            <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-[10px] font-bold text-violet-300">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <span className="text-xs font-bold text-slate-200 truncate max-w-[90px]">
              {user?.username || 'Guest'}
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-6">
            <Routes>
              <Route path="/" element={<TodayPlanner />} />
              <Route path="/tasks" element={<TasksBoard />} />
              <Route path="/habits" element={<HabitMatrix />} />
              <Route path="/schedule" element={<TimeBlockingSchedule />} />
              <Route path="/focus" element={<PomodoroFocus />} />
              <Route path="/analytics" element={<ProductivityAnalytics />} />
            </Routes>
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar (RemiNote / Vocaburn App-Like Style) */}
        <BottomNav />

        {/* Global Floating Focus Timer Bar */}
        <FloatingTimerBar />
      </div>
    </Router>
  )
}

export default App
