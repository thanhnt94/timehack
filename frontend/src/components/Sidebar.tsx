import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  CalendarDays, 
  CheckSquare, 
  Zap, 
  Clock, 
  BarChart3, 
  Timer, 
  Sparkles,
  UserCheck,
  X
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

interface SidebarProps {
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user } = useAuthStore()

  const navItems = [
    { to: '/', label: 'Hôm Nay', icon: CalendarDays, color: 'text-cyan-400' },
    { to: '/tasks', label: 'Công Việc', icon: CheckSquare, color: 'text-violet-400' },
    { to: '/habits', label: 'Thói Quen', icon: Zap, color: 'text-emerald-400' },
    { to: '/schedule', label: 'Thời Gian Biểu', icon: Clock, color: 'text-amber-400' },
    { to: '/focus', label: 'Tập Trung Pomodoro', icon: Timer, color: 'text-rose-400' },
    { to: '/analytics', label: 'Thống Kê Năng Suất', icon: BarChart3, color: 'text-indigo-400' }
  ]

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`w-64 h-screen fixed left-0 top-0 bg-[#0F172A]/95 backdrop-blur-2xl border-r border-slate-800 flex flex-col justify-between z-50 select-none transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* App Header / Brand */}
        <div>
          <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="font-black text-base text-white tracking-wider uppercase font-mono">
                  TIME<span className="text-cyan-400">HACK</span>
                </h1>
                <p className="text-[9px] font-semibold text-slate-400 tracking-tight">Productivity All-In-One</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button 
              onClick={onCloseMobile}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600/30 to-cyan-600/20 text-white border border-violet-500/40 shadow-lg shadow-violet-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="p-3 glass-card rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-xs font-bold text-violet-300 shrink-0">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-200 truncate">{user?.full_name || user?.username || 'Thành viên'}</div>
                <div className="text-[9px] text-slate-400 flex items-center gap-1">
                  <UserCheck className="w-2.5 h-2.5 text-emerald-400" />
                  <span>CentralAuth Logged</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
