import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  KeyRound, 
  Bell, 
  Users, 
  Database, 
  CheckCircle2, 
  XCircle, 
  Save, 
  Send, 
  RefreshCw, 
  Sparkles, 
  ArrowLeft,
  Lock,
  Globe,
  Clock,
  Zap,
  CheckSquare,
  AlertTriangle,
  Bot,
  ExternalLink,
  ShieldAlert
} from 'lucide-react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'
import { sounds } from '../utils/soundEffects'

interface OverviewData {
  stats: {
    total_users: number
    total_tasks: number
    total_habits: number
    total_focus_minutes: number
    db_size_kb: number
    db_path: string
  }
  sso: {
    is_enabled: boolean
    server_url: string
    client_id: string
    client_secret: string
    redirect_uri: string
    telegram_bot_token?: string
    telegram_bot_username?: string
    telegram_bot_enabled?: boolean
  }
}

interface UserItem {
  id: number
  username: string
  email: string
  full_name?: string
  role: string
  central_auth_id?: number
  created_at?: string
  tasks_count: number
  habits_count: number
}

export const Admin: React.FC = () => {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'sso' | 'telegram' | 'users' | 'system'>('sso')
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [usersList, setUsersList] = useState<UserItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // SSO Form State
  const [ssoEnabled, setSsoEnabled] = useState(true)
  const [serverUrl, setServerUrl] = useState('https://inmind.site')
  const [clientId, setClientId] = useState('timehack-v1')
  const [clientSecret, setClientSecret] = useState('timehack_secret_123')
  const [redirectUri, setRedirectUri] = useState('https://time.inmind.site/auth-center/callback')
  const [ssoSaving, setSsoSaving] = useState(false)
  const [ssoMessage, setSsoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Local Telegram Bot State (when SSO is disabled)
  const [localTgToken, setLocalTgToken] = useState('')
  const [localTgUsername, setLocalTgUsername] = useState('')
  const [localTgEnabled, setLocalTgEnabled] = useState(false)
  const [localTgSaving, setLocalTgSaving] = useState(false)
  const [localTgTesting, setLocalTgTesting] = useState(false)
  const [localTgResult, setLocalTgResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Telegram Test Broadcast State
  const [telegramChatId, setTelegramChatId] = useState('')
  const [telegramMessage, setTelegramMessage] = useState('🔔 [TimeHack Admin] Test Telegram Bot Notification!')
  const [telegramSending, setTelegramSending] = useState(false)
  const [telegramResult, setTelegramResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [overviewRes, usersRes] = await Promise.all([
        axios.get('/api/v1/admin/overview'),
        axios.get('/api/v1/admin/users')
      ])
      setOverview(overviewRes.data)
      setUsersList(usersRes.data)

      if (overviewRes.data.sso) {
        setSsoEnabled(overviewRes.data.sso.is_enabled)
        setServerUrl(overviewRes.data.sso.server_url || 'https://inmind.site')
        setClientId(overviewRes.data.sso.client_id || 'timehack-v1')
        setClientSecret(overviewRes.data.sso.client_secret || 'timehack_secret_123')
        setRedirectUri(overviewRes.data.sso.redirect_uri || 'https://time.inmind.site/auth-center/callback')
        setLocalTgToken(overviewRes.data.sso.telegram_bot_token || '')
        setLocalTgUsername(overviewRes.data.sso.telegram_bot_username || '')
        setLocalTgEnabled(overviewRes.data.sso.telegram_bot_enabled || false)
      }
    } catch (e: any) {
      console.error('Failed to load admin data', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSaveSSO = async (e: React.FormEvent) => {
    e.preventDefault()
    sounds.playTap()
    setSsoSaving(true)
    setSsoMessage(null)

    try {
      const res = await axios.post('/api/v1/admin/sso', {
        is_enabled: ssoEnabled,
        server_url: serverUrl,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      })

      setSsoMessage({ type: 'success', text: 'Cài đặt CentralAuth SSO đã lưu thành công!' })
      sounds.playSuccess()
      fetchData()
    } catch (e: any) {
      setSsoMessage({ type: 'error', text: e.response?.data?.detail || 'Lỗi khi lưu cài đặt SSO' })
    } finally {
      setSsoSaving(false)
    }
  }

  const handleTestSSOConnection = async () => {
    sounds.playTap()
    setSsoMessage({ type: 'success', text: 'Đang kiểm tra kết nối đến máy chủ CentralAuth...' })
    try {
      const res = await axios.post('/api/v1/admin/sso/test-connection')
      if (res.data.status === 'ok') {
        setSsoMessage({ type: 'success', text: `🟢 ${res.data.message}` })
        sounds.playSuccess()
      } else {
        setSsoMessage({ type: 'error', text: `🔴 ${res.data.message}` })
      }
    } catch (e: any) {
      setSsoMessage({ type: 'error', text: e.response?.data?.detail || 'Không thể kết nối đến CentralAuth' })
    }
  }

  const handleSaveLocalTelegram = async (e: React.FormEvent) => {
    e.preventDefault()
    sounds.playTap()
    setLocalTgSaving(true)
    setLocalTgResult(null)

    try {
      await axios.post('/api/v1/admin/telegram', {
        telegram_bot_token: localTgToken.trim(),
        telegram_bot_username: localTgUsername.trim(),
        telegram_bot_enabled: localTgEnabled
      })
      setLocalTgResult({ type: 'success', text: 'Đã lưu cấu hình Telegram Bot nội bộ thành công!' })
      sounds.playSuccess()
      fetchData()
    } catch (e: any) {
      setLocalTgResult({ type: 'error', text: e.response?.data?.detail || 'Lỗi lưu cấu hình Bot' })
    } finally {
      setLocalTgSaving(false)
    }
  }

  const handleTestBotToken = async () => {
    if (!localTgToken.trim()) {
      setLocalTgResult({ type: 'error', text: 'Vui lòng nhập Bot Token trước khi kiểm tra!' })
      return
    }
    sounds.playTap()
    setLocalTgTesting(true)
    setLocalTgResult(null)

    try {
      const res = await axios.post('/api/v1/admin/telegram/test-bot', {
        token: localTgToken.trim()
      })
      if (res.data.status === 'ok') {
        setLocalTgResult({ type: 'success', text: `🟢 ${res.data.message}` })
        if (res.data.bot_username) {
          setLocalTgUsername(`@${res.data.bot_username}`)
        }
        sounds.playSuccess()
      } else {
        setLocalTgResult({ type: 'error', text: `🔴 ${res.data.message}` })
      }
    } catch (e: any) {
      setLocalTgResult({ type: 'error', text: e.response?.data?.detail || 'Lỗi kiểm tra Bot Token' })
    } finally {
      setLocalTgTesting(false)
    }
  }

  const handleSendTelegramTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!telegramChatId.trim()) return

    sounds.playTap()
    setTelegramSending(true)
    setTelegramResult(null)

    try {
      const res = await axios.post('/api/v1/admin/telegram/test', {
        chat_id: telegramChatId.trim(),
        message: telegramMessage.trim()
      })

      if (res.data.status === 'ok' || res.data.sent) {
        setTelegramResult({ type: 'success', text: `Đã gửi thông báo thành công đến Chat ID ${telegramChatId}!` })
        sounds.playSuccess()
      } else {
        setTelegramResult({ type: 'error', text: 'Không thể gửi tin nhắn. Hãy kiểm tra Chat ID hoặc đảm bảo người nhận đã ấn /start với bot.' })
      }
    } catch (e: any) {
      setTelegramResult({ type: 'error', text: e.response?.data?.detail || 'Lỗi khi gửi thông báo Telegram' })
    } finally {
      setTelegramSending(false)
    }
  }

  const handleToggleUserRole = async (userId: number, currentRole: string) => {
    sounds.playTap()
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    try {
      await axios.patch(`/api/v1/admin/users/${userId}/role`, { role: newRole })
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      sounds.playSuccess()
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Không thể đổi vai trò')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-violet-600 animate-spin" />
          <span className="text-xs font-bold text-slate-500">Đang tải Admin Control Hub...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-600/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              TimeHack Admin Control Hub
              <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 px-2 py-0.5 rounded-md">
                Ecosystem
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Quản trị SSO Gateway, Telegram Bot (Dual-Mode), tài khoản & cơ sở dữ liệu.
            </p>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs active:scale-95 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Ứng dụng</span>
        </Link>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Người dùng</span>
            <Users className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{overview?.stats.total_users || 0}</div>
          <div className="text-[10px] text-slate-400 font-medium">Tài khoản hoạt động</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Nhiệm vụ</span>
            <CheckSquare className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{overview?.stats.total_tasks || 0}</div>
          <div className="text-[10px] text-slate-400 font-medium">Eisenhower Matrix</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Thói quen</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{overview?.stats.total_habits || 0}</div>
          <div className="text-[10px] text-slate-400 font-medium">Chuỗi Streaks</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Tập trung</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{overview?.stats.total_focus_minutes || 0} <span className="text-xs font-normal text-slate-400">phút</span></div>
          <div className="text-[10px] text-slate-400 font-medium">Pomodoro & Live Track</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => { sounds.playTap(); setActiveTab('sso') }}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'sso'
              ? 'border-violet-600 text-violet-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>CentralAuth SSO</span>
        </button>

        <button
          onClick={() => { sounds.playTap(); setActiveTab('telegram') }}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'telegram'
              ? 'border-violet-600 text-violet-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Telegram Bot (Dual-Mode)</span>
        </button>

        <button
          onClick={() => { sounds.playTap(); setActiveTab('users') }}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-violet-600 text-violet-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh sách User ({usersList.length})</span>
        </button>

        <button
          onClick={() => { sounds.playTap(); setActiveTab('system') }}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'system'
              ? 'border-violet-600 text-violet-700 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Hệ thống & CSDL</span>
        </button>
      </div>

      {/* ── TAB 1: SSO CentralAuth Settings ── */}
      {activeTab === 'sso' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-violet-600" />
                Cấu hình CentralAuth SSO (Master Switch)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Khi <strong>BẬT</strong>, toàn bộ xác thực & Telegram Bot được quản lý tập trung qua CentralAuth. Khi <strong>TẮT</strong>, TimeHack hoạt động độc lập ở chế độ Standalone.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 px-3 rounded-2xl shrink-0">
              <span className={`text-xs font-black ${ssoEnabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                {ssoEnabled ? '🟢 SSO Bật (Ecosystem Mode)' : '⚪ SSO Tắt (Standalone Mode)'}
              </span>
              <button
                type="button"
                onClick={() => setSsoEnabled(!ssoEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                  ssoEnabled ? 'bg-violet-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition" />
              </button>
            </div>
          </div>

          {/* Mode Explanatory Banner */}
          <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${
            ssoEnabled
              ? 'bg-violet-50/70 border-violet-200 text-violet-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}>
            {ssoEnabled ? (
              <>
                <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <strong>🟢 Chế độ Hệ sinh thái Tập trung (Ecosystem Mode):</strong> Người dùng đăng nhập một chạm qua CentralAuth SSO. Telegram Bot <strong>@InMindBot</strong>, Deep-Link 1-Tap và hàng đợi thông báo được xử lý tập trung. Cấu hình Telegram nội bộ tạm thời bị tắt.
                </div>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>⚪ Chế độ Độc lập (Standalone Mode):</strong> Người dùng đăng nhập trực tiếp bằng tài khoản TimeHack nội bộ. Dịch vụ Telegram Bot nội bộ được kích hoạt (cấu hình tại Tab Telegram bên cạnh).
                </div>
              </>
            )}
          </div>

          {ssoMessage && (
            <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              ssoMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {ssoMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
              <span>{ssoMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveSSO} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">CentralAuth Server URL</label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://inmind.site"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Client ID</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="timehack-v1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Client Secret</label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">SSO Callback Redirect URI</label>
                <input
                  type="text"
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  placeholder="https://time.inmind.site/auth-center/callback"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleTestSSOConnection}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition active:scale-95 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>Kiểm tra kết nối SSO</span>
              </button>

              <button
                type="submit"
                disabled={ssoSaving}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/25 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{ssoSaving ? 'Đang lưu...' : 'Lưu cấu hình SSO'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: Telegram Bot Configuration & Dispatcher ── */}
      {activeTab === 'telegram' && (
        <div className="space-y-6">
          {/* Section 1: CentralAuth Managed vs Local Standalone Bot */}
          {ssoEnabled ? (
            /* When SSO is ENABLED: Centralized Notice */
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">Telegram Bot Tập Trung (@InMindBot)</h2>
                    <p className="text-xs text-slate-500">Được điều phối tự động bởi CentralAuth Queue</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-xl">
                  🟢 CentralAuth Managed
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Khi CentralAuth SSO đang <strong>BẬT</strong>, toàn bộ quy trình liên kết 1-Chạm, lưu Chat ID và gửi thông báo nhắc việc/thói quen được quản lý xuyên suốt qua Bot trung tâm <strong>@InMindBot</strong>.
              </p>
            </div>
          ) : (
            /* When SSO is DISABLED: Local Standalone Bot Form */
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">Cấu hình Telegram Bot Nội Bộ (Standalone)</h2>
                    <p className="text-xs text-slate-500">Dành riêng cho máy chủ TimeHack khi hoạt động độc lập không qua CentralAuth</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 px-3 rounded-2xl">
                  <span className={`text-xs font-bold ${localTgEnabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {localTgEnabled ? '🟢 Bot Bật' : '⚪ Bot Tắt'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLocalTgEnabled(!localTgEnabled)}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition duration-300 ${
                      localTgEnabled ? 'bg-violet-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>
              </div>

              {localTgResult && (
                <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  localTgResult.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {localTgResult.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                  <span>{localTgResult.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveLocalTelegram} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Local Telegram Bot Token (từ @BotFather)</label>
                    <input
                      type="password"
                      value={localTgToken}
                      onChange={(e) => setLocalTgToken(e.target.value)}
                      placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Local Bot Username</label>
                    <input
                      type="text"
                      value={localTgUsername}
                      onChange={(e) => setLocalTgUsername(e.target.value)}
                      placeholder="e.g. @MyTimeHackBot"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleTestBotToken}
                    disabled={localTgTesting}
                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition active:scale-95 shadow-xs disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>{localTgTesting ? 'Đang kiểm tra...' : 'Kiểm tra Token với Telegram'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={localTgSaving}
                    className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/25 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{localTgSaving ? 'Đang lưu...' : 'Lưu Bot nội bộ'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Section 2: Test Message Dispatcher */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-200">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-violet-600" />
                Gửi thông báo thử nghiệm (Broadcast / Direct Test)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm tra khả năng gửi tin nhắn đến một Chat ID cụ thể qua kênh hiện tại ({ssoEnabled ? 'CentralAuth Queue' : 'Local Bot'}).
              </p>
            </div>

            {telegramResult && (
              <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                telegramResult.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {telegramResult.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                <span>{telegramResult.text}</span>
              </div>
            )}

            <form onSubmit={handleSendTelegramTest} className="space-y-3.5 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Người nhận (Telegram Chat ID)</label>
                <input
                  type="text"
                  required
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="VD: 123456789"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nội dung thông báo (HTML)</label>
                <textarea
                  rows={3}
                  required
                  value={telegramMessage}
                  onChange={(e) => setTelegramMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={telegramSending}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/25 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{telegramSending ? 'Đang gửi...' : 'Gửi thông báo thử'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 3: Users Management ── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                Danh bạ người dùng TimeHack
              </h2>
              <p className="text-xs text-slate-500">Danh sách tài khoản nội bộ và liên kết CentralAuth.</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
              Tổng số: {usersList.length} người dùng
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="pb-3 px-3">ID</th>
                  <th className="pb-3 px-3">Tài khoản</th>
                  <th className="pb-3 px-3">Email</th>
                  <th className="pb-3 px-3">Vai trò</th>
                  <th className="pb-3 px-3">Tasks</th>
                  <th className="pb-3 px-3">Habits</th>
                  <th className="pb-3 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono text-slate-400">{u.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold">
                          {u.full_name?.charAt(0) || u.username.charAt(0)}
                        </div>
                        <span>{u.username}</span>
                        {u.central_auth_id && (
                          <span className="text-[9px] bg-sky-100 text-sky-700 px-1 py-0.2 rounded font-mono font-bold" title={`SSO ID: ${u.central_auth_id}`}>
                            SSO
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        u.role === 'admin' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">{u.tasks_count}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">{u.habits_count}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleToggleUserRole(u.id, u.role)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition active:scale-95 ${
                          u.role === 'admin'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200'
                        }`}
                      >
                        {u.role === 'admin' ? 'Hạ quyền User' : 'Nâng lên Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: System & Database ── */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              Thông tin Hệ thống & Cơ sở dữ liệu SQLite
            </h2>
            <p className="text-xs text-slate-500 mt-1">Thông số hoạt động và đường dẫn tệp CSDL trên máy chủ VPS.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Đường dẫn tệp SQLite</span>
              <div className="text-xs font-mono font-bold text-slate-900 break-all">
                {overview?.stats.db_path || 'sqlite+aiosqlite:///timehack_async.db'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dung lượng Database</span>
              <div className="text-xs font-mono font-black text-slate-900">
                {overview?.stats.db_size_kb || 0} KB
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Giao thức Mạng</span>
              <div className="text-xs font-mono font-bold text-emerald-700">
                HTTP Proxy (Port 5055) + Nginx SSL
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chế độ Hoạt động</span>
              <div className="text-xs font-mono font-bold text-violet-700">
                {ssoEnabled ? 'Ecosystem CentralAuth' : 'Standalone Local Hub'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
