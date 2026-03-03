import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/coupons/eligible?subtotal=50&category=bongs&product_id=...
 * Liefert aktive Voucher-Badges für Anzeige (Shop, Produktkarten).
 * scope: all | category | product
 */
export async function GET(request: NextRequest) {
  if (!hasSupabaseAdmin()) return NextResponse.json([], { status: 200 })

  const subtotal = Number(request.nextUrl.searchParams.get('subtotal')) || 0
  const category = request.nextUrl.searchParams.get('category') || ''
  const productId = request.nextUrl.searchParams.get('product_id') || ''

  const admin = createSupabaseAdmin()
  const { data: coupons, error } = await admin
    .schema('advanced_ops')
    .from('coupons')
    .select('id, discount_code_id, badge_label, budget_eur, budget_used_eur, scope, scope_value')
    .eq('is_active', true)

  if (error || !coupons?.length) return NextResponse.json([], { status: 200 })

  const dcIds = [...new Set(coupons.map((c) => c.discount_code_id))]
  const { data: discountRows } = await admin.from('discount_codes').select('id, code, type, value, min_order_amount, valid_from, valid_until, max_uses, used_count').in('id', dcIds)
  const dcMap = new Map((discountRows ?? []).map((r) => [r.id, r]))

  const now = new Date()
  const result: { code: string; badge_label: string; scope: string; scope_value: string | null }[] = []

  for (const c of coupons) {
    const dc = dcMap.get(c.discount_code_id)
    if (!dc) continue

    if (c.scope === 'category' && category && c.scope_value !== category) continue
    if (c.scope === 'product' && productId && c.scope_value !== productId) continue

    const validFrom = new Date(dc.valid_from)
    const validUntil = dc.valid_until ? new Date(dc.valid_until) : null
    if (validFrom > now || (validUntil && validUntil < now)) continue
    if (dc.max_uses != null && dc.used_count >= dc.max_uses) continue

    const minOrder = Number(dc.min_order_amount) ?? 0
    if (subtotal > 0 && subtotal < minOrder) continue

    const budgetRemaining = c.budget_eur != null ? Math.max(0, Number(c.budget_eur) - Number(c.budget_used_eur ?? 0)) : Infinity
    if (budgetRemaining <= 0) continue

    result.push({ code: dc.code, badge_label: c.badge_label, scope: c.scope, scope_value: c.scope_value })
  }

  return NextResponse.json(result)
}
