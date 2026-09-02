import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Settings, FolderTree, Send, Clock, User, Globe, Check,
  Sparkles, Bell, Shield, LogOut, Sun, Moon, Volume2, RotateCcw,
  AlertCircle, ChevronRight, CheckCircle2, Copy, ExternalLink,
  Flame, Zap, Target, Smartphone, Laptop, Radio
} from 'lucide-react'
import axios from 'axios'
import { CategoryManagement } from './CategoryManagement'
import { useAuthStore } from '../store/useAuthStore'
import { sounds } from '../utils/soundEffects'

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

export const SettingsHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, updateTimezone, logout } = useAuthStore()

  const currentTab = searchParams.get('tab') || 'categories'
  const [activeTab, setActiveTab] = useState<'categories' | 'notifications' | 'preferences' | 'account'>(
    (currentTab === 'notifications' || currentTab === 'preferences' || currentTab === 'account')
      ? currentTab
      : 'categories'
  )

  const handleTabChange = (t: 'categories' | 'notifications' | 'preferences' | 'account') => {
    sounds.playTap()
    setActiveTab(t)
    setSearchParams({ tab: t }, { replace: true })
  }

  // Browser Notification Status
  const [browserNotifStatus, setBrowserNotifStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )

  const requestBrowserPermission = async () => {
    sounds.playTap()
    if (typeof Notification !== 'undefined') {
      try {
        const perm = await Notification.requestPermission()
        setBrowserNotifStatus(perm)
        if (perm === 'granted') {
          sounds.playSuccess()
          new Notification('🔔 TimeHack Notifications', {
            body: 'Thông báo trên trình duyệt đã được kích hoạt thành công!',
            icon: '/favicon.ico'
          })
        }
      } catch (e) {
        console.error('Notification permission error', e)
      }
    }
  }

  // Telegram & In-App Notification Config
  const [teleConfig, setTeleConfig] = useState<any>({
    is_linked: false,
    telegram_chat_id: '',
    connect_token: '',
    bot_username: 'InMindBot',
    is_active: true,
    // In-App Channels
    in_app_sound: true,
    in_app_deadline_alert: true,
    in_app_inactivity_alert: true,
    // Telegram Automation Channels
    morning_briefing_enabled: true,
    morning_briefing_time: '07:30',
    evening_reflection_enabled: true,
    evening_reflection_time: '21:30',
    inactivity_reminder_enabled: true,
    inactivity_reminder_interval_hours: 2,
    notify_task_deadline: true,
    notify_habit_reminder: true
  })
  const [teleLoading, setTeleLoading] = useState(false)
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState(false)

  // Preferences & Pomodoro States
  const [userSettings, setUserSettings] = useState<any>({
    work_duration: 25,
    short_break: 5,
    long_break: 15,
    auto_start_breaks: false,
    auto_start_pomodoros: false,
    sound_enabled: true,
    timezone: user?.timezone || 'Asia/Ho_Chi_Minh'
  })
  const [prefSaving, setPrefSaving] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)

  // Load configs
  const loadTelegramConfig = async () => {
    try {
      setTeleLoading(true)
      const res = await axios.get('/api/v1/notifications/telegram/config')
      if (res.data) {
        setTeleConfig((prev: any) => ({ ...prev, ...res.data }))
      }
    } catch (e) {
      console.error('Failed to load telegram config', e)
    } finally {
      setTeleLoading(false)
    }
  }

  const loadUserSettings = async () => {
    try {
      const res = await axios.get('/api/v1/user/settings')
      if (res.data && res.data.settings) {
        setUserSettings((prev: any) => ({ ...prev, ...res.data.settings }))
      }
    } catch (e) {
      console.error('Failed to load user settings', e)
    }
  }

  useEffect(() => {
    loadTelegramConfig()
    loadUserSettings()
  }, [])

  // Save Notification Config
  const handleSaveTeleConfig = async (updatedFields: Partial<typeof teleConfig>) => {
    sounds.playTap()
    const nextState = { ...teleConfig, ...updatedFields }
    setTeleConfig(nextState)
    try {
      await axios.post('/api/v1/notifications/telegram/config', nextState)
      sounds.playSuccess()
    } catch (e) {
      console.error('Failed to save notification config', e)
    }
  }

  // Send Test Telegram Notification
  const handleSendTestMessage = async () => {
    sounds.playTap()
    setTestSending(true)
    setTestResult(null)
    try {
      const res = await axios.post('/api/v1/notifications/telegram/test')
      if (res.data?.sent) {
        sounds.playSuccess()
        setTestResult('Đã gửi tin nhắn thử nghiệm thành công! Hãy kiểm tra Telegram của bạn.')
      } else {
        setTestResult('Gửi tin nhắn thất bại. Vui lòng kiểm tra lại Bot Telegram.')
      }
    } catch (e: any) {
      setTestResult(e.response?.data?.detail || 'Lỗi gửi tin nhắn thử nghiệm.')
    } finally {
      setTestSending(false)
    }
  }

  // Save Preferences
  const handleSavePreferences = async (updated: Partial<typeof userSettings>) => {
    sounds.playTap()
    const nextState = { ...userSettings, ...updated }
    setUserSettings(nextState)
    setPrefSaving(true)
    try {
      await axios.post('/api/v1/user/settings', nextState)
      if (updated.timezone) {
        await updateTimezone(updated.timezone)
      }
      sounds.playSuccess()
    } catch (e) {
      console.error('Failed to save user preferences', e)
    } finally {
      setPrefSaving(false)
    }
  }

  // Reset sample data
  const handleResetSampleData = async () => {
    sounds.playTap()
    try {
      await axios.post('/api/v1/user/settings/reset-sample-data')
      sounds.playSuccess()
      setResetConfirmOpen(false)
      window.location.href = '/'
    } catch (e) {
      console.error('Failed to reset sample data', e)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F8FAFC]">
      {/* ── 1. COMPACT TOP HEADER ── */}
      <div className="shrink-0 bg-white border-b border-slate-200/80 px-4 py-2.5 z-10 shadow-2xs">
        <div className="max-w-lg md:max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
              <Settings className="w-3.5 h-3.5" />
            </div>
            <div>
              <h1 className="text-xs font-black text-slate-900 tracking-tight">Cài Đặt Hệ Thống</h1>
              <p className="text-[10px] text-slate-500 font-medium">Danh mục, Thông báo In-App / Telegram & Múi giờ</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. MAIN SCROLLABLE CONTENT BODY ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* ── TAB 1: CATEGORIES & PROJECTS ── */}
        {activeTab === 'categories' && (
          <div className="h-full flex flex-col min-h-0">
            <CategoryManagement />
          </div>
        )}

        {/* ── TAB 2: NOTIFICATIONS (IN-APP & TELEGRAM) ── */}
        {activeTab === 'notifications' && (
          <div className="max-w-lg md:max-w-3xl mx-auto p-3 sm:p-4 space-y-4 pb-20 animate-in fade-in duration-150">
            {/* ── SECTION A: IN-APP & BROWSER NOTIFICATIONS ── */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center shadow-2xs">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-slate-900">1. Thông Báo Trong Ứng Dụng & Trình Duyệt</h2>
                    <p className="text-[10px] text-slate-500 font-medium">Âm thanh, thông báo đẩy Web & cảnh báo tức thì</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 text-[10px] font-mono font-bold border border-violet-200">
                  In-App & Web
                </span>
              </div>

              {/* Browser Push Permission Request */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-slate-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Thông báo đẩy trên trình duyệt (Web Push)</div>
                    <div className="text-[10px] text-slate-500">
                      Trạng thái: <b className={browserNotifStatus === 'granted' ? 'text-emerald-600' : 'text-amber-600'}>
                        {browserNotifStatus === 'granted' ? 'Đã kích hoạt' : 'Chưa bật'}
                      </b>
                    </div>
                  </div>
                </div>

                {browserNotifStatus !== 'granted' ? (
                  <button
                    onClick={requestBrowserPermission}
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs active:scale-95 transition shrink-0"
                  >
                    Bật thông báo
                  </button>
                ) : (
                  <span className="px-2 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ✓ Hoạt động
                  </span>
                )}
              </div>

              {/* In-App Toggles */}
              <div className="space-y-2">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 cursor-pointer">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Volume2 className="w-3.5 h-3.5 text-violet-600" />
                    <span>Hiệu ứng âm thanh khi chuông reo & hoàn thành việc</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={userSettings.sound_enabled !== false}
                    onChange={e => handleSavePreferences({ sound_enabled: e.target.checked })}
                    className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 cursor-pointer">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Target className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cảnh báo khi nhiệm vụ sắp đến hạn chót (Deadline warning)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={teleConfig.in_app_deadline_alert !== false}
                    onChange={e => handleSaveTeleConfig({ in_app_deadline_alert: e.target.checked })}
                    className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* ── SECTION B: TELEGRAM BOT NOTIFICATIONS ── */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-2xs">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-slate-900">2. Thông Báo & Tự Động Hóa Telegram</h2>
                    <p className="text-[10px] text-slate-500 font-medium">Báo cáo sáng/tối, nhắc nhở ghi chép & lịch trình</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 ${
                  teleConfig.is_linked
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${teleConfig.is_linked ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {teleConfig.is_linked ? 'Đã liên kết' : 'Chưa liên kết'}
                </span>
              </div>

              {teleConfig.is_linked ? (
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">Telegram Chat ID:</span>
                    <span className="font-mono font-bold text-slate-900">{teleConfig.telegram_chat_id}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                    <button
                      onClick={handleSendTestMessage}
                      disabled={testSending}
                      className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{testSending ? 'Đang gửi...' : 'Gửi thử tin nhắn Telegram'}</span>
                    </button>

                    <button
                      onClick={() => handleSaveTeleConfig({ unlink: true })}
                      className="py-2 px-3 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs active:scale-95 transition"
                    >
                      Hủy liên kết
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-sky-50/60 rounded-2xl p-3.5 border border-sky-200/80 space-y-3">
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    Để kết nối, mở Bot Telegram <b>@{teleConfig.bot_username || 'InMindBot'}</b> và gửi mã:
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-white rounded-xl border border-sky-200 font-mono text-xs font-bold text-slate-900 tracking-wider text-center">
                      /start {teleConfig.connect_token}
                    </div>
                    <button
                      onClick={() => {
                        sounds.playTap()
                        navigator.clipboard.writeText(`/start ${teleConfig.connect_token}`)
                        setCopiedToken(true)
                        setTimeout(() => setCopiedToken(false), 2000)
                      }}
                      className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 transition"
                    >
                      {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedToken ? 'Đã copy' : 'Copy'}</span>
                    </button>
                  </div>

                  <a
                    href={`https://t.me/${teleConfig.bot_username || 'InMindBot'}?start=${teleConfig.connect_token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <span>Mở Telegram Bot ngay</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {testResult && (
                <div className="p-3 rounded-2xl bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200 anim-fade-in flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                  <span>{testResult}</span>
                </div>
              )}

              {/* ── Telegram Automations ── */}
              <div className="space-y-3 pt-2">
                {/* 1. Morning Briefing */}
                <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Sun className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Báo Cáo Tổng Quan Buổi Sáng</h4>
                        <p className="text-[10px] text-slate-400">Gửi danh sách kế hoạch, thói quen & deadline hôm nay</p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={!!teleConfig.morning_briefing_enabled}
                      onChange={e => handleSaveTeleConfig({ morning_briefing_enabled: e.target.checked })}
                      className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                    />
                  </div>

                  {teleConfig.morning_briefing_enabled && (
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between anim-fade-in">
                      <span className="text-xs font-bold text-slate-700">Giờ gửi báo cáo sáng:</span>
                      <input
                        type="time"
                        value={teleConfig.morning_briefing_time || '07:30'}
                        onChange={e => handleSaveTeleConfig({ morning_briefing_time: e.target.value })}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-black text-slate-800 outline-none focus:border-violet-500"
                      />
                    </div>
                  )}
                </div>

                {/* 2. Evening Reflection */}
                <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <Moon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Tổng Kết & Đánh Giá Cuối Ngày</h4>
                        <p className="text-[10px] text-slate-400">Nhắc check-in thói quen chưa xong & lên lịch ngày mai</p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={!!teleConfig.evening_reflection_enabled}
                      onChange={e => handleSaveTeleConfig({ evening_reflection_enabled: e.target.checked })}
                      className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                    />
                  </div>

                  {teleConfig.evening_reflection_enabled && (
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between anim-fade-in">
                      <span className="text-xs font-bold text-slate-700">Giờ gửi tổng kết tối:</span>
                      <input
                        type="time"
                        value={teleConfig.evening_reflection_time || '21:30'}
                        onChange={e => handleSaveTeleConfig({ evening_reflection_time: e.target.value })}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-black text-slate-800 outline-none focus:border-violet-500"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Inactivity Reminder */}
                <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Nhắc Nhở Ghi Nhận Thời Gian</h4>
                        <p className="text-[10px] text-slate-400">Bot gửi nhắc nếu lâu chưa kích hoạt Focus hoặc Log</p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={!!teleConfig.inactivity_reminder_enabled}
                      onChange={e => handleSaveTeleConfig({ inactivity_reminder_enabled: e.target.checked })}
                      className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                    />
                  </div>

                  {teleConfig.inactivity_reminder_enabled && (
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between anim-fade-in">
                      <span className="text-xs font-bold text-slate-700">Nhắc sau khoảng không hoạt động:</span>
                      <select
                        value={teleConfig.inactivity_reminder_interval_hours || 2}
                        onChange={e => handleSaveTeleConfig({ inactivity_reminder_interval_hours: Number(e.target.value) })}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-violet-500"
                      >
                        <option value={1}>Sau 1 giờ</option>
                        <option value={2}>Sau 2 giờ</option>
                        <option value={3}>Sau 3 giờ</option>
                        <option value={4}>Sau 4 giờ</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 4. Instant Alerts */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 cursor-pointer">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Target className="w-3.5 h-3.5 text-rose-600" />
                      <span>Gửi thông báo Telegram khi đến hạn nhiệm vụ</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!teleConfig.notify_task_deadline}
                      onChange={e => handleSaveTeleConfig({ notify_task_deadline: e.target.checked })}
                      className="w-4 h-4 accent-violet-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 cursor-pointer">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Gửi thông báo Telegram theo giờ thói quen</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!teleConfig.notify_habit_reminder}
                      onChange={e => handleSaveTeleConfig({ notify_habit_reminder: e.target.checked })}
                      className="w-4 h-4 accent-violet-600 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: WORK & PREFERENCES ── */}
        {activeTab === 'preferences' && (
          <div className="max-w-lg md:max-w-3xl mx-auto p-3 sm:p-4 space-y-4 pb-20 animate-in fade-in duration-150">
            {/* Timezone Selector Card */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">Múi Giờ Người Dùng</h3>
                    <p className="text-[10px] text-slate-400">Đồng bộ lịch trình chuẩn xác theo vùng</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    try {
                      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
                      if (detected) handleSavePreferences({ timezone: detected })
                    } catch {
                      handleSavePreferences({ timezone: 'Asia/Ho_Chi_Minh' })
                    }
                  }}
                  className="px-2.5 py-1 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold hover:bg-violet-600 hover:text-white transition active:scale-95"
                >
                  Tự phát hiện
                </button>
              </div>

              <select
                value={userSettings.timezone || 'Asia/Ho_Chi_Minh'}
                onChange={e => handleSavePreferences({ timezone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-violet-500 focus:bg-white transition"
              >
                {COMMON_TIMEZONES.map(tz => (
                  <option key={tz.id} value={tz.id}>{tz.label} ({tz.offset})</option>
                ))}
              </select>
            </div>

            {/* Pomodoro Duration Defaults */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">Thông Số Pomodoro & Focus</h3>
                  <p className="text-[10px] text-slate-400">Thời lượng mặc định khi kích hoạt đồng hồ tập trung</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Tập trung (phút)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={userSettings.work_duration || 25}
                    onChange={e => handleSavePreferences({ work_duration: Number(e.target.value) || 25 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-black text-slate-900 text-center outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Nghỉ ngắn (phút)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={userSettings.short_break || 5}
                    onChange={e => handleSavePreferences({ short_break: Number(e.target.value) || 5 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-black text-slate-900 text-center outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Nghỉ dài (phút)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={userSettings.long_break || 15}
                    onChange={e => handleSavePreferences({ long_break: Number(e.target.value) || 15 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-black text-slate-900 text-center outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            </div>

            {/* Reset Sample Data Button */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900">Khởi Tạo Dữ Liệu Mẫu</h3>
                  <p className="text-[10px] text-slate-400">Làm sạch dữ liệu thử nghiệm và nạp bộ demo chuẩn</p>
                </div>

                <button
                  onClick={() => setResetConfirmOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold transition active:scale-95 border border-slate-200"
                >
                  Reset Demo Data
                </button>
              </div>

              {resetConfirmOpen && (
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs space-y-2 anim-fade-in">
                  <p className="font-bold text-rose-800">
                    ⚠️ Thao tác này sẽ đặt lại dữ liệu lịch trình, thói quen và danh mục về trạng thái mẫu. Bạn có chắc chắn không?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetSampleData}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs active:scale-95"
                    >
                      Xác nhận Reset
                    </button>
                    <button
                      onClick={() => setResetConfirmOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: ACCOUNT & PROFILE ── */}
        {activeTab === 'account' && (
          <div className="max-w-lg md:max-w-3xl mx-auto p-3 sm:p-4 space-y-4 pb-20 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-700 text-white font-black text-2xl shadow-md shadow-violet-600/30 flex items-center justify-center mx-auto border-2 border-white ring-2 ring-violet-200">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>

              <div>
                <h2 className="text-base font-black text-slate-900">{user?.full_name || user?.username || 'User'}</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{user?.email || 'TimeHack Account'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Username:</span>
                  <span className="font-bold text-slate-900">{user?.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Hệ thống xác thực:</span>
                  <span className="font-bold text-violet-700">CentralAuth SSO</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Vai trò (Role):</span>
                  <span className="font-bold text-slate-900 uppercase">{user?.role || 'Member'}</span>
                </div>
              </div>

              <button
                onClick={() => { sounds.playTap(); logout() }}
                className="w-full py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. FIXED BOTTOM DOCKED SEGMENTED SWITCHER (1-Hand Reachability) ── */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 sm:px-3 py-1.5 z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <div className="max-w-lg md:max-w-3xl mx-auto">
          <div className="grid grid-cols-4 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60 shadow-2xs gap-1">
            {/* Tab 1: Categories */}
            <button
              onClick={() => handleTabChange('categories')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                activeTab === 'categories'
                  ? 'bg-white text-violet-700 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Danh mục</span>
            </button>

            {/* Tab 2: Notifications */}
            <button
              onClick={() => handleTabChange('notifications')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                activeTab === 'notifications'
                  ? 'bg-white text-sky-700 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Bell className="w-3.5 h-3.5 shrink-0 text-sky-600" />
              <span className="truncate">Thông báo</span>
            </button>

            {/* Tab 3: Preferences */}
            <button
              onClick={() => handleTabChange('preferences')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                activeTab === 'preferences'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span className="truncate">Tùy chỉnh</span>
            </button>

            {/* Tab 4: Account */}
            <button
              onClick={() => handleTabChange('account')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                activeTab === 'account'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Hồ sơ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default SettingsHub
