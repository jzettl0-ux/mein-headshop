'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 32, md: 40, lg: 48 }

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const s = sizeMap[size]
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data: { logo_url?: string }) => {
        if (data.logo_url?.trim()) setLogoUrl(data.logo_url.trim())
      })
      .catch(() => {})
  }, [])

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {logoUrl ? (
        <span
          className="inline-block flex-shrink-0 bg-transparent"
          style={{ width: s, height: s }}
        >
          <img
            src={logoUrl}
            alt="Logo"
            width={s}
            height={s}
            className="block w-full h-full object-contain"
            style={{ display: 'block' }}
          />
        </span>
      ) : (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
          aria-hidden
        >
          <defs>
            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="60%" stopColor="#b8860b" />
              <stop offset="100%" stopColor="#39FF14" />
            </linearGradient>
            <filter id="logo-glow">
              <feGaussianBlur stdDeviation="0.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect
            width="48"
            height="48"
            rx="12"
            fill="url(#logo-grad)"
            filter="url(#logo-glow)"
          />
          <path
            fill="#0A0A0A"
            d="M24 5c16 9 18 23 12 35-4 5-14 5-20 1-8-6-10-22-2-31 4-4 4-5 10-5z"
          />
        </svg>
      )}
      {showText && (
        <span className="text-xl font-bold text-white hidden sm:block tracking-tight">
          Premium Headshop
        </span>
      )}
    </div>
  )
}
