import React from 'react'
import {
  Target, Activity, Droplets, BookOpen, Book, Heart, Dumbbell, Coffee,
  Check, Zap, Flame, Brain, Moon, Sun, Shield, Sparkles, Smile, Star,
  Award, Music, Laptop, Feather, Folder, Briefcase, Code, Wallet,
  PieChart, TrendingUp, Tv, AlertTriangle, Smartphone, Clock, Footprints
} from 'lucide-react'

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  target: Target,
  activity: Activity,
  run: Activity,
  running: Activity,
  droplets: Droplets,
  water: Droplets,
  droplet: Droplets,
  book: Book,
  'book-open': BookOpen,
  heart: Heart,
  health: Heart,
  dumbbell: Dumbbell,
  gym: Dumbbell,
  workout: Dumbbell,
  coffee: Coffee,
  morning: Coffee,
  check: Check,
  zap: Zap,
  energy: Zap,
  flame: Flame,
  fire: Flame,
  brain: Brain,
  meditation: Brain,
  mind: Brain,
  moon: Moon,
  sleep: Moon,
  night: Moon,
  sun: Sun,
  day: Sun,
  shield: Shield,
  guard: Shield,
  sparkles: Sparkles,
  smile: Smile,
  star: Star,
  award: Award,
  music: Music,
  laptop: Laptop,
  code: Code,
  work: Briefcase,
  feather: Feather,
  folder: Folder,
  briefcase: Briefcase,
  wallet: Wallet,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  tv: Tv,
  'alert-triangle': AlertTriangle,
  smartphone: Smartphone,
  clock: Clock,
  walk: Footprints,
  walking: Footprints,
  footprints: Footprints,
}

export const renderAppIcon = (
  iconStr?: string | null,
  className: string = "w-5 h-5",
  defaultFallback = "⚡"
): React.ReactNode => {
  if (!iconStr) {
    return <span className="text-base leading-none">{defaultFallback}</span>
  }

  const trimmed = iconStr.trim()
  const lower = trimmed.toLowerCase()

  // 1. Check exact key in icon components
  const Comp = ICON_COMPONENTS[lower]
  if (Comp) {
    return <Comp className={className} />
  }

  // 2. If it's single emoji or short symbol, render as text
  if (trimmed.length <= 4 && !/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return <span className="text-base leading-none">{trimmed}</span>
  }

  // 3. Fallback: Default zap or fallback symbol
  return <Zap className={className} />
}
