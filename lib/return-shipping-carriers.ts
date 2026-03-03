/**
 * Versanddienstleister für Rücksendungen (Admin wählt fest oder Kundenwahl mit Preisen).
 * supports_qr: true = QR-Code (druckerlose Retoure) möglich, false = nur gedruckter Retourencode.
 */
export const RETURN_SHIPPING_CARRIERS = [
  { value: 'dhl', label: 'DHL', supports_qr: true },
  { value: 'dpd', label: 'DPD', supports_qr: false },
  { value: 'gls', label: 'GLS', supports_qr: false },
  { value: 'hermes', label: 'Hermes', supports_qr: false },
  { value: 'ups', label: 'UPS', supports_qr: false },
] as const

export type ReturnCarrierValue = (typeof RETURN_SHIPPING_CARRIERS)[number]['value']

export interface ReturnShippingOption {
  carrier: string
  label: string
  price_cents: number
}

export function getCarrierLabel(carrier: string): string {
  return RETURN_SHIPPING_CARRIERS.find((c) => c.value === carrier)?.label ?? carrier
}

/** Ob der Versanddienstleister QR-Code (druckerlose Retoure) unterstützt. Nur DHL bietet das in DE. */
export function carrierSupportsQr(carrier: string): boolean {
  return RETURN_SHIPPING_CARRIERS.find((c) => c.value === carrier)?.supports_qr ?? false
}

export function formatReturnOptionPrice(priceCents: number): string {
  return (priceCents / 100).toFixed(2).replace('.', ',') + ' €'
}
