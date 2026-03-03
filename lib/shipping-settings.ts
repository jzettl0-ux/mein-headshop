/**
 * Versand-Einstellungen aus site_settings (Rücksendeadresse, Carrier-Links).
 * Wird von Admin-API und Label-Erstellung genutzt.
 */

import { createSupabaseAdmin, hasSupabaseAdmin } from './supabase-admin'
import { getCompanyInfo } from './company'

export interface ReturnAddress {
  name: string
  name2?: string
  street: string
  house_number: string
  postal_code: string
  city: string
  country: string
  email?: string
  phone?: string
}

export interface CarrierLinkConfig {
  portal?: string
  returns?: string
  tracking?: string
  /** URL für QR-Retouren (z.B. eigener Endpoint oder Carrier-URL). Platzhalter: {tracking}, {order_number} */
  qr_return_url?: string
  /** URL für Druck-Label. Platzhalter: {tracking}, {order_number}, {customer_name}, {street}, {postal_code}, {city} */
  return_print_url?: string
  /** URL für Webformular mit vorausgefüllten Daten. Platzhalter: {name}, {street}, {house_number}, {postal_code}, {city}, {return_name}, {return_street}, … */
  return_prefill_url?: string
  /** API-Basis-URL (Sandbox/Prod-Override), z.B. https://api-eu.dhl.com/parcel/de */
  api_base_url?: string
}

export type CarrierLinksConfig = Record<string, CarrierLinkConfig>

/** Einheitliche Credentials pro Carrier (alle fünf nutzen dieselbe Struktur) */
export interface CarrierCredentialEntry {
  api_key?: string
  api_secret?: string
  username?: string
  password?: string
  customer_number?: string
  sandbox?: boolean
}

/** DHL: Alias für Abwärtskompatibilität (gkp_username→username, billing_number→customer_number) */
export interface DhlCredentials extends CarrierCredentialEntry {
  gkp_username?: string
  gkp_password?: string
  billing_number?: string
}

/** Carrier-Credentials für alle fünf Versanddienstleister */
export interface CarrierCredentialsConfig {
  dhl?: CarrierCredentialEntry & { gkp_username?: string; gkp_password?: string; billing_number?: string }
  dpd?: CarrierCredentialEntry
  gls?: CarrierCredentialEntry
  hermes?: CarrierCredentialEntry
  ups?: CarrierCredentialEntry
}

export const CARRIER_IDS = ['dhl', 'dpd', 'gls', 'hermes', 'ups'] as const

const RETURN_ADDRESS_KEY = 'return_address'
const CARRIER_LINKS_KEY = 'carrier_portal_links'
const CARRIER_CREDENTIALS_KEY = 'carrier_credentials'

/** Normale Rückgabe-Adresse (für DHL shipper etc.) */
export function emptyReturnAddress(): ReturnAddress {
  const c = getCompanyInfo()
  const addrParts = (c.address || '').trim().split(/\s+/)
  const street = addrParts.length > 1 ? addrParts.slice(0, -1).join(' ') : c.address || 'Straße'
  const house_number = addrParts.length > 1 ? addrParts[addrParts.length - 1]! : '1'
  return {
    name: c.name,
    street,
    house_number,
    postal_code: c.postalCode,
    city: c.city,
    country: c.country,
    email: c.email,
    phone: c.phone,
  }
}

/**
 * Rücksendeadresse aus site_settings oder Fallback auf Firmenadresse (INVOICE_*).
 * Wird für DHL Shipper (Absender bei Hinversand, Ziel bei Retouren) verwendet.
 */
export async function getReturnAddress(): Promise<ReturnAddress> {
  if (!hasSupabaseAdmin()) return emptyReturnAddress()
  const admin = createSupabaseAdmin()
  const { data } = await admin.from('site_settings').select('value').eq('key', RETURN_ADDRESS_KEY).maybeSingle()
  const raw = data?.value
  if (!raw || typeof raw !== 'string') return emptyReturnAddress()
  try {
    const parsed = JSON.parse(raw) as Partial<ReturnAddress>
    if (parsed.name && parsed.street && parsed.postal_code && parsed.city) {
      return {
        name: parsed.name,
        name2: parsed.name2,
        street: parsed.street,
        house_number: parsed.house_number ?? parsed.street?.split(/\s+/).pop() ?? '1',
        postal_code: parsed.postal_code,
        city: parsed.city,
        country: parsed.country || 'Deutschland',
        email: parsed.email,
        phone: parsed.phone,
      }
    }
  } catch {
    /* ignore */
  }
  return emptyReturnAddress()
}

/** Synchrone Fallback-Adresse aus ENV (für Server-Context ohne DB-Zugriff). */
export function getReturnAddressFromEnv(): ReturnAddress {
  const name = process.env.DHL_SHIPPER_NAME || process.env.INVOICE_COMPANY_NAME || 'Absender'
  const streetRaw = process.env.DHL_SHIPPER_STREET || process.env.INVOICE_COMPANY_ADDRESS || 'Straße 1'
  const parts = streetRaw.trim().split(/\s+/)
  const street = process.env.DHL_SHIPPER_STREET || (parts.length > 1 ? parts.slice(0, -1).join(' ') : streetRaw)
  const house_number = process.env.DHL_SHIPPER_HOUSE_NUMBER || (parts.length > 1 ? parts[parts.length - 1]! : null) || '1'
  const country = process.env.DHL_SHIPPER_COUNTRY || process.env.INVOICE_COUNTRY || 'Deutschland'
  const countryCode = country === 'Deutschland' ? 'DEU' : country
  return {
    name,
    street,
    house_number,
    postal_code: process.env.DHL_SHIPPER_POSTAL_CODE || process.env.INVOICE_POSTAL_CODE || '00000',
    city: process.env.DHL_SHIPPER_CITY || process.env.INVOICE_CITY || 'Stadt',
    country: countryCode,
  }
}

/** Carrier-Credentials (API-Keys etc.) aus site_settings. Fallback auf ENV. */
export async function getCarrierCredentials(): Promise<CarrierCredentialsConfig> {
  if (!hasSupabaseAdmin()) return {}
  const admin = createSupabaseAdmin()
  const { data } = await admin.from('site_settings').select('value').eq('key', CARRIER_CREDENTIALS_KEY).maybeSingle()
  const raw = data?.value
  if (!raw || typeof raw !== 'string') return {}
  try {
    const parsed = JSON.parse(raw) as CarrierCredentialsConfig
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

/** DHL-Credentials: aus site_settings, sonst ENV. Nutzt username/password oder gkp_* */
export async function getDhlCredentials(): Promise<{
  api_key: string
  api_secret: string
  gkp_username: string
  gkp_password: string
  billing_number: string
  sandbox: boolean
}> {
  const creds = await getCarrierCredentials()
  const d = creds.dhl
  return {
    api_key: (d?.api_key?.trim() || process.env.DHL_API_KEY?.trim() || ''),
    api_secret: (d?.api_secret?.trim() || process.env.DHL_API_SECRET?.trim() || ''),
    gkp_username: (d?.gkp_username ?? d?.username)?.trim() || process.env.DHL_GKP_USERNAME?.trim() || '',
    gkp_password: (d?.gkp_password ?? d?.password)?.trim() || process.env.DHL_GKP_PASSWORD?.trim() || '',
    billing_number: (d?.billing_number ?? d?.customer_number)?.trim() || process.env.DHL_BILLING_NUMBER?.trim() || '',
    sandbox: d?.sandbox ?? process.env.DHL_SANDBOX === 'true',
  }
}

/** Credentials für einen beliebigen Carrier */
export async function getCarrierCredential(carrier: string): Promise<CarrierCredentialEntry> {
  const creds = await getCarrierCredentials()
  const c = creds[carrier as keyof CarrierCredentialsConfig]
  return c ?? {}
}

/** Tracking-URL aus Admin-Konfiguration (Carrier-Links). Fallback auf Defaults. */
export async function getTrackingUrlForCarrier(carrier: string, trackingNumber: string): Promise<string> {
  const { buildTrackingUrl } = await import('./tracking-urls')
  const links = await getCarrierLinks()
  const c = (carrier || 'dhl').toLowerCase()
  const cfg = links[c] ?? getDefaultCarrierLinks()[c]
  const template = cfg?.tracking?.trim()
  return buildTrackingUrl(template, carrier, trackingNumber)
}

/** Carrier-Portal-Links (DHL, DPD, GLS, Hermes, UPS) aus site_settings. */
export async function getCarrierLinks(): Promise<CarrierLinksConfig> {
  if (!hasSupabaseAdmin()) return getDefaultCarrierLinks()
  const admin = createSupabaseAdmin()
  const { data } = await admin.from('site_settings').select('value').eq('key', CARRIER_LINKS_KEY).maybeSingle()
  const raw = data?.value
  if (!raw || typeof raw !== 'string') return getDefaultCarrierLinks()
  try {
    const parsed = JSON.parse(raw) as CarrierLinksConfig
    return typeof parsed === 'object' && parsed !== null ? parsed : getDefaultCarrierLinks()
  } catch {
    return getDefaultCarrierLinks()
  }
}

export function getDefaultCarrierLinks(): CarrierLinksConfig {
  return {
    dhl: {
      portal: 'https://geschaeftskunden.dhl.de',
      returns: 'https://retoure.dhl.de',
      tracking: 'https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={tracking}',
      qr_return_url: '',
      return_print_url: '',
      return_prefill_url: '',
      api_base_url: '',
    },
    dpd: {
      portal: 'https://www.dpd.de/de',
      returns: 'https://retoure.dpd.de',
      tracking: 'https://tracking.dpd.de/status/de_DE/parcel/{tracking}',
      qr_return_url: '',
      return_print_url: '',
      return_prefill_url: '',
      api_base_url: '',
    },
    gls: {
      portal: 'https://gls-group.eu/DE/de/geschaeftskunden',
      returns: 'https://gls-group.eu/DE/de/retoure',
      tracking: 'https://gls-group.eu/DE/de/paketverfolgung?match={tracking}',
      qr_return_url: '',
      return_print_url: '',
      return_prefill_url: '',
      api_base_url: '',
    },
    hermes: {
      portal: 'https://www.hermesworld.com/de',
      returns: 'https://www.hermes-europe.de/de/retoure',
      tracking: 'https://www.hermes-europe.de/de/tracking/?trackingNo={tracking}',
      qr_return_url: '',
      return_print_url: '',
      return_prefill_url: '',
      api_base_url: '',
    },
    ups: {
      portal: 'https://www.ups.com/de/de/Home.page',
      returns: 'https://www.ups.com/de/de/returns.page',
      tracking: 'https://www.ups.com/track?tracknum={tracking}',
      qr_return_url: '',
      return_print_url: '',
      return_prefill_url: '',
      api_base_url: '',
    },
  }
}
