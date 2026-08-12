import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Menu, Sparkles } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { FloatingTimerBar } from './components/FloatingTimerBar'
import { TodayPlanner } from './pages/TodayPlanner'
import { TasksBoard } from './pages/TasksBoard'
import { HabitMatrix } from './pages/HabitMatrix'
import { TimeBlockingSchedule } from './pages/TimeBlockingSchedule'
import { PomodoroFocus } from './pages/PomodoroFocus'
import { ProductivityAnalytics } from './pages/ProductivityAnalytics'
import { useAuthStore } from './store/useAuthStore'

export const App: React.FC = () => {
  const { fetchUser } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <Router>
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

        {/* Mobile Header Bar */}
        <div className="md:hidden sticky top-0 z-30 bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-sm text-white tracking-wider font-mono uppercase">
              TIME<span className="text-cyan-400">HACK</span>
            </span>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700/60"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 min-h-screen">
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

        {/* Global Floating Focus Timer Bar */}
        <FloatingTimerBar />
      </div>
    </Router>
  )
}

export default App
