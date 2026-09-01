import React from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { Calendar, Clock } from 'lucide-react'
import { TimeBlockingSchedule } from './TimeBlockingSchedule'
import { LiveTrackingHub } from './LiveTrackingHub'
import { useScheduleStore } from '../store/useScheduleStore'
import { useTimerStore } from '../store/useTimerStore'
import { sounds } from '../utils/soundEffects'

interface Props {
  onOpenFullscreenFocus?: () => void
}

export const TimeHub: React.FC<Props> = ({ onOpenFullscreenFocus }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()

  const { slots } = useScheduleStore()
  const { activeTracks } = useTimerStore()

  // Read tab parameter from URL query param (?tab=schedule vs ?tab=tracking) or pathname (/tracking)
  const queryTab = searchParams.get('tab')
  const defaultTab = location.pathname.startsWith('/tracking') ? 'tracking' : 'schedule'
  const activeTab = (queryTab === 'tracking' || queryTab === 'schedule') ? queryTab : defaultTab

  const handleTabChange = (newTab: 'schedule' | 'tracking') => {
    sounds.playTap()
    setSearchParams({ tab: newTab }, { replace: true })
  }

  const activeSlotsCount = (slots || []).filter(s => !s?.is_done).length
  const activeTracksCount = (activeTracks || []).length

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F8FAFC]">
      {/* ── Main Content Container (Schedule vs Live Tracking) ── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-3 pt-2 md:px-8 md:pt-3">
        <div className="max-w-lg md:max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0 overflow-hidden">
          {activeTab === 'schedule' ? (
            <TimeBlockingSchedule />
          ) : (
            <LiveTrackingHub onOpenFullscreenFocus={onOpenFullscreenFocus} />
          )}
        </div>
      </div>

      {/* ── Bottom Docked Segmented Switcher (One-Hand Thumb Reachable) ── */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-1.5 z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <div className="max-w-xs sm:max-w-sm mx-auto">
          <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60 shadow-2xs gap-1">
            {/* Tab 1: Schedule (Plan) */}
            <button
              onClick={() => handleTabChange('schedule')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                activeTab === 'schedule'
                  ? 'bg-white text-violet-700 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${activeTab === 'schedule' ? 'text-violet-600' : 'text-slate-400'}`} />
              <span>Schedule</span>
              {activeSlotsCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                  activeTab === 'schedule' ? 'bg-violet-100 text-violet-800' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {activeSlotsCount}
                </span>
              )}
            </button>

            {/* Tab 2: Tracking (Actual) */}
            <button
              onClick={() => handleTabChange('tracking')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                activeTab === 'tracking'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {activeTracksCount > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${activeTracksCount > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              </span>
              <span>Tracking</span>
              {activeTracksCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                  activeTab === 'tracking' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {activeTracksCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default TimeHub
