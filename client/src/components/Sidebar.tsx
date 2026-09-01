import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Sparkles, Home, CheckSquare, Zap, Calendar, BarChart3,
  FolderTree, LogOut, ShieldAlert, Settings
} from 'lucide-react'
import { sounds } from '../utils/soundEffects'

interface Props {
  user: any
  onLogout: () => void
  onOpenSettings?: () => void
}

const links = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/habits', icon: Zap, label: 'Habits' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/categories', icon: FolderTree, label: 'Categories' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
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
            ? pathname === '/'
            : link.path === '/calendar'
            ? (pathname.startsWith('/calendar') || pathname.startsWith('/schedule'))
            : pathname.startsWith(link.path)
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

        {/* Settings button */}
        {onOpenSettings && (
          <button
            onClick={() => { sounds.playTap(); onOpenSettings() }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-violet-700 hover:bg-violet-50/60 border border-transparent transition"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Settings</span>
          </button>
        )}

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

      {/* User profile + trigger */}
      <div className="px-3 py-3 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between px-2">
          <button
            onClick={() => { sounds.playTap(); onOpenSettings?.() }}
            className="flex items-center gap-2 min-w-0 text-left hover:opacity-80 transition"
            title="User Settings"
          >
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">{user?.username}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">{user?.timezone || 'UTC+7'}</div>
            </div>
          </button>
          <button
            onClick={() => { sounds.playTap(); onLogout() }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-90"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
