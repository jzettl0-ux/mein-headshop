/**
 * GLS ShipIT REST API – Versandlabel erstellen.
 * Dokumentation: https://shipit.gls-group.eu/webservices/ (REST API).
 * Credentials: Admin → Versand → GLS (username, password, customer_number als Shipper ContactID).
 * Optional: GLS_SHIPIT_URL in ENV oder carrier_credentials.gls.api_base_url.
 */

import { getCarrierCredential } from './shipping-settings'

const DEFAULT_GLS_BASE = 'https://shipit.gls-group.eu'

export interface GlsConsignee {
  name1: string
  street: string
  houseNumber?: string
  postalCode: string
  city: string
  countryCode: string
  email?: string
  phone?: string
}

export interface CreateGlsShipmentParams {
  orderId: string
  orderNumber?: string
  consignee: GlsConsignee
  weightKg: number
}

export interface CreateGlsShipmentResult {
  trackingNumber?: string
  labelUrl?: string | null
  returnLabelUrl?: string | null
  labelPdfBase64?: string
  error?: string
}

/**
 * Einzelne Sendung bei GLS ShipIT anlegen.
 * Lieferadresse wird automatisch aus consignee übernommen.
 */
export async function createGlsShipment(params: CreateGlsShipmentParams): Promise<CreateGlsShipmentResult> {
  const creds = await getCarrierCredential('gls')
  const username = (creds.username ?? creds.api_key ?? process.env.GLS_SHIPIT_USERNAME)?.trim()
  const password = (creds.password ?? creds.api_secret ?? process.env.GLS_SHIPIT_PASSWORD)?.trim()
  const contactId = (creds.customer_number ?? process.env.GLS_SHIPIT_CONTACT_ID)?.trim()

  if (!username || !password) {
    throw new Error('GLS ShipIT: username und password fehlen. Bitte in Admin → Versand → GLS eintragen.')
  }
  if (!contactId) {
    throw new Error('GLS ShipIT: customer_number (Shipper ContactID) fehlt. Bitte in Admin → Versand → GLS eintragen.')
  }

  const { getCarrierLinks } = await import('./shipping-settings')
  const links = await getCarrierLinks()
  const baseUrl = (process.env.GLS_SHIPIT_URL || links.gls?.api_base_url)?.trim() || DEFAULT_GLS_BASE
  const base = baseUrl.replace(/\/$/, '')
  const auth = Buffer.from(`${username}:${password}`).toString('base64')

  const c = params.consignee
  const name1 = (c.name1 || '').slice(0, 40)
  const street = (c.street || '').trim()
  const houseNo = (c.houseNumber || '').trim()
  const fullStreet = houseNo ? `${street} ${houseNo}`.trim() : street

  const body = {
    Shipment: {
      ShipmentReference: [params.orderNumber || params.orderId].filter(Boolean),
      Product: 'PARCEL',
      Consignee: {
        ConsigneeID: contactId,
        Address: {
          Name1: name1,
          Name2: '',
          Name3: '',
          CountryCode: (c.countryCode || 'DE').toUpperCase().slice(0, 2),
          ZIPCode: (c.postalCode || '').slice(0, 10),
          City: (c.city || '').slice(0, 40),
          Street: fullStreet.slice(0, 40),
          eMail: (c.email || '').slice(0, 80),
          ContactPerson: name1,
          MobilePhoneNumber: (c.phone || '').replace(/\D/g, '').slice(0, 20) || undefined,
          FixedLinePhonenumber: (c.phone || '').replace(/\D/g, '').slice(0, 20) || undefined,
        },
      },
      Shipper: {
        ContactID: contactId,
      },
      ShipmentUnit: [
        { Weight: Math.max(1, Math.min(31, Math.round(params.weightKg * 1000) / 1000)) },
      ],
    },
    PrintingOptions: {
      ReturnLabels: { TemplateSet: 'NONE', LabelFormat: 'PDF' },
      LabelFormat: 'PDF',
    },
  }

  const res = await fetch(`${base}/rest/shipments`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/glsVersion1+json',
      Accept: 'application/glsVersion1+json, application/json',
    },
    body: JSON.stringify(body),
  })

  const data = (await res.json().catch(() => ({}))) as {
    ShipmentResponse?: Array<{
      ParcelInformation?: Array<{ ParcelNumber?: string; TrackingNumber?: string }>
      LabelData?: Array<{ Label: string }>
    }>
    Fault?: { FaultMessage?: string; FaultCode?: string }
  }

  if (!res.ok) {
    const msg = data.Fault?.FaultMessage || (data as { error?: string }).error || res.statusText
    throw new Error(`GLS ShipIT: ${msg}`)
  }

  const firstResponse = data.ShipmentResponse?.[0]
  const parcelInfo = firstResponse?.ParcelInformation?.[0]
  const trackingNumber = parcelInfo?.TrackingNumber || parcelInfo?.ParcelNumber
  const labelPdfBase64 = firstResponse?.LabelData?.[0]?.Label

  return {
    trackingNumber: trackingNumber || undefined,
    labelUrl: null,
    labelPdfBase64: typeof labelPdfBase64 === 'string' ? labelPdfBase64 : undefined,
  }
}
