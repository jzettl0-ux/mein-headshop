import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getLoyaltySettings, recalculateAllTiers } from '@/lib/loyalty'
import { checkRateLimit } from '@/lib/rate-limit'
import type { LoyaltySettings } from '@/lib/loyalty'

export const dynamic = 'force-dynamic'

const NUM_SETTING_KEYS: (keyof LoyaltySettings)[] = [
  'points_per_euro',
  'points_per_review',
  'points_per_eur_discount',
  'silver_min_points',
  'gold_min_points',
  'silver_discount_percent',
  'gold_discount_percent',
  'min_order_eur_for_discount',
]

/** GET – Top-Kunden nach Punkten + aktuelle Einstellungen */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const settings = await getLoyaltySettings(admin)

  const { data: accounts } = await admin
    .from('loyalty_accounts')
    .select('user_id, points_balance, tier')
    .order('points_balance', { ascending: false })
    .limit(50)

  const userIds = (accounts ?? []).map((a) => a.user_id).filter(Boolean)
  const emailByUser: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: orders } = await admin
      .from('orders')
      .select('user_id, customer_email')
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
    const seen = new Set<string>()
    for (const o of orders ?? []) {
      const uid = o.user_id as string
      if (uid && !seen.has(uid)) {
        seen.add(uid)
        emailByUser[uid] = (o.customer_email as string) ?? ''
      }
    }
  }

  const topCustomers = (accounts ?? []).map((a) => ({
    user_id: a.user_id,
    points_balance: a.points_balance,
    tier: a.tier,
    email: emailByUser[a.user_id] ?? null,
  }))

  return NextResponse.json({ topCustomers, settings })
}

function getClientId(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  return `loyalty-patch:${ip}`
}

/** PATCH – Globale Loyalty-Einstellungen aktualisieren */
export async function PATCH(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const rl = checkRateLimit(getClientId(req), 30, 60)
  if (!rl.allowed) return NextResponse.json({ error: 'Zu viele Änderungen. Bitte kurz warten.' }, { status: 429 })

  const body = await req.json().catch(() => ({}))
  const admin = createSupabaseAdmin()

  if (body.enabled !== undefined) {
    const enabled = body.enabled === true || body.enabled === 'true' || body.enabled === 1
    const { error } = await admin
      .from('loyalty_settings')
      .upsert({ key: 'enabled', value: enabled ? 'true' : 'false', updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) {
      console.error('loyalty_settings upsert enabled:', error)
      return NextResponse.json({ error: 'Einstellung konnte nicht gespeichert werden' }, { status: 500 })
    }
  }

  const anyNumSettingChanged = NUM_SETTING_KEYS.some((k) => body[k] !== undefined)

  for (const key of NUM_SETTING_KEYS) {
    const value = body[key]
    if (value === undefined) continue
    const num = Number(value)
    if (!Number.isFinite(num) || num < 0) continue
    await admin
      .from('loyalty_settings')
      .upsert({ key, value: String(num), updated_at: new Date().toISOString() }, { onConflict: 'key' })
  }

  const settings = await getLoyaltySettings(admin)

  if (anyNumSettingChanged) {
    const updated = await recalculateAllTiers(admin)
    if (updated > 0) {
      console.log(`[Loyalty] ${updated} Kundentiers neu berechnet`)
    }
  }

  return NextResponse.json({ ok: true, settings })
}
