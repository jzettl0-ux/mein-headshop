import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Returnless Refund Rules */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ rules: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('margins')
      .from('returnless_refund_rules')
      .select('rule_id, vendor_id, category_id, max_price_threshold, return_reason_condition, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ rules: [] }, { status: 200 })
    return NextResponse.json({ rules: data ?? [] })
  } catch {
    return NextResponse.json({ rules: [] }, { status: 200 })
  }
}
