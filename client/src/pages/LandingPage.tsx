import React, { useState } from 'react'
import { Sparkles, ArrowRight, KeyRound, X } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { sounds } from '../utils/soundEffects'

export const LandingPage: React.FC = () => {
  const { login, backdoorLogin } = useAuthStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const ssoUrl = 'https://inmind.site/api/auth/jump/timehack-v1'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    setError('')
    const res = await login(username)
    if (!res.success) setError(res.error || 'Đăng nhập thất bại')
    setLoading(false)
  }

  const handleBackdoor = async () => {
    setLoading(true)
    const res = await backdoorLogin('admin')
    if (!res.success) setError(res.error || 'Lỗi')
    setLoading(false)
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-[var(--surface-base)] overflow-hidden select-none">
      {/* ── Top: Hero ─────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {/* Ambient glow */}
        <div className="absolute w-64 h-64 rounded-full bg-violet-600/10 blur-[100px] -z-10" />
        <div className="absolute w-48 h-48 rounded-full bg-cyan-500/8 blur-[80px] translate-x-20 translate-y-10 -z-10" />

        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-violet-600/30 mb-6">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight text-center font-mono">
          TIME<span className="text-cyan-400">HACK</span>
        </h1>
        <p className="text-sm text-slate-400 mt-2 text-center max-w-xs">
          Quản lý thời gian & năng suất cá nhân.<br />
          Tập trung sâu. Xây thói quen. Đạt mục tiêu.
        </p>
      </div>

      {/* ── Bottom: CTA buttons ───────── */}
      <div className="shrink-0 px-6 pb-[calc(24px+var(--safe-bottom))] space-y-3">
        {/* Primary: CentralAuth SSO */}
        <a
          href={ssoUrl}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 text-white font-bold text-sm shadow-lg shadow-violet-600/30 active:scale-[0.97] transition-transform"
        >
          <ArrowRight className="w-4 h-4" />
          <span>Đăng nhập với CentralAuth</span>
        </a>

        {/* Secondary: Internal login */}
        <button
          onClick={() => { sounds.playTap(); setSheetOpen(true) }}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-[var(--border-default)] text-slate-300 font-semibold text-xs active:scale-[0.97] transition-transform hover:bg-white/[0.03]"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Đăng nhập nội bộ</span>
        </button>
      </div>

      {/* ── Bottom sheet: Login form ──── */}
      {sheetOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
          <div className="sheet-content">
            <div className="sheet-handle" />

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-white">Đăng Nhập Nội Bộ</h2>
              <button onClick={() => setSheetOpen(false)} className="p-1 text-slate-400 active:scale-90 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Tên đăng nhập"
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-[var(--border-default)] text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 transition"
              />

              {error && (
                <p className="text-xs text-rose-400 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold text-sm active:scale-[0.97] transition-transform disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
              <button
                onClick={handleBackdoor}
                disabled={loading}
                className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-400 text-xs font-semibold active:scale-[0.97] transition disabled:opacity-50"
              >
                🔑 Đăng nhập Admin (Backdoor)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
