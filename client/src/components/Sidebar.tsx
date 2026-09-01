import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Sparkles, Calendar, Clock, CheckSquare, BarChart3,
  FolderTree, LogOut, ShieldAlert, Settings
} from 'lucide-react'
import { sounds } from '../utils/soundEffects'

interface Props {
  user: any
  onLogout: () => void
  onOpenSettings?: () => void
}

const links = [
  { path: '/', icon: Calendar, label: 'Lịch biểu', matchPaths: ['/', '/calendar', '/schedule'] },
  { path: '/tracking', icon: Clock, label: 'Live Tracking', matchPaths: ['/tracking'] },
  { path: '/tasks', icon: CheckSquare, label: 'Việc & Thói quen', matchPaths: ['/tasks', '/habits'] },
  { path: '/categories', icon: FolderTree, label: 'Thư mục & Dự án', matchPaths: ['/categories'] },
  { path: '/analytics', icon: BarChart3, label: 'Thống kê năng suất', matchPaths: ['/analytics'] },
]

export const Sidebar: React.FC<Props> = ({ user, onLogout, onOpenSettings }) => {
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
          const active = link.path === '/'
            ? (pathname === '/' || pathname.startsWith('/calendar') || pathname.startsWith('/schedule'))
            : (link.matchPaths ? link.matchPaths.some(p => pathname.startsWith(p)) : pathname.startsWith(link.path))
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => sounds.playTap()}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                active
                  ? 'bg-violet-50 text-violet-700 border border-violet-200 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          )
        })}

        {/* Admin Link if role is admin */}
        {user?.role === 'admin' && (
          <Link
            to="/admin"
            onClick={() => sounds.playTap()}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
              pathname.startsWith('/admin')
                ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 border border-transparent'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Admin Hub</span>
          </Link>
        )}
      </nav>

      {/* Footer Profile & Settings */}
      <div className="p-3 border-t border-slate-200 space-y-2">
        {onOpenSettings && (
          <button
            onClick={() => { sounds.playTap(); onOpenSettings() }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 border border-slate-200/80 transition"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-violet-600" />
              <span>Cài đặt & Telegram</span>
            </div>
          </button>
        )}

        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-bold text-slate-900 truncate">
              {user?.full_name || user?.username || 'User'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {user?.email || 'TimeHack Account'}
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
