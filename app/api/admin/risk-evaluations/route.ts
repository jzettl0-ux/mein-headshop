import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Liste Risk Evaluations (Blueprint Phase 8: Deep Tech).
 * deep_tech.risk_evaluations mit Bestellnummer für Link.
 */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  try {
    const admin = createSupabaseAdmin()
    const { data: rows, error } = await admin
      .schema('deep_tech')
      .from('risk_evaluations')
      .select('evaluation_id, order_id, customer_id, cart_total, contains_high_risk_item, required_avs_level, evaluated_at')
      .order('evaluated_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('[risk-evaluations] list error:', error.message)
      return NextResponse.json({ evaluations: [] })
    }

    const orderIds = [...new Set((rows ?? []).map((r) => r.order_id).filter(Boolean))]
    const orderNumbers: Record<string, string> = {}
    if (orderIds.length > 0) {
      const { data: orders } = await admin.from('orders').select('id, order_number').in('id', orderIds)
      ;(orders ?? []).forEach((o: { id: string; order_number: string }) => {
        orderNumbers[o.id] = o.order_number ?? o.id
      })
    }

    const evaluations = (rows ?? []).map((r) => ({
      ...r,
      order_number: orderNumbers[r.order_id] ?? r.order_id,
    }))

    return NextResponse.json({ evaluations })
  } catch (e) {
    console.error('[risk-evaluations] error:', e)
    return NextResponse.json({ evaluations: [] })
  }
}
