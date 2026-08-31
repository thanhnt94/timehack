import React, { useState, useEffect } from 'react'
import { 
  Sparkles, 
  CheckSquare, 
  Zap, 
  Clock, 
  Timer, 
  BarChart3, 
  Shield, 
  LogIn, 
  ArrowRight, 
  Flame, 
  Bell, 
  Lock, 
  User, 
  CheckCircle2,
  KeyRound,
  Layers,
  ChevronRight
} from 'lucide-react'
import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'

export const LandingPage: React.FC = () => {
  const { login, backdoorLogin } = useAuthStore()
  const [ssoConfig, setSsoConfig] = useState<{ sso_enabled: boolean; jump_url: string | null } | null>(null)
  const [activeFeatureTab, setActiveFeatureTab] = useState<'eisenhower' | 'pomodoro' | 'habits' | 'schedule'>('eisenhower')
  const [authMode, setAuthMode] = useState<'sso' | 'local'>('sso')
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const isBackdoor = params.get('backdoor') === '1'
    if (isBackdoor) {
      setAuthMode('local')
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

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 flex flex-col justify-between selection:bg-violet-500/30 selection:text-violet-200 relative overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-2xl sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-black text-lg tracking-wider font-mono text-white">
                TIME<span className="text-cyan-400">HACK</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest text-violet-400 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                Ecosystem Suite
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAuthMode(authMode === 'sso' ? 'local' : 'sso')}
              className="text-xs font-bold text-slate-400 hover:text-slate-200 px-3 py-2 rounded-xl hover:bg-slate-800/60 transition"
            >
              {authMode === 'sso' ? '🔑 Đăng nhập nội bộ' : '🌐 Dùng CentralAuth SSO'}
            </button>
            <button
              onClick={handleSSORedirect}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-violet-600/25 flex items-center gap-1.5 transition active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng Nhập</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        {/* Left Column: Value Proposition & Interactive Feature Preview */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold shadow-sm">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Nền tảng Tối ưu Năng suất & Thời gian Toàn diện</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              Làm Chủ <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400">Thời Gian</span>,
              <br />
              Bứt Phá <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">Hiệu Suất</span>.
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
              Kết hợp hoàn hảo giữa <b>Ma trận Eisenhower</b>, <b>Lịch trình Time-Blocking</b>, <b>Đồng hồ Pomodoro</b> và <b>Ma trận Thói quen 7 ngày</b> để chinh phục mọi mục tiêu trong ngày.
            </p>
          </div>

          {/* Interactive Feature Selector Tabs */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFeatureTab('eisenhower')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeFeatureTab === 'eisenhower'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Ma trận Eisenhower</span>
              </button>
              <button
                onClick={() => setActiveFeatureTab('pomodoro')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeFeatureTab === 'pomodoro'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Pomodoro Focus</span>
              </button>
              <button
                onClick={() => setActiveFeatureTab('habits')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeFeatureTab === 'habits'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Thói quen 7 ngày</span>
              </button>
              <button
                onClick={() => setActiveFeatureTab('schedule')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeFeatureTab === 'schedule'
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Time-Blocking</span>
              </button>
            </div>

            {/* Feature Showcase Card Preview */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl relative overflow-hidden">
              {activeFeatureTab === 'eisenhower' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4" /> Ma trận 4 Góc Eisenhower
                    </span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                      Q1: Do First (Ưu tiên)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Phân loại nhiệm vụ thông minh theo 4 mức độ: <b>Do First</b> (Khẩn cấp), <b>Schedule</b> (Kế hoạch), <b>Delegate</b> (Ủy quyền) và <b>Eliminate</b> (Cắt giảm).
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <div className="text-[11px] font-bold text-rose-300">🚨 Khẩn cấp & Quan trọng</div>
                      <div className="text-xs font-semibold text-slate-200 mt-1 truncate">Hoàn thành báo cáo quý</div>
                    </div>
                    <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                      <div className="text-[11px] font-bold text-violet-300">📅 Lên lịch dài hạn</div>
                      <div className="text-xs font-semibold text-slate-200 mt-1 truncate">Học từ vựng N2 tiếng Nhật</div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeatureTab === 'pomodoro' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Timer className="w-4 h-4" /> Đồng hồ Pomodoro & Floating Bar
                    </span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                      25m Focus • 5m Rest
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Đếm ngược thời gian tập trung với thanh <b>FloatingTimerBar</b> luôn ghim đáy màn hình. Tự động ghi nhận TimeLog và cộng dồn số phút hoàn thành vào Task.
                  </p>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <div className="text-xl font-black font-mono text-white">24 : 58</div>
                    <div className="text-xs font-bold text-slate-400">Đang tập trung: <span className="text-rose-400 font-bold">Lập trình Frontend</span></div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg font-bold">Đang chạy</span>
                  </div>
                </div>
              )}

              {activeFeatureTab === 'habits' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-4 h-4" /> Ma trận Thói quen 7 Ngày
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      🔥 Streak 7 Ngày
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Theo dõi trực quan việc thực hiện thói quen từ Thứ 2 đến Chủ Nhật. Chạm 1-click để ghi nhận và bảo vệ chuỗi ngày liên tục.
                  </p>
                  <div className="flex items-center justify-between gap-1 pt-1">
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => (
                      <div key={day} className="flex-1 text-center">
                        <div className="text-[10px] text-slate-400 mb-1">{day}</div>
                        <div className={`h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          idx < 5 ? 'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-500/30' : 'bg-slate-800/80 text-slate-500 border border-slate-700'
                        }`}>
                          {idx < 5 ? '✓' : '•'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeFeatureTab === 'schedule' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> Lập Lịch Time-Blocking
                    </span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                      Hôm nay: 4 Khung giờ
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Phân bổ khung giờ làm việc và học tập rõ ràng trong ngày, hạn chế xao nhãng và theo dõi tiến độ từng block thời gian.
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between text-xs">
                      <span className="font-mono text-cyan-300 font-bold">08:30 - 10:00</span>
                      <span className="font-bold text-slate-200">Xử lý Task quan trọng (Deep Work)</span>
                      <span className="text-[10px] text-cyan-400 font-bold">✓ Đã xong</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ecosystem Highlights Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-violet-400 shrink-0" />
              <div className="text-[11px] font-bold text-slate-300 leading-tight">SSO CentralAuth Bảo Mật</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="text-[11px] font-bold text-slate-300 leading-tight">Không Dùng localStorage</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-[11px] font-bold text-slate-300 leading-tight">Telegram Bot Nhắc Việc</div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card Gateway */}
        <div className="lg:col-span-5">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl shadow-violet-950/20 relative">
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 mx-auto flex items-center justify-center shadow-lg shadow-violet-500/30 mb-3">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-black text-white">Đăng Nhập TimeHack</h2>
              <p className="text-xs text-slate-400">
                Chọn phương thức đăng nhập để truy cập không gian làm việc của bạn
              </p>
            </div>

            {/* Auth Mode Toggle Tabs */}
            <div className="flex p-1 bg-slate-900/80 rounded-2xl border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => setAuthMode('sso')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  authMode === 'sso'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>CentralAuth SSO</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('local')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  authMode === 'local'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Nội Bộ / Admin</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold text-center">
                {errorMessage}
              </div>
            )}

            {/* Method 1: SSO CentralAuth */}
            {authMode === 'sso' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-violet-950/20 border border-violet-500/20 text-center space-y-2">
                  <div className="text-xs font-bold text-violet-300 flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Hệ thống Định danh Ecosystem Đang Hoạt Động</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sử dụng tài khoản CentralAuth duy nhất của bạn để đăng nhập đồng bộ trên toàn bộ các ứng dụng trong hệ sinh thái.
                  </p>
                </div>

                <button
                  onClick={handleSSORedirect}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập Bằng CentralAuth SSO</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <span className="text-[11px] text-slate-500">
                    Cổng đăng nhập an toàn OAuth2 bảo vệ bởi CentralAuth Hub
                  </span>
                </div>
              </div>
            )}

            {/* Method 2: Local & Backdoor Form */}
            {authMode === 'local' && (
              <form onSubmit={handleLocalSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-300">Tên Đăng Nhập / Username</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ví dụ: admin hoặc tên của bạn"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-300">Mật khẩu (Tùy chọn)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mật khẩu nội bộ"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng Nhập Nội Bộ'}</span>
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800" />
                  <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-500 uppercase">Hoặc</span>
                  <div className="flex-grow border-t border-slate-800" />
                </div>

                {/* Instant Backdoor Admin Button */}
                <button
                  type="button"
                  onClick={handleQuickAdminLogin}
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Đăng Nhập Nhanh Quyền Admin (Backdoor)</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F19]/60 backdrop-blur-md px-6 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2026 <b>TimeHack</b> • Nền tảng Năng suất Thuộc Hệ Sinh Thái <b>Ecosystem</b>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>CentralAuth SSO</span>
            <span>•</span>
            <span>FastAPI Modular Monolith</span>
            <span>•</span>
            <span>SQLite WAL</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
