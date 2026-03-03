import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { createLabelForOrder, type LabelCarrier } from '@/lib/carrier-labels'

export const dynamic = 'force-dynamic'

const ALLOWED_CARRIERS: LabelCarrier[] = ['DHL', 'DPD', 'GLS', 'Hermes', 'UPS']

/**
 * POST – Admin: Versandlabel für gewählten Carrier erstellen.
 * Body: { carrier: 'DHL' | 'DPD' | 'GLS' | 'Hermes' | 'UPS' }
 * DHL/GLS: API-Label, Speicherung, Rückgabe labelUrl/trackingNumber.
 * DPD/Hermes/UPS: Rückgabe needPortal + portalUrl (Label im Portal erstellen).
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { isAdmin } = await getAdminContext()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(context.params)
    const orderId = typeof resolvedParams?.id === 'string' ? resolvedParams.id.trim() : ''
    if (!orderId) {
      return NextResponse.json({ error: 'Bestell-ID fehlt' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const carrierRaw = typeof body.carrier === 'string' ? body.carrier.trim().toUpperCase() : ''
    const carrier = ALLOWED_CARRIERS.includes(carrierRaw as LabelCarrier)
      ? (carrierRaw as LabelCarrier)
      : 'DHL'

    if (!hasSupabaseAdmin()) {
      return NextResponse.json({ error: 'Supabase Admin nicht verfügbar' }, { status: 500 })
    }

    const admin = createSupabaseAdmin()
    const result = await createLabelForOrder(admin, orderId, carrier)

    if (result.error && !result.needPortal) {
      return NextResponse.json(
        { error: result.error, carrier: result.carrier },
        { status: 400 }
      )
    }

    if (result.needPortal) {
      return NextResponse.json({
        ok: false,
        needPortal: true,
        carrier: result.carrier,
        portalUrl: result.portalUrl,
        message: result.message,
      })
    }

    return NextResponse.json({
      ok: true,
      carrier: result.carrier,
      trackingNumber: result.trackingNumber,
      labelUrl: result.labelUrl,
      returnLabelUrl: result.returnLabelUrl,
      visualCheckOfAge: result.visualCheckOfAge,
      labelPdfBase64: result.labelPdfBase64,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Label konnte nicht erstellt werden'
    console.error('[create-label]', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
