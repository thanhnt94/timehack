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
    <aside className="hidden md:flex w-60 shrink-0 h-[100dvh] flex-col bg-white border-r border-slate-200 fixed left-0 top-0 z-20">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-slate-200">
        <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="font-black text-sm tracking-wider font-mono text-slate-900">
          TIME<span className="text-violet-600">HACK</span>
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {links.map(link => {
          const Icon = link.icon
          const active = pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => sounds.playTap()}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                active
                  ? 'bg-violet-50 text-violet-700 border border-violet-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
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
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition mt-4 ${
              pathname === '/admin'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Admin</span>
          </Link>
        )}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-3 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <span className="text-xs font-semibold text-slate-800 truncate">{user?.username}</span>
          </div>
          <button
            onClick={() => { sounds.playTap(); onLogout() }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-90"
            title="Đăng xuất"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
