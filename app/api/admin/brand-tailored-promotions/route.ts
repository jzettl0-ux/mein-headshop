import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext, requireAdmin } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const TARGET_AUDIENCES = ['CART_ABANDONERS', 'BRAND_FOLLOWERS', 'REPEAT_CUSTOMERS', 'HIGH_SPENDERS'] as const

/** GET – Brand Tailored Promotions */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ promos: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('marketing')
      .from('brand_tailored_promotions')
      .select('promo_id, vendor_id, target_audience, discount_percentage, valid_from, valid_until, redemption_limit, times_redeemed')
      .order('valid_from', { ascending: false })

    if (error) return NextResponse.json({ promos: [] }, { status: 200 })
    return NextResponse.json({ promos: data ?? [] })
  } catch {
    return NextResponse.json({ promos: [] }, { status: 200 })
  }
}

/** POST – Neue Promotion anlegen (Promo-Segmentierung: target_audience) */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const target_audience = TARGET_AUDIENCES.includes(body.target_audience) ? body.target_audience : null
  const discount_percentage = Number(body.discount_percentage)
  const valid_from = body.valid_from && typeof body.valid_from === 'string' ? body.valid_from.trim() : ''
  const valid_until = body.valid_until && typeof body.valid_until === 'string' ? body.valid_until.trim() : ''
  const redemption_limit = body.redemption_limit != null ? Math.max(0, Math.floor(Number(body.redemption_limit))) : null
  const vendor_id = body.vendor_id && typeof body.vendor_id === 'string' ? body.vendor_id.trim() || null : null

  if (!target_audience) {
    return NextResponse.json({ error: 'target_audience erforderlich (CART_ABANDONERS, BRAND_FOLLOWERS, REPEAT_CUSTOMERS, HIGH_SPENDERS)' }, { status: 400 })
  }
  if (isNaN(discount_percentage) || discount_percentage < 0 || discount_percentage > 100) {
    return NextResponse.json({ error: 'discount_percentage muss zwischen 0 und 100 liegen' }, { status: 400 })
  }
  const fromDate = valid_from ? new Date(valid_from) : null
  const untilDate = valid_until ? new Date(valid_until) : null
  if (!fromDate || isNaN(fromDate.getTime()) || !untilDate || isNaN(untilDate.getTime())) {
    return NextResponse.json({ error: 'valid_from und valid_until (ISO-Datum) erforderlich' }, { status: 400 })
  }
  if (untilDate <= fromDate) {
    return NextResponse.json({ error: 'valid_until muss nach valid_from liegen' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('marketing')
    .from('brand_tailored_promotions')
    .insert({
      vendor_id: vendor_id ?? null,
      target_audience,
      discount_percentage: Math.round(discount_percentage * 100) / 100,
      valid_from: fromDate.toISOString(),
      valid_until: untilDate.toISOString(),
      redemption_limit: redemption_limit ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
