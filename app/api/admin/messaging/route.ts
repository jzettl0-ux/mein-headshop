import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Liste Buyer-Seller-Messages (Blueprint Phase 9: Anti-Poaching).
 * communications.messages mit Bestellnummer für Link.
 */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ messages: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: rows, error } = await admin
      .schema('communications')
      .from('messages')
      .select('message_id, order_id, message_body, is_flagged_by_regex, flag_reason, delivery_status, created_at')
      .order('created_at', { ascending: false })
      .limit(300)

    if (error) {
      console.error('[messaging] list error:', error.message)
      return NextResponse.json({ messages: [] })
    }

    const orderIds = [...new Set((rows ?? []).map((r) => r.order_id).filter(Boolean))]
    const orderNumbers: Record<string, string> = {}
    if (orderIds.length > 0) {
      const { data: orders } = await admin.from('orders').select('id, order_number').in('id', orderIds)
      ;(orders ?? []).forEach((o: { id: string; order_number: string }) => {
        orderNumbers[o.id] = o.order_number ?? o.id
      })
    }

    const messages = (rows ?? []).map((r) => ({
      ...r,
      order_number: orderNumbers[r.order_id] ?? r.order_id,
      body_preview: (r.message_body ?? '').slice(0, 120) + ((r.message_body ?? '').length > 120 ? '…' : ''),
    }))

    return NextResponse.json({ messages })
  } catch (e) {
    console.error('[messaging] error:', e)
    return NextResponse.json({ messages: [] })
  }
}
