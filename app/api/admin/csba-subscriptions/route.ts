import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – CSBA (Customer Service by Admin) Subscriptions */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ subscriptions: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('vendor_programs')
      .from('csba_subscriptions')
      .select('subscription_id, vendor_id, fee_per_order, is_active, auto_escalation_enabled, enrolled_at')
      .order('enrolled_at', { ascending: false })

    if (error) return NextResponse.json({ subscriptions: [] }, { status: 200 })
    return NextResponse.json({ subscriptions: data ?? [] })
  } catch {
    return NextResponse.json({ subscriptions: [] }, { status: 200 })
  }
}
