/**
 * Vorgewählte Gründe für eine Stornierungsanfrage.
 * Der Grund ist optional – Kunden können auch ohne Angabe anfragen.
 */
export const CANCELLATION_REASONS = [
  { value: 'falsch_bestellt', label: 'Falsch bestellt' },
  { value: 'doppelt_bestellt', label: 'Doppelt bestellt' },
  { value: 'zu_lange_lieferzeit', label: 'Lieferzeit zu lang' },
  { value: 'preis', label: 'Preis / woanders günstiger gefunden' },
  { value: 'anderes_produkt', label: 'Anderes Produkt gefunden' },
  { value: 'sonstiges', label: 'Sonstiges' },
] as const

export type CancellationReasonValue = (typeof CANCELLATION_REASONS)[number]['value']
