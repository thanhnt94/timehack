import React, { useState, useEffect } from 'react'
import {
  X, User, Globe, Send, Bell, Volume2, ShieldCheck, Check,
  Clock, LogOut, Sparkles, CheckCircle2, AlertCircle, ExternalLink,
  Smartphone, MessageSquare
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { sounds } from '../utils/soundEffects'
import axios from 'axios'

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

type SettingsTab = 'profile' | 'timezone' | 'telegram' | 'notifications'

export const UserSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, updateTimezone, updateSettings, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  // Timezone state
  const currentTimezone = user?.timezone || user?.settings?.timezone || 'Asia/Ho_Chi_Minh'
  const [selectedTz, setSelectedTz] = useState(currentTimezone)

  // Telegram state
  const [telegramChatId, setTelegramChatId] = useState(user?.settings?.telegram_chat_id || '')
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'saving' | 'saved' | 'testing' | 'test_success' | 'test_failed'>('idle')
  const [telegramMessage, setTelegramMessage] = useState('')

  // Notifications state
  const [notifyTask, setNotifyTask] = useState(user?.settings?.notify_task !== false)
  const [notifyHabit, setNotifyHabit] = useState(user?.settings?.notify_habit !== false)
  const [notifyDailyReport, setNotifyDailyReport] = useState(user?.settings?.notify_daily_report !== false)
  const [soundEnabled, setSoundEnabled] = useState(user?.settings?.sound_enabled !== false)

  useEffect(() => {
    if (user?.settings) {
      if (user.settings.telegram_chat_id !== undefined) setTelegramChatId(user.settings.telegram_chat_id)
      if (user.settings.notify_task !== undefined) setNotifyTask(user.settings.notify_task)
      if (user.settings.notify_habit !== undefined) setNotifyHabit(user.settings.notify_habit)
      if (user.settings.notify_daily_report !== undefined) setNotifyDailyReport(user.settings.notify_daily_report)
      if (user.settings.sound_enabled !== undefined) setSoundEnabled(user.settings.sound_enabled)
    }
    if (user?.timezone) {
      setSelectedTz(user.timezone)
    }
  }, [user])

  if (!isOpen) return null

  // 1. Timezone handlers
  const handleSelectTz = async (tz: string) => {
    sounds.playTap()
    setSelectedTz(tz)
    await updateTimezone(tz)
    sounds.playSuccess()
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

  // 2. Telegram handlers
  const handleSaveTelegram = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!telegramChatId.trim()) return
    sounds.playTap()
    setTelegramStatus('saving')
    try {
      await axios.post('/api/v1/notifications/telegram/link', {
        telegram_chat_id: telegramChatId.trim()
      })
      await updateSettings({ telegram_chat_id: telegramChatId.trim() })
      setTelegramStatus('saved')
      setTelegramMessage('Đã lưu Telegram Chat ID thành công!')
      sounds.playSuccess()
    } catch (err: any) {
      setTelegramStatus('idle')
      setTelegramMessage(err.response?.data?.detail || 'Lỗi khi lưu Chat ID')
    }
  }

  const handleTestTelegram = async () => {
    sounds.playTap()
    setTelegramStatus('testing')
    setTelegramMessage('Đang gửi tin nhắn thử nghiệm...')
    try {
      const res = await axios.post('/api/v1/notifications/telegram/test')
      if (res.data.status === 'ok' || res.data.sent) {
        setTelegramStatus('test_success')
        setTelegramMessage('Đã gửi tin nhắn thử nghiệm thành công! Hãy kiểm tra Telegram của bạn.')
        sounds.playSuccess()
      } else {
        setTelegramStatus('test_failed')
        setTelegramMessage('Không thể gửi tin nhắn. Hãy đảm bảo bạn đã bấm /start với Bot trước!')
      }
    } catch (err: any) {
      setTelegramStatus('test_failed')
      setTelegramMessage(err.response?.data?.detail || 'Lỗi gửi tin nhắn thử nghiệm')
    }
  }

  // 3. Notification toggle handler
  const handleToggleSetting = async (key: string, val: boolean, setter: (v: boolean) => void) => {
    sounds.playTap()
    setter(val)
    await updateSettings({ [key]: val })
  }

  return (
    <>
      {/* Backdrop */}
      <div className="sheet-backdrop" onClick={onClose} />

      {/* Sheet Content */}
      <div className="sheet-content max-w-lg mx-auto">
        <div className="sheet-handle" />

        {/* ── Top Header ─────────────────── */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-violet-600 text-white font-black text-sm flex items-center justify-center shadow-sm shadow-violet-600/20">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">{user?.full_name || user?.username}</h2>
              <p className="text-[11px] text-slate-500 font-medium">{user?.email || 'Tài khoản TimeHack'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 active:scale-90 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Navigation Tabs ────────────── */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/80 rounded-xl mb-4 text-[11px] font-bold">
          <button
            onClick={() => { sounds.playTap(); setActiveTab('profile') }}
            className={`py-1.5 rounded-lg transition ${
              activeTab === 'profile'
                ? 'bg-white text-violet-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hồ sơ
          </button>
          <button
            onClick={() => { sounds.playTap(); setActiveTab('timezone') }}
            className={`py-1.5 rounded-lg transition ${
              activeTab === 'timezone'
                ? 'bg-white text-violet-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Múi giờ
          </button>
          <button
            onClick={() => { sounds.playTap(); setActiveTab('telegram') }}
            className={`py-1.5 rounded-lg transition ${
              activeTab === 'telegram'
                ? 'bg-white text-violet-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Telegram
          </button>
          <button
            onClick={() => { sounds.playTap(); setActiveTab('notifications') }}
            className={`py-1.5 rounded-lg transition ${
              activeTab === 'notifications'
                ? 'bg-white text-violet-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Thông báo
          </button>
        </div>

        {/* ── Tab 1: Profile ─────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Tên tài khoản</span>
                <span className="font-bold text-slate-900">{user?.username}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Email</span>
                <span className="font-bold text-slate-900">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Vai trò</span>
                <span className="font-bold uppercase text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-md">
                  {user?.role || 'user'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Múi giờ hiện tại</span>
                <span className="font-bold text-slate-900">{currentTimezone}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 active:scale-[0.98] transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng Xuất Khỏi Thiết Bị</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Tab 2: Timezone ────────────── */}
        {activeTab === 'timezone' && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-violet-50/80 border border-violet-200/80 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="w-4 h-4 text-violet-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-violet-700 tracking-wider">Đang sử dụng</div>
                  <div className="text-xs font-black text-slate-900 truncate">{currentTimezone}</div>
                </div>
              </div>
              <button
                onClick={handleDetectDeviceTz}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-violet-300 text-violet-700 text-[11px] font-bold shadow-xs hover:bg-violet-600 hover:text-white active:scale-95 transition shrink-0"
              >
                Tự phát hiện
              </button>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {COMMON_TIMEZONES.map((tz) => {
                const isSelected = currentTimezone === tz.id || selectedTz === tz.id
                return (
                  <button
                    key={tz.id}
                    onClick={() => handleSelectTz(tz.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition active:scale-[0.99] ${
                      isSelected
                        ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-violet-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {tz.label}
                      </div>
                      <div className={`text-[10px] font-mono ${isSelected ? 'text-violet-200' : 'text-slate-400'}`}>
                        {tz.id}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
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

            <div className="text-[11px] text-slate-500 leading-relaxed flex items-start gap-1.5 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Dữ liệu server luôn lưu chuẩn <strong>UTC+0</strong>. Múi giờ này dùng để tính streak và hiển thị lịch trình.</span>
            </div>
          </div>
        )}

        {/* ── Tab 3: Telegram Bot ────────── */}
        {activeTab === 'telegram' && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Bot Guide Card */}
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-sky-800 text-xs font-bold">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <span>Cách kết nối Telegram Bot</span>
              </div>
              <ol className="text-[11px] text-sky-900/80 space-y-1 list-decimal list-inside leading-relaxed">
                <li>Mở Telegram và tìm kiếm bot <strong>@InMindBot</strong> hoặc <strong>@userinfobot</strong>.</li>
                <li>Nhấn nút <code>/start</code> để lấy <strong>Chat ID</strong> của bạn (dãy số gồm 9 - 10 chữ số).</li>
                <li>Dán mã Chat ID vào ô bên dưới và nhấn <strong>Lưu Liên Kết</strong>.</li>
              </ol>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSaveTelegram} className="space-y-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Telegram Chat ID của bạn
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={e => setTelegramChatId(e.target.value)}
                  placeholder="Ví dụ: 123456789"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition"
                />
              </div>

              {telegramMessage && (
                <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 ${
                  telegramStatus === 'test_success' || telegramStatus === 'saved'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : telegramStatus === 'test_failed'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {telegramStatus === 'test_success' || telegramStatus === 'saved' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{telegramMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="submit"
                  disabled={telegramStatus === 'saving'}
                  className="py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold active:scale-[0.98] transition shadow-xs disabled:opacity-50"
                >
                  {telegramStatus === 'saving' ? 'Đang lưu...' : 'Lưu Chat ID'}
                </button>

                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={!telegramChatId.trim() || telegramStatus === 'testing'}
                  className="py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold active:scale-[0.98] transition shadow-xs disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-violet-600" />
                  <span>{telegramStatus === 'testing' ? 'Đang gửi...' : 'Gửi thử tin nhắn'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Tab 4: Notifications ───────── */}
        {activeTab === 'notifications' && (
          <div className="space-y-2.5 animate-fade-in">
            {/* Toggle 1: Task Reminders */}
            <div className="glass rounded-2xl p-3.5 flex items-center justify-between border border-slate-200">
              <div className="pr-3">
                <div className="text-xs font-bold text-slate-900">Nhắc nhở công việc</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Báo qua Telegram khi sắp đến hạn hoàn thành task</div>
              </div>
              <button
                onClick={() => handleToggleSetting('notify_task', !notifyTask, setNotifyTask)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                  notifyTask ? 'bg-violet-600' : 'bg-slate-200'
                }`}
              >
                <span className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                  notifyTask ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Toggle 2: Habit Reminders */}
            <div className="glass rounded-2xl p-3.5 flex items-center justify-between border border-slate-200">
              <div className="pr-3">
                <div className="text-xs font-bold text-slate-900">Nhắc nhở thói quen</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Nhắc duy trì chuỗi Streak mỗi ngày</div>
              </div>
              <button
                onClick={() => handleToggleSetting('notify_habit', !notifyHabit, setNotifyHabit)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                  notifyHabit ? 'bg-violet-600' : 'bg-slate-200'
                }`}
              >
                <span className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                  notifyHabit ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Toggle 3: Daily Wrap-up */}
            <div className="glass rounded-2xl p-3.5 flex items-center justify-between border border-slate-200">
              <div className="pr-3">
                <div className="text-xs font-bold text-slate-900">Tổng kết cuối ngày (21:00)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Báo cáo năng suất, số task & thói quen đã hoàn tất</div>
              </div>
              <button
                onClick={() => handleToggleSetting('notify_daily_report', !notifyDailyReport, setNotifyDailyReport)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                  notifyDailyReport ? 'bg-violet-600' : 'bg-slate-200'
                }`}
              >
                <span className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                  notifyDailyReport ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Toggle 4: Haptic Web Audio Sounds */}
            <div className="glass rounded-2xl p-3.5 flex items-center justify-between border border-slate-200">
              <div className="pr-3">
                <div className="text-xs font-bold text-slate-900">Âm thanh tương tác (Sound FX)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Phát âm thanh khi hoàn thành task, streak & focus</div>
              </div>
              <button
                onClick={() => handleToggleSetting('sound_enabled', !soundEnabled, setSoundEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                  soundEnabled ? 'bg-violet-600' : 'bg-slate-200'
                }`}
              >
                <span className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
