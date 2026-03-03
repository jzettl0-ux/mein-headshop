/**
 * Einheitliche Label-Erstellung für alle Carrier (DHL, GLS, DPD, Hermes, UPS).
 * Nutzt Bestelladresse und Rücksendeadresse automatisch.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createDhlShipment, type DhlShipperAddress, type DhlConsigneeAddress } from './dhl-parcel'
import { getReturnAddress, getDhlCredentials, getCarrierCredentials, getCarrierLinks } from './shipping-settings'
import { createGlsShipment } from './gls-shipit'

export type LabelCarrier = 'DHL' | 'DPD' | 'GLS' | 'Hermes' | 'UPS'

export interface CreateLabelResult {
  ok: boolean
  carrier: LabelCarrier
  trackingNumber?: string
  labelUrl?: string | null
  returnLabelUrl?: string | null
  /** Nur bei GLS: PDF als Base64 (wenn kein Storage-Upload möglich) */
  labelPdfBase64?: string
  visualCheckOfAge?: boolean
  /** Wenn true: Label wurde nicht per API erstellt, Kunde soll Portal nutzen */
  needPortal?: boolean
  portalUrl?: string
  message?: string
  error?: string
}

function countryToAlpha3(c: string): string {
  const s = (c || 'DEU').toUpperCase().trim()
  if (s === 'DE' || s === 'DEU' || s === 'GERMANY') return 'DEU'
  if (s === 'AT' || s === 'AUT') return 'AUT'
  if (s === 'CH' || s === 'CHE') return 'CHE'
  return s.length === 3 ? s : 'DEU'
}

function countryToAlpha2(c: string): string {
  const s = (c || 'DE').toUpperCase().trim()
  if (s === 'DEU' || s === 'GERMANY') return 'DE'
  if (s === 'AUT') return 'AT'
  if (s === 'CHE') return 'CH'
  return s.length === 2 ? s : 'DE'
}

export interface OrderForLabel {
  id: string
  order_number: string | null
  shipping_address: Record<string, string> | null
  has_adult_items?: boolean
}

/**
 * Lieferadresse aus Bestellung in einheitliches Format bringen.
 */
export function getConsigneeFromOrder(order: OrderForLabel): {
  firstName: string
  lastName: string
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: string
  countryCode: string
  email: string
  phone: string
} {
  const addr = order.shipping_address || {}
  const country = addr.country || 'Deutschland'
  return {
    firstName: addr.first_name || '',
    lastName: addr.last_name || '',
    street: addr.street || '',
    houseNumber: addr.house_number || '',
    postalCode: addr.postal_code || '',
    city: addr.city || '',
    country,
    countryCode: countryToAlpha2(country),
    email: addr.email || '',
    phone: addr.phone || '',
  }
}

/**
 * Label für eine Bestellung beim gewählten Carrier erstellen.
 * Bei DHL/GLS: API-Aufruf, Speicherung in order_shipments, Rückgabe von Label-URL.
 * Bei DPD/Hermes/UPS (ohne API): portalUrl zurückgeben, Frontend zeigt „Im Portal erstellen“.
 */
export async function createLabelForOrder(
  admin: SupabaseClient,
  orderId: string,
  carrier: LabelCarrier
): Promise<CreateLabelResult> {
  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('id, order_number, shipping_address, has_adult_items')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return { ok: false, carrier, error: 'Bestellung nicht gefunden' }
  }

  const consignee = getConsigneeFromOrder(order as OrderForLabel)
  if (!consignee.firstName && !consignee.lastName) {
    return { ok: false, carrier, error: 'Lieferadresse unvollständig (Name fehlt)' }
  }
  if (!consignee.street || !consignee.postalCode || !consignee.city) {
    return { ok: false, carrier, error: 'Lieferadresse unvollständig (Straße, PLZ oder Stadt fehlt)' }
  }

  const weightKg = parseFloat(process.env.DHL_DEFAULT_WEIGHT_KG || '2')
  const hasAdultItems = Boolean((order as { has_adult_items?: boolean }).has_adult_items)

  switch (carrier) {
    case 'DHL': {
      const creds = await getDhlCredentials()
      const billingNumber = creds.billing_number?.trim() || process.env.DHL_BILLING_NUMBER?.trim()
      if (!billingNumber || billingNumber.length !== 14) {
        return {
          ok: false,
          carrier: 'DHL',
          error: 'DHL_BILLING_NUMBER fehlt oder hat nicht 14 Zeichen (EKP). Bitte in Admin → Versand konfigurieren.',
        }
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
      const dhlConsignee: DhlConsigneeAddress = {
        name1: `${consignee.firstName} ${consignee.lastName}`.trim(),
        addressStreet: consignee.street,
        addressHouse: consignee.houseNumber || '0',
        postalCode: consignee.postalCode,
        city: consignee.city,
        country: countryToAlpha3(consignee.country),
        ...(consignee.email && { email: consignee.email }),
        ...(consignee.phone && { phone: consignee.phone }),
      }
      const shipments = await createDhlShipment({
        shipper,
        consignee: dhlConsignee,
        weightInKg: weightKg,
        billingNumber,
        product: process.env.DHL_PRODUCT || 'V01PAK',
        printFormat: process.env.DHL_PRINT_FORMAT || '910-300-700',
        visualCheckOfAge: hasAdultItems,
        shipmentRefNo: (order as { order_number?: string }).order_number || undefined,
      })
      if (!shipments.length || !shipments[0].shipmentNo) {
        return { ok: false, carrier: 'DHL', error: 'DHL hat keine Sendungsnummer zurückgegeben' }
      }
      const first = shipments[0]
      await admin.from('order_shipments').insert({
        order_id: orderId,
        tracking_number: first.shipmentNo,
        tracking_carrier: 'DHL',
        label_url: first.labelUrl ?? null,
        return_label_url: first.returnLabelUrl ?? null,
        shipped_at: new Date().toISOString(),
      })
      await admin
        .from('orders')
        .update({
          status: 'shipped',
          tracking_number: first.shipmentNo,
          tracking_carrier: 'DHL',
        })
        .eq('id', orderId)
      return {
        ok: true,
        carrier: 'DHL',
        trackingNumber: first.shipmentNo,
        labelUrl: first.labelUrl ?? null,
        returnLabelUrl: first.returnLabelUrl ?? null,
        visualCheckOfAge: hasAdultItems,
      }
    }

    case 'GLS': {
      try {
        const result = await createGlsShipment({
          orderId,
          orderNumber: (order as { order_number?: string }).order_number || undefined,
          consignee: {
            name1: `${consignee.firstName} ${consignee.lastName}`.trim(),
            street: consignee.street,
            houseNumber: consignee.houseNumber || '',
            postalCode: consignee.postalCode,
            city: consignee.city,
            countryCode: consignee.countryCode,
            email: consignee.email || undefined,
            phone: consignee.phone || undefined,
          },
          weightKg,
        })
        if (!result.trackingNumber) {
          return { ok: false, carrier: 'GLS', error: result.error || 'GLS hat keine Sendungsnummer zurückgegeben' }
        }
        let labelUrlToStore: string | null = null
        if (result.labelPdfBase64) {
          try {
            const { uploadLabelPdf } = await import('./label-storage')
            const url = await uploadLabelPdf(admin, orderId, result.trackingNumber, result.labelPdfBase64)
            labelUrlToStore = url
          } catch {
            // Speicherung optional; Frontend kann labelPdfBase64 aus Antwort nutzen
          }
        }
        await admin.from('order_shipments').insert({
          order_id: orderId,
          tracking_number: result.trackingNumber,
          tracking_carrier: 'GLS',
          label_url: labelUrlToStore,
          return_label_url: result.returnLabelUrl ?? null,
          shipped_at: new Date().toISOString(),
        })
        await admin
          .from('orders')
          .update({
            status: 'shipped',
            tracking_number: result.trackingNumber,
            tracking_carrier: 'GLS',
          })
          .eq('id', orderId)
        return {
          ok: true,
          carrier: 'GLS',
          trackingNumber: result.trackingNumber,
          labelUrl: labelUrlToStore,
          returnLabelUrl: result.returnLabelUrl ?? null,
          labelPdfBase64: !labelUrlToStore ? result.labelPdfBase64 : undefined,
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'GLS-Label fehlgeschlagen'
        return { ok: false, carrier: 'GLS', error: msg }
      }
    }

    case 'DPD':
    case 'Hermes':
    case 'UPS': {
      const links = await getCarrierLinks()
      const key = carrier.toLowerCase() as 'dpd' | 'hermes' | 'ups'
      const portalUrl = links[key]?.portal || ''
      return {
        ok: false,
        carrier,
        needPortal: true,
        portalUrl: portalUrl || undefined,
        message:
          carrier === 'DPD'
            ? 'DPD Labels werden derzeit nur per SOAP angeboten. Bitte erstellen Sie das Label im DPD Portal.'
            : carrier === 'Hermes'
              ? 'Bitte erstellen Sie das Label im Hermes Geschäftskunden-Portal.'
              : 'Bitte erstellen Sie das Label im UPS Portal. API-Integration kann bei Bedarf ergänzt werden.',
      }
    }

    default:
      return { ok: false, carrier, error: 'Unbekannter Carrier' }
  }
}
