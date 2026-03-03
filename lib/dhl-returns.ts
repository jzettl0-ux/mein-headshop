/**
 * Phase 10.3: DHL Parcel DE Returns API
 * https://developer.dhl.com/api-reference/dhl-parcel-de-returns-post-parcel-germany
 * Druckerlose QR-Retouren: Kunde zeigt QR-Code bei DHL/Paketshop, Label wird vor Ort gedruckt.
 */

import { getDhlAccessToken } from './dhl-parcel'

const SANDBOX_BASE = 'https://api-sandbox.dhl.com/parcel/de/shipping/returns/v1'
const PROD_BASE = 'https://api-eu.dhl.com/parcel/de/shipping/returns/v1'

export type DhlReturnLabelType = 'QR_LABEL' | 'SHIPMENT_LABEL' | 'BOTH'

export interface DhlReturnShipper {
  name1: string
  name2?: string
  name3?: string
  addressStreet: string
  addressHouse: string
  postalCode: string
  city: string
  state?: string
  email?: string
  phone?: string
}

export interface DhlCreateReturnParams {
  receiverId: string
  shipper: DhlReturnShipper
  labelType?: DhlReturnLabelType
  customerReference?: string
  shipmentReference?: string
  itemWeight?: { uom: string; value: number }
  itemValue?: { currency: string; value: number }
}

export interface DhlCreateReturnResult {
  shipmentNo: string
  retNumber: string
  qrLabelBase64: string | null
  pdfLabelBase64: string | null
}

async function getReturnsBaseUrl(): Promise<string> {
  const { getCarrierLinks, getDhlCredentials } = await import('./shipping-settings')
  const links = await getCarrierLinks()
  const creds = await getDhlCredentials()
  const custom = links.dhl?.api_base_url?.trim()
  if (custom) {
    const base = custom.replace(/\/$/, '')
    return `${base}/shipping/returns/v1`
  }
  return creds.sandbox || process.env.DHL_SANDBOX === 'true' ? SANDBOX_BASE : PROD_BASE
}

/**
 * DHL Retourenlabel erstellen (QR-Code für druckerlose Retoure).
 * receiverId: "deu" für Deutschland, "aut" für Österreich usw.
 */
export async function createDhlReturnLabel(params: DhlCreateReturnParams): Promise<DhlCreateReturnResult> {
  const token = await getDhlAccessToken()
  const labelType = params.labelType ?? 'QR_LABEL'
  const baseUrl = await getReturnsBaseUrl()
  const url = `${baseUrl}/orders?labelType=${labelType}`

  const body: Record<string, unknown> = {
    receiverId: params.receiverId,
    shipper: {
      name1: params.shipper.name1,
      addressStreet: params.shipper.addressStreet,
      addressHouse: params.shipper.addressHouse,
      postalCode: params.shipper.postalCode,
      city: params.shipper.city,
      ...(params.shipper.name2 && { name2: params.shipper.name2 }),
      ...(params.shipper.name3 && { name3: params.shipper.name3 }),
      ...(params.shipper.state && { state: params.shipper.state }),
      ...(params.shipper.email && { email: params.shipper.email }),
      ...(params.shipper.phone && { phone: params.shipper.phone }),
    },
    ...(params.customerReference && { customerReference: params.customerReference }),
    ...(params.shipmentReference && { shipmentReference: params.shipmentReference }),
    ...(params.itemWeight && { itemWeight: params.itemWeight }),
    ...(params.itemValue && { itemValue: params.itemValue }),
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = (await res.json()) as {
    items?: Array<{
      shipNo?: string
      label?: { b64?: string }
      qrLabel?: { b64?: string }
    }>
    statusCode?: number
    validationMessages?: Array<{ validationMessage?: string }>
  }

  if (!res.ok) {
    const msg = data.validationMessages?.[0]?.validationMessage ?? data.statusCode ?? res.statusText
    throw new Error(`DHL Returns fehlgeschlagen: ${msg}`)
  }

  const item = data.items?.[0]
  if (!item?.shipNo) {
    throw new Error('DHL Returns: Keine Retoure in Antwort')
  }

  const retNumber = item.shipNo.startsWith('RET') ? item.shipNo : `RET${item.shipNo}`

  return {
    shipmentNo: item.shipNo,
    retNumber,
    qrLabelBase64: item.qrLabel?.b64 ?? null,
    pdfLabelBase64: item.label?.b64 ?? null,
  }
}
