import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { 
  Sparkles, 
  LogOut, 
  ShieldAlert, 
  Plus, 
  Flame, 
  Zap, 
  Settings, 
  X, 
  Volume2, 
  VolumeX, 
  User as UserIcon,
  CheckCircle2
} from 'lucide-react'
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
import { sounds } from './utils/soundEffects'

export const App: React.FC = () => {
  const { user, isLoading, fetchUser, logout } = useAuthStore()
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050811] flex flex-col items-center justify-center text-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-violet-500/30 animate-bounce mb-4">
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
      <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-violet-500 selection:text-white">
        {/* Desktop Navigation Sidebar */}
        <Sidebar />

        {/* Mobile Native Header Bar */}
        <header className="md:hidden sticky top-0 z-30 bg-[#0A0E1A]/95 backdrop-blur-2xl border-b border-white/[0.06] px-4 py-2.5 flex items-center justify-between shadow-md shadow-black/40">
          {/* Left: Branding & Date */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-md shadow-violet-600/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-black text-sm text-white tracking-wide font-mono uppercase leading-none">
                TIME<span className="text-cyan-400">HACK</span>
              </div>
              <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
                Productivity App
              </div>
            </div>
          </div>

          {/* Right: Badges & Profile Trigger */}
          <div className="flex items-center gap-2">
            {/* Streak & XP Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-bold">
              <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
              <span className="text-rose-300 font-mono">Streak</span>
            </div>

            {/* Profile Avatar Button */}
            <button
              onClick={() => { sounds.playTap(); setIsProfileModalOpen(true); }}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 p-[1.5px] shadow-md shadow-violet-500/20 active:scale-90 transition-transform"
            >
              <div className="w-full h-full rounded-full bg-[#0F172A] flex items-center justify-center text-xs font-black text-white">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 ml-0 md:ml-64 p-3.5 md:p-8 pb-28 md:pb-8 min-h-screen">
          <div className="max-w-md mx-auto md:max-w-7xl space-y-4 md:space-y-6">
            <Routes>
              <Route path="/" element={<TodayPlanner onOpenCreate={() => setIsQuickActionOpen(true)} />} />
              <Route path="/tasks" element={<TasksBoard onOpenCreate={() => setIsQuickActionOpen(true)} />} />
              <Route path="/habits" element={<HabitMatrix onOpenCreate={() => setIsQuickActionOpen(true)} />} />
              <Route path="/schedule" element={<TimeBlockingSchedule />} />
              <Route path="/focus" element={<PomodoroFocus />} />
              <Route path="/analytics" element={<ProductivityAnalytics />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav onOpenQuickAction={() => setIsQuickActionOpen(true)} />

        {/* Global Floating Focus Timer Bar */}
        <FloatingTimerBar />

        {/* Global Quick Action Sheet Modal */}
        <QuickActionSheet
          isOpen={isQuickActionOpen}
          onClose={() => setIsQuickActionOpen(false)}
        />

        {/* Profile & Settings Native Bottom Sheet */}
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in select-none">
            <div className="w-full max-w-md bg-[#0C1222] border border-white/[0.1] rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl space-y-4 relative animate-in slide-in-from-bottom duration-200">
              <div className="w-10 h-1 rounded-full bg-slate-700 mx-auto -mt-2 mb-2 sm:hidden" />

              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-black text-white shadow-md">
                    {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">{user?.full_name || user?.username}</div>
                    <div className="text-[11px] text-slate-400 font-mono">@{user?.username} • {user?.role === 'admin' ? 'Quản Trị Viên' : 'Thành Viên'}</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Menu items */}
              <div className="space-y-2">
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 flex items-center justify-between transition active:scale-95"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Trang Quản Trị Hệ Thống (Admin)</div>
                        <div className="text-[10px] text-rose-300">Cấu hình SSO & quản lý thành viên</div>
                      </div>
                    </div>
                  </Link>
                )}

                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Hiệu ứng âm thanh xúc giác</div>
                      <div className="text-[10px] text-slate-400">Web Audio Tap & Chimes</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(prev => !prev)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      soundEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {soundEnabled ? 'Bật' : 'Tắt'}
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Đồng bộ đám mây Ecosystem</div>
                      <div className="text-[10px] text-slate-400">CentralAuth SSO Connected</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400">Online</span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  sounds.playTap()
                  setIsProfileModalOpen(false)
                  logout()
                }}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 mt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng Xuất Tài Khoản</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Router>
  )
}

export default App
