import React, { useState } from 'react'
import { X, Globe, Check, Sparkles, ShieldCheck, Clock } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { sounds } from '../utils/soundEffects'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const COMMON_TIMEZONES = [
  { id: 'Asia/Ho_Chi_Minh', label: 'Việt Nam / TP.HCM', offset: 'UTC+7' },
  { id: 'Asia/Bangkok', label: 'Bangkok, Thái Lan', offset: 'UTC+7' },
  { id: 'Asia/Singapore', label: 'Singapore', offset: 'UTC+8' },
  { id: 'Asia/Tokyo', label: 'Tokyo, Nhật Bản', offset: 'UTC+9' },
  { id: 'Asia/Seoul', label: 'Seoul, Hàn Quốc', offset: 'UTC+9' },
  { id: 'UTC', label: 'Giờ Quốc Tế Chuẩn (UTC)', offset: 'UTC+0' },
  { id: 'Europe/London', label: 'London, Vương quốc Anh', offset: 'UTC+0' },
  { id: 'Europe/Paris', label: 'Paris, Pháp / Tây Âu', offset: 'UTC+1' },
  { id: 'America/New_York', label: 'New York / Bờ Đông Mỹ', offset: 'UTC-5' },
  { id: 'America/Los_Angeles', label: 'Los Angeles / Bờ Tây Mỹ', offset: 'UTC-8' },
  { id: 'Australia/Sydney', label: 'Sydney, Úc', offset: 'UTC+10' }
]

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, updateTimezone } = useAuthStore()
  const currentTimezone = user?.timezone || user?.settings?.timezone || 'Asia/Ho_Chi_Minh'
  const [selectedTz, setSelectedTz] = useState(currentTimezone)
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleSelectTz = async (tz: string) => {
    sounds.playTap()
    setSelectedTz(tz)
    setIsSaving(true)
    await updateTimezone(tz)
    sounds.playSuccess()
    setIsSaving(false)
  }

  const handleDetectDeviceTz = async () => {
    sounds.playTap()
    try {
      const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (deviceTz) {
        await handleSelectTz(deviceTz)
      }
    } catch {
      await handleSelectTz('Asia/Ho_Chi_Minh')
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="sheet-backdrop" onClick={onClose} />

      {/* Sheet / Modal Container */}
      <div className="sheet-content max-w-lg mx-auto">
        <div className="sheet-handle" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Cài Đặt Múi Giờ</h2>
              <p className="text-[11px] text-slate-500 font-medium">Đồng bộ chuẩn UTC+0 trong database</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 active:scale-90 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Timezone Banner */}
        <div className="bg-violet-50/80 border border-violet-200/80 rounded-2xl p-3.5 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock className="w-4 h-4 text-violet-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-violet-700 tracking-wider">Múi giờ hiện tại</div>
              <div className="text-xs font-black text-slate-900 truncate mt-0.5">{currentTimezone}</div>
            </div>
          </div>
          <button
            onClick={handleDetectDeviceTz}
            disabled={isSaving}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-violet-300 text-violet-700 text-[11px] font-bold shadow-xs hover:bg-violet-600 hover:text-white active:scale-95 transition shrink-0"
          >
            Tự phát hiện
          </button>
        </div>

        {/* Timezone List */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {COMMON_TIMEZONES.map((tz) => {
            const isSelected = currentTimezone === tz.id || selectedTz === tz.id
            return (
              <button
                key={tz.id}
                onClick={() => handleSelectTz(tz.id)}
                disabled={isSaving}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition active:scale-[0.99] ${
                  isSelected
                    ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-violet-300 hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0">
                  <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {tz.label}
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-violet-200' : 'text-slate-400'}`}>
                    {tz.id}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tz.offset}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* UTC Guarantee Info Box */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-slate-500 text-[11px] leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Toàn bộ mốc thời gian (nhật ký focus, hạn nhiệm vụ, lịch trình) lưu trên server luôn đồng bộ chuẩn <strong>UTC+0</strong>. Múi giờ này dùng để tính chuỗi streak và hiển thị ngày giờ chuẩn xác trên thiết bị của bạn.
          </span>
        </div>
      </div>
    </>
  )
}
