import React from 'react'

export interface TimeHackLogoProps {
  className?: string
  mode?: 'horizontal' | 'icon'
  height?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  size?: number | string
  iconOnly?: boolean
  animated?: boolean
  variant?: 'avatar' | 'transparent'
  state?: 'default' | 'celebrate' | 'sleepy' | 'focus'
}

export const TimeHackLogo: React.FC<TimeHackLogoProps> = ({
  className = '',
  mode = 'horizontal',
  height = 'md',
  size,
  iconOnly = false,
  animated = false,
  variant = 'avatar',
  state = 'default'
}) => {
  const isHorizontal = mode === 'horizontal' && !iconOnly

  // Tailored heights matching standard mobile and desktop header dimensions
  const heightClasses = {
    xs: 'h-6 sm:h-7',             // 24px - 28px (compact badges)
    sm: 'h-8 sm:h-9',             // 32px - 36px (mobile header bar)
    md: 'h-10 sm:h-11',           // 40px - 44px (desktop sidebar brand)
    lg: 'h-14 sm:h-16',           // 56px - 64px (hero sections)
    xl: 'h-20 sm:h-24 md:h-28'    // 80px - 112px (landing page hero)
  }[height] || 'h-10 sm:h-11'

  // Pick 3D Mascot asset
  const iconSrc = variant === 'transparent'
    ? '/mascot/rapid_3d_mascot.png'
    : '/mascot/rapid_3d_avatar.png'

  // Icon only / Square 3D Mascot avatar mode
  if (!isHorizontal) {
    return (
      <div className={`inline-flex items-center justify-center select-none group cursor-pointer ${className}`}>
        <div
          className={`relative flex items-center justify-center shrink-0 transition-transform duration-300 ease-out group-hover:scale-105 active:scale-95 ${heightClasses} ${
            animated ? 'animate-bounce-subtle' : ''
          }`}
          style={size ? { width: size, height: size } : undefined}
        >
          <img
            src={iconSrc}
            alt="Rapid 3D Mascot - TimeHack"
            className="w-full h-full object-contain drop-shadow-sm pointer-events-none rounded-2xl"
            loading="eager"
          />
        </div>
      </div>
    )
  }

  // Full Horizontal Brand Logo Mode (3D Mascot Avatar + Modern TimeHack Typography)
  return (
    <div className={`inline-flex items-center select-none group cursor-pointer ${className}`}>
      <div
        className={`relative flex items-center shrink-0 transition-transform duration-300 ease-out group-hover:scale-[1.02] active:scale-95 ${heightClasses}`}
        style={size ? { height: size } : undefined}
      >
        <img
          src="/mascot/timehack_logo_3d.png"
          alt="TimeHack - Productivity & Focus Hub"
          className="h-full w-auto max-w-none object-contain drop-shadow-xs pointer-events-none"
          loading="eager"
        />
      </div>
    </div>
  )
}

export default TimeHackLogo
