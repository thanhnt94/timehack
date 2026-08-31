import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  CalendarDays, 
  CheckSquare, 
  Zap, 
  BarChart3,
  Plus
} from 'lucide-react'
import { sounds } from '../utils/soundEffects'

interface BottomNavProps {
  onOpenQuickAction?: () => void
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenQuickAction }) => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Hôm nay', icon: CalendarDays, activeColor: 'text-cyan-400', glow: 'from-cyan-500/20 to-blue-500/20' },
    { path: '/tasks', label: 'Nhiệm vụ', icon: CheckSquare, activeColor: 'text-violet-400', glow: 'from-violet-500/20 to-indigo-500/20' },
    { isAction: true },
    { path: '/habits', label: 'Thói quen', icon: Zap, activeColor: 'text-emerald-400', glow: 'from-emerald-500/20 to-teal-500/20' },
    { path: '/analytics', label: 'Thống kê', icon: BarChart3, activeColor: 'text-indigo-400', glow: 'from-indigo-500/20 to-purple-500/20' }
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1 pointer-events-none">
      <nav className="pointer-events-auto max-w-md mx-auto bg-[#0C1222]/90 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/80 rounded-3xl p-1.5 flex items-center justify-around">
        {navItems.map((item, idx) => {
          if (item.isAction) {
            return (
              <button
                key="action-center-btn"
                onClick={() => {
                  sounds.playTap()
                  onOpenQuickAction?.()
                }}
                className="relative -top-2 flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-violet-600/40 active:scale-90 transition-transform"
                title="Tạo nhanh"
                aria-label="Tạo nhanh"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            )
          }

          const Icon = item.icon!
          const isActive = location.pathname === item.path

          return (
            <Link
              key={item.path}
              to={item.path!}
              onClick={() => sounds.playTap()}
              className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all active:scale-90"
            >
              {isActive && (
                <motion.div
                  layoutId="timehackBottomNavPill"
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${item.glow} border border-white/10`}
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
                />
              )}

              <Icon
                className={`w-5 h-5 transition-all duration-200 relative z-10 ${
                  isActive ? `${item.activeColor} scale-110` : 'text-slate-400 hover:text-slate-200'
                }`}
              />
              <span
                className={`text-[9px] font-bold mt-1 transition-colors relative z-10 ${
                  isActive ? 'text-white font-extrabold' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
