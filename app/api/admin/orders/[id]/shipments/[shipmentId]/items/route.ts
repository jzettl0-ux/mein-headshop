import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * PUT – Inhalt einer Sendung setzen (welche Artikel in welcher Menge in diesem Paket sind).
 * Body: { items: [{ order_item_id: string, quantity: number }] }
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string; shipmentId: string }> | { id: string; shipmentId: string } }
) {
  try {
    const { isAdmin } = await getAdminContext()
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const resolved = typeof (context.params as Promise<unknown>)?.then === 'function'
      ? await (context.params as Promise<{ id?: string; shipmentId?: string }>)
      : (context.params as { id?: string; shipmentId?: string })
    const orderId = typeof resolved?.id === 'string' ? resolved.id.trim() : ''
    const shipmentId = typeof resolved?.shipmentId === 'string' ? resolved.shipmentId.trim() : ''
    if (!orderId || !shipmentId) return NextResponse.json({ error: 'orderId oder shipmentId fehlt' }, { status: 400 })

    if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

    const admin = createSupabaseAdmin()

    const { data: shipment } = await admin
      .from('order_shipments')
      .select('id')
      .eq('id', shipmentId)
      .eq('order_id', orderId)
      .maybeSingle()

    if (!shipment) return NextResponse.json({ error: 'Sendung nicht gefunden oder gehört nicht zu dieser Bestellung' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const items = Array.isArray(body.items) ? body.items : []

    const byItem: Record<string, number> = {}
    for (const r of items) {
      if (!r || typeof r !== 'object') continue
      const rawId = (r as { order_item_id?: unknown }).order_item_id
      const oiId = rawId != null ? String(rawId).trim() : ''
      const q = Math.max(1, Math.floor(Number((r as { quantity?: unknown }).quantity) || 0))
      if (oiId) byItem[oiId] = (byItem[oiId] ?? 0) + q
    }

    const orderItemIds = Object.keys(byItem)
    if (orderItemIds.length > 0) {
      const { data: allOrderItems } = await admin
        .from('order_items')
        .select('id')
        .eq('order_id', orderId)
      const canonicalByLower: Record<string, string> = {}
      for (const r of allOrderItems ?? []) {
        const id = String(r.id)
        canonicalByLower[id.toLowerCase()] = id
      }
      const filtered: Record<string, number> = {}
      for (const clientId of orderItemIds) {
        const lower = clientId.trim().toLowerCase()
        const canonical = canonicalByLower[lower]
        if (canonical && (byItem[clientId] ?? 0) > 0) filtered[canonical] = byItem[clientId]
      }
      Object.keys(byItem).forEach((k) => delete byItem[k])
      Object.assign(byItem, filtered)
    }

    const requestedCount = items.length
    if (requestedCount > 0 && orderItemIds.length === 0) {
      return NextResponse.json(
        { error: 'Keine gültigen Artikel im Request (items-Format prüfen).', savedCount: 0 },
        { status: 400 }
      )
    }
    if (requestedCount > 0 && Object.keys(byItem).length === 0) {
      const { data: orderItemIdsForOrder } = await admin.from('order_items').select('id').eq('order_id', orderId)
      console.warn('[shipment-items] Keine gültigen Artikel. orderId=', orderId, 'received=', orderItemIds, 'expectedCount=', (orderItemIdsForOrder ?? []).length)
      return NextResponse.json(
        {
          error: 'Die angegebenen Artikel gehören nicht zu dieser Bestellung. Bitte Seite neu laden.',
          savedCount: 0,
          debug: process.env.NODE_ENV !== 'production' ? { receivedIds: orderItemIds, expectedCount: (orderItemIdsForOrder ?? []).length } : undefined,
        },
        { status: 400 }
      )
    }

    const insertRows = Object.entries(byItem).map(([order_item_id, quantity]) => ({
      shipment_id: shipmentId,
      order_item_id,
      quantity,
    }))
    const savedCount = insertRows.length
    const itemsForRpc = insertRows.map(({ order_item_id, quantity }) => ({ order_item_id, quantity }))

    // Schreiben nur über RPC (macht DELETE + INSERT in einer Transaktion), sonst Fallback
    if (insertRows.length > 0) {
      const { data: rpcCount, error: rpcErr } = await admin.rpc('save_order_shipment_items', {
        p_shipment_id: shipmentId,
        p_items: itemsForRpc,
      })

      const rpcOk = !rpcErr && (typeof rpcCount === 'number' || typeof rpcCount === 'string') && Number(rpcCount) === savedCount
      if (!rpcOk) {
        if (rpcErr) console.warn('[shipment-items] RPC fehlgeschlagen, Fallback INSERT:', rpcErr.message, rpcErr.code)
        const { error: delErr } = await admin.from('order_shipment_items').delete().eq('shipment_id', shipmentId)
        if (delErr) {
          console.error('[shipment-items] delete (Fallback):', delErr)
          return NextResponse.json(
            { error: `Löschen fehlgeschlagen: ${delErr.message}. Führe in Supabase SQL Editor: migration-order-shipment-items-complete.sql aus.` },
            { status: 500 }
          )
        }
        const { data: inserted, error: insErr } = await admin
          .from('order_shipment_items')
          .insert(insertRows)
          .select('id')
        if (insErr) {
          console.error('[shipment-items] insert:', insErr)
          return NextResponse.json(
            {
              error: 'Paketinhalt konnte nicht gespeichert werden.',
              hint: 'Im Supabase SQL Editor die Datei supabase/migration-order-shipment-items-complete.sql einmal komplett ausführen. In .env.local SUPABASE_SERVICE_ROLE_KEY prüfen (Service-Role, nicht Anon).',
            },
            { status: 500 }
          )
        }
        if ((inserted?.length ?? 0) !== savedCount) {
          return NextResponse.json(
            { error: 'Speichern unvollständig. migration-order-shipment-items-complete.sql in Supabase ausführen.' },
            { status: 500 }
          )
        }
      }
    } else {
      const { error: delErr } = await admin.from('order_shipment_items').delete().eq('shipment_id', shipmentId)
      if (delErr) {
        console.error('[shipment-items] delete (leerer Inhalt):', delErr)
        return NextResponse.json({ error: `Löschen fehlgeschlagen: ${delErr.message}` }, { status: 500 })
      }
    }

    // 3. Verifizieren: dieselbe Abfrage wie beim Seiten-Laden
    const { data: verifyRows, error: verifyErr } = await admin
      .from('order_shipment_items')
      .select('id')
      .eq('shipment_id', shipmentId)

    if (verifyErr) {
      console.error('[shipment-items] Verifizierung fehlgeschlagen:', verifyErr)
      return NextResponse.json({ error: 'Speichern konnte nicht bestätigt werden.' }, { status: 500 })
    }
    const verifiedCount = verifyRows?.length ?? 0
    if (savedCount > 0 && verifiedCount === 0) {
      console.error('[shipment-items] Keine Zeilen nach Speichern lesbar.', { shipmentId, savedCount })
      return NextResponse.json(
        { error: 'Inhalt wurde nicht dauerhaft gespeichert. migration-order-shipment-items-complete.sql in Supabase SQL Editor ausführen.' },
        { status: 500 }
      )
    }

    let itemsForShipment: { order_item_id: string; quantity: number; product_name: string }[] = []
    if (savedCount > 0) {
      const orderItemIdsForName = insertRows.map((r) => r.order_item_id)
      const { data: nameRows } = await admin
        .from('order_items')
        .select('id, product_name')
        .in('id', orderItemIdsForName)
      const nameByLower = new Map(
        (nameRows ?? []).map((o) => [String(o.id).toLowerCase(), (o as { product_name?: string }).product_name ?? 'Unbekannt'])
      )
      itemsForShipment = insertRows.map(({ order_item_id, quantity }) => ({
        order_item_id,
        quantity,
        product_name: nameByLower.get(String(order_item_id).toLowerCase()) ?? 'Unbekannt',
      }))
    }

    return NextResponse.json({ ok: true, savedCount, shipmentId, itemsForShipment })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[shipment-items] PUT error:', e)
    return NextResponse.json({ error: `Fehler: ${msg}` }, { status: 500 })
  }
}
