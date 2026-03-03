import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { createDhlShipment, type DhlShipperAddress, type DhlConsigneeAddress } from '@/lib/dhl-parcel'
import { getReturnAddress, getDhlCredentials } from '@/lib/shipping-settings'

export const dynamic = 'force-dynamic'

/**
 * POST – Admin: DHL Versandlabel für Bestellung erstellen.
 * Nutzt DHL Parcel DE Shipping API v2.
 * Bei has_adult_items wird IdentCheck (Alterssichtprüfung 18+) automatisch gebucht.
 * Shipper-Adresse: aus Admin-Rücksendeadresse, sonst DHL_SHIPPER_*/INVOICE_*.
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

    const creds = await getDhlCredentials()
    const billingNumber = creds.billing_number?.trim() || process.env.DHL_BILLING_NUMBER?.trim()
    if (!billingNumber || billingNumber.length !== 14) {
      return NextResponse.json(
        { error: 'DHL_BILLING_NUMBER fehlt oder hat nicht 14 Zeichen (EKP+Produkt+Teilnahme)' },
        { status: 500 }
      )
    }

    const ra = await getReturnAddress()
    const countryNorm = (ra.country === 'Deutschland' || ra.country === 'DE') ? 'DEU' : ra.country
    const shipper: DhlShipperAddress = {
      name1: ra.name || 'Absender',
      ...(ra.name2 && { name2: ra.name2 }),
      addressStreet: ra.street || 'Straße',
      addressHouse: ra.house_number || '1',
      postalCode: ra.postal_code || '00000',
      city: ra.city || 'Stadt',
      country: countryNorm || 'DEU',
    }

    if (!hasSupabaseAdmin()) {
      return NextResponse.json({ error: 'Supabase Admin nicht verfügbar' }, { status: 500 })
    }

    const admin = createSupabaseAdmin()
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, order_number, shipping_address, has_adult_items')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Bestellung nicht gefunden' },
        { status: 404 }
      )
    }

    const addr = (order.shipping_address as Record<string, string> | null) || {}
    const firstName = addr.first_name || ''
    const lastName = addr.last_name || ''
    const street = addr.street || ''
    const houseNumber = addr.house_number || ''
    const postalCode = addr.postal_code || ''
    const city = addr.city || ''
    const country = addr.country || 'Deutschland'
    const email = addr.email || ''
    const phone = addr.phone || ''

    if (!firstName && !lastName) {
      return NextResponse.json(
        { error: 'Lieferadresse unvollständig (Name fehlt)' },
        { status: 400 }
      )
    }
    if (!street || !postalCode || !city) {
      return NextResponse.json(
        { error: 'Lieferadresse unvollständig (Straße, PLZ oder Stadt fehlt)' },
        { status: 400 }
      )
    }

    const consignee: DhlConsigneeAddress = {
      name1: `${firstName} ${lastName}`.trim(),
      addressStreet: street,
      addressHouse: houseNumber || '0',
      postalCode,
      city,
      country: country === 'Deutschland' || country === 'DE' ? 'DEU' : country,
      ...(email && { email }),
      ...(phone && { phone }),
    }

    const weight = parseFloat(process.env.DHL_DEFAULT_WEIGHT_KG || '2')
    const hasAdultItems = Boolean(order.has_adult_items)

    const shipments = await createDhlShipment({
      shipper,
      consignee,
      weightInKg: weight,
      billingNumber,
      product: process.env.DHL_PRODUCT || 'V01PAK',
      printFormat: process.env.DHL_PRINT_FORMAT || '910-300-700',
      visualCheckOfAge: hasAdultItems,
      shipmentRefNo: order.order_number || undefined,
    })

    if (!shipments.length || !shipments[0].shipmentNo) {
      return NextResponse.json(
        { error: 'DHL hat keine Sendungsnummer zurückgegeben' },
        { status: 500 }
      )
    }

    const first = shipments[0]
    const trackingNumber = first.shipmentNo

    await admin.from('order_shipments').insert({
      order_id: orderId,
      tracking_number: trackingNumber,
      tracking_carrier: 'DHL',
      label_url: first.labelUrl ?? null,
      return_label_url: first.returnLabelUrl ?? null,
      shipped_at: new Date().toISOString(),
    })

    await admin
      .from('orders')
      .update({
        status: 'shipped',
        tracking_number: trackingNumber,
        tracking_carrier: 'DHL',
      })
      .eq('id', orderId)

    return NextResponse.json({
      ok: true,
      trackingNumber,
      labelUrl: first.labelUrl,
      returnLabelUrl: first.returnLabelUrl,
      visualCheckOfAge: hasAdultItems,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'DHL-Label konnte nicht erstellt werden'
    console.error('[dhl-label]', e)
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    )
  }
}
