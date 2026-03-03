/**
 * Cookie-Consent-Center v3 – Google Consent Mode v2.
 * Speicherung in Cookie (1 Jahr), Abfrage, Event zum erneuten Öffnen.
 * Lieferando-Stil: 4 Kategorien (Notwendig, Funktional, Analyse, Personalisierung).
 */

import type { ConsentState, ConsentStateExtended } from './gtag'

export const CONSENT_COOKIE_NAME = 'cookie_consent_v3'
export const CONSENT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 Jahr in Sekunden

export const OPEN_CONSENT_BANNER_EVENT = 'open-cookie-settings'

function isValidConsentStatus(v: string): boolean {
  return v === 'granted' || v === 'denied'
}

export function getConsentCookie(): ConsentState | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE_NAME}=([^;]*)`))
  const value = match ? decodeURIComponent(match[1].trim()) : null
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as ConsentStateExtended
    if (
      parsed &&
      isValidConsentStatus(parsed.ad_storage) &&
      isValidConsentStatus(parsed.analytics_storage) &&
      isValidConsentStatus(parsed.ad_user_data) &&
      isValidConsentStatus(parsed.ad_personalization)
    ) {
      return {
        ad_storage: parsed.ad_storage,
        analytics_storage: parsed.analytics_storage,
        ad_user_data: parsed.ad_user_data,
        ad_personalization: parsed.ad_personalization,
      }
    }
  } catch {
    // ignore
  }
  return null
}

export function getConsentCookieExtended(): ConsentStateExtended | null {
  const base = getConsentCookie()
  if (!base) return null
  if (typeof document === 'undefined') return { ...base, functional_storage: 'denied' }
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE_NAME}=([^;]*)`))
  const value = match ? decodeURIComponent(match[1].trim()) : null
  if (!value) return { ...base, functional_storage: 'denied' }
  try {
    const parsed = JSON.parse(value) as ConsentStateExtended
    const fn = parsed.functional_storage
    return {
      ...base,
      functional_storage: fn && isValidConsentStatus(fn) ? fn : 'denied',
    }
  } catch {
    return { ...base, functional_storage: 'denied' }
  }
}

export function setConsentCookie(state: ConsentState | ConsentStateExtended) {
  if (typeof document === 'undefined') return
  const value = encodeURIComponent(JSON.stringify(state))
  document.cookie = `${CONSENT_COOKIE_NAME}=${value};path=/;max-age=${CONSENT_COOKIE_MAX_AGE};SameSite=Lax`
}

export function hasConsentChoice(): boolean {
  return getConsentCookie() !== null
}
