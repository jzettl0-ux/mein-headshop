import { NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/affiliate-commissions
 * Liste aller Affiliate-Provisionen mit Partner- und Bestelldaten.
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('advanced_ops')
    .from('affiliate_commissions')
    .select(`
      id,
      order_id,
      order_total,
      commission_eur,
      status,
      created_at,
      paid_at,
      affiliate_links(code, partner_name),
      orders(order_number, total, customer_email)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
