import React from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { CheckSquare, Zap } from 'lucide-react'
import { TasksBoard } from './TasksBoard'
import { HabitMatrix } from './HabitMatrix'
import { useTaskStore } from '../store/useTaskStore'
import { useHabitStore } from '../store/useHabitStore'
import { sounds } from '../utils/soundEffects'

export const TasksAndHabitsHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  
  const { tasks } = useTaskStore()
  const { habits } = useHabitStore()

  // Read tab parameter from URL query param (?tab=tasks vs ?tab=habits) or pathname (/habits)
  const queryTab = searchParams.get('tab')
  const defaultTab = location.pathname.startsWith('/habits') ? 'habits' : 'tasks'
  const activeTab = (queryTab === 'habits' || queryTab === 'tasks') ? queryTab : defaultTab

  const handleTabChange = (newTab: 'tasks' | 'habits') => {
    sounds.playTap()
    setSearchParams({ tab: newTab }, { replace: true })
  }

  const pendingTasks = (tasks || []).filter(t => t?.status !== 'completed').length
  const dueHabits = (habits || []).filter(h => !h?.today_completed).length

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F8FAFC]">
      {/* ── Top Unified Segmented Switcher (Tasks vs Habits) ── */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2 z-20 shadow-2xs">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60 shadow-2xs gap-1">
            {/* Tab 1: Tasks */}
            <button
              onClick={() => handleTabChange('tasks')}
              className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                activeTab === 'tasks'
                  ? 'bg-white text-violet-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <CheckSquare className={`w-3.5 h-3.5 ${activeTab === 'tasks' ? 'text-violet-600' : 'text-slate-400'}`} />
              <span>Nhiệm vụ</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                activeTab === 'tasks' ? 'bg-violet-100 text-violet-800' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {pendingTasks}
              </span>
            </button>

            {/* Tab 2: Habits */}
            <button
              onClick={() => handleTabChange('habits')}
              className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                activeTab === 'habits'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${activeTab === 'habits' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Thói quen</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                activeTab === 'habits' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {dueHabits}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab Content Container ── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'tasks' ? <TasksBoard /> : <HabitMatrix />}
      </div>
    </div>
  )
}
