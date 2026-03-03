import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Third-Party Warranty Plans */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ plans: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('catalog')
      .from('warranty_plans')
      .select('plan_id, applicable_category, min_product_price, max_product_price, insurance_provider_id, plan_price, broker_commission_percentage, is_active, created_at')
      .order('min_product_price', { ascending: true })

    if (error) return NextResponse.json({ plans: [] }, { status: 200 })
    return NextResponse.json({ plans: data ?? [] })
  } catch {
    return NextResponse.json({ plans: [] }, { status: 200 })
  }
}
