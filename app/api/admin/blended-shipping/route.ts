import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('advanced_financials')
    .from('blended_shipping_rules')
    .select('*')
    .order('cart_vendor_count')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const vendorCount = Math.max(1, Math.floor(Number(body.cart_vendor_count) ?? 1))
  const customerFee = Number(body.customer_shipping_fee)
  const subsidy = Number(body.vendor_subsidy_percentage)
  if (isNaN(customerFee) || customerFee < 0)
    return NextResponse.json({ error: 'customer_shipping_fee ungültig' }, { status: 400 })
  if (isNaN(subsidy) || subsidy < 0)
    return NextResponse.json({ error: 'vendor_subsidy_percentage ungültig' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('advanced_financials')
    .from('blended_shipping_rules')
    .insert({
      cart_vendor_count: vendorCount,
      customer_shipping_fee: Math.round(customerFee * 100) / 100,
      vendor_subsidy_percentage: Math.round(subsidy * 100) / 100,
      is_active: body.is_active !== false,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
