import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Clock, CheckSquare, BarChart3, Settings, Plus } from 'lucide-react'
import { sounds } from '../utils/soundEffects'

interface Props {
  onFabTap: () => void
}

const tabs = [
  { path: '/', icon: Clock, label: 'Time', matchPaths: ['/', '/calendar', '/schedule', '/tracking'] },
  { path: '/tasks', icon: CheckSquare, label: 'Actions', matchPaths: ['/tasks', '/habits', '/plans'] },
  { path: '__fab__', icon: Plus, label: 'Create', matchPaths: [] },
  { path: '/analytics', icon: BarChart3, label: 'Analytics', matchPaths: ['/analytics'] },
  { path: '/settings', icon: Settings, label: 'Settings', matchPaths: ['/settings', '/categories'] },
]

export const BottomNav: React.FC<Props> = ({ onFabTap }) => {
  const { pathname } = useLocation()

  return (
    <nav className="md:hidden shrink-0 flex items-center justify-around px-2 pb-[calc(8px+var(--safe-bottom))] pt-1.5 bg-white border-t border-slate-200 z-20">
      {tabs.map((tab) => {
        if (tab.path === '__fab__') {
          return (
            <button
              key="fab"
              onClick={() => { sounds.playTap(); onFabTap() }}
              className="flex flex-col items-center justify-center w-14 py-1 active:scale-90 transition-transform"
              aria-label="Quick Create"
            >
              <div className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 flex items-center justify-center shadow-md shadow-violet-600/25">
                <Plus className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
            </button>
          )
        }

        const Icon = tab.icon
        const isActive = tab.path === '/'
          ? (pathname === '/' || pathname.startsWith('/calendar') || pathname.startsWith('/schedule') || pathname.startsWith('/tracking'))
          : tab.matchPaths.some(p => pathname.startsWith(p))

        return (
          <Link
            key={tab.path}
            to={tab.path}
            onClick={() => sounds.playTap()}
            className="relative flex flex-col items-center justify-center w-14 py-1 active:scale-90 transition-transform"
          >
            <Icon
              className={`w-5 h-5 transition-colors ${isActive ? 'text-violet-600' : 'text-slate-400'}`}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <span className={`text-[10px] mt-0.5 font-bold transition-colors ${isActive ? 'text-violet-700' : 'text-slate-400'}`}>
              {tab.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-violet-600" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
export default BottomNav
