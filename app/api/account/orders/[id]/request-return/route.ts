import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { RETURN_REASONS } from '@/lib/return-reasons'
import { RETURN_SHIPPING_CARRIERS } from '@/lib/return-shipping-carriers'

/** Rücksendung nur im gesetzlichen Rahmen: bei versendeter/zugestellter Bestellung; nach Bearbeitung (Annahme/Ablehnung) weitere Anfrage für andere Artikel möglich. */
const REQUESTABLE_STATUSES = ['shipped', 'delivered', 'return_rejected', 'return_requested']
const ALLOWED_CARRIERS = new Set(RETURN_SHIPPING_CARRIERS.map((c) => c.value))

type Body = {
  reason?: string
  reason_other?: string
  order_item_ids?: string[]
  /** Mengen pro Artikel [{ order_item_id, quantity }]. Wenn gesetzt, wird das verwendet; sonst order_item_ids (volle Menge). */
  items?: { order_item_id: string; quantity: number }[]
  /** Vom Kunden gewählter Versanddienstleister (z. B. dhl, dpd). */
  preferred_carrier?: string
  /** Vom Kunden gewählte Retourenart: printed_code = gedruckter Retourenschein, qr_code = QR-Code (druckerlose Retoure). */
  return_method_preference?: string
}

/**
 * POST /api/account/orders/[id]/request-return
 * Kunde stellt eine Rücksendeanfrage (Paket zurückschicken).
 * Bei mehreren Artikeln: Erst eine Teilanfrage, nach Bearbeitung weitere Anfrage für andere Artikel möglich.
 * Grund ist optional.
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
    const preferredCarrier = typeof body.preferred_carrier === 'string' ? body.preferred_carrier.trim().toLowerCase() : null
    const returnMethodPref = typeof body.return_method_preference === 'string' && ['printed_code', 'qr_code'].includes(body.return_method_preference) ? body.return_method_preference : null
    if (preferredCarrier && !(ALLOWED_CARRIERS as Set<string>).has(preferredCarrier)) {
      return NextResponse.json(
        { error: 'Bitte wähle einen gültigen Versanddienstleister für die Rücksendung.' },
        { status: 400 }
      )
    }

    if (reason && !RETURN_REASONS.some((r) => r.value === reason)) {
      return NextResponse.json(
        { error: 'Ungültiger Rücksendegrund.' },
        { status: 400 }
      )
    }

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
        { error: 'Rücksendung kann nur bei versendeten oder zugestellten Bestellungen angefragt werden (gesetzliches Widerrufsrecht).' },
        { status: 400 }
      )
    }

    if (!hasSupabaseAdmin()) {
      return NextResponse.json(
        { error: 'Anfrage derzeit nicht möglich.' },
        { status: 503 }
      )
    }

    const itemsPayload = Array.isArray(body.items) ? body.items.filter((x) => x && typeof x.order_item_id === 'string' && typeof x.quantity === 'number' && x.quantity >= 1) : undefined
    const orderItemIds = Array.isArray(body.order_item_ids) ? body.order_item_ids.filter((x): x is string => typeof x === 'string') : undefined

    const admin = createSupabaseAdmin()
    const { data: existing } = await admin
      .from('orders')
      .select('return_requested_at, return_request_status')
      .eq('id', id)
      .single()
    const hasPendingReturn = existing?.return_requested_at && (existing?.return_request_status === 'pending' || !existing?.return_request_status)

    const { data: orderItems } = await admin.from('order_items').select('id, quantity, returned_quantity').eq('order_id', id)
    const itemsById = new Map((orderItems ?? []).map((i) => [i.id, i as { id: string; quantity: number; returned_quantity?: number }]))
    const itemIds = Array.from(itemsById.keys())

    type ToInsert = { order_id: string; order_item_id: string; request_type: 'return'; requested_quantity?: number }
    let toInsert: ToInsert[] = []
    if (itemsPayload && itemsPayload.length > 0) {
      for (const it of itemsPayload.slice(0, 100)) {
        const row = itemsById.get(it.order_item_id)
        if (!row || !itemIds.includes(it.order_item_id)) continue
        const qty = Math.floor(Number(it.quantity)) || 0
        const maxQty = Math.max(0, Number(row.quantity) - (row.returned_quantity ?? 0))
        if (qty < 1 || qty > maxQty) continue
        toInsert.push({ order_id: id, order_item_id: it.order_item_id, request_type: 'return', requested_quantity: qty })
      }
    } else {
      const ids = (orderItemIds?.length ? orderItemIds.filter((oid) => itemIds.includes(oid)) : itemIds).slice(0, 100)
      toInsert = ids.map((order_item_id) => ({ order_id: id, order_item_id, request_type: 'return' as const }))
    }
    if (toInsert.length === 0 && (itemsPayload?.length ?? 0) > 0) {
      return NextResponse.json({ error: 'Bitte gültige Mengen angeben (mind. 1, maximal die bestellte Menge pro Artikel).' }, { status: 400 })
    }

    const updatePayload: Record<string, unknown> = hasPendingReturn
      ? {}
      : {
          return_requested_at: new Date().toISOString(),
          return_reason: reason,
          return_reason_other: reasonOther,
          return_request_status: 'pending',
          status: 'return_requested',
          return_shipping_code: null,
          return_shipping_deduction_cents: null,
          return_shipping_options: null,
          ...(preferredCarrier ? { return_carrier_preference: preferredCarrier } : {}),
          ...(returnMethodPref ? { return_method_preference: returnMethodPref } : {}),
        }

    let updateError: { message?: string; details?: unknown } | null = null
    if (Object.keys(updatePayload).length > 0) {
      const res = await admin.from('orders').update(updatePayload).eq('id', id)
      updateError = res.error ?? null
      if (updateError && (updateError.message?.includes('column') || updateError.message?.includes('schema cache'))) {
        console.warn('Request return: retry without optional columns', updateError.message)
        const fallbackPayload: Record<string, unknown> = {
          return_requested_at: new Date().toISOString(),
          return_request_status: 'pending',
          status: 'return_requested',
        }
        const res2 = await admin.from('orders').update(fallbackPayload).eq('id', id)
        updateError = res2.error ?? null
        if (updateError) {
          const minimalPayload: Record<string, unknown> = { return_requested_at: new Date().toISOString(), status: 'return_requested' }
          const res3 = await admin.from('orders').update(minimalPayload).eq('id', id)
          updateError = res3.error ?? null
        }
      }
    }
    if (updateError) {
      console.error('Request return error', updateError.message, updateError.details)
      const msg = updateError.message?.includes('column') || updateError.message?.includes('schema cache') || updateError.message?.includes('check')
        ? 'Datenbank-Migration fehlt – bitte im Supabase-Dashboard unter SQL Editor nacheinander ausführen: migration-orders-return-request.sql, migration-orders-request-status-and-items.sql, migration-orders-status-extended.sql.'
        : 'Anfrage konnte nicht gespeichert werden.'
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    if (toInsert.length > 0) {
      try {
        await admin.from('order_request_items').delete().eq('order_id', id).eq('request_type', 'return')
        await admin.from('order_request_items').insert(
          toInsert.map((row) => ({ order_id: row.order_id, order_item_id: row.order_item_id, request_type: row.request_type, requested_quantity: row.requested_quantity ?? null }))
        )
      } catch (itemsErr) {
        console.warn('Request return: order_request_items optional', itemsErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: hasPendingReturn
        ? 'Die weiteren Artikel wurden zu deiner Rücksendeanfrage hinzugefügt.'
        : 'Deine Rücksendeanfrage wurde übermittelt. Wir melden uns bei dir mit den nächsten Schritten.',
    })
  } catch (e: unknown) {
    console.error('Request return route error', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Fehler' },
      { status: 500 }
    )
  }
}
