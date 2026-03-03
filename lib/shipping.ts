/**
 * Zentrale Texte für Lieferzeiten – eine Quelle für Cart, Checkout, Produktseite.
 * NEXT_PUBLIC_* für Client-Komponenten; DELIVERY_ESTIMATE_DAYS für Server.
 */
const DEFAULT_ESTIMATE = '2–4 Werktage'

export function getDeliveryEstimateText(): string {
  return (
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_DELIVERY_ESTIMATE_DAYS) ||
    (typeof process !== 'undefined' && process.env?.DELIVERY_ESTIMATE_DAYS) ||
    DEFAULT_ESTIMATE
  )
}

/** Kurztext z. B. „Lieferung in 2–4 Werktagen“ */
export function getDeliveryShortLabel(): string {
  return `Lieferung in ${getDeliveryEstimateText()}`
}
