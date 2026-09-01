import React, { useState, useEffect } from 'react'
import {
  X, User, Globe, Send, Bell, Volume2, ShieldCheck, Check,
  Clock, LogOut, Sparkles, CheckCircle2, AlertCircle, ExternalLink,
  Smartphone, MessageSquare, Copy, RefreshCw, Unlink, Bot
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { sounds } from '../utils/soundEffects'
import axios from 'axios'

interface Props {
  isOpen: boolean
  onClose: () => void
}

interface TelegramConfigData {
  is_linked: boolean
  telegram_chat_id?: string | null
  connect_token?: string | null
  bot_username?: string
  reminder_time?: string
  is_active?: boolean
  notify_task?: boolean
  notify_habit?: boolean
  notify_daily_report?: boolean
}

const COMMON_TIMEZONES = [
  { id: 'Asia/Ho_Chi_Minh', label: 'Vietnam / Bangkok', offset: 'UTC+7' },
  { id: 'Asia/Bangkok', label: 'Bangkok, Thailand', offset: 'UTC+7' },
  { id: 'Asia/Singapore', label: 'Singapore', offset: 'UTC+8' },
  { id: 'Asia/Tokyo', label: 'Tokyo, Japan', offset: 'UTC+9' },
  { id: 'Asia/Seoul', label: 'Seoul, South Korea', offset: 'UTC+9' },
  { id: 'UTC', label: 'Coordinated Universal Time', offset: 'UTC+0' },
  { id: 'Europe/London', label: 'London, United Kingdom', offset: 'UTC+0' },
  { id: 'Europe/Paris', label: 'Paris, Central Europe', offset: 'UTC+1' },
  { id: 'America/New_York', label: 'New York, US Eastern', offset: 'UTC-5' },
  { id: 'America/Los_Angeles', label: 'Los Angeles, US Pacific', offset: 'UTC-8' },
  { id: 'Australia/Sydney', label: 'Sydney, Australia', offset: 'UTC+10' }
]

type SettingsTab = 'profile' | 'timezone' | 'telegram' | 'notifications'

export const UserSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, updateTimezone, updateSettings, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  // Timezone state
  const currentTimezone = user?.timezone || user?.settings?.timezone || 'Asia/Ho_Chi_Minh'
  const [selectedTz, setSelectedTz] = useState(currentTimezone)

  // Telegram state
  const [tgConfig, setTgConfig] = useState<TelegramConfigData | null>(null)
  const [tgLoading, setTgLoading] = useState(false)
  const [manualChatId, setManualChatId] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'saving' | 'saved' | 'testing' | 'test_success' | 'test_failed'>('idle')
  const [telegramMessage, setTelegramMessage] = useState('')

  // Notifications state
  const [notifyTask, setNotifyTask] = useState(user?.settings?.notify_task !== false)
  const [notifyHabit, setNotifyHabit] = useState(user?.settings?.notify_habit !== false)
  const [notifyDailyReport, setNotifyDailyReport] = useState(user?.settings?.notify_daily_report !== false)
  const [soundEnabled, setSoundEnabled] = useState(user?.settings?.sound_enabled !== false)

  useEffect(() => {
    if (user?.settings) {
      if (user.settings.notify_task !== undefined) setNotifyTask(user.settings.notify_task)
      if (user.settings.notify_habit !== undefined) setNotifyHabit(user.settings.notify_habit)
      if (user.settings.notify_daily_report !== undefined) setNotifyDailyReport(user.settings.notify_daily_report)
      if (user.settings.sound_enabled !== undefined) setSoundEnabled(user.settings.sound_enabled)
    }
    if (user?.timezone) {
      setSelectedTz(user.timezone)
    }
  }, [user])

  const fetchTelegramConfig = async () => {
    try {
      setTgLoading(true)
      const res = await axios.get('/api/v1/notifications/telegram/config')
      setTgConfig(res.data)
      if (res.data.telegram_chat_id) {
        setManualChatId(res.data.telegram_chat_id)
      }
    } catch (e) {
      console.error('Failed to load telegram config', e)
    } finally {
      setTgLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && activeTab === 'telegram') {
      fetchTelegramConfig()
    }
  }, [isOpen, activeTab])

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
  const handleCopyToken = () => {
    if (!tgConfig?.connect_token) return
    sounds.playTap()
    navigator.clipboard.writeText(tgConfig.connect_token)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  const handleUpdateTgConfig = async (payload: Partial<TelegramConfigData> & { unlink?: boolean }) => {
    sounds.playTap()
    try {
      setTelegramStatus('saving')
      await axios.post('/api/v1/notifications/telegram/config', payload)
      await fetchTelegramConfig()
      setTelegramStatus('saved')
      sounds.playSuccess()
    } catch (e: any) {
      setTelegramStatus('idle')
      setTelegramMessage(e.response?.data?.detail || 'Lỗi cập nhật cấu hình Telegram')
    }
  }

  const handleManualLinkTelegram = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualChatId.trim()) return
    sounds.playTap()
    setTelegramStatus('saving')
    try {
      await axios.post('/api/v1/notifications/telegram/link', {
        telegram_chat_id: manualChatId.trim()
      })
      await fetchTelegramConfig()
      setTelegramStatus('saved')
      setTelegramMessage('Liên kết Telegram Chat ID thành công!')
      sounds.playSuccess()
    } catch (err: any) {
      setTelegramStatus('idle')
      setTelegramMessage(err.response?.data?.detail || 'Không thể liên kết Chat ID')
    }
  }

  const handleTestTelegram = async () => {
    sounds.playTap()
    setTelegramStatus('testing')
    setTelegramMessage('Đang gửi thông báo thử nghiệm đến Telegram...')
    try {
      const res = await axios.post('/api/v1/notifications/telegram/test')
      if (res.data.status === 'ok' || res.data.sent) {
        setTelegramStatus('test_success')
        setTelegramMessage('🎉 Đã gửi thông báo thử nghiệm thành công! Hãy kiểm tra Telegram của bạn.')
        sounds.playSuccess()
      } else {
        setTelegramStatus('test_failed')
        setTelegramMessage('Không thể gửi tin nhắn. Hãy chắc chắn bạn đã bấm /start với bot trên Telegram!')
      }
    } catch (err: any) {
      setTelegramStatus('test_failed')
      setTelegramMessage(err.response?.data?.detail || 'Lỗi gửi thông báo thử nghiệm')
    }
  }

  // 3. Notification toggle handler
  const handleToggleSetting = async (key: string, val: boolean, setter: (v: boolean) => void) => {
    sounds.playTap()
    setter(val)
    await updateSettings({ [key]: val })
  }

  const botUsername = (tgConfig?.bot_username || 'InMindBot').replace(/^@/, '')
  const connectToken = tgConfig?.connect_token || '...'
  const directBotLink = `https://t.me/${botUsername}?start=${connectToken}`

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
              <p className="text-[11px] text-slate-500 font-medium">{user?.email || 'TimeHack Account'}</p>
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
            Profile
          </button>
          <button
            onClick={() => { sounds.playTap(); setActiveTab('timezone') }}
            className={`py-1.5 rounded-lg transition ${
              activeTab === 'timezone'
                ? 'bg-white text-violet-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Timezone
          </button>
          <button
            onClick={() => { sounds.playTap(); setActiveTab('telegram') }}
            className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
              activeTab === 'telegram'
                ? 'bg-white text-violet-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Telegram</span>
            {tgConfig?.is_linked && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>
          <button
            onClick={() => { sounds.playTap(); setActiveTab('notifications') }}
            className={`py-1.5 rounded-lg transition ${
              activeTab === 'notifications'
                ? 'bg-white text-violet-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Alerts
          </button>
        </div>

        {/* ── Tab 1: Profile ─────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Username</span>
                <span className="font-bold text-slate-900">{user?.username}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Email</span>
                <span className="font-bold text-slate-900">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Account Role</span>
                <span className="font-bold uppercase text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-md">
                  {user?.role || 'user'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Active Timezone</span>
                <span className="font-bold text-slate-900">{currentTimezone}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 active:scale-[0.98] transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out from Device</span>
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
                  <div className="text-[10px] uppercase font-bold text-violet-700 tracking-wider">Current Timezone</div>
                  <div className="text-xs font-black text-slate-900 truncate">{currentTimezone}</div>
                </div>
              </div>
              <button
                onClick={handleDetectDeviceTz}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-violet-300 text-violet-700 text-[11px] font-bold shadow-xs hover:bg-violet-600 hover:text-white active:scale-95 transition shrink-0"
              >
                Auto Detect
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
              <span>All database timestamps are stored in <strong>UTC+0</strong>. This timezone adjusts streaks and local schedule timelines.</span>
            </div>
          </div>
        )}

        {/* ── Tab 3: Telegram Bot (Smart 1-Tap Deep-Link) ────────── */}
        {activeTab === 'telegram' && (
          <div className="space-y-3.5 animate-fade-in">
            {tgLoading && !tgConfig ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-500" />
                <p className="text-xs font-bold text-slate-600">Đang kiểm tra kết nối Telegram...</p>
              </div>
            ) : tgConfig?.is_linked ? (
              /* ── STATE 1: ALREADY CONNECTED ── */
              <div className="space-y-3">
                {/* Connected Header Card */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <span>Đã kết nối Telegram</span>
                        <span className="text-[9px] bg-emerald-200/80 text-emerald-800 font-bold px-1.5 py-0.2 rounded-md uppercase font-mono">
                          Online
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                        Chat ID: {tgConfig.telegram_chat_id || 'Đã liên kết'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUpdateTgConfig({ unlink: true })}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-bold active:scale-95 transition flex items-center gap-1 shrink-0"
                    title="Hủy liên kết tài khoản Telegram"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Hủy nối</span>
                  </button>
                </div>

                {/* Reminder Settings Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold text-slate-700">Giờ gửi báo cáo hằng ngày</span>
                    <select
                      value={tgConfig.reminder_time || '20:00'}
                      onChange={e => handleUpdateTgConfig({ reminder_time: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-violet-700 font-mono outline-none cursor-pointer focus:bg-white focus:border-violet-500"
                    >
                      {Array.from({ length: 18 }).map((_, i) => {
                        const h = (i + 6).toString().padStart(2, '0')
                        return <option key={`${h}:00`} value={`${h}:00`}>{h}:00</option>
                      })}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      onClick={() => handleUpdateTgConfig({ notify_task: !(tgConfig.notify_task ?? true) })}
                      className="flex items-center justify-between text-xs font-medium text-slate-800 cursor-pointer p-1 rounded-lg hover:bg-slate-50"
                    >
                      <span>⏰ Nhắc nhở nhiệm vụ đến hạn</span>
                      <input
                        type="checkbox"
                        checked={tgConfig.notify_task ?? true}
                        onChange={() => {}}
                        className="rounded accent-violet-600"
                      />
                    </label>

                    <label
                      onClick={() => handleUpdateTgConfig({ notify_habit: !(tgConfig.notify_habit ?? true) })}
                      className="flex items-center justify-between text-xs font-medium text-slate-800 cursor-pointer p-1 rounded-lg hover:bg-slate-50"
                    >
                      <span>⚡ Nhắc nhở chuỗi thói quen (Streak)</span>
                      <input
                        type="checkbox"
                        checked={tgConfig.notify_habit ?? true}
                        onChange={() => {}}
                        className="rounded accent-violet-600"
                      />
                    </label>

                    <label
                      onClick={() => handleUpdateTgConfig({ notify_daily_report: !(tgConfig.notify_daily_report ?? true) })}
                      className="flex items-center justify-between text-xs font-medium text-slate-800 cursor-pointer p-1 rounded-lg hover:bg-slate-50"
                    >
                      <span>📊 Báo cáo tổng kết ngày & tuần</span>
                      <input
                        type="checkbox"
                        checked={tgConfig.notify_daily_report ?? true}
                        onChange={() => {}}
                        className="rounded accent-violet-600"
                      />
                    </label>
                  </div>
                </div>

                {/* Status Message */}
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

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleTestTelegram}
                    disabled={telegramStatus === 'testing'}
                    className="py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold active:scale-[0.98] transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{telegramStatus === 'testing' ? 'Đang gửi...' : 'Gửi thông báo thử'}</span>
                  </button>

                  <button
                    onClick={fetchTelegramConfig}
                    className="py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold active:scale-[0.98] transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Làm mới</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ── STATE 2: NOT CONNECTED (SMART 1-TAP DEEP LINK) ── */
              <div className="space-y-3">
                {/* Hero Card */}
                <div className="bg-gradient-to-br from-sky-500/10 via-violet-500/10 to-slate-50 border border-sky-200/80 rounded-3xl p-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center mx-auto shadow-md shadow-sky-500/25">
                    <Bot className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900">Liên kết Telegram Bot 1-Chạm</h3>
                    <p className="text-[11px] text-slate-500 font-medium max-w-xs mx-auto mt-1">
                      Nhận thông báo nhắc nhở việc đến hạn, thói quen và báo cáo ngày tức thì qua Bot <strong>@{botUsername}</strong>.
                    </p>
                  </div>

                  {/* Connect Token Display */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-3 flex items-center justify-between gap-2 max-w-xs mx-auto shadow-2xs">
                    <div className="min-w-0 text-left pl-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Mã ghép nối</span>
                      <span className="text-base font-black font-mono tracking-widest text-violet-700">
                        {connectToken}
                      </span>
                    </div>

                    <button
                      onClick={handleCopyToken}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-90 transition flex items-center gap-1 text-[11px] font-bold"
                      title="Sao chép mã ghép nối"
                    >
                      {copiedToken ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                          <span className="text-emerald-600">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 1-Tap Big Action Button */}
                  <a
                    href={directBotLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => sounds.playTap()}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-sky-500/25 active:scale-[0.98] transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>Mở Telegram Bot (@{botUsername})</span>
                  </a>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Sau khi bấm nút, Telegram sẽ mở và tự động gửi <code>/start {connectToken}</code> để kết nối.
                  </p>
                </div>

                {/* Refresh Status Button */}
                <button
                  onClick={fetchTelegramConfig}
                  className="w-full py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-violet-600" />
                  <span>Tôi đã bấm /start trên Bot (Kiểm tra lại)</span>
                </button>

                {/* Collapsible Manual Chat ID Fallback */}
                <div className="pt-1">
                  <button
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 underline block mx-auto transition"
                  >
                    {showManualInput ? 'Ẩn nhập thủ công Chat ID' : 'Hoặc nhập thủ công Chat ID'}
                  </button>

                  {showManualInput && (
                    <form onSubmit={handleManualLinkTelegram} className="mt-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 anim-fade-in">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Nhập số Chat ID (9-10 chữ số)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={manualChatId}
                          onChange={e => setManualChatId(e.target.value)}
                          placeholder="VD: 123456789"
                          className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-violet-500"
                        />
                        <button
                          type="submit"
                          disabled={telegramStatus === 'saving'}
                          className="px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 active:scale-95 transition"
                        >
                          Lưu
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab 4: Notifications ───────── */}
        {activeTab === 'notifications' && (
          <div className="space-y-2.5 animate-fade-in">
            {/* Toggle 1: Task Reminders */}
            <div className="glass rounded-2xl p-3.5 flex items-center justify-between border border-slate-200">
              <div className="pr-3">
                <div className="text-xs font-bold text-slate-900">Task Due Reminders</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Telegram notification when deadlines approach</div>
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
                <div className="text-xs font-bold text-slate-900">Habit Streak Reminders</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Daily reminder to maintain your active streak</div>
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
                <div className="text-xs font-bold text-slate-900">Daily Wrap-up (21:00)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">End-of-day summary of completed tasks & focus hours</div>
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
                <div className="text-xs font-bold text-slate-900">Interactive Sound Effects (Web Audio)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Auditory feedback on task check, streak & timers</div>
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
