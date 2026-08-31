import React, { useState, useEffect } from 'react'
import { 
  Sparkles, 
  CheckSquare, 
  Zap, 
  Clock, 
  Timer, 
  Shield, 
  LogIn, 
  ArrowRight, 
  Flame, 
  Lock, 
  User, 
  KeyRound,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react'
import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'

export const LandingPage: React.FC = () => {
  const { login, backdoorLogin } = useAuthStore()
  const [ssoConfig, setSsoConfig] = useState<{ sso_enabled: boolean; jump_url: string | null } | null>(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const [showLocalModal, setShowLocalModal] = useState(false)
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const featureSlides = [
    {
      id: 'eisenhower',
      title: 'Ma trận Eisenhower',
      subtitle: 'Q1: Do First • Khẩn cấp & Quan trọng',
      desc: 'Phân chia 4 góc phần tư tối ưu hóa nhiệm vụ hàng ngày.',
      icon: CheckSquare,
      color: 'text-violet-400',
      bgGlow: 'from-violet-600/20 to-indigo-600/10',
      borderColor: 'border-violet-500/30',
      badge: 'Do First / Schedule',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      preview: (
        <div className="grid grid-cols-2 gap-2 mt-2 w-full">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-left">
            <div className="text-[10px] font-bold text-rose-300">🚨 Khẩn cấp & Quan trọng</div>
            <div className="text-[11px] font-semibold text-slate-200 truncate mt-0.5">Báo cáo năng suất ngày</div>
          </div>
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-left">
            <div className="text-[10px] font-bold text-violet-300">📅 Lên lịch dài hạn</div>
            <div className="text-[11px] font-semibold text-slate-200 truncate mt-0.5">Học từ vựng N2</div>
          </div>
        </div>
      )
    },
    {
      id: 'pomodoro',
      title: 'Pomodoro Focus Timer',
      subtitle: '25m Focus • 5m Rest • Tự động ghi TimeLog',
      desc: 'Đếm ngược tập trung, thanh nổi Floating Bar luôn ghim đáy màn hình.',
      icon: Timer,
      color: 'text-rose-400',
      bgGlow: 'from-rose-600/20 to-amber-600/10',
      borderColor: 'border-rose-500/30',
      badge: '25:00 Focus',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      preview: (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 w-full mt-2">
          <div className="text-lg font-black font-mono text-white">24:58</div>
          <div className="text-[11px] font-bold text-slate-300 truncate max-w-[130px]">Lập trình Frontend</div>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold">Đang chạy</span>
        </div>
      )
    },
    {
      id: 'habits',
      title: 'Ma trận Thói quen 7 Ngày',
      subtitle: 'Theo dõi Streak T2 → CN chuẩn mực',
      desc: 'Điểm danh 1-chạm bảo vệ chuỗi ngày liên tục không gián đoạn.',
      icon: Zap,
      color: 'text-emerald-400',
      bgGlow: 'from-emerald-600/20 to-teal-600/10',
      borderColor: 'border-emerald-500/30',
      badge: '🔥 Streak 7 Ngày',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      preview: (
        <div className="flex items-center justify-between gap-1 w-full mt-2">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => (
            <div key={day} className="flex-1 text-center">
              <div className="text-[9px] text-slate-400 mb-0.5">{day}</div>
              <div className={`h-6 rounded-md flex items-center justify-center font-bold text-[10px] ${
                idx < 5 ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/40' : 'bg-slate-800 text-slate-500'
              }`}>
                {idx < 5 ? '✓' : '•'}
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'schedule',
      title: 'Lập Lịch Time-Blocking',
      subtitle: 'Chia block khung giờ làm việc & học tập',
      desc: 'Sắp xếp thời gian khoa học, hạn chế xao nhãng trong ngày.',
      icon: Clock,
      color: 'text-cyan-400',
      bgGlow: 'from-cyan-600/20 to-blue-600/10',
      borderColor: 'border-cyan-500/30',
      badge: '4 Khung giờ hôm nay',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      preview: (
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between text-[11px] w-full mt-2">
          <span className="font-mono text-cyan-300 font-bold">08:30 - 10:00</span>
          <span className="font-semibold text-slate-200 truncate mx-2">Deep Work Task</span>
          <span className="text-[9px] text-cyan-400 font-bold shrink-0">✓ Đã xong</span>
        </div>
      )
    }
  ]

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const isBackdoor = params.get('backdoor') === '1'
    if (isBackdoor) {
      setShowLocalModal(true)
    }

    axios.get('/api/v1/auth/config')
      .then(res => {
        setSsoConfig(res.data)
        if (res.data.sso_enabled && !isBackdoor && res.data.jump_url) {
          window.location.href = res.data.jump_url
        }
      })
      .catch(() => {
        setSsoConfig({ sso_enabled: false, jump_url: null })
      })
  }, [])

  // Auto rotate feature preview slide every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % featureSlides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [featureSlides.length])

  const handleSSORedirect = () => {
    if (ssoConfig?.jump_url) {
      window.location.href = ssoConfig.jump_url
    } else {
      window.location.href = 'https://inmind.site/api/auth/jump/timehack-v1'
    }
  }

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập tên tài khoản')
      return
    }
    setErrorMessage(null)
    setIsSubmitting(true)
    const res = await login(username, password)
    setIsSubmitting(false)
    if (!res.success) {
      setErrorMessage(res.error || 'Đăng nhập thất bại')
    }
  }

  const handleQuickAdminLogin = async () => {
    setErrorMessage(null)
    setIsSubmitting(true)
    const res = await backdoorLogin('admin')
    setIsSubmitting(false)
    if (!res.success) {
      setErrorMessage(res.error || 'Lỗi đăng nhập Admin khẩn cấp')
    }
  }

  const currentSlide = featureSlides[activeSlide]
  const SlideIcon = currentSlide.icon

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-[#070A13] text-slate-100 flex flex-col justify-between overflow-hidden p-3 sm:p-6 relative select-none">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* 1. TOP APP BAR */}
      <header className="flex items-center justify-between pt-1 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-violet-500/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-black text-base tracking-wider font-mono text-white leading-none">
              TIME<span className="text-cyan-400">HACK</span>
            </div>
            <div className="text-[9px] font-bold text-violet-400 tracking-wider uppercase mt-0.5">
              Ecosystem Productivity
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowLocalModal(true)}
          className="text-[11px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800 px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 active:scale-95"
        >
          <User className="w-3 h-3 text-violet-400" />
          <span>Nội bộ / Admin</span>
        </button>
      </header>

      {/* 2. MAIN HERO & COMPACT FEATURE CAROUSEL (ZERO SCROLL FIT) */}
      <main className="flex-1 flex flex-col justify-center my-auto max-w-md mx-auto w-full py-2 space-y-3.5">
        {/* Punchy Headline */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-[10px] font-bold">
            <Flame className="w-3 h-3 text-orange-400" />
            <span>Làm Chủ Thời Gian • Bứt Phá Năng Suất</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            Quản Lý Thời Gian <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400">Toàn Diện</span>
          </h1>
        </div>

        {/* Interactive Feature Card (App-Like Card Widget) */}
        <div className={`glass-card rounded-2xl p-3.5 border ${currentSlide.borderColor} shadow-xl relative overflow-hidden transition-all duration-300 bg-gradient-to-b ${currentSlide.bgGlow}`}>
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <SlideIcon className={`w-4 h-4 ${currentSlide.color}`} />
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-white leading-tight">{currentSlide.title}</div>
                <div className="text-[10px] text-slate-400">{currentSlide.subtitle}</div>
              </div>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${currentSlide.badgeColor}`}>
              {currentSlide.badge}
            </span>
          </div>

          {/* Interactive Feature Visual Preview */}
          {currentSlide.preview}

          {/* Carousel Navigation Dots */}
          <div className="flex items-center justify-between pt-3">
            <button
              onClick={() => setActiveSlide(prev => (prev - 1 + featureSlides.length) % featureSlides.length)}
              className="p-1 text-slate-400 hover:text-white transition"
              aria-label="Previous Feature"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5">
              {featureSlides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeSlide === idx ? 'w-5 bg-gradient-to-r from-violet-400 to-cyan-400' : 'w-1.5 bg-slate-700'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setActiveSlide(prev => (prev + 1) % featureSlides.length)}
              className="p-1 text-slate-400 hover:text-white transition"
              aria-label="Next Feature"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ecosystem 3 Badges */}
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-violet-400 mb-0.5" />
            <span className="text-[9px] font-bold text-slate-300 leading-tight">SSO CentralAuth</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mb-0.5" />
            <span className="text-[9px] font-bold text-slate-300 leading-tight">No-localStorage</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
            <span className="text-[9px] font-bold text-slate-300 leading-tight">Telegram Sync</span>
          </div>
        </div>
      </main>

      {/* 3. BOTTOM ACTION DECK (IMMEDIATELY ACCESSIBLE, NO SCROLL) */}
      <footer className="max-w-md mx-auto w-full pb-2 space-y-2">
        <button
          onClick={handleSSORedirect}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-black text-sm shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 transition active:scale-[0.98]"
        >
          <LogIn className="w-4 h-4" />
          <span>Đăng Nhập Với CentralAuth SSO</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="text-center">
          <span className="text-[10px] text-slate-500">
            Hệ sinh thái Ecosystem • CentralAuth OAuth2 Secured
          </span>
        </div>
      </footer>

      {/* 4. LOCAL LOGIN & BACKDOOR MODAL (BOTTOM SHEET STYLE) */}
      {showLocalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-violet-600/20 text-violet-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-white">Đăng Nhập Nội Bộ / Admin</h3>
              </div>
              <button
                onClick={() => setShowLocalModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold text-center">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLocalSubmit} className="space-y-3 text-left">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Tên Đăng Nhập</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ví dụ: admin hoặc tên của bạn"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Mật Khẩu (Tùy chọn)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu nội bộ"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md shadow-violet-600/30 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng Nhập Ngay'}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800" />
                <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-500 uppercase">Hoặc</span>
                <div className="flex-grow border-t border-slate-800" />
              </div>

              {/* Instant Quick Admin Access */}
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                disabled={isSubmitting}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ Đăng Nhập Nhanh Quyền Admin (Backdoor)</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
