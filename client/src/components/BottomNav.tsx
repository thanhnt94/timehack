import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, CheckSquare, Zap, Calendar, Plus } from 'lucide-react'
import { sounds } from '../utils/soundEffects'

interface Props {
  onFabTap: () => void
}

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/tasks', icon: CheckSquare, label: 'Task' },
  { path: '__fab__', icon: Plus, label: '' },
  { path: '/habits', icon: Zap, label: 'Habit' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
]

export const BottomNav: React.FC<Props> = ({ onFabTap }) => {
  const { pathname } = useLocation()

  return (
    <nav className="md:hidden shrink-0 flex items-end justify-around px-2 pb-[calc(8px+var(--safe-bottom))] pt-2 bg-white border-t border-slate-200 z-20">
      {tabs.map((tab) => {
        if (tab.path === '__fab__') {
          return (
            <button
              key="fab"
              onClick={() => { sounds.playTap(); onFabTap() }}
              className="relative -top-3 w-12 h-12 rounded-2xl bg-violet-600 hover:bg-violet-700 flex items-center justify-center shadow-lg shadow-violet-600/30 active:scale-90 transition-transform"
              aria-label="Tạo mới nhanh"
            >
              <Plus className="w-6 h-6 text-white stroke-[2.5]" />
            </button>
          )
        }

        const Icon = tab.icon
        const isActive = pathname === tab.path || (tab.path === '/calendar' && pathname === '/schedule')

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
              <motion.div
                layoutId="bottomNavDot"
                className="tab-active-dot"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
