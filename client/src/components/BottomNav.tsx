import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, CheckSquare, Zap, BarChart3, Plus } from 'lucide-react'
import { sounds } from '../utils/soundEffects'

interface Props {
  onFabTap: () => void
}

const tabs = [
  { path: '/', icon: CalendarDays, label: 'Hôm nay', color: 'text-cyan-400' },
  { path: '/tasks', icon: CheckSquare, label: 'Nhiệm vụ', color: 'text-violet-400' },
  { path: '__fab__', icon: Plus, label: '', color: '' },
  { path: '/habits', icon: Zap, label: 'Thói quen', color: 'text-emerald-400' },
  { path: '/analytics', icon: BarChart3, label: 'Thống kê', color: 'text-amber-400' },
]

export const BottomNav: React.FC<Props> = ({ onFabTap }) => {
  const { pathname } = useLocation()

  return (
    <nav className="md:hidden shrink-0 flex items-end justify-around px-2 pb-[calc(6px+var(--safe-bottom))] pt-1 bg-[var(--surface-base)]/95 backdrop-blur-xl border-t border-[var(--border-subtle)] z-20">
      {tabs.map((tab) => {
        if (tab.path === '__fab__') {
          return (
            <button
              key="fab"
              onClick={() => { sounds.playTap(); onFabTap() }}
              className="relative -top-3 w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-600/30 active:scale-90 transition-transform"
              aria-label="Tạo nhanh"
            >
              <Plus className="w-6 h-6 text-white stroke-[2.5]" />
            </button>
          )
        }

        const Icon = tab.icon
        const isActive = pathname === tab.path

        return (
          <Link
            key={tab.path}
            to={tab.path}
            onClick={() => sounds.playTap()}
            className="relative flex flex-col items-center justify-center w-14 py-1.5 active:scale-90 transition-transform"
          >
            <Icon
              className={`w-5 h-5 transition-colors ${isActive ? tab.color : 'text-slate-500'}`}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <span className={`text-[9px] mt-0.5 font-semibold transition-colors ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
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
