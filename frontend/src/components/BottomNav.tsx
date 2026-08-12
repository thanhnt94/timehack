import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  CalendarDays, 
  CheckSquare, 
  Zap, 
  Clock, 
  Timer, 
  BarChart3 
} from 'lucide-react'

export const BottomNav: React.FC = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Hôm nay', icon: CalendarDays, color: 'from-cyan-500 to-blue-500' },
    { path: '/tasks', label: 'Công việc', icon: CheckSquare, color: 'from-violet-500 to-indigo-500' },
    { path: '/habits', label: 'Thói quen', icon: Zap, color: 'from-emerald-500 to-teal-500' },
    { path: '/schedule', label: 'Lịch trình', icon: Clock, color: 'from-amber-500 to-orange-500' },
    { path: '/focus', label: 'Tập trung', icon: Timer, color: 'from-rose-500 to-pink-500' },
    { path: '/analytics', label: 'Thống kê', icon: BarChart3, color: 'from-indigo-500 to-purple-500' }
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A]/95 backdrop-blur-2xl border-t border-slate-800/80 px-2 py-2">
      <nav className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all min-w-[50px]"
            >
              {isActive && (
                <motion.div
                  layoutId="timehackBottomNavActive"
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-r opacity-25 ${item.color}`}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}

              <Icon
                className={`w-5 h-5 transition-all duration-300 relative z-10 ${
                  isActive ? 'text-white scale-110' : 'text-slate-400 hover:text-slate-200'
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
