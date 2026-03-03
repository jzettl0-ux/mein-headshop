import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Buyer Health Scores (Fraud / Concession) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ scores: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('fraud_prevention')
      .from('buyer_health_scores')
      .select('customer_id, total_orders_lifetime, total_returns_lifetime, atoz_claims_filed, concession_rate, requires_signature_on_delivery, returnless_refunds_blocked, last_evaluated_at')
      .order('concession_rate', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ scores: [] }, { status: 200 })
    return NextResponse.json({ scores: data ?? [] })
  } catch {
    return NextResponse.json({ scores: [] }, { status: 200 })
  }
}
