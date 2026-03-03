import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Versandlabel-PDF einer Sendung ausliefern (Proxy für Drucken).
 * Liefert das PDF von der gespeicherten label_url; Admin-Auth erforderlich.
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string; shipmentId: string }> | { id: string; shipmentId: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: orderId, shipmentId } = await Promise.resolve(context.params)

  if (!orderId?.trim() || !shipmentId?.trim()) {
    return NextResponse.json({ error: 'orderId oder shipmentId fehlt' }, { status: 400 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  const { data: shipment, error } = await admin
    .from('order_shipments')
    .select('label_url')
    .eq('id', shipmentId.trim())
    .eq('order_id', orderId.trim())
    .maybeSingle()

  if (error || !shipment?.label_url) {
    return NextResponse.json(
      { error: 'Sendung nicht gefunden oder kein Label vorhanden' },
      { status: 404 }
    )
  }

  const labelUrl = String(shipment.label_url).trim()
  if (!labelUrl.startsWith('http')) {
    return NextResponse.json({ error: 'Ungültige Label-URL' }, { status: 400 })
  }

  try {
    const pdfRes = await fetch(labelUrl, {
      method: 'GET',
      headers: { Accept: 'application/pdf' },
      cache: 'no-store',
    })

    if (!pdfRes.ok) {
      return NextResponse.json(
        { error: `Label konnte nicht geladen werden (${pdfRes.status})` },
        { status: 502 }
      )
    }

    const contentType = pdfRes.headers.get('content-type') || 'application/pdf'
    const body = pdfRes.body
    if (!body) {
      return NextResponse.json({ error: 'Leere Label-Antwort' }, { status: 502 })
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (e) {
    console.error('[label-pdf]', e)
    return NextResponse.json(
      { error: 'Label konnte nicht abgerufen werden' },
      { status: 502 }
    )
  }
}
