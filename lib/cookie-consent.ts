/**
 * Cookie-Consent: Speicherung und Abfrage (DSGVO/DDG).
 * Essential = immer true (Betrieb der Seite). Analytics & Marketing = Opt-in für Werbung/Analytics.
 */

export const COOKIE_CONSENT_STORAGE_KEY = 'cookie-consent'

export type CookieConsent = {
  essential: boolean
  analyticsMarketing: boolean
  version: number
  date: string
}

const DEFAULT_CONSENT: CookieConsent = {
  essential: true,
  analyticsMarketing: false,
  version: 1,
  date: new Date().toISOString(),
}

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CookieConsent
    if (parsed && typeof parsed.essential === 'boolean' && typeof parsed.analyticsMarketing === 'boolean') {
      return { ...DEFAULT_CONSENT, ...parsed }
    }
  } catch {
    // ignore
  }
  return null
}

export function saveConsent(consent: Partial<CookieConsent>) {
  const full: CookieConsent = {
    ...DEFAULT_CONSENT,
    ...consent,
    date: new Date().toISOString(),
  }
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(full))
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: full }))
  } catch {
    // ignore
  }
}

export function hasUserChosen(): boolean {
  return getStoredConsent() !== null
}

export function mayUseAnalyticsMarketing(): boolean {
  const c = getStoredConsent()
  return c?.analyticsMarketing === true
}

/** Event-Name zum Öffnen der Cookie-Einstellungen (z. B. aus Footer). */
export const OPEN_COOKIE_SETTINGS_EVENT = 'open-cookie-settings'
