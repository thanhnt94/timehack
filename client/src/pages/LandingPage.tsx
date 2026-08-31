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
    <div className="h-[100dvh] flex flex-col bg-[#F8FAFC] overflow-hidden select-none">
      {/* ── Top: Hero ─────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        <div className="w-16 h-16 rounded-3xl bg-violet-600 flex items-center justify-center shadow-xl shadow-violet-600/25 mb-6">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center font-mono">
          TIME<span className="text-violet-600">HACK</span>
        </h1>
        <p className="text-sm text-slate-500 mt-2 text-center max-w-xs font-medium">
          Quản lý thời gian & năng suất cá nhân.<br />
          Tập trung sâu. Xây thói quen. Đạt mục tiêu.
        </p>
      </div>

      {/* ── Bottom: CTA buttons ───────── */}
      <div className="shrink-0 px-6 pb-[calc(24px+var(--safe-bottom))] space-y-3">
        {/* Primary: CentralAuth SSO */}
        <a
          href={ssoUrl}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-md shadow-violet-600/25 active:scale-[0.98] transition"
        >
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          <span>Đăng nhập với CentralAuth</span>
        </a>

        {/* Secondary: Internal login */}
        <button
          onClick={() => { sounds.playTap(); setSheetOpen(true) }}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs active:scale-[0.98] transition hover:bg-slate-50 shadow-sm"
        >
          <KeyRound className="w-3.5 h-3.5 text-slate-500" />
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
              <h2 className="text-sm font-black text-slate-900">Đăng Nhập Nội Bộ</h2>
              <button onClick={() => setSheetOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
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
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:bg-white transition"
              />

              {error && (
                <p className="text-xs text-rose-600 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm active:scale-[0.98] transition disabled:opacity-50 shadow-md shadow-violet-600/20"
              >
                {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={handleBackdoor}
                disabled={loading}
                className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold active:scale-[0.98] transition disabled:opacity-50"
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
