/**
 * Tracking-URLs für DHL, DPD, GLS, Hermes, UPS (Sendungsverfolgung).
 * Eigenes Modul, damit Seiten wie /account/orders nicht das Resend/E-Mail-Modul laden müssen.
 * Admin kann URLs unter Carrier-Portale & Links anpassen – serverseitig nutzt getTrackingUrlForCarrier().
 */

const DEFAULT_TRACKING_URLS: Record<string, string> = {
  dhl: 'https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={tracking}',
  dpd: 'https://tracking.dpd.de/status/de_DE/parcel/{tracking}',
  gls: 'https://gls-group.eu/DE/de/paketverfolgung?match={tracking}',
  hermes: 'https://www.hermes-europe.de/de/tracking/?trackingNo={tracking}',
  ups: 'https://www.ups.com/track?tracknum={tracking}',
}

/** Baut URL aus Template (Platzhalter {tracking}) oder nutzt Carrier-Defaults. */
export function buildTrackingUrl(template: string | undefined, carrier: string, trackingNumber: string): string {
  const num = encodeURIComponent((trackingNumber || '').trim())
  const t = (template || '').trim()
  if (t && t.includes('{tracking}')) return t.replace(/\{tracking\}/g, num)
  const c = (carrier || 'dhl').toLowerCase()
  const def = DEFAULT_TRACKING_URLS[c] || DEFAULT_TRACKING_URLS.dhl
  return def.replace(/\{tracking\}/g, num)
}

/** Synchron – für Client-Components. Nutzt Default-URLs (ohne Admin-Konfiguration). */
export function getTrackingUrl(carrier: string, trackingNumber: string): string {
  return buildTrackingUrl(undefined, carrier, trackingNumber)
}
