/**
 * DHL Parcel DE Shipping API v2
 * https://developer.dhl.com/api-reference/parcel-de-shipping-post-parcel-germany-v2
 *
 * Erfordert: DHL_API_KEY, DHL_API_SECRET, DHL_GKP_USERNAME, DHL_GKP_PASSWORD,
 *            DHL_BILLING_NUMBER (14-stellig), DHL_SHIPPER_* (Absenderadresse)
 * Sandbox: DHL_SANDBOX=true, User "user-valid", Passwort "SandboxPasswort2023!"
 */

const SANDBOX_BASE = 'https://api-sandbox.dhl.com/parcel/de'
const PROD_BASE = 'https://api-eu.dhl.com/parcel/de'

export interface DhlShipperAddress {
  name1: string
  name2?: string
  addressStreet: string
  addressHouse: string
  postalCode: string
  city: string
  country: string // ISO 3166-1 alpha-3, z.B. "DEU"
}

export interface DhlConsigneeAddress {
  name1: string
  name2?: string
  addressStreet: string
  addressHouse: string
  postalCode: string
  city: string
  country: string // ISO 3166-1 alpha-3
  email?: string
  phone?: string
}

export interface DhlCreateOrderParams {
  shipper: DhlShipperAddress
  consignee: DhlConsigneeAddress
  weightInKg: number // 0.5 - 31.5 für DHL Paket
  billingNumber: string // 14 Zeichen: EKP + Produkt + Teilnahme
  product?: string // z.B. "V01PAK" (DHL Paket national)
  printFormat?: string // z.B. "910-300-700" oder "A4"
  /** IdentCheck/Alterssichtprüfung 18+ bei 18+ Produkten */
  visualCheckOfAge?: boolean
  shipmentRefNo?: string // Referenz, z.B. Bestellnummer
}

export interface DhlShipmentResult {
  shipmentNo: string
  labelUrl?: string
  returnLabelUrl?: string
  routingCode?: string
}

export interface DhlCreateOrderResponse {
  shipments?: Array<{
    shipmentNo?: string
    returnShipmentNo?: string
    label?: { url?: string }
    returnLabel?: { url?: string }
    routingCode?: string
  }>
  statusCode?: number
  validationMessages?: Array<{ validationMessage?: string; property?: string }>
}

async function getBaseUrl(): Promise<string> {
  const { getCarrierLinks } = await import('./shipping-settings')
  const links = await getCarrierLinks()
  const custom = links.dhl?.api_base_url?.trim()
  if (custom) return custom.replace(/\/$/, '')
  return process.env.DHL_SANDBOX === 'true' ? SANDBOX_BASE : PROD_BASE
}

/** In-Memory Token-Cache (Phase 2.1: Token-Management) – läuft bis Buffer vor Ablauf ab */
let dhlTokenCache: { token: string; expiresAt: number } | null = null
const TOKEN_BUFFER_SECONDS = 120 // 2 Min vor Ablauf neu holen

/** OAuth2 Token holen (Post & Parcel Germany Auth API). Gecacht bis Ablauf. Credentials aus Admin oder ENV. */
export async function getDhlAccessToken(): Promise<string> {
  const now = Date.now() / 1000
  if (dhlTokenCache && dhlTokenCache.expiresAt > now) {
    return dhlTokenCache.token
  }

  const { getDhlCredentials } = await import('./shipping-settings')
  const creds = await getDhlCredentials()

  const clientId = creds.api_key || process.env.DHL_API_KEY?.trim()
  const clientSecret = creds.api_secret || process.env.DHL_API_SECRET?.trim()
  const username = creds.gkp_username || (creds.sandbox ? 'user-valid' : process.env.DHL_GKP_USERNAME?.trim() || '')
  const password = creds.gkp_password || (creds.sandbox ? 'SandboxPasswort2023!' : process.env.DHL_GKP_PASSWORD?.trim() || '')

  if (!clientId || !clientSecret) {
    throw new Error('DHL_API_KEY und DHL_API_SECRET sind erforderlich')
  }
  if (!username || !password) {
    throw new Error('DHL_GKP_USERNAME und DHL_GKP_PASSWORD sind erforderlich')
  }

  const base = await getBaseUrl()
  const authUrl = `${base}/account/auth/ropc/v1/token`

  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const res = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    dhlTokenCache = null
    const text = await res.text()
    throw new Error(`DHL Auth fehlgeschlagen: ${res.status} ${text}`)
  }

  const data = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!data.access_token) {
    throw new Error('DHL Auth: Kein access_token in Antwort')
  }

  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600
  dhlTokenCache = {
    token: data.access_token,
    expiresAt: now + expiresIn - TOKEN_BUFFER_SECONDS,
  }
  return data.access_token
}

/** Cache invalidieren (z. B. nach Credential-Änderung) */
export function invalidateDhlTokenCache(): void {
  dhlTokenCache = null
}

/**
 * DHL Versandlabel erstellen (POST /shipping/v2/orders)
 * Bei has_adult_items: IdentCheck/VisualCheckOfAge wird hinzugefügt
 */
export async function createDhlShipment(params: DhlCreateOrderParams): Promise<DhlShipmentResult[]> {
  const token = await getDhlAccessToken()
  const base = await getBaseUrl()
  const url = `${base}/shipping/v2/orders?validate=true`

  const countryToAlpha3 = (c: string): string => {
    const s = (c || 'DEU').toUpperCase().trim()
    if (s === 'DE' || s === 'DEU' || s === 'GERMANY') return 'DEU'
    if (s === 'AT' || s === 'AUT' || s === 'AUSTRIA') return 'AUT'
    if (s === 'CH' || s === 'CHE' || s === 'SWITZERLAND') return 'CHE'
    return s.length === 3 ? s : 'DEU'
  }

  const shipperCountry = countryToAlpha3(params.shipper.country)
  const consigneeCountry = countryToAlpha3(params.consignee.country)

  const order: Record<string, unknown> = {
    product: params.product || 'V01PAK',
    billingNumber: params.billingNumber,
    refNo: params.shipmentRefNo || undefined,
    shipper: {
      name1: params.shipper.name1,
      ...(params.shipper.name2 && { name2: params.shipper.name2 }),
      address: {
        streetName: params.shipper.addressStreet,
        houseNo: params.shipper.addressHouse,
      },
      contactAddress: {
        streetName: params.shipper.addressStreet,
        houseNo: params.shipper.addressHouse,
        postalCode: params.shipper.postalCode,
        city: params.shipper.city,
        country: shipperCountry,
      },
    },
    consignee: {
      name1: params.consignee.name1,
      ...(params.consignee.name2 && { name2: params.consignee.name2 }),
      address: {
        streetName: params.consignee.addressStreet,
        houseNo: params.consignee.addressHouse,
      },
      contactAddress: {
        streetName: params.consignee.addressStreet,
        houseNo: params.consignee.addressHouse,
        postalCode: params.consignee.postalCode,
        city: params.consignee.city,
        country: consigneeCountry,
      },
      ...(params.consignee.email && { email: params.consignee.email }),
      ...(params.consignee.phone && { phone: params.consignee.phone }),
    },
    dimension: {
      uom: 'mm',
      length: 300,
      width: 200,
      height: 150,
    },
    weight: {
      uom: 'kg',
      value: Math.max(0.5, Math.min(31.5, params.weightInKg)),
    },
    ...(params.printFormat && { printFormat: params.printFormat }),
  }

  if (params.visualCheckOfAge) {
    ;(order as Record<string, unknown>).valueAddedServices = [
      { identCheck: { active: true, minimumAge: 18 } },
    ]
  }

  const payload = [order]

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = (await res.json()) as DhlCreateOrderResponse & { detail?: string }

  if (!res.ok) {
    const msg = data.validationMessages?.[0]?.validationMessage || data.detail || res.statusText
    throw new Error(`DHL Label fehlgeschlagen: ${msg}`)
  }

  const shipments = data.shipments || []
  return shipments.map((s) => ({
    shipmentNo: s.shipmentNo || '',
    labelUrl: s.label?.url,
    returnLabelUrl: s.returnLabel?.url,
    routingCode: s.routingCode,
  }))
}
