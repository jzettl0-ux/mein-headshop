/**
 * Phase 9.5: KCanG §6 – Kein verherrlichendes Cannabis-Targeting
 * Prüft Keywords/Target-Werte auf Begriffe, die als verherrlichend gelten könnten.
 * Neutral: Produktbezeichnungen (Grinder, Bong, Vaporizer). Verboten: AIDA-Trigger, Konsum-Promotion.
 */

const GLORIFYING_TERMS = [
  'kiffen',
  'kiff',
  'high werden',
  'stoned',
  'high sein',
  'gras rauchen',
  'joint drehen',
  'dope',
  'legal high',
  'trip',
  'high leben',
  'cannabis lifestyle',
  '420 party',
  'kiffer',
  'stoner',
]

/**
 * Prüft ob target_value (Keyword/ASIN-Beschreibung) gegen KCanG §6 verstößt.
 * @returns { blocked: boolean, matchedTerm?: string }
 */
export function checkKcanAdvertising(value: string): { blocked: boolean; matchedTerm?: string } {
  const normalized = value.toLowerCase().trim()
  if (!normalized) return { blocked: false }

  for (const term of GLORIFYING_TERMS) {
    if (normalized.includes(term)) {
      return { blocked: true, matchedTerm: term }
    }
  }

  return { blocked: false }
}
