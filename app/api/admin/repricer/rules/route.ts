/**
 * Repricer: Automatisierte Preisanpassungs-Regeln
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('pricing')
    .from('automated_rules')
    .select(`
      *,
      vendor_offers(id, product_id, unit_price, shipping_price_eur, vendor_id),
      vendor_accounts(id, company_name)
    `)
    .order('updated_at', { ascending: false })

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ rules: [] })
    console.error('[admin/repricer]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ rules: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const { offer_id, vendor_id, min_price, max_price, rule_type, price_offset, is_active } = body

  if (!offer_id || !vendor_id) {
    return NextResponse.json({ error: 'offer_id und vendor_id erforderlich' }, { status: 400 })
  }

  const ruleTypes = ['MATCH_BUY_BOX', 'STAY_BELOW_BUY_BOX', 'MATCH_LOWEST_PRICE']
  const rt = ruleTypes.includes(rule_type) ? rule_type : 'MATCH_BUY_BOX'
  const min = Math.max(0, parseFloat(String(min_price ?? 0).replace(',', '.')) || 0)
  const max = Math.max(min, parseFloat(String(max_price ?? 999).replace(',', '.')) || 999)
  const offset = parseFloat(String(price_offset ?? 0).replace(',', '.')) || 0

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('pricing')
    .from('automated_rules')
    .insert({
      offer_id,
      vendor_id,
      min_price: min,
      max_price: max,
      rule_type: rt,
      price_offset: offset,
      is_active: is_active !== false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
