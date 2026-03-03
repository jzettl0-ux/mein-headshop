/**
 * Google Consent Mode v2 (ready).
 * Initialisierung mit Standard "denied" für alle Bereiche; Skripte (GA4, Ads) erst nach Update.
 */

export type ConsentStatus = 'granted' | 'denied'

export interface ConsentState {
  ad_storage: ConsentStatus
  analytics_storage: ConsentStatus
  ad_user_data: ConsentStatus
  ad_personalization: ConsentStatus
}

/** Erweiterte Speicherung (Lieferando-Stil): Funktional separat von Google Consent Mode */
export interface ConsentStateExtended extends ConsentState {
  functional_storage?: ConsentStatus
}

const DEFAULT_DENIED: ConsentState = {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function ensureDataLayer() {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
}

function ensureGtag() {
  if (typeof window === 'undefined') return
  if (typeof window.gtag === 'function') return
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push(args)
  }
}

/**
 * Consent Mode v2: Standard-Status für alle Parameter auf "denied" setzen.
 * Muss vor dem Laden von gtag.js / GTM / GA4 aufgerufen werden.
 */
export function initConsentModeDefault() {
  if (typeof window === 'undefined') return
  ensureDataLayer()
  ensureGtag()
  window.gtag!('consent', 'default', {
    ...DEFAULT_DENIED,
    wait_for_update: 500,
  })
}

/**
 * Nach Nutzerauswahl: Consent aktualisieren.
 * Danach können Skripte (Analytics, Ads) entsprechend der Erlaubnis feuern.
 */
export function updateConsent(state: Partial<ConsentState>) {
  if (typeof window === 'undefined') return
  ensureDataLayer()
  ensureGtag()
  const full: ConsentState = {
    ...DEFAULT_DENIED,
    ...state,
  }
  window.gtag!('consent', 'update', full)
}

export function getDefaultDenied(): ConsentState {
  return { ...DEFAULT_DENIED }
}
