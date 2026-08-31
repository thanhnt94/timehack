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
  AlertTriangle
} from 'lucide-react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'

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

  // Telegram Test State
  const [telegramChatId, setTelegramChatId] = useState('')
  const [telegramMessage, setTelegramMessage] = useState('🔔 [TimeHack Admin] Kiểm tra thông báo Telegram Bot!')
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
      }
    } catch (e: any) {
      console.error('Failed to load admin data', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData()
    }
  }, [user])

  const handleSaveSSO = async (e: React.FormEvent) => {
    e.preventDefault()
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
      if (res.data.status === 'ok') {
        setSsoMessage({ type: 'success', text: 'Cập nhật cấu hình SSO CentralAuth thành công!' })
      }
    } catch (e: any) {
      setSsoMessage({ type: 'error', text: e.response?.data?.detail || 'Lỗi lưu cấu hình SSO' })
    } finally {
      setSsoSaving(false)
    }
  }

  const handleTestSSOConnection = async () => {
    setSsoMessage(null)
    try {
      const res = await axios.post('/api/v1/admin/sso/test-connection')
      if (res.data.reachable) {
        setSsoMessage({ type: 'success', text: res.data.message })
      } else {
        setSsoMessage({ type: 'error', text: res.data.message })
      }
    } catch (e: any) {
      setSsoMessage({ type: 'error', text: 'Không thể kết nối tới CentralAuth' })
    }
  }

  const handleSendTelegramTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!telegramChatId.trim()) {
      setTelegramResult({ type: 'error', text: 'Vui lòng nhập Telegram Chat ID' })
      return
    }
    setTelegramSending(true)
    setTelegramResult(null)
    try {
      const res = await axios.post('/api/v1/admin/telegram/test', {
        chat_id: telegramChatId.trim(),
        message: telegramMessage
      })
      if (res.data.status === 'ok') {
        setTelegramResult({ type: 'success', text: `Đã gửi tin nhắn thử nghiệm tới Chat ID: ${telegramChatId}` })
      } else {
        setTelegramResult({ type: 'error', text: 'Gửi tin nhắn thất bại. Vui lòng kiểm tra lại cấu hình Bot Token / CentralAuth Queue' })
      }
    } catch (e: any) {
      setTelegramResult({ type: 'error', text: e.response?.data?.detail || 'Lỗi gửi thông báo Telegram' })
    } finally {
      setTelegramSending(false)
    }
  }

  const handleToggleUserRole = async (targetUser: UserItem) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin'
    try {
      await axios.patch(`/api/v1/admin/users/${targetUser.id}/role`, { role: newRole })
      setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u))
    } catch (e) {
      alert('Không thể thay đổi quyền người dùng')
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white">Yêu Cầu Quyền Quản Trị Viên</h2>
        <p className="text-xs text-slate-400 max-w-md">
          Bạn cần đăng nhập với tài khoản Admin để truy cập trang cấu hình SSO, Telegram và quản lý hệ thống.
        </p>
        <Link
          to="/"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Trang Chủ</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Trung Tâm Quản Trị Hệ Thống</h1>
          </div>
          <p className="text-xs text-slate-400">
            Quản lý cơ chế Single Sign-On (SSO), cấu hình Telegram Notification Hub và giám sát dữ liệu TimeHack.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Người Dùng</span>
            <Users className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-black text-white">{overview?.stats.total_users || 0}</div>
          <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Đã đồng bộ DB
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Nhiệm Vụ (Tasks)</span>
            <CheckSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{overview?.stats.total_tasks || 0}</div>
          <div className="text-[10px] text-slate-400">Ma trận Eisenhower</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Thói Quen (Habits)</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{overview?.stats.total_habits || 0}</div>
          <div className="text-[10px] text-slate-400">Đang theo dõi 7 ngày</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Thời Gian Tập Trung</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{overview?.stats.total_focus_minutes || 0} <span className="text-sm font-normal text-slate-400">phút</span></div>
          <div className="text-[10px] text-slate-400">Phiên Pomodoro / Logs</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('sso')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'sso'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Cấu Hình SSO CentralAuth</span>
        </button>

        <button
          onClick={() => setActiveTab('telegram')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'telegram'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Telegram Notification Hub</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh Sách Người Dùng ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'system'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Hệ Thống & Cơ Sở Dữ Liệu</span>
        </button>
      </div>

      {/* Tab 1: SSO CentralAuth Settings */}
      {activeTab === 'sso' && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-violet-400" />
                Cấu Hình Xác Thực Single Sign-On (CentralAuth)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Tự động chuyển hướng đăng nhập về cổng tập trung CentralAuth cổng 5000 khi được kích hoạt.
              </p>
            </div>

            {/* Master SSO Toggle */}
            <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl">
              <span className={`text-xs font-bold ${ssoEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                {ssoEnabled ? '🟢 Đang Bật SSO' : '⚪ Đang Tắt SSO (Dùng Đăng Nhập Cục Bộ)'}
              </span>
              <button
                type="button"
                onClick={() => setSsoEnabled(!ssoEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                  ssoEnabled ? 'bg-violet-600 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition" />
              </button>
            </div>
          </div>

          {ssoMessage && (
            <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              ssoMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
            }`}>
              {ssoMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{ssoMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveSSO} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">CentralAuth Server URL</label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://inmind.site"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <span className="text-[10px] text-slate-500">Địa chỉ máy chủ định danh trung tâm CentralAuth</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Client ID</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="timehack-v1"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono"
                />
                <span className="text-[10px] text-slate-500">Mã định danh Client đã đăng ký trong CentralAuth</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Client Secret</label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="timehack_secret_123"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono"
                />
                <span className="text-[10px] text-slate-500">Khóa bí mật dùng cho OAuth token exchange</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Redirect URI Callback</label>
                <input
                  type="text"
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  placeholder="https://time.inmind.site/auth-center/callback"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono"
                />
                <span className="text-[10px] text-slate-500">Điểm tiếp nhận mã code sau khi user đăng nhập tại CentralAuth</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleTestSSOConnection}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>Kiểm Tra Kết Nối CentralAuth</span>
              </button>

              <button
                type="submit"
                disabled={ssoSaving}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{ssoSaving ? 'Đang Lưu...' : 'Lưu Cấu Hình SSO'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Telegram Notification Hub */}
      {activeTab === 'telegram' && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              Cấu Hình & Thử Nghiệm Telegram Notification Hub
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Gửi thông báo nhắc việc và tổng kết năng suất hàng ngày qua CentralAuth Queue hoặc Telegram Bot riêng.
            </p>
          </div>

          {telegramResult && (
            <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              telegramResult.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
            }`}>
              {telegramResult.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{telegramResult.text}</span>
            </div>
          )}

          <form onSubmit={handleSendTelegramTest} className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Telegram Chat ID (Người Nhận)</label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="Ví dụ: 123456789"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500">ID tài khoản hoặc nhóm Telegram cần gửi tin nhắn kiểm tra</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Nội Dung Thông Báo (Hỗ Trợ HTML)</label>
              <textarea
                rows={3}
                value={telegramMessage}
                onChange={(e) => setTelegramMessage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={telegramSending}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{telegramSending ? 'Đang Gửi...' : 'Gửi Thử Nghiệm Ngay'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Users Management */}
      {activeTab === 'users' && (
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Danh Sách Người Dùng TimeHack
              </h2>
              <p className="text-xs text-slate-400">Danh sách các tài khoản đã đăng nhập cục bộ hoặc qua SSO.</p>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
              Tổng: {usersList.length} tài khoản
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3 px-3">ID</th>
                  <th className="pb-3 px-3">Tài Khoản</th>
                  <th className="pb-3 px-3">Email</th>
                  <th className="pb-3 px-3">Vai Trò</th>
                  <th className="pb-3 px-3">Nhiệm Vụ</th>
                  <th className="pb-3 px-3">Thói Quen</th>
                  <th className="pb-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-3 font-mono text-slate-400">{u.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center text-[10px] font-bold">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <span>{u.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-semibold">{u.tasks_count}</td>
                    <td className="py-3 px-3 text-slate-300 font-semibold">{u.habits_count}</td>
                    <td className="py-3 px-3 text-right">
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleToggleUserRole(u)}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        >
                          {u.role === 'admin' ? 'Hạ quyền User' : 'Nâng lên Admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: System & Database Details */}
      {activeTab === 'system' && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Thông Tin Cơ Sở Dữ Liệu & Hạ Tầng
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Trạng thái tệp cơ sở dữ liệu SQLite Async WAL Mode và kiến trúc Modular Monolith.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-400">Đường Dẫn Tệp Cơ Sở Dữ Liệu:</span>
              <div className="font-mono text-emerald-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 break-all select-all">
                {overview?.stats.db_path || 'Storage/database/TimeHack.db'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-400">Dung Lượng Tệp Database:</span>
              <div className="font-mono text-cyan-300 text-lg font-bold">
                {overview?.stats.db_size_kb || 0} KB
              </div>
              <div className="text-[10px] text-slate-500">Chế độ ghi: SQLite WAL Mode (Write-Ahead Logging)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
