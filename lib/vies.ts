/**
 * VIES (VAT Information Exchange System) – EU USt-IdNr.-Validierung
 * Nutzt den offiziellen SOAP-Service der EU-Kommission.
 */

const VIES_WSDL = 'https://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl'

const EU_COUNTRY_CODES = [
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 'FI', 'FR',
  'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO',
  'SE', 'SI', 'SK',
]

export interface ViesResult {
  valid: boolean
  countryCode?: string
  vatNumber?: string
  name?: string
  address?: string
  error?: string
}

/**
 * Parst USt-IdNr. in countryCode + vatNumber.
 * Akzeptiert: "DE123456789", "DE 123456789", "123456789" (DE angenommen)
 */
function parseVatId(input: string): { countryCode: string; vatNumber: string } | null {
  const cleaned = input.replace(/\s/g, '').toUpperCase()
  if (!cleaned || cleaned.length < 3) return null

  const match = cleaned.match(/^([A-Z]{2})\s*(\d[\dA-Z]*)$/)
  if (match) {
    const [, cc, num] = match
    if (EU_COUNTRY_CODES.includes(cc!)) return { countryCode: cc!, vatNumber: num! }
  }

  if (/^\d+[A-Z]?$/.test(cleaned)) {
    return { countryCode: 'DE', vatNumber: cleaned }
  }

  return null
}

/**
 * Validiert USt-IdNr. über VIES.
 */
export async function validateVatId(vatId: string): Promise<ViesResult> {
  const parsed = parseVatId(vatId)
  if (!parsed) {
    return { valid: false, error: 'Ungültiges Format. Beispiel: DE123456789' }
  }

  try {
    const soap = await import('soap')
    const client = await soap.createClientAsync(VIES_WSDL)
    const [result] = await client.checkVatAsync(parsed)

    if (!result || typeof result !== 'object') {
      return { valid: false, error: 'Keine Antwort von VIES' }
    }

    const valid = result.valid === true || result.valid === 'true'
    return {
      valid,
      countryCode: result.countryCode ?? parsed.countryCode,
      vatNumber: result.vatNumber ?? parsed.vatNumber,
      name: result.name ? String(result.name).trim() || undefined : undefined,
      address: result.address ? String(result.address).trim() || undefined : undefined,
      error: valid ? undefined : (result.valid ? undefined : 'USt-IdNr. nicht in VIES gefunden'),
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('INVALID_INPUT') || msg.includes('invalid')) {
      return { valid: false, error: 'Ungültige USt-IdNr.' }
    }
    if (msg.includes('GLOBAL_MAX') || msg.includes('MS_UNAVAILABLE') || msg.includes('TIMEOUT')) {
      return { valid: false, error: 'VIES-Dienst vorübergehend nicht erreichbar. Bitte später erneut versuchen.' }
    }
    console.error('[VIES]', e)
    return { valid: false, error: 'Validierung fehlgeschlagen' }
  }
}
