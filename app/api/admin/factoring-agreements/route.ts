import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – B2B Factoring Agreements */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ agreements: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('b2b_finance')
      .from('factoring_agreements')
      .select('agreement_id, b2b_customer_id, factoring_provider, approved_credit_limit, current_utilized_credit, payment_terms_days, status, last_api_sync_at')
      .order('last_api_sync_at', { ascending: false, nullsFirst: false })

    if (error) return NextResponse.json({ agreements: [] }, { status: 200 })
    return NextResponse.json({ agreements: data ?? [] })
  } catch {
    return NextResponse.json({ agreements: [] }, { status: 200 })
  }
}
