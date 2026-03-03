/**
 * Phase 7.4: OSS & Deemed-Seller EU-VAT
 * EU-MwSt-Sätze, Bestimmungsland, Plattformfiktion (Deemed Seller Rule).
 */

/** EU-Länder (ISO 3166-1 alpha-2) – OSS-relevant */
export const EU_COUNTRY_CODES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
] as const

/** MwSt-Sätze pro EU-Land (Stand 2024, Normal-Satz) – für OSS-Berechnung */
export const EU_VAT_RATES: Record<string, number> = {
  AT: 20, BE: 21, BG: 20, HR: 25, CY: 19, CZ: 21, DK: 25, EE: 22, FI: 26, FR: 20,
  DE: 19, GR: 24, HU: 27, IE: 23, IT: 22, LV: 21, LT: 21, LU: 17, MT: 18, NL: 21,
  PL: 23, PT: 23, RO: 19, SK: 20, SI: 22, ES: 21, SE: 25,
}

const SELLER_COUNTRY = (process.env.INVOICE_COUNTRY || 'Deutschland').slice(0, 2).toUpperCase() || 'DE'
const DEEMED_THRESHOLD_EUR = 150

/**
 * Liefert das Bestimmungsland (ISO 2) aus shipping_address.
 */
export function getDestinationCountryCode(
  shippingAddress: { country?: string } | null | undefined
): string {
  if (!shippingAddress?.country) return 'DE'
  const c = String(shippingAddress.country).trim()
  if (c.toUpperCase() === 'DEUTSCHLAND' || c === 'DE') return 'DE'
  if (c.length === 2) return c.toUpperCase()
  const map: Record<string, string> = {
    Österreich: 'AT', Belgium: 'BE', Bulgaria: 'BG', Croatia: 'HR', Cyprus: 'CY',
    Czechia: 'CZ', Denmark: 'DK', Estonia: 'EE', Finland: 'FI', France: 'FR',
    Germany: 'DE', Greece: 'GR', Hungary: 'HU', Ireland: 'IE', Italy: 'IT',
    Latvia: 'LV', Lithuania: 'LT', Luxembourg: 'LU', Malta: 'MT', Netherlands: 'NL',
    Poland: 'PL', Portugal: 'PT', Romania: 'RO', Slovakia: 'SK', Slovenia: 'SI',
    Spain: 'ES', Sweden: 'SE',
  }
  return map[c] || c.slice(0, 2).toUpperCase() || 'DE'
}

/**
 * Prüft, ob die Plattformfiktion (Deemed Seller) greift.
 * Vereinfacht: B2C-Lieferung in anderes EU-Land, Käufer ohne gültige EU-USt-IdNr.
 * (Vollständige Logik erfordert Kenntnis: Versand aus Drittland <150€, Verkäufer außerhalb EU, etc.)
 */
export function isDeemedSupplierApplicable(params: {
  destinationCountry: string
  orderTotal: number
  buyerVatId: string | null | undefined
  sellerCountry?: string
}): boolean {
  const dest = params.destinationCountry.slice(0, 2).toUpperCase()
  const seller = (params.sellerCountry || SELLER_COUNTRY).slice(0, 2).toUpperCase()

  if (!EU_COUNTRY_CODES.includes(dest as (typeof EU_COUNTRY_CODES)[number])) return false
  if (dest === seller) return false

  const hasValidEuVat = !!params.buyerVatId?.trim() && params.buyerVatId.match(/^[A-Z]{2}/)
  if (hasValidEuVat) return false

  return true
}

/**
 * MwSt-Satz für ein EU-Land (in %).
 */
export function getVatRateForCountry(countryCode: string): number {
  const cc = countryCode.slice(0, 2).toUpperCase()
  return EU_VAT_RATES[cc] ?? 19
}
