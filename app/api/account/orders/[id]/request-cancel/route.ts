import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { CANCELLATION_REASONS } from '@/lib/cancellation-reasons'

/** Stornierung nur im gesetzlichen Rahmen: vor Versand (pending/processing) oder nach Ablehnung erneute Anfrage möglich. */
const REQUESTABLE_STATUSES = ['pending', 'processing', 'cancellation_rejected', 'cancellation_requested']

type Body = {
  reason?: string
  reason_other?: string
  order_item_ids?: string[]
  /** Neu: Mengen pro Artikel [{ order_item_id, quantity }]. Wenn gesetzt, wird das verwendet; sonst order_item_ids (volle Menge). */
  items?: { order_item_id: string; quantity: number }[]
}

/**
 * POST /api/account/orders/[id]/request-cancel
 * Kunde stellt eine Stornierungsanfrage (kein direktes Stornieren).
 * Bei mehreren Artikeln: Erst eine Teilanfrage, nach Bearbeitung (Annahme/Ablehnung) weitere Anfrage für andere Artikel möglich.
 * Grund ist optional; wenn reason = "sonstiges", kann reason_other genutzt werden.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params)
    const id = params?.id
    if (!id) {
      return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }
    let body: Body = {}
    try {
      body = await request.json()
    } catch {
      // Body optional
    }

    const reason = typeof body.reason === 'string' ? body.reason.trim() || null : null
    const reasonOther = typeof body.reason_other === 'string' ? body.reason_other.trim().slice(0, 1000) || null : null

    if (reason && !CANCELLATION_REASONS.some((r) => r.value === reason)) {
      return NextResponse.json(
        { error: 'Ungültiger Stornierungsgrund.' },
        { status: 400 }
      )
    }

    const itemsPayload = Array.isArray(body.items) ? body.items.filter((x) => x && typeof x.order_item_id === 'string' && typeof x.quantity === 'number' && x.quantity >= 1) : undefined
    const orderItemIds = Array.isArray(body.order_item_ids) ? body.order_item_ids.filter((x): x is string => typeof x === 'string') : undefined

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, user_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Kein Zugriff auf diese Bestellung' }, { status: 403 })
    }

    if (!REQUESTABLE_STATUSES.includes(order.status)) {
      return NextResponse.json(
        { error: 'Diese Bestellung kann nicht mehr zur Stornierung angefragt werden (bereits versandt oder vollständig storniert).' },
        { status: 400 }
      )
    }

    if (!hasSupabaseAdmin()) {
      return NextResponse.json(
        { error: 'Anfrage derzeit nicht möglich.' },
        { status: 503 }
      )
    }

    const admin = createSupabaseAdmin()
    const { data: existing } = await admin
      .from('orders')
      .select('cancellation_requested_at, cancellation_request_status')
      .eq('id', id)
      .single()
    const hasPendingCancellation = existing?.cancellation_requested_at && (existing?.cancellation_request_status === 'pending' || !existing?.cancellation_request_status)

    const { data: orderItems } = await admin.from('order_items').select('id, quantity, cancelled_quantity').eq('order_id', id)
    const itemsById = new Map((orderItems ?? []).map((i) => [i.id, i as { id: string; quantity: number; cancelled_quantity?: number }]))
    const itemIds = Array.from(itemsById.keys())

    type ToInsert = { order_id: string; order_item_id: string; request_type: 'cancellation'; requested_quantity?: number }
    let toInsert: ToInsert[] = []
    if (itemsPayload && itemsPayload.length > 0) {
      for (const it of itemsPayload.slice(0, 100)) {
        const row = itemsById.get(it.order_item_id)
        if (!row || !itemIds.includes(it.order_item_id)) continue
        const qty = Math.floor(Number(it.quantity)) || 0
        const maxQty = Math.max(0, Number(row.quantity) - (row.cancelled_quantity ?? 0))
        if (qty < 1 || qty > maxQty) continue
        toInsert.push({ order_id: id, order_item_id: it.order_item_id, request_type: 'cancellation', requested_quantity: qty })
      }
    } else {
      const ids = (orderItemIds?.length ? orderItemIds.filter((oid) => itemIds.includes(oid)) : itemIds).slice(0, 100)
      toInsert = ids.map((order_item_id) => ({ order_id: id, order_item_id, request_type: 'cancellation' as const }))
    }
    if (toInsert.length === 0 && (itemsPayload?.length ?? 0) > 0) {
      return NextResponse.json({ error: 'Bitte gültige Mengen angeben (mind. 1, maximal die bestellte Menge pro Artikel).' }, { status: 400 })
    }

    const updatePayload: Record<string, unknown> = hasPendingCancellation
      ? {}
      : {
          cancellation_requested_at: new Date().toISOString(),
          cancellation_reason: reason,
          cancellation_reason_other: reasonOther,
          cancellation_request_status: 'pending',
          status: 'cancellation_requested',
        }

    let updateError: { message?: string; details?: unknown } | null = null
    if (Object.keys(updatePayload).length > 0) {
      const res = await admin.from('orders').update(updatePayload).eq('id', id)
      updateError = res.error ?? null
      if (updateError && (updateError.message?.includes('column') || updateError.message?.includes('schema cache'))) {
        console.warn('Request cancel: retry without optional columns', updateError.message)
        const fallbackPayload: Record<string, unknown> = {
          cancellation_requested_at: new Date().toISOString(),
          cancellation_request_status: 'pending',
        }
        const res2 = await admin.from('orders').update(fallbackPayload).eq('id', id)
        updateError = res2.error ?? null
        if (updateError) {
          const minimalPayload: Record<string, unknown> = { cancellation_requested_at: new Date().toISOString() }
          const res3 = await admin.from('orders').update(minimalPayload).eq('id', id)
          updateError = res3.error ?? null
        }
      }
    }
    if (updateError) {
      console.error('Request cancel error', updateError.message, updateError.details)
      const msg = updateError.message?.includes('column') || updateError.message?.includes('schema cache')
        ? 'Fehlende Spalte in der Datenbank – bitte im Supabase-Dashboard unter SQL Editor die Datei supabase/migration-orders-cancellation-request.sql ausführen (und ggf. migration-orders-request-status-and-items.sql sowie migration-orders-status-extended.sql).'
        : 'Anfrage konnte nicht gespeichert werden.'
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    if (toInsert.length > 0) {
      try {
        await admin.from('order_request_items').delete().eq('order_id', id).eq('request_type', 'cancellation')
        await admin.from('order_request_items').insert(
          toInsert.map((row) => ({ order_id: row.order_id, order_item_id: row.order_item_id, request_type: row.request_type, requested_quantity: row.requested_quantity ?? null }))
        )
      } catch (itemsErr) {
        console.warn('Request cancel: order_request_items optional', itemsErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: hasPendingCancellation
        ? 'Die weiteren Artikel wurden zu deiner Stornierungsanfrage hinzugefügt.'
        : 'Deine Stornierungsanfrage wurde übermittelt. Wir melden uns bei dir.',
    })
  } catch (e: unknown) {
    console.error('Request cancel route error', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Fehler' },
      { status: 500 }
    )
  }
}
