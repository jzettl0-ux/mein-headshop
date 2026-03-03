import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/** GET – Alle Voucher-Coupons */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data: coupons, error } = await admin
    .schema('advanced_ops')
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!coupons?.length) return NextResponse.json([])

  const dcIds = [...new Set(coupons.map((c) => c.discount_code_id))]
  const { data: dcRows } = await admin.from('discount_codes').select('id, code, type, value, min_order_amount, max_uses, used_count, valid_until').in('id', dcIds)
  const dcMap = new Map((dcRows ?? []).map((r) => [r.id, r]))

  const enriched = coupons.map((c) => ({ ...c, discount_code: dcMap.get(c.discount_code_id) }))
  return NextResponse.json(enriched)
}

/** POST – Voucher-Coupon anlegen */
export async function POST(request: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const discountCodeId = body.discount_code_id
  const badgeLabel = typeof body.badge_label === 'string' ? body.badge_label.trim() : ''
  if (!discountCodeId || !badgeLabel) {
    return NextResponse.json({ error: 'discount_code_id und badge_label erforderlich' }, { status: 400 })
  }

  const scope = ['all', 'category', 'product'].includes(body.scope) ? body.scope : 'all'
  const scopeValue = typeof body.scope_value === 'string' ? body.scope_value.trim() || null : null
  const budgetEur = typeof body.budget_eur === 'number' && body.budget_eur >= 0 ? body.budget_eur : null
  const isActive = body.is_active !== false

  const admin = createSupabaseAdmin()
  const { data: existing } = await admin.schema('advanced_ops').from('coupons').select('id').eq('discount_code_id', discountCodeId).maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'Für diesen Rabattcode existiert bereits ein Voucher-Coupon.' }, { status: 400 })
  }

  const { data, error } = await admin
    .schema('advanced_ops')
    .from('coupons')
    .insert({
      discount_code_id: discountCodeId,
      badge_label: badgeLabel,
      budget_eur: budgetEur,
      scope,
      scope_value: scopeValue,
      is_active: isActive,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
