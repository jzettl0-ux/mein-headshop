/**
 * Trade-In Quote: Berechnet den Angebotswert basierend auf Produkt und Zustandsfragen
 */

export interface TradeInConditionQuestion {
  key: string
  label: string
  options: { value: string; label: string; multiplier: number }[]
}

export const TRADE_IN_CONDITION_QUESTIONS: TradeInConditionQuestion[] = [
  {
    key: 'condition',
    label: 'Allgemeiner Zustand',
    options: [
      { value: 'like_new', label: 'Wie neu', multiplier: 1 },
      { value: 'good', label: 'Gut – leichte Gebrauchsspuren', multiplier: 0.75 },
      { value: 'fair', label: 'Akzeptabel – sichtbare Abnutzung', multiplier: 0.5 },
      { value: 'poor', label: 'Schlecht – starke Abnutzung', multiplier: 0.25 },
    ],
  },
  {
    key: 'functionality',
    label: 'Funktionalität',
    options: [
      { value: 'full', label: 'Voll funktionsfähig', multiplier: 1 },
      { value: 'minor_issues', label: 'Kleine Mängel', multiplier: 0.85 },
      { value: 'needs_repair', label: 'Reparatur nötig', multiplier: 0.5 },
    ],
  },
  {
    key: 'accessories',
    label: 'Zubehör',
    options: [
      { value: 'complete', label: 'Komplett mit Original-Zubehör', multiplier: 1 },
      { value: 'partial', label: 'Teilweise Zubehör', multiplier: 0.9 },
      { value: 'device_only', label: 'Nur Gerät', multiplier: 0.8 },
    ],
  },
]

const BASE_PERCENT_OF_NEW = 0.35 // 35 % des Neupreises als Basis

export function calculateTradeInQuote(
  productPrice: number,
  conditionAnswers: Record<string, string>
): number {
  let multiplier = BASE_PERCENT_OF_NEW
  for (const q of TRADE_IN_CONDITION_QUESTIONS) {
    const answer = conditionAnswers[q.key]
    const opt = q.options.find((o) => o.value === answer)
    if (opt) multiplier *= opt.multiplier
  }
  const value = Math.round(productPrice * multiplier * 100) / 100
  return Math.max(0, Math.min(value, productPrice * 0.8))
}
