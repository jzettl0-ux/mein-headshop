import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getReturnHeuristic } from '@/lib/return-heuristics'

/**
 * GET /api/account/orders/[id]/return-suggestion
 * Heuristik-Vorschlag für Retourengrund (Pre-Select in der Retouren-UI).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await Promise.resolve(context.params)
  const id = params?.id
  if (!id) return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 400 })

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: order } = await supabase
    .from('orders')
    .select('id, user_id, total')
    .eq('id', id)
    .single()

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
  }

  let itemCount = 0
  let concessionRate: number | undefined
  if (hasSupabaseAdmin()) {
    const admin = createSupabaseAdmin()
    const { data: items } = await admin.from('order_items').select('id').eq('order_id', id)
    itemCount = items?.length ?? 0
    try {
      const { data: health } = await admin.schema('fraud_prevention').from('buyer_health_scores').select('concession_rate').eq('customer_id', user.id).maybeSingle()
      if (health && typeof (health as { concession_rate?: number }).concession_rate === 'number') {
        concessionRate = (health as { concession_rate: number }).concession_rate
      }
    } catch {
      // Schema/Tabelle optional
    }
  }

  const orderTotal = Number(order.total) ?? 0
  const result = getReturnHeuristic({
    order_total: orderTotal,
    item_count: itemCount,
    concession_rate: concessionRate,
  })

  return NextResponse.json(result)
}
