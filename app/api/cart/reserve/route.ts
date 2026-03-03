import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const CART_SESSION_COOKIE = 'cart_session_id'
const RESERVATION_MINUTES = 30

/** Bot-Mitigation: max. 30 Reserve-Anfragen pro IP pro Minute (gegen Inventory Hoarding). */
const RESERVE_RATE_LIMIT = { max: 30, windowSeconds: 60 }

function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'
  return `cart-reserve:${ip}`
}

function getOrCreateSessionId(request: NextRequest): string {
  let sessionId = request.cookies.get(CART_SESSION_COOKIE)?.value
  if (!sessionId || sessionId.length < 10) {
    sessionId = `cart_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`
  }
  return sessionId
}

/**
 * POST – Warenkorb-Reservierung setzen (Bestand für begrenzte Zeit blockieren).
 * Body: { items: [{ product_id, quantity }] }
 * Setzt Cookie cart_session_id falls nicht vorhanden.
 * Rate-Limit pro IP gegen Inventory-Hoarding durch Bots.
 */
export async function POST(request: NextRequest) {
  const { allowed } = checkRateLimit(
    getClientId(request),
    RESERVE_RATE_LIMIT.max,
    RESERVE_RATE_LIMIT.windowSeconds
  )
  if (!allowed) {
    return NextResponse.json(
      { error: 'Zu viele Reservierungsanfragen. Bitte kurz warten.' },
      { status: 429 }
    )
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const raw = body.items
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: 'items (Array) erforderlich' }, { status: 400 })
  }

  const sessionId = getOrCreateSessionId(request)
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString()

  const admin = createSupabaseAdmin()

  try {
    await admin.from('stock_reservations').delete().eq('session_id', sessionId)
  } catch {
    // Tabelle evtl. noch nicht migriert
  }

  const entries = raw
    .filter((r: { product_id?: string; quantity?: number }) => r?.product_id && Math.max(0, Math.floor(Number(r?.quantity) || 0)) > 0)
    .map((r: { product_id: string; quantity: number }) => ({
      session_id: sessionId,
      product_id: r.product_id,
      quantity: Math.min(99, Math.max(1, Math.floor(Number(r.quantity) || 1))),
      expires_at: expiresAt,
    }))

  if (entries.length > 0) {
    try {
      await admin.from('stock_reservations').insert(entries)
    } catch {
      // Tabelle evtl. noch nicht migriert
    }
  }

  const res = NextResponse.json({ ok: true, session_id: sessionId, expires_minutes: RESERVATION_MINUTES })
  res.cookies.set(CART_SESSION_COOKIE, sessionId, {
    path: '/',
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    sameSite: 'lax',
  })
  return res
}
