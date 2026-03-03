/**
 * Heuristik im Retouren-Flow (Phase 11 optional).
 * Vorschlag Retourengrund anhand Bestellwert/Artikelanzahl;
 * optional: Empfehlung zur sofortigen Freigabe bei niedrigem Risiko.
 */

export type ReturnHeuristicResult = {
  /** Empfohlener Retourengrund (z. B. für Pre-Select in der UI). */
  suggested_reason: string | null
  /** Ob eine automatische Freigabe (ohne manuelle Prüfung) vertretbar erscheint – nur Hinweis für Admin. */
  auto_approve_reasonable: boolean
  /** Kurzbegründung (z. B. für Log). */
  note: string
}

/**
 * Order-Kontext für Heuristik (aus order + optional buyer_health).
 */
export type ReturnHeuristicInput = {
  order_total: number
  item_count: number
  /** Anteil Retouren/Claims an Bestellungen (0–1), falls bekannt. */
  concession_rate?: number
}

const LOW_VALUE_THRESHOLD = 50
const HIGH_VALUE_THRESHOLD = 200
const HIGH_RISK_CONCESSION_RATE = 0.2

/**
 * Heuristik: Vorschlag für Retourengrund und ob Auto-Approve vertretbar ist.
 */
export function getReturnHeuristic(input: ReturnHeuristicInput): ReturnHeuristicResult {
  const { order_total, item_count, concession_rate = 0 } = input

  if (order_total <= LOW_VALUE_THRESHOLD && item_count <= 1) {
    return {
      suggested_reason: 'sonstiges',
      auto_approve_reasonable: concession_rate < HIGH_RISK_CONCESSION_RATE,
      note: 'Niedriger Bestellwert, ein Artikel – typischerweise „nicht mehr gewollt“.',
    }
  }

  if (order_total >= HIGH_VALUE_THRESHOLD || item_count > 2) {
    return {
      suggested_reason: 'defekt',
      auto_approve_reasonable: false,
      note: 'Hoher Wert oder mehrere Artikel – Prüfung empfohlen, oft Defekt/Abweichung.',
    }
  }

  return {
    suggested_reason: null,
    auto_approve_reasonable: concession_rate < 0.1,
    note: 'Mittlerer Kontext – Grund manuell wählen, Auto-Approve nur bei niedriger Concession-Rate.',
  }
}
