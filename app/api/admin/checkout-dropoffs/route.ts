import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const STEP_LABELS: Record<string, string> = {
  CART_REVIEW: 'Warenkorb',
  ADDRESS_ENTERED: 'Adresse eingegeben',
  SHIPPING_METHOD_SELECTED: 'Versand gewählt',
  PAYMENT_ENTERED: 'Zahlung eingegeben',
}

/** GET – Checkout Funnel Dropoffs */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ dropoffs: [], summary: {} }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('funnel_analytics')
      .from('checkout_dropoffs')
      .select('dropoff_id, cart_id, customer_id, last_completed_step, time_spent_in_checkout_seconds, device_type, abandoned_at')
      .order('abandoned_at', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ dropoffs: [], summary: {} }, { status: 200 })

    const dropoffs = (data ?? []).map((d) => ({
      ...d,
      step_label: STEP_LABELS[(d as { last_completed_step: string }).last_completed_step] ?? (d as { last_completed_step: string }).last_completed_step,
    }))

    const byStep: Record<string, number> = {}
    const byDevice: Record<string, number> = {}
    dropoffs.forEach((d) => {
      const s = (d as { last_completed_step: string }).last_completed_step || 'unknown'
      byStep[s] = (byStep[s] ?? 0) + 1
      const dev = (d as { device_type: string | null }).device_type || 'unknown'
      byDevice[dev] = (byDevice[dev] ?? 0) + 1
    })

    return NextResponse.json({
      dropoffs,
      summary: { byStep, byDevice, total: dropoffs.length },
    })
  } catch {
    return NextResponse.json({ dropoffs: [], summary: {} }, { status: 200 })
  }
}
