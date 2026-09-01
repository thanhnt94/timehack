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
        setSsoMessage({ type: 'success', text: 'CentralAuth SSO configuration saved successfully!' })
      }
    } catch (e: any) {
      setSsoMessage({ type: 'error', text: e.response?.data?.detail || 'Failed to save SSO configuration' })
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
      setSsoMessage({ type: 'error', text: 'Cannot connect to CentralAuth' })
    }
  }

  const handleSendTelegramTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!telegramChatId.trim()) {
      setTelegramResult({ type: 'error', text: 'Please enter Telegram Chat ID' })
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
        setTelegramResult({ type: 'success', text: `Test message delivered to Chat ID: ${telegramChatId}` })
      } else {
        setTelegramResult({ type: 'error', text: 'Delivery failed. Check Bot Token or Chat ID permissions' })
      }
    } catch (e: any) {
      setTelegramResult({ type: 'error', text: e.response?.data?.detail || 'Error sending Telegram message' })
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
      alert('Failed to update user role')
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Administrator Privileges Required</h2>
        <p className="text-xs text-slate-500 max-w-md">
          You need an Admin role to access CentralAuth SSO configuration and system diagnostics.
        </p>
        <Link
          to="/"
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-xs font-bold text-white inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-700 border border-violet-200">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Admin Console</h1>
          </div>
          <p className="text-xs text-slate-500">
            Manage Single Sign-On (SSO), Telegram Notification Hub, and database metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition active:scale-95 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass rounded-2xl p-4 border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Total Users</span>
            <Users className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{overview?.stats.total_users || 0}</div>
          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Synced with DB
          </div>
        </div>

        <div className="glass rounded-2xl p-4 border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Tasks</span>
            <CheckSquare className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{overview?.stats.total_tasks || 0}</div>
          <div className="text-[10px] text-slate-400 font-medium">Eisenhower Matrix</div>
        </div>

        <div className="glass rounded-2xl p-4 border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Habits</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{overview?.stats.total_habits || 0}</div>
          <div className="text-[10px] text-slate-400 font-medium">Active Streaks</div>
        </div>

        <div className="glass rounded-2xl p-4 border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Focus Time</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{overview?.stats.total_focus_minutes || 0} <span className="text-xs font-normal text-slate-400">mins</span></div>
          <div className="text-[10px] text-slate-400 font-medium">Pomodoro & Logs</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('sso')}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'sso'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>CentralAuth SSO</span>
        </button>

        <button
          onClick={() => setActiveTab('telegram')}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'telegram'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Telegram Notifications</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'system'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>System & Database</span>
        </button>
      </div>

      {/* Tab 1: SSO CentralAuth Settings */}
      {activeTab === 'sso' && (
        <div className="glass rounded-3xl p-6 border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-violet-600" />
                Single Sign-On (CentralAuth) Settings
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Redirects users to CentralAuth SSO gateway when enabled.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
              <span className={`text-xs font-bold ${ssoEnabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                {ssoEnabled ? '🟢 SSO Enabled' : '⚪ SSO Disabled'}
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
                  placeholder="timehack_secret_123"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Redirect URI Callback</label>
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
                <span>Test SSO Connection</span>
              </button>

              <button
                type="submit"
                disabled={ssoSaving}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/25 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{ssoSaving ? 'Saving...' : 'Save SSO Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Telegram Notification Hub */}
      {activeTab === 'telegram' && (
        <div className="glass rounded-3xl p-6 border border-slate-200 space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Telegram Notification Dispatcher
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Test notification delivery via Telegram Bot.
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
              <label className="text-xs font-bold text-slate-700">Recipient Telegram Chat ID</label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="e.g. 123456789"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Notification Body (HTML)</label>
              <textarea
                rows={3}
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
              <span>{telegramSending ? 'Sending...' : 'Send Test Notification'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Users Management */}
      {activeTab === 'users' && (
        <div className="glass rounded-3xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                TimeHack User Directory
              </h2>
              <p className="text-xs text-slate-500">List of local and CentralAuth accounts.</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
              Total: {usersList.length} users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="pb-3 px-3">ID</th>
                  <th className="pb-3 px-3">Account</th>
                  <th className="pb-3 px-3">Email</th>
                  <th className="pb-3 px-3">Role</th>
                  <th className="pb-3 px-3">Tasks</th>
                  <th className="pb-3 px-3">Habits</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono text-slate-400">{u.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <span>{u.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-violet-100 text-violet-700 border border-violet-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-semibold">{u.tasks_count}</td>
                    <td className="py-3 px-3 text-slate-700 font-semibold">{u.habits_count}</td>
                    <td className="py-3 px-3 text-right">
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleToggleUserRole(u)}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
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
        <div className="glass rounded-3xl p-6 border border-slate-200 space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              Database & Infrastructure Details
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              SQLite Async WAL Mode & Modular Monolith architecture health.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
              <span className="font-bold text-slate-500">Database File Path:</span>
              <div className="font-mono text-violet-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 break-all select-all">
                {overview?.stats.db_path || 'Storage/database/TimeHack.db'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
              <span className="font-bold text-slate-500">Database Storage Size:</span>
              <div className="font-mono text-slate-900 text-lg font-bold">
                {overview?.stats.db_size_kb || 0} KB
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Write Mode: SQLite WAL Mode (Write-Ahead Logging)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
