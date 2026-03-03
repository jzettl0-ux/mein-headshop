/**
 * Client-Hilfsfunktion: Consent aus Cookie lesen und Events an /api/tracking/event senden.
 * Nur im Browser nutzbar; serverseitige Aufrufe sind No-Ops.
 */

import { getConsentCookie } from '@/lib/consent-v3'
import type { ConsentState } from '@/lib/gtag'

const TRACKING_EVENT_URL = '/api/tracking/event'

export type TrackEventResult = { ok: boolean; forwarded?: boolean; error?: string }

/**
 * Liest den aktuellen Consent aus dem Cookie (cookie_consent_v3).
 * Nur im Browser; auf dem Server wird null zurückgegeben.
 */
export function getConsentFromCookie(): ConsentState | null {
  if (typeof document === 'undefined') return null
  return getConsentCookie()
}

/**
 * Sendet ein Tracking-Event an die API.
 * Consent wird automatisch aus dem Cookie gelesen und mitgeschickt.
 * Die API prüft, ob der Consent für das Event ausreicht, und leitet ggf. an GTM weiter.
 *
 * @param event – Erlaubte Events: page_view, view_item, view_item_list, add_to_cart, remove_from_cart, begin_checkout, purchase, consent_update
 * @param params – Optionale Event-Parameter (keine sensiblen Daten wie E-Mail, IP, User-Agent)
 * @returns { ok, forwarded } oder { ok: false, error }
 */
export async function trackEvent(
  event: string,
  params?: Record<string, unknown>
): Promise<TrackEventResult> {
  if (typeof fetch === 'undefined') {
    return { ok: false, error: 'Not in browser' }
  }

  const consent = getConsentFromCookie()

  try {
    const res = await fetch(TRACKING_EVENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: event.trim(),
        params: params && typeof params === 'object' ? params : {},
        consent: consent ?? undefined,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: (data?.error as string) || res.statusText }
    }
    return { ok: true, forwarded: data?.forwarded }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Request failed'
    return { ok: false, error: message }
  }
}
