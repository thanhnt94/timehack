import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Sparkles, CalendarDays, CheckSquare, Zap, BarChart3,
  Clock, LogOut, ShieldAlert
} from 'lucide-react'
import { sounds } from '../utils/soundEffects'

interface Props {
  user: any
  onLogout: () => void
}

const links = [
  { path: '/', icon: CalendarDays, label: 'Hôm Nay' },
  { path: '/tasks', icon: CheckSquare, label: 'Nhiệm Vụ' },
  { path: '/habits', icon: Zap, label: 'Thói Quen' },
  { path: '/schedule', icon: Clock, label: 'Lịch Trình' },
  { path: '/analytics', icon: BarChart3, label: 'Thống Kê' },
]

export const Sidebar: React.FC<Props> = ({ user, onLogout }) => {
  const { pathname } = useLocation()

  return (
    <aside className="hidden md:flex w-60 shrink-0 h-[100dvh] flex-col bg-[#080C18] border-r border-[var(--border-subtle)] fixed left-0 top-0 z-20">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-[var(--border-subtle)]">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="font-black text-sm tracking-wider font-mono">
          TIME<span className="text-cyan-400">HACK</span>
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {links.map(link => {
          const Icon = link.icon
          const active = pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => sounds.playTap()}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                active
                  ? 'bg-violet-600/15 text-violet-300 border border-violet-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          )
        })}

        {user?.role === 'admin' && (
          <Link
            to="/admin"
            onClick={() => sounds.playTap()}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors mt-4 ${
              pathname === '/admin'
                ? 'bg-rose-600/15 text-rose-300 border border-rose-500/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Admin</span>
          </Link>
        )}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <span className="text-xs font-semibold text-slate-300 truncate">{user?.username}</span>
          </div>
          <button
            onClick={() => { sounds.playTap(); onLogout() }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition active:scale-90"
            title="Đăng xuất"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
