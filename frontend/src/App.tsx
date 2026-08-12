import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <Router>
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 ml-64 p-8 min-h-screen">
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
