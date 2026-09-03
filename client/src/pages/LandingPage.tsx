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
    if (!res.success) setError(res.error || 'Login failed')
    setLoading(false)
  }

  const handleBackdoor = async () => {
    setLoading(true)
    const res = await backdoorLogin('admin')
    if (!res.success) setError(res.error || 'Error')
    setLoading(false)
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F8FAFC] overflow-hidden select-none">
      {/* ── Top: Hero ─────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {/* Rapid the Mascot 3D Hero Illustration */}
        <div className="relative mb-5 group">
          <div className="h-44 sm:h-52 relative flex items-center justify-center transition-transform duration-500 hover:scale-105 active:scale-95">
            <img
              src="/mascot/rapid_3d_mascot.png"
              alt="Rapid the Bunny - TimeHack Mascot"
              className="h-full w-auto object-contain drop-shadow-xl"
            />
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-violet-600 text-white text-[11px] font-black tracking-wide shadow-md shadow-violet-600/30 whitespace-nowrap">
            Meet Rapid 🐰⚡
          </div>
        </div>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center font-mono">
          TIME<span className="text-violet-600">HACK</span>
        </h1>
        <p className="text-sm text-slate-500 mt-2 text-center max-w-xs font-medium">
          Personal time management & focus hub.<br />
          Beat the clock. Deep focus. Master your time.
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
          <span>Sign In with CentralAuth</span>
        </a>

        {/* Secondary: Direct login */}
        <button
          onClick={() => { sounds.playTap(); setSheetOpen(true) }}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs active:scale-[0.98] transition hover:bg-slate-50 shadow-sm"
        >
          <KeyRound className="w-3.5 h-3.5 text-slate-500" />
          <span>Direct Login</span>
        </button>
      </div>

      {/* ── Bottom sheet: Login form ──── */}
      {sheetOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
          <div className="sheet-content max-w-lg mx-auto">
            <div className="sheet-handle" />

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-900">Direct Sign In</h2>
              <button onClick={() => setSheetOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username"
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:bg-white transition"
              />

              {error && (
                <p className="text-xs text-rose-600 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm active:scale-[0.98] transition shadow-md shadow-violet-600/20 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
