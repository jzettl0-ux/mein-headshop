/**
 * Vorgewählte Gründe für eine Rücksendeanfrage.
 * Der Grund ist optional.
 */
export const RETURN_REASONS = [
  { value: 'falscher_artikel', label: 'Falscher Artikel geliefert' },
  { value: 'defekt', label: 'Artikel defekt oder beschädigt' },
  { value: 'nicht_wie_erwartet', label: 'Nicht wie erwartet' },
  { value: 'doppelt_bestellt', label: 'Doppelt bestellt' },
  { value: 'groesse_passt_nicht', label: 'Größe / Maße passen nicht' },
  { value: 'sonstiges', label: 'Sonstiges' },
] as const

export type ReturnReasonValue = (typeof RETURN_REASONS)[number]['value']
