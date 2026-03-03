import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET – Prüft, ob ein Kunde dieses Produkt bewerten darf.
 * Query: product_id (erforderlich), optional: order_number, customer_email.
 * Wenn der Nutzer angemeldet ist, reicht product_id – es wird über user_id geprüft.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const order_number = searchParams.get('order_number')?.trim()
    const customer_email = searchParams.get('customer_email')?.trim()?.toLowerCase()
    const product_id = searchParams.get('product_id')?.trim()

    if (!product_id) {
      return NextResponse.json(
        { eligible: false, reason: 'Produkt erforderlich.' },
        { status: 200 }
      )
    }

    const supabase = await createServerSupabase()

    let items: { id: string }[] | null = null

    const { data: { user } } = await supabase.auth.getUser()

    if (user?.id) {
      const { data: userOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['shipped', 'delivered'])
      const orderIds = (userOrders ?? []).map((o) => o.id).filter(Boolean)
      if (orderIds.length > 0) {
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('id')
          .in('order_id', orderIds)
          .eq('product_id', product_id)
        items = orderItems ?? null
      }
    }

    if (!items?.length && order_number && customer_email) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', order_number)
        .ilike('customer_email', customer_email)
        .in('status', ['shipped', 'delivered'])
        .single()

      if (orderError || !order) {
        return NextResponse.json({
          eligible: false,
          reason: 'Bestellung nicht gefunden oder noch nicht versandt. Bitte Bestellnummer und E-Mail prüfen.',
        })
      }

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', order.id)
        .eq('product_id', product_id)
      items = orderItems ?? null
    }

    if (!items?.length) {
      return NextResponse.json({
        eligible: false,
        reason: user?.id ? 'Keine versandte Bestellung mit diesem Produkt unter deinem Konto.' : 'Bestellnummer, E-Mail und Produkt eingeben – oder anmelden.',
      })
    }

    const { data: existing } = await supabase
      .from('product_reviews')
      .select('order_item_id')
      .in('order_item_id', items.map((i) => i.id))

    const reviewedIds = new Set((existing ?? []).map((r) => r.order_item_id))
    const unreviewed = items.find((i) => !reviewedIds.has(i.id))

    if (!unreviewed) {
      return NextResponse.json({
        eligible: false,
        reason: 'Sie haben dieses Produkt in dieser Bestellung bereits bewertet.',
      })
    }

    return NextResponse.json({ eligible: true, order_item_id: unreviewed.id })
  } catch (e) {
    console.warn('reviews/eligibility:', e)
    return NextResponse.json({ eligible: false, reason: 'Prüfung fehlgeschlagen.' })
  }
}
