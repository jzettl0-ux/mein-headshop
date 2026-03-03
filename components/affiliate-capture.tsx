'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const AFFILIATE_COOKIE = 'affiliate_aff'
const AFFILIATE_STORAGE = 'affiliate_aff'

function setCookie(name: string, value: string, maxAgeDays: number) {
  const maxAge = maxAgeDays * 24 * 60 * 60
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`
}

export function AffiliateCapture() {
  const searchParams = useSearchParams()
  useEffect(() => {
    const aff = searchParams.get('aff')
    if (aff && typeof aff === 'string' && aff.trim().length >= 3) {
      const code = aff.trim().toUpperCase()
      setCookie(AFFILIATE_COOKIE, code, 30)
      try {
        localStorage.setItem(AFFILIATE_STORAGE, code)
      } catch {
        // ignore
      }
    }
  }, [searchParams])
  return null
}

export function getStoredAffiliateCode(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const fromStorage = localStorage.getItem(AFFILIATE_STORAGE)
    if (fromStorage) return fromStorage
    const match = document.cookie.match(new RegExp(`(?:^| )${AFFILIATE_COOKIE}=([^;]+)`))
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}
