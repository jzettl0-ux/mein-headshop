/**
 * Server-Side Tracking: Events an GTM Server Container senden und in server_event_logs protokollieren.
 * DSGVO: Keine IP, keine exakten User-Agents, keine personenbezogenen Daten an Drittanbieter.
 */

import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

const GTM_SERVER_URL = process.env.GTM_SERVER_COLLECT_URL || process.env.NEXT_PUBLIC_GTM_SERVER_COLLECT_URL

export type ConsentState = {
  ad_storage?: 'granted' | 'denied'
  analytics_storage?: 'granted' | 'denied'
  ad_user_data?: 'granted' | 'denied'
  ad_personalization?: 'granted' | 'denied'
}

/** Erlaubte Event-Namen (Allowlist). */
const ALLOWED_EVENTS = new Set([
  'page_view',
  'view_item',
  'view_item_list',
  'add_to_cart',
  'remove_from_cart',
  'begin_checkout',
  'purchase',
  'consent_update',
])

export function isAllowedEvent(name: string): boolean {
  return typeof name === 'string' && ALLOWED_EVENTS.has(name.trim())
}

/**
 * Prüft, ob Consent für Analytics-Events ausreicht (analytics_storage granted).
 * Für Ad-Events können zusätzlich ad_storage / ad_user_data / ad_personalization geprüft werden.
 */
export function hasSufficientConsent(consent: ConsentState | null | undefined, forEvent: string): boolean {
  if (!consent) return false
  const a = consent.analytics_storage === 'granted'
  const ad = consent.ad_storage === 'granted'
  if (forEvent === 'purchase' || forEvent === 'page_view' || forEvent === 'view_item' || forEvent === 'add_to_cart' || forEvent === 'begin_checkout') {
    return a
  }
  if (forEvent === 'consent_update') return true
  return a || ad
}

/**
 * Entfernt sensible Felder aus Event-Params (keine IP, keine exakten UA, keine E-Mail/Name).
 */
export function sanitizeParams(params: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!params || typeof params !== 'object') return {}
  const forbidden = new Set([
    'ip', 'ip_address', 'user_agent', 'userAgent', 'email', 'user_email', 'client_id', 'user_id',
    'customer_email', 'customer_name', 'billing_address', 'shipping_address',
  ])
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(params)) {
    if (forbidden.has(k.toLowerCase())) continue
    if (v != null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      out[k] = sanitizeParams(v as Record<string, unknown>)
    } else {
      out[k] = v
    }
  }
  return out
}

/**
 * Event in server_event_logs schreiben (nur anonymisierte Metadaten).
 */
export async function logServerEvent(payload: {
  event_name: string
  source: 'client' | 'server'
  consent_ok: boolean
  forwarded: boolean
  params_snapshot?: Record<string, unknown> | null
}): Promise<void> {
  if (!hasSupabaseAdmin()) return
  try {
    const admin = createSupabaseAdmin()
    await admin.from('server_event_logs').insert({
      event_name: payload.event_name,
      source: payload.source,
      consent_ok: payload.consent_ok,
      forwarded: payload.forwarded,
      params_snapshot: payload.params_snapshot ?? null,
    })
  } catch (e) {
    console.error('tracking-server: logServerEvent error', e)
  }
}

/**
 * Anonymisiertes Payload an GTM Server senden (kein IP/UA mitschicken).
 */
export async function forwardToGtm(eventName: string, params: Record<string, unknown>): Promise<boolean> {
  const url = GTM_SERVER_URL?.trim()
  if (!url) return false
  const body = {
    event: eventName,
    params: sanitizeParams(params),
    timestamp: new Date().toISOString(),
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.ok
  } catch (e) {
    console.error('tracking-server: forwardToGtm error', e)
    return false
  }
}

/**
 * Vom Client empfangenes Event: Consent prüfen, anonymisieren, loggen, an GTM weiterleiten.
 */
export async function processClientEvent(
  eventName: string,
  params: Record<string, unknown>,
  consent: ConsentState | null | undefined
): Promise<{ forwarded: boolean }> {
  const allowed = isAllowedEvent(eventName)
  const consentOk = hasSufficientConsent(consent, eventName)
  const safeParams = sanitizeParams(params)
  const forwarded = allowed && consentOk && (await forwardToGtm(eventName, safeParams))

  await logServerEvent({
    event_name: eventName,
    source: 'client',
    consent_ok: consentOk,
    forwarded,
    params_snapshot: Object.keys(safeParams).length ? safeParams : null,
  })

  return { forwarded }
}

/**
 * Purchase-Event serverseitig auslösen (z. B. nach Webhook-Zahlung).
 * Nur aggregierbare Daten (value, currency, order_id anonymisiert/Referenz, items count).
 */
export async function sendPurchaseEvent(payload: {
  order_number: string
  value: number
  currency: string
  item_count: number
  transaction_id?: string
}): Promise<{ forwarded: boolean }> {
  const params = {
    transaction_id: payload.transaction_id ?? payload.order_number,
    value: payload.value,
    currency: payload.currency,
    item_count: payload.item_count,
  }
  const forwarded = await forwardToGtm('purchase', params)

  await logServerEvent({
    event_name: 'purchase',
    source: 'server',
    consent_ok: true,
    forwarded,
    params_snapshot: params,
  })

  return { forwarded }
}
