import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Liste aller Retourenprüfungen (Blueprint Phase 6: Enforcement).
 * Liefert advanced_ops.return_inspections mit Bestellnummer für Link zur Bestellung.
 */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  try {
    const admin = createSupabaseAdmin()
    const { data: rows, error } = await admin
      .schema('advanced_ops')
      .from('return_inspections')
      .select('id, order_id, status, condition_code, restocking_fee_cents, notes, received_at, inspected_at, inspected_by_email, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[return-inspections] list error:', error.message)
      return NextResponse.json({ inspections: [] })
    }

    const orderIds = [...new Set((rows ?? []).map((r) => r.order_id).filter(Boolean))]
    const orderNumbers: Record<string, string> = {}
    if (orderIds.length > 0) {
      const { data: orders } = await admin.from('orders').select('id, order_number').in('id', orderIds)
      ;(orders ?? []).forEach((o: { id: string; order_number: string }) => {
        orderNumbers[o.id] = o.order_number ?? o.id
      })
    }

    const inspections = (rows ?? []).map((r) => ({
      ...r,
      order_number: orderNumbers[r.order_id] ?? r.order_id,
    }))

    return NextResponse.json({ inspections })
  } catch (e) {
    console.error('[return-inspections] error:', e)
    return NextResponse.json({ inspections: [] })
  }
}
