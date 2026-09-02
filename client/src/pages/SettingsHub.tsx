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
  { id: 'Asia/Ho_Chi_Minh', label: 'Vietnam (HCMC / Hanoi)', offset: 'UTC+7' },
  { id: 'Asia/Bangkok', label: 'Bangkok, Thailand', offset: 'UTC+7' },
  { id: 'Asia/Singapore', label: 'Singapore', offset: 'UTC+8' },
  { id: 'Asia/Tokyo', label: 'Tokyo, Japan', offset: 'UTC+9' },
  { id: 'Asia/Seoul', label: 'Seoul, South Korea', offset: 'UTC+9' },
  { id: 'UTC', label: 'Coordinated Universal Time (UTC)', offset: 'UTC+0' },
  { id: 'Europe/London', label: 'London, United Kingdom', offset: 'UTC+0' },
  { id: 'Europe/Paris', label: 'Paris, France / Central Europe', offset: 'UTC+1' },
  { id: 'America/New_York', label: 'New York / US Eastern', offset: 'UTC-5' },
  { id: 'America/Los_Angeles', label: 'Los Angeles / US Pacific', offset: 'UTC-8' },
  { id: 'Australia/Sydney', label: 'Sydney, Australia', offset: 'UTC+10' }
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
            body: 'Browser push notifications have been activated successfully!',
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
    bot_username: 'inmind_auth_bot',
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
    ambient_sound: 'none',
    theme: 'dark',
    timezone: user?.timezone || 'Asia/Ho_Chi_Minh'
  })
  const [prefSaving, setPrefSaving] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)

  // Wipe All Data States & Manual Typing Confirmation
  const [wipeModalOpen, setWipeModalOpen] = useState(false)
  const [confirmInputText, setConfirmInputText] = useState('')
  const [isWipingData, setIsWipingData] = useState(false)
  const [wipeSuccessMsg, setWipeSuccessMsg] = useState<string | null>(null)

  const REQUIRED_CONFIRM_TEXT = 'DELETE'

  const handleOpenWipeModal = () => {
    sounds.playTap()
    setConfirmInputText('')
    setWipeModalOpen(true)
  }

  const handleConfirmWipeAllData = async () => {
    if (confirmInputText.trim().toUpperCase() !== REQUIRED_CONFIRM_TEXT) return
    sounds.playTap()
    setIsWipingData(true)
    setWipeSuccessMsg(null)
    try {
      await axios.post('/api/v1/user/settings/wipe-all-data')
      sounds.playSuccess()
      setWipeSuccessMsg('All data has been completely wiped. Your account is now fresh and ready!')
      setWipeModalOpen(false)
      setTimeout(() => {
        window.location.href = '/'
      }, 1200)
    } catch (e) {
      console.error('Wipe data error', e)
      alert('Failed to wipe data. Please try again.')
      setIsWipingData(false)
    }
  }

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

  const loadPreferences = async () => {
    try {
      const res = await axios.get('/api/v1/user/settings')
      if (res.data) {
        setUserSettings((prev: any) => ({ ...prev, ...res.data }))
      }
    } catch (e) {
      // Fallback
    }
  }

  useEffect(() => {
    if (activeTab === 'notifications') {
      loadTelegramConfig()
    }
    if (activeTab === 'preferences' || activeTab === 'account') {
      loadPreferences()
    }
  }, [activeTab])

  // Save Telegram config
  const handleSaveTeleConfig = async (patch: Partial<typeof teleConfig>) => {
    sounds.playTap()
    const updated = { ...teleConfig, ...patch }
    setTeleConfig(updated)
    try {
      await axios.put('/api/v1/notifications/telegram/config', patch)
      sounds.playSuccess()
    } catch (e) {
      console.error('Failed to update telegram config', e)
    }
  }

  // Generate new Telegram connect token
  const handleGenerateToken = async () => {
    sounds.playTap()
    try {
      setTeleLoading(true)
      const res = await axios.post('/api/v1/notifications/telegram/generate-token')
      if (res.data?.token) {
        setTeleConfig((prev: any) => ({ ...prev, connect_token: res.data.token }))
        sounds.playSuccess()
      }
    } catch (e) {
      console.error('Failed to generate token', e)
    } finally {
      setTeleLoading(false)
    }
  }

  // Copy token
  const handleCopyToken = () => {
    if (!teleConfig.connect_token) return
    sounds.playTap()
    navigator.clipboard.writeText(teleConfig.connect_token)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  // Send test message
  const handleSendTest = async () => {
    sounds.playTap()
    try {
      setTestSending(true)
      setTestResult(null)
      const res = await axios.post('/api/v1/notifications/telegram/test')
      if (res.data?.success) {
        sounds.playSuccess()
        setTestResult('success')
      } else {
        setTestResult(res.data?.detail || 'Failed to send test message')
      }
    } catch (e: any) {
      setTestResult(e.response?.data?.detail || 'Error connecting to Telegram server')
    } finally {
      setTestSending(false)
    }
  }

  // Save Preferences
  const handleSavePreferences = async (patch: Partial<typeof userSettings>) => {
    sounds.playTap()
    const updated = { ...userSettings, ...patch }
    setUserSettings(updated)
    try {
      setPrefSaving(true)
      await axios.put('/api/v1/user/settings', patch)
      sounds.playSuccess()
    } catch (e) {
      console.error('Failed to save settings', e)
    } finally {
      setPrefSaving(false)
    }
  }

  // Handle Timezone change
  const handleTimezoneChange = async (tz: string) => {
    sounds.playTap()
    try {
      await updateTimezone(tz)
      setUserSettings((prev: any) => ({ ...prev, timezone: tz }))
      sounds.playSuccess()
    } catch (e) {
      console.error('Failed to update timezone', e)
    }
  }

  // Reset sample data
  const handleResetSampleData = async () => {
    sounds.playTap()
    try {
      await axios.post('/api/v1/schedule/seed-samples')
      sounds.playSuccess()
      setResetConfirmOpen(false)
      alert('Sample data has been restored successfully!')
    } catch (e) {
      console.error('Failed to reset sample data', e)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F8FAFC]">
      {/* ── 1. MAIN SCROLLABLE CONTENT BODY (Zero duplicated header) ── */}
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
                    <h2 className="text-xs font-black text-slate-900">1. In-App & Browser Notifications</h2>
                    <p className="text-[10px] text-slate-500 font-medium">Audio cues, Web push notifications & instant alerts</p>
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
                    <div className="text-xs font-bold text-slate-800">Browser Web Push Notifications</div>
                    <div className="text-[10px] text-slate-500">
                      Status: <b className={browserNotifStatus === 'granted' ? 'text-emerald-600' : 'text-amber-600'}>
                        {browserNotifStatus === 'granted' ? 'Active' : 'Disabled'}
                      </b>
                    </div>
                  </div>
                </div>

                {browserNotifStatus !== 'granted' ? (
                  <button
                    onClick={requestBrowserPermission}
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs active:scale-95 transition shrink-0 cursor-pointer"
                  >
                    Enable Push
                  </button>
                ) : (
                  <span className="px-2 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ✓ Active
                  </span>
                )}
              </div>

              {/* In-App Toggles */}
              <div className="space-y-2">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 cursor-pointer">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Volume2 className="w-3.5 h-3.5 text-violet-600" />
                    <span>Sound effects on timer alerts & task completion</span>
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
                    <span>Task deadline approach warnings</span>
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
                    <h2 className="text-xs font-black text-slate-900">2. CentralAuth Telegram Bot</h2>
                    <p className="text-[10px] text-slate-500 font-medium">Daily briefings, schedule alerts & streak protection</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 ${
                  teleConfig.is_linked
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${teleConfig.is_linked ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {teleConfig.is_linked ? 'Connected' : 'Not Connected'}
                </span>
              </div>

              {/* Bot Connection Box */}
              {!teleConfig.is_linked ? (
                <div className="p-4 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl border border-sky-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-sky-600 animate-pulse" />
                    <span className="text-xs font-black text-slate-900">Connect to @inmind_auth_bot</span>
                  </div>

                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Link your account with our ecosystem Telegram Bot to receive smart daily schedules, habit check-ins, and reminders across all InMind apps.
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`https://t.me/${teleConfig.bot_username || 'inmind_auth_bot'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-sky-600/30 transition active:scale-95"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Telegram Bot</span>
                    </a>

                    <button
                      onClick={handleGenerateToken}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs transition active:scale-95 cursor-pointer"
                    >
                      Get Link Code
                    </button>
                  </div>

                  {teleConfig.connect_token && (
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 font-mono text-xs">
                      <span className="font-bold text-slate-800">/link {teleConfig.connect_token}</span>
                      <button
                        onClick={handleCopyToken}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedToken ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-emerald-950">Telegram Connected via CentralAuth</div>
                      <div className="text-[10px] text-emerald-700 font-mono">
                        Chat ID: {teleConfig.telegram_chat_id || 'Active'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSendTest}
                    disabled={testSending}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {testSending ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
              )}

              {/* Automation Toggles */}
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  Automated Digest Schedules
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">🌅 Morning Briefing</span>
                      <input
                        type="checkbox"
                        checked={teleConfig.morning_briefing_enabled !== false}
                        onChange={e => handleSaveTeleConfig({ morning_briefing_enabled: e.target.checked })}
                        className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                      />
                    </div>
                    <input
                      type="time"
                      value={teleConfig.morning_briefing_time || '07:30'}
                      onChange={e => handleSaveTeleConfig({ morning_briefing_time: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500 transition"
                    />
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">🌙 Evening Reflection</span>
                      <input
                        type="checkbox"
                        checked={teleConfig.evening_reflection_enabled !== false}
                        onChange={e => handleSaveTeleConfig({ evening_reflection_enabled: e.target.checked })}
                        className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                      />
                    </div>
                    <input
                      type="time"
                      value={teleConfig.evening_reflection_time || '21:30'}
                      onChange={e => handleSaveTeleConfig({ evening_reflection_time: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: PREFERENCES (POMODORO, THEMES, TIMEZONE) ── */}
        {activeTab === 'preferences' && (
          <div className="max-w-lg md:max-w-3xl mx-auto p-3 sm:p-4 space-y-4 pb-20 animate-in fade-in duration-150">
            {/* Pomodoro Timer Configuration */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-slate-900">Pomodoro Focus Timer Settings</h2>
                    <p className="text-[10px] text-slate-500 font-medium">Customize your focus cycles and interval breaks</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Work (mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={userSettings.work_duration || 25}
                    onChange={e => handleSavePreferences({ work_duration: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 text-center outline-none focus:border-violet-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Short Break
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={userSettings.short_break || 5}
                    onChange={e => handleSavePreferences({ short_break: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 text-center outline-none focus:border-violet-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Long Break
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={userSettings.long_break || 15}
                    onChange={e => handleSavePreferences({ long_break: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 text-center outline-none focus:border-violet-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* Timezone Configuration */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center shadow-2xs">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-slate-900">Timezone & Localization</h2>
                    <p className="text-[10px] text-slate-500 font-medium">Controls daily rollover and reminder scheduling</p>
                  </div>
                </div>
              </div>

              <div>
                <select
                  value={user?.timezone || userSettings.timezone || 'Asia/Ho_Chi_Minh'}
                  onChange={e => handleTimezoneChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-violet-500 focus:bg-white transition"
                >
                  {COMMON_TIMEZONES.map(tz => (
                    <option key={tz.id} value={tz.id}>
                      {tz.label} ({tz.offset})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reset / Sample Data */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Restore Sample Data</h3>
                  <p className="text-[10px] text-slate-500">Seed sample daily schedules, tasks, and habit tracking routines</p>
                </div>

                <button
                  onClick={() => handleResetSampleData()}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  Seed Samples
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: ACCOUNT PROFILE ── */}
        {activeTab === 'account' && (
          <div className="max-w-lg md:max-w-3xl mx-auto p-3 sm:p-4 space-y-4 pb-20 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-700 text-white font-black text-2xl mx-auto flex items-center justify-center shadow-lg shadow-violet-600/30 border-2 border-white">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">
                  {user?.full_name || user?.username || 'User Profile'}
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  @{user?.username} • {user?.email || 'SSO Account'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">CentralAuth SSO Status:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Timezone:</span>
                  <span className="font-bold text-slate-800 font-mono">{user?.timezone || 'Asia/Ho_Chi_Minh'}</span>
                </div>
              </div>

              {/* Danger Zone: Wipe All Data */}
              <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200 text-left space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start Fresh (Xoá toàn bộ dữ liệu)</span>
                </div>
                <p className="text-[11px] text-rose-600 leading-relaxed font-medium">
                  Permanently delete all tasks, habits, schedule slots, and time tracking sessions for this account to start completely from scratch.
                </p>
                {wipeSuccessMsg && (
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{wipeSuccessMsg}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleOpenWipeModal}
                  disabled={isWipingData}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer shadow-xs shadow-rose-600/30"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Wipe All Data & Start Fresh...</span>
                </button>
              </div>

              <button
                onClick={() => { sounds.playTap(); logout() }}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out Account</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. FIXED BOTTOM DOCKED SEGMENTED SWITCHER (1-Hand Reachability) ── */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 sm:px-3 py-1.5 z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <div className="max-w-lg md:max-w-3xl mx-auto">
          <div className="grid grid-cols-4 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60 shadow-2xs gap-1">
            {/* Tab 1: Categories */}
            <button
              onClick={() => handleTabChange('categories')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-white text-violet-700 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Categories</span>
            </button>

            {/* Tab 2: Notifications */}
            <button
              onClick={() => handleTabChange('notifications')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-white text-sky-700 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Bell className="w-3.5 h-3.5 shrink-0 text-sky-600" />
              <span className="truncate">Notifications</span>
            </button>

            {/* Tab 3: Preferences */}
            <button
              onClick={() => handleTabChange('preferences')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                activeTab === 'preferences'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span className="truncate">Preferences</span>
            </button>

            {/* Tab 4: Account */}
            <button
              onClick={() => handleTabChange('account')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Dangerous Action Confirmation Modal: Wipe All Data with Manual Typing ── */}
      {wipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-rose-200 space-y-4 animate-in zoom-in-95 duration-150 text-left"
          >
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-slate-900">
                  Confirm Data Wipe
                </h3>
                <p className="text-[11px] text-rose-600 font-bold mt-0.5">
                  Action cannot be undone
                </p>
              </div>
            </div>

            {/* Explanation */}
            <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed bg-rose-50/50 p-3 rounded-2xl border border-rose-100">
              <p className="font-semibold text-rose-900">
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 font-medium">
                <li>All active timers & focus tracking history</li>
                <li>All scheduled time blocks & timeline slots</li>
                <li>All tasks, subtasks & deadlines</li>
                <li>All habits & check-in streak records</li>
              </ul>
            </div>

            {/* Manual Confirmation Prompt */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                To confirm, please type <span className="font-mono text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded font-black tracking-wider">{REQUIRED_CONFIRM_TEXT}</span> below:
              </label>
              <input
                type="text"
                value={confirmInputText}
                onChange={(e) => setConfirmInputText(e.target.value)}
                placeholder={`Type ${REQUIRED_CONFIRM_TEXT} here...`}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition uppercase"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  sounds.playTap()
                  setWipeModalOpen(false)
                  setConfirmInputText('')
                }}
                disabled={isWipingData}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWipeAllData}
                disabled={confirmInputText.trim().toUpperCase() !== REQUIRED_CONFIRM_TEXT || isWipingData}
                className={`px-4 py-2 rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1.5 shadow-sm ${
                  confirmInputText.trim().toUpperCase() === REQUIRED_CONFIRM_TEXT && !isWipingData
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-rose-600/30'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isWipingData ? 'animate-spin' : ''}`} />
                <span>{isWipingData ? 'Wiping...' : 'I understand, wipe all data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default SettingsHub
