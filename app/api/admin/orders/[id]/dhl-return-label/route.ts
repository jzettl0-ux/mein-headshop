import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { createDhlReturnLabel } from '@/lib/dhl-returns'
import { formatForDhlShipper } from '@/lib/return-address-formats'

export const dynamic = 'force-dynamic'

/**
 * POST – DHL druckerloses Retourenlabel (QR) erstellen und speichern.
 * Nur wenn Rücksendeanfrage angenommen und noch kein Label vorhanden.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const orderId = (await Promise.resolve(context.params))?.id
  if (!orderId) return NextResponse.json({ error: 'Order-ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .select('id, order_number, return_request_status, shipping_address, customer_name')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })

  if (order.return_request_status !== 'approved') {
    return NextResponse.json(
      { error: 'Retourenlabel kann nur erstellt werden, wenn die Rücksendung bereits freigegeben wurde.' },
      { status: 400 }
    )
  }

  const { data: existing } = await admin
    .schema('fulfillment')
    .from('returns')
    .select('id, ret_number, qr_label_base64')
    .eq('order_id', orderId)
    .single()

  if (existing) {
    return NextResponse.json({
      success: true,
      ret_number: existing.ret_number,
      qr_label_base64: existing.qr_label_base64,
      message: 'Label bereits erstellt',
    })
  }

  const addr = (order.shipping_address as Record<string, unknown>) || {}
  const customerAddr = {
    name: order.customer_name ?? undefined,
    first_name: addr.first_name,
    last_name: addr.last_name,
    street: addr.street ?? addr.addressStreet,
    house_number: addr.house_number ?? addr.houseNumber,
    postal_code: addr.postal_code ?? addr.postalCode,
    city: addr.city,
    country: addr.country,
  }
  const shipper = formatForDhlShipper(customerAddr as any)
  if (!shipper.addressStreet || !shipper.postalCode || !shipper.city) {
    return NextResponse.json(
      { error: 'Lieferadresse der Bestellung unvollständig (Straße, PLZ, Ort erforderlich).' },
      { status: 400 }
    )
  }

  const country = String(addr.country ?? 'DE').toUpperCase()
  const countryToReceiverId: Record<string, string> = {
    DE: 'deu', DEU: 'deu', AT: 'aut', AUT: 'aut', CH: 'che', CHE: 'che', NL: 'nld', NLD: 'nld',
  }
  const receiverId = countryToReceiverId[country] ?? 'deu'

  try {
    const result = await createDhlReturnLabel({
      receiverId,
      labelType: 'BOTH',
      shipper,
      customerReference: `Bestellung ${order.order_number}`,
      shipmentReference: order.order_number,
    })

    const { error: insertErr } = await admin
      .schema('fulfillment')
      .from('returns')
      .insert({
        order_id: orderId,
        dhl_shipment_number: result.shipmentNo,
        ret_number: result.retNumber,
        qr_label_base64: result.qrLabelBase64,
        pdf_label_base64: result.pdfLabelBase64,
      })

    if (insertErr) {
      console.error('fulfillment.returns insert:', insertErr)
      return NextResponse.json({ error: 'Label konnte nicht gespeichert werden' }, { status: 500 })
    }

    await admin
      .from('orders')
      .update({ return_shipping_code: result.retNumber })
      .eq('id', orderId)

    return NextResponse.json({
      success: true,
      ret_number: result.retNumber,
      qr_label_base64: result.qrLabelBase64,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
