import React from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { CheckSquare, Zap, Calendar } from 'lucide-react'
import { TasksBoard } from './TasksBoard'
import { HabitMatrix } from './HabitMatrix'
import { DayPlanSimplified } from './DayPlanSimplified'
import { useTaskStore } from '../store/useTaskStore'
import { useHabitStore } from '../store/useHabitStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { sounds } from '../utils/soundEffects'

export const TasksAndHabitsHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  
  const { tasks } = useTaskStore()
  const { habits } = useHabitStore()
  const { slots } = useScheduleStore()

  // Read tab parameter from URL query param (?tab=tasks vs ?tab=habits vs ?tab=plan)
  const queryTab = searchParams.get('tab')
  const defaultTab = location.pathname.startsWith('/habits')
    ? 'habits'
    : location.pathname.startsWith('/plans')
    ? 'plan'
    : 'tasks'
  const activeTab = (queryTab === 'habits' || queryTab === 'tasks' || queryTab === 'plan') ? queryTab : defaultTab

  const handleTabChange = (newTab: 'tasks' | 'habits' | 'plan') => {
    sounds.playTap()
    setSearchParams({ tab: newTab }, { replace: true })
  }

  const pendingTasks = (tasks || []).filter(t => t?.status !== 'completed').length
  const dueHabits = (habits || []).filter(h => !h?.today_completed).length
  const activePlanSlots = (slots || []).filter(s => !s?.is_done).length

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F8FAFC]">
      {/* ── Main Content Container ── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'tasks' ? (
          <TasksBoard />
        ) : activeTab === 'habits' ? (
          <HabitMatrix />
        ) : (
          <DayPlanSimplified />
        )}
      </div>

      {/* ── Bottom Docked Segmented Switcher (One-Hand Thumb Reachable) ── */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 sm:px-3 py-1.5 z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <div className="max-w-sm sm:max-w-md mx-auto">
          <div className="grid grid-cols-3 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60 shadow-2xs gap-1">
            {/* Tab 1: Tasks */}
            <button
              onClick={() => handleTabChange('tasks')}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                activeTab === 'tasks'
                  ? 'bg-white text-violet-700 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <CheckSquare className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'tasks' ? 'text-violet-600 stroke-[2.5]' : 'text-slate-400'}`} />
              <span className="truncate">Tasks</span>
              <span className={`text-[10px] px-1 py-0.2 rounded-md font-mono font-bold shrink-0 ${
                activeTab === 'tasks' ? 'bg-violet-100 text-violet-800' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {pendingTasks}
              </span>
            </button>

            {/* Tab 2: Habits */}
            <button
              onClick={() => handleTabChange('habits')}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                activeTab === 'habits'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'habits' ? 'text-emerald-600 fill-current' : 'text-slate-400'}`} />
              <span className="truncate">Habits</span>
              <span className={`text-[10px] px-1 py-0.2 rounded-md font-mono font-bold shrink-0 ${
                activeTab === 'habits' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {dueHabits}
              </span>
            </button>

            {/* Tab 3: Day Plan */}
            <button
              onClick={() => handleTabChange('plan')}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                activeTab === 'plan'
                  ? 'bg-white text-sky-700 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'plan' ? 'text-sky-600' : 'text-slate-400'}`} />
              <span className="truncate">Plan</span>
              {activePlanSlots > 0 && (
                <span className={`text-[10px] px-1 py-0.2 rounded-md font-mono font-bold shrink-0 ${
                  activeTab === 'plan' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {activePlanSlots}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default TasksAndHabitsHub
