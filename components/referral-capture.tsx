'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const REFERRAL_COOKIE = 'referral_ref'
const REFERRAL_STORAGE = 'referral_ref'
const MAX_AGE_DAYS = 30

function setCookie(name: string, value: string) {
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`
}

export function ReferralCapture() {
  const searchParams = useSearchParams()
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref && typeof ref === 'string' && ref.trim().length >= 4) {
      const code = ref.trim().toUpperCase()
      setCookie(REFERRAL_COOKIE, code)
      try {
        localStorage.setItem(REFERRAL_STORAGE, code)
      } catch {
        // ignore
      }
    }
  }, [searchParams])
  return null
}

export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const fromStorage = localStorage.getItem(REFERRAL_STORAGE)
    if (fromStorage) return fromStorage
    const match = document.cookie.match(new RegExp(`(?:^| )${REFERRAL_COOKIE}=([^;]+)`))
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

export function clearStoredReferralCode(): void {
  try {
    localStorage.removeItem(REFERRAL_STORAGE)
    document.cookie = `${REFERRAL_COOKIE}=;path=/;max-age=0`
  } catch {
    // ignore
  }
}

/** Empfehlungscode speichern (z. B. aus Registrierungsformular). */
export function setStoredReferralCode(code: string): void {
  const value = typeof code === 'string' ? code.trim().toUpperCase() : ''
  if (!value || value.length < 4) {
    clearStoredReferralCode()
    return
  }
  setCookie(REFERRAL_COOKIE, value)
  try {
    localStorage.setItem(REFERRAL_STORAGE, value)
  } catch {
    // ignore
  }
}
