import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET – öffentlich: Bewertungen für ein Produkt (product_id query).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const product_id = searchParams.get('product_id')?.trim()
    if (!product_id) return NextResponse.json([])

    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('product_reviews')
      .select('id, rating, comment, created_at, display_name, is_verified_purchase, is_tester_program')
      .eq('product_id', product_id)
      .or('is_private.eq.false,is_private.is.null')
      .or('moderation_status.eq.approved,moderation_status.is.null')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('product_reviews GET:', error.message)
      return NextResponse.json([])
    }
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([])
  }
}

/**
 * POST – Bewertung abgeben.
 * Body: product_id, rating (1–5), comment (optional). Optional: order_number, customer_email (für Gäste).
 * Wenn der Nutzer angemeldet ist, werden Bestellnummer und E-Mail nicht benötigt – die Bestellung wird über user_id ermittelt.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const order_number = body.order_number?.trim()
    const customer_email = body.customer_email?.trim()?.toLowerCase()
    const product_id = body.product_id?.trim()
    const rating = typeof body.rating === 'number' ? body.rating : parseInt(body.rating, 10)
    const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 2000) : null
    const is_private = body.is_private === true || body.is_private === 'true'
    const display_name = typeof body.display_name === 'string' ? body.display_name.trim().slice(0, 80) : null

    if (!product_id) {
      return NextResponse.json(
        { success: false, error: 'Produkt erforderlich.' },
        { status: 400 }
      )
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Bewertung muss zwischen 1 und 5 liegen.' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()

    let orderId: string | null = null

    const { data: { user } } = await supabase.auth.getUser()

    let items: { id: string }[] | null = null

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
      if (!orderError && order?.id) {
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('id')
          .eq('order_id', order.id)
          .eq('product_id', product_id)
        items = orderItems ?? null
      }
    }

    if (!items?.length) {
      return NextResponse.json(
        { success: false, error: user?.id ? 'Keine versandte Bestellung mit diesem Produkt unter deinem Konto gefunden.' : 'Bestellnummer, E-Mail und Produkt erforderlich – oder melde dich an.' },
        { status: 400 }
      )
    }

    const { data: existing } = await supabase
      .from('product_reviews')
      .select('order_item_id')
      .in('order_item_id', items.map((i) => i.id))

    const reviewedIds = new Set((existing ?? []).map((r) => r.order_item_id))
    const order_item_id = items.find((i) => !reviewedIds.has(i.id))?.id

    if (!order_item_id) {
      return NextResponse.json(
        { success: false, error: 'Sie haben dieses Produkt in dieser Bestellung bereits bewertet.' },
        { status: 400 }
      )
    }

    const { error: insertError } = await supabase.from('product_reviews').insert({
      order_item_id,
      product_id,
      rating,
      comment: comment || null,
      is_private: is_private ?? false,
      display_name: display_name || null,
      moderation_status: 'pending',
    })

    if (insertError) {
      console.warn('product_reviews insert:', insertError.message)
      return NextResponse.json(
        { success: false, error: 'Speichern fehlgeschlagen.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.warn('reviews POST:', e)
    return NextResponse.json(
      { success: false, error: 'Fehler beim Speichern.' },
      { status: 500 }
    )
  }
}
